const express = require('express');
const router = express.Router();
const { getDb } = require('../db/postgres');
const auth = require('../middleware/auth');

function safeParseJson(data, fallback = []) {
  if (!data) return fallback;
  if (Array.isArray(data)) return data;
  if (typeof data === 'object') return data;
  try {
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : fallback;
  } catch (e) {
    return fallback;
  }
}

function normalizeColor(color) {
  if (!color) return { name: '', hex: '#000000' };
  if (typeof color === 'object') {
    return {
      name: color.name || 'Color',
      hex: color.hex || '#000000'
    };
  }
  const colorMap = {
    'negro': '#000000',
    'blanco': '#FFFFFF',
    'azul': '#2563EB',
    'azul marino': '#1E3A8A',
    'gris': '#6B7280',
    'rojo': '#DC2626',
    'verde': '#16A34A',
    'amarillo': '#EAB308'
  };
  const name = String(color).trim();
  const hex = colorMap[name.toLowerCase()] || (name.startsWith('#') ? name : '#000000');
  return { name, hex };
}

function normalizeColors(colorsRaw) {
  const list = safeParseJson(colorsRaw, []);
  return list.map(normalizeColor);
}

async function attachCategories(db, products) {
  if (!products || products.length === 0) return products;
  const rows = await db.prepare(`
    SELECT pc.product_id, c.id, c.name, c.slug
    FROM product_categories pc
    JOIN categories c ON c.id = pc.category_id
  `).all();

  const map = {};
  rows.forEach(row => {
    if (!map[row.product_id]) map[row.product_id] = [];
    map[row.product_id].push({ id: row.id, name: row.name, slug: row.slug });
  });

  return products.map(p => {
    const cats = map[p.id] || [];
    const primary = cats.find(c => c.id === p.category_id) || cats[0] || null;
    return {
      ...p,
      categories: cats,
      category_name: p.category_name || (primary ? primary.name : null),
      category_slug: p.category_slug || (primary ? primary.slug : null)
    };
  });
}

function formatProduct(p) {
  let discountedPrice = p.price;
  let promoInfo = null;

  if (p.promo_id) {
    if (p.promo_type === 'percentage') {
      discountedPrice = p.price * (1 - p.promo_value / 100);
    } else if (p.promo_type === 'fixed') {
      discountedPrice = Math.max(0, p.price - p.promo_value);
    }
    promoInfo = {
      id: p.promo_id,
      name: p.promo_name,
      type: p.promo_type,
      value: p.promo_value
    };
  }

  const images = safeParseJson(p.images, []).filter(Boolean);

  return {
    ...p,
    sizes: safeParseJson(p.sizes, []),
    colors: normalizeColors(p.colors),
    images: images.length ? images : (p.image_url ? [p.image_url] : []),
    image_url: images.length ? images[0] : (p.image_url || ''),
    price: Number(p.price),
    discounted_price: p.promo_id ? parseFloat(discountedPrice.toFixed(2)) : null,
    promotion: promoInfo
  };
}

async function replaceCategories(db, productId, categoryIds, primaryCategoryId) {
  const primary = primaryCategoryId || (categoryIds && categoryIds[0]) || null;
  if (primary) {
    await db.prepare('UPDATE products SET category_id = ? WHERE id = ?').run(primary, productId);
  }
  await db.prepare('DELETE FROM product_categories WHERE product_id = ?').run(productId);
  const insertCat = db.prepare('INSERT OR IGNORE INTO product_categories (product_id, category_id) VALUES (?, ?)');
  for (const catId of (categoryIds || [])) {
    if (catId) await insertCat.run(productId, catId);
  }
}

function normalizeImages(imagesRaw, imageUrl) {
  if (Array.isArray(imagesRaw)) {
    const list = imagesRaw.filter(Boolean);
    return list.length ? list : (imageUrl ? [imageUrl] : []);
  }
  if (imagesRaw) {
    return safeParseJson(imagesRaw, []).filter(Boolean);
  }
  return imageUrl ? [imageUrl] : [];
}

