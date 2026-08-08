# Admin Dashboard — SliceHub Phase 11

## Access

- UI: `/admin/login` → `/admin/dashboard`
- Frontend gate: `AdminAuthProvider` + `GET /api/admin/auth/me`
- Backend: every admin API uses `protectAdmin` (JWT admin Bearer or cookie)
- Customer JWTs cannot call `/api/admin/*` (accountType check)

## Routes (UI)

| Path | Purpose |
|------|---------|
| `/admin/dashboard` | Overview cards, analytics, recent orders |
| `/admin/orders` | Search/filter/status update |
| `/admin/pizzas` | Pizza CRUD (existing MenuManager) |
| `/admin/categories` | Category CRUD |
| `/admin/inventory` | Phase 10 inventory (unchanged logic) |
| `/admin/reviews` | Moderate customer reviews |
| `/admin/users` | Customer list + activate/deactivate |
| `/admin/menu` | Redirect → pizzas |
| `/admin/customers` | Redirect → users |

## APIs

### Dashboard
- `GET /api/admin/dashboard/overview` — live counts + recent orders + inventory snapshot
- `GET /api/admin/dashboard/analytics?range=today|7d|30d|month|custom&from=&to=`

### Users
- `GET /api/admin/users`
- `GET /api/admin/users/:id`
- `PATCH /api/admin/users/:id/status` `{ isActive: boolean }`

### Reviews
- `GET /api/admin/reviews` — search/filter reviews
- `PATCH /api/admin/reviews/:id/visibility` `{ isVisible: boolean }`
- Dashboard cards also include total/average/5-star/hidden review counts

### Existing (reused)
- `/api/admin/orders`, `/api/admin/inventory`
- `/api/pizzas`, `/api/categories` (mutations require admin)

## Metrics definitions

- **Revenue**: sum of `Order.pricing.total` where `paymentStatus === 'paid'`
- **Today’s revenue / today’s orders**: same, scoped to local calendar day
- **Pending orders**: `status === 'pending'`
- **Completed orders**: `status === 'delivered'`
- **Inventory cards**: Phase 10 `Inventory` collection (low / out / total) — summary only; no duplicate stock logic

## Analytics (`GET /analytics`)

Server aggregations for the selected range:

- Daily revenue series (paid orders)
- Orders over time
- Orders by status
- Most ordered pizzas (from order line items)
- Popular categories (from pizza category refs on order items where available)

Presets: `today`, `7d`, `30d`, `month`, plus `custom` with `from` / `to`.

## Charts

CSS bar charts / status pills (`SimpleCharts.jsx`) — no chart library dependency. Data from server aggregations only.

## Authorization notes

- Admin accounts live in the `Admin` model (separate from customer `User`)
- Customer `User.isActive` can be toggled from `/admin/users`
- Last-active-admin guard exists for `Admin` deactivation paths; customer users are not admins, so deactivating customers cannot remove the only admin account

## Testing checklist

1. Unauthenticated `/admin` → redirect login
2. Customer token cannot access `/api/admin/dashboard/overview` (401/403)
3. Admin login loads real stats (empty DB → zeros / empty charts)
4. Date range buttons refresh analytics only
5. Orders: search, status, payment, date filters; status update confirms
6. Categories: create/edit; delete blocked when pizzas reference category
7. Pizzas: add/edit/delete/availability
8. Inventory: dashboard “View Inventory” opens Phase 10 page; stock rules unchanged
9. Users: search; activate/deactivate with confirm; no password fields in responses

## Lint / build

```bash
cd server && npm run lint
cd client && npm run build
```
