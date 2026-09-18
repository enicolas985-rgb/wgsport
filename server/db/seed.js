const { initDatabase } = require('./database');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

async function seed() {
  const db = await initDatabase();

  const schemaPath = path.join(__dirname, 'schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf8');
  db.exec(schema);

  try {
    const productCols = db.prepare('PRAGMA table_info(products)').all();
    if (!productCols.some(col => col.name === 'images')) {
      db.exec('ALTER TABLE products ADD COLUMN images TEXT');
    }

    const categoryCols = db.prepare('PRAGMA table_info(categories)').all();
    if (!categoryCols.some(col => col.name === 'image_url')) {
      db.exec('ALTER TABLE categories ADD COLUMN image_url TEXT');
    }

    const adminExists = db.prepare("SELECT id FROM users WHERE username = 'admin'").get();
    if (!adminExists) {
      const passwordHash = bcrypt.hashSync('admin123', 10);
      db.prepare("INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)").run('admin', passwordHash, 'admin');
    }

    db.prepare("INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)").run('whatsapp_number', '521234567890');

    db.prepare("INSERT OR IGNORE INTO categories (name, slug) VALUES (?, ?)").run('Camisetas', 'camisetas');
    db.prepare("INSERT OR IGNORE INTO categories (name, slug) VALUES (?, ?)").run('Shorts', 'shorts');
    db.prepare("INSERT OR IGNORE INTO categories (name, slug) VALUES (?, ?)").run('Accesorios', 'accesorios');

    const catCamisetas = db.prepare("SELECT id FROM categories WHERE slug = 'camisetas'").get().id;
    const catShorts = db.prepare("SELECT id FROM categories WHERE slug = 'shorts'").get().id;
    const catAccesorios = db.prepare("SELECT id FROM categories WHERE slug = 'accesorios'").get().id;

    const existingProducts = db.prepare("SELECT count(*) as count FROM products").get().count;

    if (existingProducts === 0) {
      db.prepare(`INSERT INTO products (name, description, price, category_id, image_url, sizes, colors, stock, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
        'Camiseta de Entrenamiento Pro', 'Camiseta de alta transpirabilidad ideal para entrenamientos intensos', 499.00, catCamisetas, '', JSON.stringify(['S', 'M', 'L', 'XL']), JSON.stringify(['Negro', 'Azul']), 50, 1
      );
      db.prepare(`INSERT INTO products (name, description, price, category_id, image_url, sizes, colors, stock, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
        'Camiseta Básica DryFit', 'Camiseta básica con tecnología de secado rápido', 299.00, catCamisetas, '', JSON.stringify(['M', 'L']), JSON.stringify(['Blanco', 'Gris']), 100, 1
      );
      db.prepare(`INSERT INTO products (name, description, price, category_id, image_url, sizes, colors, stock, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
        'Short Deportivo Élite', 'Short con bolsillos ocultos y cintura ajustable', 599.00, catShorts, '', JSON.stringify(['S', 'M', 'L']), JSON.stringify(['Negro']), 30, 1
      );
      db.prepare(`INSERT INTO products (name, description, price, category_id, image_url, sizes, colors, stock, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
        'Short Running Ligero', 'Short ultraligero ideal para correr', 450.00, catShorts, '', JSON.stringify(['M', 'L', 'XL']), JSON.stringify(['Rojo', 'Negro']), 45, 1
      );
      db.prepare(`INSERT INTO products (name, description, price, category_id, image_url, sizes, colors, stock, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
        'Gorra Deportiva UV', 'Gorra con protección solar UV50+', 250.00, catAccesorios, '', JSON.stringify(['Unitalla']), JSON.stringify(['Azul Marino', 'Blanco']), 60, 1
      );
      db.prepare(`INSERT INTO products (name, description, price, category_id, image_url, sizes, colors, stock, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
        'Muñequeras Absorbentes', 'Par de muñequeras de alto rendimiento', 150.00, catAccesorios, '', JSON.stringify(['Unitalla']), JSON.stringify(['Negro']), 80, 1
      );
    }

    const existingPromos = db.prepare("SELECT count(*) as count FROM promotions").get().count;
    if (existingPromos === 0) {
      db.prepare(`INSERT INTO promotions (name, type, value, category_id, start_date, end_date, is_active) VALUES (?, ?, ?, ?, ?, ?, ?)`).run(
        'Buen Fin - Camisetas', 'percentage', 20, catCamisetas, '2024-01-01', '2027-12-31', 1
      );
    }

    const existingProductsCat = db.prepare('SELECT id, category_id FROM products').all();
    if (existingProductsCat.length > 0) {
      const insertCat = db.prepare('INSERT OR IGNORE INTO product_categories (product_id, category_id) VALUES (?, ?)');
      existingProductsCat.forEach(p => {
        if (p.category_id) insertCat.run(p.id, p.category_id);
      });
    }

    console.log("Database seeded successfully.");
  } catch (error) {
    console.error("Error seeding database:", error);
  }
}

if (require.main === module) {
  seed();
}

module.exports = seed;
