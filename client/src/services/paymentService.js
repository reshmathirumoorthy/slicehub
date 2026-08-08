import api from './api';

export const fetchPaymentConfig = async () => {
  const { data } = await api.get('/payments/config');
  return data.data;
};

export const createRazorpayCheckout = async (orderId) => {
  const { data } = await api.post('/payments/create-order', { orderId });
  return data.data.checkout;
};

export const verifyRazorpayPayment = async (payload) => {
  const { data } = await api.post('/payments/verify', payload);
  return data.data;
};

export const markPaymentFailed = async (orderId, reason) => {
  const { data } = await api.post('/payments/fail', { orderId, reason });
  return data.data;
};
