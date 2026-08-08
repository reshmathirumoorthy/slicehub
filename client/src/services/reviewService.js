import api from './api';

export const fetchPizzaReviews = async (pizzaId, params = {}) => {
  const { data } = await api.get(`/reviews/pizza/${pizzaId}`, { params });
  return data.data;
};

export const fetchReviewEligibility = async (pizzaId) => {
  const { data } = await api.get(`/reviews/pizza/${pizzaId}/eligibility`);
  return data.data.eligibility;
};

export const createReview = async (payload) => {
  const { data } = await api.post('/reviews', payload);
  return data.data.review;
};

export const updateReview = async (id, payload) => {
  const { data } = await api.patch(`/reviews/${id}`, payload);
  return data.data.review;
};

export const deleteReview = async (id) => {
  const { data } = await api.delete(`/reviews/${id}`);
  return data.data;
};

export const fetchAdminReviews = async (params = {}) => {
  const { data } = await api.get('/admin/reviews', { params });
  return data.data;
};

export const setAdminReviewVisibility = async (id, isVisible) => {
  const { data } = await api.patch(`/admin/reviews/${id}/visibility`, {
    isVisible,
  });
  return data.data.review;
};
