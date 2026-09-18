import { useState } from 'react';
import { useCart } from '../../context/CartContext';
import CartItem from './CartItem';
import WhatsAppCheckout from './WhatsAppCheckout';
import styles from './CartDrawer.module.css';

export default function CartDrawer() {
  const { isDrawerOpen, dispatch, items, getCartTotal } = useCart();
  const [showCheckout, setShowCheckout] = useState(false);

  if (!isDrawerOpen) return null;

  return (
    <>
      <div className={styles.overlay} onClick={() => dispatch({ type: 'TOGGLE_DRAWER', payload: false })} />
      <div className={styles.drawer}>
        <div className={styles.header}>
          <h2>Tu Carrito</h2>
          <button className={styles.close} onClick={() => dispatch({ type: 'TOGGLE_DRAWER', payload: false })}>✕</button>
        </div>

        <div className={styles.content}>
          {items.length === 0 ? (
            <p className={styles.empty}>Tu carrito está vacío</p>
          ) : (
            items.map((item, i) => (
              <CartItem key={`${item.id}-${item.size}-${item.color}-${i}`} item={item} />
            ))
          )}
        </div>

        {items.length > 0 && (
          <div className={styles.footer}>
            <div className={styles.totalRow}>
              <span>Total</span>
              <span className={styles.total}>${getCartTotal()}</span>
            </div>
            <button 
              className={styles.checkoutBtn}
              onClick={() => setShowCheckout(true)}
            >
              Enviar Pedido por WhatsApp
            </button>
          </div>
        )}
      </div>

      {showCheckout && (
        <WhatsAppCheckout onClose={() => setShowCheckout(false)} />
      )}
    </>
  );
}
