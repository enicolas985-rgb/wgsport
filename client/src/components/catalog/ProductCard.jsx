import { Link } from 'react-router-dom';
import styles from './ProductCard.module.css';

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

function getSafeColors(colorsRaw) {
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
        name: c.name || '',
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

export default function ProductCard({ product }) {
  if (!product) return null;

  const colors = getSafeColors(product.colors);
  const hasPromo = product.promotion || (product.discounted_price && product.discounted_price < product.price);

  return (
    <Link to={`/producto/${product.id}`} className={styles.card}>
      <div className={styles.imageContainer}>
        {hasPromo && (
          <div className={styles.badge}>
            {product.promotion?.type === 'percentage' 
              ? `-${product.promotion.value}%` 
              : 'OFERTA'}
          </div>
        )}
        <div className={styles.wishlist}>♡</div>
        <img 
          src={product.image_url || 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=500&auto=format&fit=crop&q=60'} 
          alt={product.name} 
          className={styles.image} 
          onError={(e) => {
            e.target.src = 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=500&auto=format&fit=crop&q=60';
          }}
        />
      </div>
      
      {colors.length > 0 && (
        <div className={styles.swatches}>
          {colors.map((color, i) => (
            <div 
              key={i} 
              className={styles.swatch} 
              style={{ backgroundColor: color.hex }} 
              title={color.name}
            />
          ))}
        </div>
      )}

      <div className={styles.info}>
        <h3 className={styles.name}>{product.name}</h3>
        <p className={styles.category}>{product.category_name}</p>
        <div className={styles.priceRow}>
          {product.discounted_price ? (
            <>
              <span className={styles.originalPrice}>${Number(product.price).toFixed(2)}</span>
              <span className={styles.discountedPrice}>${Number(product.discounted_price).toFixed(2)}</span>
            </>
          ) : (
            <span className={styles.price}>${Number(product.price).toFixed(2)}</span>
          )}
        </div>
      </div>
    </Link>
  );
}
