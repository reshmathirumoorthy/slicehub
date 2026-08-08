import crypto from 'crypto';
import Order from '../models/Order.js';
import Payment from '../models/Payment.js';
import Coupon from '../models/Coupon.js';
import Cart from '../models/Cart.js';
import ApiError from '../utils/ApiError.js';
import {
  ORDER_STATUS,
  PAYMENT_METHODS,
  PAYMENT_STATUS,
  ONLINE_PAYMENT_METHODS,
} from '../models/constants.js';
import {
  calculateCartTotals,
  resolveConfiguredItem,
} from './cartService.js';
import { getUserAddressOrThrow } from './addressService.js';
import {
  assertSufficientStockForItems,
  deductInventoryForPaidOrder,
} from './inventoryService.js';
import { escapeRegex } from '../utils/escapeRegex.js';
import {
  notifyOrderPlaced,
  notifyOrderStatusChange,
  notifyPaymentSuccess,
  notifyRefundProcessed,
} from './notificationEvents.js';

const CANCELABLE = new Set([ORDER_STATUS.PENDING, ORDER_STATUS.CONFIRMED]);

const STATUS_FLOW = [
  ORDER_STATUS.PENDING,
  ORDER_STATUS.CONFIRMED,
  ORDER_STATUS.PREPARING,
  ORDER_STATUS.BAKING,
  ORDER_STATUS.OUT_FOR_DELIVERY,
  ORDER_STATUS.DELIVERED,
];

const STATUS_NOTES = {
  [ORDER_STATUS.PENDING]: 'Order placed',
  [ORDER_STATUS.CONFIRMED]: 'Order confirmed',
  [ORDER_STATUS.PREPARING]: 'Preparation started',
  [ORDER_STATUS.BAKING]: 'Order is baking',
  [ORDER_STATUS.OUT_FOR_DELIVERY]: 'Out for delivery',
  [ORDER_STATUS.DELIVERED]: 'Order delivered',
  [ORDER_STATUS.CANCELLED]: 'Order cancelled',
};

/**
 * Append a history entry only when status actually changes.
 * @returns {boolean} whether a new entry was added
 */
const appendStatusHistory = (
  order,
  status,
  { note = '', changedBy = 'system' } = {},
) => {
  const history = order.statusHistory || [];
  const last = history[history.length - 1];
  if (last && last.status === status) {
    return false;
  }
  if (!order.statusHistory) order.statusHistory = [];
  order.statusHistory.push({
    status,
    at: new Date(),
    note: note || STATUS_NOTES[status] || '',
    changedBy,
  });
  return true;
};

/**
 * Validate progressive transitions. Cancel is a special terminal path.
 * Same-status updates are no-ops (caller should short-circuit).
 */
const assertValidStatusTransition = (from, to) => {
  if (from === to) return;

  if (from === ORDER_STATUS.CANCELLED) {
    throw new ApiError(400, 'Cancelled orders cannot change status');
  }
  if (from === ORDER_STATUS.DELIVERED && to !== ORDER_STATUS.DELIVERED) {
    throw new ApiError(400, 'Delivered orders are final');
  }

  if (to === ORDER_STATUS.CANCELLED) {
    return;
  }

  const fromIdx = STATUS_FLOW.indexOf(from);
  const toIdx = STATUS_FLOW.indexOf(to);
  if (fromIdx === -1 || toIdx === -1) {
    throw new ApiError(400, 'Invalid order status');
  }
  if (toIdx <= fromIdx) {
    throw new ApiError(
      400,
      `Invalid status transition from ${from} to ${to}`,
    );
  }
};

