import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createApp } from '../src/app.js';
import { nextSlots } from '../src/planner.js';
import { newBrand } from '../src/store.js';
import { parseJsonLoose } from '../src/ai.js';

const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');

function fake(route) {
  const calls = [];
  const server = http.createServer(async (req, res) => {
    const chunks = [];
    for await (const c of req) chunks.push(c);
    const raw = Buffer.concat(chunks);
    let body = null;
    if ((req.headers['content-type'] || '').includes('application/json') && raw.length) body = JSON.parse(raw.toString());
    const call = { method: req.method, url: req.url, headers: req.headers, body, raw };
    calls.push(call);
    const out = (await route(call)) || { status: 404, body: { error: { message: 'no route' } } };
    res.writeHead(out.status || 200, { 'content-type': out.type || 'application/json' });
    res.end(typeof out.body === 'string' ? out.body : JSON.stringify(out.body));
  });
  return new Promise((r) => server.listen(0, () => r({ server, calls, url: `http://127.0.0.1:${server.address().port}` })));
}

const IDEAS = { posts: [
  { kind: 'product', text: 'جربت الكرواسون بتاعنا؟ 🥐 طازة كل يوم الصبح', hashtags: '#كافيه #فطار', image_idea: 'كرواسون على ترابيزة خشب', product_id: 'p2' },
  { kind: 'tip', text: 'نصيحة: القهوة أحلى من غير سكر ☕', hashtags: '#قهوة', image_idea: 'فنجان قهوة', product_id: '' },
  { kind: 'question', text: 'لاتيه ولا كابتشينو؟ قولنا في الكومنتات 👇', hashtags: '#قهوة', image_idea: 'كوبايتين', product_id: '' },
] };

let llm, claude, graph, tg, dukkan, app, base, cookie, dataDir;

before(async () => {
  llm = await fake(({ body }) => {
    const prompt = body.messages.at(-1).content;
    if (/Rewrite this post/.test(prompt)) return { body: { choices: [{ message: { content: '```json\n{"text":"نسخة أقصر 🥐","hashtags":"#كافيه"}\n```' } }] } };
    return { body: { choices: [{ message: { content: JSON.stringify(IDEAS) } }] } };
  });
  claude = await fake(({ body }) => ({ type: 'text/event-stream', body: sse(body) }));
  graph = await fake(({ url, method }) => {
    if (url === '/v23.0/PAGE1/feed' && method === 'POST') return { body: { id: 'PAGE1_111' } };
    if (url === '/v23.0/PAGE1/photos' && method === 'POST') return { body: { id: 'photo1', post_id: 'PAGE1_222' } };
    if (url === '/v23.0/IG1/media' && method === 'POST') return { body: { id: 'CONT1' } };
    if (url.startsWith('/v23.0/CONT1?')) return { body: { status_code: 'FINISHED' } };
    if (url === '/v23.0/IG1/media_publish') return { body: { id: 'IGPOST1' } };
    if (url === '/v23.0/BADPAGE/feed') return { status: 400, body: { error: { message: 'Invalid OAuth access token' } } };
    return null;
  });
  tg = await fake(({ url }) => ({ body: { ok: true, result: { message_id: url.includes('sendPhoto') ? 7 : 6 } } }));
  dukkan = await fake(({ url }) => (url === '/' ? { type: 'text/html', body: `<script>window.DUKKAN=${JSON.stringify({ shop: { currency: 'EGP' }, products: [{ id: 'p1', name: 'Latte', price: 60, variants: [], available: true }, { id: 'p2', name: 'Croissant', price: 45, variants: [], available: true }] })};</script>` } : null));
  process.env.META_GRAPH_URL = graph.url;
  process.env.TELEGRAM_API_URL = tg.url;
  process.env.IG_POLL_MS = '5';
  dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'nashr-'));
  app = createApp({ dataDir, env: {} });
  base = `http://127.0.0.1:${await app.start(0)}`;
});

after(async () => {
  await app.stop();
  for (const f of [llm, claude, graph, tg, dukkan]) f.server.close();
  fs.rmSync(dataDir, { recursive: true, force: true });
});

