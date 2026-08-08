# Notifications & User Communication — SliceHub Phase 14

## Architecture

- **Model:** existing `Notification` (extended with `eventKey`, `link`)
- **Service:** `notificationService.js` (CRUD, unread, preferences, cleanup)
- **Events:** `notificationEvents.js` (order/payment/review/inventory/registration hooks)
- **Email:** extends `emailService.js` (order/payment/review helpers)
- **Jobs:** reuses low-stock cron; adds daily notification cleanup

Audience separation:

| Audience | Recipient field | APIs |
|----------|-----------------|------|
| `user` | `user` | `/api/notifications/*` (`protectUser`) |
| `admin` | `admin` | `/api/admin/notifications/*` (`protectAdmin`) |

Customers never see admin operational notifications and vice versa.

## Notification types

`order` · `payment` · `review` · `system` · `inventory` · `promo`

### Customer events

| Event | Trigger |
|-------|---------|
| Order placed | `createOrderFromCart` |
| Status updates | Admin status change / cancel (`pending`→`delivered` flow) |
| Payment success / failed | Razorpay verify / fail (+ COD paid on delivery) |
| Refund recorded | Cancel of paid order |
| Review submitted | Successful review create |

Statuses match existing enum: `pending`, `confirmed`, `preparing`, `baking`, `out_for_delivery`, `delivered`, `cancelled` (no invented “ready” status — baking covers oven stage).

### Admin events

| Event | Trigger |
|-------|---------|
| New order | Order create |
| Payment failure | Payment fail / bad signature |
| Order cancelled | Cancel flows |
| Refund recorded | Paid cancel |
| New review | Review create |
| New customer | Registration |
| Low inventory | Existing low-stock job (hourly eventKey bucket) |

## APIs

### Customer (`protectUser`)

- `GET /api/notifications`
- `GET /api/notifications/unread-count`
- `PATCH /api/notifications/:id/read`
- `PATCH /api/notifications/read-all`
- `DELETE /api/notifications/:id`
- `GET|PATCH /api/notifications/preferences`

### Admin (`protectAdmin`)

- `GET /api/admin/notifications`
- `GET /api/admin/notifications/unread-count`
- `PATCH /api/admin/notifications/:id/read`
- `PATCH /api/admin/notifications/read-all`
- `DELETE /api/admin/notifications/:id`

Ownership is always derived from JWT (`req.user` / `req.admin`). IDOR denied by scoped queries.

## Duplicate prevention

Sparse unique index on `eventKey` (e.g. `user:<id>:order:<id>:status:delivered`). Duplicate inserts return the existing row.

Low-stock in-app alerts use hourly keys so the cron cannot spam unlimited rows for the same hour; email still uses the existing cooldown/`lastAlertedAt` logic.

## Email

Transactional emails (optional via `notificationPreferences.orderEmails`, default on):

- Order placed / confirmed / delivered / cancelled
- Payment success / failure

Optional: review confirmation (`reviewEmails`, default off).

Security emails (verify/reset) remain mandatory and unchanged.

Email failures are logged and **never** fail the parent order/payment/review operation.

Without real SMTP (`smtp.example.com` or missing config), `sendEmail` uses the existing dev fallback logger.

## Preferences

Stored on `User.notificationPreferences`:

- `orderEmails` (default `true`)
- `reviewEmails` (default `false`)
- `promoEmails` (default `false`)

## Retention

Daily cron deletes in-app notifications older than **90 days** (`NOTIFICATION_RETENTION_DAYS`). Orders/payments are never deleted by this job.

## UI

- Customer: navbar bell + badge, dropdown, `/notifications` page
- Admin: `/admin/notifications` in AdminDesk sidebar

## Security

- Auth required on all private endpoints
- No client-supplied `userId` for create/list
- React text rendering (no HTML injection)
- Admin/customer separation preserved

## Known limitations

- Live SMTP delivery not verified in Phase 14 unless real credentials are configured
- Not a WebSocket/push system — polling unread count ~60s in the bell
- Payment-failed customer `eventKey` is one-per-order (subsequent failures reuse the same row until a new event key strategy is needed)
