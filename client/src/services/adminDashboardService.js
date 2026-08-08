import api from './api';

export const fetchAdminOverview = async () => {
  const { data } = await api.get('/admin/dashboard/overview');
  return data.data;
};

export const fetchAdminAnalytics = async (params = {}) => {
  const { data } = await api.get('/admin/dashboard/analytics', { params });
  return data.data;
};

export const fetchAdminUsers = async (params = {}) => {
  const { data } = await api.get('/admin/users', { params });
  return data.data;
};

export const fetchAdminUser = async (id) => {
  const { data } = await api.get(`/admin/users/${id}`);
  return data.data.user;
};

export const setAdminUserStatus = async (id, isActive) => {
  const { data } = await api.patch(`/admin/users/${id}/status`, { isActive });
  return data.data.user;
};

export const fetchAdminMe = async () => {
  const { data } = await api.get('/admin/auth/me');
  return data.data.admin || data.data.user || data.data;
};
