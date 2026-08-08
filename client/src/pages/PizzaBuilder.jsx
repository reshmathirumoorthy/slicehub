import { useCallback, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { FiCheck } from 'react-icons/fi';
import PizzaCanvas from '../components/3d/PizzaCanvas';
import Button from '../components/ui/Button';
import GlassCard from '../components/ui/GlassCard';
import { useCart } from '../context/useCart';
import { getBuilderCatalog, quoteBuilderPizza } from '../services/builderService';
import { formatPrice } from '../utils/media';
import {
  BUILDER_STEPS,
  createInitialBuilderState,
  estimateUnitPrice,
  FALLBACK_CATALOG,
  isStepComplete,
} from '../utils/pizzaBuilder';
import { prefersReducedMotion } from '../utils/webgl';

function PizzaBuilder() {
  const { addItem } = useCart();
  const [stepIndex, setStepIndex] = useState(0);
  const [state, setState] = useState(createInitialBuilderState);
  const [catalog, setCatalog] = useState(FALLBACK_CATALOG);
  const [serverQuote, setServerQuote] = useState(null);
  const [quoting, setQuoting] = useState(false);
  const [adding, setAdding] = useState(false);
  const reducedMotion = prefersReducedMotion();
  const step = BUILDER_STEPS[stepIndex];

  useEffect(() => {
    getBuilderCatalog()
      .then(setCatalog)
      .catch(() => setCatalog(FALLBACK_CATALOG));
  }, []);

  const refreshQuote = useCallback(async () => {
    setQuoting(true);
    try {
      const quote = await quoteBuilderPizza(state);
      setServerQuote(quote);
    } catch (error) {
      setServerQuote(null);
      // Keep local estimate visible; server quote is required before add-to-cart
      console.warn(error);
    } finally {
      setQuoting(false);
    }
  }, [state]);

  useEffect(() => {
    const timer = setTimeout(() => {
      refreshQuote();
    }, 250);
    return () => clearTimeout(timer);
  }, [refreshQuote]);

  const estimate = useMemo(
    () => estimateUnitPrice(state, catalog),
    [state, catalog],
  );

  const displayUnit =
    serverQuote?.breakdown?.unitPrice ?? estimate ?? 0;
  const displayTotal =
    serverQuote?.breakdown?.total ?? displayUnit * state.quantity;

  const canContinue = isStepComplete(step.id, state);

  const goNext = () => {
    if (!canContinue) {
      toast.error('Please complete this step before continuing');
      return;
    }
    setStepIndex((i) => Math.min(BUILDER_STEPS.length - 1, i + 1));
  };

  const goBack = () => setStepIndex((i) => Math.max(0, i - 1));

  const toggleVegetable = (key) => {
    setState((prev) => {
      const exists = prev.vegetables.includes(key);
      if (exists) {
        return {
          ...prev,
          vegetables: prev.vegetables.filter((item) => item !== key),
        };
      }
      if (prev.vegetables.length >= catalog.maxVegetables) {
        toast.error(`You can select up to ${catalog.maxVegetables} toppings`);
        return prev;
      }
      return { ...prev, vegetables: [...prev.vegetables, key] };
    });
  };

  const handleAddToCart = async () => {
    for (const s of BUILDER_STEPS) {
      if (s.required && !isStepComplete(s.id, state)) {
        toast.error(`Missing required option: ${s.title}`);
        return;
      }
    }

    setAdding(true);
    try {
      // Server recalculates price inside POST /api/cart — never trust local quote totals.
      await addItem({
        name: 'Custom SliceHub Pizza',
        size: state.size,
        base: state.base,
        sauce: state.sauce,
        cheese: state.cheese,
        vegetables: state.vegetables,
        extraCheese: state.extraCheese,
        quantity: state.quantity,
      });

      toast.success('Custom pizza added to cart');
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          'Could not add item — check the API is running',
      );
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--accent-soft)]">
          Signature experience
        </p>
        <h1 className="font-display text-3xl font-extrabold sm:text-4xl">
          Build your pizza
        </h1>
        <p className="max-w-2xl text-[var(--muted)]">
          Customize every layer while the 3D preview updates live. Final price
          is always calculated on the server.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <GlassCard className="overflow-hidden p-2 sm:p-3">
          <div className="h-[320px] sm:h-[420px] lg:h-[520px]">
            <PizzaCanvas
              customization={state}
              className="h-full"
              enableOrbit
              autoRotate={false}
            />
          </div>
          <p className="px-3 pb-3 text-center text-xs text-[var(--muted)]">
            Drag to rotate · Scroll to zoom · Works without WebGL via fallback
          </p>
        </GlassCard>

        <GlassCard className="flex flex-col p-5 sm:p-6">
          <Progress steps={BUILDER_STEPS} current={stepIndex} />

          <AnimatePresence mode="wait">
            <motion.div
              key={step.id}
              initial={reducedMotion ? false : { opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={reducedMotion ? undefined : { opacity: 0, x: -12 }}
              transition={{ duration: 0.22 }}
              className="mt-6 flex-1"
            >
              <h2 className="font-display text-2xl font-bold">
                Step {stepIndex + 1}: {step.title}
              </h2>
              <p className="mt-1 text-sm text-[var(--muted)]">
                {step.required
                  ? 'Required before continuing'
                  : 'Optional — skip if you like'}
              </p>

              <div className="mt-5">
                {step.id === 'size' && (
                  <OptionGrid
                    options={catalog.sizes}
                    value={state.size}
                    onChange={(key) =>
                      setState((prev) => ({ ...prev, size: key }))
                    }
                  />
                )}
                {step.id === 'base' && (
                  <OptionGrid
                    options={catalog.bases}
                    value={state.base}
                    onChange={(key) =>
                      setState((prev) => ({ ...prev, base: key }))
                    }
                    showPrice
                  />
                )}
                {step.id === 'sauce' && (
                  <OptionGrid
                    options={catalog.sauces}
                    value={state.sauce}
                    onChange={(key) =>
                      setState((prev) => ({ ...prev, sauce: key }))
                    }
                    showPrice
                  />
                )}
                {step.id === 'cheese' && (
                  <OptionGrid
                    options={catalog.cheeses}
                    value={state.cheese}
                    onChange={(key) =>
                      setState((prev) => ({ ...prev, cheese: key }))
                    }
                    showPrice
                  />
                )}
                {step.id === 'vegetables' && (
                  <MultiOptionGrid
                    options={catalog.vegetables}
                    selected={state.vegetables}
                    onToggle={toggleVegetable}
                  />
                )}
                {step.id === 'extras' && (
                  <div className="space-y-4">
                    <label className="flex cursor-pointer items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                      <span>
                        <span className="block font-semibold">Extra cheese</span>
                        <span className="text-sm text-[var(--muted)]">
                          +{formatPrice(catalog.extraCheesePrice)}
                        </span>
                      </span>
                      <input
                        type="checkbox"
                        checked={state.extraCheese}
                        onChange={(e) =>
                          setState((prev) => ({
                            ...prev,
                            extraCheese: e.target.checked,
                          }))
                        }
                        className="accent-[var(--accent)]"
                      />
                    </label>

                    <label className="block space-y-2">
                      <span className="text-sm text-[var(--muted)]">
                        Quantity
                      </span>
                      <input
                        type="number"
                        min={1}
                        max={catalog.maxQuantity}
                        value={state.quantity}
                        onChange={(e) =>
                          setState((prev) => ({
                            ...prev,
                            quantity: Math.max(
                              1,
                              Math.min(
                                catalog.maxQuantity,
                                Number(e.target.value) || 1,
                              ),
                            ),
                          }))
                        }
                        className="w-28 rounded-xl border border-white/10 bg-white/5 px-3 py-2"
                      />
                    </label>

                    <SelectedSummary state={state} catalog={catalog} />
                  </div>
                )}
              </div>
            </motion.div>
          </AnimatePresence>

          <div className="mt-6 border-t border-white/10 pt-4">
            <div className="mb-4 flex items-end justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-wide text-[var(--muted)]">
                  {quoting ? 'Validating with server…' : 'Server price'}
                </p>
                <p className="font-display text-2xl font-bold">
                  {formatPrice(displayTotal)}
                </p>
                <p className="text-xs text-[var(--muted)]">
                  {formatPrice(displayUnit)} each
                  {!serverQuote ? ' · estimate until quote succeeds' : ''}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                variant="secondary"
                onClick={goBack}
                disabled={stepIndex === 0}
              >
                Back
              </Button>
              {stepIndex < BUILDER_STEPS.length - 1 ? (
                <Button onClick={goNext} disabled={!canContinue}>
                  Next
                </Button>
              ) : (
                <Button onClick={handleAddToCart} disabled={adding || quoting}>
                  {adding ? 'Adding…' : 'Add to Cart'}
                </Button>
              )}
              <Button to="/cart" variant="ghost" size="sm">
                View cart
              </Button>
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}

function Progress({ steps, current }) {
  return (
    <ol className="flex flex-wrap gap-2" aria-label="Builder progress">
      {steps.map((step, index) => {
        const done = index < current;
        const active = index === current;
        return (
          <li
            key={step.id}
            className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-semibold ${
              active
                ? 'border-[var(--accent)]/50 bg-[var(--accent)]/15 text-[var(--accent-soft)]'
                : done
                  ? 'border-white/15 bg-white/10 text-white'
                  : 'border-white/10 text-[var(--muted)]'
            }`}
          >
            {done ? <FiCheck size={12} /> : <span>{index + 1}</span>}
            <span className="hidden sm:inline">{step.title}</span>
          </li>
        );
      })}
    </ol>
  );
}

function OptionGrid({ options, value, onChange, showPrice = false }) {
  return (
    <div
      className="grid gap-2 sm:grid-cols-2"
      role="radiogroup"
      aria-label="Builder options"
    >
      {options.map((option) => {
        const selected = value === option.key;
        return (
          <button
            key={option.key}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(option.key)}
            className={`rounded-xl border px-4 py-3 text-left transition ${
              selected
                ? 'border-[var(--accent)]/50 bg-[var(--accent)]/15'
                : 'border-white/10 bg-white/5 hover:bg-white/10'
            }`}
          >
            <span className="block text-sm font-semibold">{option.label}</span>
            {showPrice ? (
              <span className="text-xs text-[var(--muted)]">
                {option.price > 0
                  ? `+${formatPrice(option.price)}`
                  : 'Included'}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

function MultiOptionGrid({ options, selected, onToggle }) {
  return (
    <div className="grid gap-2 sm:grid-cols-2" role="group" aria-label="Vegetables">
      {options.map((option) => {
        const active = selected.includes(option.key);
        return (
          <button
            key={option.key}
            type="button"
            aria-pressed={active}
            onClick={() => onToggle(option.key)}
            className={`rounded-xl border px-4 py-3 text-left transition ${
              active
                ? 'border-[var(--accent)]/50 bg-[var(--accent)]/15'
                : 'border-white/10 bg-white/5 hover:bg-white/10'
            }`}
          >
            <span className="block text-sm font-semibold">{option.label}</span>
            <span className="text-xs text-[var(--muted)]">
              +{formatPrice(option.price)}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function SelectedSummary({ state, catalog }) {
  const labelOf = (list, key) =>
    list.find((item) => item.key === key)?.label || key;

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm">
      <p className="font-semibold">Your selections</p>
      <ul className="mt-2 space-y-1 text-[var(--muted)]">
        <li>Size: {labelOf(catalog.sizes, state.size)}</li>
        <li>Base: {labelOf(catalog.bases, state.base)}</li>
        <li>Sauce: {labelOf(catalog.sauces, state.sauce)}</li>
        <li>Cheese: {labelOf(catalog.cheeses, state.cheese)}</li>
        <li>
          Veggies:{' '}
          {state.vegetables.length
            ? state.vegetables
                .map((key) => labelOf(catalog.vegetables, key))
                .join(', ')
            : 'None'}
        </li>
        <li>Extra cheese: {state.extraCheese ? 'Yes' : 'No'}</li>
      </ul>
    </div>
  );
}

export default PizzaBuilder;
