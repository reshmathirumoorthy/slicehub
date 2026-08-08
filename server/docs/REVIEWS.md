# Reviews & Ratings — SliceHub Phase 12

## Overview

Authenticated customers can review pizzas they have purchased. Public visitors can read visible reviews and rating summaries. Admins can hide/restore inappropriate reviews.

Uses the existing `Review` model (`user`, `pizza`, `order`, `rating` 1–5, `comment`, `isVisible`, `isApproved`). Unique index: one review per user per pizza.

## Purchase eligibility

A review is allowed only when the customer has an order that:

- Belongs to them
- Contains the pizza in `items.pizza`
- Is not cancelled / refunded
- Is **paid** and/or **delivered**

`userId` is taken from the JWT (`protectUser`), never trusted from the body.

## Customer APIs

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| `GET` | `/api/reviews/pizza/:pizzaId` | optional | List reviews + summary (+ myReview/eligibility if logged in) |
| `GET` | `/api/reviews/pizza/:pizzaId/eligibility` | user | Purchase / duplicate checks |
| `POST` | `/api/reviews` | user | Create `{ pizzaId, orderId?, rating, comment, title? }` |
| `PATCH` | `/api/reviews/:id` | user | Edit own review |
| `DELETE` | `/api/reviews/:id` | user | Delete own review |

## Admin APIs

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| `GET` | `/api/admin/reviews` | admin | Search / filter / paginate |
| `PATCH` | `/api/admin/reviews/:id/visibility` | admin | `{ isVisible: boolean }` |

Admins cannot change review ownership or impersonate customers.

## Pizza denormalization

After create / update / delete / hide / restore, `Pizza.averageRating` and `Pizza.reviewCount` are recalculated from visible + approved reviews.

## UI

- Pizza details: Ratings & Reviews section (`PizzaReviewsSection`)
- Menu cards: average + review count
- Admin: `/admin/reviews` + dashboard cards (total, average, 5-star, hidden)

## Manual test checklist

1. Guest sees reviews; cannot submit
2. Customer without purchase cannot submit
3. After paid/delivered order containing pizza → can submit
4. Duplicate review → 409
5. Edit / delete own review only
6. User A cannot mutate User B’s review
7. Admin hide removes review from public list and updates pizza stats
8. Admin restore brings it back
