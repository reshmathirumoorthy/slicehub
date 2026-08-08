import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import EmptyState from '../components/ui/EmptyState';
import GlassCard from '../components/ui/GlassCard';
import { OrderRowSkeleton } from '../components/ui/Skeleton';
import { getUserToken } from '../services/api';
import { fetchMyOrders } from '../services/orderService';
import {
  formatPrice,
  formatStatus,
  ORDER_STATUS_TONE,
} from '../utils/media';

function Orders() {
  const signedIn = Boolean(getUserToken());
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!signedIn) {
      setLoading(false);
      return;
    }
    let active = true;
    setLoading(true);
    fetchMyOrders()
      .then((data) => {
        if (!active) return;
        setOrders(data.orders || []);
        setError('');
      })
      .catch((err) => {
        if (!active) return;
        setError(err.response?.data?.message || 'Could not load orders');
        toast.error(err.response?.data?.message || 'Could not load orders');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [signedIn]);

  if (!signedIn) {
    return (
      <GlassCard className="p-8 text-center">
        <h1 className="font-display text-2xl font-bold">Sign in to view orders</h1>
        <p className="mt-2 text-[var(--muted)]">
          Order history is available after you log in.
        </p>
        <Button to="/login" className="mt-6">
          Sign in
        </Button>
      </GlassCard>
    );
  }

  if (!loading && error && orders.length === 0) {
    return (
      <GlassCard className="p-8 text-center">
        <h1 className="font-display text-2xl font-bold">Orders unavailable</h1>
        <p className="mt-2 text-[var(--muted)]">{error}</p>
      </GlassCard>
    );
  }

  if (!loading && orders.length === 0) {
    return (
      <div className="space-y-6">
        <header>
          <h1 className="font-display text-3xl font-extrabold">Orders</h1>
        </header>
        <EmptyState
          title="No orders yet"
          description="When you place an order, tracking starts here."
          actionLabel="Browse menu"
          actionTo="/menu"
        />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-display text-3xl font-extrabold">Orders</h1>
        <p className="mt-2 text-[var(--muted)]">
          Track every pizza from kitchen to door.
        </p>
      </header>

      <div className="space-y-4">
        {loading
          ? Array.from({ length: 3 }).map((_, i) => (
              <OrderRowSkeleton key={i} />
            ))
          : orders.map((order) => (
              <GlassCard key={order.id} className="p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-display text-lg font-bold">
                        {order.orderNumber}
                      </h2>
                      <Badge tone={ORDER_STATUS_TONE[order.status] || 'muted'}>
                        {formatStatus(order.status)}
                      </Badge>
                    </div>
                    <p className="mt-1 text-sm text-[var(--muted)]">
                      {new Date(order.createdAt).toLocaleString('en-IN', {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })}
                    </p>
                    <ul className="mt-3 space-y-1 text-sm text-[var(--muted)]">
                      {order.items.map((item, index) => (
                        <li key={`${order.id}-${index}`}>
                          {item.quantity}× {item.name}{' '}
                          <span className="capitalize">
                            ({item.labels?.size || item.size})
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="flex flex-col items-start gap-3 sm:items-end">
                    <p className="font-semibold">
                      {formatPrice(order.pricing.total)}
                    </p>
                    <Button to={`/orders/${order.id}`} size="sm" variant="secondary">
                      Details
                    </Button>
                  </div>
                </div>
              </GlassCard>
            ))}
      </div>

      <p className="text-center text-sm text-[var(--muted)]">
        Looking for something else?{' '}
        <Link to="/menu" className="text-[var(--accent-soft)] underline">
          Browse the menu
        </Link>
      </p>
    </div>
  );
}

export default Orders;
