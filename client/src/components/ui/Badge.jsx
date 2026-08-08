const tones = {
  ember: 'bg-[var(--accent)]/15 text-[var(--accent-soft)] border-[var(--accent)]/25',
  gold: 'bg-[var(--gold)]/15 text-[var(--gold)] border-[var(--gold)]/25',
  muted: 'bg-white/5 text-[var(--muted)] border-white/10',
  success: 'bg-[var(--success)]/15 text-[var(--success)] border-[var(--success)]/25',
  danger: 'bg-[var(--danger)]/15 text-[var(--danger)] border-[var(--danger)]/25',
};

function Badge({ children, tone = 'muted', className = '' }) {
  return (
    <span
      className={`inline-flex items-center rounded-lg border px-2.5 py-1 text-xs font-semibold ${tones[tone]} ${className}`}
    >
      {children}
    </span>
  );
}

export default Badge;
