const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const auth = require('../middleware/auth');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

router.post('/', auth, upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No se subió ningún archivo' });
  }
  res.json({ url: `/uploads/${req.file.filename}` });
});

router.delete('/:filename', auth, (req, res) => {
  const { filename } = req.params;
  if (!filename || filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
    return res.status(400).json({ error: 'Nombre de archivo inválido.' });
  }
  const fullPath = path.join(__dirname, '..', 'uploads', filename);
  const uploadsDir = path.join(__dirname, '..', 'uploads');
  if (!fullPath.startsWith(uploadsDir)) {
    return res.status(400).json({ error: 'Nombre de archivo inválido.' });
  }
  try {
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
