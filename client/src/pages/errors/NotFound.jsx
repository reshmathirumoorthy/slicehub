import { Link, useRouteError } from 'react-router-dom';
import Button from '../../components/ui/Button';
import GlassCard from '../../components/ui/GlassCard';

function NotFound() {
  return (
    <div className="app-grain flex min-h-screen items-center justify-center px-4">
      <GlassCard className="max-w-md p-8 text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--accent-soft)]">
          404
        </p>
        <h1 className="mt-3 font-display text-3xl font-extrabold">
          Page not found
        </h1>
        <p className="mt-3 text-sm text-[var(--muted)]">
          That route doesn&apos;t exist in the SliceHub UI shell.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Button to="/">Go home</Button>
          <Button to="/menu" variant="secondary">
            Browse menu
          </Button>
        </div>
      </GlassCard>
    </div>
  );
}

export function ErrorPage() {
  const error = useRouteError();
  const message =
    error?.statusText || error?.message || 'Something went wrong.';

  return (
    <div className="app-grain flex min-h-screen items-center justify-center px-4">
      <GlassCard className="max-w-md p-8 text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--danger)]">
          Error
        </p>
        <h1 className="mt-3 font-display text-3xl font-extrabold">
          Unexpected crash
        </h1>
        <p className="mt-3 text-sm text-[var(--muted)]">{message}</p>
        <div className="mt-6 flex justify-center gap-3">
          <Button to="/">Back to safety</Button>
          <Link
            to="/home"
            className="inline-flex items-center text-sm text-[var(--muted)] hover:text-white"
          >
            Open app
          </Link>
        </div>
      </GlassCard>
    </div>
  );
}

export default NotFound;
