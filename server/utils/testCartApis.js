/**
 * Cart API smoke tests (requires Mongo + running server).
 * Usage: node utils/testCartApis.js
 */
import env from '../config/env.js';

const BASE = `http://127.0.0.1:${env.port}/api`;
const guestId = `guest-test-${Date.now()}`;

const request = async (path, options = {}) => {
  const response = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'X-Guest-Id': guestId,
      ...(options.headers || {}),
    },
  });
  const data = await response.json().catch(() => ({}));
  return { status: response.status, data };
};

const assert = (ok, msg) => {
  if (!ok) throw new Error(msg);
};

const run = async () => {
  console.log('Testing cart APIs…');

  let res = await request('/cart');
  assert(res.status === 200, 'GET cart failed');

  res = await request('/cart', {
    method: 'POST',
    body: JSON.stringify({
      size: 'medium',
      base: 'thin_crust',
      sauce: 'tomato',
      cheese: 'mozzarella',
      vegetables: ['mushroom'],
      extraCheese: true,
      quantity: 1,
      unitPrice: 1, // must be ignored/rejected by quote path inside add
    }),
  });
  // unitPrice in body is stripped before quote — should succeed
  assert(res.status === 201, `add failed: ${res.data.message}`);
  const itemId = res.data.data.cart.items[0].id;
  const unit = res.data.data.cart.items[0].unitPrice;
  assert(unit > 1, 'server did not recalculate unit price');

  // Same customization should merge qty
  res = await request('/cart', {
    method: 'POST',
    body: JSON.stringify({
      size: 'medium',
      base: 'thin_crust',
      sauce: 'tomato',
      cheese: 'mozzarella',
      vegetables: ['mushroom'],
      extraCheese: true,
      quantity: 1,
    }),
  });
  assert(res.status === 201, 'second add failed');
  assert(res.data.data.cart.items.length === 1, 'should merge identical items');
  assert(res.data.data.cart.items[0].quantity === 2, 'qty should be 2');

  // Different customization = new line
  res = await request('/cart', {
    method: 'POST',
    body: JSON.stringify({
      size: 'large',
      base: 'cheese_burst',
      sauce: 'pesto',
      cheese: 'cheddar',
      vegetables: [],
      extraCheese: false,
      quantity: 1,
    }),
  });
  assert(res.data.data.cart.items.length === 2, 'different config should be separate');

  res = await request(`/cart/${itemId}`, {
    method: 'PATCH',
    body: JSON.stringify({ quantity: 3 }),
  });
  assert(res.status === 200, 'patch failed');

  res = await request(`/cart/${itemId}`, {
    method: 'PATCH',
    body: JSON.stringify({ quantity: 0 }),
  });
  assert(res.status === 200, 'qty 0 remove failed');

  res = await request('/cart', { method: 'DELETE' });
  assert(res.status === 200, 'clear failed');
  assert(res.data.data.cart.items.length === 0, 'cart not empty');

  console.log('PASS cart API checks');
};

run().catch((error) => {
  console.error('FAIL', error.message);
  console.error('Is Mongo + server running?');
  process.exit(1);
});
