import { useState, useEffect } from 'react';
import styles from './ProductForm.module.css';
import { useAuth } from '../../context/AuthContext';

const colorNameMap = {
  'negro': '#000000',
  'blanco': '#FFFFFF',
  'azul': '#2563EB',
  'azul marino': '#1E3A8A',
  'gris': '#6B7280',
  'rojo': '#DC2626',
  'verde': '#16A34A',
  'amarillo': '#EAB308'
};

const availableSizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
const shoeSizes = ['36', '37', '38', '39', '40', '41', '42', '43'];

function normalizeFormColors(colorsRaw) {
  if (!colorsRaw) return [];
  let list = colorsRaw;
  if (typeof list === 'string') {
    try { list = JSON.parse(list); } catch { return []; }
  }
  if (!Array.isArray(list)) return [];
  return list.map(c => {
    if (typeof c === 'object' && c !== null) {
      return {
        name: c.name || 'Color',
        hex: c.hex && c.hex.startsWith('#') ? c.hex : (colorNameMap[(c.name || '').toLowerCase()] || '#000000')
      };
    }
    const name = String(c).trim();
    return {
      name,
      hex: colorNameMap[name.toLowerCase()] || (name.startsWith('#') ? name : '#000000')
    };
  });
}

function normalizeFormSizes(sizesRaw) {
  if (!sizesRaw) return [];
  let list = sizesRaw;
  if (typeof list === 'string') {
    try { list = JSON.parse(list); } catch { return []; }
  }
  return Array.isArray(list) ? list : [];
}

function normalizeImages(imagesRaw, imageUrl) {
  const list = (Array.isArray(imagesRaw) ? imagesRaw : []).filter(Boolean);
  if (list.length) return list;
  return imageUrl ? [imageUrl] : [];
}

