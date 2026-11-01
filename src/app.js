// Nashr server: dashboard API, public images for Instagram, and the publishing scheduler.
import http from 'node:http';
import crypto from 'node:crypto';
import { Store, newBrand } from './store.js';
import { writePlan, rewritePost, nextSlots } from './planner.js';
import { publishPost, PLATFORMS } from './publish.js';
import { syncBrandCatalog } from './catalog.js';
import { CLAUDE_MODELS, AIError } from './ai.js';
import { hashPassword, verifyPassword, createSession, checkSession, parseCookies, RateLimiter } from './auth.js';
import { send, readJson, clientIp, originOf, serveStatic, sendFile, cookie, VERSION } from './http.js';

const MASK = '••••••';
const IMAGE_TYPES = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };

function sniff(buf) {
  if (buf[0] === 0xff && buf[1] === 0xd8) return 'image/jpeg';
  if (buf[0] === 0x89 && buf[1] === 0x50) return 'image/png';
  if (buf.slice(0, 4).toString() === 'RIFF' && buf.slice(8, 12).toString() === 'WEBP') return 'image/webp';
  return null;
}

export function createApp({ dataDir, setupToken = process.env.SETUP_TOKEN || '', env = process.env } = {}) {
  const store = new Store(dataDir);
  if (!store.data.admin) {
    const ai = store.data.settings.ai;
    if (env.AI_PROVIDER === 'openai' || env.AI_PROVIDER === 'anthropic') ai.provider = env.AI_PROVIDER;
    if (env.AI_MODEL) ai.model = env.AI_MODEL;
    if (env.AI_BASE_URL) ai.baseUrl = env.AI_BASE_URL;
    if (env.AI_API_KEY) ai.apiKey = env.AI_API_KEY;
  }
  const loginLimiter = new RateLimiter(10, 15 * 60_000);
  const tz = () => store.data.settings.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';

  const hashFor = (uid) => (uid === 'owner' ? store.data.admin?.hash : null);
  const isAuthed = (req) => Boolean(checkSession(store.data.meta.secret, parseCookies(req.headers.cookie).nashr_session, hashFor));
  const newSession = (req) => cookie(req, 'nashr_session', createSession(store.data.meta.secret, store.data.admin.hash), 30 * 86400);

  const masked = (b) => {
    const c = structuredClone(b);
    for (const [ch, key] of [['facebook', 'pageToken'], ['instagram', 'token'], ['telegram', 'botToken']]) if (c.channels[ch][key]) c.channels[ch][key] = MASK + c.channels[ch][key].slice(-4);
    c.catalog = { ...c.catalog, products: undefined, count: b.catalog.products.length };
    return c;
  };
  function mergeKeep(target, incoming) {
    for (const [k, v] of Object.entries(incoming || {})) {
      if (!(k in target)) continue;
      if (v && typeof v === 'object' && !Array.isArray(v) && target[k] && typeof target[k] === 'object' && !Array.isArray(target[k])) mergeKeep(target[k], v);
      else if (typeof v === 'string' && v.startsWith(MASK)) continue;
      else if (Array.isArray(target[k]) && Array.isArray(v)) target[k] = v;
      else if (typeof target[k] === typeof v || target[k] === null) target[k] = typeof v === 'string' ? v.trim() : v;
    }
  }
  const postView = (p) => ({ ...p, imageUrl: p.image ? `media/public/${p.image}` : '' });

  async function notify(event, post, brand) {
    const url = store.data.settings.webhookUrl;
    if (!url) return;
    await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ event, brand: brand?.name, post: { id: post.id, text: post.text, scheduledAt: post.scheduledAt, results: post.results }, at: new Date().toISOString() }),
      signal: AbortSignal.timeout(8000),
    }).catch(() => {});
  }

  // ---------- scheduler ----------
  let running = false;
  async function publishDue(now = Date.now()) {
    if (running) return;
    running = true;
    try {
      for (const post of store.data.posts) {
        if (post.status !== 'scheduled' || !post.scheduledAt || Date.parse(post.scheduledAt) > now) continue;
        await publishOne(post);
      }
    } finally {
      running = false;
    }
  }
  async function publishOne(post) {
    const brand = store.brand(post.brandId);
    if (!brand) {
      post.status = 'failed';
      post.error = 'Brand was deleted';
      return post;
    }
    post.status = 'publishing';
    const { results, ok } = await publishPost(store, post, brand);
    post.results = results;
    post.status = ok ? 'published' : 'failed';
    post.publishedAt = ok ? new Date().toISOString() : post.publishedAt;
    post.error = ok ? null : Object.entries(results).filter(([, r]) => r.error).map(([p, r]) => `${p}: ${r.error}`).join(' · ');
    store.save();
    notify(ok ? 'published' : 'failed', post, brand);
    return post;
  }

  // ---------- routes ----------
  async function route(req, res) {
    const url = new URL(req.url, 'http://localhost');
    const p = url.pathname;
    const method = req.method;
    let m;

    if (p === '/health') return send(res, 200, { ok: true, version: VERSION });
    if ((m = p.match(/^\/media\/public\/([\w-]+\.(jpg|png|webp))$/)) && method === 'GET') {
      // Instagram downloads post images from here, so they are public once attached to a post.
      if (!store.data.posts.some((x) => x.image === m[1])) return send(res, 404, 'Not found');
      return sendFile(res, store.mediaPath(m[1]), { 'cache-control': 'public, max-age=86400' });
    }

    if (p === '/api/session' && method === 'GET') {
      const authed = isAuthed(req);
      if (authed && store.data.meta.publicUrl !== originOf(req)) {
        store.data.meta.publicUrl = originOf(req);
        store.save();
      }
      return send(res, 200, { needsSetup: !store.data.admin, authed, setupTokenRequired: Boolean(setupToken), version: VERSION, timezone: tz() });
    }
    if (p === '/api/setup' && method === 'POST') {
      if (store.data.admin) return send(res, 409, { error: 'Already set up' });
      const body = await readJson(req);
      if (setupToken && body.setupToken !== setupToken) return send(res, 403, { error: 'Wrong setup token' });
      if (String(body.password || '').length < 8) return send(res, 400, { error: 'Password must be at least 8 characters' });
      store.data.admin = hashPassword(String(body.password));
      store.data.meta.publicUrl = originOf(req);
      if (body.timezone) store.data.settings.timezone = String(body.timezone);
      if (body.brandName) store.data.brands.push(newBrand({ name: String(body.brandName).slice(0, 80), dialect: body.lang === 'en' ? 'english' : 'egyptian' }));
      store.flush();
      return send(res, 200, { ok: true }, { 'set-cookie': newSession(req) });
    }
    if (p === '/api/login' && method === 'POST') {
      if (!loginLimiter.allow(clientIp(req))) return send(res, 429, { error: 'Too many attempts. Try again in 15 minutes.' });
      const body = await readJson(req);
      if (!verifyPassword(String(body.password || ''), store.data.admin)) return send(res, 401, { error: 'Wrong password' });
      return send(res, 200, { ok: true }, { 'set-cookie': newSession(req) });
    }
    if (p === '/api/logout' && method === 'POST') return send(res, 200, { ok: true }, { 'set-cookie': cookie(req, 'nashr_session', '', 0) });

    if (p.startsWith('/api/')) {
      if (!isAuthed(req)) return send(res, 401, { error: 'Not signed in' });
      if (method !== 'GET' && !(req.headers['content-type'] || '').includes('application/json')) return send(res, 415, { error: 'Send JSON' });
      return api(req, res, url, p, method);
    }

    if (method === 'GET') {
      if (p === '/' || p === '/index.html') return serveStatic(res, 'index.html');
      if (/^\/[\w.-]+\.(js|css|svg|png|ico)$/.test(p)) return serveStatic(res, p.slice(1));
    }
    return send(res, 404, 'Not found');
  }

  async function api(req, res, url, p, method) {
    const d = store.data;
    let m;

    if (p === '/api/overview' && method === 'GET') {
      const now = Date.now();
      const week = now - 7 * 864e5;
      const upcoming = d.posts.filter((x) => x.status === 'scheduled' && Date.parse(x.scheduledAt) >= now).sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt));
      return send(res, 200, {
        brands: d.brands.length,
        drafts: d.posts.filter((x) => x.status === 'draft').length,
        scheduled: upcoming.length,
        published7d: d.posts.filter((x) => x.status === 'published' && Date.parse(x.publishedAt) >= week).length,
        failed: d.posts.filter((x) => x.status === 'failed').length,
        next: upcoming.slice(0, 5).map(postView),
        aiReady: d.settings.ai.provider === 'openai' ? Boolean(d.settings.ai.model) : Boolean(d.settings.ai.apiKey || env.ANTHROPIC_API_KEY),
        connected: d.brands.some((b) => PLATFORMS.some((x) => b.channels[x].enabled)),
      });
    }

    // ----- brands -----
    if (p === '/api/brands' && method === 'GET') return send(res, 200, { brands: d.brands.map(masked) });
    if (p === '/api/brands' && method === 'POST') {
      const body = await readJson(req);
      const b = newBrand({ name: String(body.name || 'My brand').slice(0, 80) });
      d.brands.push(b);
      store.save();
      return send(res, 200, { brand: masked(b) });
    }
    if ((m = p.match(/^\/api\/brands\/([\w-]+)$/))) {
      const b = store.brand(m[1]);
      if (!b) return send(res, 404, { error: 'Brand not found' });
      if (method === 'PUT') {
        const body = await readJson(req);
        const beforeCatalog = JSON.stringify([b.catalog.source, b.catalog.url]);
        const { catalog, ...rest } = body.brand || {};
        mergeKeep(b, rest);
        if (catalog) mergeKeep(b.catalog, { source: catalog.source, url: catalog.url });
        b.schedule.times = (b.schedule.times || []).filter((t) => /^\d{1,2}:\d{2}$/.test(t));
        store.save();
        if (JSON.stringify([b.catalog.source, b.catalog.url]) !== beforeCatalog) {
          await syncBrandCatalog(b);
          store.save();
        }
        return send(res, 200, { brand: masked(b) });
      }
      if (method === 'DELETE') {
        d.brands = d.brands.filter((x) => x.id !== b.id);
        d.posts = d.posts.filter((x) => x.brandId !== b.id || x.status === 'published');
        store.save();
        return send(res, 200, { ok: true });
      }
    }
    if ((m = p.match(/^\/api\/brands\/([\w-]+)\/sync$/)) && method === 'POST') {
      const b = store.brand(m[1]);
      if (!b) return send(res, 404, { error: 'Brand not found' });
      await syncBrandCatalog(b);
      store.save();
      return send(res, 200, { count: b.catalog.products.length, syncedAt: b.catalog.syncedAt, error: b.catalog.error });
    }
    if ((m = p.match(/^\/api\/brands\/([\w-]+)\/test$/)) && method === 'POST') {
      // Sends a real test post to one platform, to check the connection.
      const b = store.brand(m[1]);
      if (!b) return send(res, 404, { error: 'Brand not found' });
      const body = await readJson(req);
      if (!PLATFORMS.includes(body.platform)) return send(res, 400, { error: 'Unknown platform' });
      const post = { id: 'test', text: body.text || '✅ Nashr test', hashtags: '', image: '', platforms: [body.platform], results: {} };
      const { results } = await publishPost(store, post, b);
      return send(res, 200, { result: results[body.platform] });
    }

    // ----- AI -----
    if (p === '/api/generate' && method === 'POST') {
      const body = await readJson(req);
      const b = store.brand(body.brandId);
      if (!b) return send(res, 404, { error: 'Brand not found' });
      const count = Math.min(30, Math.max(1, Number(body.count) || 7));
      if (b.catalog.source !== 'none' && b.catalog.url && !b.catalog.syncedAt) await syncBrandCatalog(b);
      let ideas;
      try {
        ideas = await writePlan(d.settings.ai, b, { count, theme: String(body.theme || '').slice(0, 300), occasion: String(body.occasion || '').slice(0, 200) });
      } catch (err) {
        return send(res, err instanceof AIError ? 502 : 500, { error: err.message, code: err.code });
      }
      const startDate = /^\d{4}-\d{2}-\d{2}$/.test(body.startDate || '') ? body.startDate : new Intl.DateTimeFormat('en-CA', { timeZone: tz() }).format(new Date());
      const slots = nextSlots(b, d.posts, { startDate, count: ideas.length, tz: tz() });
      const platforms = PLATFORMS.filter((x) => b.channels[x].enabled);
      const created = ideas.map((idea, i) => store.addPost({
        brandId: b.id,
        ...idea,
        platforms,
        scheduledAt: slots[i] || null,
        status: b.autoApprove && slots[i] && platforms.length ? 'scheduled' : 'draft',
      }));
      return send(res, 200, { posts: created.map(postView) });
    }

    // ----- posts -----
    if (p === '/api/posts' && method === 'GET') {
      const from = url.searchParams.get('from');
      const to = url.searchParams.get('to');
      let list = d.posts;
      if (from && to) list = list.filter((x) => x.scheduledAt && x.scheduledAt >= from && x.scheduledAt < to);
      return send(res, 200, { posts: [...list].sort((a, b) => String(a.scheduledAt || '9').localeCompare(String(b.scheduledAt || '9'))).map(postView) });
    }
    if (p === '/api/posts' && method === 'POST') {
      const body = await readJson(req);
      const b = store.brand(body.brandId);
      if (!b) return send(res, 404, { error: 'Brand not found' });
      const post = store.addPost({ brandId: b.id, text: String(body.text || ''), hashtags: String(body.hashtags || ''), platforms: PLATFORMS.filter((x) => b.channels[x].enabled), scheduledAt: body.scheduledAt || null });
      return send(res, 200, { post: postView(post) });
    }
    if (p === '/api/posts/approve' && method === 'POST') {
      const body = await readJson(req);
      let n = 0;
      for (const post of d.posts) {
        if (!body.ids?.includes(post.id) || post.status !== 'draft' || !post.scheduledAt || !post.platforms.length) continue;
        if (post.platforms.includes('instagram') && !post.image) continue;
        post.status = 'scheduled';
        n += 1;
      }
      store.save();
      return send(res, 200, { approved: n });
    }

    if ((m = p.match(/^\/api\/posts\/([\w-]+)$/))) {
      const post = d.posts.find((x) => x.id === m[1]);
      if (!post) return send(res, 404, { error: 'Post not found' });
      if (method === 'PUT') {
        if (post.status === 'published' || post.status === 'publishing') return send(res, 409, { error: 'This post is already published' });
        const body = await readJson(req);
        for (const k of ['text', 'hashtags', 'imageIdea']) if (typeof body[k] === 'string') post[k] = body[k].slice(0, 5000);
        if (Array.isArray(body.platforms)) post.platforms = body.platforms.filter((x) => PLATFORMS.includes(x));
        if (body.scheduledAt !== undefined) post.scheduledAt = body.scheduledAt ? new Date(body.scheduledAt).toISOString() : null;
        if (body.status === 'scheduled' || body.status === 'draft') {
          if (body.status === 'scheduled') {
            if (!post.scheduledAt) return send(res, 400, { error: 'Pick a date and time first' });
            if (!post.platforms.length) return send(res, 400, { error: 'Pick at least one platform' });
            if (post.platforms.includes('instagram') && !post.image) return send(res, 400, { error: 'Instagram needs a photo: add one first' });
          }
          post.status = body.status;
        }
        store.save();
        return send(res, 200, { post: postView(post) });
      }
      if (method === 'DELETE') {
        d.posts = d.posts.filter((x) => x.id !== post.id);
        store.save();
        return send(res, 200, { ok: true });
      }
    }
    if ((m = p.match(/^\/api\/posts\/([\w-]+)\/image$/)) && method === 'POST') {
      const post = d.posts.find((x) => x.id === m[1]);
      if (!post) return send(res, 404, { error: 'Post not found' });
      const body = await readJson(req);
      if (body.remove) {
        post.image = '';
      } else {
        const buf = Buffer.from(String(body.data || ''), 'base64');
        const mime = sniff(buf);
        if (!mime || buf.length > 8 * 1024 * 1024) return send(res, 400, { error: 'Use a JPG, PNG or WebP image up to 8 MB' });
        post.image = store.saveMedia(buf, mime);
      }
      store.save();
      return send(res, 200, { post: postView(post) });
    }
    if ((m = p.match(/^\/api\/posts\/([\w-]+)\/rewrite$/)) && method === 'POST') {
      const post = d.posts.find((x) => x.id === m[1]);
      if (!post) return send(res, 404, { error: 'Post not found' });
      const body = await readJson(req);
      try {
        Object.assign(post, await rewritePost(d.settings.ai, store.brand(post.brandId) || newBrand(), post, String(body.instruction || '').slice(0, 300)));
      } catch (err) {
        return send(res, 502, { error: err.message });
      }
      store.save();
      return send(res, 200, { post: postView(post) });
    }
    if ((m = p.match(/^\/api\/posts\/([\w-]+)\/publish$/)) && method === 'POST') {
      const post = d.posts.find((x) => x.id === m[1]);
      if (!post) return send(res, 404, { error: 'Post not found' });
      if (!post.platforms.length) return send(res, 400, { error: 'Pick at least one platform' });
      await publishOne(post);
      return send(res, 200, { post: postView(post) });
    }
    // ----- settings -----
    if (p === '/api/settings' && method === 'GET') {
      const s = structuredClone(d.settings);
      if (s.ai.apiKey) s.ai.apiKey = MASK + s.ai.apiKey.slice(-4);
      return send(res, 200, { settings: s, claudeModels: CLAUDE_MODELS, timezone: tz(), keyFromEnv: !d.settings.ai.apiKey && Boolean(env.ANTHROPIC_API_KEY) });
    }
    if (p === '/api/settings' && method === 'PUT') {
      const body = await readJson(req);
      mergeKeep(d.settings, body.settings || {});
      store.save();
      return send(res, 200, { ok: true });
    }
    if (p === '/api/password' && method === 'POST') {
      const body = await readJson(req);
      if (!verifyPassword(String(body.current || ''), d.admin)) return send(res, 401, { error: 'Current password is wrong' });
      if (String(body.next || '').length < 8) return send(res, 400, { error: 'New password must be at least 8 characters' });
      d.admin = hashPassword(String(body.next));
      store.flush();
      return send(res, 200, { ok: true }, { 'set-cookie': newSession(req) });
    }
    return send(res, 404, { error: 'Not found' });
  }

  const server = http.createServer((req, res) => {
    route(req, res).catch((err) => {
      const status = err.status || 500;
      if (status === 500) console.error('[http]', err);
      if (!res.headersSent) send(res, status, { error: status === 500 ? 'Internal error' : err.message });
    });
  });

  let timer = null;
  return {
    server,
    store,
    publishDue,
    async start(port) {
      // Posts left "publishing" by a crash are retried; already-posted platforms are skipped.
      for (const post of store.data.posts) if (post.status === 'publishing') post.status = 'scheduled';
      timer = setInterval(() => publishDue().catch((e) => console.error('[scheduler]', e.message)), 30_000);
      timer.unref?.();
      await new Promise((r) => server.listen(port, r));
      return server.address().port;
    },
    async stop() {
      clearInterval(timer);
      store.flush();
      await new Promise((r) => server.close(r));
    },
  };
}
