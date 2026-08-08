import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import EmptyState from '../../components/ui/EmptyState';
import GlassCard from '../../components/ui/GlassCard';
import Input from '../../components/ui/Input';
import StarRating from '../../components/reviews/StarRating';
import {
  fetchAdminReviews,
  setAdminReviewVisibility,
} from '../../services/reviewService';

function formatDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleString();
}

function AdminReviews() {
  const [reviews, setReviews] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [search, setSearch] = useState('');
  const [rating, setRating] = useState('');
  const [visibility, setVisibility] = useState('');
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchAdminReviews({
        search: search || undefined,
        rating: rating || undefined,
        isVisible: visibility === '' ? undefined : visibility,
        limit: 30,
      });
      setReviews(data.reviews || []);
      setPagination(data.pagination || null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not load reviews');
    } finally {
      setLoading(false);
    }
  }, [search, rating, visibility]);

  useEffect(() => {
    load();
  }, [load]);

  const toggleVisibility = async (review) => {
    const next = !review.isVisible;
    const label = next ? 'restore' : 'hide';
    if (!window.confirm(`Really ${label} this review?`)) return;
    try {
      const updated = await setAdminReviewVisibility(review.id, next);
      toast.success(next ? 'Review restored' : 'Review hidden');
      setReviews((prev) =>
        prev.map((r) => (r.id === updated.id ? updated : r)),
      );
      if (selected?.id === updated.id) setSelected(updated);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    }
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-3xl font-extrabold">Reviews</h1>
        <p className="mt-2 text-[var(--muted)]">
          Moderate customer feedback. Ownership cannot be changed.
        </p>
      </header>

      <GlassCard className="grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-4">
        <Input
          label="Search"
          placeholder="Customer, pizza, text…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <label className="block space-y-2">
          <span className="text-sm font-medium text-[var(--muted)]">Rating</span>
          <select
            value={rating}
            onChange={(e) => setRating(e.target.value)}
            className="w-full rounded-xl border border-[var(--glass-border)] bg-white/5 px-4 py-3 outline-none"
          >
            <option value="">All</option>
            {[5, 4, 3, 2, 1].map((n) => (
              <option key={n} value={n}>
                {n} stars
              </option>
            ))}
          </select>
        </label>
        <label className="block space-y-2">
          <span className="text-sm font-medium text-[var(--muted)]">
            Visibility
          </span>
          <select
            value={visibility}
            onChange={(e) => setVisibility(e.target.value)}
            className="w-full rounded-xl border border-[var(--glass-border)] bg-white/5 px-4 py-3 outline-none"
          >
            <option value="">All</option>
            <option value="true">Visible</option>
            <option value="false">Hidden</option>
          </select>
        </label>
        <div className="flex items-end">
          <Button type="button" onClick={load} disabled={loading} className="w-full">
            {loading ? 'Loading…' : 'Apply'}
          </Button>
        </div>
      </GlassCard>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="overflow-x-auto">
          {!loading && reviews.length === 0 ? (
            <EmptyState
              title="No reviews"
              description="Customer reviews will appear here."
            />
          ) : (
            <GlassCard className="overflow-x-auto p-0">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-white/10 text-[var(--muted)]">
                  <tr>
                    <th className="px-4 py-3 font-medium">Pizza</th>
                    <th className="px-4 py-3 font-medium">Customer</th>
                    <th className="px-4 py-3 font-medium">Rating</th>
                    <th className="px-4 py-3 font-medium">Date</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {reviews.map((review) => (
                    <tr
                      key={review.id}
                      className="cursor-pointer border-b border-white/5 hover:bg-white/5"
                      onClick={() => setSelected(review)}
                    >
                      <td className="px-4 py-3 font-medium">
                        {review.pizza?.name || '—'}
                      </td>
                      <td className="px-4 py-3 text-[var(--muted)]">
                        {review.user?.name || '—'}
                      </td>
                      <td className="px-4 py-3">
                        <StarRating value={review.rating} readOnly size={14} />
                      </td>
                      <td className="px-4 py-3 text-[var(--muted)]">
                        {formatDate(review.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        <Badge tone={review.isVisible ? 'success' : 'muted'}>
                          {review.isVisible ? 'Visible' : 'Hidden'}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {pagination ? (
                <p className="px-4 py-3 text-xs text-[var(--muted)]">
                  {pagination.total} total · page {pagination.page}/
                  {pagination.pages}
                </p>
              ) : null}
            </GlassCard>
          )}
        </div>

        <GlassCard className="h-fit space-y-3 p-5">
          {selected ? (
            <>
              <h2 className="font-display text-xl font-bold">Review detail</h2>
              <p className="text-sm">
                <span className="text-[var(--muted)]">Pizza:</span>{' '}
                {selected.pizza?.name}
              </p>
              <p className="text-sm">
                <span className="text-[var(--muted)]">Customer:</span>{' '}
                {selected.user?.name}
                {selected.user?.email ? ` (${selected.user.email})` : ''}
              </p>
              <StarRating value={selected.rating} readOnly />
              <p className="text-sm leading-relaxed">{selected.comment}</p>
              <p className="text-xs text-[var(--muted)]">
                {formatDate(selected.createdAt)}
              </p>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => toggleVisibility(selected)}
              >
                {selected.isVisible ? 'Hide review' : 'Restore review'}
              </Button>
            </>
          ) : (
            <p className="text-sm text-[var(--muted)]">
              Select a review to view details and moderate visibility.
            </p>
          )}
        </GlassCard>
      </div>
    </div>
  );
}

export default AdminReviews;
