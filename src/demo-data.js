import crypto from 'node:crypto';
import { defaultData, newBrand } from './store.js';

export function buildDemo(demo) {
  const d = defaultData();
  const ar = demo.lang === 'ar';
  const b = newBrand({ name: ar ? 'بين كافيه' : 'Bean Café', description: ar ? 'كافيه specialty في المعادي' : 'Specialty café downtown', hashtags: ar ? '#بين_كافيه' : '#beancafe', dialect: ar ? 'egyptian' : 'english' });
  for (const ch of ['facebook', 'instagram', 'telegram']) b.channels[ch].enabled = true;
  d.brands.push(b);
  const posts = ar
    ? [['product', 'الكرواسون بتاعنا بيطلع من الفرن الساعة 8 الصبح 🥐\nتعالى بدري قبل ما يخلص!', '#بين_كافيه #فطار', 'published', -2], ['question', 'لاتيه ولا كابتشينو؟ ☕\nقولنا في الكومنتات 👇', '#قهوة', 'published', -1], ['offer', 'عرض الويك إند: أي مشروب ساقع + قطعة كيك بـ 99 جنيه بس 🍰', '#عروض', 'scheduled', 0], ['tip', 'سر القهوة الحلوة؟ البن الطازة. بنحمّص كل أسبوع عندنا 🔥', '#قهوة_مختصة', 'scheduled', 1], ['behind_the_scenes', 'ده أحمد، الباريستا بتاعنا من 3 سنين 💪', '#كواليس', 'scheduled', 2], ['product', 'آيس سبانش لاتيه 🧋 الأكتر طلباً الصيف ده', '#بين_كافيه', 'draft', 3], ['occasion', 'كل سنة وانتو طيبين 🌙', '#مناسبات', 'draft', 5]]
    : [['product', 'Our croissants come out of the oven at 8 am 🥐 Come early!', '#beancafe', 'published', -2], ['question', 'Latte or cappuccino? ☕ Tell us below 👇', '#coffee', 'published', -1], ['offer', 'Weekend deal: any iced drink + cake for $6 🍰', '#deals', 'scheduled', 0], ['tip', 'The secret to great coffee? Fresh beans. We roast every week 🔥', '#specialtycoffee', 'scheduled', 1], ['behind_the_scenes', 'Meet Ahmed, our barista for 3 years 💪', '#team', 'scheduled', 2], ['product', 'Iced Spanish latte 🧋 our summer favourite', '#beancafe', 'draft', 3]];
  for (const [kind, text, hashtags, status, day] of posts) {
    const at = new Date(Date.now() + day * 864e5); at.setUTCHours(17, 0, 0, 0);
    d.posts.push({ id: crypto.randomUUID(), brandId: b.id, kind, text, hashtags, imageIdea: '', image: '', platforms: ['facebook', 'telegram'], scheduledAt: at.toISOString(), status, results: status === 'published' ? { facebook: { id: 'demo' }, telegram: { id: 'demo' } } : {}, publishedAt: status === 'published' ? at.toISOString() : undefined, createdAt: new Date().toISOString() });
  }
  return d;
}

// Canned "AI" output for the public demo, so it never spends the host's API key.
export function demoIdeas(brand, count) {
  const en = brand.dialect === 'english';
  const n = brand.name || (en ? 'our place' : 'المكان');
  const pool = en
    ? [['product', `New at ${n}: something you have to try this week ✨`, 'A close-up of the new item'], ['tip', `A small tip from the ${n} team: ask us for today's special 😉`, 'Staff smiling at the counter'], ['question', 'Morning person or night owl? Tell us below 👇', 'A clock and a cup'], ['offer', `This weekend only: 15% off at ${n} 🎉`, 'A bold 15% sign'], ['behind_the_scenes', 'How our day starts at 7 am ☀️', 'Opening the shop'], ['testimonial', '"Best service in town" — thank you, Sara ❤️', 'A happy customer'], ['occasion', 'Happy holidays from all of us 🌙', 'Festive decorations']]
    : [['product', `جديد في ${n}: حاجة لازم تجربها الأسبوع ده ✨`, 'صورة قريبة للمنتج الجديد'], ['tip', `نصيحة صغيرة من فريق ${n}: اسألنا على عرض النهارده 😉`, 'الفريق مبتسم عند الكاشير'], ['question', 'إنت من بتوع الصبح ولا السهر؟ قولنا في الكومنتات 👇', 'ساعة وكوباية'], ['offer', `الويك إند ده بس: خصم 15% في ${n} 🎉`, 'علامة 15% كبيرة'], ['behind_the_scenes', 'يومنا بيبدأ إزاي الساعة 7 الصبح ☀️', 'فتح المحل'], ['testimonial', '"أحسن خدمة في المنطقة" — شكراً يا سارة ❤️', 'عميلة مبسوطة'], ['occasion', 'كل سنة وانتو طيبين من كلنا 🌙', 'زينة المناسبة']];
  return Array.from({ length: count }, (_, i) => { const [kind, text, imageIdea] = pool[i % pool.length]; return { kind, text, hashtags: brand.hashtags || '', imageIdea }; });
}