const buildTrackingPayload = (order, payment = null) => {
  const history = (order.statusHistory || []).map((entry) => ({
    status: entry.status,
    at: entry.at,
    note: entry.note || '',
    changedBy: entry.changedBy || 'system',
  }));

  const historyAvailable = history.length > 0;
  const currentIndex = STATUS_FLOW.indexOf(order.status);
  const nextStep =
    order.status === ORDER_STATUS.CANCELLED ||
    order.status === ORDER_STATUS.DELIVERED ||
    currentIndex < 0 ||
    currentIndex >= STATUS_FLOW.length - 1
      ? null
      : STATUS_FLOW[currentIndex + 1];

  return {
    lifecycle: STATUS_FLOW,
    history,
    historyAvailable,
    currentStatus: order.status,
    nextStep,
    currentLabel: STATUS_NOTES[order.status] || order.status,
    nextStepLabel: nextStep ? STATUS_NOTES[nextStep] : null,
    paymentStatus: order.paymentStatus,
    paymentPaidAt: payment?.paidAt || null,
    estimatedDeliveryAt: order.estimatedDeliveryAt || null,
  };
};

const normalizePaymentMethod = (method) => {
  const raw = String(method || PAYMENT_METHODS.COD)
    .trim()
    .toLowerCase();
  const map = {
    cod: PAYMENT_METHODS.COD,
    cash: PAYMENT_METHODS.COD,
    upi: PAYMENT_METHODS.UPI,
    card: PAYMENT_METHODS.CARD,
    razorpay: PAYMENT_METHODS.RAZORPAY,
    net_banking: PAYMENT_METHODS.NET_BANKING,
    wallet: PAYMENT_METHODS.WALLET,
  };
  const value = map[raw] || raw;
  if (!Object.values(PAYMENT_METHODS).includes(value)) {
    throw new ApiError(400, 'Invalid payment method');
  }
  return value;
};

const generateOrderNumber = () => {
  const stamp = new Date()
    .toISOString()
    .slice(0, 10)
    .replace(/-/g, '');
  const suffix = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `SH-${stamp}-${suffix}`;
};

const snapshotAddress = (address) => ({
  fullName: address.fullName,
  phone: address.phone,
  street: address.street,
  landmark: address.landmark || '',
  city: address.city,
  state: address.state,
  postalCode: address.postalCode,
  country: address.country || 'India',
});

/**
 * Re-price every cart line on the server. Never trusts stored or client totals.
 */
export const repriceCartItems = async (cart) => {
  if (!cart.items?.length) {
    throw new ApiError(400, 'Cart is empty');
  }

  const priced = [];
  for (const item of cart.items) {
    const next = await resolveConfiguredItem({
      pizzaId: item.pizza || undefined,
      name: item.name,
      size: item.size,
      base: item.base,
      sauce: item.sauce,
      cheese: item.cheese,
      vegetables: item.vegetables || [],
      extraCheese: item.extraCheese,
      quantity: item.quantity,
    });

    // Keep cart in sync with authoritative prices
    item.unitPrice = next.unitPrice;
    item.lineTotal = next.lineTotal;
    item.labels = next.labels;
    item.name = next.name;
    item.image = next.image;

    priced.push(next);
  }

  await cart.save();
  const totals = await calculateCartTotals(cart);
  await cart.save();

  return { priced, totals, cart };
};

