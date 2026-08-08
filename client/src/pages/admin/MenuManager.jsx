import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import Button from '../../components/ui/Button';
import GlassCard from '../../components/ui/GlassCard';
import Input from '../../components/ui/Input';
import Badge from '../../components/ui/Badge';
import EmptyState from '../../components/ui/EmptyState';
import {
  createCategory,
  deleteCategory,
  getCategories,
} from '../../services/categoryService';
import {
  createPizza,
  deletePizza,
  getPizzas,
  updatePizza,
} from '../../services/pizzaService';
import { formatPrice } from '../../utils/media';

const SIZE_OPTIONS = ['small', 'medium', 'large'];
const BASE_OPTIONS = [
  'thin_crust',
  'thick_crust',
  'cheese_burst',
  'whole_wheat',
  'gluten_free',
];
const SAUCE_OPTIONS = ['tomato', 'bbq', 'pesto', 'white_sauce', 'spicy_marinara'];
const CHEESE_OPTIONS = [
  'mozzarella',
  'cheddar',
  'parmesan',
  'vegan_cheese',
  'mixed_cheese',
];
const VEG_OPTIONS = [
  'onion',
  'capsicum',
  'mushroom',
  'olives',
  'corn',
  'tomato',
  'jalapeno',
  'spinach',
];

const emptyPizzaForm = {
  name: '',
  description: '',
  category: '',
  basePrice: 299,
  extraCheesePrice: 50,
  isVegetarian: true,
  isAvailable: true,
  sizes: [
    { size: 'small', price: 249 },
    { size: 'medium', price: 399 },
    { size: 'large', price: 549 },
  ],
  availableBases: ['thin_crust'],
  availableSauces: ['tomato'],
  availableCheeses: ['mozzarella'],
  availableVegetables: [],
  imageFile: null,
};

