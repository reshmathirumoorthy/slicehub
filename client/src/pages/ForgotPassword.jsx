import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import GlassCard from '../components/ui/GlassCard';
import api from '../services/api';

/**
 * Request a password reset email (uses existing POST /auth/forgot-password).
 */
function ForgotPassword() {
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [email, setEmail] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    const value = email.trim();
    if (!value) {
      toast.error('Enter your email');
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.post('/auth/forgot-password', { email: value });
      setSubmitted(true);
      toast.success(
        data.message ||
          'Password reset instructions have been sent to your email.',
      );
    } catch (error) {
      toast.error(
        error.response?.data?.message || 'Could not send reset email',
      );
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
        <h1 className="font-display text-3xl font-bold">Forgot password</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Enter your account email and we&apos;ll send reset instructions if an
          account exists.
        </p>

        {submitted ? (
          <div className="mt-8 space-y-4">
            <p className="text-sm text-[var(--accent-soft)]">
              Password reset instructions have been sent to your email.
            </p>
            <p className="text-xs text-[var(--muted)]">
              Check spam if you do not see it. The link expires after a short
              time. You can request again from this page if needed.
            </p>
            <Button to="/login" className="w-full">
              Back to sign in
            </Button>
            <button
              type="button"
              className="w-full text-center text-sm text-[var(--muted)] hover:text-[var(--accent-soft)]"
              onClick={() => setSubmitted(false)}
            >
              Use a different email
            </button>
          </div>
        ) : (
          <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
            <Input
              label="Email"
              name="email"
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Sending…' : 'Send reset link'}
            </Button>
            <p className="text-center text-sm text-[var(--muted)]">
              Remembered it?{' '}
              <Link
                to="/login"
                className="text-[var(--accent-soft)] hover:underline"
              >
                Sign in
              </Link>
            </p>
          </form>
        )}
      </GlassCard>
    </motion.div>
  );
}

export default ForgotPassword;
