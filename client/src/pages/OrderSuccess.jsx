import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { FiCheckCircle, FiAlertCircle } from 'react-icons/fi';
import Button from '../components/ui/Button';
import GlassCard from '../components/ui/GlassCard';
import PayNowButton from '../components/PayNowButton';
import { fetchMyOrder } from '../services/orderService';
import { formatPrice, formatStatus } from '../utils/media';

function OrderSuccess() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState('');

  const load = () =>
    fetchMyOrder(id)
      .then((data) => {
        setOrder(data);
        setError('');
      })
      .catch((err) => {
        setError(err.response?.data?.message || 'Order not found');
      });

  useEffect(() => {
    let active = true;
    fetchMyOrder(id)
      .then((data) => {
        if (active) setOrder(data);
      })
      .catch((err) => {
        if (active) {
          setError(err.response?.data?.message || 'Order not found');
        }
      });
    return () => {
      active = false;
    };
  }, [id]);

  if (error) {
    return (
      <GlassCard className="p-8 text-center">
        <h1 className="font-display text-2xl font-bold">Order not found</h1>
        <p className="mt-2 text-[var(--muted)]">{error}</p>
        <Button to="/orders" className="mt-6">
          My orders
        </Button>
      </GlassCard>
    );
  }

  const needsPay = Boolean(order?.requiresPayment);
  const paid = order?.paymentStatus === 'paid';

  return (
    <div className="mx-auto max-w-lg space-y-6 text-center">
      <GlassCard className="space-y-4 p-8">
        {paid || !needsPay ? (
          <FiCheckCircle className="mx-auto text-[var(--success)]" size={48} />
        ) : (
          <FiAlertCircle className="mx-auto text-[var(--gold)]" size={48} />
        )}
        <h1 className="font-display text-3xl font-extrabold">
          {needsPay && !paid ? 'Complete payment' : 'Order confirmed'}
        </h1>
        <p className="text-[var(--muted)]">
          {order
            ? `${order.orderNumber} · ${formatStatus(order.status)} · payment ${formatStatus(order.paymentStatus)}`
            : 'Loading your order…'}
        </p>
        {order ? (
          <p className="text-lg font-semibold">
            {formatPrice(order.pricing.total)}
          </p>
        ) : null}

        {needsPay && !paid && order ? (
          <PayNowButton
            orderId={order.id}
            autoHint
            onPaid={() => load()}
          />
        ) : null}

        <div className="flex flex-wrap justify-center gap-3 pt-2">
          <Button to={order ? `/orders/${order.id}` : '/orders'}>
            Track order
          </Button>
          <Button to="/menu" variant="secondary">
            Order more
          </Button>
        </div>
        <p className="text-xs text-[var(--muted)]">
          You can also view this anytime under{' '}
          <Link to="/orders" className="text-[var(--accent-soft)] underline">
            My Orders
          </Link>
          .
        </p>
      </GlassCard>
    </div>
  );
}

export default OrderSuccess;
