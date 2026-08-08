import { FiStar } from 'react-icons/fi';

/**
 * Display or interactive 1–5 star control.
 */
function StarRating({
  value = 0,
  onChange,
  size = 18,
  readOnly = false,
  className = '',
}) {
  const interactive = typeof onChange === 'function' && !readOnly;
  const stars = [1, 2, 3, 4, 5];

  return (
    <div
      className={`inline-flex items-center gap-1 ${className}`}
      role={interactive ? 'radiogroup' : 'img'}
      aria-label={`${value} out of 5 stars`}
    >
      {stars.map((star) => {
        const filled = star <= Math.round(Number(value) || 0);
        if (!interactive) {
          return (
            <FiStar
              key={star}
              size={size}
              className={filled ? 'fill-[var(--gold)] text-[var(--gold)]' : 'text-white/25'}
            />
          );
        }

        return (
          <button
            key={star}
            type="button"
            role="radio"
            aria-checked={star === value}
            aria-label={`${star} star${star > 1 ? 's' : ''}`}
            onClick={() => onChange(star)}
            className="rounded p-0.5 transition hover:scale-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--accent)]"
          >
            <FiStar
              size={size}
              className={
                star <= value
                  ? 'fill-[var(--gold)] text-[var(--gold)]'
                  : 'text-white/30'
              }
            />
          </button>
        );
      })}
    </div>
  );
}

export default StarRating;
