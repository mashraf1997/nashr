// Reads products from the shop the business already runs, so posts use real
// names and prices: Dukkan, WooCommerce (Store API) or Shopify (products.json). No API keys.

const MAX_PRODUCTS = 2000;

const stripHtml = (html) =>
  String(html || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&#0?39;|&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 300);

const base = (url) => String(url || '').trim().replace(/\/+$/, '');

async function getJson(url) {
  const res = await fetch(url, { headers: { accept: 'application/json' }, signal: AbortSignal.timeout(30_000) });
  if (!res.ok) throw new Error(`${url} answered HTTP ${res.status}`);
  return res.json();
}

// ---------- Dukkan ----------
export async function fetchDukkan(url) {
  const res = await fetch(base(url) + '/', { signal: AbortSignal.timeout(30_000) });
  if (!res.ok) throw new Error(`Dukkan answered HTTP ${res.status}`);
  const html = await res.text();
  const m = html.match(/window\.DUKKAN=(\{[\s\S]*?\});<\/script>/);
  if (!m) throw new Error('This page does not look like a Dukkan store');
  const data = JSON.parse(m[1]);
  return {
    shop: {
      name: data.shop?.name || '',
      currency: data.shop?.currency || '',
      deliveryFee: data.shop?.deliveryFee || 0,
      freeDeliveryOver: data.shop?.freeDeliveryOver || 0,
      minOrder: data.shop?.minOrder || 0,
      methods: data.shop?.methods || [],
      acceptingOrders: data.shop?.acceptingOrders !== false,
    },
    products: (data.products || []).slice(0, MAX_PRODUCTS).map((p) => ({
      id: String(p.id),
      name: p.name,
      description: p.description || '',
      price: p.price,
      variants: (p.variants || []).map((v) => ({ name: v.name, price: v.price })),
      available: p.available !== false,
    })),
  };
}

// ---------- WooCommerce (Store API, public) ----------
export async function fetchWooCommerce(url) {
  const products = [];
  let currency = '';
  for (let page = 1; page <= 20 && products.length < MAX_PRODUCTS; page++) {
    const list = await getJson(`${base(url)}/wp-json/wc/store/v1/products?per_page=100&page=${page}`);
    if (!Array.isArray(list) || !list.length) break;
    for (const p of list) {
      const minor = Number(p.prices?.currency_minor_unit ?? 2);
      const price = Number(p.prices?.price || 0) / 10 ** minor;
      currency = currency || p.prices?.currency_code || '';
      products.push({
        id: String(p.id),
        name: stripHtml(p.name),
        description: stripHtml(p.short_description || p.description),
        price,
        variants: [],
        available: p.is_in_stock !== false && p.is_purchasable !== false,
        url: p.permalink || '',
      });
    }
    if (list.length < 100) break;
  }
  return { shop: { currency }, products };
}

// ---------- Shopify (public products.json) ----------
export async function fetchShopify(url) {
  const products = [];
  for (let page = 1; page <= 10 && products.length < MAX_PRODUCTS; page++) {
    const data = await getJson(`${base(url)}/products.json?limit=250&page=${page}`);
    const list = data.products || [];
    if (!list.length) break;
    for (const p of list) {
      const variants = (p.variants || []).filter((v) => v.title !== 'Default Title');
      products.push({
        id: String(p.id),
        name: p.title,
        description: stripHtml(p.body_html),
        price: Number(p.variants?.[0]?.price || 0),
        variants: variants.map((v) => ({ name: v.title, price: Number(v.price), available: v.available !== false })),
        available: (p.variants || []).some((v) => v.available !== false),
        url: `${base(url)}/products/${p.handle}`,
      });
    }
    if (list.length < 250) break;
  }
  return { shop: {}, products };
}

const FETCHERS = { dukkan: fetchDukkan, woocommerce: fetchWooCommerce, shopify: fetchShopify };

export async function syncBrandCatalog(brand) {
  const c = brand.catalog;
  if (!FETCHERS[c.source] || !c.url) {
    Object.assign(c, { products: [], syncedAt: null, error: null });
    return c;
  }
  try {
    const { products } = await FETCHERS[c.source](c.url);
    Object.assign(c, { products, syncedAt: new Date().toISOString(), error: null });
  } catch (err) {
    c.error = err.message;
  }
  return c;
}
