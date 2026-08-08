/**
 * Shared visual tokens for the procedural 3D pizza.
 * No business/API logic here.
 */

export const SIZE_SCALE = {
  small: 0.85,
  medium: 1,
  large: 1.18,
};

export const BASE_STYLE = {
  thin_crust: { height: 0.08, color: '#c9844a', rim: '#a86a35' },
  hand_tossed: { height: 0.12, color: '#d09255', rim: '#b0753d' },
  cheese_burst: { height: 0.14, color: '#d9a066', rim: '#e8c27a' },
  stuffed_crust: { height: 0.16, color: '#c8894d', rim: '#f0d090' },
  whole_wheat: { height: 0.11, color: '#9a6b3c', rim: '#7d542e' },
};

export const SAUCE_COLOR = {
  tomato: '#c23b22',
  bbq: '#5c2210',
  garlic: '#f5e6c8',
  pesto: '#3f7d3a',
  spicy: '#a11d1d',
};

export const CHEESE_COLOR = {
  mozzarella: '#fff4d6',
  cheddar: '#f0b429',
  parmesan: '#f7e7b0',
  mixed_cheese: '#ffe8a3',
};

export const TOPPING_COLOR = {
  onion: '#d9b3e6',
  capsicum: '#3fbf5a',
  tomato: '#e23d28',
  corn: '#f5d76e',
  mushroom: '#c4b7a6',
  olives: '#1f1a17',
  paneer: '#fff8e7',
  jalapeno: '#2f8f3a',
};

/** Deterministic pseudo-random in [0,1) from a string seed */
export const hashRandom = (seed) => {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 4294967296;
};

export const defaultCustomization = {
  size: 'medium',
  base: 'thin_crust',
  sauce: 'tomato',
  cheese: 'mozzarella',
  vegetables: [],
  extraCheese: false,
};
