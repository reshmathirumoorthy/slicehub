import api from './api';
import { resolveMediaUrl } from '../utils/media';

export const mapPizza = (pizza) => {
  const category = pizza.category;
  return {
    id: pizza._id || pizza.id,
    name: pizza.name,
    slug: pizza.slug,
    description: pizza.description,
    categoryId:
      typeof category === 'object' ? category?._id || category?.id : category,
    categoryName: typeof category === 'object' ? category?.name : undefined,
    image: resolveMediaUrl(pizza.image),
    basePrice: pizza.basePrice,
    sizes: pizza.sizes || [],
    availableBases: pizza.availableBases || [],
    availableSauces: pizza.availableSauces || [],
    availableCheeses: pizza.availableCheeses || [],
    availableVegetables: pizza.availableVegetables || [],
    extraCheesePrice: pizza.extraCheesePrice ?? 0,
    isVegetarian: Boolean(pizza.isVegetarian),
    isAvailable: pizza.isAvailable !== false,
    rating: pizza.averageRating ?? pizza.rating ?? 0,
    reviewCount: pizza.reviewCount ?? 0,
    createdAt: pizza.createdAt,
  };
};

export const getPizzas = async (params = {}) => {
  const { data } = await api.get('/pizzas', { params });
  return {
    pizzas: (data.data?.pizzas || []).map(mapPizza),
    pagination: data.data?.pagination || {
      page: 1,
      limit: 12,
      total: 0,
      totalPages: 1,
      hasNextPage: false,
      hasPrevPage: false,
    },
  };
};

export const getPizzaById = async (id) => {
  const { data } = await api.get(`/pizzas/${id}`);
  return mapPizza(data.data.pizza);
};

export const createPizza = async (payload) => {
  const formData = toPizzaFormData(payload);
  const { data } = await api.post('/pizzas', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return mapPizza(data.data.pizza);
};

export const updatePizza = async (id, payload) => {
  const formData = toPizzaFormData(payload);
  const { data } = await api.put(`/pizzas/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return mapPizza(data.data.pizza);
};

export const deletePizza = async (id) => {
  const { data } = await api.delete(`/pizzas/${id}`);
  return data;
};

const toPizzaFormData = (payload = {}) => {
  const formData = new FormData();
  Object.entries(payload).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    if (key === 'image' && value instanceof File) {
      formData.append('image', value);
      return;
    }
    if (
      [
        'sizes',
        'availableBases',
        'availableSauces',
        'availableCheeses',
        'availableVegetables',
      ].includes(key)
    ) {
      formData.append(key, JSON.stringify(value));
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
