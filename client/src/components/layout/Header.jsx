import { Link } from "react-router-dom";
import { useCart } from "../../context/CartContext";
import { useAuth } from "../../context/AuthContext";
import styles from "./Header.module.css";

export default function Header() {
  const { getCartCount, dispatch } = useCart();
  const { user } = useAuth();
  const cartCount = getCartCount();

  return (
    <header className={styles.header}>
      <div className={styles.left}>
        <Link to="/" className={styles.logoLink}>
          <img src="/wg_logo.png" alt="WG" className={styles.logoImg} />
          <span className={styles.logoSlogan}>Muevete con estilo</span>
        </Link>
      </div>
      <nav className={styles.center}>
        <Link to="/" className={styles.navLink}>
          Inicio
        </Link>
        <Link to="/catalogo" className={styles.navLink}>
          Catálogo
        </Link>
      </nav>
      <div className={styles.right}>
        {user && (
          <Link to="/admin" className={styles.adminLink}>
            Panel Admin
          </Link>
        )}
        <button
          className={styles.cartButton}
          onClick={() => dispatch({ type: "TOGGLE_DRAWER", payload: true })}
        >
          <span className={styles.cartIcon}>🛒</span>
          {cartCount > 0 && (
            <span className={styles.cartBadge}>{cartCount}</span>
          )}
        </button>
      </div>
    </header>
  );
}
