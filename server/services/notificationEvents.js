import User from '../models/User.js';
import env from '../config/env.js';
import {
  NOTIFICATION_AUDIENCE,
  NOTIFICATION_TYPES,
  ORDER_STATUS,
} from '../models/constants.js';
import {
  createNotificationSafe,
  notifyAllActiveAdmins,
} from './notificationService.js';
import {
  sendOrderStatusEmail,
  sendPaymentStatusEmail,
  sendReviewSubmittedEmail,
} from './emailService.js';

const STATUS_COPY = {
  [ORDER_STATUS.PENDING]: {
    title: 'Order placed',
    message: (n) => `Your order ${n} has been placed successfully.`,
  },
  [ORDER_STATUS.CONFIRMED]: {
    title: 'Order confirmed',
    message: (n) => `Your order ${n} has been confirmed.`,
  },
  [ORDER_STATUS.PREPARING]: {
    title: 'Preparation started',
    message: (n) => `We're preparing your order ${n}.`,
  },
  [ORDER_STATUS.BAKING]: {
    title: 'Order baking',
    message: (n) => `Your order ${n} is in the oven.`,
  },
  [ORDER_STATUS.OUT_FOR_DELIVERY]: {
    title: 'Out for delivery',
    message: (n) => `Your order ${n} is out for delivery.`,
  },
  [ORDER_STATUS.DELIVERED]: {
    title: 'Order delivered',
    message: (n) => `Your order ${n} has been delivered. Enjoy!`,
  },
  [ORDER_STATUS.CANCELLED]: {
    title: 'Order cancelled',
    message: (n) => `Your order ${n} has been cancelled.`,
  },
};

const EMAIL_STATUSES = new Set([
  ORDER_STATUS.PENDING,
  ORDER_STATUS.CONFIRMED,
  ORDER_STATUS.DELIVERED,
  ORDER_STATUS.CANCELLED,
]);

const safeEmail = async (fn) => {
  try {
    await Promise.race([
      fn(),
      new Promise((_, reject) => {
        setTimeout(() => reject(new Error('email timeout')), 8000);
      }),
    ]);
  } catch (error) {
    console.error('[notification-email] failed:', error.message);
  }
};

const loadUser = async (userId) =>
  User.findById(userId).select('name email notificationPreferences').lean();

/**
 * Customer + admin notifications when an order is created.
 */
export const notifyOrderPlaced = async (order) => {
  const userId = order.user?._id || order.user;
  const orderId = order._id || order.id;
  const orderNumber = order.orderNumber;

  await createNotificationSafe({
    audience: NOTIFICATION_AUDIENCE.USER,
    userId,
    type: NOTIFICATION_TYPES.ORDER,
    title: 'Order placed',
    message: `Your order ${orderNumber} has been placed successfully.`,
    orderId,
    link: `/orders/${orderId}`,
    eventKey: `user:${userId}:order:${orderId}:placed`,
    metadata: { orderNumber, status: ORDER_STATUS.PENDING },
  });

  await notifyAllActiveAdmins({
    type: NOTIFICATION_TYPES.ORDER,
    title: 'New order',
    message: `New order ${orderNumber} received.`,
    orderId,
    link: `/admin/orders?focus=${orderId}`,
    eventKeyPrefix: `order:${orderId}:new`,
    metadata: { orderNumber },
  });

  const user = await loadUser(userId);
  if (user?.email && user.notificationPreferences?.orderEmails !== false) {
    await safeEmail(() =>
      sendOrderStatusEmail({
        to: user.email,
        name: user.name,
        orderNumber,
        status: ORDER_STATUS.PENDING,
        orderUrl: `${env.clientUrl}/orders/${orderId}`,
      }),
    );
  }
};

/**
 * Status-change notifications for customer (and admin on cancel).
 */
export const notifyOrderStatusChange = async (order, status) => {
  const userId = order.user?._id || order.user;
  const orderId = order._id || order.id;
  const orderNumber = order.orderNumber;
  const copy = STATUS_COPY[status];
  if (!copy) return;

  await createNotificationSafe({
    audience: NOTIFICATION_AUDIENCE.USER,
    userId,
    type: NOTIFICATION_TYPES.ORDER,
    title: copy.title,
    message: copy.message(orderNumber),
    orderId,
    link: `/orders/${orderId}`,
    eventKey: `user:${userId}:order:${orderId}:status:${status}`,
    metadata: { orderNumber, status },
  });

  if (status === ORDER_STATUS.CANCELLED) {
    await notifyAllActiveAdmins({
      type: NOTIFICATION_TYPES.ORDER,
      title: 'Order cancelled',
      message: `Order ${orderNumber} was cancelled.`,
      orderId,
      link: `/admin/orders?focus=${orderId}`,
      eventKeyPrefix: `order:${orderId}:cancelled`,
      metadata: { orderNumber },
    });
  }

  if (EMAIL_STATUSES.has(status)) {
    const user = await loadUser(userId);
    if (user?.email && user.notificationPreferences?.orderEmails !== false) {
      await safeEmail(() =>
        sendOrderStatusEmail({
          to: user.email,
          name: user.name,
          orderNumber,
          status,
          orderUrl: `${env.clientUrl}/orders/${orderId}`,
        }),
      );
    }
  }
};

