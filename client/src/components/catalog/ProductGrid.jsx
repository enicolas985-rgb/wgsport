import ProductCard from './ProductCard';
import styles from './ProductGrid.module.css';

export default function ProductGrid({ products, loading }) {
  if (loading) {
    return (
      <div className={styles.grid}>
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div key={i} className={styles.skeleton}></div>
        ))}
      </div>
    );
  }

  if (!products || products.length === 0) {
    return <div className={styles.empty}>No se encontraron productos.</div>;
  }

  return (
    <div className={styles.grid}>
      {products.map(product => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
