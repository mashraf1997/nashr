import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createApp } from '../src/app.js';

let app, base, jar, dataDir;
before(async () => {
  dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'demo-'));
  app = createApp({ dataDir, env: { DEMO_MODE: 'true' } });
  base = `http://127.0.0.1:${await app.start(0)}`;
});
after(async () => {
  await app.stop();
  fs.rmSync(dataDir, { recursive: true, force: true });
});
async function call(p, { method = 'GET', body, auth = true } = {}) {
  const res = await fetch(base + p, { method, headers: { ...(body !== undefined ? { 'content-type': 'application/json' } : {}), ...(auth && jar ? { cookie: jar } : {}) }, body: body !== undefined ? JSON.stringify(body) : undefined });
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch { json = text; }
  return { status: res.status, body: json, headers: res.headers };
}
async function signIn() {
  const s = await call('/api/session', { auth: false });
  assert.deepEqual(s.body.demo, { password: 'demo1234', resetMinutes: 60 });
  assert.equal(s.body.needsSetup, false, 'the demo is ready to use');
  assert.equal((await call('/api/setup', { method: 'POST', body: { password: 'takeover-123' }, auth: false })).status, 403);
  const r = await call('/api/login', { method: 'POST', body: { password: 'demo1234' }, auth: false });
  assert.equal(r.status, 200);
  jar = r.headers.get('set-cookie').split(';')[0];
  assert.equal((await call('/api/password', { method: 'POST', body: { current: 'demo1234', next: 'changed-pass-1' } })).status, 403);
}

test('demo: sample brand and calendar; AI and publishing are simulated', async () => {
  await signIn();
  let r = await call('/api/overview');
  assert.equal(r.body.aiReady, true);
  assert.ok(r.body.scheduled >= 1);
  const brand = app.store.data.brands[0];
  r = await call('/api/generate', { method: 'POST', body: { brandId: brand.id, count: 3 } });
  assert.equal(r.body.posts.length, 3, 'canned ideas, no API key needed');
  const post = app.store.data.posts.find((x) => x.status === 'scheduled');
  r = await call(`/api/posts/${post.id}/publish`, { method: 'POST', body: {} });
  assert.equal(r.body.post.status, 'published');
  assert.equal((await call(`/api/brands/${brand.id}/test`, { method: 'POST', body: { platform: 'telegram' } })).status, 403);
  await call('/api/brands/' + brand.id, { method: 'PUT', body: { brand: { channels: { telegram: { botToken: '1:x', chatId: '@x' } } } } });
  assert.equal(app.store.data.brands[0].channels.telegram.botToken, '');
  assert.equal((await call('/api/settings', { method: 'PUT', body: { settings: { webhookUrl: 'http://x' } } })).status, 403);
});