function AdminMenu() {
  const [categories, setCategories] = useState([]);
  const [pizzas, setPizzas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [categoryName, setCategoryName] = useState('');
  const [pizzaForm, setPizzaForm] = useState(emptyPizzaForm);
  const [editingId, setEditingId] = useState(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [cats, pizzaResult] = await Promise.all([
        getCategories({ includeInactive: true }),
        getPizzas({
          limit: 50,
          includeUnavailable: 'true',
          admin: 'true',
        }),
      ]);
      setCategories(cats);
      setPizzas(pizzaResult.pizzas);
      setPizzaForm((prev) => ({
        ...prev,
        category: prev.category || cats[0]?.id || '',
      }));
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load menu data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleCreateCategory = async (event) => {
    event.preventDefault();
    try {
      await createCategory({ name: categoryName, description: '' });
      setCategoryName('');
      toast.success('Category created');
      refresh();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Category create failed');
    }
  };

  const handleDeleteCategory = async (id) => {
    if (!window.confirm('Delete this category?')) return;
    try {
      await deleteCategory(id);
      toast.success('Category deleted');
      refresh();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Delete failed');
    }
  };

  const handleSubmitPizza = async (event) => {
    event.preventDefault();
    const payload = {
      name: pizzaForm.name,
      description: pizzaForm.description,
      category: pizzaForm.category,
      basePrice: Number(pizzaForm.basePrice),
      extraCheesePrice: Number(pizzaForm.extraCheesePrice),
      isVegetarian: pizzaForm.isVegetarian,
      isAvailable: pizzaForm.isAvailable,
      sizes: pizzaForm.sizes,
      availableBases: pizzaForm.availableBases,
      availableSauces: pizzaForm.availableSauces,
      availableCheeses: pizzaForm.availableCheeses,
      availableVegetables: pizzaForm.availableVegetables,
      image: pizzaForm.imageFile || undefined,
    };

    try {
      if (editingId) {
        await updatePizza(editingId, payload);
        toast.success('Pizza updated');
      } else {
        await createPizza(payload);
        toast.success('Pizza created');
      }
      setEditingId(null);
      setPizzaForm({
        ...emptyPizzaForm,
        category: categories[0]?.id || '',
      });
      refresh();
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.response?.data?.errors?.[0]?.message ||
        'Save failed';
      toast.error(message);
    }
  };

  const startEdit = (pizza) => {
    setEditingId(pizza.id);
    setPizzaForm({
      name: pizza.name,
      description: pizza.description,
      category: pizza.categoryId,
      basePrice: pizza.basePrice,
      extraCheesePrice: pizza.extraCheesePrice,
      isVegetarian: pizza.isVegetarian,
      isAvailable: pizza.isAvailable,
      sizes: pizza.sizes,
      availableBases: pizza.availableBases,
      availableSauces: pizza.availableSauces,
      availableCheeses: pizza.availableCheeses,
      availableVegetables: pizza.availableVegetables,
      imageFile: null,
    });
  };

  const handleDeletePizza = async (id) => {
    if (!window.confirm('Delete this pizza?')) return;
    try {
      await deletePizza(id);
      toast.success('Pizza deleted');
      refresh();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Delete failed');
    }
  };

  const toggleMulti = (field, value) => {
    setPizzaForm((prev) => {
      const current = prev[field];
      const next = current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value];
      return { ...prev, [field]: next };
    });
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-extrabold">Pizzas</h1>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Create, edit, delete, and toggle pizza availability.
          </p>
        </div>
      </header>

      <GlassCard className="p-5">
        <h2 className="font-display text-xl font-bold">Categories</h2>
        <form
          onSubmit={handleCreateCategory}
          className="mt-4 flex flex-col gap-3 sm:flex-row"
        >
          <Input
            name="categoryName"
            placeholder="New category name"
            value={categoryName}
            onChange={(e) => setCategoryName(e.target.value)}
            className="flex-1"
            required
          />
          <Button type="submit">Add category</Button>
        </form>
        <div className="mt-4 flex flex-wrap gap-2">
          {categories.map((category) => (
            <div
              key={category.id}
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm"
            >
              <span>{category.name}</span>
              <button
                type="button"
                className="text-[var(--danger)]"
                onClick={() => handleDeleteCategory(category.id)}
              >
                ×
              </button>
            </div>
          ))}
          {!loading && categories.length === 0 ? (
            <p className="text-sm text-[var(--muted)]">No categories yet.</p>
          ) : null}
        </div>
      </GlassCard>

      <GlassCard className="p-5">
        <h2 className="font-display text-xl font-bold">
          {editingId ? 'Edit pizza' : 'Create pizza'}
        </h2>
        <form className="mt-4 grid gap-4 sm:grid-cols-2" onSubmit={handleSubmitPizza}>
          <Input
            label="Name"
            value={pizzaForm.name}
            onChange={(e) =>
              setPizzaForm((prev) => ({ ...prev, name: e.target.value }))
            }
            required
          />
          <label className="block space-y-2">
            <span className="text-sm font-medium text-[var(--muted)]">
              Category
            </span>
            <select
              value={pizzaForm.category}
              onChange={(e) =>
                setPizzaForm((prev) => ({ ...prev, category: e.target.value }))
              }
              className="w-full rounded-xl border border-white/10 bg-[#111114] px-4 py-3 text-sm"
              required
            >
              <option value="">Select category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>
          <Input
            label="Base price"
            type="number"
            min="0"
            value={pizzaForm.basePrice}
            onChange={(e) =>
              setPizzaForm((prev) => ({ ...prev, basePrice: e.target.value }))
            }
            required
          />
          <Input
            label="Extra cheese price"
            type="number"
            min="0"
            value={pizzaForm.extraCheesePrice}
            onChange={(e) =>
              setPizzaForm((prev) => ({
                ...prev,
                extraCheesePrice: e.target.value,
              }))
            }
          />
          <label className="block space-y-2 sm:col-span-2">
            <span className="text-sm font-medium text-[var(--muted)]">
              Description
            </span>
            <textarea
              value={pizzaForm.description}
              onChange={(e) =>
                setPizzaForm((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              className="min-h-24 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none focus:border-[var(--accent)]/60"
              required
            />
          </label>

          <div className="sm:col-span-2">
            <p className="mb-2 text-sm font-medium text-[var(--muted)]">
              Size prices
            </p>
            <div className="grid gap-3 sm:grid-cols-3">
              {SIZE_OPTIONS.map((sizeName, index) => (
                <Input
                  key={sizeName}
                  label={sizeName}
                  type="number"
                  min="0"
                  value={pizzaForm.sizes[index]?.price ?? 0}
                  onChange={(e) => {
                    const price = Number(e.target.value);
                    setPizzaForm((prev) => {
                      const sizes = [...prev.sizes];
                      sizes[index] = { size: sizeName, price };
                      return { ...prev, sizes };
                    });
                  }}
                />
              ))}
            </div>
          </div>

          <ChipGroup
            label="Bases"
            options={BASE_OPTIONS}
            selected={pizzaForm.availableBases}
            onToggle={(value) => toggleMulti('availableBases', value)}
          />
          <ChipGroup
            label="Sauces"
            options={SAUCE_OPTIONS}
            selected={pizzaForm.availableSauces}
            onToggle={(value) => toggleMulti('availableSauces', value)}
          />
          <ChipGroup
            label="Cheeses"
            options={CHEESE_OPTIONS}
            selected={pizzaForm.availableCheeses}
            onToggle={(value) => toggleMulti('availableCheeses', value)}
          />
          <ChipGroup
            label="Vegetables"
            options={VEG_OPTIONS}
            selected={pizzaForm.availableVegetables}
            onToggle={(value) => toggleMulti('availableVegetables', value)}
          />

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={pizzaForm.isVegetarian}
              onChange={(e) =>
                setPizzaForm((prev) => ({
                  ...prev,
                  isVegetarian: e.target.checked,
                }))
              }
              className="accent-[var(--accent)]"
            />
            Vegetarian
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={pizzaForm.isAvailable}
              onChange={(e) =>
                setPizzaForm((prev) => ({
                  ...prev,
                  isAvailable: e.target.checked,
                }))
              }
              className="accent-[var(--accent)]"
            />
            Available
          </label>

          <label className="block space-y-2 sm:col-span-2">
            <span className="text-sm font-medium text-[var(--muted)]">
              Image (JPEG/PNG/WebP/GIF, max configured MB)
            </span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={(e) =>
                setPizzaForm((prev) => ({
                  ...prev,
                  imageFile: e.target.files?.[0] || null,
                }))
              }
              className="block w-full text-sm text-[var(--muted)]"
            />
          </label>

          <div className="flex gap-2 sm:col-span-2">
            <Button type="submit">
              {editingId ? 'Update pizza' : 'Create pizza'}
            </Button>
            {editingId ? (
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setEditingId(null);
                  setPizzaForm({
                    ...emptyPizzaForm,
                    category: categories[0]?.id || '',
                  });
                }}
              >
                Cancel edit
              </Button>
            ) : null}
          </div>
        </form>
      </GlassCard>

      <section className="space-y-4">
        <h2 className="font-display text-xl font-bold">Current pizzas</h2>
        {pizzas.length === 0 ? (
          <EmptyState
            title="No pizzas yet"
            description="Create a category, then add your first pizza."
          />
        ) : (
          pizzas.map((pizza) => (
            <GlassCard
              key={pizza.id}
              className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex gap-3">
                <img
                  src={pizza.image}
                  alt={pizza.name}
                  className="h-16 w-16 rounded-xl object-cover"
                />
                <div>
                  <p className="font-semibold">{pizza.name}</p>
                  <p className="text-sm text-[var(--muted)]">
                    {formatPrice(pizza.basePrice)} · {pizza.categoryName || '—'}
                  </p>
                  <div className="mt-1 flex gap-2">
                    {pizza.isVegetarian ? (
                      <Badge tone="success">Veg</Badge>
                    ) : (
                      <Badge tone="danger">Non-veg</Badge>
                    )}
                    <Badge tone={pizza.isAvailable ? 'ember' : 'muted'}>
                      {pizza.isAvailable ? 'Available' : 'Hidden'}
                    </Badge>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="secondary" onClick={() => startEdit(pizza)}>
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="danger"
                  onClick={() => handleDeletePizza(pizza.id)}
                >
                  Delete
                </Button>
              </div>
            </GlassCard>
          ))
        )}
      </section>
    </div>
  );
}

function ChipGroup({ label, options, selected, onToggle }) {
  return (
    <div className="sm:col-span-2">
      <p className="mb-2 text-sm font-medium text-[var(--muted)]">{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const active = selected.includes(option);
          return (
            <button
              key={option}
              type="button"
              onClick={() => onToggle(option)}
              className={`rounded-lg border px-3 py-1.5 text-xs font-medium ${
                active
                  ? 'border-[var(--accent)]/40 bg-[var(--accent)]/15 text-[var(--accent-soft)]'
                  : 'border-white/10 bg-white/5 text-[var(--muted)]'
              }`}
            >
              {option.replaceAll('_', ' ')}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default AdminMenu;
