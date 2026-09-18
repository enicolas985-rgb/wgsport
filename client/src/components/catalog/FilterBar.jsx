import styles from './FilterBar.module.css';

export default function FilterBar({ categories, activeCategory, onCategoryChange, sort, onSortChange }) {
  return (
    <div className={styles.container}>
      <div className={styles.scrollArea}>
        <button 
          className={`${styles.pill} ${!activeCategory ? styles.active : ''}`}
          onClick={() => onCategoryChange('')}
        >
          Todos
        </button>
        {categories.map(cat => (
          <button
            key={cat.id}
            className={`${styles.pill} ${activeCategory === cat.id ? styles.active : ''}`}
            onClick={() => onCategoryChange(cat.id)}
          >
            {cat.name}
          </button>
        ))}
      </div>
      
      <div className={styles.actions}>
        <select 
          className={styles.select}
          value={sort}
          onChange={(e) => onSortChange(e.target.value)}
        >
          <option value="">Más recientes</option>
          <option value="price_asc">Precio: menor a mayor</option>
          <option value="price_desc">Precio: mayor a menor</option>
        </select>
      </div>
    </div>
  );
}
