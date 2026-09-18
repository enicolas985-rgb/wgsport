import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import ProductGrid from '../components/catalog/ProductGrid';
import FilterBar from '../components/catalog/FilterBar';
import SearchBar from '../components/catalog/SearchBar';
import styles from './CatalogPage.module.css';

export default function CatalogPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  const categoryParam = searchParams.get('category') || '';
  const searchParam = searchParams.get('search') || '';
  const sortParam = searchParams.get('sort') || '';

  useEffect(() => {
    fetch('/api/categories')
      .then(res => res.json())
      .then(setCategories)
      .catch(console.error);
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (categoryParam) params.append('category', categoryParam);
    if (searchParam) params.append('search', searchParam);
    if (sortParam) params.append('sort', sortParam);

    fetch(`/api/products?${params.toString()}`)
      .then(res => res.json())
      .then(data => {
        setProducts(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [categoryParam, searchParam, sortParam]);

  const handleCategoryChange = (catId) => {
    if (catId) {
      searchParams.set('category', catId);
    } else {
      searchParams.delete('category');
    }
    setSearchParams(searchParams);
  };

  const handleSearch = (term) => {
    if (term) {
      searchParams.set('search', term);
    } else {
      searchParams.delete('search');
    }
    setSearchParams(searchParams);
  };

  const handleSortChange = (sort) => {
    if (sort) {
      searchParams.set('sort', sort);
    } else {
      searchParams.delete('sort');
    }
    setSearchParams(searchParams);
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className="h1">Catálogo</h1>
        <span className={styles.count}>{products.length} resultados</span>
      </div>
      
      <SearchBar onSearch={handleSearch} />
      <FilterBar 
        categories={categories}
        activeCategory={categoryParam}
        onCategoryChange={handleCategoryChange}
        sort={sortParam}
        onSortChange={handleSortChange}
      />
      
      <ProductGrid products={products} loading={loading} />
    </div>
  );
}
