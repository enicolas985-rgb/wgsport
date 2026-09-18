import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

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
      <div style={{display: 'flex', gap: '24px'}}>
        <div style={{padding: '24px', background: 'white', border: '1px solid #E5E5E5', flex: 1}}>
          <h3>Total Productos</h3>
          <p className="display">{stats.products}</p>
        </div>
        <div style={{padding: '24px', background: 'white', border: '1px solid #E5E5E5', flex: 1}}>
          <h3>Categorías</h3>
          <p className="display">{stats.categories}</p>
        </div>
        <div style={{padding: '24px', background: 'white', border: '1px solid #E5E5E5', flex: 1}}>
          <h3>Promociones Activas</h3>
          <p className="display">{stats.promotions}</p>
        </div>
        <div style={{padding: '24px', background: 'white', border: '1px solid #E5E5E5', flex: 1}}>
          <h3>Suscriptores</h3>
          <p className="display">{stats.subscribers}</p>
        </div>
      </div>
    </div>
  );
}
