/**
 * Cart-level fees and tax (authoritative server values).
 */
import env from './env.js';

export const CART_DELIVERY_FEE = env.cart.deliveryFee;
export const CART_FREE_DELIVERY_MIN = env.cart.freeDeliveryMin;
export const CART_TAX_RATE = env.cart.taxRate;
export const CART_CURRENCY = 'INR';
