import ApiError from '../utils/ApiError.js';
import {
  BUILDER_BASE_PRICE,
  BUILDER_BASES,
  BUILDER_CHEESES,
  BUILDER_EXTRA_CHEESE_PRICE,
  BUILDER_MAX_QTY,
  BUILDER_MAX_VEGETABLES,
  BUILDER_SAUCES,
  BUILDER_SIZES,
  BUILDER_VEGETABLES,
} from '../config/pizzaBuilderPricing.js';

const isNonEmptyString = (value) =>
  typeof value === 'string' && value.trim().length > 0;

/**
 * Validates a custom pizza configuration and returns the server price breakdown.
 */
export const quoteCustomPizza = (payload = {}) => {
  const errors = [];

  const size = payload.size;
  const base = payload.base;
  const sauce = payload.sauce;
  const cheese = payload.cheese;
  const vegetables = Array.isArray(payload.vegetables)
    ? [...new Set(payload.vegetables)]
    : [];
  const extraCheese = Boolean(payload.extraCheese);
  const quantity = Number(payload.quantity ?? 1);

  if (!isNonEmptyString(size) || !BUILDER_SIZES[size]) {
    errors.push({ field: 'size', message: 'Valid size is required' });
  }
  if (!isNonEmptyString(base) || !BUILDER_BASES[base]) {
    errors.push({ field: 'base', message: 'Valid base is required' });
  }
  if (!isNonEmptyString(sauce) || !BUILDER_SAUCES[sauce]) {
    errors.push({ field: 'sauce', message: 'Valid sauce is required' });
  }
  if (!isNonEmptyString(cheese) || !BUILDER_CHEESES[cheese]) {
    errors.push({ field: 'cheese', message: 'Valid cheese is required' });
  }

  if (!Number.isInteger(quantity) || quantity < 1 || quantity > BUILDER_MAX_QTY) {
    errors.push({
      field: 'quantity',
      message: `Quantity must be an integer between 1 and ${BUILDER_MAX_QTY}`,
    });
  }

  if (vegetables.length > BUILDER_MAX_VEGETABLES) {
    errors.push({
      field: 'vegetables',
      message: `Select at most ${BUILDER_MAX_VEGETABLES} vegetables`,
    });
  }

  const invalidVeg = vegetables.filter((item) => !BUILDER_VEGETABLES[item]);
  if (invalidVeg.length > 0) {
    errors.push({
      field: 'vegetables',
      message: `Invalid vegetables: ${invalidVeg.join(', ')}`,
    });
  }

  // Reject client-supplied totals
  if (payload.unitPrice !== undefined || payload.total !== undefined) {
    errors.push({
      field: 'price',
      message: 'Client-supplied prices are not accepted',
    });
  }

  if (errors.length > 0) {
    throw new ApiError(400, 'Invalid pizza configuration', errors);
  }

  const sizeMeta = BUILDER_SIZES[size];
  const baseMeta = BUILDER_BASES[base];
  const sauceMeta = BUILDER_SAUCES[sauce];
  const cheeseMeta = BUILDER_CHEESES[cheese];

  const vegetableLines = vegetables.map((key) => ({
    key,
    label: BUILDER_VEGETABLES[key].label,
    price: BUILDER_VEGETABLES[key].price,
  }));

  const vegetableTotal = vegetableLines.reduce((sum, line) => sum + line.price, 0);
  const extrasTotal = extraCheese ? BUILDER_EXTRA_CHEESE_PRICE : 0;

  const unitPrice = Math.round(
    (BUILDER_BASE_PRICE +
      baseMeta.price +
      sauceMeta.price +
      cheeseMeta.price +
      vegetableTotal +
      extrasTotal) *
      sizeMeta.multiplier,
  );

  const total = unitPrice * quantity;

  return {
    configuration: {
      size,
      base,
      sauce,
      cheese,
      vegetables,
      extraCheese,
      quantity,
    },
    breakdown: {
      basePrice: BUILDER_BASE_PRICE,
      sizeMultiplier: sizeMeta.multiplier,
      baseAddon: baseMeta.price,
      sauceAddon: sauceMeta.price,
      cheeseAddon: cheeseMeta.price,
      vegetables: vegetableLines,
      vegetableTotal,
      extraCheese: extrasTotal,
      unitPrice,
      quantity,
      total,
      currency: 'INR',
    },
    labels: {
      size: sizeMeta.label,
      base: baseMeta.label,
      sauce: sauceMeta.label,
      cheese: cheeseMeta.label,
      vegetables: vegetableLines.map((line) => line.label),
    },
  };
};

export const getBuilderCatalog = () => ({
  basePrice: BUILDER_BASE_PRICE,
  extraCheesePrice: BUILDER_EXTRA_CHEESE_PRICE,
  maxQuantity: BUILDER_MAX_QTY,
  maxVegetables: BUILDER_MAX_VEGETABLES,
  sizes: Object.entries(BUILDER_SIZES).map(([key, value]) => ({
    key,
    ...value,
  })),
  bases: Object.entries(BUILDER_BASES).map(([key, value]) => ({
    key,
    ...value,
  })),
  sauces: Object.entries(BUILDER_SAUCES).map(([key, value]) => ({
    key,
    ...value,
  })),
  cheeses: Object.entries(BUILDER_CHEESES).map(([key, value]) => ({
    key,
    ...value,
  })),
  vegetables: Object.entries(BUILDER_VEGETABLES).map(([key, value]) => ({
    key,
    ...value,
  })),
});
