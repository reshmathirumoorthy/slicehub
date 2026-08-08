import { useState } from 'react';
import { FiTrash2, FiEdit2 } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import Button from '../components/ui/Button';
import EmptyState from '../components/ui/EmptyState';
import GlassCard from '../components/ui/GlassCard';
import Input from '../components/ui/Input';
import Skeleton from '../components/ui/Skeleton';
import { useCart } from '../context/useCart';
import { formatPrice, resolveMediaUrl } from '../utils/media';

function Cart() {
  const {
    items,
    totals,
    couponCode,
    loading,
    error,
    mutating,
    updateQuantity,
    removeItem,
    clearCart,
    applyCoupon,
    removeCoupon,
    refreshCart,
  } = useCart();
  const [couponInput, setCouponInput] = useState('');

  const handleQty = async (id, quantity) => {
    try {
      await updateQuantity(id, quantity);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not update quantity');
    }
  };

  const handleRemove = async (id) => {
    try {
      await removeItem(id);
      toast.success('Item removed');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not remove item');
    }
  };

  const handleClear = async () => {
    if (!window.confirm('Clear your entire cart?')) return;
    try {
      await clearCart();
      toast.success('Cart cleared');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not clear cart');
    }
  };

  const handleApplyCoupon = async (event) => {
    event.preventDefault();
    try {
      await applyCoupon(couponInput);
      toast.success('Coupon applied');
      setCouponInput('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid coupon');
    }
  };

  const handleRemoveCoupon = async () => {
    try {
      await removeCoupon();
      toast.success('Coupon removed');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not remove coupon');
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-40 w-full max-w-sm" />
      </div>
    );
  }

  if (error && items.length === 0) {
    return (
      <GlassCard className="p-8 text-center">
        <h1 className="font-display text-2xl font-bold">Cart unavailable</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">{error}</p>
        <Button className="mt-6" onClick={() => refreshCart().catch(() => {})}>
          Retry
        </Button>
      </GlassCard>
    );
  }

  if (items.length === 0) {
    return (
      <EmptyState
        title="Your cart is empty"
        description="Build a custom pizza — prices are validated on the server."
        actionLabel="Open pizza builder"
        actionTo="/builder"
      />
    );
  }

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-extrabold">Your cart</h1>
          <p className="mt-2 text-[var(--muted)]">
            {totals.itemCount} item{totals.itemCount === 1 ? '' : 's'} · server
            validated pricing
          </p>
        </div>
        <Button
          variant="danger"
          size="sm"
          onClick={handleClear}
          disabled={mutating}
        >
          Clear cart
        </Button>
      </header>

      {error ? (
        <div className="rounded-xl border border-[var(--danger)]/30 bg-[var(--danger)]/10 px-4 py-3 text-sm text-[var(--danger)]">
          {error}
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-4">
          {items.map((item) => (
            <GlassCard
              key={item.id}
              className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center"
            >
              {item.image ? (
                <img
                  src={resolveMediaUrl(item.image)}
                  alt={item.name}
                  className="h-28 w-full rounded-xl object-cover sm:h-24 sm:w-28"
                />
              ) : (
                <div className="flex h-28 w-full items-center justify-center rounded-xl bg-gradient-to-br from-[#3a2418] to-[#1a1210] text-xs text-[var(--muted)] sm:h-24 sm:w-28">
                  Custom pie
                </div>
              )}

              <div className="min-w-0 flex-1">
                <h2 className="font-display text-lg font-bold">{item.name}</h2>
                <p className="mt-1 text-sm text-[var(--muted)]">
                  {item.labels?.size || item.size}
                  {' · '}
                  {item.labels?.base || item.base}
                  {' · '}
                  {item.labels?.sauce || item.sauce}
                  {' · '}
                  {item.labels?.cheese || item.cheese}
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

                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <div className="flex items-center rounded-xl border border-white/10 bg-white/5">
                    <button
                      type="button"
                      className="px-3 py-1.5 disabled:opacity-40"
                      disabled={mutating}
                      onClick={() => handleQty(item.id, item.quantity - 1)}
                      aria-label="Decrease quantity"
                    >
                      −
                    </button>
                    <span className="min-w-6 text-center text-sm">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      className="px-3 py-1.5 disabled:opacity-40"
                      disabled={mutating || item.quantity >= 10}
                      onClick={() => handleQty(item.id, item.quantity + 1)}
                      aria-label="Increase quantity"
                    >
                      +
                    </button>
                  </div>

                  {item.isCustom ? (
                    <Link
                      to="/builder"
                      className="inline-flex items-center gap-1 text-sm text-[var(--accent-soft)] hover:underline"
                    >
                      <FiEdit2 size={14} /> Edit in builder
                    </Link>
                  ) : null}

                  <button
                    type="button"
                    className="inline-flex items-center gap-1 text-sm text-[var(--danger)] disabled:opacity-40"
                    disabled={mutating}
                    onClick={() => handleRemove(item.id)}
                  >
                    <FiTrash2 /> Remove
                  </button>
                </div>
              </div>

              <div className="text-left sm:text-right">
                <p className="font-semibold">
                  {formatPrice(item.lineTotal)}
                </p>
                <p className="text-xs text-[var(--muted)]">
                  {formatPrice(item.unitPrice)} each
                </p>
              </div>
            </GlassCard>
          ))}
        </div>

        <GlassCard className="h-fit space-y-4 p-5 lg:sticky lg:top-24">
          <h2 className="font-display text-xl font-bold">Order summary</h2>

          <form onSubmit={handleApplyCoupon} className="flex gap-2">
            <Input
              name="coupon"
              placeholder="Coupon code"
              value={couponInput}
              onChange={(e) => setCouponInput(e.target.value)}
              className="flex-1"
            />
            <Button type="submit" size="sm" disabled={mutating || !couponInput}>
              Apply
            </Button>
          </form>

          {couponCode ? (
            <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm">
              <span>
                Coupon <strong>{couponCode}</strong>
              </span>
              <button
                type="button"
                className="text-[var(--danger)]"
                onClick={handleRemoveCoupon}
              >
                Remove
              </button>
            </div>
          ) : null}

          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-[var(--muted)]">
              <span>Subtotal</span>
              <span>{formatPrice(totals.subtotal)}</span>
            </div>
            <div className="flex justify-between text-[var(--muted)]">
              <span>Discount</span>
              <span>-{formatPrice(totals.discount || 0)}</span>
            </div>
            <div className="flex justify-between text-[var(--muted)]">
              <span>Delivery</span>
              <span>
                {totals.deliveryFee === 0
                  ? 'Free'
                  : formatPrice(totals.deliveryFee)}
              </span>
            </div>
            <div className="flex justify-between text-[var(--muted)]">
              <span>Tax ({Math.round((totals.taxRate || 0) * 100)}%)</span>
              <span>{formatPrice(totals.tax || 0)}</span>
            </div>
            <div className="flex justify-between border-t border-white/10 pt-3 text-base font-semibold text-white">
              <span>Final total</span>
              <span>{formatPrice(totals.grandTotal)}</span>
            </div>
          </div>

          {totals.deliveryFee > 0 ? (
            <p className="text-xs text-[var(--muted)]">
              Free delivery over {formatPrice(totals.freeDeliveryMin)}.
            </p>
          ) : null}

          <Button to="/checkout" className="w-full" disabled={mutating}>
            Checkout
          </Button>
          <Button to="/builder" variant="secondary" className="w-full">
            Build another
          </Button>
        </GlassCard>
      </div>
    </div>
  );
}

export default Cart;
