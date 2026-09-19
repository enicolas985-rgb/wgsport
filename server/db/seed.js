require('dotenv').config();
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const { initDatabase, saveDatabase } = require('./postgres');

const usePg = !!process.env.DATABASE_URL;

const DEMO_CATEGORY_SLUGS = ['shorts', 'accesorios', 'camisetas'];
const DEMO_PRODUCT_NAMES = ['nike air force 1'];
const DEMO_PROMO_NAME = 'blackfraiday';
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'wgsport1%';

function ph(n) {
  return Array(n).fill('?').join(', ');
}

async function removeDemoData(db) {
  const catPh = ph(DEMO_CATEGORY_SLUGS.length);
  const prodPh = ph(DEMO_PRODUCT_NAMES.length);

  await db.prepare("UPDATE promotions SET product_id = NULL, category_id = NULL WHERE LOWER(COALESCE(name,'')) = ?").run(DEMO_PROMO_NAME);

  await db.prepare("DELETE FROM product_categories WHERE category_id IN (SELECT id FROM categories WHERE LOWER(COALESCE(slug,'')) IN (" + catPh + "))").run(...DEMO_CATEGORY_SLUGS);
  await db.prepare("DELETE FROM product_categories WHERE product_id IN (SELECT id FROM products WHERE LOWER(COALESCE(name,'')) IN (" + prodPh + "))").run(...DEMO_PRODUCT_NAMES);

  await db.prepare("DELETE FROM promotions WHERE LOWER(COALESCE(name,'')) = ?").run(DEMO_PROMO_NAME);
  await db.prepare("DELETE FROM products WHERE LOWER(COALESCE(name,'')) IN (" + prodPh + ")").run(...DEMO_PRODUCT_NAMES);
  await db.prepare("DELETE FROM categories WHERE LOWER(COALESCE(slug,'')) IN (" + catPh + ")").run(...DEMO_CATEGORY_SLUGS);

  await db.prepare('DELETE FROM product_categories WHERE product_id NOT IN (SELECT id FROM products) OR category_id NOT IN (SELECT id FROM categories)').run();
}

async function seed() {
  console.log('[seed] Backend de base de datos: ' + (usePg ? 'PostgreSQL/Neon (DATABASE_URL)' : 'SQLite local'));
  if (usePg) {
    console.log('[seed] Objetivo: limpiar demo (shorts/accesorios/camisetas, Nike Air Force 1, BlackFraiday) y fijar admin: ' + ADMIN_USERNAME + ' / ' + ADMIN_PASSWORD);
  }
  const db = await initDatabase();

  const schemaPath = path.join(__dirname, usePg ? 'schema.pg.sql' : 'schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf8');
  await db.exec(schema);

  try {
    if (usePg) {
      await db.exec('ALTER TABLE products ADD COLUMN IF NOT EXISTS images TEXT');
      await db.exec('ALTER TABLE categories ADD COLUMN IF NOT EXISTS image_url TEXT');
    } else {
      const productCols = await db.prepare('PRAGMA table_info(products)').all();
      if (!productCols.some(col => col.name === 'images')) {
        await db.exec('ALTER TABLE products ADD COLUMN images TEXT');
      }
      const categoryCols = await db.prepare('PRAGMA table_info(categories)').all();
      if (!categoryCols.some(col => col.name === 'image_url')) {
        await db.exec('ALTER TABLE categories ADD COLUMN image_url TEXT');
      }
    }

    await removeDemoData(db);

    const passwordHash = bcrypt.hashSync(ADMIN_PASSWORD, 10);
    const admin = await db.prepare('SELECT id FROM users WHERE username = ?').get(ADMIN_USERNAME);
    if (admin) {
      await db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(passwordHash, admin.id);
    } else {
      await db.prepare('INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)').run(ADMIN_USERNAME, passwordHash, 'admin');
    }

    await db.prepare('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)').run('whatsapp_number', '521234567890');

    if (typeof saveDatabase === 'function') {
      await Promise.resolve(saveDatabase()).catch(() => {});
    }

    console.log('Database seeded; demo data removed; admin password set to "' + ADMIN_PASSWORD + '".');
  } catch (error) {
    console.error('Error seeding database:', error);
  }
}

if (require.main === module) {
  seed();
}

module.exports = seed;