export default function ProductForm({ product, categories, onClose, onSave }) {
  const { token } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category_ids: [],
    sizes: [],
    colors: [],
    stock: '',
    images: []
  });
  const [pendingFiles, setPendingFiles] = useState([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (product) {
      const images = normalizeImages(product.images, product.image_url);
      setFormData({
        name: product.name,
        description: product.description || '',
        price: product.price,
        category_ids: (product.categories && product.categories.length)
          ? product.categories.map(c => c.id)
          : (product.category_id ? [product.category_id] : []),
        sizes: normalizeFormSizes(product.sizes),
        colors: normalizeFormColors(product.colors),
        stock: product.stock,
        images
      });
    } else if (categories.length > 0) {
      setFormData(prev => ({ ...prev, category_ids: [categories[0].id] }));
    }
  }, [product, categories]);

  const handleSizeToggle = (size) => {
    setFormData(prev => {
      const sizes = prev.sizes.includes(size)
        ? prev.sizes.filter(s => s !== size)
        : [...prev.sizes, size];
      return { ...prev, sizes };
    });
  };

  const handleCategoryToggle = (catId) => {
    setFormData(prev => {
      const has = prev.category_ids.includes(catId);
      const category_ids = has
        ? prev.category_ids.filter(id => id !== catId)
        : [...prev.category_ids, catId];
      return { ...prev, category_ids };
    });
  };

  const handleAddColor = () => {
    setFormData(prev => ({
      ...prev,
      colors: [...prev.colors, { name: 'Negro', hex: '#000000' }]
    }));
  };

  const handleColorChange = (index, field, value) => {
    const newColors = [...formData.colors];
    newColors[index] = { ...newColors[index], [field]: value };
    setFormData(prev => ({ ...prev, colors: newColors }));
  };

  const handleRemoveColor = (index) => {
    setFormData(prev => ({
      ...prev,
      colors: prev.colors.filter((_, i) => i !== index)
    }));
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files || []);
    setPendingFiles(prev => [...prev, ...files]);
    e.target.value = '';
  };

  const handleRemoveImage = async (index) => {
    const url = formData.images[index];
    if (!url) return;

    if (url.startsWith('/uploads/')) {
      const filename = url.replace('/uploads/', '');
      fetch(`/api/upload/${filename}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      }).catch(console.error);
    }

    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const handleRemovePending = (index) => {
    setPendingFiles(prev => prev.filter((_, i) => i !== index));
  };

  const uploadPendingFiles = async () => {
    const urls = [];
    for (const file of pendingFiles) {
      const uploadData = new FormData();
      uploadData.append('image', file);
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: uploadData
      });
      if (!res.ok) throw new Error('Error al subir imagen');
      const data = await res.json();
      urls.push(data.url);
    }
    return urls;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUploading(true);
    try {
      const finalImages = [...formData.images];
      if (pendingFiles.length > 0) {
        const newUrls = await uploadPendingFiles();
        finalImages.push(...newUrls);
      }

      const payload = {
        name: formData.name,
        description: formData.description,
        price: formData.price,
        category_ids: formData.category_ids,
        sizes: formData.sizes,
        colors: formData.colors,
        stock: formData.stock,
        images: finalImages
      };

      onSave(payload);
    } catch (error) {
      console.error(error);
      alert('Error al guardar el producto. Revisa los datos e intenta de nuevo.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <h2>{product ? 'Editar Producto' : 'Nuevo Producto'}</h2>
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.grid}>
            <div className={styles.col}>
              <div className={styles.field}>
                <label>Nombre</label>
                <input required className={styles.input} value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              <div className={styles.field}>
                <label>Descripción</label>
                <textarea className={styles.input} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} rows={3} />
              </div>
              <div className={styles.row}>
                <div className={styles.field}>
                  <label>Precio</label>
                  <input type="number" required step="0.01" className={styles.input} value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} />
                </div>
                <div className={styles.field}>
                  <label>Stock</label>
                  <input type="number" required className={styles.input} value={formData.stock} onChange={e => setFormData({...formData, stock: e.target.value})} />
                </div>
              </div>
              <div className={styles.field}>
                <label>Categorías (puedes elegir varias)</label>
                <div className={styles.categoryGrid}>
                  {categories.map(c => (
                    <button 
                      type="button" 
                      key={c.id} 
                      className={`${styles.sizeBtn} ${formData.category_ids.includes(c.id) ? styles.active : ''}`}
                      onClick={() => handleCategoryToggle(c.id)}
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            
            <div className={styles.col}>
              <div className={styles.field}>
                <label>Fotos</label>
                <input type="file" accept="image/*" multiple onChange={handleFileSelect} />
                <div className={styles.imageGrid}>
                  {formData.images.map((url, idx) => (
                    <div key={`img-${idx}`} className={styles.imageItem}>
                      <img src={url} alt={`Foto ${idx + 1}`} className={styles.photoPreview} />
                      <button type="button" className={styles.removePhoto} onClick={() => handleRemoveImage(idx)}>✕</button>
                    </div>
                  ))}
                  {pendingFiles.map((file, idx) => (
                    <div key={`file-${idx}`} className={styles.imageItem}>
                      <img src={URL.createObjectURL(file)} alt={`Nueva ${idx + 1}`} className={styles.photoPreview} />
                      <button type="button" className={styles.removePhoto} onClick={() => handleRemovePending(idx)}>✕</button>
                    </div>
                  ))}
                </div>
              </div>

              <div className={styles.field}>
                <label>Tallas de Ropa</label>
                <div className={styles.sizeGrid}>
                  {availableSizes.map(size => (
                    <button type="button" key={size} 
                      className={`${styles.sizeBtn} ${formData.sizes.includes(size) ? styles.active : ''}`}
                      onClick={() => handleSizeToggle(size)}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              <div className={styles.field}>
                <label>Tallas de Zapato</label>
                <div className={styles.sizeGrid}>
                  {shoeSizes.map(size => (
                    <button type="button" key={size} 
                      className={`${styles.sizeBtn} ${formData.sizes.includes(size) ? styles.active : ''}`}
                      onClick={() => handleSizeToggle(size)}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              <div className={styles.field}>
                <label>Colores <button type="button" onClick={handleAddColor} style={{marginLeft: '8px', cursor: 'pointer'}}>+</button></label>
                {formData.colors.map((color, idx) => (
                  <div key={idx} className={styles.colorRow}>
                    <input type="color" value={color.hex || '#000000'} onChange={e => handleColorChange(idx, 'hex', e.target.value)} />
                    <input type="text" value={color.name || ''} onChange={e => handleColorChange(idx, 'name', e.target.value)} className={styles.input} placeholder="Nombre color" />
                    <button type="button" onClick={() => handleRemoveColor(idx)}>✕</button>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          <div className={styles.actions}>
            <button type="button" onClick={onClose} className={styles.cancelBtn} disabled={uploading}>Cancelar</button>
            <button type="submit" className={styles.submitBtn} disabled={uploading}>{uploading ? 'Guardando...' : 'Guardar'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}