/**
 * Seed pizza ingredient inventory (bases, sauces, cheeses, vegetables).
 * Usage: node utils/seedInventory.js
 */
import mongoose from 'mongoose';
import env from '../config/env.js';
import Inventory from '../models/Inventory.js';
import {
  INVENTORY_CATEGORIES,
  INVENTORY_UNITS,
  PIZZA_BASES,
  PIZZA_CHEESES,
  PIZZA_SAUCES,
  PIZZA_VEGETABLES,
} from '../models/constants.js';
import {
  BUILDER_BASES,
  BUILDER_CHEESES,
  BUILDER_SAUCES,
  BUILDER_VEGETABLES,
} from '../config/pizzaBuilderPricing.js';

const formatLabel = (key) =>
  String(key)
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());

/** Union of menu enum values and builder option keys */
const mergeKeys = (pizzaEnum, builderMap) => [
  ...new Set([...Object.values(pizzaEnum), ...Object.keys(builderMap)]),
];

const DEFAULTS = {
  [INVENTORY_CATEGORIES.BASE]: { qty: 80, threshold: 15 },
  [INVENTORY_CATEGORIES.SAUCE]: { qty: 100, threshold: 20 },
  [INVENTORY_CATEGORIES.CHEESE]: { qty: 120, threshold: 25 },
  [INVENTORY_CATEGORIES.VEGETABLE]: { qty: 90, threshold: 18 },
};

const seedCategory = async (category, keys) => {
  const defaults = DEFAULTS[category];
  let upserted = 0;

  for (const itemKey of keys) {
    const sku = `${category}-${itemKey}`.toUpperCase();
    await Inventory.findOneAndUpdate(
      { category, itemKey },
      {
        $setOnInsert: {
          name: formatLabel(itemKey),
          sku,
          itemKey,
          category,
          unit: INVENTORY_UNITS.PIECE,
          quantityInStock: defaults.qty,
          minimumThreshold: defaults.threshold,
          reorderLevel: defaults.threshold,
          isActive: true,
          lastRestockedAt: new Date(),
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
    upserted += 1;
  }

  return upserted;
};

const run = async () => {
  await mongoose.connect(env.mongodbUri);

  const counts = {
    base: await seedCategory(
      INVENTORY_CATEGORIES.BASE,
      mergeKeys(PIZZA_BASES, BUILDER_BASES),
    ),
    sauce: await seedCategory(
      INVENTORY_CATEGORIES.SAUCE,
      mergeKeys(PIZZA_SAUCES, BUILDER_SAUCES),
    ),
    cheese: await seedCategory(
      INVENTORY_CATEGORIES.CHEESE,
      mergeKeys(PIZZA_CHEESES, BUILDER_CHEESES),
    ),
    vegetable: await seedCategory(
      INVENTORY_CATEGORIES.VEGETABLE,
      mergeKeys(PIZZA_VEGETABLES, BUILDER_VEGETABLES),
    ),
  };

  console.log('Inventory seed complete:', counts);
  await mongoose.disconnect();
};

run().catch(async (error) => {
  console.error(error.message);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
