import Inventory from '../models/Inventory.js';
import Order from '../models/Order.js';
import ApiError from '../utils/ApiError.js';
import {
  INVENTORY_CATEGORIES,
  INVENTORY_STOCK_STATUS,
  INVENTORY_UNITS,
} from '../models/constants.js';
import { escapeRegex } from '../utils/escapeRegex.js';

const formatLabel = (key) =>
  String(key || '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());

export const serializeInventoryItem = (item) => {
  const threshold = item.minimumThreshold ?? item.reorderLevel ?? 0;
  const qty = item.quantityInStock ?? 0;
  let stockStatus = INVENTORY_STOCK_STATUS.IN_STOCK;
  if (qty <= 0) stockStatus = INVENTORY_STOCK_STATUS.OUT_OF_STOCK;
  else if (qty <= threshold) stockStatus = INVENTORY_STOCK_STATUS.LOW_STOCK;

  return {
    id: item._id.toString(),
    name: item.name,
    sku: item.sku,
    itemKey: item.itemKey,
    category: item.category,
    description: item.description || '',
    unit: item.unit,
    quantityInStock: qty,
    minimumThreshold: threshold,
    reorderLevel: item.reorderLevel ?? threshold,
    unitCost: item.unitCost || 0,
    supplier: item.supplier || '',
    isActive: item.isActive !== false,
    stockStatus,
    isLowStock: stockStatus === INVENTORY_STOCK_STATUS.LOW_STOCK,
    isOutOfStock: stockStatus === INVENTORY_STOCK_STATUS.OUT_OF_STOCK,
    lastRestockedAt: item.lastRestockedAt,
    lastLowStockAlertAt: item.lastLowStockAlertAt,
    updatedAt: item.updatedAt,
    createdAt: item.createdAt,
  };
};

/**
 * Aggregate ingredient units required by order/cart line items.
 * 1 pizza qty → 1 base + 1 sauce + 1 cheese (+1 if extraCheese) + 1 per vegetable.
 */
export const buildUsageMapFromItems = (items = []) => {
  const usage = new Map(); // key: `${category}:${itemKey}` → amount

  const add = (category, itemKey, amount) => {
    if (!itemKey || amount <= 0) return;
    const key = `${category}:${String(itemKey).toLowerCase()}`;
    usage.set(key, (usage.get(key) || 0) + amount);
  };

  for (const item of items) {
    const qty = Number(item.quantity) || 1;
    add(INVENTORY_CATEGORIES.BASE, item.base, qty);
    add(INVENTORY_CATEGORIES.SAUCE, item.sauce, qty);
    add(INVENTORY_CATEGORIES.CHEESE, item.cheese, qty);
    if (item.extraCheese) {
      add(INVENTORY_CATEGORIES.CHEESE, item.cheese, qty);
    }
    for (const veg of item.vegetables || []) {
      add(INVENTORY_CATEGORIES.VEGETABLE, veg, qty);
    }
  }

  return [...usage.entries()].map(([composite, amount]) => {
    const [category, itemKey] = composite.split(':');
    return { category, itemKey, amount };
  });
};

export const assertSufficientStockForItems = async (items) => {
  const requirements = buildUsageMapFromItems(items);
  if (!requirements.length) return requirements;

  const shortages = [];

  for (const req of requirements) {
    const row = await Inventory.findOne({
      category: req.category,
      itemKey: req.itemKey,
      isActive: true,
    });

    if (!row) {
      shortages.push({
        category: req.category,
        itemKey: req.itemKey,
        required: req.amount,
        available: 0,
        message: `No inventory configured for ${req.category} "${req.itemKey}"`,
      });
      continue;
    }

    if (row.quantityInStock < req.amount) {
      shortages.push({
        category: req.category,
        itemKey: req.itemKey,
        name: row.name,
        required: req.amount,
        available: row.quantityInStock,
        message: `Insufficient ${row.name}: need ${req.amount}, have ${row.quantityInStock}`,
      });
    }
  }

  if (shortages.length) {
    throw new ApiError(409, 'Insufficient inventory for this order', shortages);
  }

  return requirements;
};

/**
 * Atomically decrement stock for a paid order. Idempotent via order.inventoryDeducted.
 * Uses per-document atomic $inc with $gte guards; rolls back on partial failure.
 */
export const deductInventoryForPaidOrder = async (orderId) => {
  const order = await Order.findById(orderId);
  if (!order) {
    throw new ApiError(404, 'Order not found for inventory deduction');
  }

  if (order.inventoryDeducted) {
    return { skipped: true, reason: 'already_deducted' };
  }

  const requirements = buildUsageMapFromItems(order.items);
  if (!requirements.length) {
    order.inventoryDeducted = true;
    order.inventoryDeductedAt = new Date();
    await order.save();
    return { skipped: true, reason: 'no_requirements' };
  }

  // Claim first to block concurrent deductors
  const claimed = await Order.findOneAndUpdate(
    { _id: orderId, inventoryDeducted: { $ne: true } },
    {
      $set: {
        inventoryDeducted: true,
        inventoryDeductedAt: new Date(),
      },
    },
    { new: true },
  );

  if (!claimed) {
    return { skipped: true, reason: 'already_deducted' };
  }

  const applied = [];

  const rollback = async () => {
    for (const row of applied.reverse()) {
      await Inventory.findByIdAndUpdate(row.id, {
        $inc: { quantityInStock: row.amount },
      });
    }
    await Order.findByIdAndUpdate(orderId, {
      $set: { inventoryDeducted: false, inventoryDeductedAt: null },
    });
  };

  try {
    for (const req of requirements) {
      const updated = await Inventory.findOneAndUpdate(
        {
          category: req.category,
          itemKey: req.itemKey,
          isActive: true,
          quantityInStock: { $gte: req.amount },
        },
        { $inc: { quantityInStock: -req.amount } },
        { new: true },
      );

      if (!updated) {
        throw new ApiError(
          409,
          `Insufficient stock for ${req.category} "${req.itemKey}"`,
        );
      }

      applied.push({
        id: updated._id,
        category: req.category,
        itemKey: req.itemKey,
        amount: req.amount,
      });
    }
  } catch (error) {
    await rollback();
    throw error;
  }

  return {
    skipped: false,
    deducted: applied.map((a) => ({
      category: a.category,
      itemKey: a.itemKey,
      amount: a.amount,
    })),
  };
};

export const listInventory = async ({
  category,
  status,
  search,
  page = 1,
  limit = 100,
} = {}) => {
  const filter = {};
  if (category) filter.category = category;
  if (search) {
    const q = escapeRegex(String(search).trim());
    filter.$or = [
      { name: new RegExp(q, 'i') },
      { sku: new RegExp(q, 'i') },
      { itemKey: new RegExp(q, 'i') },
    ];
  }

  let items = await Inventory.find(filter).sort({ category: 1, name: 1 });

  if (status === INVENTORY_STOCK_STATUS.OUT_OF_STOCK) {
    items = items.filter((i) => i.quantityInStock <= 0);
  } else if (status === INVENTORY_STOCK_STATUS.LOW_STOCK) {
    items = items.filter((i) => {
      const t = i.minimumThreshold ?? i.reorderLevel ?? 0;
      return i.quantityInStock > 0 && i.quantityInStock <= t;
    });
  } else if (status === INVENTORY_STOCK_STATUS.IN_STOCK) {
    items = items.filter((i) => {
      const t = i.minimumThreshold ?? i.reorderLevel ?? 0;
      return i.quantityInStock > t;
    });
  }

  const pageNum = Math.max(1, Number(page) || 1);
  const limitNum = Math.min(200, Math.max(1, Number(limit) || 100));
  const total = items.length;
  const slice = items.slice((pageNum - 1) * limitNum, pageNum * limitNum);

  const serialized = slice.map(serializeInventoryItem);

  const all = await Inventory.find({}).select(
    'quantityInStock minimumThreshold reorderLevel',
  );
  let lowStock = 0;
  let outOfStock = 0;
  for (const i of all) {
    if (i.quantityInStock <= 0) outOfStock += 1;
    else {
      const t = i.minimumThreshold ?? i.reorderLevel ?? 0;
      if (i.quantityInStock <= t) lowStock += 1;
    }
  }

  const summary = {
    total: all.length,
    lowStock,
    outOfStock,
  };

  return {
    items: serialized,
    summary,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      pages: Math.ceil(total / limitNum) || 1,
    },
  };
};

