import Notification from '../models/Notification.js';
import Admin from '../models/Admin.js';
import User from '../models/User.js';
import ApiError from '../utils/ApiError.js';
import { assertValidObjectId } from '../utils/menuValidation.js';
import {
  NOTIFICATION_AUDIENCE,
  NOTIFICATION_RETENTION_DAYS,
  NOTIFICATION_TYPES,
} from '../models/constants.js';

const serializeNotification = (doc) => ({
  id: doc._id.toString(),
  audience: doc.audience,
  type: doc.type,
  title: doc.title,
  message: doc.message,
  orderId: doc.order ? doc.order.toString() : null,
  link: doc.link || null,
  metadata: doc.metadata || null,
  isRead: Boolean(doc.isRead),
  readAt: doc.readAt,
  createdAt: doc.createdAt,
  updatedAt: doc.updatedAt,
});

/**
 * Idempotent create. Duplicate eventKey returns existing row (no throw).
 */
export const createNotification = async ({
  audience,
  userId = null,
  adminId = null,
  type,
  title,
  message,
  orderId = null,
  link = null,
  metadata = null,
  eventKey = null,
}) => {
  if (!Object.values(NOTIFICATION_AUDIENCE).includes(audience)) {
    throw new ApiError(400, 'Invalid notification audience');
  }
  if (!Object.values(NOTIFICATION_TYPES).includes(type)) {
    throw new ApiError(400, 'Invalid notification type');
  }

  const payload = {
    audience,
    user: audience === NOTIFICATION_AUDIENCE.USER ? userId : null,
    admin: audience === NOTIFICATION_AUDIENCE.ADMIN ? adminId : null,
    type,
    title: String(title || '').trim().slice(0, 120),
    message: String(message || '').trim().slice(0, 1000),
    order: orderId || null,
    link: link ? String(link).trim().slice(0, 300) : null,
    metadata: metadata || null,
    eventKey: eventKey ? String(eventKey).trim().slice(0, 200) : null,
  };

  if (!payload.title || !payload.message) {
    throw new ApiError(400, 'Notification title and message are required');
  }

  try {
    const created = await Notification.create(payload);
    return { notification: serializeNotification(created), created: true };
  } catch (err) {
    if (err?.code === 11000 && payload.eventKey) {
      const existing = await Notification.findOne({
        eventKey: payload.eventKey,
      }).lean();
      if (existing) {
        return {
          notification: serializeNotification(existing),
          created: false,
        };
      }
    }
    throw err;
  }
};

/**
 * Never throws — safe to call from business flows.
 */
export const createNotificationSafe = async (input) => {
  try {
    return await createNotification(input);
  } catch (error) {
    console.error('[notification] create failed:', error.message);
    return { notification: null, created: false, error: error.message };
  }
};

export const notifyAllActiveAdmins = async ({
  type,
  title,
  message,
  orderId = null,
  link = null,
  metadata = null,
  eventKeyPrefix,
}) => {
  const admins = await Admin.find({ isActive: true }).select('_id').lean();
  const results = [];
  for (const admin of admins) {
    const eventKey = eventKeyPrefix
      ? `${eventKeyPrefix}:admin:${admin._id}`
      : null;
    const result = await createNotificationSafe({
      audience: NOTIFICATION_AUDIENCE.ADMIN,
      adminId: admin._id,
      type,
      title,
      message,
      orderId,
      link,
      metadata,
      eventKey,
    });
    results.push(result);
  }
  return results;
};

export const listUserNotifications = async (
  userId,
  { page = 1, limit = 20, isRead } = {},
) => {
  const filter = {
    audience: NOTIFICATION_AUDIENCE.USER,
    user: userId,
  };
  if (typeof isRead === 'boolean') filter.isRead = isRead;

  const pageNum = Math.max(1, Number(page) || 1);
  const limitNum = Math.min(50, Math.max(1, Number(limit) || 20));
  const skip = (pageNum - 1) * limitNum;

  const [items, total, unreadCount] = await Promise.all([
    Notification.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean(),
    Notification.countDocuments(filter),
    Notification.countDocuments({
      audience: NOTIFICATION_AUDIENCE.USER,
      user: userId,
      isRead: false,
    }),
  ]);

  return {
    notifications: items.map(serializeNotification),
    unreadCount,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      pages: Math.ceil(total / limitNum) || 1,
    },
  };
};

export const listAdminNotifications = async (
  adminId,
  { page = 1, limit = 20, isRead } = {},
) => {
  const filter = {
    audience: NOTIFICATION_AUDIENCE.ADMIN,
    admin: adminId,
  };
  if (typeof isRead === 'boolean') filter.isRead = isRead;

  const pageNum = Math.max(1, Number(page) || 1);
  const limitNum = Math.min(50, Math.max(1, Number(limit) || 20));
  const skip = (pageNum - 1) * limitNum;

  const [items, total, unreadCount] = await Promise.all([
    Notification.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean(),
    Notification.countDocuments(filter),
    Notification.countDocuments({
      audience: NOTIFICATION_AUDIENCE.ADMIN,
      admin: adminId,
      isRead: false,
    }),
  ]);

  return {
    notifications: items.map(serializeNotification),
    unreadCount,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      pages: Math.ceil(total / limitNum) || 1,
    },
  };
};

