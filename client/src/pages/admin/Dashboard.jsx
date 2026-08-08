import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import GlassCard from '../../components/ui/GlassCard';
import EmptyState from '../../components/ui/EmptyState';
import { StatSkeleton, OrderRowSkeleton } from '../../components/ui/Skeleton';
import {
  BarChart,
  StatusPills,
} from '../../components/admin/SimpleCharts';
import {
  fetchAdminAnalytics,
  fetchAdminOverview,
} from '../../services/adminDashboardService';
import {
  formatPrice,
  formatStatus,
  ORDER_STATUS_TONE,
} from '../../utils/media';

const RANGES = [
  { id: 'today', label: 'Today' },
  { id: '7d', label: 'Last 7 days' },
  { id: '30d', label: 'Last 30 days' },
  { id: 'month', label: 'This month' },
];

function AdminDashboard() {
  const [overview, setOverview] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [range, setRange] = useState('7d');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [loadingOverview, setLoadingOverview] = useState(true);
  const [loadingAnalytics, setLoadingAnalytics] = useState(true);
  const [error, setError] = useState('');

  const loadOverview = useCallback(async () => {
    setLoadingOverview(true);
    try {
      const data = await fetchAdminOverview();
      setOverview(data);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load dashboard');
      toast.error(err.response?.data?.message || 'Dashboard unavailable');
    } finally {
      setLoadingOverview(false);
    }
  }, []);

  const loadAnalytics = useCallback(async () => {
    setLoadingAnalytics(true);
    try {
      const params =
        range === 'custom'
          ? { range: 'custom', from: customFrom, to: customTo }
          : { range };
      const data = await fetchAdminAnalytics(params);
      setAnalytics(data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Analytics unavailable');
    } finally {
      setLoadingAnalytics(false);
    }
  }, [range, customFrom, customTo]);

  useEffect(() => {
    loadOverview();
  }, [loadOverview]);

  useEffect(() => {
    if (range === 'custom' && (!customFrom || !customTo)) return;
    loadAnalytics();
  }, [loadAnalytics, range, customFrom, customTo]);

  const cards = overview
    ? [
        { label: 'Total users', value: overview.cards.totalUsers },
        { label: 'Total orders', value: overview.cards.totalOrders },
        { label: "Today's orders", value: overview.cards.todayOrders },
        {
          label: 'Total revenue',
          value: formatPrice(overview.cards.totalRevenue),
        },
        {
          label: "Today's revenue",
          value: formatPrice(overview.cards.todayRevenue),
        },
        { label: 'Pending orders', value: overview.cards.pendingOrders },
        { label: 'Completed orders', value: overview.cards.completedOrders },
        {
          label: 'Low stock',
          value: overview.cards.lowStockItems,
          tone: overview.cards.lowStockItems ? 'gold' : 'success',
        },
        {
          label: 'Out of stock',
          value: overview.cards.outOfStockItems,
          tone: overview.cards.outOfStockItems ? 'danger' : 'success',
        },
        { label: 'Total reviews', value: overview.cards.totalReviews ?? 0 },
        {
          label: 'Avg rating',
          value: Number(overview.cards.averageRating || 0).toFixed(1),
        },
        { label: '5-star reviews', value: overview.cards.fiveStarReviews ?? 0 },
        {
          label: 'Hidden reviews',
          value: overview.cards.hiddenReviews ?? 0,
          tone: overview.cards.hiddenReviews ? 'gold' : 'success',
        },
      ]
    : [];

  if (error && !overview) {
    return (
      <GlassCard className="p-8 text-center">
        <h1 className="font-display text-2xl font-bold">Dashboard error</h1>
        <p className="mt-2 text-[var(--muted)]">{error}</p>
        <Button className="mt-6" onClick={loadOverview}>
          Retry
        </Button>
      </GlassCard>
    );
  }

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-extrabold">Dashboard</h1>
          <p className="mt-2 text-[var(--muted)]">
            Live operations overview from MongoDB aggregations.
          </p>
        </div>
        <Button size="sm" variant="secondary" onClick={loadOverview}>
          Refresh
        </Button>
      </header>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {loadingOverview
          ? Array.from({ length: 9 }).map((_, i) => <StatSkeleton key={i} />)
          : cards.map((card) => (
              <GlassCard key={card.label} className="p-5">
                <p className="text-sm text-[var(--muted)]">{card.label}</p>
                <div className="mt-2 flex items-end justify-between gap-2">
                  <p className="font-display text-3xl font-bold">{card.value}</p>
                  {card.tone ? <Badge tone={card.tone}>Watch</Badge> : null}
                </div>
              </GlassCard>
            ))}
      </section>

      <GlassCard className="flex flex-wrap items-center justify-between gap-3 p-5">
        <div>
          <h2 className="font-display text-xl font-bold">Inventory snapshot</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            From Phase 10 inventory — {overview?.cards.totalInventoryItems ?? '—'}{' '}
            SKUs tracked
          </p>
        </div>
        <Button to="/admin/inventory" size="sm">
          View Inventory
        </Button>
      </GlassCard>

      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 className="font-display text-xl font-bold">Sales analytics</h2>
          <div className="flex flex-wrap gap-2">
            {RANGES.map((r) => (
              <Button
                key={r.id}
                size="sm"
                variant={range === r.id ? 'primary' : 'secondary'}
                onClick={() => setRange(r.id)}
              >
                {r.label}
              </Button>
            ))}
            <Button
              size="sm"
              variant={range === 'custom' ? 'primary' : 'secondary'}
              onClick={() => setRange('custom')}
            >
              Custom
            </Button>
          </div>
        </div>

        {range === 'custom' ? (
          <GlassCard className="flex flex-wrap gap-3 p-4">
            <label className="text-sm text-[var(--muted)]">
              From
              <input
                type="date"
                className="mt-1 block rounded-xl border border-white/10 bg-white/5 px-3 py-2"
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
              />
            </label>
            <label className="text-sm text-[var(--muted)]">
              To
              <input
                type="date"
                className="mt-1 block rounded-xl border border-white/10 bg-white/5 px-3 py-2"
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
              />
            </label>
          </GlassCard>
        ) : null}

        <div className="grid gap-4 lg:grid-cols-2">
          <GlassCard className="p-5">
            <h3 className="mb-4 font-semibold">Revenue over time</h3>
            {loadingAnalytics ? (
              <StatSkeleton />
            ) : (
              <BarChart
                data={(analytics?.revenueOverTime || []).map((r) => ({
                  label: r.date.slice(5),
                  value: r.revenue,
                  format: 'currency',
                }))}
              />
            )}
            {analytics?.summary ? (
              <p className="mt-4 text-sm text-[var(--muted)]">
                Period revenue {formatPrice(analytics.summary.revenue)} ·{' '}
                {analytics.summary.orders} orders
              </p>
            ) : null}
          </GlassCard>

          <GlassCard className="p-5">
            <h3 className="mb-4 font-semibold">Orders over time</h3>
            {loadingAnalytics ? (
              <StatSkeleton />
            ) : (
              <BarChart
                data={(analytics?.ordersOverTime || []).map((r) => ({
                  label: r.date.slice(5),
                  value: r.count,
                }))}
              />
            )}
          </GlassCard>

          <GlassCard className="p-5">
            <h3 className="mb-4 font-semibold">Orders by status</h3>
            {loadingAnalytics ? (
              <StatSkeleton />
            ) : (
              <StatusPills data={analytics?.ordersByStatus || []} />
            )}
          </GlassCard>

          <GlassCard className="p-5">
            <h3 className="mb-4 font-semibold">Most ordered pizzas</h3>
            {loadingAnalytics ? (
              <StatSkeleton />
            ) : (
              <BarChart
                data={(analytics?.topPizzas || []).map((r) => ({
                  label: r.name,
                  value: r.quantity,
                }))}
                emptyLabel="No pizza sales in this range"
              />
            )}
          </GlassCard>

          <GlassCard className="p-5 lg:col-span-2">
            <h3 className="mb-4 font-semibold">Popular categories</h3>
            {loadingAnalytics ? (
              <StatSkeleton />
            ) : (
              <BarChart
                data={(analytics?.popularCategories || []).map((r) => ({
                  label: r.category,
                  value: r.quantity,
                }))}
                emptyLabel="No category data (custom pizzas may appear as Uncategorized)"
              />
            )}
          </GlassCard>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-display text-xl font-bold">Recent orders</h2>
          <Button to="/admin/orders" size="sm" variant="secondary">
            Manage orders
          </Button>
        </div>
        {loadingOverview ? (
          Array.from({ length: 4 }).map((_, i) => <OrderRowSkeleton key={i} />)
        ) : overview?.recentOrders?.length ? (
          overview.recentOrders.map((order) => (
            <GlassCard
              key={order.id}
              className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <p className="font-semibold">{order.orderNumber}</p>
                <p className="text-sm text-[var(--muted)]">
                  {order.customer}
                  {order.email ? ` · ${order.email}` : ''}
                </p>
                <p className="text-xs text-[var(--muted)]">
                  {new Date(order.createdAt).toLocaleString('en-IN')}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone={ORDER_STATUS_TONE[order.status] || 'muted'}>
                  {formatStatus(order.status)}
                </Badge>
                <Badge tone="muted">{formatStatus(order.paymentStatus)}</Badge>
                <p className="font-semibold">{formatPrice(order.amount)}</p>
                <Button
                  to={`/admin/orders?focus=${order.id}`}
                  size="sm"
                  variant="secondary"
                >
                  View
                </Button>
              </div>
            </GlassCard>
          ))
        ) : (
          <EmptyState
            title="No orders yet"
            description="Orders will appear here after customers checkout."
          />
        )}
      </section>

      {overview?.notes ? (
        <p className="text-xs text-[var(--muted)]">
          {overview.notes.revenueDefinition}
        </p>
      ) : null}
    </div>
  );
}

export default AdminDashboard;
