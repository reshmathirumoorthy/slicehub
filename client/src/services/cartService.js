import api from './api';

const GUEST_KEY = 'slicehub_guest_id';

export const getGuestId = () => {
  let id = localStorage.getItem(GUEST_KEY);
  if (!id) {
    id =
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `guest-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    localStorage.setItem(GUEST_KEY, id);
  }
  return id;
};

export const clearGuestId = () => localStorage.removeItem(GUEST_KEY);

const withGuestHeader = (config = {}) => ({
  ...config,
  headers: {
    ...(config.headers || {}),
    'X-Guest-Id': getGuestId(),
  },
});

export const fetchCart = async () => {
  const { data } = await api.get('/cart', withGuestHeader());
  return data.data.cart;
};

export const addToCartApi = async (payload) => {
  // Never send client prices
  const body = {
    pizzaId: payload.pizzaId || undefined,
    name: payload.name,
    size: payload.size,
    base: payload.base,
    sauce: payload.sauce,
    cheese: payload.cheese,
    vegetables: payload.vegetables || [],
    extraCheese: Boolean(payload.extraCheese),
    quantity: payload.quantity || 1,
  };
  const { data } = await api.post('/cart', body, withGuestHeader());
  return data.data.cart;
};

export const updateCartItemApi = async (itemId, quantity) => {
  const { data } = await api.patch(
    `/cart/${itemId}`,
    { quantity },
    withGuestHeader(),
  );
  return data.data.cart;
};

export const removeCartItemApi = async (itemId) => {
  const { data } = await api.delete(`/cart/${itemId}`, withGuestHeader());
  return data.data.cart;
};

export const clearCartApi = async () => {
  const { data } = await api.delete('/cart', withGuestHeader());
  return data.data.cart;
};

export const applyCouponApi = async (code) => {
  const { data } = await api.post('/cart/coupon', { code }, withGuestHeader());
  return data.data.cart;
};

export const removeCouponApi = async () => {
  const { data } = await api.delete('/cart/coupon', withGuestHeader());
  return data.data.cart;
};

export const mergeCartApi = async () => {
  const { data } = await api.post(
    '/cart/merge',
    { guestId: getGuestId() },
    withGuestHeader(),
  );
  return data.data.cart;
};
