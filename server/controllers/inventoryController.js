import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import * as inventoryService from '../services/inventoryService.js';
import { runLowStockAlertJob } from '../jobs/lowStockAlertJob.js';

export const listInventory = asyncHandler(async (req, res) => {
  const result = await inventoryService.listInventory({
    category: req.query.category,
    status: req.query.status,
    search: req.query.search || req.query.q,
    page: Number(req.query.page) || 1,
    limit: Number(req.query.limit) || 100,
  });

  res.status(200).json({
    success: true,
    data: result,
  });
});

export const listLowStock = asyncHandler(async (_req, res) => {
  const items = await inventoryService.listLowStock();
  res.status(200).json({ success: true, data: { items } });
});

export const listOutOfStock = asyncHandler(async (_req, res) => {
  const items = await inventoryService.listOutOfStock();
  res.status(200).json({ success: true, data: { items } });
});

export const getInventoryItem = asyncHandler(async (req, res) => {
  const item = await inventoryService.getInventoryById(req.params.id);
  res.status(200).json({ success: true, data: { item } });
});

export const createInventoryItem = asyncHandler(async (req, res) => {
  const item = await inventoryService.createInventoryItem(req.body);
  res.status(201).json({
    success: true,
    message: 'Inventory item created',
    data: { item },
  });
});

export const updateInventoryItem = asyncHandler(async (req, res) => {
  const item = await inventoryService.updateInventoryItem(
    req.params.id,
    req.body,
  );
  res.status(200).json({
    success: true,
    message: 'Inventory updated',
    data: { item },
  });
});

export const addStock = asyncHandler(async (req, res) => {
  const amount = req.body.quantity ?? req.body.amount;
  if (amount == null) throw new ApiError(400, 'quantity is required');
  const item = await inventoryService.addStock(req.params.id, amount);
  res.status(200).json({
    success: true,
    message: 'Stock added',
    data: { item },
  });
});

export const adjustStock = asyncHandler(async (req, res) => {
  const delta = req.body.delta ?? req.body.adjustment;
  if (delta == null) throw new ApiError(400, 'delta is required');
  const item = await inventoryService.adjustStock(req.params.id, delta);
  res.status(200).json({
    success: true,
    message: 'Stock adjusted',
    data: { item },
  });
});

export const setThreshold = asyncHandler(async (req, res) => {
  const threshold =
    req.body.minimumThreshold ?? req.body.threshold ?? req.body.reorderLevel;
  if (threshold == null) {
    throw new ApiError(400, 'minimumThreshold is required');
  }
  const item = await inventoryService.setThreshold(req.params.id, threshold);
  res.status(200).json({
    success: true,
    message: 'Threshold updated',
    data: { item },
  });
});

export const triggerLowStockCheck = asyncHandler(async (_req, res) => {
  const result = await runLowStockAlertJob({ force: true });
  res.status(200).json({
    success: true,
    message: 'Low-stock check completed',
    data: result,
  });
});
