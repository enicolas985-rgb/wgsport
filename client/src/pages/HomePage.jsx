import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ProductGrid from '../components/catalog/ProductGrid';
import styles from './HomePage.module.css';

export default function HomePage() {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    fetch('/api/products?sort=price_asc')
      .then(res => res.json())
      .then(data => setFeaturedProducts(data.slice(0, 6)))
      .catch(console.error);

    fetch('/api/categories')
      .then(res => res.json())
      .then(data => setCategories(data))
      .catch(console.error);
  }, []);

  return (
    <div>
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <h1 className="display">Ropa Deportiva de Alto Rendimiento</h1>
          <p className={styles.heroDesc}>Diseñada para superar tus límites. Explora la nueva colección.</p>
          <Link to="/catalogo" className={styles.cta}>Ver Catálogo</Link>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className="h1">Destacados</h2>
          <Link to="/catalogo" className={styles.link}>Ver todos</Link>
        </div>
        <ProductGrid products={featuredProducts} loading={featuredProducts.length === 0} />
      </section>

      <section className={styles.section}>
        <h2 className="h1" style={{ marginBottom: '32px' }}>Categorías</h2>
        <div className={styles.categoriesGrid}>
          {categories.map(cat => (
            <Link to={`/catalogo?category=${cat.id}`} key={cat.id} className={styles.categoryCard}>
              <div className={styles.catImage}>
                {cat.image_url
                  ? <img src={cat.image_url} alt={cat.name} className={styles.catImageImg} />
                  : <div className={styles.catImagePlaceholder}></div>}
              </div>
              <h3 className={styles.catName}>{cat.name}</h3>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
