/**
 * Integration-style API tests for Category & Pizza endpoints.
 *
 * Prerequisites:
 *   1. MongoDB running
 *   2. Server running on PORT (default 5000)
 *   3. Admin seeded: npm run seed:admin
 *   4. Optional menu seed: npm run seed:menu
 *
 * Usage: node utils/testMenuApis.js
 */
import env from '../config/env.js';

const BASE = `http://127.0.0.1:${env.port}/api`;

const results = [];

const log = (name, ok, detail = '') => {
  results.push({ name, ok, detail });
  const mark = ok ? 'PASS' : 'FAIL';
  console.log(`${mark}  ${name}${detail ? ` — ${detail}` : ''}`);
};

const request = async (path, options = {}) => {
  const response = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      ...(options.body && !(options.body instanceof FormData)
        ? { 'Content-Type': 'application/json' }
        : {}),
      ...(options.headers || {}),
    },
  });

  const text = await response.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { raw: text };
  }

  return { status: response.status, data };
};

const run = async () => {
  console.log(`Testing SliceHub menu APIs at ${BASE}\n`);

  // Health
  {
    const res = await request('/health');
    log('GET /health', res.status === 200);
  }

  // Admin login
  let adminToken = '';
  {
    const res = await request('/admin/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: process.env.ADMIN_EMAIL || 'admin@slicehub.com',
        password: process.env.ADMIN_PASSWORD || 'Admin12345',
      }),
    });
    adminToken = res.data?.data?.token || '';
    log(
      'POST /admin/auth/login',
      res.status === 200 && Boolean(adminToken),
      res.data?.message,
    );
  }

  const auth = { Authorization: `Bearer ${adminToken}` };

  // Unauthorized create category
  {
    const res = await request('/categories', {
      method: 'POST',
      body: JSON.stringify({ name: 'Should Fail' }),
    });
    log('POST /categories without auth → 401', res.status === 401);
  }

  // Validation: missing fields
  {
    const res = await request('/categories', {
      method: 'POST',
      headers: auth,
      body: JSON.stringify({}),
    });
    log('POST /categories missing name → 400', res.status === 400);
  }

  // Create category
  let categoryId = '';
  const uniqueName = `Test Cat ${Date.now()}`;
  {
    const res = await request('/categories', {
      method: 'POST',
      headers: auth,
      body: JSON.stringify({
        name: uniqueName,
        description: 'Temporary test category',
      }),
    });
    categoryId = res.data?.data?.category?._id || '';
    log(
      'POST /categories create',
      res.status === 201 && Boolean(categoryId),
      categoryId,
    );
  }

  // Duplicate category
  {
    const res = await request('/categories', {
      method: 'POST',
      headers: auth,
      body: JSON.stringify({ name: uniqueName }),
    });
    log('POST /categories duplicate → 409', res.status === 409);
  }

  // List categories (public)
  {
    const res = await request('/categories');
    log(
      'GET /categories public',
      res.status === 200 && Array.isArray(res.data?.data?.categories),
    );
  }

  // Get category by id
  {
    const res = await request(`/categories/${categoryId}`);
    log('GET /categories/:id', res.status === 200);
  }

  // Invalid category id
  {
    const res = await request('/categories/not-a-valid-id');
    log('GET /categories invalid id → 400', res.status === 400);
  }

  // Update category
  {
    const res = await request(`/categories/${categoryId}`, {
      method: 'PUT',
      headers: auth,
      body: JSON.stringify({ description: 'Updated description' }),
    });
    log('PUT /categories/:id', res.status === 200);
  }

  // Unauthorized pizza create
  {
    const res = await request('/pizzas', {
      method: 'POST',
      body: JSON.stringify({ name: 'Nope' }),
    });
    log('POST /pizzas without auth → 401', res.status === 401);
  }

  // Pizza validation missing fields
  {
    const res = await request('/pizzas', {
      method: 'POST',
      headers: auth,
      body: JSON.stringify({ name: 'Incomplete' }),
    });
    log('POST /pizzas missing fields → 400', res.status === 400);
  }

  // Create pizza
  let pizzaId = '';
  {
    const res = await request('/pizzas', {
      method: 'POST',
      headers: auth,
      body: JSON.stringify({
        name: `Test Pizza ${Date.now()}`,
        description: 'Automated test pizza',
        category: categoryId,
        basePrice: 299,
        sizes: [
          { size: 'small', price: 249 },
          { size: 'medium', price: 399 },
          { size: 'large', price: 549 },
        ],
        availableBases: ['thin_crust'],
        availableSauces: ['tomato'],
        availableCheeses: ['mozzarella'],
        availableVegetables: ['onion', 'mushroom'],
        extraCheesePrice: 40,
        isVegetarian: true,
        isAvailable: true,
      }),
    });
    pizzaId = res.data?.data?.pizza?._id || '';
    log('POST /pizzas create', res.status === 201 && Boolean(pizzaId), pizzaId);
  }

  // Public list + filters
  {
    const res = await request(
      `/pizzas?search=Test&category=${categoryId}&minPrice=100&maxPrice=900&sort=price_asc&page=1&limit=5`,
    );
    log(
      'GET /pizzas search/filter/sort/pagination',
      res.status === 200 && res.data?.data?.pagination,
    );
  }

  // Get pizza
  {
    const res = await request(`/pizzas/${pizzaId}`);
    log('GET /pizzas/:id', res.status === 200);
  }

  // Non-existent pizza
  {
    const res = await request('/pizzas/000000000000000000000000');
    log('GET /pizzas nonexistent → 404', res.status === 404);
  }

  // Update pizza
  {
    const res = await request(`/pizzas/${pizzaId}`, {
      method: 'PUT',
      headers: auth,
      body: JSON.stringify({ basePrice: 319, isAvailable: true }),
    });
    log('PUT /pizzas/:id', res.status === 200);
  }

  // User token cannot delete (login as fake - just no admin token)
  {
    const res = await request(`/pizzas/${pizzaId}`, { method: 'DELETE' });
    log('DELETE /pizzas without auth → 401', res.status === 401);
  }

  // Delete pizza
  {
    const res = await request(`/pizzas/${pizzaId}`, {
      method: 'DELETE',
      headers: auth,
    });
    log('DELETE /pizzas/:id', res.status === 200);
  }

  // Confirm deleted
  {
    const res = await request(`/pizzas/${pizzaId}`);
    log('GET deleted pizza → 404', res.status === 404);
  }

  // Delete category
  {
    const res = await request(`/categories/${categoryId}`, {
      method: 'DELETE',
      headers: auth,
    });
    log('DELETE /categories/:id', res.status === 200);
  }

  const failed = results.filter((r) => !r.ok);
  console.log(
    `\nDone: ${results.length - failed.length}/${results.length} passed`,
  );
  if (failed.length) {
    process.exitCode = 1;
  }
};

run().catch((error) => {
  console.error('Test runner failed:', error.message);
  console.error('Is the server running? Try: npm run dev');
  process.exit(1);
});
