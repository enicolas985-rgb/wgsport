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
      const passwordHash = bcrypt.hashSync('wgsport1%', 10);
      await db.prepare('INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)').run('admin', passwordHash, 'admin');
    }

    await db.prepare('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)').run('whatsapp_number', '521234567890');

    console.log('Database seeded successfully.');
  } catch (error) {
    console.error('Error seeding database:', error);
  }
}

if (require.main === module) {
  seed();
}

module.exports = seed;