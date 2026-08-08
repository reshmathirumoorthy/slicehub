import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import AddressForm from '../components/AddressForm';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import GlassCard from '../components/ui/GlassCard';
import Input from '../components/ui/Input';
import { useCart } from '../context/useCart';
import {
  createAddress,
  fetchAddresses,
} from '../services/addressService';
import { placeOrder } from '../services/orderService';
import { getUserToken } from '../services/api';
import { formatPrice } from '../utils/media';

function Checkout() {
  const navigate = useNavigate();
  const { items, totals, loading, refreshCart } = useCart();
  const [addresses, setAddresses] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [notes, setNotes] = useState('');
  const [loadingAddresses, setLoadingAddresses] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [savingAddress, setSavingAddress] = useState(false);
  const [placing, setPlacing] = useState(false);

  const signedIn = Boolean(getUserToken());

  useEffect(() => {
    if (!signedIn) {
      setLoadingAddresses(false);
      return;
    }
    let active = true;
    setLoadingAddresses(true);
    fetchAddresses()
      .then((list) => {
        if (!active) return;
        setAddresses(list);
        const def = list.find((a) => a.isDefault) || list[0];
        setSelectedId(def?.id || '');
        setShowForm(list.length === 0);
      })
      .catch((err) => {
        if (!active) return;
        toast.error(err.response?.data?.message || 'Could not load addresses');
      })
      .finally(() => {
        if (active) setLoadingAddresses(false);
      });
    return () => {
      active = false;
    };
  }, [signedIn]);

  const handleAddAddress = async (payload) => {
    setSavingAddress(true);
    try {
      const address = await createAddress(payload);
      setAddresses((prev) => [address, ...prev.filter((a) => a.id !== address.id)]);
      setSelectedId(address.id);
      setShowForm(false);
      toast.success('Address saved');
    } catch (err) {
      const fieldError = err.response?.data?.errors?.[0]?.message;
      toast.error(
        fieldError || err.response?.data?.message || 'Invalid address',
      );
    } finally {
      setSavingAddress(false);
    }
  };

  const handlePlaceOrder = async (event) => {
    event.preventDefault();
    if (!signedIn) {
      toast.error('Please sign in to checkout');
      navigate('/login');
      return;
    }
    if (!items.length) {
      toast.error('Your cart is empty');
      return;
    }
    if (!selectedId) {
      toast.error('Select a delivery address');
      return;
    }

    setPlacing(true);
    try {
      const order = await placeOrder({
        addressId: selectedId,
        paymentMethod,
        notes,
        clientTotal: totals.grandTotal,
      });
      await refreshCart().catch(() => {});
      toast.success('Order placed');
      navigate(`/orders/success/${order.id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not place order');
    } finally {
      setPlacing(false);
    }
  };

  if (loading) {
    return (
      <GlassCard className="p-8 text-center text-[var(--muted)]">
        Loading checkout…
      </GlassCard>
    );
  }

  if (!items.length) {
    return (
      <GlassCard className="p-8 text-center">
        <h1 className="font-display text-2xl font-bold">Nothing to checkout</h1>
        <p className="mt-2 text-[var(--muted)]">
          Add a custom pizza or menu item first.
        </p>
        <Button to="/builder" className="mt-6">
          Open builder
        </Button>
      </GlassCard>
    );
  }

  if (!signedIn) {
    return (
      <GlassCard className="p-8 text-center">
        <h1 className="font-display text-2xl font-bold">Sign in to checkout</h1>
        <p className="mt-2 text-[var(--muted)]">
          Your cart is saved. Log in to choose an address and place the order.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Button to="/login">Sign in</Button>
          <Button to="/cart" variant="secondary">
            Back to cart
          </Button>
        </div>
      </GlassCard>
    );
  }

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-display text-3xl font-extrabold">Checkout</h1>
        <p className="mt-2 text-[var(--muted)]">
          Address → summary → payment. Totals are recalculated on the server.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <GlassCard className="space-y-4 p-5 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-display text-xl font-bold">Delivery address</h2>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={() => setShowForm((v) => !v)}
              >
                {showForm ? 'Hide form' : 'Add address'}
              </Button>
            </div>

            {loadingAddresses ? (
              <p className="text-sm text-[var(--muted)]">Loading addresses…</p>
            ) : null}

            {showForm ? (
              <AddressForm
                onSubmit={handleAddAddress}
                onCancel={() => setShowForm(false)}
                submitting={savingAddress}
              />
            ) : null}

            {!loadingAddresses && addresses.length === 0 && !showForm ? (
              <p className="text-sm text-[var(--muted)]">
                Add a delivery address to continue.
              </p>
            ) : null}

            <div className="grid gap-3">
              {addresses.map((address) => (
                <label
                  key={address.id}
                  className="flex cursor-pointer gap-3 rounded-xl border border-white/10 bg-white/5 p-4 has-[:checked]:border-[var(--accent)]/50 has-[:checked]:bg-[var(--accent)]/10"
                >
                  <input
                    type="radio"
                    name="address"
                    checked={selectedId === address.id}
                    onChange={() => setSelectedId(address.id)}
                    className="mt-1 accent-[var(--accent)]"
                  />
                  <span className="min-w-0">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold capitalize">
                        {address.label}
                      </span>
                      {address.isDefault ? (
                        <Badge tone="success">Default</Badge>
                      ) : null}
                    </span>
                    <span className="mt-1 block text-sm text-[var(--muted)]">
                      {address.fullName} · {address.phone}
                    </span>
                    <span className="mt-1 block text-sm text-[var(--muted)]">
                      {address.street}
                      {address.landmark ? `, ${address.landmark}` : ''}
                      {', '}
                      {address.city}, {address.state} {address.postalCode}
                    </span>
                  </span>
                </label>
              ))}
            </div>
            <p className="text-xs text-[var(--muted)]">
              Manage saved addresses in{' '}
              <Link to="/profile" className="text-[var(--accent-soft)] underline">
                Profile
              </Link>
              .
            </p>
          </GlassCard>

          <form onSubmit={handlePlaceOrder} className="space-y-6">
            <GlassCard className="space-y-4 p-5 sm:p-6">
              <h2 className="font-display text-xl font-bold">Payment</h2>
              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  { id: 'cod', label: 'COD' },
                  { id: 'upi', label: 'UPI' },
                  { id: 'card', label: 'Card' },
                ].map((method) => (
                  <label
                    key={method.id}
                    className="flex cursor-pointer items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium has-[:checked]:border-[var(--accent)]/50 has-[:checked]:bg-[var(--accent)]/10"
                  >
                    <input
                      type="radio"
                      name="payment"
                      checked={paymentMethod === method.id}
                      onChange={() => setPaymentMethod(method.id)}
                      className="accent-[var(--accent)]"
                    />
                    {method.label}
                  </label>
                ))}
              </div>
              {paymentMethod !== 'cod' ? (
                <p className="text-xs text-[var(--muted)]">
                  UPI and Card use Razorpay TEST checkout after the order is placed.
                  The order is marked paid only after server signature verification.
                </p>
              ) : (
                <p className="text-xs text-[var(--muted)]">
                  Pay cash on delivery. No online charge is taken now.
                </p>
              )}
              <Input
                label="Order notes (optional)"
                name="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ring the bell, extra chili flakes…"
              />
            </GlassCard>

            <GlassCard className="space-y-4 p-5 lg:hidden">
              <OrderSummary
                items={items}
                totals={totals}
                placing={placing}
                selectedId={selectedId}
              />
            </GlassCard>
          </form>
        </div>

        <GlassCard className="hidden h-fit space-y-4 p-5 lg:sticky lg:top-24 lg:block">
          <form onSubmit={handlePlaceOrder}>
            <OrderSummary
              items={items}
              totals={totals}
              placing={placing}
              selectedId={selectedId}
            />
          </form>
        </GlassCard>
      </div>
    </div>
  );
}

function OrderSummary({ items, totals, placing, selectedId }) {
  return (
    <>
      <h2 className="font-display text-xl font-bold">Order summary</h2>
      <ul className="mt-4 space-y-3 text-sm">
        {items.map((item) => (
          <li key={item.id} className="flex justify-between gap-3">
            <span className="text-[var(--muted)]">
              {item.quantity}× {item.name}
            </span>
            <span>{formatPrice(item.lineTotal)}</span>
          </li>
        ))}
      </ul>
      <div className="mt-3 space-y-2 border-t border-white/10 pt-3 text-sm">
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
          <span>Tax</span>
          <span>{formatPrice(totals.tax || 0)}</span>
        </div>
        <div className="flex justify-between text-base font-semibold">
          <span>Final total</span>
          <span>{formatPrice(totals.grandTotal)}</span>
        </div>
      </div>
      <Button
        type="submit"
        className="mt-4 w-full"
        disabled={placing || !selectedId}
      >
        {placing ? 'Placing order…' : 'Place order'}
      </Button>
      <Button to="/cart" variant="ghost" className="mt-2 w-full" size="sm">
        Back to cart
      </Button>
    </>
  );
}

export default Checkout;
