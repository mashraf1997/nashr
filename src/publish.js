// Publishes one post to Facebook Pages, Instagram (Business/Creator) and Telegram channels.
import fs from 'node:fs';

const GRAPH = () => `${process.env.META_GRAPH_URL || 'https://graph.facebook.com'}/${process.env.META_GRAPH_VERSION || 'v23.0'}`;
const TG = () => process.env.TELEGRAM_API_URL || 'https://api.telegram.org';

export const PLATFORMS = ['facebook', 'instagram', 'telegram'];

export function fullText(post) {
  return [post.text, post.hashtags].filter(Boolean).join('\n\n');
}

async function json(res) {
  const body = await res.json().catch(() => ({}));
  if (!res.ok || body.error || body.ok === false) {
    throw new Error(body.error?.message || body.description || `HTTP ${res.status}`);
  }
  return body;
}

async function publishFacebook(ch, post, imagePath, mime) {
  if (!ch.pageId || !ch.pageToken) throw new Error('Facebook Page ID and token are missing');
  if (imagePath) {
    const form = new FormData();
    form.append('caption', fullText(post));
    form.append('access_token', ch.pageToken);
    form.append('source', new Blob([fs.readFileSync(imagePath)], { type: mime }), 'image');
    const out = await json(await fetch(`${GRAPH()}/${ch.pageId}/photos`, { method: 'POST', body: form }));
    const id = out.post_id || out.id;
    return { id, url: `https://www.facebook.com/${id}` };
  }
  const out = await json(await fetch(`${GRAPH()}/${ch.pageId}/feed`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ message: fullText(post), access_token: ch.pageToken }),
  }));
  return { id: out.id, url: `https://www.facebook.com/${out.id}` };
}

async function publishInstagram(ch, post, imageUrl) {
  if (!ch.igUserId || !ch.token) throw new Error('Instagram account ID and token are missing');
  if (!imageUrl) throw new Error('Instagram needs a photo: add one to this post');
  const container = await json(await fetch(`${GRAPH()}/${ch.igUserId}/media`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ image_url: imageUrl, caption: fullText(post).slice(0, 2200), access_token: ch.token }),
  }));
  // Wait until Instagram has fetched and processed the image.
  for (let i = 0; i < 10; i++) {
    const st = await json(await fetch(`${GRAPH()}/${container.id}?fields=status_code&access_token=${encodeURIComponent(ch.token)}`));
    if (!st.status_code || st.status_code === 'FINISHED') break;
    if (st.status_code === 'ERROR' || st.status_code === 'EXPIRED') throw new Error(`Instagram could not process the image (${st.status_code})`);
    await new Promise((r) => setTimeout(r, Number(process.env.IG_POLL_MS || 3000)));
  }
  const out = await json(await fetch(`${GRAPH()}/${ch.igUserId}/media_publish`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ creation_id: container.id, access_token: ch.token }),
  }));
  return { id: out.id, url: '' };
}

async function publishTelegram(ch, post, imagePath, mime) {
  if (!ch.botToken || !ch.chatId) throw new Error('Telegram bot token and channel are missing');
  const text = fullText(post);
  const base = `${TG()}/bot${ch.botToken}`;
  if (imagePath) {
    const form = new FormData();
    form.append('chat_id', ch.chatId);
    form.append('photo', new Blob([fs.readFileSync(imagePath)], { type: mime }), 'image');
    if (text.length <= 1024) form.append('caption', text);
    const out = await json(await fetch(`${base}/sendPhoto`, { method: 'POST', body: form }));
    if (text.length > 1024) await json(await fetch(`${base}/sendMessage`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ chat_id: ch.chatId, text }) }));
    return { id: String(out.result?.message_id || ''), url: '' };
  }
  const out = await json(await fetch(`${base}/sendMessage`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ chat_id: ch.chatId, text }) }));
  return { id: String(out.result?.message_id || ''), url: '' };
}

/**
 * Publish to every selected platform. Returns { results, ok } where results[platform] = { id?, url?, error?, at }.
 * Platforms that already succeeded earlier are skipped, so a retry never double-posts.
 */
export async function publishPost(store, post, brand) {
  const imagePath = post.image ? store.mediaPath(post.image) : null;
  const mime = post.image?.endsWith('.png') ? 'image/png' : post.image?.endsWith('.webp') ? 'image/webp' : 'image/jpeg';
  const publicBase = store.data.meta.publicUrl;
  const imageUrl = imagePath && publicBase ? `${publicBase}/media/public/${post.image}` : null;
  const results = { ...(post.results || {}) };
  for (const platform of post.platforms) {
    if (results[platform]?.id) continue;
    const ch = brand.channels[platform];
    try {
      if (!ch?.enabled) throw new Error(`${platform} is not connected for this brand`);
      let r;
      if (platform === 'facebook') r = await publishFacebook(ch, post, imagePath, mime);
      else if (platform === 'instagram') r = await publishInstagram(ch, post, imageUrl);
      else if (platform === 'telegram') r = await publishTelegram(ch, post, imagePath, mime);
      results[platform] = { ...r, at: new Date().toISOString() };
    } catch (err) {
      results[platform] = { error: err.message, at: new Date().toISOString() };
    }
  }
  const ok = post.platforms.length > 0 && post.platforms.every((p) => results[p]?.id);
  return { results, ok };
}
