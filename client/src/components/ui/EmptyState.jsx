import { FiInbox } from 'react-icons/fi';
import Button from './Button';

function EmptyState({
  icon: Icon = FiInbox,
  title = 'Nothing here yet',
  description = 'Check back soon — fresh slices are on the way.',
  actionLabel,
  actionTo,
}) {
  return (
    <div className="glass flex flex-col items-center justify-center rounded-2xl px-6 py-16 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5 text-[var(--accent)]">
        <Icon size={26} />
      </div>
      <h3 className="font-display text-xl font-bold">{title}</h3>
      <p className="mt-2 max-w-sm text-sm text-[var(--muted)]">{description}</p>
      {actionLabel && actionTo ? (
        <Button to={actionTo} className="mt-6" size="sm">
          {actionLabel}
        </Button>
      ) : null}
    </div>
  );
}

export default EmptyState;
