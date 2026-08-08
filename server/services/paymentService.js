import crypto from 'crypto';
import Razorpay from 'razorpay';
import env from '../config/env.js';
import Order from '../models/Order.js';
import Payment from '../models/Payment.js';
import ApiError from '../utils/ApiError.js';
import {
  ONLINE_PAYMENT_METHODS,
  ORDER_STATUS,
  PAYMENT_STATUS,
} from '../models/constants.js';
import { deductInventoryForPaidOrder, assertSufficientStockForItems } from './inventoryService.js';

const getRazorpayClient = () => {
  if (!env.razorpay.keyId || !env.razorpay.keySecret) {
    throw new ApiError(
      503,
      'Razorpay is not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET (test mode).',
    );
  }
  return new Razorpay({
    key_id: env.razorpay.keyId,
    key_secret: env.razorpay.keySecret,
  });
};

const assertOnlineOrderPayable = (order, payment) => {
  if (!order) {
    throw new ApiError(404, 'Order not found');
  }
  if (order.status === ORDER_STATUS.CANCELLED) {
    throw new ApiError(400, 'Cancelled orders cannot be paid');
  }
  if (!ONLINE_PAYMENT_METHODS.includes(order.paymentMethod)) {
    throw new ApiError(400, 'This order does not require online payment');
  }
  if (!payment) {
    throw new ApiError(404, 'Payment record not found');
  }
  if (payment.status === PAYMENT_STATUS.PAID) {
    throw new ApiError(409, 'Order is already paid');
  }
  if (payment.status === PAYMENT_STATUS.REFUNDED) {
    throw new ApiError(400, 'Refunded payments cannot be charged again');
  }

  const ageMs = Date.now() - new Date(order.createdAt).getTime();
  const expiryMs = env.paymentExpiryMinutes * 60 * 1000;
  if (ageMs > expiryMs) {
    throw new ApiError(410, 'Payment window expired for this order');
  }
};

/**
 * Create (or reuse) a Razorpay order for a SliceHub order.
 * Amount always comes from the server-side order pricing.
 */
export const createRazorpayOrder = async ({ userId, orderId }) => {
  const order = await Order.findOne({ _id: orderId, user: userId });
  if (!order) {
    throw new ApiError(404, 'Order not found');
  }

  const payment = await Payment.findOne({ order: order._id, user: userId });
  assertOnlineOrderPayable(order, payment);

  // Re-check stock before opening checkout (still no deduction)
  await assertSufficientStockForItems(order.items);

  // Authoritative amount — never trust the client
  const amountPaise = Math.round(Number(order.pricing.total) * 100);
  if (!Number.isFinite(amountPaise) || amountPaise < 100) {
    throw new ApiError(400, 'Invalid order amount for payment');
  }

  payment.amount = order.pricing.total;
  payment.amountPaise = amountPaise;
  payment.currency = 'INR';
  payment.gateway = 'razorpay';

  const razorpay = getRazorpayClient();

  // Reuse existing unpaid Razorpay order when amount still matches
  if (
    payment.razorpayOrderId &&
    payment.status !== PAYMENT_STATUS.FAILED &&
    payment.amountPaise === amountPaise
  ) {
    payment.status = PAYMENT_STATUS.PENDING;
    order.paymentStatus = PAYMENT_STATUS.PENDING;
    await payment.save();
    await order.save();

    return {
      keyId: env.razorpay.keyId,
      razorpayOrderId: payment.razorpayOrderId,
      amount: amountPaise,
      currency: 'INR',
      orderId: order._id.toString(),
      orderNumber: order.orderNumber,
      name: 'SliceHub',
      description: `Order ${order.orderNumber}`,
      prefill: {
        name: order.addressSnapshot?.fullName || '',
        contact: order.addressSnapshot?.phone || '',
      },
    };
  }

  let razorpayOrder;
  try {
    razorpayOrder = await razorpay.orders.create({
      amount: amountPaise,
      currency: 'INR',
      receipt: order.orderNumber.slice(0, 40),
      notes: {
        slicehubOrderId: order._id.toString(),
        orderNumber: order.orderNumber,
      },
    });
  } catch (error) {
    payment.status = PAYMENT_STATUS.FAILED;
    payment.failureReason = error?.error?.description || error.message;
    await payment.save();
    order.paymentStatus = PAYMENT_STATUS.FAILED;
    await order.save();
    throw new ApiError(
      502,
      error?.error?.description || 'Failed to create Razorpay order',
    );
  }

  payment.razorpayOrderId = razorpayOrder.id;
  payment.status = PAYMENT_STATUS.PENDING;
  payment.failureReason = null;
  payment.gatewayResponse = {
    razorpayOrder,
    createdAt: new Date().toISOString(),
  };
  await payment.save();

  order.paymentStatus = PAYMENT_STATUS.PENDING;
  await order.save();

  return {
    keyId: env.razorpay.keyId,
    razorpayOrderId: razorpayOrder.id,
    amount: amountPaise,
    currency: 'INR',
    orderId: order._id.toString(),
    orderNumber: order.orderNumber,
    name: 'SliceHub',
    description: `Order ${order.orderNumber}`,
    prefill: {
      name: order.addressSnapshot?.fullName || '',
      contact: order.addressSnapshot?.phone || '',
    },
  };
};