// Minimal Messages API stream for the structured-output request
function sse(reqBody) {
  const text = JSON.stringify(IDEAS);
  const msg = { id: 'msg_1', type: 'message', role: 'assistant', model: reqBody.model, content: [], stop_reason: null, usage: { input_tokens: 5, output_tokens: 1 } };
  const ev = (type, data) => `event: ${type}\ndata: ${JSON.stringify({ type, ...data })}\n\n`;
  return ev('message_start', { message: msg }) +
    ev('content_block_start', { index: 0, content_block: { type: 'text', text: '' } }) +
    ev('content_block_delta', { index: 0, delta: { type: 'text_delta', text } }) +
    ev('content_block_stop', { index: 0 }) +
    ev('message_delta', { delta: { stop_reason: 'end_turn' }, usage: { output_tokens: 50 } }) +
    ev('message_stop', {});
}

async function call(p, { method = 'GET', body, jar = cookie } = {}) {
  const res = await fetch(base + p, { method, headers: { ...(body !== undefined ? { 'content-type': 'application/json' } : {}), ...(jar ? { cookie: jar } : {}) }, body: body !== undefined ? JSON.stringify(body) : undefined });
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch { json = text; }
  return { status: res.status, body: json, headers: res.headers };
}

test('JSON answers are parsed even inside code fences', () => {
  assert.deepEqual(parseJsonLoose('```json\n{"a":1}\n```'), { a: 1 });
  assert.deepEqual(parseJsonLoose('Here you go: [1,2]'), [1, 2]);
});

test('posting slots follow the brand schedule in its time zone', () => {
  const b = newBrand({ schedule: { days: [5], times: ['19:00', '12:00'] } }); // Fridays
  const slots = nextSlots(b, [], { startDate: '2026-11-02', count: 3, tz: 'Africa/Cairo', now: Date.parse('2026-11-01T00:00:00Z') });
  assert.deepEqual(slots, ['2026-11-06T10:00:00.000Z', '2026-11-06T17:00:00.000Z', '2026-11-13T10:00:00.000Z']);
  const taken = nextSlots(b, [{ brandId: b.id, scheduledAt: '2026-11-06T10:00:00.000Z', status: 'scheduled' }], { startDate: '2026-11-02', count: 1, tz: 'Africa/Cairo', now: Date.parse('2026-11-01T00:00:00Z') });
  assert.deepEqual(taken, ['2026-11-06T17:00:00.000Z']);
});

test('setup, brand with Dukkan products, and a generated plan', async () => {
  let r = await call('/api/setup', { method: 'POST', body: { password: 'owner-pass-1', brandName: 'Bean Café', timezone: 'Africa/Cairo' }, jar: '' });
  cookie = r.headers.get('set-cookie').split(';')[0];
  assert.equal((await call('/api/overview', { jar: '' })).status, 401);
  r = await call('/api/brands');
  const brand = r.body.brands[0];
  await call('/api/settings', { method: 'PUT', body: { settings: { ai: { provider: 'openai', model: 'm', baseUrl: llm.url } } } });
  r = await call(`/api/brands/${brand.id}`, { method: 'PUT', body: { brand: {
    description: 'Specialty café in Maadi', dialect: 'egyptian', hashtags: '#بين_كافيه',
    schedule: { days: [0, 1, 2, 3, 4, 5, 6], times: ['19:00'] },
    catalog: { source: 'dukkan', url: dukkan.url },
    channels: { facebook: { enabled: true, pageId: 'PAGE1', pageToken: 'PT-123456' }, telegram: { enabled: true, botToken: 'BOT', chatId: '@beancafe' } },
  } } });
  assert.equal(r.body.brand.catalog.count, 2);
  assert.match(r.body.brand.channels.facebook.pageToken, /^•+3456$/, 'tokens are masked');

  r = await call('/api/generate', { method: 'POST', body: { brandId: brand.id, count: 3 } });
  assert.equal(r.status, 200);
  assert.equal(r.body.posts.length, 3);
  assert.equal(r.body.posts[0].status, 'draft');
  assert.deepEqual(r.body.posts[0].platforms, ['facebook', 'telegram']);
  assert.ok(r.body.posts.every((p) => p.scheduledAt));
  const prompt = llm.calls.at(-1).body.messages.at(-1).content;
  assert.match(prompt, /\[p2\] Croissant — 45/, 'real products are in the brief');
  assert.match(llm.calls.at(-1).body.messages[0].content, /JSON schema/);
});

test('Claude path uses structured outputs', async () => {
  const brandId = app.store.data.brands[0].id;
  await call('/api/settings', { method: 'PUT', body: { settings: { ai: { provider: 'anthropic', model: 'claude-opus-5-5', apiKey: 'sk-ant-x', baseUrl: claude.url } } } });
  const r = await call('/api/generate', { method: 'POST', body: { brandId, count: 2 } });
  assert.equal(r.status, 200, JSON.stringify(r.body));
  assert.equal(r.body.posts.length, 2);
  const req = claude.calls.at(-1);
  assert.equal(req.body.output_config.format.type, 'json_schema');
  assert.equal(req.body.output_config.format.schema.properties.posts.type, 'array');
  assert.equal(req.body.stream, true);
  assert.equal(req.body.fallbacks, 'default');
  await call('/api/settings', { method: 'PUT', body: { settings: { ai: { provider: 'openai', baseUrl: llm.url } } } });
});

