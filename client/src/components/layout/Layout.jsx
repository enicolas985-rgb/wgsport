import { Outlet } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import CartDrawer from '../cart/CartDrawer';

export default function Layout() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Header />
      <main style={{ paddingTop: '64px', flex: 1 }}>
        <Outlet />
      </main>
      <Footer />
      <CartDrawer />
    </div>
  );
}
