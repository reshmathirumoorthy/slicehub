import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import AddressForm from '../components/AddressForm';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import GlassCard from '../components/ui/GlassCard';
import Input from '../components/ui/Input';
import { useCart } from '../context/useCart';
import api, { clearUserToken, getUserToken } from '../services/api';
import {
  createAddress,
  deleteAddress,
  fetchAddresses,
  setDefaultAddress,
  updateAddress,
} from '../services/addressService';
import { profile } from '../data/placeholder';

function Profile() {
  const navigate = useNavigate();
  const { refreshCart } = useCart();
  const signedIn = Boolean(getUserToken());
  const [addresses, setAddresses] = useState([]);
  const [loadingAddresses, setLoadingAddresses] = useState(false);
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadAddresses = async () => {
    if (!signedIn) return;
    setLoadingAddresses(true);
    try {
      const list = await fetchAddresses();
      setAddresses(list);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not load addresses');
    } finally {
      setLoadingAddresses(false);
    }
  };

  useEffect(() => {
    loadAddresses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signedIn]);

  const handleSave = (event) => {
    event.preventDefault();
    toast.success('UI only — profile save comes later');
  };

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout').catch(() => {});
    } finally {
      clearUserToken();
      await refreshCart().catch(() => {});
      toast.success('Signed out — guest cart session active');
      navigate('/menu');
    }
  };

  const handleSubmitAddress = async (payload) => {
    setSaving(true);
    try {
      if (editing) {
        await updateAddress(editing.id, payload);
        toast.success('Address updated');
      } else {
        await createAddress(payload);
        toast.success('Address added');
      }
      setEditing(null);
      setShowForm(false);
      await loadAddresses();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not save address');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this address?')) return;
    try {
      await deleteAddress(id);
      toast.success('Address deleted');
      await loadAddresses();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not delete');
    }
  };

  const handleDefault = async (id) => {
    try {
      await setDefaultAddress(id);
      toast.success('Default address updated');
      await loadAddresses();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not update default');
    }
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-extrabold">Profile</h1>
          <p className="mt-2 text-[var(--muted)]">
            Manage your account details and saved addresses.
          </p>
        </div>
        {signedIn ? (
          <Button variant="secondary" size="sm" onClick={handleLogout}>
            Sign out
          </Button>
        ) : (
          <Button to="/login" size="sm">
            Sign in
          </Button>
        )}
      </header>

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <GlassCard className="flex flex-col items-center p-6 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-[var(--accent)]/20 font-display text-2xl font-bold text-[var(--accent-soft)]">
            {profile.name
              .split(' ')
              .map((part) => part[0])
              .join('')
              .slice(0, 2)}
          </div>
          <h2 className="mt-4 font-display text-xl font-bold">{profile.name}</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">{profile.email}</p>
          <Badge tone="ember" className="mt-4">
            Customer
          </Badge>
        </GlassCard>

        <div className="space-y-6">
          <GlassCard className="p-5 sm:p-6">
            <h3 className="font-display text-xl font-bold">Account</h3>
            <form className="mt-5 grid gap-4 sm:grid-cols-2" onSubmit={handleSave}>
              <Input
                label="Full name"
                name="name"
                defaultValue={profile.name}
                className="sm:col-span-2"
              />
              <Input
                label="Email"
                name="email"
                type="email"
                defaultValue={profile.email}
              />
              <Input
                label="Phone"
                name="phone"
                type="tel"
                defaultValue={profile.phone}
              />
              <div className="sm:col-span-2">
                <Button type="submit">Save changes</Button>
              </div>
            </form>
          </GlassCard>

          <GlassCard className="p-5 sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <h3 className="font-display text-xl font-bold">Addresses</h3>
              {signedIn ? (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    setEditing(null);
                    setShowForm(true);
                  }}
                >
                  Add new
                </Button>
              ) : null}
            </div>

            {!signedIn ? (
              <p className="mt-4 text-sm text-[var(--muted)]">
                Sign in to manage delivery addresses.
              </p>
            ) : null}

            {signedIn && (showForm || editing) ? (
              <div className="mt-5 rounded-xl border border-white/10 bg-white/5 p-4">
                <AddressForm
                  initial={editing}
                  submitting={saving}
                  onSubmit={handleSubmitAddress}
                  onCancel={() => {
                    setShowForm(false);
                    setEditing(null);
                  }}
                />
              </div>
            ) : null}

            {loadingAddresses ? (
              <p className="mt-4 text-sm text-[var(--muted)]">Loading…</p>
            ) : null}

            <div className="mt-5 grid gap-3">
              {addresses.map((address) => (
                <div
                  key={address.id}
                  className="rounded-xl border border-white/10 bg-white/5 p-4"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold capitalize">
                      {address.label}
                    </p>
                    {address.isDefault ? (
                      <Badge tone="success">Default</Badge>
                    ) : null}
                  </div>
                  <p className="mt-1 text-sm text-[var(--muted)]">
                    {address.fullName} · {address.phone}
                  </p>
                  <p className="mt-1 text-sm text-[var(--muted)]">
                    {address.street}
                    {address.landmark ? `, ${address.landmark}` : ''}
                    {', '}
                    {address.city}, {address.state} {address.postalCode}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setShowForm(false);
                        setEditing(address);
                      }}
                    >
                      Edit
                    </Button>
                    {!address.isDefault ? (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleDefault(address.id)}
                      >
                        Set default
                      </Button>
                    ) : null}
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => handleDelete(address.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
              {signedIn && !loadingAddresses && addresses.length === 0 ? (
                <p className="text-sm text-[var(--muted)]">
                  No addresses yet. Add one for faster checkout.
                </p>
              ) : null}
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}

export default Profile;
