import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import PromotionForm from '../../components/admin/PromotionForm';

export default function PromotionsPage() {
  const { token } = useAuth();
  const [promotions, setPromotions] = useState([]);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingPromo, setEditingPromo] = useState(null);

  useEffect(() => {
    fetchData();
    fetch('/api/products').then(res => res.json()).then(setProducts);
    fetch('/api/categories').then(res => res.json()).then(setCategories);
  }, []);

  const fetchData = () => {
    fetch('/api/promotions')
      .then(res => res.json())
      .then(setPromotions)
      .catch(console.error);
  };

  const handleSave = async (data) => {
    const url = editingPromo ? `/api/promotions/${editingPromo.id}` : '/api/promotions';
    const method = editingPromo ? 'PUT' : 'POST';

    await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(data)
    });
    
    setShowForm(false);
    fetchData();
  };

  const handleDelete = async (id) => {
    if (confirm('¿Eliminar promoción?')) {
      await fetch(`/api/promotions/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      fetchData();
    }
  };

  return (
    <div>
      <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '24px'}}>
        <h1 className="h1">Promociones</h1>
        <button 
          onClick={() => { setEditingPromo(null); setShowForm(true); }}
          style={{background: 'black', color: 'white', padding: '8px 16px', borderRadius: '99px'}}
        >
          Nueva Promoción
        </button>
      </div>
      <table style={{width: '100%', background: 'white', borderCollapse: 'collapse'}}>
        <thead>
          <tr>
            <th style={{padding: '16px', textAlign: 'left', borderBottom: '1px solid #E5E5E5'}}>Nombre</th>
            <th style={{padding: '16px', textAlign: 'left', borderBottom: '1px solid #E5E5E5'}}>Valor</th>
            <th style={{padding: '16px', textAlign: 'left', borderBottom: '1px solid #E5E5E5'}}>Validez</th>
            <th style={{padding: '16px', textAlign: 'right', borderBottom: '1px solid #E5E5E5'}}>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {promotions.map(p => (
            <tr key={p.id} style={{borderBottom: '1px solid #E5E5E5'}}>
              <td style={{padding: '16px'}}>{p.name}</td>
              <td style={{padding: '16px'}}>{p.type === 'percentage' ? p.value+'%' : '$'+p.value}</td>
              <td style={{padding: '16px'}}>{p.start_date?.split('T')[0]} a {p.end_date?.split('T')[0]}</td>
              <td style={{padding: '16px', textAlign: 'right'}}>
                <button onClick={() => { setEditingPromo(p); setShowForm(true); }} style={{marginRight: '8px'}}>✏️</button>
                <button onClick={() => handleDelete(p.id)}>🗑️</button>
              </td>
            </tr>
          ))}
          {promotions.length === 0 && <tr><td colSpan="4" style={{padding: '16px', textAlign: 'center'}}>No hay promociones.</td></tr>}
        </tbody>
      </table>

      {showForm && (
        <PromotionForm 
          promotion={editingPromo}
          products={products}
          categories={categories}
          onClose={() => setShowForm(false)}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
