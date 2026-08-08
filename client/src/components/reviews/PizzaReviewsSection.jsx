import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import EmptyState from '../ui/EmptyState';
import GlassCard from '../ui/GlassCard';
import Skeleton from '../ui/Skeleton';
import StarRating from './StarRating';
import { getUserToken } from '../../services/api';
import {
  createReview,
  deleteReview,
  fetchPizzaReviews,
  updateReview,
} from '../../services/reviewService';

const MAX_COMMENT = 1000;
const MIN_COMMENT = 5;

function formatReviewDate(value) {
  if (!value) return '';
  try {
    return new Date(value).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return '';
  }
}

function DistributionBars({ distribution = {}, total = 0 }) {
  return (
    <div className="space-y-1.5">
      {[5, 4, 3, 2, 1].map((star) => {
        const count = distribution[star] || 0;
        const pct = total > 0 ? Math.round((count / total) * 100) : 0;
        return (
          <div key={star} className="flex items-center gap-2 text-xs">
            <span className="w-8 text-[var(--muted)]">{star}★</span>
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-[var(--gold)]/80"
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="w-8 text-right text-[var(--muted)]">{count}</span>
          </div>
        );
      })}
    </div>
  );
}

function PizzaReviewsSection({ pizzaId, onStatsChange }) {
  const signedIn = Boolean(getUserToken());
  const onStatsChangeRef = useRef(onStatsChange);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [summary, setSummary] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [myReview, setMyReview] = useState(null);
  const [eligibility, setEligibility] = useState(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    onStatsChangeRef.current = onStatsChange;
  }, [onStatsChange]);

  const load = useCallback(async () => {
    if (!pizzaId) return;
    setLoading(true);
    setError('');
    try {
      const data = await fetchPizzaReviews(pizzaId, { limit: 20 });
      setSummary(data.summary);
      setReviews(data.reviews || []);
      setMyReview(data.myReview || null);
      setEligibility(data.eligibility || null);
      if (data.myReview) {
        setRating(data.myReview.rating);
        setComment(data.myReview.comment || '');
      } else {
        setRating(5);
        setComment('');
        setEditing(false);
      }
      onStatsChangeRef.current?.(data.summary);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load reviews.');
    } finally {
      setLoading(false);
    }
  }, [pizzaId]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!rating || rating < 1 || rating > 5) {
      toast.error('Please select a rating from 1 to 5');
      return;
    }
    const text = comment.trim();
    if (!text) {
      toast.error('Review text is required');
      return;
    }
    if (text.length < MIN_COMMENT) {
      toast.error(`Review must be at least ${MIN_COMMENT} characters`);
      return;
    }
    if (text.length > MAX_COMMENT) {
      toast.error(`Review cannot exceed ${MAX_COMMENT} characters`);
      return;
    }

    setSubmitting(true);
    try {
      if (myReview && editing) {
        const updated = await updateReview(myReview.id, {
          rating,
          comment: text,
        });
        setMyReview(updated);
        setEditing(false);
        toast.success('Review updated');
      } else {
        const created = await createReview({
          pizzaId,
          orderId: eligibility?.eligibleOrderId || undefined,
          rating,
          comment: text,
        });
        setMyReview(created);
        toast.success('Thanks for your review!');
      }
      await load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not save review');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!myReview) return;
    if (!window.confirm('Delete your review? This cannot be undone.')) return;
    setSubmitting(true);
    try {
      await deleteReview(myReview.id);
      setMyReview(null);
      setEditing(false);
      setComment('');
      setRating(5);
      toast.success('Review deleted');
      await load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not delete review');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <GlassCard className="space-y-4 p-6">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-20 w-full" />
      </GlassCard>
    );
  }

  if (error) {
    return (
      <GlassCard className="p-6 text-center">
        <h2 className="font-display text-xl font-bold">Unable to load reviews</h2>
        <p className="mt-2 text-sm text-[var(--muted)]">{error}</p>
        <Button className="mt-4" size="sm" onClick={load}>
          Try again
        </Button>
      </GlassCard>
    );
  }

  const canWrite =
    signedIn && eligibility?.canReview && !myReview && !editing;
  const showForm = canWrite || (myReview && editing);

  return (
    <section className="space-y-4">
      <GlassCard className="p-6 sm:p-8">
        <h2 className="font-display text-2xl font-extrabold">
          Ratings &amp; Reviews
        </h2>

        <div className="mt-6 grid gap-6 md:grid-cols-[180px_1fr]">
          <div className="text-center md:text-left">
            <p className="font-display text-4xl font-extrabold text-[var(--gold)]">
              {summary?.averageRating?.toFixed?.(1) ??
                Number(summary?.averageRating || 0).toFixed(1)}
            </p>
            <StarRating
              value={summary?.averageRating || 0}
              readOnly
              size={20}
              className="mt-2 justify-center md:justify-start"
            />
            <p className="mt-2 text-sm text-[var(--muted)]">
              {summary?.totalReviews || 0} review
              {(summary?.totalReviews || 0) === 1 ? '' : 's'}
            </p>
          </div>
          <DistributionBars
            distribution={summary?.distribution}
            total={summary?.totalReviews || 0}
          />
        </div>
      </GlassCard>

      {myReview && !editing ? (
        <GlassCard className="space-y-3 border-[var(--accent)]/30 p-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-display text-lg font-bold">Your Review</h3>
            <Badge tone="ember">You</Badge>
          </div>
          <StarRating value={myReview.rating} readOnly />
          <p className="text-sm leading-relaxed text-[var(--text)]">
            {myReview.comment}
          </p>
          <p className="text-xs text-[var(--muted)]">
            {formatReviewDate(myReview.updatedAt || myReview.createdAt)}
            {!myReview.isVisible ? ' · Hidden by admin' : ''}
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                setEditing(true);
                setRating(myReview.rating);
                setComment(myReview.comment);
              }}
            >
              Edit
            </Button>
            <Button
              size="sm"
              variant="secondary"
              disabled={submitting}
              onClick={handleDelete}
            >
              Delete
            </Button>
          </div>
        </GlassCard>
      ) : null}

      {showForm ? (
        <GlassCard className="p-6">
          <h3 className="font-display text-lg font-bold">
            {editing ? 'Edit your review' : 'Write a review'}
          </h3>
          <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
            <div>
              <p className="mb-2 text-sm text-[var(--muted)]">Your rating</p>
              <StarRating value={rating} onChange={setRating} size={28} />
            </div>
            <label className="block space-y-2">
              <span className="text-sm font-medium text-[var(--muted)]">
                Your review
              </span>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={4}
                maxLength={MAX_COMMENT}
                placeholder="How was the pizza?"
                className="w-full rounded-xl border border-[var(--glass-border)] bg-white/5 px-4 py-3 text-sm outline-none focus:border-[var(--accent)]/50"
                required
              />
              <span className="text-xs text-[var(--muted)]">
                {comment.trim().length}/{MAX_COMMENT} · min {MIN_COMMENT} characters
              </span>
            </label>
            <div className="flex flex-wrap gap-2">
              <Button type="submit" disabled={submitting}>
                {submitting
                  ? 'Saving…'
                  : editing
                    ? 'Save changes'
                    : 'Submit review'}
              </Button>
              {editing ? (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setEditing(false);
                    setRating(myReview.rating);
                    setComment(myReview.comment);
                  }}
                >
                  Cancel
                </Button>
              ) : null}
            </div>
          </form>
        </GlassCard>
      ) : null}

      {!signedIn ? (
        <GlassCard className="p-5 text-sm text-[var(--muted)]">
          <Link to="/login" className="text-[var(--accent-soft)] hover:underline">
            Sign in
          </Link>{' '}
          to leave a review after you purchase this pizza.
        </GlassCard>
      ) : null}

      {signedIn && eligibility && !eligibility.hasPurchased && !myReview ? (
        <GlassCard className="p-5 text-sm text-[var(--muted)]">
          Order this pizza (and complete payment or delivery) to unlock reviews.
        </GlassCard>
      ) : null}

      <div className="space-y-3">
        <h3 className="font-display text-lg font-bold">Customer reviews</h3>
        {reviews.length === 0 ? (
          <EmptyState
            title="No reviews yet"
            description="Be the first to review this pizza!"
          />
        ) : (
          reviews.map((review) => (
            <GlassCard key={review.id} className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-semibold">{review.user?.name || 'Customer'}</p>
                  <p className="text-xs text-[var(--muted)]">
                    {formatReviewDate(review.createdAt)}
                  </p>
                </div>
                <StarRating value={review.rating} readOnly size={16} />
              </div>
              {review.title ? (
                <p className="mt-2 text-sm font-medium">{review.title}</p>
              ) : null}
              <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
                {review.comment}
              </p>
            </GlassCard>
          ))
        )}
      </div>
    </section>
  );
}

export default PizzaReviewsSection;
