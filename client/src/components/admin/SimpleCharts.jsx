import { formatPrice } from '../../utils/media';

/** Lightweight CSS bar chart — no chart library dependency */
export function BarChart({
  data = [],
  valueKey = 'value',
  labelKey = 'label',
  emptyLabel = 'No data in this range',
}) {
  if (!data.length) {
    return (
      <p className="py-8 text-center text-sm text-[var(--muted)]">{emptyLabel}</p>
    );
  }

  const max = Math.max(...data.map((d) => Number(d[valueKey]) || 0), 1);

  return (
    <div className="space-y-2">
      {data.map((row) => {
        const value = Number(row[valueKey]) || 0;
        const pct = Math.round((value / max) * 100);
        return (
          <div key={row[labelKey]} className="grid grid-cols-[88px_1fr_auto] items-center gap-2 text-xs sm:grid-cols-[110px_1fr_auto]">
            <span className="truncate text-[var(--muted)]">{row[labelKey]}</span>
            <div className="h-2 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-[var(--accent)]"
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="min-w-12 text-right font-medium">
              {row.format === 'currency' ? formatPrice(value) : value}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export function StatusPills({ data = [] }) {
  if (!data.length) {
    return (
      <p className="py-6 text-center text-sm text-[var(--muted)]">
        No orders in this range
      </p>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {data.map((row) => (
        <div
          key={row.status}
          className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm"
        >
          <span className="capitalize text-[var(--muted)]">
            {String(row.status).replace(/_/g, ' ')}
          </span>
          <span className="ml-2 font-semibold">{row.count}</span>
        </div>
      ))}
    </div>
  );
}
