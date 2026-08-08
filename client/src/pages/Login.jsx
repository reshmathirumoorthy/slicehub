import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import GlassCard from '../components/ui/GlassCard';
import api, { setUserToken } from '../services/api';
import { useCart } from '../context/useCart';

function Login() {
  const navigate = useNavigate();
  const { mergeGuestCart } = useCart();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const email = String(form.get('email') || '').trim();
    const password = String(form.get('password') || '');

    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', { email, password });
      setUserToken(data.data.token);
      await mergeGuestCart();
      toast.success('Welcome back');
      navigate('/cart');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full"
    >
      <GlassCard className="w-full p-6 sm:p-8">
        <h1 className="font-display text-3xl font-bold">Welcome back</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Sign in to sync your cart across devices.
        </p>

        <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
          <Input
            label="Email"
            name="email"
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
            required
          />
          <Input
            label="Password"
            name="password"
            type="password"
            placeholder="••••••••"
            autoComplete="current-password"
            required
          />
          <div className="flex justify-end">
            <button
              type="button"
              className="text-xs text-[var(--muted)] hover:text-[var(--accent-soft)]"
              onClick={() => toast('Use /api/auth/forgot-password')}
            >
              Forgot password?
            </button>
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign in'}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-[var(--muted)]">
          New to SliceHub?{' '}
          <Link to="/register" className="text-[var(--accent-soft)] hover:underline">
            Create an account
          </Link>
        </p>
      </GlassCard>
    </motion.div>
  );
}

export default Login;
