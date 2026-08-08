import api from './api';

export const fetchMe = async () => {
  const { data } = await api.get('/auth/me');
  return data.data.user;
};

export const updateMe = async (payload) => {
  const { data } = await api.patch('/auth/me', payload);
  return data.data.user;
};