export const notifyPaymentSuccess = async (order) => {
  const userId = order.user?._id || order.user;
  const orderId = order._id || order.id;
  const orderNumber = order.orderNumber;

  await createNotificationSafe({
    audience: NOTIFICATION_AUDIENCE.USER,
    userId,
    type: NOTIFICATION_TYPES.PAYMENT,
    title: 'Payment successful',
    message: `Payment successful for order ${orderNumber}.`,
    orderId,
    link: `/orders/${orderId}`,
    eventKey: `user:${userId}:order:${orderId}:payment:paid`,
    metadata: { orderNumber, paymentStatus: 'paid' },
  });

  const user = await loadUser(userId);
  if (user?.email && user.notificationPreferences?.orderEmails !== false) {
    await safeEmail(() =>
      sendPaymentStatusEmail({
        to: user.email,
        name: user.name,
        orderNumber,
        success: true,
        orderUrl: `${env.clientUrl}/orders/${orderId}`,
      }),
    );
  }
};

export const notifyPaymentFailed = async (order, reason = '') => {
  const userId = order.user?._id || order.user;
  const orderId = order._id || order.id;
  const orderNumber = order.orderNumber;

  await createNotificationSafe({
    audience: NOTIFICATION_AUDIENCE.USER,
    userId,
    type: NOTIFICATION_TYPES.PAYMENT,
    title: 'Payment failed',
    message: reason
      ? `Payment failed for order ${orderNumber}: ${String(reason).slice(0, 120)}`
      : `Payment failed for order ${orderNumber}.`,
    orderId,
    link: `/orders/${orderId}`,
    eventKey: `user:${userId}:order:${orderId}:payment:failed`,
    metadata: { orderNumber, paymentStatus: 'failed' },
  });

  await notifyAllActiveAdmins({
    type: NOTIFICATION_TYPES.PAYMENT,
    title: 'Payment failure',
    message: `Payment failed for order ${orderNumber}.`,
    orderId,
    link: `/admin/orders?focus=${orderId}`,
    eventKeyPrefix: `order:${orderId}:payment:failed`,
    metadata: { orderNumber },
  });

  const user = await loadUser(userId);
  if (user?.email && user.notificationPreferences?.orderEmails !== false) {
    await safeEmail(() =>
      sendPaymentStatusEmail({
        to: user.email,
        name: user.name,
        orderNumber,
        success: false,
        orderUrl: `${env.clientUrl}/orders/${orderId}`,
      }),
    );
  }
};

export const notifyRefundProcessed = async (order) => {
  const userId = order.user?._id || order.user;
  const orderId = order._id || order.id;
  const orderNumber = order.orderNumber;

  await createNotificationSafe({
    audience: NOTIFICATION_AUDIENCE.USER,
    userId,
    type: NOTIFICATION_TYPES.PAYMENT,
    title: 'Refund processed',
    message: `A refund was recorded for order ${orderNumber}.`,
    orderId,
    link: `/orders/${orderId}`,
    eventKey: `user:${userId}:order:${orderId}:payment:refunded`,
    metadata: { orderNumber, paymentStatus: 'refunded' },
  });

  await notifyAllActiveAdmins({
    type: NOTIFICATION_TYPES.PAYMENT,
    title: 'Refund recorded',
    message: `Refund recorded for order ${orderNumber}.`,
    orderId,
    link: `/admin/orders?focus=${orderId}`,
    eventKeyPrefix: `order:${orderId}:refunded`,
    metadata: { orderNumber },
  });
};

export const notifyReviewSubmitted = async ({ userId, pizzaId, reviewId, pizzaName }) => {
  await createNotificationSafe({
    audience: NOTIFICATION_AUDIENCE.USER,
    userId,
    type: NOTIFICATION_TYPES.REVIEW,
    title: 'Review submitted',
    message: pizzaName
      ? `Your review for ${pizzaName} was submitted.`
      : 'Your review was submitted successfully.',
    link: pizzaId ? `/menu/${pizzaId}` : null,
    eventKey: `user:${userId}:review:${reviewId}:submitted`,
    metadata: { pizzaId: pizzaId?.toString?.() || pizzaId, reviewId },
  });

  await notifyAllActiveAdmins({
    type: NOTIFICATION_TYPES.REVIEW,
    title: 'New review',
    message: pizzaName
      ? `New review submitted for ${pizzaName}.`
      : 'A customer submitted a new review.',
    link: '/admin/reviews',
    eventKeyPrefix: `review:${reviewId}:new`,
    metadata: { pizzaId: pizzaId?.toString?.() || pizzaId, reviewId },
  });

  const user = await loadUser(userId);
  if (user?.email && user.notificationPreferences?.reviewEmails) {
    await safeEmail(() =>
      sendReviewSubmittedEmail({
        to: user.email,
        name: user.name,
        pizzaName: pizzaName || 'your pizza',
      }),
    );
  }
};

export const notifyNewCustomerRegistered = async (user) => {
  await notifyAllActiveAdmins({
    type: NOTIFICATION_TYPES.SYSTEM,
    title: 'New customer',
    message: `${user.name || 'A customer'} registered (${user.email}).`,
    link: '/admin/users',
    eventKeyPrefix: `user:${user._id}:registered`,
    metadata: { userId: user._id.toString(), email: user.email },
  });
};

export const notifyLowStockDigest = async ({ count, outOfStock, lowStock }) => {
  await notifyAllActiveAdmins({
    type: NOTIFICATION_TYPES.INVENTORY,
    title: 'Low inventory alert',
    message: `Inventory alert: ${outOfStock} out of stock, ${lowStock} low (${count} items).`,
    link: '/admin/inventory',
    eventKeyPrefix: `inventory:lowstock:${new Date().toISOString().slice(0, 13)}`,
    metadata: { count, outOfStock, lowStock },
  });
};
