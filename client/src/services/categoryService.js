import api from './api';
import { resolveMediaUrl } from '../utils/media';

export const mapCategory = (category) => ({
  id: category._id || category.id,
  name: category.name,
  slug: category.slug,
  description: category.description || '',
  image: resolveMediaUrl(category.image),
  sortOrder: category.sortOrder ?? 0,
  isActive: category.isActive !== false,
});

export const getCategories = async (params = {}) => {
  const { data } = await api.get('/categories', {
    params: {
      ...params,
      includeInactive:
        params.includeInactive === true || params.includeInactive === 'true'
          ? 'true'
          : undefined,
    },
  });
  return (data.data?.categories || []).map(mapCategory);
};

export const getCategoryById = async (id) => {
  const { data } = await api.get(`/categories/${id}`);
  return mapCategory(data.data.category);
};

export const createCategory = async (payload) => {
  const formData = toFormData(payload);
  const { data } = await api.post('/categories', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return mapCategory(data.data.category);
};

export const updateCategory = async (id, payload) => {
  const formData = toFormData(payload);
  const { data } = await api.put(`/categories/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return mapCategory(data.data.category);
};

export const deleteCategory = async (id) => {
  const { data } = await api.delete(`/categories/${id}`);
  return data;
};

const toFormData = (payload = {}) => {
  const formData = new FormData();
  Object.entries(payload).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    if (key === 'image' && value instanceof File) {
      formData.append('image', value);
      return;
    }
    if (typeof value === 'boolean' || typeof value === 'number') {
      formData.append(key, String(value));
      return;
    }
    formData.append(key, value);
  });
  return formData;
};
