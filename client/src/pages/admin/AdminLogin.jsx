import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import Button from '../../components/ui/Button';
import GlassCard from '../../components/ui/GlassCard';
import Input from '../../components/ui/Input';
import { useAdminAuth } from '../../context/AdminAuthContext';

function AdminLogin() {
  const { login, isAuthenticated, loading } = useAdminAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({
    email: 'admin@slicehub.com',
    password: 'Admin12345',
  });
  const [submitting, setSubmitting] = useState(false);

  if (!loading && isAuthenticated) {
    const redirect = location.state?.from || '/admin/dashboard';
    return <Navigate to={redirect} replace />;
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      await login(form);
      toast.success('Welcome to Admin Desk');
      navigate(location.state?.from || '/admin/dashboard', { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Admin login failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <GlassCard className="w-full max-w-md space-y-4 p-6 sm:p-8">
        <h1 className="font-display text-3xl font-bold">Admin sign in</h1>
        <p className="text-sm text-[var(--muted)]">
          Staff access only. Customer accounts cannot use this portal.
        </p>
        <form className="space-y-3" onSubmit={handleSubmit}>
          <Input
            label="Email"
            type="email"
            value={form.email}
            onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
            required
          />
          <Input
            label="Password"
            type="password"
            value={form.password}
            onChange={(e) =>
              setForm((p) => ({ ...p, password: e.target.value }))
            }
            required
          />
          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? 'Signing in…' : 'Sign in'}
          </Button>
        </form>
      </GlassCard>
    </div>
  );
}

export default AdminLogin;
