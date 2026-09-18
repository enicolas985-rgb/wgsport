import { useCart } from '../../context/CartContext';
import styles from './CartItem.module.css';

export default function CartItem({ item }) {
  const { dispatch } = useCart();

  const handleUpdateQuantity = (newQuantity) => {
    if (newQuantity < 1) return;
    dispatch({ type: 'UPDATE_QUANTITY', payload: { ...item, quantity: newQuantity } });
  };

  const handleRemove = () => {
    dispatch({ type: 'REMOVE_ITEM', payload: item });
  };

  const price = item.discounted_price || item.price;

  return (
    <div className={styles.item}>
      <img src={item.image_url || 'https://via.placeholder.com/80x100'} alt={item.name} className={styles.image} />
      <div className={styles.info}>
        <h4 className={styles.name}>{item.name}</h4>
        <p className={styles.details}>Talla: {item.size} | Color: {item.color}</p>
        <div className={styles.controls}>
          <div className={styles.quantity}>
            <button onClick={() => handleUpdateQuantity(item.quantity - 1)}>-</button>
            <span>{item.quantity}</span>
            <button onClick={() => handleUpdateQuantity(item.quantity + 1)}>+</button>
          </div>
          <span className={styles.price}>${price * item.quantity}</span>
        </div>
      </div>
      <button className={styles.remove} onClick={handleRemove}>✕</button>
    </div>
  );
}
