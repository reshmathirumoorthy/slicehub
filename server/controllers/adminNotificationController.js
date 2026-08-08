import asyncHandler from '../utils/asyncHandler.js';
import * as notificationService from '../services/notificationService.js';

export const listNotifications = asyncHandler(async (req, res) => {
  let isRead;
  if (req.query.isRead === 'true') isRead = true;
  if (req.query.isRead === 'false') isRead = false;

  const data = await notificationService.listAdminNotifications(req.admin._id, {
    page: Number(req.query.page) || 1,
    limit: Number(req.query.limit) || 20,
    isRead,
  });
  res.status(200).json({ success: true, data });
});

export const getUnreadCount = asyncHandler(async (req, res) => {
  const unreadCount = await notificationService.getAdminUnreadCount(
    req.admin._id,
  );
  res.status(200).json({ success: true, data: { unreadCount } });
});

export const markRead = asyncHandler(async (req, res) => {
  const notification = await notificationService.markAdminNotificationRead(
    req.admin._id,
    req.params.id,
  );
  res.status(200).json({ success: true, data: { notification } });
});

export const markAllRead = asyncHandler(async (req, res) => {
  const result = await notificationService.markAllAdminNotificationsRead(
    req.admin._id,
  );
  res.status(200).json({ success: true, data: result });
});

export const remove = asyncHandler(async (req, res) => {
  await notificationService.deleteAdminNotification(
    req.admin._id,
    req.params.id,
  );
  res.status(200).json({ success: true, data: { deleted: true } });
});