export const getUserUnreadCount = async (userId) =>
  Notification.countDocuments({
    audience: NOTIFICATION_AUDIENCE.USER,
    user: userId,
    isRead: false,
  });

export const getAdminUnreadCount = async (adminId) =>
  Notification.countDocuments({
    audience: NOTIFICATION_AUDIENCE.ADMIN,
    admin: adminId,
    isRead: false,
  });

export const markUserNotificationRead = async (userId, notificationId) => {
  assertValidObjectId(notificationId, 'notification ID');
  const doc = await Notification.findOneAndUpdate(
    {
      _id: notificationId,
      audience: NOTIFICATION_AUDIENCE.USER,
      user: userId,
    },
    { isRead: true, readAt: new Date() },
    { new: true },
  );
  if (!doc) throw new ApiError(404, 'Notification not found');
  return serializeNotification(doc);
};

export const markAdminNotificationRead = async (adminId, notificationId) => {
  assertValidObjectId(notificationId, 'notification ID');
  const doc = await Notification.findOneAndUpdate(
    {
      _id: notificationId,
      audience: NOTIFICATION_AUDIENCE.ADMIN,
      admin: adminId,
    },
    { isRead: true, readAt: new Date() },
    { new: true },
  );
  if (!doc) throw new ApiError(404, 'Notification not found');
  return serializeNotification(doc);
};

export const markAllUserNotificationsRead = async (userId) => {
  const result = await Notification.updateMany(
    {
      audience: NOTIFICATION_AUDIENCE.USER,
      user: userId,
      isRead: false,
    },
    { isRead: true, readAt: new Date() },
  );
  return { modified: result.modifiedCount || 0 };
};

export const markAllAdminNotificationsRead = async (adminId) => {
  const result = await Notification.updateMany(
    {
      audience: NOTIFICATION_AUDIENCE.ADMIN,
      admin: adminId,
      isRead: false,
    },
    { isRead: true, readAt: new Date() },
  );
  return { modified: result.modifiedCount || 0 };
};

export const deleteUserNotification = async (userId, notificationId) => {
  assertValidObjectId(notificationId, 'notification ID');
  const doc = await Notification.findOneAndDelete({
    _id: notificationId,
    audience: NOTIFICATION_AUDIENCE.USER,
    user: userId,
  });
  if (!doc) throw new ApiError(404, 'Notification not found');
  return { deleted: true };
};

export const deleteAdminNotification = async (adminId, notificationId) => {
  assertValidObjectId(notificationId, 'notification ID');
  const doc = await Notification.findOneAndDelete({
    _id: notificationId,
    audience: NOTIFICATION_AUDIENCE.ADMIN,
    admin: adminId,
  });
  if (!doc) throw new ApiError(404, 'Notification not found');
  return { deleted: true };
};

export const getUserNotificationPreferences = async (userId) => {
  const user = await User.findById(userId)
    .select('notificationPreferences')
    .lean();
  if (!user) throw new ApiError(404, 'User not found');
  return {
    orderEmails: user.notificationPreferences?.orderEmails !== false,
    reviewEmails: Boolean(user.notificationPreferences?.reviewEmails),
    promoEmails: Boolean(user.notificationPreferences?.promoEmails),
  };
};

export const updateUserNotificationPreferences = async (userId, prefs = {}) => {
  const user = await User.findById(userId);
  if (!user) throw new ApiError(404, 'User not found');

  user.notificationPreferences = user.notificationPreferences || {};
  if (typeof prefs.orderEmails === 'boolean') {
    user.notificationPreferences.orderEmails = prefs.orderEmails;
  }
  if (typeof prefs.reviewEmails === 'boolean') {
    user.notificationPreferences.reviewEmails = prefs.reviewEmails;
  }
  if (typeof prefs.promoEmails === 'boolean') {
    user.notificationPreferences.promoEmails = prefs.promoEmails;
  }
  await user.save();
  return getUserNotificationPreferences(userId);
};

/**
 * Delete in-app notifications older than retention window.
 * Does not touch orders/payments.
 */
export const cleanupOldNotifications = async (
  days = NOTIFICATION_RETENTION_DAYS,
) => {
  const cutoff = new Date(Date.now() - Number(days) * 24 * 60 * 60 * 1000);
  const result = await Notification.deleteMany({
    createdAt: { $lt: cutoff },
  });
  return { deleted: result.deletedCount || 0, cutoff };
};
