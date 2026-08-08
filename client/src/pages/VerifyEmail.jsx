import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import Button from '../components/ui/Button';
import GlassCard from '../components/ui/GlassCard';
import Input from '../components/ui/Input';
import api from '../services/api';

const RESEND_COOLDOWN_SEC = 60;

/**
 * Link-based email verification (matches backend emailService verifyUrl).
 * Supports:
 *   /verify-email?token=…   → auto-verify
 *   /verify-email?email=…   → pending inbox + resend
 */
function VerifyEmail() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = String(searchParams.get('token') || '').trim();
  const emailFromQuery = String(searchParams.get('email') || '').trim();

  const [status, setStatus] = useState(() => {
    if (token) return 'verifying';
    if (emailFromQuery) return 'pending';
    return 'pending';
  });
  const [message, setMessage] = useState('');
  const [resendEmail, setResendEmail] = useState(emailFromQuery);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(emailFromQuery ? RESEND_COOLDOWN_SEC : 0);
  const [smtpHint, setSmtpHint] = useState('');

  useEffect(() => {
    if (!token) return undefined;

    let cancelled = false;

    (async () => {
      try {
        const { data } = await api.get(
          `/auth/verify-email/${encodeURIComponent(token)}`,
        );
        if (cancelled) return;
        setStatus('success');
        setMessage(data.message || 'Email verified successfully.');
        toast.success('Email verified');
      } catch (error) {
        if (cancelled) return;
        setStatus('error');
        setMessage(
          error.response?.data?.message ||
            'Invalid or expired verification link.',
        );
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token]);

  useEffect(() => {
    if (cooldown <= 0) return undefined;
    const id = setInterval(() => {
      setCooldown((value) => (value > 0 ? value - 1 : 0));
    }, 1000);
    return () => clearInterval(id);
  }, [cooldown]);

  const handleResend = useCallback(
    async (event) => {
      event?.preventDefault?.();
      const email = resendEmail.trim();
      if (!email) {
        toast.error('Enter your email');
        return;
      }
      if (cooldown > 0) {
        toast.error(`Wait ${cooldown}s before resending`);
        return;
      }

      setResending(true);
      setSmtpHint('');
      try {
        const { data } = await api.post('/auth/resend-verification', { email });
        toast.success(data.message || 'Verification email sent');
        setCooldown(RESEND_COOLDOWN_SEC);
        if (data.data?.emailSent === false) {
          setSmtpHint(
            'The server could not deliver email. Ask an admin to configure EMAIL_* SMTP settings.',
          );
        }
      } catch (error) {
        const code = error.response?.data?.code;
        const msg =
          error.response?.data?.message || 'Could not resend verification email';
        toast.error(msg);
        if (code === 'SMTP_NOT_CONFIGURED' || code === 'EMAIL_SEND_FAILED') {
          setSmtpHint(msg);
        }
        if (code === 'VERIFICATION_COOLDOWN') {
          const match = String(msg).match(/(\d+)\s+seconds/);
          if (match) setCooldown(Number(match[1]));
        }
      } finally {
        setResending(false);
      }
    },
    [cooldown, resendEmail],
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full"
    >
      <GlassCard className="w-full p-6 sm:p-8">
        <h1 className="font-display text-3xl font-bold">Verify your email</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Check your inbox for the SliceHub verification link, then open it to
          activate your account.
        </p>

        {status === 'verifying' ? (
          <p className="mt-8 text-sm text-[var(--muted)]">Verifying your link…</p>
        ) : null}

        {status === 'success' ? (
          <div className="mt-8 space-y-4">
            <p className="text-sm text-[var(--accent-soft)]">{message}</p>
            <Button to="/login" className="w-full">
              Continue to sign in
            </Button>
          </div>
        ) : null}

        {status === 'pending' || status === 'error' ? (
          <div className="mt-8 space-y-4">
            {status === 'error' ? (
              <p className="text-sm text-red-300">{message}</p>
            ) : (
              <p className="text-sm text-[var(--muted)]">
                We sent a verification link to{' '}
                <span className="text-[var(--text)]">
                  {resendEmail || 'your email'}
                </span>
                . It expires in 24 hours. Check spam if you do not see it.
              </p>
            )}

            {smtpHint ? (
              <p className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
                {smtpHint}
              </p>
            ) : null}

            <form className="space-y-3" onSubmit={handleResend}>
              <Input
                label="Email"
                type="email"
                name="email"
                value={resendEmail}
                onChange={(event) => setResendEmail(event.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                required
              />
              <Button
                type="submit"
                className="w-full"
                disabled={resending || cooldown > 0}
              >
                {resending
                  ? 'Sending…'
                  : cooldown > 0
                    ? `Resend in ${cooldown}s`
                    : 'Resend verification email'}
              </Button>
            </form>

            <div className="flex flex-col gap-2 text-center text-sm text-[var(--muted)]">
              <button
                type="button"
                className="text-[var(--accent-soft)] hover:underline"
                onClick={() => navigate('/login', { state: { email: resendEmail } })}
              >
                Already verified? Sign in
              </button>
              <Link to="/register" className="hover:underline">
                Use a different email
              </Link>
            </div>
          </div>
        ) : null}
      </GlassCard>
    </motion.div>
  );
}

export default VerifyEmail;
