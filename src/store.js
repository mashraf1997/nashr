// JSON-file database: one file, atomic writes, no native modules.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

export function newBrand(fields = {}) {
  return {
    id: crypto.randomUUID(),
    name: '',
    description: '',
    audience: '',
    offers: '',
    tone: 'friendly',
    dialect: 'egyptian', // egyptian | gulf | levantine | msa | english
    hashtags: '',
    cta: '',
    color: '#C2410C',
    schedule: { days: [0, 1, 2, 3, 4, 5, 6], times: ['19:00'] },
    autoApprove: false,
    catalog: { source: 'none', url: '', products: [], syncedAt: null, error: null },
    channels: {
      facebook: { enabled: false, pageId: '', pageToken: '' },
      instagram: { enabled: false, igUserId: '', token: '' },
      telegram: { enabled: false, botToken: '', chatId: '' },
    },
    createdAt: new Date().toISOString(),
    ...fields,
  };
}

export function defaultData() {
  return {
    version: 1,
    meta: { secret: crypto.randomBytes(32).toString('hex'), createdAt: new Date().toISOString(), publicUrl: '' },
    admin: null,
    settings: {
      ai: { provider: 'anthropic', model: 'claude-opus-5-5', apiKey: '', baseUrl: '', effort: 'medium' },
      timezone: '',
      webhookUrl: '',
    },
    brands: [],
    posts: [],
  };
}

export class Store {
  constructor(dataDir) {
    this.dataDir = dataDir;
    this.file = path.join(dataDir, 'nashr.json');
    fs.mkdirSync(dataDir, { recursive: true });
    if (fs.existsSync(this.file)) {
      const loaded = JSON.parse(fs.readFileSync(this.file, 'utf8'));
      this.data = { ...defaultData(), ...loaded, settings: { ...defaultData().settings, ...loaded.settings, ai: { ...defaultData().settings.ai, ...loaded.settings?.ai } } };
      this.data.brands = this.data.brands.map((b) => {
        const base = newBrand();
        return { ...base, ...b, schedule: { ...base.schedule, ...b.schedule }, catalog: { ...base.catalog, ...b.catalog }, channels: { facebook: { ...base.channels.facebook, ...b.channels?.facebook }, instagram: { ...base.channels.instagram, ...b.channels?.instagram }, telegram: { ...base.channels.telegram, ...b.channels?.telegram } } };
      });
    } else {
      this.data = defaultData();
      this.flush();
    }
  }

  save() {
    clearTimeout(this.timer);
    this.timer = setTimeout(() => this.flush(), 200);
  }

  flush() {
    clearTimeout(this.timer);
    fs.writeFileSync(this.file + '.tmp', JSON.stringify(this.data));
    fs.renameSync(this.file + '.tmp', this.file);
  }

  brand(id) {
    return this.data.brands.find((b) => b.id === id) || null;
  }

  addPost(fields) {
    const p = {
      id: crypto.randomUUID(),
      brandId: '',
      kind: 'post',
      text: '',
      hashtags: '',
      imageIdea: '',
      image: '',
      platforms: [],
      scheduledAt: null,
      status: 'draft',
      results: {},
      createdAt: new Date().toISOString(),
      ...fields,
    };
    this.data.posts.push(p);
    this.save();
    return p;
  }

  get mediaDir() {
    const dir = path.join(this.dataDir, 'media');
    fs.mkdirSync(dir, { recursive: true });
    return dir;
  }

  saveMedia(buffer, mime) {
    const ext = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' }[mime] || 'bin';
    const file = `${crypto.randomUUID()}.${ext}`;
    fs.writeFileSync(path.join(this.mediaDir, file), buffer);
    return file;
  }

  mediaPath(file) {
    if (!/^[\w-]+\.(jpg|png|webp)$/.test(file || '')) return null;
    const full = path.join(this.mediaDir, file);
    return fs.existsSync(full) ? full : null;
  }
}
