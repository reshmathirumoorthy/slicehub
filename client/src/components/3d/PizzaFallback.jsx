/**
 * Static fallback when WebGL is unavailable or 3D is loading.
 */
function PizzaFallback({
  className = '',
  label = 'Interactive pizza preview',
  compact = false,
}) {
  return (
    <div
      className={`relative flex items-center justify-center overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#1a1210] via-[#24160f] to-[#0d0d0f] ${className}`}
      role="img"
      aria-label={label}
    >
      <div
        className={`relative rounded-full bg-gradient-to-br from-[#d09255] to-[#9a6b3c] shadow-[0_20px_60px_rgba(0,0,0,0.45)] ${
          compact ? 'h-40 w-40' : 'h-56 w-56 sm:h-72 sm:w-72'
        }`}
      >
        <div className="absolute inset-[12%] rounded-full bg-[#c23b22]/80" />
        <div className="absolute inset-[18%] rounded-full bg-[#fff4d6]/90" />
        <span className="absolute left-[28%] top-[30%] h-3 w-3 rounded-full bg-[#3fbf5a]" />
        <span className="absolute left-[55%] top-[40%] h-3 w-3 rounded-full bg-[#e23d28]" />
        <span className="absolute left-[40%] top-[58%] h-3 w-3 rounded-full bg-[#1f1a17]" />
        <span className="absolute left-[62%] top-[58%] h-2.5 w-2.5 rounded-full bg-[#f5d76e]" />
      </div>
      <p className="absolute bottom-4 left-0 right-0 text-center text-xs text-white/50">
        {compact ? 'Preview loading…' : '3D preview unavailable — static view'}
      </p>
    </div>
  );
}

export default PizzaFallback;
