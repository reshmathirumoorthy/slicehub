const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

/**
 * Resolves uploaded or absolute image URLs for display.
 */
export const resolveMediaUrl = (path) => {
  if (!path) {
    return 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=1200&q=80';
  }
  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  try {
    const apiUrl = new URL(API_BASE, window.location.origin);
    return `${apiUrl.origin}${path.startsWith('/') ? path : `/${path}`}`;
  } catch {
    return path;
  }
};

export const formatPrice = (amount) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(amount) || 0);

export const formatLabel = (value = '') =>
  String(value)
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

export const formatStatus = (status) => formatLabel(status);

export const ORDER_STATUS_TONE = {
  pending: 'muted',
  confirmed: 'muted',
  preparing: 'gold',
  baking: 'ember',
  out_for_delivery: 'ember',
  delivered: 'success',
  cancelled: 'danger',
};

export const ORDER_STATUSES = [
  'pending',
  'confirmed',
  'preparing',
  'baking',
  'out_for_delivery',
  'delivered',
  'cancelled',
];
