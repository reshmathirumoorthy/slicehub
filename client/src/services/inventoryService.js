import api from './api';

export const fetchInventory = async (params = {}) => {
  const { data } = await api.get('/admin/inventory', { params });
  return data.data;
};

export const fetchLowStock = async () => {
  const { data } = await api.get('/admin/inventory/low-stock');
  return data.data.items;
};

export const fetchOutOfStock = async () => {
  const { data } = await api.get('/admin/inventory/out-of-stock');
  return data.data.items;
};

export const updateInventoryItem = async (id, payload) => {
  const { data } = await api.patch(`/admin/inventory/${id}`, payload);
  return data.data.item;
};

export const addStock = async (id, quantity) => {
  const { data } = await api.post(`/admin/inventory/${id}/add-stock`, {
    quantity,
  });
  return data.data.item;
};

export const adjustStock = async (id, delta) => {
  const { data } = await api.post(`/admin/inventory/${id}/adjust`, { delta });
  return data.data.item;
};

export const setThreshold = async (id, minimumThreshold) => {
  const { data } = await api.patch(`/admin/inventory/${id}/threshold`, {
    minimumThreshold,
  });
  return data.data.item;
};

export const triggerInventoryAlerts = async () => {
  const { data } = await api.post('/admin/inventory/check-alerts');
  return data.data;
};
