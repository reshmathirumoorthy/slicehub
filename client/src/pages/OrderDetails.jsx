import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FiArrowLeft } from 'react-icons/fi';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import GlassCard from '../components/ui/GlassCard';
import { cancelMyOrder, fetchMyOrder } from '../services/orderService';
import PayNowButton from '../components/PayNowButton';
import {
  formatPrice,
  formatStatus,
  ORDER_STATUS_TONE,
  ORDER_STATUSES,
} from '../utils/media';

function OrderDetails() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancelling, setCancelling] = useState(false);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchMyOrder(id);
      setOrder(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Order not found');
      setOrder(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleCancel = async () => {
    if (!window.confirm('Cancel this order?')) return;
    setCancelling(true);
    try {
      const updated = await cancelMyOrder(id, 'Cancelled by customer');
      setOrder(updated);
      toast.success('Order cancelled');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not cancel');
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <GlassCard className="p-8 text-center text-[var(--muted)]">
        Loading order…
      </GlassCard>
    );
  }

  if (error || !order) {
    return (
      <GlassCard className="p-8 text-center">
        <h1 className="font-display text-2xl font-bold">Order not found</h1>
        <p className="mt-2 text-[var(--muted)]">{error}</p>
        <Button to="/orders" className="mt-6">
          Back to orders
        </Button>
      </GlassCard>
    );
  }

  const canCancel =
    order.status === 'pending' || order.status === 'confirmed';
  const flow = ORDER_STATUSES.filter((s) => s !== 'cancelled');
  const activeIndex = flow.indexOf(order.status);

  return (
    <div className="space-y-6">
      <Link
        to="/orders"
        className="inline-flex items-center gap-2 text-sm text-[var(--muted)] hover:text-white"
      >
        <FiArrowLeft /> Back to orders
      </Link>

      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-display text-3xl font-extrabold">
              {order.orderNumber}
            </h1>
            <Badge tone={ORDER_STATUS_TONE[order.status] || 'muted'}>
              {formatStatus(order.status)}
            </Badge>
          </div>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Placed{' '}
            {new Date(order.createdAt).toLocaleString('en-IN', {
              dateStyle: 'medium',
              timeStyle: 'short',
            })}
          </p>
        </div>
        {canCancel ? (
          <Button
            variant="danger"
            size="sm"
            disabled={cancelling}
            onClick={handleCancel}
          >
            {cancelling ? 'Cancelling…' : 'Cancel order'}
          </Button>
        ) : null}
      </header>

      {order.status !== 'cancelled' ? (
        <GlassCard className="p-5">
          <h2 className="font-display text-lg font-bold">Tracking</h2>
          <ol className="mt-4 grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {flow.map((step, index) => {
              const done =
                order.status === 'delivered'
                  ? true
                  : activeIndex >= 0 && index <= activeIndex;
              return (
                <li
                  key={step}
                  className={`rounded-xl border px-3 py-3 text-center text-xs font-semibold ${
                    done
                      ? 'border-[var(--accent)]/40 bg-[var(--accent)]/10 text-white'
                      : 'border-white/10 bg-white/5 text-[var(--muted)]'
                  }`}
                >
                  {formatStatus(step)}
                </li>
              );
            })}
          </ol>
        </GlassCard>
      ) : (
        <GlassCard className="p-5 text-sm text-[var(--danger)]">
          Cancelled
          {order.cancellationReason ? ` — ${order.cancellationReason}` : ''}
        </GlassCard>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <GlassCard className="space-y-4 p-5">
          <h2 className="font-display text-xl font-bold">Items</h2>
          <ul className="space-y-4">
            {order.items.map((item, index) => (
              <li
                key={`${order.id}-${index}`}
                className="flex justify-between gap-4 border-b border-white/10 pb-4 last:border-0 last:pb-0"
              >
                <div>
                  <p className="font-semibold">
                    {item.quantity}× {item.name}
                  </p>
                  <p className="mt-1 text-sm text-[var(--muted)]">
                    {[
                      item.labels?.size || item.size,
                      item.labels?.base || item.base,
                      item.labels?.sauce || item.sauce,
                      item.labels?.cheese || item.cheese,
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </p>
                  {(item.labels?.vegetables?.length || item.extraCheese) && (
                    <p className="mt-1 text-xs text-[var(--muted)]">
                      {[
                        ...(item.labels?.vegetables || []),
                        item.extraCheese ? 'Extra cheese' : null,
                      ]
                        .filter(Boolean)
                        .join(' · ')}
                    </p>
                  )}
                </div>
                <p className="font-medium">{formatPrice(item.lineTotal)}</p>
              </li>
            ))}
          </ul>
        </GlassCard>

        <div className="space-y-4">
          <GlassCard className="space-y-3 p-5 text-sm">
            <h2 className="font-display text-lg font-bold">Delivery</h2>
            <p className="font-medium">{order.address.fullName}</p>
            <p className="text-[var(--muted)]">{order.address.phone}</p>
            <p className="text-[var(--muted)]">
              {order.address.street}
              {order.address.landmark ? `, ${order.address.landmark}` : ''}
            </p>
            <p className="text-[var(--muted)]">
              {order.address.city}, {order.address.state}{' '}
              {order.address.postalCode}
            </p>
          </GlassCard>

          <GlassCard className="space-y-2 p-5 text-sm">
            <h2 className="font-display text-lg font-bold">Payment</h2>
            <div className="flex justify-between text-[var(--muted)]">
              <span>Method</span>
              <span className="uppercase">{order.paymentMethod || '—'}</span>
            </div>
            <div className="flex justify-between text-[var(--muted)]">
              <span>Status</span>
              <span>{formatStatus(order.paymentStatus)}</span>
            </div>
            <div className="flex justify-between text-[var(--muted)]">
              <span>Subtotal</span>
              <span>{formatPrice(order.pricing.subtotal)}</span>
            </div>
            <div className="flex justify-between text-[var(--muted)]">
              <span>Discount</span>
              <span>-{formatPrice(order.pricing.discount)}</span>
            </div>
            <div className="flex justify-between text-[var(--muted)]">
              <span>Delivery</span>
              <span>{formatPrice(order.pricing.deliveryFee)}</span>
            </div>
            <div className="flex justify-between text-[var(--muted)]">
              <span>Tax</span>
              <span>{formatPrice(order.pricing.tax)}</span>
            </div>
            <div className="flex justify-between border-t border-white/10 pt-2 font-semibold">
              <span>Total</span>
              <span>{formatPrice(order.pricing.total)}</span>
            </div>
            {order.requiresPayment ? (
              <div className="pt-3">
                <PayNowButton orderId={order.id} autoHint onPaid={() => load()} />
              </div>
            ) : null}
          </GlassCard>
        </div>
      </div>
    </div>
  );
}

export default OrderDetails;
