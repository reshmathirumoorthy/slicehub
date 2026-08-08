function Input({
  label,
  id,
  type = 'text',
  error,
  className = '',
  ...props
}) {
  const inputId = id || props.name;

  return (
    <label className={`block space-y-2 ${className}`}>
      {label ? (
        <span className="text-sm font-medium text-[var(--muted)]">{label}</span>
      ) : null}
      <input
        id={inputId}
        type={type}
        className={[
          'w-full rounded-xl border bg-white/5 px-4 py-3 text-[var(--text)]',
          'placeholder:text-white/30 outline-none transition',
          'focus:border-[var(--accent)]/60 focus:bg-white/[0.07]',
          error ? 'border-[var(--danger)]/50' : 'border-[var(--glass-border)]',
        ].join(' ')}
        {...props}
      />
      {error ? (
        <span className="text-xs text-[var(--danger)]">{error}</span>
      ) : null}
    </label>
  );
}

export default Input;
