import asyncHandler from '../utils/asyncHandler.js';
import * as notificationService from '../services/notificationService.js';

export const listMyNotifications = asyncHandler(async (req, res) => {
  let isRead;
  if (req.query.isRead === 'true') isRead = true;
  if (req.query.isRead === 'false') isRead = false;

  const data = await notificationService.listUserNotifications(req.user._id, {
    page: Number(req.query.page) || 1,
    limit: Number(req.query.limit) || 20,
    isRead,
  });
  res.status(200).json({ success: true, data });
});

export const getUnreadCount = asyncHandler(async (req, res) => {
  const unreadCount = await notificationService.getUserUnreadCount(req.user._id);
  res.status(200).json({ success: true, data: { unreadCount } });
});

export const markRead = asyncHandler(async (req, res) => {
  const notification = await notificationService.markUserNotificationRead(
    req.user._id,
    req.params.id,
  );
  res.status(200).json({ success: true, data: { notification } });
});

export const markAllRead = asyncHandler(async (req, res) => {
  const result = await notificationService.markAllUserNotificationsRead(
    req.user._id,
  );
  res.status(200).json({ success: true, data: result });
});

export const remove = asyncHandler(async (req, res) => {
  await notificationService.deleteUserNotification(req.user._id, req.params.id);
  res.status(200).json({ success: true, data: { deleted: true } });
});

export const getPreferences = asyncHandler(async (req, res) => {
  const preferences = await notificationService.getUserNotificationPreferences(
    req.user._id,
  );
  res.status(200).json({ success: true, data: { preferences } });
});

export const updatePreferences = asyncHandler(async (req, res) => {
  const preferences =
    await notificationService.updateUserNotificationPreferences(req.user._id, {
      orderEmails: req.body.orderEmails,
      reviewEmails: req.body.reviewEmails,
      promoEmails: req.body.promoEmails,
    });
  res.status(200).json({
    success: true,
    message: 'Preferences updated',
    data: { preferences },
  });
});
