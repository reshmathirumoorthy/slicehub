/**
 * Inventory service unit-style checks (requires Mongo).
 * Usage: node utils/testInventory.js
 */
import mongoose from 'mongoose';
import env from '../config/env.js';
import Inventory from '../models/Inventory.js';
import {
  adjustStock,
  assertSufficientStockForItems,
  buildUsageMapFromItems,
  deductInventoryForPaidOrder,
} from '../services/inventoryService.js';
import { INVENTORY_CATEGORIES } from '../models/constants.js';
import Order from '../models/Order.js';

const assert = (ok, msg) => {
  if (!ok) throw new Error(msg);
};

const run = async () => {
  await mongoose.connect(env.mongodbUri);

  const base = await Inventory.findOne({
    category: INVENTORY_CATEGORIES.BASE,
    itemKey: 'thin_crust',
  });
  if (!base) {
    console.log('SKIP — run npm run seed:inventory first');
    await mongoose.disconnect();
    return;
  }

  const usage = buildUsageMapFromItems([
    {
      base: 'thin_crust',
      sauce: 'tomato',
      cheese: 'mozzarella',
      vegetables: ['mushroom'],
      extraCheese: true,
      quantity: 2,
    },
  ]);
  assert(usage.some((u) => u.itemKey === 'thin_crust' && u.amount === 2), 'base qty');
  assert(
    usage.some((u) => u.itemKey === 'mozzarella' && u.amount === 4),
    'extra cheese doubles cheese usage',
  );

  await assertSufficientStockForItems([
    {
      base: 'thin_crust',
      sauce: 'tomato',
      cheese: 'mozzarella',
      vegetables: [],
      quantity: 1,
    },
  ]);

  const before = base.quantityInStock;
  const updated = await adjustStock(base._id, -1);
  assert(updated.quantityInStock === before - 1, 'adjust down');
  await adjustStock(base._id, 1);

  let blocked = false;
  try {
    await adjustStock(base._id, -(base.quantityInStock + 50));
  } catch {
    blocked = true;
  }
  assert(blocked, 'negative stock must be blocked');

  // Idempotent deduct on fake already-deducted order if any
  const paidOrder = await Order.findOne({ inventoryDeducted: true });
  if (paidOrder) {
    const result = await deductInventoryForPaidOrder(paidOrder._id);
    assert(result.skipped === true, 'duplicate deduct skipped');
  }

  console.log('PASS inventory checks');
  await mongoose.disconnect();
};

run().catch(async (error) => {
  console.error('FAIL', error.message);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
