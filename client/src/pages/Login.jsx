import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import GlassCard from '../components/ui/GlassCard';
import api, { setUserToken } from '../services/api';
import { useCart } from '../context/useCart';

function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { mergeGuestCart } = useCart();
  const [loading, setLoading] = useState(false);
  const [emailValue, setEmailValue] = useState(
    String(location.state?.email || ''),
  );
  const [needsVerification, setNeedsVerification] = useState(false);
  const [resending, setResending] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const email = String(form.get('email') || '').trim();
    const password = String(form.get('password') || '');
    setEmailValue(email);
    setNeedsVerification(false);

    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', { email, password });
      setUserToken(data.data.token);
      await mergeGuestCart();
      toast.success('Welcome back');
      navigate('/cart');
    } catch (error) {
      const message = error.response?.data?.message || 'Login failed';
      const code = error.response?.data?.code;
      const status = error.response?.status;
      if (
        status === 403 &&
        (code === 'EMAIL_NOT_VERIFIED' || /verify your email/i.test(String(message)))
      ) {
        setNeedsVerification(true);
      }
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!emailValue.trim()) {
      toast.error('Enter your email first');
      return;
    }
    setResending(true);
    try {
      const { data } = await api.post('/auth/resend-verification', {
        email: emailValue.trim(),
      });
      toast.success(data.message || 'Verification email sent');
      navigate(`/verify-email?email=${encodeURIComponent(emailValue.trim())}`);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not resend email');
    } finally {
      setResending(false);
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
            defaultValue={emailValue}
            onChange={(event) => setEmailValue(event.target.value)}
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
            <Link
              to="/forgot-password"
              className="text-xs text-[var(--muted)] hover:text-[var(--accent-soft)]"
            >
              Forgot password?
            </Link>
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign in'}
          </Button>
          {needsVerification ? (
            <div className="space-y-2">
              <p className="text-xs text-amber-100/90">
                Your account exists but is not verified yet.
              </p>
              <Button
                type="button"
                variant="secondary"
                className="w-full"
                disabled={resending}
                onClick={handleResendVerification}
              >
                {resending ? 'Sending…' : 'Resend verification email'}
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="w-full"
                to={`/verify-email?email=${encodeURIComponent(emailValue.trim())}`}
              >
                Open verify email page
              </Button>
            </div>
          ) : null}
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
