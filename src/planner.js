// Writes post ideas and captions with the AI model, and places them on the calendar.
import { generateJson } from './ai.js';

const DIALECTS = {
  egyptian: 'Egyptian Arabic (عامية مصرية), warm and natural, the way people in Cairo write on Facebook',
  gulf: 'Gulf Arabic (خليجي), natural Saudi/Emirati social media style',
  levantine: 'Levantine Arabic (شامي)',
  msa: 'simple Modern Standard Arabic (فصحى مبسطة)',
  english: 'English',
};

export const KINDS = ['product', 'offer', 'tip', 'behind_the_scenes', 'question', 'testimonial', 'occasion'];

const POSTS_SCHEMA = {
  type: 'object',
  properties: {
    posts: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          kind: { type: 'string', enum: KINDS },
          text: { type: 'string' },
          hashtags: { type: 'string' },
          image_idea: { type: 'string' },
          product_id: { type: 'string' },
        },
        required: ['kind', 'text', 'hashtags', 'image_idea', 'product_id'],
        additionalProperties: false,
      },
    },
  },
  required: ['posts'],
  additionalProperties: false,
};

const REWRITE_SCHEMA = {
  type: 'object',
  properties: { text: { type: 'string' }, hashtags: { type: 'string' } },
  required: ['text', 'hashtags'],
  additionalProperties: false,
};

export function brandBrief(brand) {
  const lines = [
    `Business: ${brand.name}`,
    brand.description && `About: ${brand.description}`,
    brand.audience && `Audience: ${brand.audience}`,
    brand.offers && `Current offers and key products: ${brand.offers}`,
    `Tone: ${brand.tone}`,
    `Language: ${DIALECTS[brand.dialect] || DIALECTS.egyptian}`,
    brand.cta && `Call to action to use when it fits (ordering link or phone): ${brand.cta}`,
    brand.hashtags && `Brand hashtags to include: ${brand.hashtags}`,
  ].filter(Boolean);
  const products = (brand.catalog?.products || []).filter((p) => p.available !== false).slice(0, 80);
  if (products.length) {
    lines.push('Products from the online store (use real names and prices only from here):');
    for (const p of products) {
      const price = p.variants?.length ? p.variants.map((v) => `${v.name} ${v.price}`).join(' / ') : p.price;
      lines.push(`- [${p.id}] ${p.name} — ${price}${p.description ? ` — ${p.description}` : ''}`);
    }
  }
  return lines.join('\n');
}

const SYSTEM = [
  'You are the social media writer for a small business. You write posts for Facebook, Instagram and Telegram.',
  'Rules:',
  '- Write in the language and dialect given in the brief, like a real local business, not like an ad agency.',
  '- Each post: a strong first line, 2 to 6 short lines, a few fitting emojis, and a clear call to action when it fits.',
  '- Only mention prices, products and offers that appear in the brief. Never invent discounts or claims.',
  '- Mix post kinds across the plan: products, offers, useful tips, behind the scenes, questions that invite comments, and occasions.',
  '- hashtags: 3 to 6 relevant hashtags in one line, including the brand hashtags if given.',
  '- image_idea: one short sentence describing a photo the owner can take with a phone.',
  '- product_id: the [id] of the product the post is about, or an empty string.',
].join('\n');

export async function writePlan(ai, brand, { count, theme, occasion }) {
  const prompt = [
    brandBrief(brand),
    '',
    `Write ${count} different posts for the coming days.`,
    theme ? `Focus or campaign: ${theme}` : '',
    occasion ? `Upcoming occasion to mention where natural: ${occasion}` : '',
  ].filter(Boolean).join('\n');
  const out = await generateJson(ai, { system: SYSTEM, prompt, schema: POSTS_SCHEMA });
  const posts = Array.isArray(out?.posts) ? out.posts : Array.isArray(out) ? out : [];
  return posts
    .filter((p) => p && typeof p.text === 'string' && p.text.trim())
    .slice(0, count)
    .map((p) => ({
      kind: KINDS.includes(p.kind) ? p.kind : 'post',
      text: p.text.trim(),
      hashtags: String(p.hashtags || '').trim(),
      imageIdea: String(p.image_idea || '').trim(),
      productId: String(p.product_id || ''),
    }));
}

export async function rewritePost(ai, brand, post, instruction) {
  const prompt = [
    brandBrief(brand),
    '',
    'Rewrite this post.',
    `Instruction from the owner: ${instruction || 'make it more engaging'}`,
    '',
    'Current post:',
    post.text,
    post.hashtags ? `Hashtags: ${post.hashtags}` : '',
  ].join('\n');
  const out = await generateJson(ai, { system: SYSTEM, prompt, schema: REWRITE_SCHEMA });
  return { text: String(out.text || post.text).trim(), hashtags: String(out.hashtags ?? post.hashtags).trim() };
}

// ---------- calendar slots ----------
function tzOffsetMs(ts, tz) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', { timeZone: tz, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' })
      .formatToParts(new Date(ts))
      .map((p) => [p.type, p.value]),
  );
  return Date.UTC(+parts.year, +parts.month - 1, +parts.day, +parts.hour, +parts.minute, +parts.second) - Math.floor(ts / 1000) * 1000;
}

export function zonedToUtc(y, mo, d, h, mi, tz) {
  const guess = Date.UTC(y, mo - 1, d, h, mi);
  let ts = guess - tzOffsetMs(guess, tz);
  ts = guess - tzOffsetMs(ts, tz);
  return ts;
}

/**
 * Next `count` free posting slots from `startDate` (YYYY-MM-DD, local) using the brand's
 * posting days and times, skipping slots already taken by this brand's posts.
 */
export function nextSlots(brand, posts, { startDate, count, tz, now = Date.now() }) {
  const days = (brand.schedule.days?.length ? brand.schedule.days : [0, 1, 2, 3, 4, 5, 6]).map(Number);
  const times = (brand.schedule.times?.length ? brand.schedule.times : ['19:00']).filter((t) => /^\d{1,2}:\d{2}$/.test(t)).sort();
  const taken = new Set(posts.filter((p) => p.brandId === brand.id && p.scheduledAt && p.status !== 'failed').map((p) => Date.parse(p.scheduledAt)));
  const [y, m, d] = String(startDate).split('-').map(Number);
  const slots = [];
  for (let i = 0; i < 400 && slots.length < count; i++) {
    const day = new Date(Date.UTC(y, m - 1, d + i));
    if (!days.includes(day.getUTCDay())) continue;
    for (const t of times) {
      const [hh, mm] = t.split(':').map(Number);
      const ts = zonedToUtc(day.getUTCFullYear(), day.getUTCMonth() + 1, day.getUTCDate(), hh, mm, tz);
      if (ts <= now + 10 * 60_000 || taken.has(ts)) continue;
      slots.push(new Date(ts).toISOString());
      if (slots.length >= count) break;
    }
  }
  return slots;
}
