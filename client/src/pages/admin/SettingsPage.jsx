import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

export default function SettingsPage() {
  const { token } = useAuth();
  const [whatsapp, setWhatsapp] = useState('');
  const [statusMessage, setStatusMessage] = useState('');

  useEffect(() => {
    fetch('/api/settings', { headers: { 'Authorization': `Bearer ${token}` }})
      .then(res => res.json())
      .then(data => {
        if (data && data.whatsapp_number) {
          setWhatsapp(data.whatsapp_number);
        }
      })
      .catch(console.error);
  }, [token]);

  const handleSave = async () => {
    try {
      const res = await fetch('/api/settings/whatsapp_number', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ value: whatsapp })
      });
      if (res.ok) {
        setStatusMessage('Configuración guardada correctamente.');
        setTimeout(() => setStatusMessage(''), 3000);
      } else {
        setStatusMessage('Error al guardar.');
      }
    } catch (err) {
      console.error(err);
      setStatusMessage('Error al guardar.');
    }
  };

  return (
    <div>
      <h1 className="h1" style={{marginBottom: '24px'}}>Configuración</h1>
      <div style={{background: 'white', padding: '24px', border: '1px solid #E5E5E5'}}>
        <label style={{display: 'block', marginBottom: '8px', fontWeight: 'bold'}}>
          Número de WhatsApp del Vendedor (con código de país, sin + ni espacios)
        </label>
        <p style={{fontSize: '13px', color: '#666', marginBottom: '12px'}}>
          A este número llegarán todos los pedidos que hagan los clientes desde el carrito de compras.
        </p>
        <input 
          style={{background: '#EFEFEF', border: 'none', padding: '16px', width: '100%', maxWidth: '400px', marginBottom: '16px', display: 'block'}}
          value={whatsapp} 
          onChange={e => setWhatsapp(e.target.value)} 
          placeholder="Ej: 521234567890"
        />
        {statusMessage && (
          <p style={{color: statusMessage.includes('Error') ? '#d32f2f' : '#2e7d32', marginBottom: '16px', fontSize: '14px', fontWeight: 600}}>
            {statusMessage}
          </p>
        )}
        <button 
          onClick={handleSave} 
          style={{background: 'black', color: 'white', padding: '12px 28px', borderRadius: '9999px', border: 'none', cursor: 'pointer', fontWeight: 600}}
        >
          Guardar Configuración
        </button>
      </div>
    </div>
  );
}
