import { useState, useEffect } from 'react';
import ProductTable from '../../components/admin/ProductTable';
import ProductForm from '../../components/admin/ProductForm';
import { useAuth } from '../../context/AuthContext';

export default function ProductsPage() {
  const { token } = useAuth();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  useEffect(() => {
    fetchData();
    fetchCategories();
  }, []);

  const fetchData = () => {
    fetch('/api/products')
      .then(res => res.json())
      .then(setProducts)
      .catch(console.error);
  };

  const fetchCategories = () => {
    fetch('/api/categories')
      .then(res => res.json())
      .then(setCategories)
      .catch(console.error);
  };

  const handleSave = async (data) => {
    const url = editingProduct ? `/api/products/${editingProduct.id}` : '/api/products';
    const method = editingProduct ? 'PUT' : 'POST';

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
    if (confirm('¿Seguro que deseas eliminar este producto?')) {
      await fetch(`/api/products/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      fetchData();
    }
  };

  return (
    <div>
      <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '24px'}}>
        <h1 className="h1">Productos</h1>
        <button 
          onClick={() => { setEditingProduct(null); setShowForm(true); }}
          style={{background: 'black', color: 'white', padding: '8px 16px', borderRadius: '99px'}}
        >
          Agregar Producto
        </button>
      </div>
      
      <ProductTable 
        products={products} 
        onEdit={(p) => { setEditingProduct(p); setShowForm(true); }} 
        onDelete={handleDelete} 
      />

      {showForm && (
        <ProductForm 
          product={editingProduct} 
          categories={categories}
          onClose={() => setShowForm(false)}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
