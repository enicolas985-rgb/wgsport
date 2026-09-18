const express = require('express');
const router = express.Router();
const { getDb } = require('../db/database');
const auth = require('../middleware/auth');

// Public settings endpoint (for customer checkout WhatsApp number)
router.get('/public', (req, res) => {
  try {
    const db = getDb();
    const wpSetting = db.prepare("SELECT value FROM settings WHERE key = 'whatsapp_number'").get();
    res.json({
      whatsapp_number: wpSetting ? wpSetting.value : '521234567890'
    });
  } catch (error) {
    res.json({ whatsapp_number: '521234567890' });
  }
});

router.get('/', auth, (req, res) => {
  try {
    const db = getDb();
    const settings = db.prepare('SELECT key, value FROM settings').all();
    const result = {};
    settings.forEach(s => {
      result[s.key] = s.value;
    });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener configuraciones.' });
  }
});

router.put('/:key', auth, (req, res) => {
  const { value } = req.body;
  try {
    const db = getDb();
    db.prepare(`
      INSERT INTO settings (key, value) VALUES (?, ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value
    `).run(req.params.key, value);
    res.json({ message: 'Configuración actualizada' });
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar configuración.' });
  }
});

module.exports = router;
