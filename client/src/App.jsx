import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import Layout from './components/layout/Layout';
import HomePage from './pages/HomePage';
import CatalogPage from './pages/CatalogPage';
import ProductDetailPage from './pages/ProductDetailPage';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/admin/DashboardPage';
import ProductsPage from './pages/admin/ProductsPage';
import CategoriesPage from './pages/admin/CategoriesPage';
import PromotionsPage from './pages/admin/PromotionsPage';
import SubscribersPage from './pages/admin/SubscribersPage';
import SettingsPage from './pages/admin/SettingsPage';
import AdminLayout from './components/admin/AdminLayout';

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<HomePage />} />
            <Route path="catalogo" element={<CatalogPage />} />
            <Route path="producto/:id" element={<ProductDetailPage />} />
            <Route path="login" element={<LoginPage />} />
          </Route>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<DashboardPage />} />
            <Route path="productos" element={<ProductsPage />} />
            <Route path="categorias" element={<CategoriesPage />} />
            <Route path="promociones" element={<PromotionsPage />} />
            <Route path="suscriptores" element={<SubscribersPage />} />
            <Route path="configuracion" element={<SettingsPage />} />
          </Route>
        </Routes>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
