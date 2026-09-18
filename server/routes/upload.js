const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { getDb } = require('../db/postgres');
const auth = require('../middleware/auth');

const databaseMode = () => !!process.env.DATABASE_URL;

const storage = databaseMode()
  ? multer.memoryStorage()
  : multer.diskStorage({
      destination: function (req, file, cb) {
        cb(null, 'uploads/');
      },
      filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
      }
    });

const upload = multer({ storage: storage });

function isValidFilename(filename) {
  return filename && !filename.includes('..') && !filename.includes('/') && !filename.includes('\\');
}

router.post('/', auth, upload.single('image'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No se subió ningún archivo' });
  }
  try {
    if (databaseMode()) {
      const filename = Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(req.file.originalname);
      const db = getDb();
      await db.prepare('INSERT INTO uploads (filename, mime, size, data) VALUES (?, ?, ?, ?)')
        .run(filename, req.file.mimetype || 'application/octet-stream', req.file.size, req.file.buffer);
      return res.json({ url: `/uploads/${filename}` });
    }
    res.json({ url: `/uploads/${req.file.filename}` });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al subir el archivo.' });
  }
});

router.get('/:filename', async (req, res) => {
  const { filename } = req.params;
  if (!isValidFilename(filename)) {
    return res.status(400).json({ error: 'Nombre de archivo inválido.' });
  }
  try {
    if (databaseMode()) {
      const db = getDb();
      const file = await db.prepare('SELECT mime, data FROM uploads WHERE filename = ?').get(filename);
      if (!file) {
        return res.status(404).json({ error: 'No encontrado.' });
      }
      const data = Buffer.isBuffer(file.data) ? file.data : Buffer.from(file.data);
      res.setHeader('Content-Type', file.mime || 'application/octet-stream');
      res.setHeader('Content-Length', data.length);
      return res.send(data);
    }
    const fullPath = path.join(__dirname, '..', 'uploads', filename);
    const uploadsDir = path.join(__dirname, '..', 'uploads');
    if (!fullPath.startsWith(uploadsDir)) {
      return res.status(400).json({ error: 'Nombre de archivo inválido.' });
    }
    if (!fs.existsSync(fullPath)) {
      return res.status(404).json({ error: 'No encontrado.' });
    }
    return res.sendFile(fullPath);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Error al leer el archivo.' });
  }
});

router.delete('/:filename', auth, async (req, res) => {
  const { filename } = req.params;
  if (!isValidFilename(filename)) {
    return res.status(400).json({ error: 'Nombre de archivo inválido.' });
  }
  try {
    if (databaseMode()) {
      const db = getDb();
      await db.prepare('DELETE FROM uploads WHERE filename = ?').run(filename);
      return res.json({ message: 'Imagen eliminada' });
    }
    const fullPath = path.join(__dirname, '..', 'uploads', filename);
    const uploadsDir = path.join(__dirname, '..', 'uploads');
    if (!fullPath.startsWith(uploadsDir)) {
      return res.status(400).json({ error: 'Nombre de archivo inválido.' });
    }
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
    }
    res.json({ message: 'Imagen eliminada' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al eliminar la imagen.' });
  }
});

module.exports = router;