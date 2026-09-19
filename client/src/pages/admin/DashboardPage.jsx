import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import styles from './DashboardPage.module.css';

export default function DashboardPage() {
  const { token } = useAuth();
  const [stats, setStats] = useState({ products: 0, categories: 0, promotions: 0, subscribers: 0 });

  useEffect(() => {
    Promise.all([
      fetch('/api/products').then(res => res.json()),
      fetch('/api/categories').then(res => res.json()),
      fetch('/api/promotions').then(res => res.json()),
      fetch('/api/subscribe', {
        headers: { Authorization: `Bearer ${token}` }
      }).then(res => res.json())
    ]).then(([prod, cat, prom, subs]) => {
      setStats({
        products: prod.length || 0,
        categories: cat.length || 0,
        promotions: prom.length || 0,
        subscribers: Array.isArray(subs) ? subs.length : 0
      });
    }).catch(console.error);
  }, []);

  return (
    <div>
      <h1 className="h1" style={{marginBottom: '24px'}}>Dashboard</h1>
      <div className={styles.statsGrid}>
        <div className={styles.card}>
          <h3>Total Productos</h3>
          <p className="display">{stats.products}</p>
        </div>
        <div className={styles.card}>
          <h3>Categorías</h3>
          <p className="display">{stats.categories}</p>
        </div>
        <div className={styles.card}>
          <h3>Promociones Activas</h3>
          <p className="display">{stats.promotions}</p>
        </div>
        <div className={styles.card}>
          <h3>Suscriptores</h3>
          <p className="display">{stats.subscribers}</p>
        </div>
      </div>
    </div>
  );
}
