/**
 * Placeholder data for Phase 4 UI only.
 * No API wiring yet.
 */

export const categories = [
  { id: 'cat-1', name: 'Classic', slug: 'classic' },
  { id: 'cat-2', name: 'Veggie', slug: 'veggie' },
  { id: 'cat-3', name: 'Meat Lovers', slug: 'meat-lovers' },
  { id: 'cat-4', name: 'Premium', slug: 'premium' },
];

export const pizzas = [
  {
    id: 'pz-1',
    name: 'Margherita Ember',
    slug: 'margherita-ember',
    categoryId: 'cat-1',
    description:
      'San Marzano tomato, fior di latte, basil oil, and a blistered crust.',
    image:
      'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=1200&q=80',
    isVegetarian: true,
    rating: 4.8,
    reviewCount: 214,
    sizes: [
      { size: 'small', price: 249 },
      { size: 'medium', price: 399 },
      { size: 'large', price: 549 },
    ],
    ingredients: ['Tomato', 'Mozzarella', 'Basil', 'Olive oil'],
  },
  {
    id: 'pz-2',
    name: 'Smokehouse Pepperoni',
    slug: 'smokehouse-pepperoni',
    categoryId: 'cat-3',
    description:
      'Double pepperoni cups, smoked mozzarella, chili honey drizzle.',
    image:
      'https://images.unsplash.com/photo-1628840042765-356cda07504e?auto=format&fit=crop&w=1200&q=80',
    isVegetarian: false,
    rating: 4.9,
    reviewCount: 388,
    sizes: [
      { size: 'small', price: 299 },
      { size: 'medium', price: 449 },
      { size: 'large', price: 599 },
    ],
    ingredients: ['Pepperoni', 'Smoked mozzarella', 'Chili honey', 'Tomato'],
  },
  {
    id: 'pz-3',
    name: 'Forest Mushroom',
    slug: 'forest-mushroom',
    categoryId: 'cat-2',
    description:
      'Roasted forest mushrooms, thyme cream, garlic confit, pecorino.',
    image:
      'https://images.unsplash.com/photo-1593560708920-61dd98c46a4e?auto=format&fit=crop&w=1200&q=80',
    isVegetarian: true,
    rating: 4.6,
    reviewCount: 156,
    sizes: [
      { size: 'small', price: 279 },
      { size: 'medium', price: 429 },
      { size: 'large', price: 579 },
    ],
    ingredients: ['Mushroom', 'Thyme', 'Garlic', 'Pecorino'],
  },
  {
    id: 'pz-4',
    name: 'Truffle Midnight',
    slug: 'truffle-midnight',
    categoryId: 'cat-4',
    description:
      'Black truffle cream, wild mushrooms, aged parmesan, micro greens.',
    image:
      'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=1200&q=80',
    isVegetarian: true,
    rating: 4.9,
    reviewCount: 97,
    sizes: [
      { size: 'small', price: 449 },
      { size: 'medium', price: 649 },
      { size: 'large', price: 849 },
    ],
    ingredients: ['Truffle', 'Mushroom', 'Parmesan', 'Cream'],
  },
  {
    id: 'pz-5',
    name: 'Inferno Hot Honey',
    slug: 'inferno-hot-honey',
    categoryId: 'cat-3',
    description:
      'Spicy salami, pickled jalapeño, hot honey, and stretchy mozzarella.',
    image:
      'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=1200&q=80',
    isVegetarian: false,
    rating: 4.7,
    reviewCount: 241,
    sizes: [
      { size: 'small', price: 319 },
      { size: 'medium', price: 469 },
      { size: 'large', price: 619 },
    ],
    ingredients: ['Salami', 'Jalapeño', 'Hot honey', 'Mozzarella'],
  },
  {
    id: 'pz-6',
    name: 'Garden Caprese',
    slug: 'garden-caprese',
    categoryId: 'cat-2',
    description:
      'Heirloom tomato, burrata pockets, pesto swirl, cracked pepper.',
    image:
      'https://images.unsplash.com/photo-1571407970349-bc81e7e336d3?auto=format&fit=crop&w=1200&q=80',
    isVegetarian: true,
    rating: 4.5,
    reviewCount: 132,
    sizes: [
      { size: 'small', price: 269 },
      { size: 'medium', price: 419 },
      { size: 'large', price: 569 },
    ],
    ingredients: ['Tomato', 'Burrata', 'Pesto', 'Basil'],
  },
];

export const cartItems = [
  {
    id: 'cart-1',
    pizzaId: 'pz-2',
    name: 'Smokehouse Pepperoni',
    size: 'medium',
    quantity: 1,
    unitPrice: 449,
    image:
      'https://images.unsplash.com/photo-1628840042765-356cda07504e?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 'cart-2',
    pizzaId: 'pz-1',
    name: 'Margherita Ember',
    size: 'large',
    quantity: 2,
    unitPrice: 549,
    image:
      'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=400&q=80',
  },
];

export const orders = [
  {
    id: 'ord-1001',
    orderNumber: 'SH-24081',
    status: 'out_for_delivery',
    placedAt: '2026-08-08T10:20:00Z',
    total: 1447,
    items: [
      { name: 'Smokehouse Pepperoni', size: 'medium', quantity: 1 },
      { name: 'Margherita Ember', size: 'large', quantity: 2 },
    ],
  },
  {
    id: 'ord-1000',
    orderNumber: 'SH-24012',
    status: 'delivered',
    placedAt: '2026-08-02T19:05:00Z',
    total: 849,
    items: [{ name: 'Truffle Midnight', size: 'large', quantity: 1 }],
  },
];

export const profile = {
  name: 'Aanya Mehta',
  email: 'aanya@example.com',
  phone: '+91 98765 43210',
  avatar: null,
  addresses: [
    {
      id: 'addr-1',
      label: 'home',
      street: '14 Lotus Lane, Bandra West',
      city: 'Mumbai',
      postalCode: '400050',
      isDefault: true,
    },
    {
      id: 'addr-2',
      label: 'work',
      street: 'WeWork, BKC',
      city: 'Mumbai',
      postalCode: '400051',
      isDefault: false,
    },
  ],
};

export const adminStats = [
  { label: 'Orders today', value: '128', trend: '+12%' },
  { label: 'Revenue', value: '₹84.2k', trend: '+8%' },
  { label: 'Active users', value: '2,416', trend: '+3%' },
  { label: 'Low stock', value: '5', trend: 'Alert' },
];

export const adminRecentOrders = [
  {
    id: 'SH-24110',
    customer: 'Rohit S.',
    total: 1198,
    status: 'preparing',
  },
  {
    id: 'SH-24109',
    customer: 'Neha K.',
    total: 649,
    status: 'confirmed',
  },
  {
    id: 'SH-24108',
    customer: 'Arjun P.',
    total: 899,
    status: 'out_for_delivery',
  },
  {
    id: 'SH-24107',
    customer: 'Isha V.',
    total: 449,
    status: 'delivered',
  },
];

export const formatPrice = (amount) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);

export const formatStatus = (status) =>
  status
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
