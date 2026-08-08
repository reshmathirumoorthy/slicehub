/**
 * Shared enum constants for SliceHub database schemas.
 * Keep domain vocabulary centralized so models stay consistent.
 */

export const AUTH_ACCOUNT_TYPES = Object.freeze({
  USER: 'user',
  ADMIN: 'admin',
});

export const USER_ROLES = Object.freeze({
  CUSTOMER: 'customer',
});

export const ADMIN_ROLES = Object.freeze({
  SUPER_ADMIN: 'super_admin',
  MANAGER: 'manager',
  SUPPORT: 'support',
});

export const ADDRESS_LABELS = Object.freeze({
  HOME: 'home',
  WORK: 'work',
  OTHER: 'other',
});

export const PIZZA_SIZES = Object.freeze({
  SMALL: 'small',
  MEDIUM: 'medium',
  LARGE: 'large',
});

export const PIZZA_BASES = Object.freeze({
  THIN: 'thin_crust',
  THICK: 'thick_crust',
  CHEESE_BURST: 'cheese_burst',
  WHOLE_WHEAT: 'whole_wheat',
  GLUTEN_FREE: 'gluten_free',
});

export const PIZZA_SAUCES = Object.freeze({
  TOMATO: 'tomato',
  BBQ: 'bbq',
  PESTO: 'pesto',
  WHITE: 'white_sauce',
  SPICY: 'spicy_marinara',
});

export const PIZZA_CHEESES = Object.freeze({
  MOZZARELLA: 'mozzarella',
  CHEDDAR: 'cheddar',
  PARMESAN: 'parmesan',
  VEGAN: 'vegan_cheese',
  MIXED: 'mixed_cheese',
});

export const PIZZA_VEGETABLES = Object.freeze({
  ONION: 'onion',
  CAPSICUM: 'capsicum',
  MUSHROOM: 'mushroom',
  OLIVES: 'olives',
  CORN: 'corn',
  TOMATO: 'tomato',
  JALAPENO: 'jalapeno',
  SPINACH: 'spinach',
});

export const INVENTORY_UNITS = Object.freeze({
  GRAM: 'g',
  KILOGRAM: 'kg',
  MILLILITER: 'ml',
  LITER: 'l',
  PIECE: 'pcs',
  PACK: 'pack',
});

export const INVENTORY_CATEGORIES = Object.freeze({
  BASE: 'base',
  SAUCE: 'sauce',
  CHEESE: 'cheese',
  VEGETABLE: 'vegetable',
});

export const INVENTORY_STOCK_STATUS = Object.freeze({
  IN_STOCK: 'in_stock',
  LOW_STOCK: 'low_stock',
  OUT_OF_STOCK: 'out_of_stock',
});

export const COUPON_TYPES = Object.freeze({
  PERCENTAGE: 'percentage',
  FIXED: 'fixed',
});

export const ORDER_STATUS = Object.freeze({
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  PREPARING: 'preparing',
  BAKING: 'baking',
  OUT_FOR_DELIVERY: 'out_for_delivery',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
});

export const PAYMENT_METHODS = Object.freeze({
  COD: 'cod',
  CARD: 'card',
  UPI: 'upi',
  NET_BANKING: 'net_banking',
  WALLET: 'wallet',
  RAZORPAY: 'razorpay',
});

export const PAYMENT_STATUS = Object.freeze({
  CREATED: 'created',
  PENDING: 'pending',
  PAID: 'paid',
  FAILED: 'failed',
  REFUNDED: 'refunded',
});

/** Online methods that require Razorpay verification before marking paid */
export const ONLINE_PAYMENT_METHODS = Object.freeze([
  PAYMENT_METHODS.CARD,
  PAYMENT_METHODS.UPI,
  PAYMENT_METHODS.NET_BANKING,
  PAYMENT_METHODS.WALLET,
  PAYMENT_METHODS.RAZORPAY,
]);

export const NOTIFICATION_TYPES = Object.freeze({
  ORDER: 'order',
  PAYMENT: 'payment',
  PROMO: 'promo',
  SYSTEM: 'system',
  REVIEW: 'review',
  INVENTORY: 'inventory',
});

export const NOTIFICATION_AUDIENCE = Object.freeze({
  USER: 'user',
  ADMIN: 'admin',
});

/** Retention for in-app notifications (days) */
export const NOTIFICATION_RETENTION_DAYS = 90;
