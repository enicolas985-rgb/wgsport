require('dotenv').config();
const bcrypt = require('bcryptjs');
const { initDatabase, saveDatabase } = require('./postgres');

const DEMO_CATEGORY_SLUGS = ['shorts', 'accesorios', 'camisetas'];
const DEMO_PRODUCT_NAMES = ['nike air force 1'];
const DEMO_PROMO_NAME = 'blackfraiday';
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'wgsport1%';

function placeholders(n) {
  return Array(n).fill('?').join(', ');
}

async function cleanupDemo(db) {
  const deletes = { promotions: 0, products: 0, categories: 0, links: 0 };

  await db.prepare(`UPDATE promotions SET product_id = NULL, category_id = NULL WHERE LOWER(COALESCE(name,'')) = ?`).run(DEMO_PROMO_NAME);

  const catPh = placeholders(DEMO_CATEGORY_SLUGS.length);
  const prodPh = placeholders(DEMO_PRODUCT_NAMES.length);

  const promo = await db.prepare(`DELETE FROM promotions WHERE LOWER(COALESCE(name,'')) = ?`).run(DEMO_PROMO_NAME);
  deletes.promotions += promo.changes || 0;

  const prodLinks = await db.prepare(`DELETE FROM product_categories WHERE product_id IN (SELECT id FROM products WHERE LOWER(COALESCE(name,'')) IN (${prodPh}))`).run(...DEMO_PRODUCT_NAMES);
  deletes.links += prodLinks.changes || 0;

  const catLinks = await db.prepare(`DELETE FROM product_categories WHERE category_id IN (SELECT id FROM categories WHERE LOWER(COALESCE(slug,'')) IN (${catPh}))`).run(...DEMO_CATEGORY_SLUGS);
  deletes.links += catLinks.changes || 0;

  const prods = await db.prepare(`DELETE FROM products WHERE LOWER(COALESCE(name,'')) IN (${prodPh})`).run(...DEMO_PRODUCT_NAMES);
  deletes.products += prods.changes || 0;

  const cats = await db.prepare(`DELETE FROM categories WHERE LOWER(COALESCE(slug,'')) IN (${catPh})`).run(...DEMO_CATEGORY_SLUGS);
  deletes.categories += cats.changes || 0;

  const orphans = await db.prepare('DELETE FROM product_categories WHERE product_id NOT IN (SELECT id FROM products) OR category_id NOT IN (SELECT id FROM categories)').run();
  deletes.links += orphans.changes || 0;

  return deletes;
}

async function setAdminPassword(db) {
  const hash = bcrypt.hashSync(ADMIN_PASSWORD, 10);
  const existing = await db.prepare('SELECT id FROM users WHERE username = ?').get(ADMIN_USERNAME);
  if (existing) {
    await db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(hash, existing.id);
    return 'actualizada';
  }
  await db.prepare('INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)').run(ADMIN_USERNAME, hash, 'admin');
  return 'creada';
}

async function run() {
  const db = await initDatabase();
  const deletes = await cleanupDemo(db);
  const adminResult = await setAdminPassword(db);
  if (typeof saveDatabase === 'function') {
    await saveDatabase();
  }
  console.log('Limpieza completada. Eliminado: ' + JSON.stringify(deletes));
  console.log('Admin "' + ADMIN_USERNAME + '": contraseña ' + adminResult + ' -> "' + ADMIN_PASSWORD + '"');
}

if (require.main === module) {
  run()
    .then(() => process.exit(0))
    .catch((err) => { console.error(err); process.exit(1); });
}

module.exports = { cleanupDemo, setAdminPassword, run };