router.get('/', async (req, res) => {
  try {
    const db = getDb();
    const { category, search, minPrice, maxPrice, sort } = req.query;

    let query = `
      SELECT p.*, c.name as category_name, c.slug as category_slug,
        pr.id as promo_id, pr.name as promo_name, pr.type as promo_type, pr.value as promo_value
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN promotions pr ON (
        pr.is_active = 1 AND 
        (pr.start_date IS NULL OR pr.start_date <= date('now')) AND 
        (pr.end_date IS NULL OR pr.end_date >= date('now')) AND
        (pr.product_id = p.id OR pr.category_id = p.category_id OR (pr.product_id IS NULL AND pr.category_id IS NULL))
      )
      WHERE p.is_active = 1
    `;
    const params = [];

    if (category) {
      query += ` AND (p.category_id = ? OR p.id IN (SELECT product_id FROM product_categories WHERE category_id = ?))`;
      params.push(category, category);
    }

    if (search) {
      query += ` AND p.name LIKE ?`;
      params.push(`%${search}%`);
    }

    if (minPrice) {
      query += ` AND p.price >= ?`;
      params.push(minPrice);
    }

    if (maxPrice) {
      query += ` AND p.price <= ?`;
      params.push(maxPrice);
    }

    if (sort === 'price_asc') {
      query += ` ORDER BY p.price ASC`;
    } else if (sort === 'price_desc') {
      query += ` ORDER BY p.price DESC`;
    } else {
      query += ` ORDER BY p.created_at DESC`;
    }

    const products = await db.prepare(query).all(...params);
    const withCategories = await attachCategories(db, products);
    const formattedProducts = withCategories.map(formatProduct);

    res.json(formattedProducts);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener productos.' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const db = getDb();
    const product = await db.prepare(`
      SELECT p.*, c.name as category_name, c.slug as category_slug,
        pr.id as promo_id, pr.name as promo_name, pr.type as promo_type, pr.value as promo_value
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN promotions pr ON (
        pr.is_active = 1 AND 
        (pr.start_date IS NULL OR pr.start_date <= date('now')) AND 
        (pr.end_date IS NULL OR pr.end_date >= date('now')) AND
        (pr.product_id = p.id OR pr.category_id = p.category_id OR (pr.product_id IS NULL AND pr.category_id IS NULL))
      )
      WHERE p.id = ?
    `).get(req.params.id);

    if (!product) {
      return res.status(404).json({ error: 'Producto no encontrado.' });
    }

    const withCategories = await attachCategories(db, [product]);
    res.json(formatProduct(withCategories[0]));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener producto.' });
  }
});

router.post('/', auth, async (req, res) => {
  const { name, description, price, category_id, category_ids, image_url, images, sizes, colors, stock } = req.body;
  try {
    const db = getDb();
    const sizesJson = typeof sizes === 'string' ? sizes : JSON.stringify(sizes || []);
    const colorsJson = typeof colors === 'string' ? colors : JSON.stringify(colors || []);
    const imagesList = normalizeImages(images, image_url);
    const imagesJson = JSON.stringify(imagesList);
    const primaryCategoryId = (category_ids && category_ids[0]) || category_id || null;

    const info = await db.prepare(`
      INSERT INTO products (name, description, price, category_id, image_url, images, sizes, colors, stock)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      name,
      description || null,
      Number(price) || 0,
      primaryCategoryId,
      imagesList[0] || '',
      imagesJson,
      sizesJson,
      colorsJson,
      Number(stock) || 0
    );

    if (category_ids && category_ids.length) {
      await replaceCategories(db, info.lastInsertRowid, category_ids, primaryCategoryId);
    }

    res.status(201).json({ id: info.lastInsertRowid, message: 'Producto creado' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al crear producto.' });
  }
});

router.put('/:id', auth, async (req, res) => {
  const { name, description, price, category_id, category_ids, image_url, images, sizes, colors, stock, is_active } = req.body;
  try {
    const db = getDb();
    const sizesJson = typeof sizes === 'string' ? sizes : JSON.stringify(sizes || []);
    const colorsJson = typeof colors === 'string' ? colors : JSON.stringify(colors || []);
    const existing = await db.prepare('SELECT image_url, images FROM products WHERE id = ?').get(req.params.id);
    const existingImages = existing ? normalizeImages(existing.images, existing.image_url) : [];
    const imagesList = Array.isArray(images) ? images.filter(Boolean) : Array.isArray(existingImages) ? existingImages : [];
    const imagesJson = JSON.stringify(imagesList);
    const primaryCategoryId = (category_ids && category_ids[0]) || category_id || null;

    await db.prepare(`
      UPDATE products 
      SET name = ?, description = ?, price = ?, category_id = ?, image_url = ?, images = ?, sizes = ?, colors = ?, stock = ?, is_active = ?
      WHERE id = ?
    `).run(
      name,
      description || null,
      Number(price) || 0,
      primaryCategoryId,
      imagesList[0] || '',
      imagesJson,
      sizesJson,
      colorsJson,
      Number(stock) || 0,
      is_active !== undefined ? !!is_active : 1,
      req.params.id
    );

    if (category_ids !== undefined) {
      await replaceCategories(db, req.params.id, category_ids, primaryCategoryId);
    }

    res.json({ message: 'Producto actualizado' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al actualizar producto.' });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const db = getDb();
    await db.prepare('DELETE FROM product_categories WHERE product_id = ?').run(req.params.id);
    await db.prepare('DELETE FROM products WHERE id = ?').run(req.params.id);
    res.json({ message: 'Producto eliminado' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al eliminar producto.' });
  }
});

module.exports = router;