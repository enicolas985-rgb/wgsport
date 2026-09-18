import { useState, useEffect } from 'react';
import styles from './PromotionForm.module.css';

export default function PromotionForm({ promotion, products, categories, onClose, onSave }) {
  const [formData, setFormData] = useState({
    name: '',
    type: 'percentage',
    value: '',
    product_id: '',
    category_id: '',
    start_date: '',
    end_date: ''
  });

  useEffect(() => {
    if (promotion) {
      setFormData({
        name: promotion.name,
        type: promotion.type,
        value: promotion.value,
        product_id: promotion.product_id || '',
        category_id: promotion.category_id || '',
        start_date: promotion.start_date ? promotion.start_date.split('T')[0] : '',
        end_date: promotion.end_date ? promotion.end_date.split('T')[0] : ''
      });
    }
  }, [promotion]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      ...formData,
      product_id: formData.product_id ? parseInt(formData.product_id) : null,
      category_id: formData.category_id ? parseInt(formData.category_id) : null,
      value: parseFloat(formData.value)
    };
    onSave(payload);
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <h2>{promotion ? 'Editar Promoción' : 'Nueva Promoción'}</h2>
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.field}>
            <label>Nombre</label>
            <input required className={styles.input} value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
          </div>

          <div className={styles.row}>
            <div className={styles.field}>
              <label>Tipo</label>
              <select className={styles.input} value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}>
                <option value="percentage">Porcentaje (%)</option>
                <option value="fixed">Monto Fijo ($)</option>
              </select>
            </div>
            <div className={styles.field}>
              <label>Valor</label>
              <input type="number" required step="0.01" className={styles.input} value={formData.value} onChange={e => setFormData({...formData, value: e.target.value})} />
            </div>
          </div>

          <div className={styles.row}>
            <div className={styles.field}>
              <label>Aplicar a Producto</label>
              <select className={styles.input} value={formData.product_id} onChange={e => setFormData({...formData, product_id: e.target.value, category_id: ''})}>
                <option value="">(Ninguno)</option>
                {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div className={styles.field}>
              <label>O Aplicar a Categoría</label>
              <select className={styles.input} value={formData.category_id} onChange={e => setFormData({...formData, category_id: e.target.value, product_id: ''})}>
                <option value="">(Ninguna)</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>

          <div className={styles.row}>
            <div className={styles.field}>
              <label>Fecha de Inicio</label>
              <input type="date" required className={styles.input} value={formData.start_date} onChange={e => setFormData({...formData, start_date: e.target.value})} />
            </div>
            <div className={styles.field}>
              <label>Fecha de Fin</label>
              <input type="date" required className={styles.input} value={formData.end_date} onChange={e => setFormData({...formData, end_date: e.target.value})} />
            </div>
          </div>

          <div className={styles.preview}>
            <strong>Vista previa:</strong> {formData.type === 'percentage' ? `${formData.value || 0}% de descuento` : `$${formData.value || 0} de descuento`}
          </div>
          
          <div className={styles.actions}>
            <button type="button" onClick={onClose} className={styles.cancelBtn}>Cancelar</button>
            <button type="submit" className={styles.submitBtn}>Guardar</button>
          </div>
        </form>
      </div>
    </div>
  );
}
