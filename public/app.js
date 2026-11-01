/* Nashr dashboard — plain JavaScript, no build step. */
(function () {
  'use strict';

  const STR = {
    ar: {
      overview: 'الرئيسية', calendar: 'التقويم', posts: 'البوستات', brands: 'البراندات', settings: 'الإعدادات', logout: 'خروج', lang: 'English',
      setupTitle: 'أهلاً بيك في نَشر', setupLead: 'اعمل كلمة سر، واكتب اسم البيزنس بتاعك.', brandName: 'اسم البيزنس', password: 'كلمة السر', passwordHint: '8 حروف على الأقل', setupToken: 'رمز الإعداد', start: 'ابدأ', loginTitle: 'تسجيل الدخول', login: 'دخول',
      lead: 'خطة المحتوى بتاعتك في مكان واحد.', plan: '✨ اعمل خطة بوستات', drafts: 'مسودات مستنية موافقتك', scheduled: 'بوستات متجدولة', published7d: 'اتنشر آخر 7 أيام', failed: 'فشل النشر', next: 'الجاي', nothingNext: 'مفيش بوستات متجدولة. اعمل خطة!',
      getStarted: 'خطوات البداية', s1: 'اربط نموذج ذكاء اصطناعي', s2: 'اكتب معلومات البراند', s3: 'وصّل فيسبوك أو إنستجرام أو تليجرام', s4: 'اعمل أول خطة بوستات',
      genTitle: 'خطة بوستات جديدة', brand: 'البراند', count: 'عدد البوستات', from: 'من يوم', theme: 'حملة أو تركيز (اختياري)', themePh: 'مثلاً: عروض الويك إند، منتج جديد…', occasion: 'مناسبة (اختياري)', occasionPh: 'مثلاً: رمضان، الجمعة البيضاء، عيد الأم…', generate: 'اكتب البوستات', writing: 'بيكتب… ده ممكن ياخد دقيقة', approveAll: 'وافق على الكل وجدولهم',
      st_draft: 'مسودة', st_scheduled: 'متجدول', st_publishing: 'بيتنشر', st_published: 'اتنشر', st_failed: 'فشل',
      all: 'الكل', edit: 'تعديل', del: 'حذف', save: 'حفظ', saved: 'اتحفظ ✓', cancel: 'إلغاء', close: 'إغلاق',
      text: 'نص البوست', hashtags: 'الهاشتاجات', imageIdea: 'فكرة الصورة', when: 'ميعاد النشر', platforms: 'المنصات', addPhoto: 'اضغط لإضافة صورة', removePhoto: 'شيل الصورة', rewrite: 'إعادة كتابة', rewritePh: 'مثلاً: أقصر، أكتر حماس، ركّز على السعر…', schedule: 'جدولة', unschedule: 'رجّعه مسودة', publishNow: 'انشر دلوقتي', igNeedsPhoto: 'إنستجرام محتاج صورة', newPost: '+ بوست جديد', noPosts: 'مفيش بوستات هنا.', noBrand: 'اعمل براند الأول.',
      bTitle: 'معلومات البراند', bLead: 'كل ما تكتب تفاصيل أكتر، البوستات تطلع أحسن.', name: 'الاسم', about: 'نبذة', audience: 'الجمهور', audiencePh: 'مثلاً: أمهات في القاهرة، طلبة جامعة…', offers: 'العروض والمنتجات المهمة', tone: 'الأسلوب', dialect: 'اللهجة', d_egyptian: 'مصري', d_gulf: 'خليجي', d_levantine: 'شامي', d_msa: 'فصحى مبسطة', d_english: 'English', brandTags: 'هاشتاجات البراند', cta: 'طريقة الطلب (لينك أو رقم)', ctaPh: 'مثلاً: اطلب على واتساب 0100…',
      toneFriendly: 'ودود', toneFun: 'مرح وخفيف', toneLux: 'راقي', toneFormal: 'رسمي',
      when2: 'أيام وأوقات النشر', times: 'الأوقات (مفصولة بفاصلة)', autoApprove: 'جدول البوستات الجديدة على طول من غير مراجعة',
      days: ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'],
      catTitle: 'المنتجات من متجرك', catLead: 'نَشر هيكتب عن منتجاتك الحقيقية بأسعارها.', source: 'المصدر', none: 'مفيش', storeUrl: 'رابط المتجر', syncNow: 'زامن دلوقتي', products: 'منتج',
      chTitle: 'الحسابات', fbPage: 'Facebook Page ID', fbToken: 'Page access token', igUser: 'Instagram account ID', igToken: 'Access token (نفس توكن الصفحة غالباً)', tgBot: 'Bot token', tgChat: 'القناة (مثلاً @mychannel)', enable: 'تفعيل', test: 'ابعت بوست تجربة', testOk: 'اتنشر ✓', addBrand: '+ براند جديد', delBrand: 'حذف البراند',
      chSteps: { facebook: ['من developers.facebook.com اعمل App', 'خد Page access token دائم لصفحتك بصلاحيات pages_manage_posts', 'Page ID موجود في إعدادات الصفحة'], instagram: ['لازم حساب إنستجرام Business أو Creator مربوط بالصفحة', 'صلاحيات instagram_basic و instagram_content_publish', 'لازم نَشر يكون على دومين HTTPS عشان إنستجرام يقدر يحمّل الصور'], telegram: ['اعمل بوت من @BotFather', 'ضيف البوت أدمن في القناة', 'اكتب اسم القناة @name'] },
      aiTitle: 'نموذج الذكاء الاصطناعي', provider: 'المزوّد', provAnthropic: 'Anthropic (Claude)', provOpenai: 'متوافق مع OpenAI (Ollama, OpenRouter…)', model: 'النموذج', apiKey: 'API key', baseUrl: 'Base URL', keyFromEnv: 'بيستخدم ANTHROPIC_API_KEY من السيرفر', tz: 'المنطقة الزمنية', hook: 'Webhook عند النشر أو الفشل (اختياري)',
      pwTitle: 'تغيير كلمة السر', current: 'الحالية', nextPw: 'الجديدة', change: 'تغيير',
      k_product: 'منتج', k_offer: 'عرض', k_tip: 'نصيحة', k_behind_the_scenes: 'كواليس', k_question: 'سؤال', k_testimonial: 'رأي عميل', k_occasion: 'مناسبة', k_post: 'بوست',
    },
    en: {
      overview: 'Home', calendar: 'Calendar', posts: 'Posts', brands: 'Brands', settings: 'Settings', logout: 'Sign out', lang: 'العربية',
      setupTitle: 'Welcome to Nashr', setupLead: 'Create a password and name your business.', brandName: 'Business name', password: 'Password', passwordHint: 'At least 8 characters', setupToken: 'Setup token', start: 'Get started', loginTitle: 'Sign in', login: 'Sign in',
      lead: 'Your content plan in one place.', plan: '✨ Plan posts', drafts: 'Drafts waiting for you', scheduled: 'Scheduled', published7d: 'Published, last 7 days', failed: 'Failed', next: 'Coming up', nothingNext: 'Nothing scheduled yet. Make a plan!',
      getStarted: 'Get started', s1: 'Connect an AI model', s2: 'Describe your brand', s3: 'Connect Facebook, Instagram or Telegram', s4: 'Make your first post plan',
      genTitle: 'New post plan', brand: 'Brand', count: 'Number of posts', from: 'Starting', theme: 'Campaign or focus (optional)', themePh: 'e.g. weekend deals, a new product…', occasion: 'Occasion (optional)', occasionPh: 'e.g. Ramadan, Black Friday, Mother’s Day…', generate: 'Write the posts', writing: 'Writing… this can take a minute', approveAll: 'Approve and schedule all',
      st_draft: 'Draft', st_scheduled: 'Scheduled', st_publishing: 'Publishing', st_published: 'Published', st_failed: 'Failed',
      all: 'All', edit: 'Edit', del: 'Delete', save: 'Save', saved: 'Saved ✓', cancel: 'Cancel', close: 'Close',
      text: 'Post text', hashtags: 'Hashtags', imageIdea: 'Photo idea', when: 'Publish at', platforms: 'Platforms', addPhoto: 'Click to add a photo', removePhoto: 'Remove photo', rewrite: 'Rewrite', rewritePh: 'e.g. shorter, more excited, focus on price…', schedule: 'Schedule', unschedule: 'Back to draft', publishNow: 'Publish now', igNeedsPhoto: 'Instagram needs a photo', newPost: '+ New post', noPosts: 'No posts here.', noBrand: 'Create a brand first.',
      bTitle: 'Brand details', bLead: 'The more detail you give, the better the posts.', name: 'Name', about: 'About', audience: 'Audience', audiencePh: 'e.g. young parents in the city, students…', offers: 'Offers and key products', tone: 'Tone', dialect: 'Language', d_egyptian: 'Egyptian Arabic', d_gulf: 'Gulf Arabic', d_levantine: 'Levantine Arabic', d_msa: 'Simple standard Arabic', d_english: 'English', brandTags: 'Brand hashtags', cta: 'How to order (link or phone)', ctaPh: 'e.g. Order on WhatsApp +1…',
      toneFriendly: 'Friendly', toneFun: 'Playful', toneLux: 'Premium', toneFormal: 'Formal',
      when2: 'Posting days and times', times: 'Times (comma separated)', autoApprove: 'Schedule new posts right away without review',
      days: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      catTitle: 'Products from your store', catLead: 'Nashr writes about your real products and prices.', source: 'Source', none: 'None', storeUrl: 'Store URL', syncNow: 'Sync now', products: 'products',
      chTitle: 'Accounts', fbPage: 'Facebook Page ID', fbToken: 'Page access token', igUser: 'Instagram account ID', igToken: 'Access token (usually the Page token)', tgBot: 'Bot token', tgChat: 'Channel (e.g. @mychannel)', enable: 'Enable', test: 'Send a test post', testOk: 'Posted ✓', addBrand: '+ New brand', delBrand: 'Delete brand',
      chSteps: { facebook: ['Create an app at developers.facebook.com', 'Get a long-lived Page access token with pages_manage_posts', 'Find the Page ID in your Page settings'], instagram: ['You need an Instagram Business or Creator account linked to the Page', 'Permissions: instagram_basic and instagram_content_publish', 'Nashr must run on an HTTPS domain so Instagram can fetch the photos'], telegram: ['Create a bot with @BotFather', 'Add the bot as an admin of your channel', 'Enter the channel as @name'] },
      aiTitle: 'AI model', provider: 'Provider', provAnthropic: 'Anthropic (Claude)', provOpenai: 'OpenAI-compatible (Ollama, OpenRouter…)', model: 'Model', apiKey: 'API key', baseUrl: 'Base URL', keyFromEnv: 'Using ANTHROPIC_API_KEY from the server', tz: 'Time zone', hook: 'Webhook on publish or failure (optional)',
      pwTitle: 'Change password', current: 'Current', nextPw: 'New', change: 'Change',
      k_product: 'Product', k_offer: 'Offer', k_tip: 'Tip', k_behind_the_scenes: 'Behind the scenes', k_question: 'Question', k_testimonial: 'Testimonial', k_occasion: 'Occasion', k_post: 'Post',
    },
  };
  const safeGet = (k) => { try { return localStorage.getItem(k); } catch { return null; } };
  const safeSet = (k, v) => { try { localStorage.setItem(k, v); } catch { /* ignore */ } };
  let lang = safeGet('nashr_lang') || 'ar';
  const t = (k) => STR[lang][k] ?? STR.en[k] ?? k;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const app = $('#app');
  const PLATFORMS = ['facebook', 'instagram', 'telegram'];
  const PF = { facebook: 'FB', instagram: 'IG', telegram: 'TG' };
  const state = { session: null, brands: [], filter: 'all', month: null };

  async function api(path, opts = {}) {
    const res = await fetch(path, { method: opts.method || 'GET', headers: opts.body !== undefined ? { 'content-type': 'application/json' } : {}, body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined });
    const data = await res.json().catch(() => ({}));
    if (res.status === 401 && path !== '/api/login' && path !== '/api/password') { boot(); throw new Error(data.error || 'Not signed in'); }
    if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
    return data;
  }
  let toastTimer;
  const toast = (m) => { const el = $('#toast'); el.textContent = m; el.classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove('show'), 2800); };
  const tzName = () => state.session?.timezone || 'UTC';
  const fmt = (iso, opts) => (iso ? new Date(iso).toLocaleString(lang === 'ar' ? 'ar-EG' : 'en-GB', { timeZone: tzName(), ...opts }) : '—');
  const pf = (list) => `<span class="pf">${(list || []).map((p) => `<span class="${p}">${PF[p]}</span>`).join('')}</span>`;
  const pillFor = (s) => ({ draft: 'off', scheduled: 'warn', publishing: 'warn', published: 'good', failed: 'bad' }[s] || 'off');
  // datetime-local value in the account time zone
  function toLocalInput(iso) {
    if (!iso) return '';
    const p = Object.fromEntries(new Intl.DateTimeFormat('en-CA', { timeZone: tzName(), hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }).formatToParts(new Date(iso)).map((x) => [x.type, x.value]));
    return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}`;
  }
  function fromLocalInput(v) {
    if (!v) return null;
    const [d, tm] = v.split('T');
    const [y, mo, da] = d.split('-').map(Number);
    const [h, mi] = tm.split(':').map(Number);
    const guess = Date.UTC(y, mo - 1, da, h, mi);
    const off = (ts) => { const p = Object.fromEntries(new Intl.DateTimeFormat('en-US', { timeZone: tzName(), hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' }).formatToParts(new Date(ts)).map((x) => [x.type, x.value])); return Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second) - Math.floor(ts / 1000) * 1000; };
    let ts = guess - off(guess); ts = guess - off(ts);
    return new Date(ts).toISOString();
  }
  const todayLocal = () => new Intl.DateTimeFormat('en-CA', { timeZone: tzName() }).format(new Date());

  // ------------------------------------------------------------------ boot / auth
  async function boot() {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    state.session = await api('/api/session').catch(() => ({ needsSetup: false, authed: false }));
    if (state.session.needsSetup) return authScreen(true);
    if (!state.session.authed) return authScreen(false);
    state.brands = (await api('/api/brands')).brands;
    shell();
    route();
  }

  function authScreen(setup) {
    app.innerHTML = `<div class="auth"><form class="card" id="f" novalidate>
      <div class="brand"><img src="favicon.svg" alt="">Nashr <span class="muted small">نَشر</span></div>
      <h1>${setup ? t('setupTitle') : t('loginTitle')}</h1>${setup ? `<p class="muted">${t('setupLead')}</p>
      <label class="field" for="f-bn">${t('brandName')}<input type="text" id="f-bn"></label>` : ''}
      <label class="field" for="f-pw">${t('password')} ${setup ? `<span class="hint">${t('passwordHint')}</span>` : ''}<input type="password" id="f-pw" autocomplete="${setup ? 'new-password' : 'current-password'}"></label>
      ${setup && state.session.setupTokenRequired ? `<label class="field" for="f-st">${t('setupToken')}<input type="password" id="f-st" class="ltr"></label>` : ''}
      <div class="err" id="err"></div>
      <div class="row"><button class="btn primary" type="submit">${setup ? t('start') : t('login')}</button><span class="spacer"></span><button class="btn sm" type="button" id="lb">${t('lang')}</button></div>
    </form></div>`;
    $('#lb').onclick = () => { lang = lang === 'ar' ? 'en' : 'ar'; safeSet('nashr_lang', lang); boot(); };
    $('#f').onsubmit = async (e) => {
      e.preventDefault();
      try {
        if (setup) await api('/api/setup', { method: 'POST', body: { password: $('#f-pw').value, brandName: $('#f-bn').value, lang, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone, setupToken: $('#f-st')?.value } });
        else await api('/api/login', { method: 'POST', body: { password: $('#f-pw').value } });
        location.hash = '#overview';
        boot();
      } catch (err) { $('#err').textContent = err.message; }
    };
  }

  const PAGES = ['overview', 'calendar', 'posts', 'brands', 'settings'];
  function shell() {
    const nav = PAGES.map((p) => `<a class="nav" href="#${p}" data-page="${p}"><span>${t(p)}</span></a>`).join('');
    app.innerHTML = `<div class="shell"><nav class="rail" aria-label="Main"><div class="brand"><img src="favicon.svg" alt="">Nashr</div>${nav}
      <div class="rail-foot"><button class="nav" type="button" id="lb">${t('lang')}</button><button class="nav" type="button" id="lo">${t('logout')}</button></div></nav>
      <nav class="mobile-nav" aria-label="Main">${nav}</nav><main class="main" id="main"></main></div>`;
    $('#lb').onclick = () => { lang = lang === 'ar' ? 'en' : 'ar'; safeSet('nashr_lang', lang); boot(); };
    $('#lo').onclick = async () => { await api('/api/logout', { method: 'POST', body: {} }); boot(); };
  }
  const page = () => (PAGES.includes(location.hash.slice(1)) ? location.hash.slice(1) : 'overview');
  function route() {
    const main = $('#main');
    if (!main) return;
    $$('.nav[data-page]').forEach((a) => a.setAttribute('aria-current', a.dataset.page === page() ? 'page' : 'false'));
    main.scrollTop = 0;
    ({ overview: pOverview, calendar: pCalendar, posts: pPosts, brands: pBrands, settings: pSettings }[page()])(main);
  }
  window.addEventListener('hashchange', () => state.session?.authed && route());

  // ------------------------------------------------------------------ overview
  async function pOverview(main) {
    const o = await api('/api/overview');
    const steps = [[o.aiReady, t('s1'), '#settings'], [state.brands.some((b) => b.description), t('s2'), '#brands'], [o.connected, t('s3'), '#brands'], [o.scheduled + o.published7d > 0, t('s4'), '#overview']];
    main.innerHTML = `<div class="page">
      <div class="page-head"><div><h1>${t('overview')}</h1><p>${t('lead')}</p></div><button class="btn primary" id="plan" type="button">${t('plan')}</button></div>
      ${steps.every((s) => s[0]) ? '' : `<section class="card"><h2>${t('getStarted')}</h2><ol class="checklist">${steps.map(([d, l, h], i) => `<li class="${d ? 'done' : ''}"><span class="check">${d ? '✓' : i + 1}</span><a class="t" href="${h}">${l}</a></li>`).join('')}</ol></section>`}
      <div class="grid4">
        <a class="card stat ${o.drafts ? 'alert' : ''}" href="#posts" data-f="draft" style="text-decoration:none;color:inherit"><b>${o.drafts}</b><span>${t('drafts')}</span></a>
        <a class="card stat" href="#calendar" style="text-decoration:none;color:inherit"><b>${o.scheduled}</b><span>${t('scheduled')}</span></a>
        <div class="card stat"><b>${o.published7d}</b><span>${t('published7d')}</span></div>
        <a class="card stat ${o.failed ? 'alert' : ''}" href="#posts" data-f="failed" style="text-decoration:none;color:inherit"><b>${o.failed}</b><span>${t('failed')}</span></a>
      </div>
      <section class="card"><h2>${t('next')}</h2>${o.next.length ? `<div class="posts">${o.next.map(postCard).join('')}</div>` : `<p class="muted">${t('nothingNext')}</p>`}</section>
    </div>`;
    $('#plan').onclick = () => planDialog();
    $$('[data-f]', main).forEach((a) => a.addEventListener('click', () => { state.filter = a.dataset.f; }));
    bindCards(main, () => pOverview(main));
  }

  function postCard(p) {
    const b = state.brands.find((x) => x.id === p.brandId);
    return `<article class="post"><div class="ph">${p.imageUrl ? `<img src="${esc(p.imageUrl)}" alt="">` : `📷 ${esc(p.imageIdea || '')}`}</div>
      <div class="tx" dir="auto">${esc(p.text)}${p.hashtags ? `\n\n<span class="muted">${esc(p.hashtags)}</span>` : ''}</div>
      <div class="ft"><span class="pill ${pillFor(p.status)}">${t('st_' + p.status)}</span>${pf(p.platforms)}<span class="muted">${fmt(p.scheduledAt, { dateStyle: 'medium', timeStyle: 'short' })}</span><span class="spacer"></span>
        ${state.brands.length > 1 && b ? `<span class="muted small">${esc(b.name)}</span>` : ''}<button class="btn sm" data-edit="${esc(p.id)}" type="button">${t('edit')}</button></div>
      ${p.status === 'failed' && p.error ? `<div class="ft" style="color:var(--bad)">${esc(p.error)}</div>` : ''}</article>`;
  }
  function bindCards(root, refresh) {
    $$('[data-edit]', root).forEach((b) => (b.onclick = () => editDialog(b.dataset.edit, refresh)));
  }

  // ------------------------------------------------------------------ plan generator
  function planDialog() {
    if (!state.brands.length) return toast(t('noBrand'));
    const d = document.createElement('dialog');
    d.className = 'ed';
    d.innerHTML = `<form class="in" id="gf"><h2>${t('genTitle')}</h2>
      <div class="grid2"><label class="field" for="g-b">${t('brand')}<select id="g-b">${state.brands.map((b) => `<option value="${esc(b.id)}">${esc(b.name)}</option>`).join('')}</select></label>
        <label class="field" for="g-n">${t('count')}<select id="g-n">${[3, 5, 7, 10, 14, 20, 30].map((n) => `<option ${n === 7 ? 'selected' : ''}>${n}</option>`).join('')}</select></label></div>
      <div class="grid2"><label class="field" for="g-d">${t('from')}<input type="date" id="g-d" value="${todayLocal()}"></label>
        <label class="field" for="g-o">${t('occasion')}<input type="text" id="g-o" placeholder="${t('occasionPh')}"></label></div>
      <label class="field" for="g-t">${t('theme')}<input type="text" id="g-t" placeholder="${t('themePh')}"></label>
      <div class="err" id="g-err"></div>
      <div class="row"><button class="btn primary" type="submit" id="g-go">${t('generate')}</button><button class="btn" type="button" id="g-x">${t('cancel')}</button></div>
      <div id="g-out"></div></form>`;
    document.body.appendChild(d);
    d.showModal();
    d.addEventListener('close', () => { d.remove(); route(); });
    $('#g-x', d).onclick = () => d.close();
    $('#gf', d).onsubmit = async (e) => {
      e.preventDefault();
      const go = $('#g-go', d);
      go.disabled = true; go.textContent = t('writing'); $('#g-err', d).textContent = '';
      try {
        const { posts } = await api('/api/generate', { method: 'POST', body: { brandId: $('#g-b', d).value, count: Number($('#g-n', d).value), startDate: $('#g-d', d).value, theme: $('#g-t', d).value, occasion: $('#g-o', d).value } });
        $('#g-out', d).innerHTML = `<div class="row" style="margin:6px 0 12px"><button class="btn primary" type="button" id="g-ok">${t('approveAll')}</button></div><div class="posts">${posts.map(postCard).join('')}</div>`;
        bindCards(d, () => {});
        $('#g-ok', d).onclick = async () => {
          const r = await api('/api/posts/approve', { method: 'POST', body: { ids: posts.map((p) => p.id) } });
          toast(`${r.approved} / ${posts.length} ✓`);
          d.close();
        };
      } catch (err) { $('#g-err', d).textContent = err.message; }
      go.disabled = false; go.textContent = t('generate');
    };
  }

  // ------------------------------------------------------------------ post editor
  async function editDialog(id, refresh) {
    const { posts } = await api('/api/posts');
    let p = posts.find((x) => x.id === id);
    if (!p) return;
    const d = document.createElement('dialog');
    d.className = 'ed';
    const locked = p.status === 'published' || p.status === 'publishing';
    const render = () => {
      d.innerHTML = `<form class="in" id="ef">
        <div class="row"><h2>${t('k_' + (p.kind || 'post'))}</h2><span class="pill ${pillFor(p.status)}">${t('st_' + p.status)}</span><span class="spacer"></span><button class="btn sm" type="button" id="e-x">${t('close')}</button></div>
        <div class="ed-grid">
          <div class="stack"><div class="ed-img" id="e-img" role="button" tabindex="0">${p.imageUrl ? `<img src="${esc(p.imageUrl)}" alt="">` : `${t('addPhoto')}<br><br>📷 ${esc(p.imageIdea || '')}`}</div>
            <input type="file" id="e-file" accept="image/jpeg,image/png,image/webp" hidden>
            ${p.imageUrl && !locked ? `<button class="btn sm" type="button" id="e-rm">${t('removePhoto')}</button>` : ''}</div>
          <div class="stack">
            <label class="field" for="e-text">${t('text')}<textarea id="e-text" dir="auto" style="min-height:180px" ${locked ? 'readonly' : ''}>${esc(p.text)}</textarea></label>
            <label class="field" for="e-tags">${t('hashtags')}<input type="text" id="e-tags" dir="auto" value="${esc(p.hashtags)}" ${locked ? 'readonly' : ''}></label>
          </div>
        </div>
        ${locked ? Object.entries(p.results || {}).map(([k, r]) => `<div class="row small">${pf([k])}${r.url ? `<a href="${esc(r.url)}" target="_blank" rel="noopener">${esc(r.url)}</a>` : esc(r.id || r.error || '')}</div>`).join('') : `
        <div class="row"><input type="text" id="e-rw" placeholder="${t('rewritePh')}" style="flex:1;min-width:200px" aria-label="${t('rewrite')}"><button class="btn" type="button" id="e-rwb">${t('rewrite')}</button></div>
        <div class="grid2"><label class="field" for="e-when">${t('when')} <span class="hint">${esc(tzName())}</span><input type="datetime-local" id="e-when" value="${toLocalInput(p.scheduledAt)}"></label>
          <div class="field">${t('platforms')}<div class="checks">${PLATFORMS.map((x) => `<label><input type="checkbox" value="${x}" ${p.platforms.includes(x) ? 'checked' : ''}>${x[0].toUpperCase() + x.slice(1)}</label>`).join('')}</div>
          ${p.platforms.includes('instagram') && !p.imageUrl ? `<span class="hint" style="color:var(--warn)">${t('igNeedsPhoto')}</span>` : ''}</div></div>
        ${p.error ? `<p class="small" style="color:var(--bad)">${esc(p.error)}</p>` : ''}
        <div class="row"><button class="btn primary" type="submit">${t('save')}</button>
          ${p.status === 'scheduled' ? `<button class="btn" type="button" data-st="draft">${t('unschedule')}</button>` : `<button class="btn" type="button" data-st="scheduled">${t('schedule')}</button>`}
          <button class="btn" type="button" id="e-now">${t('publishNow')}</button><span class="spacer"></span><button class="btn danger" type="button" id="e-del">${t('del')}</button></div>`}
      </form>`;
      $('#e-x', d).onclick = () => d.close();
      const img = $('#e-img', d), file = $('#e-file', d);
      if (!locked) {
        img.onclick = () => file.click();
        img.onkeydown = (e) => { if (e.key === 'Enter') file.click(); };
        file.onchange = async () => {
          const f = file.files[0];
          if (!f) return;
          const data = await new Promise((r) => { const fr = new FileReader(); fr.onload = () => r(String(fr.result).split(',')[1]); fr.readAsDataURL(f); });
          try { p = (await api(`/api/posts/${p.id}/image`, { method: 'POST', body: { data } })).post; render(); } catch (err) { toast(err.message); }
        };
        if ($('#e-rm', d)) $('#e-rm', d).onclick = async () => { p = (await api(`/api/posts/${p.id}/image`, { method: 'POST', body: { remove: true } })).post; render(); };
        const body = () => ({ text: $('#e-text', d).value, hashtags: $('#e-tags', d).value, scheduledAt: fromLocalInput($('#e-when', d).value), platforms: $$('.checks input:checked', d).map((i) => i.value) });
        $('#ef', d).onsubmit = async (e) => { e.preventDefault(); try { p = (await api(`/api/posts/${p.id}`, { method: 'PUT', body: body() })).post; toast(t('saved')); render(); } catch (err) { toast(err.message); } };
        $$('[data-st]', d).forEach((b) => (b.onclick = async () => { try { p = (await api(`/api/posts/${p.id}`, { method: 'PUT', body: { ...body(), status: b.dataset.st } })).post; toast(t('saved')); render(); } catch (err) { toast(err.message); } }));
        $('#e-rwb', d).onclick = async (ev) => {
          ev.target.disabled = true;
          try { await api(`/api/posts/${p.id}`, { method: 'PUT', body: body() }); p = (await api(`/api/posts/${p.id}/rewrite`, { method: 'POST', body: { instruction: $('#e-rw', d).value } })).post; render(); } catch (err) { toast(err.message); ev.target.disabled = false; }
        };
        $('#e-now', d).onclick = async (ev) => {
          ev.target.disabled = true;
          try { await api(`/api/posts/${p.id}`, { method: 'PUT', body: body() }); p = (await api(`/api/posts/${p.id}/publish`, { method: 'POST', body: {} })).post; render(); } catch (err) { toast(err.message); ev.target.disabled = false; }
        };
        $('#e-del', d).onclick = async () => { await api(`/api/posts/${p.id}`, { method: 'DELETE', body: {} }); d.close(); };
      }
    };
    render();
    document.body.appendChild(d);
    d.showModal();
    d.addEventListener('close', () => { d.remove(); refresh(); });
  }

  // ------------------------------------------------------------------ calendar
  async function pCalendar(main) {
    const now = new Date();
    const [y, m] = state.month || [now.getFullYear(), now.getMonth()];
    const first = new Date(Date.UTC(y, m, 1));
    const start = new Date(Date.UTC(y, m, 1 - first.getUTCDay()));
    const end = new Date(start.getTime() + 42 * 864e5);
    const { posts } = await api(`/api/posts?from=${start.toISOString()}&to=${end.toISOString()}`);
    const dayKey = (iso) => new Intl.DateTimeFormat('en-CA', { timeZone: tzName() }).format(new Date(iso));
    const byDay = {};
    for (const p of posts) (byDay[dayKey(p.scheduledAt)] ||= []).push(p);
    const today = todayLocal();
    const title = new Date(Date.UTC(y, m, 15)).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-GB', { month: 'long', year: 'numeric' });
    main.innerHTML = `<div class="page">
      <div class="page-head"><h1>${esc(title)}</h1><div class="row"><button class="btn sm" id="prev" type="button">${lang === 'ar' ? '→' : '←'}</button><button class="btn sm" id="next" type="button">${lang === 'ar' ? '←' : '→'}</button><button class="btn primary" id="plan" type="button">${t('plan')}</button></div></div>
      <div class="cal">${t('days').map((d) => `<div class="dow">${esc(d.slice(0, lang === 'ar' ? 10 : 3))}</div>`).join('')}
      ${[...Array(42)].map((_, i) => {
        const day = new Date(start.getTime() + i * 864e5);
        const key = day.toISOString().slice(0, 10);
        const list = (byDay[key] || []).sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt));
        return `<div class="day ${day.getUTCMonth() !== m ? 'other' : ''} ${key === today ? 'today' : ''}"><span class="num">${day.getUTCDate()}</span>
          ${list.map((p) => `<button class="chip ${p.status}" data-edit="${esc(p.id)}" type="button" title="${esc(p.text.slice(0, 120))}">${fmt(p.scheduledAt, { hour: '2-digit', minute: '2-digit' })} ${esc(p.text.slice(0, 40))}</button>`).join('')}</div>`;
      }).join('')}</div></div>`;
    $('#prev').onclick = () => { state.month = m === 0 ? [y - 1, 11] : [y, m - 1]; pCalendar(main); };
    $('#next').onclick = () => { state.month = m === 11 ? [y + 1, 0] : [y, m + 1]; pCalendar(main); };
    $('#plan').onclick = () => planDialog();
    bindCards(main, () => pCalendar(main));
  }

  // ------------------------------------------------------------------ posts list
  async function pPosts(main) {
    const { posts } = await api('/api/posts');
    const f = state.filter;
    const list = posts.filter((p) => f === 'all' || p.status === f);
    const tabs = ['all', 'draft', 'scheduled', 'published', 'failed'];
    main.innerHTML = `<div class="page">
      <div class="page-head"><h1>${t('posts')}</h1><div class="row"><div class="tabs" role="group">${tabs.map((k) => `<button type="button" data-tab="${k}" aria-pressed="${f === k}">${k === 'all' ? t('all') : t('st_' + k)}</button>`).join('')}</div>
        <button class="btn" id="np" type="button">${t('newPost')}</button><button class="btn primary" id="plan" type="button">${t('plan')}</button></div></div>
      ${list.length ? `<div class="posts">${list.map(postCard).join('')}</div>` : `<div class="card empty">${t('noPosts')}</div>`}
    </div>`;
    $$('[data-tab]', main).forEach((b) => (b.onclick = () => { state.filter = b.dataset.tab; pPosts(main); }));
    $('#plan').onclick = () => planDialog();
    $('#np').onclick = async () => {
      if (!state.brands.length) return toast(t('noBrand'));
      const { post } = await api('/api/posts', { method: 'POST', body: { brandId: state.brands[0].id, text: '' } });
      editDialog(post.id, () => pPosts(main));
    };
    bindCards(main, () => pPosts(main));
  }

  // ------------------------------------------------------------------ brands
  async function pBrands(main) {
    state.brands = (await api('/api/brands')).brands;
    if (!state.brands.length) {
      const { brand } = await api('/api/brands', { method: 'POST', body: { name: 'My brand' } });
      state.brands = [brand];
    }
    const sel = state.brandSel && state.brands.find((b) => b.id === state.brandSel) ? state.brandSel : state.brands[0].id;
    const b = state.brands.find((x) => x.id === sel);
    const inp = (id, label, v, extra = '') => `<label class="field" for="${id}">${t(label)}<input type="text" id="${id}" value="${esc(v)}" ${extra}></label>`;
    const steps = (k) => `<details class="steps"><summary>${lang === 'ar' ? 'إزاي أوصّله؟' : 'How to connect'}</summary><ol>${t('chSteps')[k].map((x) => `<li>${esc(x)}</li>`).join('')}</ol></details>`;
    const chCard = (k, title, fields) => `<div class="card"><div class="card-head"><div class="row">${pf([k])}<h3>${title}</h3></div>
      <label class="switch"><input type="checkbox" id="ch-${k}" ${b.channels[k].enabled ? 'checked' : ''}>${t('enable')}</label></div>${steps(k)}
      ${fields.map(([key, label]) => inp(`ch-${k}-${key}`, label, b.channels[k][key], 'class="ltr" autocomplete="off" spellcheck="false"')).join('')}
      <div class="row"><button class="btn sm" type="button" data-test="${k}">${t('test')}</button><span class="small" id="tr-${k}"></span></div></div>`;
    main.innerHTML = `<div class="page">
      <div class="page-head"><h1>${t('brands')}</h1><div class="row">${state.brands.length > 1 ? `<select id="bsel">${state.brands.map((x) => `<option value="${esc(x.id)}" ${x.id === sel ? 'selected' : ''}>${esc(x.name)}</option>`).join('')}</select>` : ''}<button class="btn" id="nb" type="button">${t('addBrand')}</button></div></div>
      <section class="card"><div><h2>${t('bTitle')}</h2><p class="muted small">${t('bLead')}</p></div>
        <div class="grid2">${inp('b-name', 'name', b.name)}${inp('b-aud', 'audience', b.audience, `placeholder="${t('audiencePh')}"`)}</div>
        <label class="field" for="b-desc">${t('about')}<textarea id="b-desc">${esc(b.description)}</textarea></label>
        <label class="field" for="b-off">${t('offers')}<textarea id="b-off">${esc(b.offers)}</textarea></label>
        <div class="grid4">
          <label class="field" for="b-dia">${t('dialect')}<select id="b-dia">${['egyptian', 'gulf', 'levantine', 'msa', 'english'].map((x) => `<option value="${x}" ${b.dialect === x ? 'selected' : ''}>${t('d_' + x)}</option>`).join('')}</select></label>
          <label class="field" for="b-tone">${t('tone')}<select id="b-tone">${[['friendly', 'toneFriendly'], ['playful', 'toneFun'], ['premium', 'toneLux'], ['formal', 'toneFormal']].map(([v, l]) => `<option value="${v}" ${b.tone === v ? 'selected' : ''}>${t(l)}</option>`).join('')}</select></label>
          ${inp('b-tags', 'brandTags', b.hashtags, 'dir="auto"')}${inp('b-cta', 'cta', b.cta, `dir="auto" placeholder="${t('ctaPh')}"`)}
        </div>
        <div class="field">${t('when2')}<div class="days">${t('days').map((d, i) => `<label><input type="checkbox" value="${i}" ${b.schedule.days.map(Number).includes(i) ? 'checked' : ''}>${d}</label>`).join('')}</div></div>
        ${inp('b-times', 'times', b.schedule.times.join(', '), 'class="ltr" placeholder="12:00, 19:30"')}
        <label class="switch"><input type="checkbox" id="b-auto" ${b.autoApprove ? 'checked' : ''}>${t('autoApprove')}</label>
      </section>
      <section class="card"><div><h2>${t('catTitle')}</h2><p class="muted small">${t('catLead')}</p></div>
        <div class="grid2"><label class="field" for="c-src">${t('source')}<select id="c-src">${[['none', t('none')], ['dukkan', 'Dukkan'], ['woocommerce', 'WooCommerce'], ['shopify', 'Shopify']].map(([v, l]) => `<option value="${v}" ${b.catalog.source === v ? 'selected' : ''}>${l}</option>`).join('')}</select></label>
          ${inp('c-url', 'storeUrl', b.catalog.url, 'class="ltr" placeholder="https://shop.example.com"')}</div>
        <div class="row"><button class="btn" id="c-sync" type="button">${t('syncNow')}</button><span class="small" id="c-st">${b.catalog.error ? `<span class="pill bad">${esc(b.catalog.error)}</span>` : b.catalog.syncedAt ? `<span class="pill good">${b.catalog.count} ${t('products')}</span>` : ''}</span></div>
      </section>
      <section class="stack"><h2>${t('chTitle')}</h2><div class="grid2">
        ${chCard('facebook', 'Facebook', [['pageId', 'fbPage'], ['pageToken', 'fbToken']])}
        ${chCard('instagram', 'Instagram', [['igUserId', 'igUser'], ['token', 'igToken']])}
        ${chCard('telegram', 'Telegram', [['botToken', 'tgBot'], ['chatId', 'tgChat']])}
      </div></section>
      <div class="row" style="position:sticky;bottom:0;padding:12px 0;background:var(--bg)"><button class="btn primary" id="bsave" type="button">${t('save')}</button><span class="spacer"></span>${state.brands.length > 1 ? `<button class="btn danger" id="bdel" type="button">${t('delBrand')}</button>` : ''}</div>
    </div>`;
    const collect = () => ({
      name: $('#b-name').value, audience: $('#b-aud').value, description: $('#b-desc').value, offers: $('#b-off').value, dialect: $('#b-dia').value, tone: $('#b-tone').value, hashtags: $('#b-tags').value, cta: $('#b-cta').value,
      autoApprove: $('#b-auto').checked,
      schedule: { days: $$('.days input:checked', main).map((i) => Number(i.value)), times: $('#b-times').value.split(/[,،\s]+/).filter(Boolean) },
      catalog: { source: $('#c-src').value, url: $('#c-url').value },
      channels: {
        facebook: { enabled: $('#ch-facebook').checked, pageId: $('#ch-facebook-pageId').value, pageToken: $('#ch-facebook-pageToken').value },
        instagram: { enabled: $('#ch-instagram').checked, igUserId: $('#ch-instagram-igUserId').value, token: $('#ch-instagram-token').value },
        telegram: { enabled: $('#ch-telegram').checked, botToken: $('#ch-telegram-botToken').value, chatId: $('#ch-telegram-chatId').value },
      },
    });
    const save = async () => { await api(`/api/brands/${b.id}`, { method: 'PUT', body: { brand: collect() } }); state.brands = (await api('/api/brands')).brands; };
    $('#bsave').onclick = async () => { try { await save(); toast(t('saved')); pBrands(main); } catch (err) { toast(err.message); } };
    if ($('#bsel')) $('#bsel').onchange = () => { state.brandSel = $('#bsel').value; pBrands(main); };
    $('#nb').onclick = async () => { const { brand } = await api('/api/brands', { method: 'POST', body: { name: lang === 'ar' ? 'براند جديد' : 'New brand' } }); state.brandSel = brand.id; pBrands(main); };
    if ($('#bdel')) $('#bdel').onclick = async () => { await api(`/api/brands/${b.id}`, { method: 'DELETE', body: {} }); state.brandSel = null; pBrands(main); };
    $('#c-sync').onclick = async () => { try { await save(); const r = await api(`/api/brands/${b.id}/sync`, { method: 'POST', body: {} }); $('#c-st').innerHTML = r.error ? `<span class="pill bad">${esc(r.error)}</span>` : `<span class="pill good">${r.count} ${t('products')}</span>`; } catch (err) { toast(err.message); } };
    $$('[data-test]', main).forEach((btn) => (btn.onclick = async () => {
      const k = btn.dataset.test;
      btn.disabled = true;
      try { await save(); const { result } = await api(`/api/brands/${b.id}/test`, { method: 'POST', body: { platform: k } }); $('#tr-' + k).innerHTML = result.error ? `<span style="color:var(--bad)">${esc(result.error)}</span>` : `<span style="color:var(--good)">${t('testOk')}</span>`; }
      catch (err) { toast(err.message); }
      btn.disabled = false;
    }));
  }

  // ------------------------------------------------------------------ settings
  async function pSettings(main) {
    const { settings: s, claudeModels, keyFromEnv } = await api('/api/settings');
    const ai = s.ai;
    main.innerHTML = `<div class="page"><div class="page-head"><h1>${t('settings')}</h1></div>
      <form class="card" id="sf" style="max-width:720px"><h2>${t('aiTitle')}</h2>
        <label class="field" for="s-prov">${t('provider')}<select id="s-prov"><option value="anthropic" ${ai.provider === 'anthropic' ? 'selected' : ''}>${t('provAnthropic')}</option><option value="openai" ${ai.provider === 'openai' ? 'selected' : ''}>${t('provOpenai')}</option></select></label>
        <label class="field" for="s-model">${t('model')}<input type="text" id="s-model" class="ltr" list="models" value="${esc(ai.model)}"></label>
        <datalist id="models">${claudeModels.map((m) => `<option value="${esc(m.id)}">${esc(m.label)}</option>`).join('')}</datalist>
        <label class="field" for="s-key">${t('apiKey')}${keyFromEnv ? ` <span class="hint">${t('keyFromEnv')}</span>` : ''}<input type="text" id="s-key" class="ltr" value="${esc(ai.apiKey)}" autocomplete="off"></label>
        <label class="field" for="s-base">${t('baseUrl')}<input type="text" id="s-base" class="ltr" value="${esc(ai.baseUrl)}" placeholder="http://ollama:11434/v1"></label>
        <div class="grid2"><label class="field" for="s-tz">${t('tz')}<input type="text" id="s-tz" class="ltr" value="${esc(s.timezone || state.session.timezone)}"></label>
          <label class="field" for="s-hook">${t('hook')}<input type="text" id="s-hook" class="ltr" value="${esc(s.webhookUrl)}"></label></div>
        <div class="row"><button class="btn primary" type="submit">${t('save')}</button></div></form>
      <form class="card" id="pw" style="max-width:480px"><h2>${t('pwTitle')}</h2>
        <label class="field" for="pw-c">${t('current')}<input type="password" id="pw-c"></label><label class="field" for="pw-n">${t('nextPw')}<input type="password" id="pw-n"></label>
        <div class="err" id="pw-e"></div><div class="row"><button class="btn primary" type="submit">${t('change')}</button></div></form>
      <p class="muted small">Nashr · ${esc(state.session.version)} · MIT</p></div>`;
    $('#sf').onsubmit = async (e) => {
      e.preventDefault();
      try {
        await api('/api/settings', { method: 'PUT', body: { settings: { timezone: $('#s-tz').value, webhookUrl: $('#s-hook').value, ai: { provider: $('#s-prov').value, model: $('#s-model').value, apiKey: $('#s-key').value, baseUrl: $('#s-base').value } } } });
        state.session.timezone = $('#s-tz').value || state.session.timezone;
        toast(t('saved'));
      } catch (err) { toast(err.message); }
    };
    $('#pw').onsubmit = async (e) => { e.preventDefault(); try { await api('/api/password', { method: 'POST', body: { current: $('#pw-c').value, next: $('#pw-n').value } }); toast(t('saved')); $('#pw').reset(); } catch (err) { $('#pw-e').textContent = err.message; } };
  }

  boot();
})();
