import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import styles from './CategoryManager.module.css';

export default function CategoryManager() {
  const { token } = useAuth();
  const [categories, setCategories] = useState([]);
  const [newCatName, setNewCatName] = useState('');
  const [coverFile, setCoverFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = () => {
    fetch('/api/categories')
      .then(res => res.json())
      .then(setCategories)
      .catch(console.error);
  };

  const handleCoverSelect = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setCoverFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const clearCover = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setCoverFile(null);
    setPreviewUrl('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newCatName) return;
    setUploading(true);
    try {
      let image_url = null;
      if (coverFile) {
        const uploadData = new FormData();
        uploadData.append('image', coverFile);
        const res = await fetch('/api/upload', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
          body: uploadData
        });
        if (!res.ok) throw new Error('Error al subir la imagen');
        const data = await res.json();
        image_url = data.url;
      }

      await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ name: newCatName, image_url })
      });

      clearCover();
      setNewCatName('');
      fetchData();
    } catch (error) {
      console.error(error);
      alert('Error al crear la categoría.');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (cat) => {
    if (confirm('¿Eliminar categoría?')) {
      const res = await fetch(`/api/categories/${cat.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.error || 'Error al eliminar la categoría.');
        return;
      }
      fetchData();
    }
  };

  return (
    <div className={styles.container}>
      <form onSubmit={handleAdd} className={styles.form}>
        <div className={styles.formBody}>
          <input 
            className={styles.input}
            placeholder="Nueva categoría" 
            value={newCatName} 
            onChange={e => setNewCatName(e.target.value)} 
          />
          <div className={styles.coverField}>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleCoverSelect}
              className={styles.fileInput}
            />
            {previewUrl ? (
              <div className={styles.coverPreviewWrap}>
                <img src={previewUrl} alt="Portada" className={styles.coverPreview} />
                <button type="button" className={styles.removeCover} onClick={clearCover}>✕</button>
              </div>
            ) : (
              <p className={styles.coverHint}>Foto de portada (opcional)</p>
            )}
          </div>
          <button className={styles.btn} disabled={uploading}>{uploading ? 'Guardando...' : 'Agregar'}</button>
        </div>
      </form>

      <table className={styles.table}>
        <tbody>
          {categories.map(cat => (
            <tr key={cat.id}>
              <td>
                <div className={styles.catCell}>
                  {cat.image_url
                    ? <img src={cat.image_url} alt={cat.name} className={styles.catThumb} />
                    : <div className={styles.catThumbPlaceholder}></div>}
                  <span>
                    {cat.name} {cat.product_count !== undefined ? `(${cat.product_count} productos)` : ''}
                  </span>
                </div>
              </td>
              <td style={{textAlign: 'right'}}>
                <button className={styles.deleteBtn} onClick={() => handleDelete(cat)}>🗑️</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}