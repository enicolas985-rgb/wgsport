const express = require('express');
const router = express.Router();
const { getDb } = require('../db/postgres');
const auth = require('../middleware/auth');

router.get('/public', async (req, res) => {
  try {
    const db = getDb();
    const wpSetting = await db.prepare("SELECT value FROM settings WHERE key = 'whatsapp_number'").get();
    res.json({
      whatsapp_number: wpSetting ? wpSetting.value : '521234567890'
    });
  } catch (error) {
    res.json({ whatsapp_number: '521234567890' });
  }
});

router.get('/', auth, async (req, res) => {
  try {
    const db = getDb();
    const settings = await db.prepare('SELECT key, value FROM settings').all();
    const result = {};
    settings.forEach(s => {
      result[s.key] = s.value;
    });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener configuraciones.' });
  }
});

router.put('/:key', auth, async (req, res) => {
  const { value } = req.body;
  try {
    const db = getDb();
    await db.prepare(`
      INSERT INTO settings (key, value) VALUES (?, ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value
    `).run(req.params.key, value);
    res.json({ message: 'Configuración actualizada' });
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar configuración.' });
  }
});

module.exports = router;