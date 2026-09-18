import { useState, useEffect } from 'react';
import { useCart } from '../../context/CartContext';
import styles from './WhatsAppCheckout.module.css';

export default function WhatsAppCheckout({ onClose }) {
  const { generateWhatsAppURL, getCartTotal, dispatch } = useCart();
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    notes: ''
  });
  const [whatsappNumber, setWhatsappNumber] = useState('521234567890');

  useEffect(() => {
    fetch('/api/settings/public')
      .then(res => res.json())
      .then(data => {
        if (data && data.whatsapp_number) {
          setWhatsappNumber(data.whatsapp_number);
        }
      })
      .catch(err => {
        console.warn('Usando número de WhatsApp por defecto', err);
      });
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    const targetNumber = whatsappNumber || '521234567890';
    const url = generateWhatsAppURL(formData, targetNumber);
    window.open(url, '_blank');
    dispatch({ type: 'CLEAR_CART' });
    onClose();
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <h2>Completar Pedido por WhatsApp</h2>
        <p style={{fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px'}}>
          Al enviar el pedido, se abrirá WhatsApp con el detalle de tus productos listo para el vendedor.
        </p>
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.field}>
            <label>Nombre completo *</label>
            <input 
              type="text" 
              required 
              placeholder="Ej: Carlos Gómez"
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
              className={styles.input}
            />
          </div>
          <div className={styles.field}>
            <label>Teléfono de contacto *</label>
            <input 
              type="tel" 
              required 
              placeholder="Ej: 55 1234 5678"
              value={formData.phone}
              onChange={e => setFormData({...formData, phone: e.target.value})}
              className={styles.input}
            />
          </div>
          <div className={styles.field}>
            <label>Dirección de entrega / Notas</label>
            <textarea 
              value={formData.notes}
              onChange={e => setFormData({...formData, notes: e.target.value})}
              className={styles.input}
              rows={3}
              placeholder="Calle, número, colonia, referencias..."
            />
          </div>
          
          <div className={styles.summary}>
            <strong>Total a pagar: ${getCartTotal().toFixed(2)}</strong>
          </div>

          <div className={styles.actions}>
            <button type="button" onClick={onClose} className={styles.cancelBtn}>Cancelar</button>
            <button type="submit" className={styles.submitBtn}>Enviar Pedido por WhatsApp</button>
          </div>
        </form>
      </div>
    </div>
  );
}