const serializeOrder = (order, payment = null) => ({
  id: order._id.toString(),
  orderNumber: order.orderNumber,
  status: order.status,
  paymentStatus: order.paymentStatus,
  paymentMethod: order.paymentMethod,
  requiresPayment:
    ONLINE_PAYMENT_METHODS.includes(order.paymentMethod) &&
    order.paymentStatus !== PAYMENT_STATUS.PAID &&
    order.paymentStatus !== PAYMENT_STATUS.REFUNDED &&
    order.status !== ORDER_STATUS.CANCELLED,
  couponCode: order.couponCode,
  notes: order.notes || '',
  items: (order.items || []).map((item) => ({
    pizzaId: item.pizza ? item.pizza.toString() : null,
    itemType: item.itemType,
    name: item.name,
    image: item.image,
    size: item.size,
    base: item.base,
    sauce: item.sauce,
    cheese: item.cheese,
    vegetables: item.vegetables || [],
    extraCheese: Boolean(item.extraCheese),
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    lineTotal: item.lineTotal,
    labels: item.labels,
  })),
  address: order.addressSnapshot,
  deliveryAddressId: order.deliveryAddress
    ? order.deliveryAddress.toString()
    : null,
  pricing: order.pricing,
  estimatedDeliveryAt: order.estimatedDeliveryAt,
  deliveredAt: order.deliveredAt,
  cancelledAt: order.cancelledAt,
  cancellationReason: order.cancellationReason,
  statusHistory: (order.statusHistory || []).map((entry) => ({
    status: entry.status,
    at: entry.at,
    note: entry.note || '',
    changedBy: entry.changedBy || 'system',
  })),
  tracking: buildTrackingPayload(order, payment),
  payment: payment
    ? {
        id: payment._id.toString(),
        method: payment.method,
        amount: payment.amount,
        status: payment.status,
        paidAt: payment.paidAt,
        refundedAt: payment.refundedAt || null,
        refundAmount: payment.refundAmount ?? null,
        gateway: payment.gateway,
        razorpayOrderId: payment.razorpayOrderId || null,
        requiresPayment: ONLINE_PAYMENT_METHODS.includes(payment.method) &&
          payment.status !== PAYMENT_STATUS.PAID &&
          payment.status !== PAYMENT_STATUS.REFUNDED,
      }
    : undefined,
  createdAt: order.createdAt,
  updatedAt: order.updatedAt,
  user: order.user
    ? {
        id: order.user._id?.toString?.() || order.user.toString(),
        name: order.user.name,
        email: order.user.email,
        phone: order.user.phone,
      }
    : undefined,
});

export const createOrderFromCart = async ({
  userId,
  addressId,
  paymentMethod,
  notes = '',
  // Client totals are accepted only for mismatch detection — never used.
  clientTotal,
}) => {
  const address = await getUserAddressOrThrow(userId, addressId);
  const method = normalizePaymentMethod(paymentMethod);

  const cart = await Cart.findOne({ user: userId });
  if (!cart || cart.items.length === 0) {
    throw new ApiError(400, 'Cart is empty');
  }

  const { priced, totals } = await repriceCartItems(cart);

  // Soft reservation check — stock is only decremented after payment succeeds
  await assertSufficientStockForItems(priced);

  if (
    clientTotal != null &&
    Number(clientTotal) !== Number(totals.grandTotal)
  ) {
    // Soft warning path: still use server total (never trust client)
  }

  let couponDoc = null;
  if (cart.couponCode) {
    couponDoc = await Coupon.findOne({ code: cart.couponCode, isActive: true });
  }

  const eta = new Date(Date.now() + 45 * 60 * 1000);
  const isOnline = ONLINE_PAYMENT_METHODS.includes(method);

  const order = await Order.create({
    orderNumber: generateOrderNumber(),
    user: userId,
    items: priced.map((item) => ({
      pizza: item.pizza,
      itemType: item.itemType,
      name: item.name,
      image: item.image,
      size: item.size,
      base: item.base,
      sauce: item.sauce,
      cheese: item.cheese,
      vegetables: item.vegetables,
      extraCheese: item.extraCheese,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      lineTotal: item.lineTotal,
      labels: item.labels,
    })),
    deliveryAddress: address._id,
    addressSnapshot: snapshotAddress(address),
    status: ORDER_STATUS.PENDING,
    // Online orders stay unpaid until Razorpay signature is verified
    paymentStatus: isOnline ? PAYMENT_STATUS.CREATED : PAYMENT_STATUS.PENDING,
    paymentMethod: method,
    coupon: couponDoc?._id || null,
    couponCode: cart.couponCode || null,
    pricing: {
      subtotal: totals.subtotal,
      discount: totals.discount,
      deliveryFee: totals.deliveryFee,
      tax: totals.tax,
      total: totals.grandTotal,
    },
    notes: String(notes || '').trim().slice(0, 500),
    estimatedDeliveryAt: eta,
    statusHistory: [
      {
        status: ORDER_STATUS.PENDING,
        at: new Date(),
        note: STATUS_NOTES[ORDER_STATUS.PENDING],
        changedBy: 'system',
      },
    ],
  });

  const payment = await Payment.create({
    order: order._id,
    user: userId,
    method,
    amount: totals.grandTotal,
    amountPaise: Math.round(Number(totals.grandTotal) * 100),
    currency: totals.currency || 'INR',
    status: isOnline ? PAYMENT_STATUS.CREATED : PAYMENT_STATUS.PENDING,
    paidAt: null,
    gateway: isOnline ? 'razorpay' : 'cod',
  });

  if (couponDoc) {
    couponDoc.usedCount = (couponDoc.usedCount || 0) + 1;
    await couponDoc.save();
  }

  cart.items = [];
  cart.couponCode = null;
  await cart.save();

  const serialized = serializeOrder(order, payment);
  await notifyOrderPlaced(order);
  return serialized;
};