export const listLowStock = async () => {
  const items = await Inventory.find({ isActive: true });
  return items
    .filter((i) => {
      const t = i.minimumThreshold ?? i.reorderLevel ?? 0;
      return i.quantityInStock > 0 && i.quantityInStock <= t;
    })
    .map(serializeInventoryItem);
};

export const listOutOfStock = async () => {
  const items = await Inventory.find({
    isActive: true,
    quantityInStock: { $lte: 0 },
  }).sort({ name: 1 });
  return items.map(serializeInventoryItem);
};

export const getInventoryById = async (id) => {
  const item = await Inventory.findById(id);
  if (!item) throw new ApiError(404, 'Inventory item not found');
  return serializeInventoryItem(item);
};

export const createInventoryItem = async (payload) => {
  const category = payload.category;
  const itemKey = String(payload.itemKey || '').trim().toLowerCase();
  if (!Object.values(INVENTORY_CATEGORIES).includes(category)) {
    throw new ApiError(400, 'Invalid category');
  }
  if (!itemKey) throw new ApiError(400, 'itemKey is required');

  const threshold = Number(
    payload.minimumThreshold ?? payload.reorderLevel ?? 10,
  );
  const quantity = Number(payload.quantityInStock ?? payload.quantity ?? 0);
  if (quantity < 0 || threshold < 0) {
    throw new ApiError(400, 'Quantity and threshold cannot be negative');
  }

  const item = await Inventory.create({
    name: payload.name || formatLabel(itemKey),
    sku: (payload.sku || `${category}-${itemKey}`).toUpperCase(),
    itemKey,
    category,
    description: payload.description || '',
    unit: payload.unit || INVENTORY_UNITS.PIECE,
    quantityInStock: quantity,
    minimumThreshold: threshold,
    reorderLevel: threshold,
    unitCost: Number(payload.unitCost) || 0,
    supplier: payload.supplier || '',
    isActive: payload.isActive !== false,
    lastRestockedAt: quantity > 0 ? new Date() : null,
  });

  return serializeInventoryItem(item);
};

