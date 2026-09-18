const express = require('express');
const router = express.Router();
const { getDb } = require('../db/postgres');
const auth = require('../middleware/auth');
const { notifyPromotion } = require('../services/mailer');

router.get('/', async (req, res) => {
  try {
    const db = getDb();
    const promotions = await db.prepare(`
      SELECT pr.*, p.name as product_name, c.name as category_name
      FROM promotions pr
      LEFT JOIN products p ON pr.product_id = p.id
      LEFT JOIN categories c ON pr.category_id = c.id
    `).all();
    res.json(promotions);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener promociones.' });
  }
});

router.post('/', auth, async (req, res) => {
  const { name, type, value, product_id, category_id, start_date, end_date, is_active } = req.body;
  try {
    const db = getDb();
    const active = is_active !== undefined ? !!is_active : true;
    const info = await db.prepare(`
      INSERT INTO promotions (name, type, value, product_id, category_id, start_date, end_date, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(name, type, value, product_id || null, category_id || null, start_date, end_date, active);
    const promotionId = info.lastInsertRowid;
    const promotion = { id: promotionId, name, type, value, product_id, category_id, start_date, end_date, is_active: active };
    notifyPromotion(promotion).catch(err => console.error('Error notificando promoción:', err.message));
    res.status(201).json({ id: promotionId, message: 'Promoción creada' });
  } catch (error) {
    res.status(500).json({ error: 'Error al crear promoción.' });
  }
});

router.put('/:id', auth, async (req, res) => {
  const { name, type, value, product_id, category_id, start_date, end_date, is_active } = req.body;
  try {
    const db = getDb();
    const active = is_active !== undefined ? !!is_active : is_active;
    await db.prepare(`
      UPDATE promotions 
      SET name = ?, type = ?, value = ?, product_id = ?, category_id = ?, start_date = ?, end_date = ?, is_active = ?
      WHERE id = ?
    `).run(name, type, value, product_id || null, category_id || null, start_date, end_date, active, req.params.id);
    res.json({ message: 'Promoción actualizada' });
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar promoción.' });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const db = getDb();
    await db.prepare('DELETE FROM promotions WHERE id = ?').run(req.params.id);
    res.json({ message: 'Promoción eliminada' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar promoción.' });
  }
});

module.exports = router;