export const listMyOrders = async (userId, { page = 1, limit = 20 } = {}) => {
  const skip = (Math.max(1, page) - 1) * Math.min(50, Math.max(1, limit));
  const [orders, total] = await Promise.all([
    Order.find({ user: userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Math.min(50, Math.max(1, limit))),
    Order.countDocuments({ user: userId }),
  ]);

  return {
    orders: orders.map((o) => serializeOrder(o)),
    pagination: {
      page: Math.max(1, page),
      limit: Math.min(50, Math.max(1, limit)),
      total,
      pages: Math.ceil(total / Math.min(50, Math.max(1, limit))) || 1,
    },
  };
};

export const getMyOrderById = async (userId, orderId) => {
  const order = await Order.findOne({ _id: orderId, user: userId }).populate(
    'payment',
  );
  if (!order) {
    throw new ApiError(404, 'Order not found');
  }
  return serializeOrder(order, order.payment);
};

export const cancelMyOrder = async (userId, orderId, reason = '') => {
  const order = await Order.findOne({ _id: orderId, user: userId });
  if (!order) {
    throw new ApiError(404, 'Order not found');
  }
  if (!CANCELABLE.has(order.status)) {
    throw new ApiError(
      400,
      'Only pending or confirmed orders can be cancelled',
    );
  }

  order.status = ORDER_STATUS.CANCELLED;
  order.cancelledAt = new Date();
  order.cancellationReason = String(reason || 'Cancelled by customer').slice(
    0,
    300,
  );
  appendStatusHistory(order, ORDER_STATUS.CANCELLED, {
    note: order.cancellationReason,
    changedBy: 'customer',
  });
  await order.save();

  const payment = await Payment.findOne({ order: order._id });
  if (payment && payment.status === PAYMENT_STATUS.PAID) {
    payment.status = PAYMENT_STATUS.REFUNDED;
    payment.refundedAt = new Date();
    payment.refundAmount = payment.amount;
    await payment.save();
    await notifyRefundProcessed(order);
  }

  await notifyOrderStatusChange(order, ORDER_STATUS.CANCELLED);
  return serializeOrder(order, payment);
};

export const listAdminOrders = async ({
  page = 1,
  limit = 20,
  status,
  paymentStatus,
  search,
  dateFrom,
  dateTo,
} = {}) => {
  const filter = {};
  if (status) filter.status = status;
  if (paymentStatus) filter.paymentStatus = paymentStatus;
  if (search) {
    const q = escapeRegex(String(search).trim());
    filter.$or = [
      { orderNumber: new RegExp(q, 'i') },
      { 'addressSnapshot.fullName': new RegExp(q, 'i') },
      { 'addressSnapshot.phone': new RegExp(q, 'i') },
      { couponCode: new RegExp(q, 'i') },
    ];
  }

  if (dateFrom || dateTo) {
    filter.createdAt = {};
    if (dateFrom) {
      const from = new Date(dateFrom);
      from.setHours(0, 0, 0, 0);
      filter.createdAt.$gte = from;
    }
    if (dateTo) {
      const to = new Date(dateTo);
      to.setHours(23, 59, 59, 999);
      filter.createdAt.$lte = to;
    }
  }

  const pageNum = Math.max(1, Number(page) || 1);
  const limitNum = Math.min(50, Math.max(1, Number(limit) || 20));
  const skip = (pageNum - 1) * limitNum;

  const [orders, total] = await Promise.all([
    Order.find(filter)
      .populate('user', 'name email phone')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum),
    Order.countDocuments(filter),
  ]);

  return {
    orders: orders.map((o) => serializeOrder(o)),
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      pages: Math.ceil(total / limitNum) || 1,
    },
  };
};