export const updateInventoryItem = async (id, payload) => {
  const item = await Inventory.findById(id);
  if (!item) throw new ApiError(404, 'Inventory item not found');

  if (payload.name != null) item.name = String(payload.name).trim();
  if (payload.description != null) item.description = payload.description;
  if (payload.supplier != null) item.supplier = payload.supplier;
  if (payload.unit != null) item.unit = payload.unit;
  if (payload.unitCost != null) item.unitCost = Number(payload.unitCost);
  if (payload.isActive != null) item.isActive = Boolean(payload.isActive);

  if (payload.minimumThreshold != null || payload.reorderLevel != null) {
    const t = Number(payload.minimumThreshold ?? payload.reorderLevel);
    if (t < 0) throw new ApiError(400, 'Threshold cannot be negative');
    item.minimumThreshold = t;
    item.reorderLevel = t;
  }

  if (payload.quantityInStock != null || payload.quantity != null) {
    const q = Number(payload.quantityInStock ?? payload.quantity);
    if (!Number.isFinite(q) || q < 0) {
      throw new ApiError(400, 'Quantity cannot be negative');
    }
    if (q > item.quantityInStock) item.lastRestockedAt = new Date();
    item.quantityInStock = q;
  }

  await item.save();
  return serializeInventoryItem(item);
};

/** Add stock (restock) — always increases */
export const addStock = async (id, amount) => {
  const qty = Number(amount);
  if (!Number.isFinite(qty) || qty <= 0) {
    throw new ApiError(400, 'Add amount must be a positive number');
  }

  const item = await Inventory.findByIdAndUpdate(
    id,
    {
      $inc: { quantityInStock: qty },
      $set: { lastRestockedAt: new Date() },
    },
    { new: true },
  );
  if (!item) throw new ApiError(404, 'Inventory item not found');
  return serializeInventoryItem(item);
};

/**
 * Adjust stock by delta (positive or negative). Prevents going below zero.
 */
export const adjustStock = async (id, delta) => {
  const change = Number(delta);
  if (!Number.isFinite(change) || change === 0) {
    throw new ApiError(400, 'Adjustment delta must be a non-zero number');
  }

  if (change > 0) {
    return addStock(id, change);
  }

  const need = Math.abs(change);
  const item = await Inventory.findOneAndUpdate(
    { _id: id, quantityInStock: { $gte: need } },
    { $inc: { quantityInStock: -need } },
    { new: true },
  );

  if (!item) {
    const existing = await Inventory.findById(id);
    if (!existing) throw new ApiError(404, 'Inventory item not found');
    throw new ApiError(
      400,
      `Cannot reduce below zero (available ${existing.quantityInStock})`,
    );
  }

  return serializeInventoryItem(item);
};

export const setThreshold = async (id, minimumThreshold) => {
  const t = Number(minimumThreshold);
  if (!Number.isFinite(t) || t < 0) {
    throw new ApiError(400, 'Threshold must be >= 0');
  }
  const item = await Inventory.findByIdAndUpdate(
    id,
    { $set: { minimumThreshold: t, reorderLevel: t } },
    { new: true },
  );
  if (!item) throw new ApiError(404, 'Inventory item not found');
  return serializeInventoryItem(item);
};

export const getItemsNeedingAlert = async (cooldownHours) => {
  const cutoff = new Date(Date.now() - cooldownHours * 60 * 60 * 1000);
  const items = await Inventory.find({ isActive: true });

  return items.filter((item) => {
    const threshold = item.minimumThreshold ?? item.reorderLevel ?? 0;
    const needsAttention =
      item.quantityInStock <= 0 || item.quantityInStock <= threshold;
    if (!needsAttention) return false;
    if (!item.lastLowStockAlertAt) return true;
    return item.lastLowStockAlertAt < cutoff;
  });
};

export const markAlerted = async (ids) => {
  if (!ids.length) return;
  await Inventory.updateMany(
    { _id: { $in: ids } },
    { $set: { lastLowStockAlertAt: new Date() } },
  );
};
