import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import EmptyState from '../../components/ui/EmptyState';
import GlassCard from '../../components/ui/GlassCard';
import Input from '../../components/ui/Input';
import {
  createCategory,
  deleteCategory,
  getCategories,
  updateCategory,
} from '../../services/categoryService';

function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const list = await getCategories({ includeInactive: true });
      setCategories(list);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not load categories');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      if (editing) {
        await updateCategory(editing.id || editing._id, { name: name.trim() });
        toast.success('Category updated');
      } else {
        await createCategory({ name: name.trim() });
        toast.success('Category created');
      }
      setName('');
      setEditing(null);
      await load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (category) => {
    const id = category.id || category._id;
    if (
      !window.confirm(
        `Delete category "${category.name}"? This fails if pizzas still reference it.`,
      )
    ) {
      return;
    }
    try {
      await deleteCategory(id);
      toast.success('Category deleted');
      await load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete blocked');
    }
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-3xl font-extrabold">Categories</h1>
        <p className="mt-2 text-[var(--muted)]">
          Manage menu categories. Deletion is blocked while pizzas reference a
          category.
        </p>
      </header>

      <GlassCard className="p-5">
        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-3 sm:flex-row sm:items-end"
        >
          <Input
            label={editing ? 'Edit category name' : 'New category'}
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="flex-1"
            required
          />
          <Button type="submit" disabled={saving}>
            {saving ? 'Saving…' : editing ? 'Update' : 'Create'}
          </Button>
          {editing ? (
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setEditing(null);
                setName('');
              }}
            >
              Cancel
            </Button>
          ) : null}
        </form>
      </GlassCard>

      {loading ? (
        <p className="text-[var(--muted)]">Loading…</p>
      ) : categories.length === 0 ? (
        <EmptyState
          title="No categories"
          description="Create a category before adding pizzas."
        />
      ) : (
        <div className="space-y-3">
          {categories.map((category) => (
            <GlassCard
              key={category.id || category._id}
              className="flex flex-wrap items-center justify-between gap-3 p-4"
            >
              <div>
                <p className="font-semibold">{category.name}</p>
                <p className="text-xs text-[var(--muted)]">{category.slug}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge tone={category.isActive === false ? 'danger' : 'success'}>
                  {category.isActive === false ? 'Inactive' : 'Active'}
                </Badge>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    setEditing(category);
                    setName(category.name);
                  }}
                >
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="danger"
                  onClick={() => handleDelete(category)}
                >
                  Delete
                </Button>
              </div>
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  );
}

export default AdminCategories;
