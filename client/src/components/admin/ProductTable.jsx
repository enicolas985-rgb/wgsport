import styles from './ProductTable.module.css';

export default function ProductTable({ products, onEdit, onDelete }) {
  return (
    <div className={styles.container}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Imagen</th>
            <th>Nombre</th>
            <th>Categoría</th>
            <th>Precio</th>
            <th>Stock</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {products.map(product => {
            const categoriesLabel = (product.categories && product.categories.length)
              ? product.categories.map(c => c.name).join(', ')
              : (product.category_name || '—');
            return (
              <tr key={product.id}>
                <td>
                  <img src={(product.images && product.images[0]) || product.image_url || 'https://via.placeholder.com/40'} alt={product.name} className={styles.thumb} />
                </td>
                <td>{product.name}</td>
                <td>{categoriesLabel}</td>
                <td>${product.price}</td>
                <td>{product.stock}</td>
                <td>
                  <button onClick={() => onEdit(product)} className={styles.actionBtn}>✏️</button>
                  <button onClick={() => onDelete(product.id)} className={styles.actionBtn}>🗑️</button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
