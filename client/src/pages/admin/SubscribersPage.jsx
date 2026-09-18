import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

export default function SubscribersPage() {
  const { token } = useAuth();
  const [subscribers, setSubscribers] = useState([]);
  const [error, setError] = useState('');

  const fetchSubscribers = () => {
    fetch('/api/subscribe', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(setSubscribers)
      .catch(() => setError('Error al cargar suscriptores.'));
  };

  useEffect(() => {
    fetchSubscribers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDelete = async (id) => {
    const res = await fetch(`/api/subscribe/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) {
      fetchSubscribers();
    } else {
      setError('Error al eliminar suscriptor.');
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
        <h1 className="h1">Suscriptores</h1>
        <span style={{ color: '#666', alignSelf: 'center' }}>{subscribers.length} suscriptores</span>
      </div>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      <table style={{ width: '100%', background: 'white' }}>
        <thead>
          <tr>
            <th style={{ padding: '16px', textAlign: 'left', borderBottom: '1px solid #E5E5E5' }}>Correo</th>
            <th style={{ padding: '16px', textAlign: 'left', borderBottom: '1px solid #E5E5E5' }}>Fecha</th>
            <th style={{ padding: '16px', textAlign: 'right', borderBottom: '1px solid #E5E5E5' }}></th>
          </tr>
        </thead>
        <tbody>
          {subscribers.map(sub => (
            <tr key={sub.id}>
              <td style={{ padding: '16px' }}>{sub.email}</td>
              <td style={{ padding: '16px' }}>
                {sub.created_at
                  ? new Date(sub.created_at).toLocaleDateString('es')
                  : ''}
              </td>
              <td style={{ padding: '16px', textAlign: 'right' }}>
                <button
                  onClick={() => handleDelete(sub.id)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px' }}
                  title="Eliminar suscriptor"
                >🗑️</button>
              </td>
            </tr>
          ))}
          {subscribers.length === 0 && (
            <tr>
              <td colSpan="3" style={{ padding: '16px', textAlign: 'center', color: '#999' }}>
                No hay suscriptores todavía.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
