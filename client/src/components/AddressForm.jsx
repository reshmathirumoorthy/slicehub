import { useState } from 'react';
import Button from './ui/Button';
import Input from './ui/Input';

const emptyForm = {
  label: 'home',
  fullName: '',
  phone: '',
  street: '',
  landmark: '',
  city: '',
  state: '',
  postalCode: '',
  isDefault: false,
};

function AddressForm({
  initial = null,
  onSubmit,
  onCancel,
  submitting = false,
}) {
  const [form, setForm] = useState(() =>
    initial
      ? {
          label: initial.label || 'home',
          fullName: initial.fullName || '',
          phone: initial.phone || '',
          street: initial.street || initial.address || '',
          landmark: initial.landmark || '',
          city: initial.city || '',
          state: initial.state || '',
          postalCode: initial.postalCode || '',
          isDefault: Boolean(initial.isDefault),
        }
      : emptyForm,
  );

  const set = (key) => (event) => {
    const value =
      event.target.type === 'checkbox'
        ? event.target.checked
        : event.target.value;
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit({
      ...form,
      address: form.street,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-3 sm:grid-cols-2">
      <label className="block space-y-2 sm:col-span-2">
        <span className="text-sm font-medium text-[var(--muted)]">Label</span>
        <select
          value={form.label}
          onChange={set('label')}
          className="w-full rounded-xl border border-[var(--glass-border)] bg-white/5 px-4 py-3 outline-none focus:border-[var(--accent)]/60"
        >
          <option value="home">Home</option>
          <option value="work">Work</option>
          <option value="other">Other</option>
        </select>
      </label>
      <Input
        label="Full name"
        name="fullName"
        value={form.fullName}
        onChange={set('fullName')}
        required
      />
      <Input
        label="Phone"
        name="phone"
        type="tel"
        value={form.phone}
        onChange={set('phone')}
        required
      />
      <Input
        label="Address"
        name="street"
        value={form.street}
        onChange={set('street')}
        className="sm:col-span-2"
        required
      />
      <Input
        label="Landmark"
        name="landmark"
        value={form.landmark}
        onChange={set('landmark')}
        className="sm:col-span-2"
      />
      <Input
        label="City"
        name="city"
        value={form.city}
        onChange={set('city')}
        required
      />
      <Input
        label="State"
        name="state"
        value={form.state}
        onChange={set('state')}
        required
      />
      <Input
        label="Postal code"
        name="postalCode"
        value={form.postalCode}
        onChange={set('postalCode')}
        required
      />
      <label className="flex items-center gap-2 text-sm text-[var(--muted)] sm:col-span-2">
        <input
          type="checkbox"
          checked={form.isDefault}
          onChange={set('isDefault')}
          className="accent-[var(--accent)]"
        />
        Set as default address
      </label>
      <div className="flex flex-wrap gap-2 sm:col-span-2">
        <Button type="submit" disabled={submitting}>
          {submitting ? 'Saving…' : initial ? 'Save address' : 'Add address'}
        </Button>
        {onCancel ? (
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        ) : null}
      </div>
    </form>
  );
}

export default AddressForm;
