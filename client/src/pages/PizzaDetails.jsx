import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { FiArrowLeft, FiStar } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import GlassCard from '../components/ui/GlassCard';
import Skeleton from '../components/ui/Skeleton';
import { useCart } from '../context/useCart';
import { getPizzaById } from '../services/pizzaService';
import { formatLabel, formatPrice } from '../utils/media';

function PizzaDetails() {
  const { id } = useParams();
  const { addItem } = useCart();
  const [pizza, setPizza] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [adding, setAdding] = useState(false);
  const [size, setSize] = useState('medium');
  const [qty, setQty] = useState(1);
  const [base, setBase] = useState('');
  const [sauce, setSauce] = useState('');
  const [cheese, setCheese] = useState('');
  const [extraCheese, setExtraCheese] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');

    getPizzaById(id)
      .then((data) => {
        if (!active) return;
        setPizza(data);
        setSize(data.sizes?.[0]?.size || 'medium');
        setBase(data.availableBases?.[0] || '');
        setSauce(data.availableSauces?.[0] || '');
        setCheese(data.availableCheeses?.[0] || '');
      })
      .catch((err) => {
        if (!active) return;
        setError(err.response?.data?.message || 'Pizza not found');
        setPizza(null);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="grid gap-6 lg:grid-cols-2">
        <Skeleton className="aspect-square w-full rounded-3xl" />
        <div className="space-y-4">
          <Skeleton className="h-8 w-2/3" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  if (error || !pizza) {
    return (
      <GlassCard className="p-8 text-center">
        <h1 className="font-display text-2xl font-bold">Pizza not found</h1>
        <p className="mt-2 text-[var(--muted)]">
          {error || 'This pizza is not available.'}
        </p>
        <Button to="/menu" className="mt-6">
          Back to menu
        </Button>
      </GlassCard>
    );
  }

  const selected = pizza.sizes.find((s) => s.size === size) || pizza.sizes[0];
  const unitPrice =
    (selected?.price || pizza.basePrice || 0) +
    (extraCheese ? pizza.extraCheesePrice || 0 : 0);

  const handleAddToCart = async () => {
    if (!pizza.isAvailable) {
      toast.error('This pizza is currently unavailable');
      return;
    }
    setAdding(true);
    try {
      await addItem({
        pizzaId: pizza.id || pizza._id,
        size,
        base,
        sauce,
        cheese,
        vegetables: [],
        extraCheese,
        quantity: qty,
      });
      toast.success('Added to cart');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not add to cart');
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="space-y-6">
      <Link
        to="/menu"
        className="inline-flex items-center gap-2 text-sm text-[var(--muted)] hover:text-white"
      >
        <FiArrowLeft /> Back to menu
      </Link>

      <div className="grid gap-6 lg:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="overflow-hidden rounded-3xl"
        >
          <img
            src={pizza.image}
            alt={pizza.name}
            className="aspect-[4/3] w-full object-cover lg:aspect-square"
          />
        </motion.div>

        <GlassCard className="flex flex-col p-6 sm:p-8">
          <div className="flex flex-wrap gap-2">
            {pizza.isVegetarian ? (
              <Badge tone="success">Vegetarian</Badge>
            ) : (
              <Badge tone="danger">Non-veg</Badge>
            )}
            {pizza.categoryName ? <Badge>{pizza.categoryName}</Badge> : null}
            <Badge tone="gold">
              <span className="inline-flex items-center gap-1">
                <FiStar /> {pizza.rating} · {pizza.reviewCount} reviews
              </span>
            </Badge>
          </div>

          <h1 className="mt-4 font-display text-3xl font-extrabold sm:text-4xl">
            {pizza.name}
          </h1>
          <p className="mt-3 text-[var(--muted)]">{pizza.description}</p>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Base price {formatPrice(pizza.basePrice)}
          </p>

          <OptionGroup
            label="Size"
            options={pizza.sizes.map((s) => ({
              value: s.size,
              label: `${formatLabel(s.size)} · ${formatPrice(s.price)}`,
            }))}
            value={size}
            onChange={setSize}
          />

          <OptionGroup
            label="Base"
            options={pizza.availableBases.map((v) => ({
              value: v,
              label: formatLabel(v),
            }))}
            value={base}
            onChange={setBase}
          />

          <OptionGroup
            label="Sauce"
            options={pizza.availableSauces.map((v) => ({
              value: v,
              label: formatLabel(v),
            }))}
            value={sauce}
            onChange={setSauce}
          />

          <OptionGroup
            label="Cheese"
            options={pizza.availableCheeses.map((v) => ({
              value: v,
              label: formatLabel(v),
            }))}
            value={cheese}
            onChange={setCheese}
          />

          {pizza.availableVegetables.length > 0 ? (
            <div className="mt-6">
              <p className="mb-2 text-sm font-medium text-[var(--muted)]">
                Vegetables
              </p>
              <div className="flex flex-wrap gap-2">
                {pizza.availableVegetables.map((item) => (
                  <span
                    key={item}
                    className="rounded-lg border border-white/10 bg-white/5 px-3 py-1 text-xs text-[var(--muted)]"
                  >
                    {formatLabel(item)}
                  </span>
                ))}
              </div>
            </div>
          ) : null}

          <label className="mt-6 flex items-center gap-2 text-sm text-[var(--muted)]">
            <input
              type="checkbox"
              checked={extraCheese}
              onChange={(e) => setExtraCheese(e.target.checked)}
              className="accent-[var(--accent)]"
            />
            Extra cheese (+{formatPrice(pizza.extraCheesePrice)})
          </label>

          <div className="mt-auto flex flex-wrap items-center gap-4 pt-8">
            <div className="flex items-center rounded-xl border border-white/10 bg-white/5">
              <button
                type="button"
                className="px-3 py-2 text-lg"
                onClick={() => setQty((q) => Math.max(1, q - 1))}
              >
                −
              </button>
              <span className="min-w-8 text-center text-sm font-semibold">
                {qty}
              </span>
              <button
                type="button"
                className="px-3 py-2 text-lg"
                onClick={() => setQty((q) => Math.min(10, q + 1))}
              >
                +
              </button>
            </div>
            <Button
              className="flex-1 sm:flex-none"
              onClick={handleAddToCart}
              disabled={adding || !pizza.isAvailable}
            >
              {adding
                ? 'Adding…'
                : `Add · ${formatPrice(unitPrice * qty)}`}
            </Button>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}

function OptionGroup({ label, options, value, onChange }) {
  if (!options?.length) return null;
  return (
    <div className="mt-6">
      <p className="mb-2 text-sm font-medium text-[var(--muted)]">{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={`rounded-xl border px-4 py-2 text-sm font-semibold capitalize transition ${
              value === option.value
                ? 'border-[var(--accent)]/50 bg-[var(--accent)]/15 text-white'
                : 'border-white/10 bg-white/5 text-[var(--muted)]'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export default PizzaDetails;
