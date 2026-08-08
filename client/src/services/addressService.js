import api from './api';

export const fetchAddresses = async () => {
  const { data } = await api.get('/addresses');
  return data.data.addresses;
};

export const createAddress = async (payload) => {
  const { data } = await api.post('/addresses', payload);
  return data.data.address;
};

export const updateAddress = async (id, payload) => {
  const { data } = await api.patch(`/addresses/${id}`, payload);
  return data.data.address;
};

export const deleteAddress = async (id) => {
  await api.delete(`/addresses/${id}`);
};

export const setDefaultAddress = async (id) => {
  const { data } = await api.patch(`/addresses/${id}/default`);
  return data.data.address;
};
