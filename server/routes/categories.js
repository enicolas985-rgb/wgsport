const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const { getDb } = require('../db/postgres');
const auth = require('../middleware/auth');

router.get('/', async (req, res) => {
  try {
    const db = getDb();
    const categories = await db.prepare(`
      SELECT c.*, (
        SELECT COUNT(DISTINCT pc.product_id)
        FROM product_categories pc
        WHERE pc.category_id = c.id
      ) as product_count
      FROM categories c
      GROUP BY c.id
    `).all();
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener categorías.' });
  }
});

router.post('/', auth, async (req, res) => {
  const { name, description, image_url } = req.body;
  if (!name) return res.status(400).json({ error: 'Nombre es requerido' });

  const slug = name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');

  try {
    const db = getDb();
    const info = await db.prepare(`
      INSERT INTO categories (name, slug, description, image_url) VALUES (?, ?, ?, ?)
    `).run(name, slug, description || null, image_url || null);
    res.status(201).json({ id: info.lastInsertRowid, message: 'Categoría creada' });
  } catch (error) {
    if (error.message && /UNIQUE|duplicate key/i.test(error.message)) {
      return res.status(400).json({ error: 'La categoría ya existe.' });
    }
    res.status(500).json({ error: 'Error al crear categoría.' });
  }
});

router.put('/:id', auth, async (req, res) => {
  const { name, description, image_url } = req.body;
  const slug = name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');
  try {
    const db = getDb();
    await db.prepare(`
      UPDATE categories SET name = ?, slug = ?, description = ?, image_url = ? WHERE id = ?
    `).run(name, slug, description || null, image_url || null, req.params.id);
    res.json({ message: 'Categoría actualizada' });
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar categoría.' });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const db = getDb();
    const primaryCountRow = await db.prepare('SELECT count(*) as count FROM products WHERE category_id = ?').get(req.params.id);
    const primaryCount = Number(primaryCountRow ? primaryCountRow.count : 0);
    if (primaryCount > 0) {
      return res.status(400).json({ error: 'No se puede eliminar la categoría porque tiene productos asociados.' });
    }

    const category = await db.prepare('SELECT image_url FROM categories WHERE id = ?').get(req.params.id);
    if (category && category.image_url && category.image_url.startsWith('/uploads/')) {
      const filename = path.basename(category.image_url);
      const fullPath = path.join(__dirname, '..', 'uploads', filename);
      const uploadsDir = path.join(__dirname, '..', 'uploads');
      if (fullPath.startsWith(uploadsDir) && fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
      }
      try {
        await db.prepare('DELETE FROM uploads WHERE filename = ?').run(filename);
      } catch (e) {
        // tabla uploads solo existe en modo Postgres
      }
    }

    await db.prepare('DELETE FROM product_categories WHERE category_id = ?').run(req.params.id);
    await db.prepare('DELETE FROM categories WHERE id = ?').run(req.params.id);
    res.json({ message: 'Categoría eliminada' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar categoría.' });
  }
});

module.exports = router;