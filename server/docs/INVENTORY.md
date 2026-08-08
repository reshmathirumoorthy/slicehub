# Inventory management — SliceHub Phase 10

## Seed

```bash
cd server
npm run seed:inventory
```

Seeds bases, sauces, cheeses, and vegetables (menu + builder keys).

## Deduction rules

- Stock is checked when placing an order (insufficient → `409`).
- Stock is **decremented only after payment succeeds**:
  - Razorpay: `POST /api/payments/verify`
  - COD: when admin marks order **delivered** (payment → paid)
- Failed / cancelled payments never decrement.
- Atomic `$inc` with `quantityInStock: { $gte: n }` prevents negative stock.
- `order.inventoryDeducted` makes deduction idempotent.

## Admin API

- `GET /api/admin/inventory`
- `GET /api/admin/inventory/low-stock`
- `GET /api/admin/inventory/out-of-stock`
- `POST /api/admin/inventory/:id/add-stock`
- `POST /api/admin/inventory/:id/adjust`
- `PATCH /api/admin/inventory/:id/threshold`
- `POST /api/admin/inventory/check-alerts` — manual cron run

UI: `/admin/inventory`

## Low-stock email (node-cron + Nodemailer)

Configured in `.env`:

```env
ADMIN_ALERT_EMAIL=admin@slicehub.com
INVENTORY_ALERT_COOLDOWN_HOURS=12
INVENTORY_CRON=0 * * * *
EMAIL_HOST=...
EMAIL_USER=...
EMAIL_PASS=...
```

Without real SMTP, emails log as `[email:dev-fallback]`.  
Cooldown-spam: each SKU’s `lastLowStockAlertAt` skips re-alerts within the cooldown. Repeated cron ticks with no new issues send nothing.

## Tests

```bash
npm run test:inventory
```
