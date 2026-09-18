require('dotenv').config();
const { initDatabase } = require('./postgres');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const usePg = !!process.env.DATABASE_URL;

async function seed() {
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

    const adminExists = await db.prepare('SELECT id FROM users WHERE username = ?').get('admin');
    if (!adminExists) {
      const passwordHash = bcrypt.hashSync('admin123', 10);
      await db.prepare('INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)').run('admin', passwordHash, 'admin');
    }

    await db.prepare('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)').run('whatsapp_number', '521234567890');

    await db.prepare('INSERT OR IGNORE INTO categories (name, slug) VALUES (?, ?)').run('Camisetas', 'camisetas');
    await db.prepare('INSERT OR IGNORE INTO categories (name, slug) VALUES (?, ?)').run('Shorts', 'shorts');
    await db.prepare('INSERT OR IGNORE INTO categories (name, slug) VALUES (?, ?)').run('Accesorios', 'accesorios');

    const catCamisetas = (await db.prepare("SELECT id FROM categories WHERE slug = 'camisetas'").get()).id;
    const catShorts = (await db.prepare("SELECT id FROM categories WHERE slug = 'shorts'").get()).id;
    const catAccesorios = (await db.prepare("SELECT id FROM categories WHERE slug = 'accesorios'").get()).id;

    const existingProducts = await db.prepare('SELECT count(*) as count FROM products').get();

    if (existingProducts && Number(existingProducts.count) === 0) {
      await db.prepare(`INSERT INTO products (name, description, price, category_id, image_url, sizes, colors, stock, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
        'Camiseta de Entrenamiento Pro', 'Camiseta de alta transpirabilidad ideal para entrenamientos intensos', 499.00, catCamisetas, '', JSON.stringify(['S', 'M', 'L', 'XL']), JSON.stringify(['Negro', 'Azul']), 50, true
      );
      await db.prepare(`INSERT INTO products (name, description, price, category_id, image_url, sizes, colors, stock, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
        'Camiseta Básica DryFit', 'Camiseta básica con tecnología de secado rápido', 299.00, catCamisetas, '', JSON.stringify(['M', 'L']), JSON.stringify(['Blanco', 'Gris']), 100, true
      );
      await db.prepare(`INSERT INTO products (name, description, price, category_id, image_url, sizes, colors, stock, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
        'Short Deportivo Élite', 'Short con bolsillos ocultos y cintura ajustable', 599.00, catShorts, '', JSON.stringify(['S', 'M', 'L']), JSON.stringify(['Negro']), 30, true
      );
      await db.prepare(`INSERT INTO products (name, description, price, category_id, image_url, sizes, colors, stock, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
        'Short Running Ligero', 'Short ultraligero ideal para correr', 450.00, catShorts, '', JSON.stringify(['M', 'L', 'XL']), JSON.stringify(['Rojo', 'Negro']), 45, true
      );
      await db.prepare(`INSERT INTO products (name, description, price, category_id, image_url, sizes, colors, stock, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
        'Gorra Deportiva UV', 'Gorra con protección solar UV50+', 250.00, catAccesorios, '', JSON.stringify(['Unitalla']), JSON.stringify(['Azul Marino', 'Blanco']), 60, true
      );
      await db.prepare(`INSERT INTO products (name, description, price, category_id, image_url, sizes, colors, stock, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
        'Muñequeras Absorbentes', 'Par de muñequeras de alto rendimiento', 150.00, catAccesorios, '', JSON.stringify(['Unitalla']), JSON.stringify(['Negro']), 80, true
      );
    }

    const existingPromos = await db.prepare('SELECT count(*) as count FROM promotions').get();
    if (existingPromos && Number(existingPromos.count) === 0) {
      await db.prepare(`INSERT INTO promotions (name, type, value, category_id, start_date, end_date, is_active) VALUES (?, ?, ?, ?, ?, ?, ?)`).run(
        'Buen Fin - Camisetas', 'percentage', 20, catCamisetas, '2024-01-01', '2027-12-31', true
      );
    }

    const existingProductsCat = await db.prepare('SELECT id, category_id FROM products').all();
    if (existingProductsCat.length > 0) {
      const insertCat = db.prepare('INSERT OR IGNORE INTO product_categories (product_id, category_id) VALUES (?, ?)');
      for (const p of existingProductsCat) {
        if (p.category_id) await insertCat.run(p.id, p.category_id);
      }
    }

    console.log('Database seeded successfully.');
  } catch (error) {
    console.error('Error seeding database:', error);
  }
}

if (require.main === module) {
  seed();
}

module.exports = seed;