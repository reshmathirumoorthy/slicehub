import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import GlassCard from '../components/ui/GlassCard';
import api from '../services/api';

function Register() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const payload = {
      name: String(form.get('name') || '').trim(),
      email: String(form.get('email') || '').trim(),
      phone: String(form.get('phone') || '').trim(),
      password: String(form.get('password') || ''),
    };

    setLoading(true);
    try {
      const { data } = await api.post('/auth/register', payload);
      toast.success(data.message || 'Account created — verify your email');
      const email = encodeURIComponent(payload.email);
      navigate(`/verify-email?email=${email}`);
      if (data.data?.emailSent === false) {
        toast.error(
          'Verification email was not delivered. Configure SMTP in server/.env, then use Resend.',
          { duration: 6000 },
        );
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Registration failed');
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
        <h1 className="font-display text-3xl font-bold">Join SliceHub</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Create an account to sync your cart and track deliveries.
        </p>

        <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
          <Input
            label="Full name"
            name="name"
            placeholder="Aanya Mehta"
            autoComplete="name"
            required
          />
          <Input
            label="Email"
            name="email"
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
            required
          />
          <Input
            label="Phone"
            name="phone"
            type="tel"
            placeholder="+91 98765 43210"
            autoComplete="tel"
            required
          />
          <Input
            label="Password"
            name="password"
            type="password"
            placeholder="Min. 8 characters"
            autoComplete="new-password"
            required
            minLength={8}
          />
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Creating…' : 'Create account'}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-[var(--muted)]">
          Already have an account?{' '}
          <Link to="/login" className="text-[var(--accent-soft)] hover:underline">
            Sign in
          </Link>
        </p>
      </GlassCard>
    </motion.div>
  );
}

export default Register;
