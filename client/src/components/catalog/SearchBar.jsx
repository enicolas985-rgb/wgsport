import { useState, useEffect } from 'react';
import styles from './SearchBar.module.css';

export default function SearchBar({ onSearch }) {
  const [term, setTerm] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      onSearch(term);
    }, 300);
    return () => clearTimeout(timer);
  }, [term, onSearch]);

  return (
    <div className={styles.container}>
      <span className={styles.icon}>🔍</span>
      <input 
        type="text" 
        className={styles.input}
        placeholder="Buscar productos..."
        value={term}
        onChange={(e) => setTerm(e.target.value)}
      />
    </div>
  );
}
