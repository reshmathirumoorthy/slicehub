import { useState } from 'react';
import { NavLink, Outlet, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { FiMenu, FiX } from 'react-icons/fi';
import AdminSidebar from '../components/layout/AdminSidebar';
import Button from '../components/ui/Button';
import {
  AdminAuthProvider,
  useAdminAuth,
} from '../context/AdminAuthContext';

function AdminGate() {
  const { isAuthenticated, loading, admin, logout } = useAdminAuth();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-[var(--muted)]">
        Checking admin session…
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />;
  }

  return (
    <div className="app-grain flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[rgb(7_7_8_/0.85)] backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="rounded-lg p-2 text-white lg:hidden"
              aria-label="Toggle admin menu"
              onClick={() => setMobileOpen((v) => !v)}
            >
              {mobileOpen ? <FiX size={20} /> : <FiMenu size={20} />}
            </button>
            <NavLink to="/admin/dashboard" className="font-display text-lg font-bold">
              Slice<span className="text-[var(--accent)]">Hub</span> Admin
            </NavLink>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="hidden text-[var(--muted)] sm:inline">
              {admin?.name || admin?.email}
            </span>
            <Button
              size="sm"
              variant="secondary"
              onClick={async () => {
                await logout();
              }}
            >
              Sign out
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-4 py-6 lg:flex-row sm:px-6">
        <div className={`${mobileOpen ? 'block' : 'hidden'} lg:block`}>
          <AdminSidebar onNavigate={() => setMobileOpen(false)} />
        </div>
        <main className="min-w-0 flex-1 overflow-x-hidden">
          <Outlet />
        </main>
      </div>

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

/**
 * Admin console shell with auth gate (backend still enforces protectAdmin).
 */
function AdminLayout() {
  const location = useLocation();
  const isLogin = location.pathname === '/admin/login';

  return (
    <AdminAuthProvider>
      {isLogin ? (
        <div className="app-grain min-h-screen">
          <Outlet />
          <Toaster position="top-right" />
        </div>
      ) : (
        <AdminGate />
      )}
    </AdminAuthProvider>
  );
}

export default AdminLayout;
