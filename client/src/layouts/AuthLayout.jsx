import { Link, Outlet } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

/**
 * Minimal shell for login / register.
 */
function AuthLayout() {
  return (
    <div className="app-grain flex min-h-screen flex-col">
      <header className="px-4 py-6 sm:px-6">
        <Link to="/" className="font-display text-xl font-extrabold">
          Slice<span className="text-[var(--accent)]">Hub</span>
        </Link>
      </header>
      <main className="mx-auto flex w-full max-w-md flex-1 items-center px-4 pb-16">
        <Outlet />
      </main>
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

export default AuthLayout;
