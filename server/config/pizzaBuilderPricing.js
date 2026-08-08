/**
 * Authoritative pizza-builder pricing catalog.
 * Frontend estimates must never be trusted for checkout.
 */

export const BUILDER_SIZES = Object.freeze({
  small: { label: 'Small', scale: 0.85, multiplier: 0.85 },
  medium: { label: 'Medium', scale: 1, multiplier: 1 },
  large: { label: 'Large', scale: 1.18, multiplier: 1.25 },
});

export const BUILDER_BASES = Object.freeze({
  thin_crust: { label: 'Thin Crust', price: 0 },
  hand_tossed: { label: 'Hand Tossed', price: 20 },
  cheese_burst: { label: 'Cheese Burst', price: 60 },
  stuffed_crust: { label: 'Stuffed Crust', price: 70 },
  whole_wheat: { label: 'Whole Wheat', price: 30 },
});

export const BUILDER_SAUCES = Object.freeze({
  tomato: { label: 'Tomato', price: 0, color: '#c23b22' },
  bbq: { label: 'BBQ', price: 15, color: '#5c2210' },
  garlic: { label: 'Garlic', price: 15, color: '#f5e6c8' },
  pesto: { label: 'Pesto', price: 25, color: '#3f7d3a' },
  spicy: { label: 'Spicy', price: 20, color: '#a11d1d' },
});

export const BUILDER_CHEESES = Object.freeze({
  mozzarella: { label: 'Mozzarella', price: 0, color: '#fff4d6' },
  cheddar: { label: 'Cheddar', price: 20, color: '#f0b429' },
  parmesan: { label: 'Parmesan', price: 25, color: '#f7e7b0' },
  mixed_cheese: { label: 'Mixed Cheese', price: 30, color: '#ffe8a3' },
});

export const BUILDER_VEGETABLES = Object.freeze({
  onion: { label: 'Onion', price: 25, color: '#d9b3e6' },
  capsicum: { label: 'Capsicum', price: 30, color: '#3fbf5a' },
  tomato: { label: 'Tomato', price: 25, color: '#e23d28' },
  corn: { label: 'Corn', price: 25, color: '#f5d76e' },
  mushroom: { label: 'Mushroom', price: 35, color: '#c4b7a6' },
  olives: { label: 'Olives', price: 35, color: '#1f1a17' },
  paneer: { label: 'Paneer', price: 45, color: '#fff8e7' },
  jalapeno: { label: 'Jalapeno', price: 30, color: '#2f8f3a' },
});

export const BUILDER_BASE_PRICE = 199;
export const BUILDER_EXTRA_CHEESE_PRICE = 50;
export const BUILDER_MAX_QTY = 10;
export const BUILDER_MAX_VEGETABLES = 8;
