import api from './api';

export const fetchNotifications = async (params = {}) => {
  const { data } = await api.get('/notifications', { params });
  return data.data;
};

export const fetchUnreadCount = async () => {
  const { data } = await api.get('/notifications/unread-count');
  return data.data.unreadCount || 0;
};

export const markNotificationRead = async (id) => {
  const { data } = await api.patch(`/notifications/${id}/read`);
  return data.data.notification;
};

export const markAllNotificationsRead = async () => {
  const { data } = await api.patch('/notifications/read-all');
  return data.data;
};

export const deleteNotification = async (id) => {
  const { data } = await api.delete(`/notifications/${id}`);
  return data.data;
};

export const fetchNotificationPreferences = async () => {
  const { data } = await api.get('/notifications/preferences');
  return data.data.preferences;
};

export const updateNotificationPreferences = async (prefs) => {
  const { data } = await api.patch('/notifications/preferences', prefs);
  return data.data.preferences;
};

export const fetchAdminNotifications = async (params = {}) => {
  const { data } = await api.get('/admin/notifications', { params });
  return data.data;
};

export const fetchAdminUnreadCount = async () => {
  const { data } = await api.get('/admin/notifications/unread-count');
  return data.data.unreadCount || 0;
};

export const markAdminNotificationRead = async (id) => {
  const { data } = await api.patch(`/admin/notifications/${id}/read`);
  return data.data.notification;
};

export const markAllAdminNotificationsRead = async () => {
  const { data } = await api.patch('/admin/notifications/read-all');
  return data.data;
};

export const deleteAdminNotification = async (id) => {
  const { data } = await api.delete(`/admin/notifications/${id}`);
  return data.data;
};
