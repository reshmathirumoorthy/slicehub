import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FiArrowLeft, FiRefreshCw } from 'react-icons/fi';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import GlassCard from '../components/ui/GlassCard';
import OrderTrackingTimeline from '../components/orders/OrderTrackingTimeline';
import { cancelMyOrder, fetchMyOrder } from '../services/orderService';
import PayNowButton from '../components/PayNowButton';
import {
  formatPrice,
  formatStatus,
  ORDER_STATUS_TONE,
} from '../utils/media';

const STATUS_HEADLINE = {
  pending: 'Your order has been placed',
  confirmed: 'Your order is confirmed',
  preparing: 'Your order is being prepared',
  baking: 'Your pizza is baking',
  out_for_delivery: 'Your order is out for delivery',
  delivered: 'Your order has been delivered',
  cancelled: 'This order was cancelled',
};

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
        Loading order tracking…
      </GlassCard>
    );
  }

  if (error || !order) {
    return (
      <GlassCard className="p-8 text-center">
        <h1 className="font-display text-2xl font-bold">
          Unable to load tracking information
        </h1>
        <p className="mt-2 text-[var(--muted)]">
          {error || 'Please try again.'}
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <Button onClick={load}>Try again</Button>
          <Button to="/orders" variant="secondary">
            Back to orders
          </Button>
        </div>
      </GlassCard>
    );
  }

  const canCancel =
    order.status === 'pending' || order.status === 'confirmed';
  const tracking = order.tracking || {};
  const lifecycle = tracking.lifecycle || [
    'pending',
    'confirmed',
    'preparing',
    'baking',
    'out_for_delivery',
    'delivered',
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          to="/orders"
          className="inline-flex items-center gap-2 text-sm text-[var(--muted)] hover:text-white"
        >
          <FiArrowLeft /> Back to orders
        </Link>
        <Button
          size="sm"
          variant="secondary"
          onClick={load}
          aria-label="Refresh tracking"
        >
          <FiRefreshCw /> Refresh
        </Button>
      </div>

      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-display text-3xl font-extrabold break-all">
              {order.orderNumber}
            </h1>
            <Badge tone={ORDER_STATUS_TONE[order.status] || 'muted'}>
              Order: {formatStatus(order.status)}
            </Badge>
            <Badge tone="muted">
              Payment: {formatStatus(order.paymentStatus)}
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

      <GlassCard className="p-5 sm:p-6">
        <p className="font-display text-xl font-bold sm:text-2xl">
          {STATUS_HEADLINE[order.status] || formatStatus(order.status)}
        </p>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Order {order.orderNumber}
        </p>
        <div className="mt-4 flex flex-wrap gap-3 text-sm">
          <span>
            Current status:{' '}
            <strong className="text-white">{formatStatus(order.status)}</strong>
          </span>
          {tracking.nextStepLabel && order.status !== 'cancelled' ? (
            <span className="text-[var(--muted)]">
              Next step: {tracking.nextStepLabel}
            </span>
          ) : null}
        </div>
        {order.estimatedDeliveryAt &&
        order.status !== 'delivered' &&
        order.status !== 'cancelled' ? (
          <p className="mt-3 text-xs text-[var(--muted)]">
            Estimated delivery window around{' '}
            {new Date(order.estimatedDeliveryAt).toLocaleString('en-IN', {
              dateStyle: 'medium',
              timeStyle: 'short',
            })}{' '}
            (approximate)
          </p>
        ) : null}
      </GlassCard>

      <GlassCard className="p-5 sm:p-6">
        <h2 className="font-display text-lg font-bold">Tracking</h2>
        <div className="mt-4">
          <OrderTrackingTimeline
            status={order.status}
            lifecycle={lifecycle}
            history={order.statusHistory || tracking.history || []}
            historyAvailable={Boolean(
              tracking.historyAvailable ??
                (order.statusHistory && order.statusHistory.length > 0),
            )}
            paymentStatus={order.paymentStatus}
            paymentPaidAt={order.payment?.paidAt || tracking.paymentPaidAt}
            cancelledAt={order.cancelledAt}
            cancellationReason={order.cancellationReason}
          />
        </div>
      </GlassCard>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <GlassCard className="space-y-4 p-5">
          <h2 className="font-display text-xl font-bold">Items</h2>
          <ul className="space-y-4">
            {order.items.map((item, index) => (
              <li
                key={`${order.id}-${index}`}
                className="flex justify-between gap-4 border-b border-white/10 pb-4 last:border-0 last:pb-0"
              >
                <div className="min-w-0">
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
                <p className="shrink-0 font-medium">
                  {formatPrice(item.lineTotal)}
                </p>
              </li>
            ))}
          </ul>
        </GlassCard>

        <div className="space-y-4">
          <GlassCard className="space-y-3 p-5 text-sm">
            <h2 className="font-display text-lg font-bold">Delivery address</h2>
            <p className="font-medium">{order.address?.fullName}</p>
            <p className="text-[var(--muted)]">{order.address?.phone}</p>
            <p className="break-words text-[var(--muted)]">
              {order.address?.street}
              {order.address?.landmark ? `, ${order.address.landmark}` : ''}
            </p>
            <p className="text-[var(--muted)]">
              {order.address?.city}, {order.address?.state}{' '}
              {order.address?.postalCode}
            </p>
          </GlassCard>

          <GlassCard className="space-y-2 p-5 text-sm">
            <h2 className="font-display text-lg font-bold">Payment</h2>
            <div className="flex justify-between text-[var(--muted)]">
              <span>Method</span>
              <span className="uppercase">{order.paymentMethod || '—'}</span>
            </div>
            <div className="flex justify-between text-[var(--muted)]">
              <span>Payment status</span>
              <span>{formatStatus(order.paymentStatus)}</span>
            </div>
            {order.payment?.refundedAt || order.paymentStatus === 'refunded' ? (
              <div className="flex justify-between text-[var(--muted)]">
                <span>Refund</span>
                <span>
                  {order.payment?.refundAmount != null
                    ? formatPrice(order.payment.refundAmount)
                    : 'Recorded'}
                </span>
              </div>
            ) : null}
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
