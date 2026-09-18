const express = require('express');
const router = express.Router();
const { getDb } = require('../db/postgres');
const auth = require('../middleware/auth');

router.post('/', async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'El correo electrónico es requerido.' });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Correo electrónico inválido.' });
  }

  try {
    const db = getDb();
    await db.prepare('INSERT OR IGNORE INTO subscribers (email) VALUES (?)').run(email.toLowerCase());
    res.status(201).json({ message: 'Te has suscrito correctamente. ¡Gracias!' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al suscribirse.' });
  }
});

router.post('/unsub', (req, res) => {
  const email = (req.body && req.body.email) || '';
  return unsubscribe(email, res);
});

router.get('/unsub', (req, res) => {
  const email = (req.query && req.query.email) || '';
  return unsubscribe(email, res);
});

async function unsubscribe(email, res) {
  const normalized = String(email || '').toLowerCase().trim();
  if (!normalized) {
    return res.status(400).json({ error: 'El correo electrónico es requerido.' });
  }

  try {
    const db = getDb();
    const result = await db.prepare('DELETE FROM subscribers WHERE email = ?').run(normalized);
    res.json({
      message: result.changes > 0
        ? 'Te has dado de baja correctamente. ¡Hasta pronto!'
        : 'No encontramos ese correo en la lista, pero no volverás a recibir correos.'
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al darte de baja.' });
  }
}

router.get('/', auth, async (req, res) => {
  try {
    const db = getDb();
    const subscribers = await db.prepare('SELECT id, email, created_at FROM subscribers ORDER BY created_at DESC').all();
    res.json(subscribers);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener suscriptores.' });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const db = getDb();
    const result = await db.prepare('DELETE FROM subscribers WHERE id = ?').run(req.params.id);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Suscriptor no encontrado.' });
    }
    res.json({ message: 'Suscriptor eliminado.' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar suscriptor.' });
  }
});

module.exports = router;