test('rewrite, approve and publish on schedule to Facebook and Telegram', async () => {
  let { body } = await call('/api/posts');
  const post = body.posts.find((p) => p.status === 'draft');
  let r = await call(`/api/posts/${post.id}/rewrite`, { method: 'POST', body: { instruction: 'shorter' } });
  assert.equal(r.body.post.text, 'نسخة أقصر 🥐');
  r = await call('/api/posts/approve', { method: 'POST', body: { ids: [post.id] } });
  assert.equal(r.body.approved, 1);
  const p = app.store.data.posts.find((x) => x.id === post.id);
  await app.publishDue(Date.parse(p.scheduledAt) - 60_000);
  assert.equal(p.status, 'scheduled', 'not before its time');
  await app.publishDue(Date.parse(p.scheduledAt) + 1000);
  assert.equal(p.status, 'published');
  assert.equal(p.results.facebook.id, 'PAGE1_111');
  const fb = graph.calls.find((c) => c.url === '/v23.0/PAGE1/feed');
  assert.match(fb.body.message, /نسخة أقصر 🥐\n\n#كافيه/);
  assert.equal(fb.body.access_token, 'PT-123456');
  const tgCall = tg.calls.find((c) => c.url === '/botBOT/sendMessage');
  assert.equal(tgCall.body.chat_id, '@beancafe');
});

test('Instagram needs a photo, gets a public URL, and publishes via a container', async () => {
  const brand = app.store.data.brands[0];
  await call(`/api/brands/${brand.id}`, { method: 'PUT', body: { brand: { channels: { instagram: { enabled: true, igUserId: 'IG1', token: 'IGT' } } } } });
  let r = await call('/api/posts', { method: 'POST', body: { brandId: brand.id, text: 'New beans ☕' } });
  const id = r.body.post.id;
  const when = new Date(Date.now() + 3600e3).toISOString();
  r = await call(`/api/posts/${id}`, { method: 'PUT', body: { platforms: ['instagram', 'facebook'], scheduledAt: when, status: 'scheduled' } });
  assert.equal(r.status, 400);
  assert.match(r.body.error, /photo/);
  r = await call(`/api/posts/${id}/image`, { method: 'POST', body: { data: PNG.toString('base64') } });
  const img = r.body.post.image;
  assert.equal((await fetch(`${base}/media/public/${img}`)).status, 200, 'attached photos are public for Instagram');
  assert.equal((await fetch(`${base}/media/public/nope.png`)).status, 404);
  r = await call(`/api/posts/${id}/publish`, { method: 'POST', body: {} });
  assert.equal(r.body.post.status, 'published', JSON.stringify(r.body.post.results));
  const container = graph.calls.find((c) => c.url === '/v23.0/IG1/media');
  assert.equal(container.body.image_url, `${base}/media/public/${img}`);
  assert.equal(graph.calls.find((c) => c.url === '/v23.0/IG1/media_publish').body.creation_id, 'CONT1');
  const photo = graph.calls.find((c) => c.url === '/v23.0/PAGE1/photos');
  assert.ok(photo.raw.includes(Buffer.from('New beans')), 'Facebook photo upload carries the caption');
});

test('a failed platform is reported and a retry does not double-post', async () => {
  const brand = app.store.data.brands[0];
  const post = app.store.addPost({ brandId: brand.id, text: 'Retry me', platforms: ['telegram', 'facebook'], scheduledAt: new Date(Date.now() - 1000).toISOString(), status: 'scheduled' });
  brand.channels.facebook.pageId = 'BADPAGE';
  await app.publishDue();
  assert.equal(post.status, 'failed');
  assert.match(post.error, /facebook: Invalid OAuth access token/);
  assert.ok(post.results.telegram.id);
  const tgBefore = tg.calls.length;
  brand.channels.facebook.pageId = 'PAGE1';
  const r = await call(`/api/posts/${post.id}/publish`, { method: 'POST', body: {} });
  assert.equal(r.body.post.status, 'published');
  assert.equal(tg.calls.length, tgBefore, 'Telegram was not posted twice');
});
