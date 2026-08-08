/**
 * Order API smoke checks (requires Mongo + running server + auth tokens).
 * Usage: node utils/testOrderApis.js
 *
 * Creates a guest cart item, registers/logs in a disposable user if needed —
 * prefers TEST_USER_EMAIL / TEST_USER_PASSWORD from env when set.
 */
import env from '../config/env.js';

const BASE = `http://127.0.0.1:${env.port}/api`;

const request = async (path, { method = 'GET', body, token, guestId } = {}) => {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (guestId) headers['X-Guest-Id'] = guestId;

  const response = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await response.json().catch(() => ({}));
  return { status: response.status, data };
};

const assert = (ok, msg) => {
  if (!ok) throw new Error(msg);
};

const run = async () => {
  console.log('Testing order/address APIs…');

  const guestId = `guest-order-${Date.now()}`;
  const email =
    process.env.TEST_USER_EMAIL ||
    `order.test.${Date.now()}@slicehub.local`;
  const password = process.env.TEST_USER_PASSWORD || 'TestPass123!';

  // Register (may fail if email exists — then login)
  let auth = await request('/auth/register', {
    method: 'POST',
    body: {
      name: 'Order Tester',
      email,
      phone: '+919876543210',
      password,
    },
  });

  // Force-verify via direct DB is not available here; login may fail if verify required.
  // Prefer seeded verified user via env for full flow.
  auth = await request('/auth/login', {
    method: 'POST',
    body: { email, password },
  });

  if (auth.status !== 200) {
    console.log(
      'SKIP full order flow — login failed (email verify required?).',
      auth.data.message,
    );
    console.log('Address route auth check still runs with missing token…');
    const unauth = await request('/orders/my');
    assert(unauth.status === 401, 'orders/my should require auth');
    console.log('PASS unauthorized guard');
    return;
  }

  const token = auth.data.data.token;

  // Seed cart as authenticated user
  let res = await request('/cart', {
    method: 'POST',
    token,
    guestId,
    body: {
      size: 'medium',
      base: 'thin_crust',
      sauce: 'tomato',
      cheese: 'mozzarella',
      vegetables: ['mushroom'],
      quantity: 1,
      unitPrice: 1,
      total: 1,
    },
  });
  assert(res.status === 201, `cart add failed: ${res.data.message}`);
  const serverTotal = res.data.data.cart.totals.grandTotal;
  assert(serverTotal > 1, 'server must ignore client price');

  // Address
  res = await request('/addresses', {
    method: 'POST',
    token,
    body: {
      fullName: 'Order Tester',
      phone: '+919876543210',
      street: '12 Baker Street',
      city: 'Mumbai',
      state: 'Maharashtra',
      postalCode: '400001',
      landmark: 'Near cafe',
      label: 'home',
      isDefault: true,
    },
  });
  assert(res.status === 201, `address create failed: ${res.data.message}`);
  const addressId = res.data.data.address.id;

  // Invalid address
  const bad = await request('/addresses', {
    method: 'POST',
    token,
    body: { fullName: 'X' },
  });
  assert(bad.status === 400, 'invalid address should fail');

  // Empty cart order after clear should fail — place with current cart first
  res = await request('/orders', {
    method: 'POST',
    token,
    body: {
      addressId,
      paymentMethod: 'cod',
      notes: 'Test order',
      total: 1, // manipulated — ignored
    },
  });
  assert(res.status === 201, `order create failed: ${res.data.message}`);
  const order = res.data.data.order;
  assert(order.pricing.total === serverTotal, 'order total must match server cart');
  assert(order.pricing.total !== 1, 'must not trust client total');

  // Empty cart now
  const empty = await request('/orders', {
    method: 'POST',
    token,
    body: { addressId, paymentMethod: 'cod' },
  });
  assert(empty.status === 400, 'empty cart should fail');

  // Own order access
  res = await request(`/orders/${order.id}`, { token });
  assert(res.status === 200, 'get own order failed');

  // Cancel
  res = await request(`/orders/${order.id}/cancel`, {
    method: 'PATCH',
    token,
    body: { reason: 'Changed mind' },
  });
  assert(res.status === 200, 'cancel failed');
  assert(res.data.data.order.status === 'cancelled', 'status not cancelled');

  console.log('PASS order/address API checks');
};

run().catch((error) => {
  console.error('FAIL', error.message);
  process.exit(1);
});
