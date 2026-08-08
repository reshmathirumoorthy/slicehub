# Order Tracking & Delivery Experience — SliceHub Phase 15

## Actual order lifecycle

Statuses from `ORDER_STATUS` / `STATUS_FLOW` in `orderService.js`:

```text
pending
→ confirmed
→ preparing
→ baking
→ out_for_delivery
→ delivered
```

Terminal / special:

```text
cancelled
```

There is **no** `ready`, `shipped`, or `dispatched` status in this codebase.

## Status history

`Order.statusHistory[]`:

| Field | Meaning |
|-------|---------|
| `status` | Order status value |
| `at` | Server `Date` (never client-supplied) |
| `note` | Short label / reason |
| `changedBy` | `system` \| `customer` \| `admin` |

Rules:

- Appended only when the effective status **changes**
- Repeated same-status admin updates are idempotent (no new history row, no re-notification from status update path)
- New orders start with `pending` history entry at create time
- Payment verification may append `confirmed` when moving from `pending`
- Customer/admin cancel appends `cancelled`

Orders created before Phase 15 may have an empty `statusHistory`. The UI shows current progress without fabricating intermediate timestamps.

## Status transitions

Admin updates (`updateAdminOrderStatus`):

- Must move **forward** along `STATUS_FLOW` (skipping ahead is allowed; going backward is rejected)
- `cancelled` is allowed from non-delivered states
- `delivered` and `cancelled` are terminal
- Same status → no-op

Customer:

- May **view** own orders / tracking
- May **cancel** only `pending` or `confirmed`
- **Cannot** set fulfillment status via customer APIs

## Tracking API

| Method | Path | Auth |
|--------|------|------|
| `GET` | `/api/orders/:id` | Customer — includes `statusHistory` + `tracking` |
| `GET` | `/api/orders/:id/tracking` | Customer — tracking-focused payload |
| `PATCH` | `/api/admin/orders/:id/status` | Admin — validated transitions |

Authorization: `Order.findOne({ _id, user })` for customers. User A cannot read User B’s tracking.

## Payment vs order status

Displayed separately:

- **Order status** — kitchen/delivery lifecycle
- **Payment status** — `created` / `pending` / `paid` / `failed` / `refunded`

Payment confirmation is shown on the tracking card when `paymentStatus === paid` (and `paidAt` when available). Phase 14 notifications remain the event channel for status emails / in-app alerts.

## Customer UI

- `/orders` — **Track order** (active) / **View details** (delivered/cancelled)
- `/orders/:id` — current-status card, timeline, items, address snapshot, payment, refresh

Delivery address always uses `addressSnapshot` stored on the order.

## Admin UI

`/admin/orders` detail panel shows status history timestamps and continues to use the existing status dropdown (backend enforces transitions).

## Notifications

Phase 15 does **not** create a second notification system. Status changes continue to call Phase 14 `notifyOrderStatusChange` / payment helpers.

## Known limitations

- No WebSocket live updates — manual Refresh on order details
- Legacy orders lack intermediate history timestamps
- Approximate `estimatedDeliveryAt` is shown as an estimate only when present