const verifySignature = ({
  razorpayOrderId,
  razorpayPaymentId,
  razorpaySignature,
}) => {
  const body = `${razorpayOrderId}|${razorpayPaymentId}`;
  const expected = crypto
    .createHmac('sha256', env.razorpay.keySecret)
    .update(body)
    .digest('hex');
  return expected === razorpaySignature;
};

/**
 * Verify Razorpay checkout response and mark the order paid.
 * Idempotent for already-paid orders with the same payment id.
 */
export const verifyRazorpayPayment = async ({
  userId,
  orderId,
  razorpayOrderId,
  razorpayPaymentId,
  razorpaySignature,
}) => {
  if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
    throw new ApiError(400, 'Missing Razorpay payment fields');
  }

  if (!env.razorpay.keySecret) {
    throw new ApiError(503, 'Razorpay is not configured');
  }

  const order = await Order.findOne({ _id: orderId, user: userId });
  if (!order) {
    throw new ApiError(404, 'Order not found');
  }

  const payment = await Payment.findOne({
    order: order._id,
    user: userId,
  }).select('+razorpaySignature');

  if (!payment) {
    throw new ApiError(404, 'Payment record not found');
  }

  // Duplicate / already paid — idempotent success
  if (payment.status === PAYMENT_STATUS.PAID) {
    if (
      payment.razorpayPaymentId &&
      payment.razorpayPaymentId !== razorpayPaymentId
    ) {
      throw new ApiError(409, 'Order already paid with a different payment');
    }
    return {
      alreadyPaid: true,
      orderId: order._id.toString(),
      orderNumber: order.orderNumber,
      paymentStatus: PAYMENT_STATUS.PAID,
      paymentId: payment._id.toString(),
    };
  }

  if (order.status === ORDER_STATUS.CANCELLED) {
    throw new ApiError(400, 'Cannot pay a cancelled order');
  }

  const ageMs = Date.now() - new Date(order.createdAt).getTime();
  if (ageMs > env.paymentExpiryMinutes * 60 * 1000) {
    throw new ApiError(410, 'Payment window expired for this order');
  }

  if (
    payment.razorpayOrderId &&
    payment.razorpayOrderId !== razorpayOrderId
  ) {
    throw new ApiError(400, 'Razorpay order mismatch');
  }

  const valid = verifySignature({
    razorpayOrderId,
    razorpayPaymentId,
    razorpaySignature,
  });

  if (!valid) {
    payment.status = PAYMENT_STATUS.FAILED;
    payment.failureReason = 'Invalid payment signature';
    await payment.save();
    order.paymentStatus = PAYMENT_STATUS.FAILED;
    await order.save();
    throw new ApiError(400, 'Invalid payment signature');
  }

  // Prevent double-spend of the same Razorpay payment id across orders
  const existingPay = await Payment.findOne({
    razorpayPaymentId,
    _id: { $ne: payment._id },
  });
  if (existingPay) {
    throw new ApiError(409, 'This Razorpay payment was already used');
  }

  payment.razorpayOrderId = razorpayOrderId;
  payment.razorpayPaymentId = razorpayPaymentId;
  payment.razorpaySignature = razorpaySignature;
  payment.transactionId = razorpayPaymentId;
  payment.status = PAYMENT_STATUS.PAID;
  payment.paidAt = new Date();
  payment.failureReason = null;
  payment.gatewayResponse = {
    ...(payment.gatewayResponse || {}),
    verifiedAt: new Date().toISOString(),
    razorpayPaymentId,
    razorpayOrderId,
  };
  await payment.save();

  order.paymentStatus = PAYMENT_STATUS.PAID;
  if (order.status === ORDER_STATUS.PENDING) {
    order.status = ORDER_STATUS.CONFIRMED;
  }
  await order.save();

  // Stock only after successful payment verification
  try {
    await deductInventoryForPaidOrder(order._id);
  } catch (stockError) {
    console.error(
      '[inventory] deduction after Razorpay verify failed:',
      stockError.message,
    );
  }

  return {
    alreadyPaid: false,
    orderId: order._id.toString(),
    orderNumber: order.orderNumber,
    paymentStatus: PAYMENT_STATUS.PAID,
    paymentId: payment._id.toString(),
  };
};

/**
 * Mark payment failed when the customer dismisses or Razorpay reports failure.
 * Does not create a new SliceHub order.
 */
export const markPaymentFailed = async ({
  userId,
  orderId,
  reason = 'Payment failed or cancelled',
}) => {
  const order = await Order.findOne({ _id: orderId, user: userId });
  if (!order) {
    throw new ApiError(404, 'Order not found');
  }

  const payment = await Payment.findOne({ order: order._id, user: userId });
  if (!payment) {
    throw new ApiError(404, 'Payment record not found');
  }

  if (payment.status === PAYMENT_STATUS.PAID) {
    throw new ApiError(409, 'Paid orders cannot be marked failed');
  }

  payment.status = PAYMENT_STATUS.FAILED;
  payment.failureReason = String(reason).slice(0, 300);
  await payment.save();

  order.paymentStatus = PAYMENT_STATUS.FAILED;
  await order.save();

  return {
    orderId: order._id.toString(),
    paymentStatus: PAYMENT_STATUS.FAILED,
  };
};

/** Public key only — never the secret */
export const getPublicRazorpayConfig = () => ({
  keyId: env.razorpay.keyId || null,
  configured: Boolean(env.razorpay.keyId && env.razorpay.keySecret),
  mode: 'test',
});
