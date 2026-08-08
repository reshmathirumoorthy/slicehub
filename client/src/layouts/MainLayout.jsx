import { Outlet } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';

/**
 * Main storefront shell with navbar + footer.
 */
function MainLayout() {
  return (
    <div className="app-grain flex min-h-screen flex-col">
      <Navbar />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
        <Outlet />
      </main>
      <Footer />
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#111114',
            color: '#f4f4f5',
            border: '1px solid rgba(255,255,255,0.12)',
          },
        }}
      />
    </div>
  );
}

export default MainLayout;
