import api from './api';

export const placeOrder = async ({
  addressId,
  paymentMethod,
  notes,
  clientTotal,
}) => {
  const { data } = await api.post('/orders', {
    addressId,
    paymentMethod,
    notes,
    // Sent only so server can detect manipulation; never used for charging
    total: clientTotal,
  });
  return data.data.order;
};

export const fetchMyOrders = async (params = {}) => {
  const { data } = await api.get('/orders/my', { params });
  return data.data;
};

export const fetchMyOrder = async (id) => {
  const { data } = await api.get(`/orders/${id}`);
  return data.data.order;
};

export const cancelMyOrder = async (id, reason) => {
  const { data } = await api.patch(`/orders/${id}/cancel`, { reason });
  return data.data.order;
};

export const fetchAdminOrders = async (params = {}) => {
  const { data } = await api.get('/admin/orders', { params });
  return data.data;
};

export const fetchAdminOrder = async (id) => {
  const { data } = await api.get(`/admin/orders/${id}`);
  return data.data.order;
};

export const updateAdminOrderStatus = async (id, status) => {
  const { data } = await api.patch(`/admin/orders/${id}/status`, { status });
  return data.data.order;
};