export const getAdminOrderById = async (orderId) => {
  const order = await Order.findById(orderId)
    .populate('user', 'name email phone')
    .populate('payment');
  if (!order) {
    throw new ApiError(404, 'Order not found');
  }
  return serializeOrder(order, order.payment);
};

export const updateAdminOrderStatus = async ({
  orderId,
  status,
  adminId = null,
}) => {
  if (!Object.values(ORDER_STATUS).includes(status)) {
    throw new ApiError(400, 'Invalid order status');
  }

  const order = await Order.findById(orderId);
  if (!order) {
    throw new ApiError(404, 'Order not found');
  }

  if (order.status === status) {
    // Idempotent: no duplicate history, no re-notification storm
    const payment = await Payment.findOne({ order: order._id });
    return serializeOrder(order, payment);
  }

  assertValidStatusTransition(order.status, status);

  order.status = status;
  if (adminId) order.assignedAdmin = adminId;

  let codJustPaid = false;
  if (status === ORDER_STATUS.DELIVERED) {
    order.deliveredAt = new Date();
    // COD settled on delivery
    if (
      order.paymentMethod === PAYMENT_METHODS.COD &&
      (order.paymentStatus === PAYMENT_STATUS.PENDING ||
        order.paymentStatus === PAYMENT_STATUS.CREATED)
    ) {
      order.paymentStatus = PAYMENT_STATUS.PAID;
      codJustPaid = true;
      const payment = await Payment.findOne({ order: order._id });
      if (
        payment &&
        (payment.status === PAYMENT_STATUS.PENDING ||
          payment.status === PAYMENT_STATUS.CREATED)
      ) {
        payment.status = PAYMENT_STATUS.PAID;
        payment.paidAt = new Date();
        await payment.save();
      }
    }
  }

  if (status === ORDER_STATUS.CANCELLED) {
    order.cancelledAt = new Date();
    order.cancellationReason = order.cancellationReason || 'Cancelled by admin';
  }

  appendStatusHistory(order, status, {
    note: STATUS_NOTES[status],
    changedBy: 'admin',
  });

  await order.save();

  // Deduct inventory only once payment is successful (Razorpay verify or COD paid)
  if (order.paymentStatus === PAYMENT_STATUS.PAID && !order.inventoryDeducted) {
    try {
      await deductInventoryForPaidOrder(order._id);
      await order.populate('payment');
    } catch (stockError) {
      console.error(
        '[inventory] deduction after COD/paid status failed:',
        stockError.message,
      );
    }
  }

  await notifyOrderStatusChange(order, status);
  if (codJustPaid) {
    await notifyPaymentSuccess(order);
  }

  const payment = await Payment.findOne({ order: order._id });
  return serializeOrder(order, payment);
};

/**
 * Used by payment verification when order moves pending → confirmed.
 * Mutates the order document; caller saves.
 */
export const applyConfirmedStatusIfPending = (order) => {
  if (order.status !== ORDER_STATUS.PENDING) {
    return false;
  }
  assertValidStatusTransition(order.status, ORDER_STATUS.CONFIRMED);
  order.status = ORDER_STATUS.CONFIRMED;
  appendStatusHistory(order, ORDER_STATUS.CONFIRMED, {
    note: STATUS_NOTES[ORDER_STATUS.CONFIRMED],
    changedBy: 'system',
  });
  return true;
};

export const getMyOrderTracking = async (userId, orderId) => {
  const order = await Order.findOne({ _id: orderId, user: userId }).populate(
    'payment',
  );
  if (!order) {
    throw new ApiError(404, 'Order not found');
  }
  const payment = order.payment || (await Payment.findOne({ order: order._id }));
  return {
    order: serializeOrder(order, payment),
    tracking: buildTrackingPayload(order, payment),
  };
};

export const getOrderStatusFlow = () => STATUS_FLOW;
