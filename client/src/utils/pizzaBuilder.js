/**
 * Client-side estimate helpers mirroring server catalog labels.
 * Final totals always come from POST /api/builder/quote.
 */

export const BUILDER_STEPS = [
  { id: 'size', title: 'Size', required: true },
  { id: 'base', title: 'Base', required: true },
  { id: 'sauce', title: 'Sauce', required: true },
  { id: 'cheese', title: 'Cheese', required: true },
  { id: 'vegetables', title: 'Vegetables', required: false },
  { id: 'extras', title: 'Extras', required: false },
];

export const FALLBACK_CATALOG = {
  basePrice: 199,
  extraCheesePrice: 50,
  maxQuantity: 10,
  maxVegetables: 8,
  sizes: [
    { key: 'small', label: 'Small', multiplier: 0.85 },
    { key: 'medium', label: 'Medium', multiplier: 1 },
    { key: 'large', label: 'Large', multiplier: 1.25 },
  ],
  bases: [
    { key: 'thin_crust', label: 'Thin Crust', price: 0 },
    { key: 'hand_tossed', label: 'Hand Tossed', price: 20 },
    { key: 'cheese_burst', label: 'Cheese Burst', price: 60 },
    { key: 'stuffed_crust', label: 'Stuffed Crust', price: 70 },
    { key: 'whole_wheat', label: 'Whole Wheat', price: 30 },
  ],
  sauces: [
    { key: 'tomato', label: 'Tomato', price: 0 },
    { key: 'bbq', label: 'BBQ', price: 15 },
    { key: 'garlic', label: 'Garlic', price: 15 },
    { key: 'pesto', label: 'Pesto', price: 25 },
    { key: 'spicy', label: 'Spicy', price: 20 },
  ],
  cheeses: [
    { key: 'mozzarella', label: 'Mozzarella', price: 0 },
    { key: 'cheddar', label: 'Cheddar', price: 20 },
    { key: 'parmesan', label: 'Parmesan', price: 25 },
    { key: 'mixed_cheese', label: 'Mixed Cheese', price: 30 },
  ],
  vegetables: [
    { key: 'onion', label: 'Onion', price: 25 },
    { key: 'capsicum', label: 'Capsicum', price: 30 },
    { key: 'tomato', label: 'Tomato', price: 25 },
    { key: 'corn', label: 'Corn', price: 25 },
    { key: 'mushroom', label: 'Mushroom', price: 35 },
    { key: 'olives', label: 'Olives', price: 35 },
    { key: 'paneer', label: 'Paneer', price: 45 },
    { key: 'jalapeno', label: 'Jalapeno', price: 30 },
  ],
};

export const createInitialBuilderState = () => ({
  size: 'medium',
  base: 'thin_crust',
  sauce: 'tomato',
  cheese: 'mozzarella',
  vegetables: [],
  extraCheese: false,
  quantity: 1,
});

/** Optimistic local estimate only — never used as final charge. */
export const estimateUnitPrice = (state, catalog = FALLBACK_CATALOG) => {
  const size = catalog.sizes.find((s) => s.key === state.size);
  const base = catalog.bases.find((b) => b.key === state.base);
  const sauce = catalog.sauces.find((s) => s.key === state.sauce);
  const cheese = catalog.cheeses.find((c) => c.key === state.cheese);
  if (!size || !base || !sauce || !cheese) return null;

  const vegTotal = (state.vegetables || []).reduce((sum, key) => {
    const veg = catalog.vegetables.find((v) => v.key === key);
    return sum + (veg?.price || 0);
  }, 0);

  const extras = state.extraCheese ? catalog.extraCheesePrice : 0;

  return Math.round(
    (catalog.basePrice +
      base.price +
      sauce.price +
      cheese.price +
      vegTotal +
      extras) *
      size.multiplier,
  );
};

export const isStepComplete = (stepId, state) => {
  switch (stepId) {
    case 'size':
      return Boolean(state.size);
    case 'base':
      return Boolean(state.base);
    case 'sauce':
      return Boolean(state.sauce);
    case 'cheese':
      return Boolean(state.cheese);
    case 'vegetables':
    case 'extras':
      return true;
    default:
      return false;
  }
};
