import { FiCheck, FiCircle } from 'react-icons/fi';
import { formatStatus } from '../../utils/media';

const formatTime = (value) => {
  if (!value) return null;
  try {
    return new Date(value).toLocaleString('en-IN', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  } catch {
    return null;
  }
};

/**
 * Visual order lifecycle timeline using actual SliceHub statuses.
 */
function OrderTrackingTimeline({
  status,
  lifecycle = [],
  history = [],
  historyAvailable = false,
  paymentStatus,
  paymentPaidAt,
  cancelledAt,
  cancellationReason,
}) {
  if (status === 'cancelled') {
    return (
      <div
        className="rounded-2xl border border-[var(--danger)]/30 bg-[var(--danger)]/10 p-5"
        role="status"
        aria-live="polite"
      >
        <h2 className="font-display text-xl font-bold text-[var(--danger)]">
          Order Cancelled
        </h2>
        {cancelledAt ? (
          <p className="mt-2 text-sm text-[var(--muted)]">
            Cancelled {formatTime(cancelledAt)}
          </p>
        ) : null}
        {cancellationReason ? (
          <p className="mt-2 text-sm text-[var(--muted)]">{cancellationReason}</p>
        ) : null}
        <p className="mt-3 text-sm text-[var(--muted)]">
          Payment status: {formatStatus(paymentStatus)}
        </p>
      </div>
    );
  }

  const historyByStatus = new Map();
  for (const entry of history) {
    if (!historyByStatus.has(entry.status)) {
      historyByStatus.set(entry.status, entry);
    }
  }

  const activeIndex = lifecycle.indexOf(status);

  return (
    <div className="space-y-4">
      <ol className="space-y-0" aria-label="Order status timeline">
        {lifecycle.map((step, index) => {
          const entry = historyByStatus.get(step);
          const isCurrent = step === status;
          const isDone =
            status === 'delivered'
              ? true
              : activeIndex >= 0 && index < activeIndex;
          const isReached = isDone || isCurrent;
          const stamp = entry?.at ? formatTime(entry.at) : null;

          return (
            <li key={step} className="flex gap-3">
              <div className="flex flex-col items-center">
                <span
                  className={`flex h-8 w-8 items-center justify-center rounded-full border ${
                    isCurrent
                      ? 'border-[var(--accent)] bg-[var(--accent)]/20 text-[var(--accent-soft)]'
                      : isDone
                        ? 'border-[var(--accent)]/50 bg-[var(--accent)]/15 text-white'
                        : 'border-white/15 bg-white/5 text-[var(--muted)]'
                  }`}
                  aria-hidden="true"
                >
                  {isDone ? <FiCheck size={14} /> : <FiCircle size={12} />}
                </span>
                {index < lifecycle.length - 1 ? (
                  <span
                    className={`w-px flex-1 min-h-6 ${
                      isDone ? 'bg-[var(--accent)]/40' : 'bg-white/10'
                    }`}
                    aria-hidden="true"
                  />
                ) : null}
              </div>
              <div className="pb-5">
                <p
                  className={`text-sm font-semibold ${
                    isReached ? 'text-white' : 'text-[var(--muted)]'
                  }`}
                >
                  {formatStatus(step)}
                  {isCurrent ? (
                    <span className="ml-2 text-xs font-medium text-[var(--accent-soft)]">
                      Current
                    </span>
                  ) : null}
                </p>
                {entry?.note ? (
                  <p className="mt-0.5 text-xs text-[var(--muted)]">{entry.note}</p>
                ) : null}
                {stamp ? (
                  <p className="mt-1 text-xs text-[var(--muted)]">{stamp}</p>
                ) : historyAvailable && isReached && !isCurrent ? (
                  <p className="mt-1 text-xs text-[var(--muted)]">Completed</p>
                ) : !historyAvailable && isReached ? (
                  <p className="mt-1 text-xs text-[var(--muted)]">
                    {isCurrent ? 'In progress' : 'Completed'}
                  </p>
                ) : null}
              </div>
            </li>
          );
        })}
      </ol>

      {paymentStatus === 'paid' || paymentPaidAt ? (
        <p className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-[var(--muted)]">
          Payment confirmed
          {paymentPaidAt ? ` · ${formatTime(paymentPaidAt)}` : ''}
        </p>
      ) : (
        <p className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-[var(--muted)]">
          Payment status: {formatStatus(paymentStatus)}
        </p>
      )}

      {!historyAvailable ? (
        <p className="text-xs text-[var(--muted)]" role="note">
          Detailed tracking timestamps are not available for this older order.
          Current status is shown above.
        </p>
      ) : null}
    </div>
  );
}

export default OrderTrackingTimeline;
