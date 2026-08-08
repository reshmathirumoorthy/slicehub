import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import * as orderService from '../services/orderService.js';

export const createOrder = asyncHandler(async (req, res) => {
  if (!req.body.addressId) {
    throw new ApiError(400, 'Delivery address is required');
  }

  const order = await orderService.createOrderFromCart({
    userId: req.user._id,
    addressId: req.body.addressId,
    paymentMethod: req.body.paymentMethod,
    notes: req.body.notes,
    clientTotal: req.body.total ?? req.body.clientTotal,
  });

  res.status(201).json({
    success: true,
    message: 'Order placed successfully',
    data: { order },
  });
});

export const listMyOrders = asyncHandler(async (req, res) => {
  const result = await orderService.listMyOrders(req.user._id, {
    page: Number(req.query.page) || 1,
    limit: Number(req.query.limit) || 20,
  });

  res.status(200).json({
    success: true,
    data: result,
  });
});

export const getMyOrder = asyncHandler(async (req, res) => {
  const order = await orderService.getMyOrderById(req.user._id, req.params.id);
  res.status(200).json({
    success: true,
    data: { order },
  });
});

export const cancelMyOrder = asyncHandler(async (req, res) => {
  const order = await orderService.cancelMyOrder(
    req.user._id,
    req.params.id,
    req.body.reason,
  );
  res.status(200).json({
    success: true,
    message: 'Order cancelled',
    data: { order },
  });
});

export const listAdminOrders = asyncHandler(async (req, res) => {
  const result = await orderService.listAdminOrders({
    page: Number(req.query.page) || 1,
    limit: Number(req.query.limit) || 20,
    status: req.query.status,
    paymentStatus: req.query.paymentStatus,
    search: req.query.search || req.query.q,
    dateFrom: req.query.dateFrom || req.query.from,
    dateTo: req.query.dateTo || req.query.to,
  });

  res.status(200).json({
    success: true,
    data: result,
  });
});

export const getAdminOrder = asyncHandler(async (req, res) => {
  const order = await orderService.getAdminOrderById(req.params.id);
  res.status(200).json({
    success: true,
    data: { order },
  });
});

export const updateAdminOrderStatus = asyncHandler(async (req, res) => {
  const order = await orderService.updateAdminOrderStatus({
    orderId: req.params.id,
    status: req.body.status,
    adminId: req.admin?._id,
  });

  res.status(200).json({
    success: true,
    message: 'Order status updated',
    data: { order },
  });
});
