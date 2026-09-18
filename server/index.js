require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { initDatabase } = require('./db/postgres');
const seed = require('./db/seed');

const app = express();
const PORT = process.env.PORT || 3001;

const databaseUploads = !!process.env.DATABASE_URL;
const uploadsDir = path.join(__dirname, 'uploads');
if (!databaseUploads && !fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

app.use(cors());
app.use(express.json());

if (!databaseUploads) {
  app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
}
app.use('/uploads', require('./routes/upload'));

const distDir = path.join(__dirname, '..', 'client', 'dist');
const distIndex = path.join(distDir, 'index.html');
if (fs.existsSync(distIndex)) {
  app.use(express.static(distDir));
}

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/auth', require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/promotions', require('./routes/promotions'));
app.use('/api/upload', require('./routes/upload'));
app.use('/api/settings', require('./routes/settings'));
app.use('/api/subscribe', require('./routes/subscribe'));

if (fs.existsSync(distIndex)) {
  app.get('*', (req, res) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
      return res.status(404).json({ error: 'No encontrado.' });
    }
    res.sendFile(distIndex);
  });
}

async function startServer() {
  try {
    await seed();
    console.log('Database initialized and seeded.');

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

let appReady = false;
let appReadyPromise = null;

async function ensureReady() {
  if (appReady) return;
  if (!appReadyPromise) {
    appReadyPromise = (async () => {
      await seed();
      appReady = true;
    })();
  }
  return appReadyPromise;
}

async function vercelHandler(req, res) {
  try {
    await ensureReady();
  } catch (error) {
    console.error('Init failed:', error);
    return res.status(500).json({ error: 'Error inicializando la aplicación.' });
  }
  return app(req, res);
}

if (require.main === module) {
  startServer();
}

module.exports = vercelHandler;