/**
 * Smoke checks for builder quote math (no Mongo required).
 * Usage: node utils/testBuilderQuote.js
 */
import {
  getBuilderCatalog,
  quoteCustomPizza,
} from '../services/pizzaBuilderService.js';

const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

const run = () => {
  const catalog = getBuilderCatalog();
  assert(catalog.sizes.length === 3, 'expected 3 sizes');

  const quote = quoteCustomPizza({
    size: 'large',
    base: 'cheese_burst',
    sauce: 'pesto',
    cheese: 'mixed_cheese',
    vegetables: ['mushroom', 'paneer'],
    extraCheese: true,
    quantity: 2,
  });

  assert(quote.breakdown.unitPrice > 0, 'unit price missing');
  assert(
    quote.breakdown.total === quote.breakdown.unitPrice * 2,
    'total mismatch',
  );

  let rejected = false;
  try {
    quoteCustomPizza({
      size: 'large',
      base: 'cheese_burst',
      sauce: 'pesto',
      cheese: 'mixed_cheese',
      vegetables: [],
      quantity: 1,
      unitPrice: 1,
    });
  } catch (error) {
    rejected = error.statusCode === 400;
  }
  assert(rejected, 'client prices should be rejected');

  console.log('PASS builder quote checks');
  console.log({
    unitPrice: quote.breakdown.unitPrice,
    total: quote.breakdown.total,
  });
};

run();
