import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import GlassCard from '../components/ui/GlassCard';
import api from '../services/api';

/**
 * Set a new password from the email reset link (?token=…).
 * Calls existing POST /auth/reset-password/:token.
 */
function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = useMemo(
    () => String(searchParams.get('token') || '').trim(),
    [searchParams],
  );

  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!token) {
      toast.error('Reset link is missing or invalid');
      return;
    }

    const form = new FormData(event.currentTarget);
    const password = String(form.get('password') || '');
    const confirmPassword = String(form.get('confirmPassword') || '');

    if (!password || !confirmPassword) {
      toast.error('Enter and confirm your new password');
      return;
    }
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (!/^(?=.*[A-Za-z])(?=.*\d).{8,}$/.test(password)) {
      toast.error(
        'Password must be at least 8 characters and include a letter and a number',
      );
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.post(
        `/auth/reset-password/${encodeURIComponent(token)}`,
        { password, confirmPassword },
      );
      setDone(true);
      toast.success(data.message || 'Password updated');
    } catch (error) {
      const fieldError = error.response?.data?.errors?.[0]?.message;
      toast.error(
        fieldError ||
          error.response?.data?.message ||
          'Could not reset password',
      );
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full"
      >
        <GlassCard className="w-full p-6 sm:p-8">
          <h1 className="font-display text-3xl font-bold">Reset password</h1>
          <p className="mt-4 text-sm text-red-300">
            This reset link is missing a token. Request a new link from the
            forgot password page.
          </p>
          <Button to="/forgot-password" className="mt-6 w-full">
            Request reset link
          </Button>
        </GlassCard>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full"
    >
      <GlassCard className="w-full p-6 sm:p-8">
        <h1 className="font-display text-3xl font-bold">Reset password</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Choose a new password for your SliceHub account.
        </p>

        {done ? (
          <div className="mt-8 space-y-4">
            <p className="text-sm text-[var(--accent-soft)]">
              Password reset successful. You can now log in.
            </p>
            <Button to="/login" className="w-full">
              Continue to sign in
            </Button>
          </div>
        ) : (
          <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
            <Input
              label="New password"
              name="password"
              type="password"
              placeholder="••••••••"
              autoComplete="new-password"
              required
            />
            <Input
              label="Confirm password"
              name="confirmPassword"
              type="password"
              placeholder="••••••••"
              autoComplete="new-password"
              required
            />
            <p className="text-xs text-[var(--muted)]">
              At least 8 characters, with a letter and a number.
            </p>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Updating…' : 'Update password'}
            </Button>
            <p className="text-center text-sm text-[var(--muted)]">
              <Link
                to="/forgot-password"
                className="text-[var(--accent-soft)] hover:underline"
              >
                Request a new link
              </Link>
            </p>
          </form>
        )}
      </GlassCard>
    </motion.div>
  );
}

export default ResetPassword;
