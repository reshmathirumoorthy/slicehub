import { Link } from 'react-router-dom';

const variants = {
  primary:
    'bg-[var(--accent)] text-white hover:bg-[var(--accent-soft)] border-transparent',
  secondary:
    'glass text-[var(--text)] hover:bg-white/10 border-[var(--glass-border)]',
  ghost:
    'bg-transparent text-[var(--text)] hover:bg-white/5 border-transparent',
  danger:
    'bg-[var(--danger)]/15 text-[var(--danger)] border-[var(--danger)]/30 hover:bg-[var(--danger)]/25',
};

const sizes = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-5 py-2.5 text-sm',
  lg: 'px-6 py-3 text-base',
};

function Button({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  to,
  type = 'button',
  disabled = false,
  onClick,
  ...props
}) {
  const classes = [
    'inline-flex items-center justify-center gap-2 rounded-xl border font-semibold transition duration-200',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/60',
    'disabled:cursor-not-allowed disabled:opacity-50',
    variants[variant],
    sizes[size],
    className,
  ].join(' ');

  if (to) {
    return (
      <Link to={to} className={classes} {...props}>
        {children}
      </Link>
    );
  }

  return (
    <button
      type={type}
      className={classes}
      disabled={disabled}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  );
}

export default Button;
