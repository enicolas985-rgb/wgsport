import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import styles from './ProductDetailPage.module.css';

const defaultColorMap = {
  'negro': '#000000',
  'blanco': '#FFFFFF',
  'azul': '#2563EB',
  'azul marino': '#1E3A8A',
  'gris': '#6B7280',
  'rojo': '#DC2626',
  'verde': '#16A34A',
  'amarillo': '#EAB308'
};

function normalizeColorList(colorsRaw) {
  if (!colorsRaw) return [];
  let list = colorsRaw;
  if (typeof list === 'string') {
    try {
      list = JSON.parse(list);
    } catch {
      return [];
    }
  }
  if (!Array.isArray(list)) return [];
  return list.map(c => {
    if (typeof c === 'object' && c !== null) {
      return {
        name: c.name || 'Color',
        hex: c.hex || defaultColorMap[(c.name || '').toLowerCase()] || '#000000'
      };
    }
    const str = String(c).trim();
    return {
      name: str,
      hex: defaultColorMap[str.toLowerCase()] || (str.startsWith('#') ? str : '#333333')
    };
  });
}

function normalizeSizeList(sizesRaw) {
  if (!sizesRaw) return [];
  let list = sizesRaw;
  if (typeof list === 'string') {
    try {
      list = JSON.parse(list);
    } catch {
      return [];
    }
  }
  return Array.isArray(list) ? list : [];
}

export default function ProductDetailPage() {
  const { id } = useParams();
  const { dispatch } = useCart();
  const [product, setProduct] = useState(null);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [addedNotification, setAddedNotification] = useState(false);
  const [activeImage, setActiveImage] = useState('');

  useEffect(() => {
    fetch(`/api/products/${id}`)
      .then(res => res.json())
      .then(data => {
        setProduct(data);
        const images = (data.images && data.images.length) ? data.images : (data.image_url ? [data.image_url] : []);
        setActiveImage(images[0] || '');
        const sizes = normalizeSizeList(data.sizes);
        const colors = normalizeColorList(data.colors);
        if (sizes.length > 0) setSelectedSize(sizes[0]);
        if (colors.length > 0) setSelectedColor(colors[0]);
      })
      .catch(console.error);
  }, [id]);

  if (!product) return <div className={styles.loading}>Cargando producto...</div>;

  const sizes = normalizeSizeList(product.sizes);
  const colors = normalizeColorList(product.colors);

  const images = (product.images && product.images.length) ? product.images : (product.image_url ? [product.image_url] : []);
  const defaultImg = 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=600&auto=format&fit=crop&q=80';
  const mainImage = activeImage || images[0] || defaultImg;

  const handleAddToCart = () => {
    dispatch({
      type: 'ADD_ITEM',
      payload: {
        id: product.id,
        name: product.name,
        price: product.price,
        discounted_price: product.discounted_price,
        image_url: product.image_url || 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=500&auto=format&fit=crop&q=60',
        size: selectedSize || 'Única',
        color: selectedColor ? selectedColor.name : 'Estándar',
        quantity
      }
    });
    setAddedNotification(true);
    setTimeout(() => setAddedNotification(false), 2500);
  };

  return (
    <div className={styles.page}>
      <div className={styles.breadcrumb} style={{marginBottom: '16px'}}>
        <Link to="/catalogo" style={{color: '#666', fontSize: '13px', textDecoration: 'none'}}>← Volver al Catálogo</Link>
      </div>

      <div className={styles.grid}>
        <div className={styles.imageCol}>
          <img 
            src={mainImage} 
            alt={product.name} 
            className={styles.image}
            onError={(e) => { e.target.src = defaultImg; }}
          />
          {images.length > 1 && (
            <div className={styles.thumbGallery}>
              {images.map((img, i) => (
                <img
                  key={`${img}-${i}`}
                  src={img}
                  alt={`${product.name} ${i + 1}`}
                  className={`${styles.thumb} ${mainImage === img ? styles.thumbActive : ''}`}
                  onClick={() => setActiveImage(img)}
                  onError={(e) => { e.target.src = defaultImg; }}
                />
              ))}
            </div>
          )}
        </div>
        <div className={styles.infoCol}>
          <span className="overline">{product.category_name}</span>
          <h1 className="h1">{product.name}</h1>
          <div className={styles.priceRow}>
            {product.discounted_price ? (
              <>
                <span className={styles.originalPrice}>${Number(product.price).toFixed(2)}</span>
                <span className={styles.price}>${Number(product.discounted_price).toFixed(2)}</span>
              </>
            ) : (
              <span className={styles.price}>${Number(product.price).toFixed(2)}</span>
            )}
          </div>
          
          <p className={styles.desc}>{product.description}</p>

          {sizes.length > 0 && (
            <div className={styles.section}>
              <span className={styles.label}>Talla seleccionada: <strong>{selectedSize}</strong></span>
              <div className={styles.pills}>
                {sizes.map(size => (
                  <button 
                    key={size}
                    type="button"
                    className={`${styles.pill} ${selectedSize === size ? styles.active : ''}`}
                    onClick={() => setSelectedSize(size)}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          )}

          {colors.length > 0 && (
            <div className={styles.section}>
              <span className={styles.label}>Color: <strong>{selectedColor?.name || 'Selecciona un color'}</strong></span>
              <div className={styles.colors}>
                {colors.map((color, i) => (
                  <button 
                    key={i}
                    type="button"
                    title={color.name}
                    className={`${styles.swatch} ${selectedColor?.name === color.name ? styles.swatchActive : ''}`}
                    style={{ backgroundColor: color.hex }}
                    onClick={() => setSelectedColor(color)}
                  />
                ))}
              </div>
            </div>
          )}

          <div className={styles.section}>
            <span className={styles.label}>Cantidad</span>
            <div className={styles.qty}>
              <button type="button" onClick={() => setQuantity(Math.max(1, quantity - 1))}>-</button>
              <span>{quantity}</span>
              <button type="button" onClick={() => setQuantity(quantity + 1)}>+</button>
            </div>
          </div>

          <button className={styles.addBtn} onClick={handleAddToCart}>
            {addedNotification ? '✓ ¡Agregado al Carrito!' : 'Agregar al Carrito'}
          </button>
        </div>
      </div>
    </div>
  );
}
