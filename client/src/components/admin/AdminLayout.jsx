import { Outlet, Link, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import styles from './AdminLayout.module.css';

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const links = [
    { path: '/admin', label: 'Dashboard' },
    { path: '/admin/productos', label: 'Productos' },
    { path: '/admin/categorias', label: 'Categorías' },
    { path: '/admin/promociones', label: 'Promociones' },
    { path: '/admin/suscriptores', label: 'Suscriptores' },
    { path: '/admin/configuracion', label: 'Configuración' },
  ];

  return (
    <div className={styles.layout}>
      <aside className={styles.sidebar}>
        <div className={styles.header}>
          <h2>WG Admin</h2>
        </div>
        <nav className={styles.nav}>
          {links.map(link => (
            <Link 
              key={link.path}
              to={link.path}
              className={`${styles.link} ${location.pathname === link.path ? styles.active : ''}`}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className={styles.footer}>
          <button onClick={logout} className={styles.logoutBtn}>Cerrar Sesión</button>
        </div>
      </aside>
      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  );
}
