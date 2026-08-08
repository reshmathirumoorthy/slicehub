import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import EmptyState from '../../components/ui/EmptyState';
import GlassCard from '../../components/ui/GlassCard';
import Input from '../../components/ui/Input';
import {
  fetchAdminOrder,
  fetchAdminOrders,
  updateAdminOrderStatus,
} from '../../services/orderService';
import {
  formatPrice,
  formatStatus,
  ORDER_STATUS_TONE,
  ORDER_STATUSES,
} from '../../utils/media';

const PAYMENT_STATUSES = [
  'created',
  'pending',
  'paid',
  'failed',
  'refunded',
];

function AdminOrders() {
  const [searchParams] = useSearchParams();
  const [orders, setOrders] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selected, setSelected] = useState(null);
  const [updating, setUpdating] = useState(false);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchAdminOrders({
        search: search || undefined,
        status: status || undefined,
        paymentStatus: paymentStatus || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        limit: 30,
      });
      setOrders(data.orders || []);
      setPagination(data.pagination || null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not load orders');
    } finally {
      setLoading(false);
    }
  }, [search, status, paymentStatus, dateFrom, dateTo]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const openOrder = useCallback(async (id) => {
    try {
      const order = await fetchAdminOrder(id);
      setSelected(order);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not load order');
    }
  }, []);

  useEffect(() => {
    const focus = searchParams.get('focus');
    if (focus) openOrder(focus);
  }, [searchParams, openOrder]);

  const handleStatus = async (nextStatus) => {
    if (!selected) return;
    if (
      !window.confirm(
        `Update ${selected.orderNumber} to ${formatStatus(nextStatus)}?`,
      )
    ) {
      return;
    }
    setUpdating(true);
    try {
      const order = await updateAdminOrderStatus(selected.id, nextStatus);
      setSelected(order);
      toast.success(`Status → ${formatStatus(nextStatus)}`);
      await loadOrders();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Status update failed');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-3xl font-extrabold">Orders</h1>
        <p className="mt-2 text-[var(--muted)]">
          Search, filter, and update fulfillment status.
        </p>
      </header>

      <GlassCard className="grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-5">
        <Input
          label="Search"
          placeholder="Order #, name, phone…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <label className="block space-y-2">
          <span className="text-sm font-medium text-[var(--muted)]">Status</span>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full rounded-xl border border-[var(--glass-border)] bg-white/5 px-4 py-3 outline-none"
          >
            <option value="">All</option>
            {ORDER_STATUSES.map((s) => (
              <option key={s} value={s}>
                {formatStatus(s)}
              </option>
            ))}
          </select>
        </label>
        <label className="block space-y-2">
          <span className="text-sm font-medium text-[var(--muted)]">
            Payment
          </span>
          <select
            value={paymentStatus}
            onChange={(e) => setPaymentStatus(e.target.value)}
            className="w-full rounded-xl border border-[var(--glass-border)] bg-white/5 px-4 py-3 outline-none"
          >
            <option value="">All</option>
            {PAYMENT_STATUSES.map((s) => (
              <option key={s} value={s}>
                {formatStatus(s)}
              </option>
            ))}
          </select>
        </label>
        <Input
          label="From"
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
        />
        <Input
          label="To"
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
        />
        <div className="md:col-span-2 xl:col-span-5">
          <Button type="button" onClick={loadOrders} disabled={loading}>
            {loading ? 'Loading…' : 'Apply filters'}
          </Button>
        </div>
      </GlassCard>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-3">
          {!loading && orders.length === 0 ? (
            <EmptyState
              title="No orders"
              description="Try widening filters or wait for new checkouts."
            />
          ) : null}
          {orders.map((order) => (
            <button
              key={order.id}
              type="button"
              onClick={() => openOrder(order.id)}
              className="w-full text-left"
            >
              <GlassCard className="p-4 transition hover:border-[var(--accent)]/30">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-display font-bold">
                        {order.orderNumber}
                      </span>
                      <Badge tone={ORDER_STATUS_TONE[order.status] || 'muted'}>
                        {formatStatus(order.status)}
                      </Badge>
                      <Badge tone="muted">
                        {formatStatus(order.paymentStatus)}
                      </Badge>
                    </div>
                    <p className="mt-1 text-sm text-[var(--muted)]">
                      {order.user?.name || order.address?.fullName} ·{' '}
                      {order.user?.email || order.address?.phone}
                    </p>
                    <p className="mt-1 text-xs text-[var(--muted)]">
                      {new Date(order.createdAt).toLocaleString('en-IN')}
                    </p>
                  </div>
                  <span className="font-semibold">
                    {formatPrice(order.pricing.total)}
                  </span>
                </div>
              </GlassCard>
            </button>
          ))}
          {pagination ? (
            <p className="text-center text-xs text-[var(--muted)]">
              {pagination.total} order{pagination.total === 1 ? '' : 's'}
            </p>
          ) : null}
        </div>

        <GlassCard className="h-fit space-y-4 p-5 lg:sticky lg:top-24">
          {!selected ? (
            <p className="text-sm text-[var(--muted)]">
              Select an order to view items, customer, and update status.
            </p>
          ) : (
            <>
              <div>
                <h2 className="font-display text-xl font-bold">
                  {selected.orderNumber}
                </h2>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Badge tone={ORDER_STATUS_TONE[selected.status] || 'muted'}>
                    {formatStatus(selected.status)}
                  </Badge>
                  <Badge tone="muted">
                    {formatStatus(selected.paymentStatus)}
                  </Badge>
                </div>
              </div>
              <div className="space-y-1 text-sm text-[var(--muted)]">
                <p>
                  {selected.user?.name || selected.address?.fullName}
                  {selected.user?.email ? ` · ${selected.user.email}` : ''}
                </p>
                <p>
                  {selected.address?.street}, {selected.address?.city}
                </p>
                <p className="font-semibold text-white">
                  {formatPrice(selected.pricing.total)}
                </p>
              </div>
              <ul className="max-h-48 space-y-2 overflow-y-auto text-sm">
                {selected.items.map((item, i) => (
                  <li key={`${selected.id}-${i}`} className="text-[var(--muted)]">
                    {item.quantity}× {item.name}
                    <span className="block text-xs">
                      {[
                        item.labels?.size || item.size,
                        item.labels?.base || item.base,
                        item.labels?.sauce || item.sauce,
                        item.labels?.cheese || item.cheese,
                      ]
                        .filter(Boolean)
                        .join(' · ')}
                    </span>
                  </li>
                ))}
              </ul>

              <div className="space-y-2">
                <p className="text-sm font-medium text-[var(--muted)]">
                  Status history
                </p>
                {selected.statusHistory?.length ? (
                  <ul className="max-h-40 space-y-2 overflow-y-auto text-xs text-[var(--muted)]">
                    {selected.statusHistory.map((entry, i) => (
                      <li
                        key={`${selected.id}-hist-${i}`}
                        className="rounded-lg border border-white/10 px-3 py-2"
                      >
                        <span className="font-semibold text-white">
                          {formatStatus(entry.status)}
                        </span>
                        <span className="mt-0.5 block">
                          {entry.at
                            ? new Date(entry.at).toLocaleString()
                            : '—'}
                          {entry.note ? ` · ${entry.note}` : ''}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-[var(--muted)]">
                    Tracking history is not available for this order.
                  </p>
                )}
              </div>

              <label className="block space-y-2">
                <span className="text-sm font-medium text-[var(--muted)]">
                  Update status
                </span>
                <select
                  disabled={updating}
                  value={selected.status}
                  onChange={(e) => handleStatus(e.target.value)}
                  className="w-full rounded-xl border border-[var(--glass-border)] bg-white/5 px-4 py-3 outline-none"
                >
                  {ORDER_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {formatStatus(s)}
                    </option>
                  ))}
                </select>
              </label>
            </>
          )}
        </GlassCard>
      </div>
    </div>
  );
}

export default AdminOrders;
