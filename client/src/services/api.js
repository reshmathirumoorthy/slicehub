import axios from 'axios';

const ADMIN_TOKEN_KEY = 'slicehub_admin_token';
const USER_TOKEN_KEY = 'slicehub_token';

/**
 * Shared Axios instance for all HTTP calls.
 */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
  timeout: 15000,
});

const prefersAdminToken = (url = '') => {
  const path = String(url);
  return (
    path.includes('/admin/') ||
    path.startsWith('admin/') ||
    // Admin pizza/category mutations share public paths but need admin JWT
    /\/(pizzas|categories)(\/|$)/.test(path)
  );
};

api.interceptors.request.use((config) => {
  const adminToken = localStorage.getItem(ADMIN_TOKEN_KEY);
  const userToken = localStorage.getItem(USER_TOKEN_KEY);
  const url = `${config.baseURL || ''}${config.url || ''}`;

  let token = null;
  if (prefersAdminToken(url) || prefersAdminToken(config.url || '')) {
    token = adminToken || userToken;
  } else {
    token = userToken || adminToken;
  }

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  if (config.data instanceof FormData) {
    delete config.headers['Content-Type'];
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(error),
);

export const setAdminToken = (token) => {
  if (token) localStorage.setItem(ADMIN_TOKEN_KEY, token);
  else localStorage.removeItem(ADMIN_TOKEN_KEY);
};

export const getAdminToken = () => localStorage.getItem(ADMIN_TOKEN_KEY);

export const clearAdminToken = () => localStorage.removeItem(ADMIN_TOKEN_KEY);

export const setUserToken = (token) => {
  if (token) localStorage.setItem(USER_TOKEN_KEY, token);
  else localStorage.removeItem(USER_TOKEN_KEY);
};

export const getUserToken = () => localStorage.getItem(USER_TOKEN_KEY);

export const clearUserToken = () => localStorage.removeItem(USER_TOKEN_KEY);

export default api;
