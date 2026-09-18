import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import styles from './LoginPage.module.css';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const success = await login(username, password);
    if (success) {
      navigate('/admin');
    } else {
      setError('Credenciales inválidas');
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h2>Acceso Administrador</h2>
        {error && <p className={styles.error}>{error}</p>}
        <form onSubmit={handleSubmit} className={styles.form}>
          <input 
            type="text" 
            placeholder="Usuario" 
            value={username}
            onChange={e => setUsername(e.target.value)}
            className={styles.input}
          />
          <input 
            type="password" 
            placeholder="Contraseña" 
            value={password}
            onChange={e => setPassword(e.target.value)}
            className={styles.input}
          />
          <button type="submit" className={styles.btn}>Ingresar</button>
        </form>
      </div>
    </div>
  );
}
