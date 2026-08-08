import { Outlet } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

/**
 * Bare shell for marketing landing (full-bleed hero, no constrained main).
 */
function MarketingLayout() {
  return (
    <div className="app-grain min-h-screen">
      <Outlet />
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

export default MarketingLayout;
