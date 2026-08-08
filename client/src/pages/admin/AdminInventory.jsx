import { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import EmptyState from '../../components/ui/EmptyState';
import GlassCard from '../../components/ui/GlassCard';
import Input from '../../components/ui/Input';
import {
  addStock,
  adjustStock,
  fetchInventory,
  setThreshold,
  triggerInventoryAlerts,
  updateInventoryItem,
} from '../../services/inventoryService';
import { formatLabel } from '../../utils/media';

const statusTone = {
  in_stock: 'success',
  low_stock: 'gold',
  out_of_stock: 'danger',
};

function AdminInventory() {
  const [items, setItems] = useState([]);
  const [summary, setSummary] = useState({
    total: 0,
    lowStock: 0,
    outOfStock: 0,
  });
  const [loading, setLoading] = useState(false);
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [dialog, setDialog] = useState(null);
  const [form, setForm] = useState({
    quantity: '',
    delta: '',
    threshold: '',
    setQty: '',
  });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchInventory({
        category: category || undefined,
        status: status || undefined,
        search: search || undefined,
      });
      setItems(data.items || []);
      setSummary(data.summary || { total: 0, lowStock: 0, outOfStock: 0 });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not load inventory');
    } finally {
      setLoading(false);
    }
  }, [category, status, search]);

  useEffect(() => {
    load();
  }, [load]);

  const openDialog = (item) => {
    setDialog(item);
    setForm({
      quantity: '10',
      delta: '-1',
      threshold: String(item.minimumThreshold),
      setQty: String(item.quantityInStock),
    });
  };

  const handleSaveDialog = async (event) => {
    event.preventDefault();
    if (!dialog) return;
    setSaving(true);
    try {
      if (form.quantity && Number(form.quantity) > 0) {
        await addStock(dialog.id, Number(form.quantity));
      }
      if (form.delta && Number(form.delta) !== 0) {
        await adjustStock(dialog.id, Number(form.delta));
      }
      if (
        form.threshold !== '' &&
        Number(form.threshold) !== dialog.minimumThreshold
      ) {
        await setThreshold(dialog.id, Number(form.threshold));
      }
      if (
        form.setQty !== '' &&
        Number(form.setQty) !== dialog.quantityInStock
      ) {
        await updateInventoryItem(dialog.id, {
          quantityInStock: Number(form.setQty),
        });
      }
      toast.success('Inventory updated');
      setDialog(null);
      await load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  const cards = useMemo(
    () => [
      { label: 'Total SKUs', value: summary.total, tone: 'muted' },
      { label: 'Low stock', value: summary.lowStock, tone: 'gold' },
      { label: 'Out of stock', value: summary.outOfStock, tone: 'danger' },
    ],
    [summary],
  );

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-extrabold">Inventory</h1>
          <p className="mt-2 text-[var(--muted)]">
            Bases, sauces, cheese, and vegetables — deducted only after payment.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={async () => {
              try {
                const result = await triggerInventoryAlerts();
                toast.success(
                  result.sent
                    ? `Alert sent (${result.count} items)`
                    : result.reason || 'No alert needed',
                );
              } catch (err) {
                toast.error(err.response?.data?.message || 'Alert failed');
              }
            }}
          >
            Run low-stock check
          </Button>
        </div>
      </header>

      <div className="grid gap-3 sm:grid-cols-3">
        {cards.map((card) => (
          <GlassCard key={card.label} className="p-4">
            <p className="text-xs uppercase tracking-wide text-[var(--muted)]">
              {card.label}
            </p>
            <p className="mt-2 font-display text-3xl font-bold">{card.value}</p>
            {card.tone !== 'muted' ? (
              <Badge tone={card.tone} className="mt-2">
                Attention
              </Badge>
            ) : null}
          </GlassCard>
        ))}
      </div>

      <GlassCard className="flex flex-col gap-3 p-4 lg:flex-row lg:items-end">
        <Input
          label="Search"
          placeholder="Name, SKU, key…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1"
        />
        <label className="block space-y-2 lg:w-40">
          <span className="text-sm font-medium text-[var(--muted)]">
            Category
          </span>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full rounded-xl border border-[var(--glass-border)] bg-white/5 px-4 py-3 outline-none"
          >
            <option value="">All</option>
            <option value="base">Base</option>
            <option value="sauce">Sauce</option>
            <option value="cheese">Cheese</option>
            <option value="vegetable">Vegetable</option>
          </select>
        </label>
        <label className="block space-y-2 lg:w-44">
          <span className="text-sm font-medium text-[var(--muted)]">Status</span>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full rounded-xl border border-[var(--glass-border)] bg-white/5 px-4 py-3 outline-none"
          >
            <option value="">All</option>
            <option value="in_stock">In stock</option>
            <option value="low_stock">Low stock</option>
            <option value="out_of_stock">Out of stock</option>
          </select>
        </label>
        <Button type="button" onClick={load} disabled={loading}>
          {loading ? 'Loading…' : 'Apply'}
        </Button>
      </GlassCard>

      {!loading && items.length === 0 ? (
        <EmptyState
          title="No inventory rows"
          description="Run npm run seed:inventory on the server, then refresh."
        />
      ) : (
        <GlassCard className="overflow-x-auto p-0">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-white/10 text-[var(--muted)]">
              <tr>
                <th className="px-4 py-3 font-medium">Item</th>
                <th className="px-4 py-3 font-medium">Category</th>
                <th className="px-4 py-3 font-medium">Stock</th>
                <th className="px-4 py-3 font-medium">Threshold</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr
                  key={item.id}
                  className="border-b border-white/5 last:border-0"
                >
                  <td className="px-4 py-3">
                    <p className="font-semibold">{item.name}</p>
                    <p className="text-xs text-[var(--muted)]">{item.sku}</p>
                  </td>
                  <td className="px-4 py-3 capitalize">{item.category}</td>
                  <td className="px-4 py-3">
                    {item.quantityInStock} {item.unit}
                  </td>
                  <td className="px-4 py-3">{item.minimumThreshold}</td>
                  <td className="px-4 py-3">
                    <Badge tone={statusTone[item.stockStatus] || 'muted'}>
                      {formatLabel(item.stockStatus)}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => openDialog(item)}
                    >
                      Update
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </GlassCard>
      )}

      {dialog ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <GlassCard className="w-full max-w-md space-y-4 p-6">
            <h2 className="font-display text-xl font-bold">
              Update {dialog.name}
            </h2>
            <p className="text-sm text-[var(--muted)]">
              Current stock: {dialog.quantityInStock} {dialog.unit}
            </p>
            <form className="space-y-3" onSubmit={handleSaveDialog}>
              <Input
                label="Add stock (+)"
                type="number"
                min="0"
                value={form.quantity}
                onChange={(e) =>
                  setForm((p) => ({ ...p, quantity: e.target.value }))
                }
              />
              <Input
                label="Adjust by delta (+/-)"
                type="number"
                value={form.delta}
                onChange={(e) =>
                  setForm((p) => ({ ...p, delta: e.target.value }))
                }
              />
              <Input
                label="Set absolute quantity"
                type="number"
                min="0"
                value={form.setQty}
                onChange={(e) =>
                  setForm((p) => ({ ...p, setQty: e.target.value }))
                }
              />
              <Input
                label="Minimum threshold"
                type="number"
                min="0"
                value={form.threshold}
                onChange={(e) =>
                  setForm((p) => ({ ...p, threshold: e.target.value }))
                }
              />
              <div className="flex gap-2 pt-2">
                <Button type="submit" disabled={saving}>
                  {saving ? 'Saving…' : 'Save'}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setDialog(null)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </GlassCard>
        </div>
      ) : null}
    </div>
  );
}

export default AdminInventory;
