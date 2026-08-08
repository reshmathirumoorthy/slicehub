# SliceHub Bug Audit — Full Application Stabilization

**Date:** 2026-08-08  
**Scope:** Phases 1–15 end-to-end run (API + local frontend/backend), not a static-only code review.  
**Verdict:** **No known reproducible Critical/High application bugs remain within the tested scope.**

---

## Environment / limitations

| Item | Status |
|------|--------|
| Backend (`npm run dev`) | Started on port **5000** after local MongoDB (Docker `mongo:7`) was available |
| Frontend (`npm run dev`) | Vite on **5173** |
| MongoDB | Required; initial `ECONNREFUSED 127.0.0.1:27017` until Docker Mongo was running |
| SMTP | `EMAIL_HOST=smtp.example.com` → **dev fallback** logs verify/reset links (no real delivery) |
| Razorpay | `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` **not set** → create-order correctly returns **503**; live checkout not exercised |
| Browser MCP | Not available in this session; customer UI exercised via Vite HTTP + API flows matching client routes |

**Env vars referenced (names only):** `MONGODB_URI`, `JWT_SECRET`, `CLIENT_URL`, `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER`, `EMAIL_PASS`, `EMAIL_FROM`, `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `VITE_API_BASE_URL`

**Existing DB repair (payments):** after deploying the Payment index fix, run once if upgrades hit `Duplicate value for transactionId`:

```bash
node utils/fixPaymentIndexes.js
```

---

## Bug table

| ID | Severity | Area | Bug | Reproduction | Root Cause | Fix | Status |
| ---- | -------- | ---- | --- | ------------ | ---------- | --- | ------ |
| BUG-001 | Critical | Auth | Customer registration and admin seeding crash with `next is not a function` | `POST /api/auth/register` or `npm run seed:admin` | Mongoose **9** document middleware no longer receives a `next` callback; `User`/`Admin` async `pre('save')` still called `next()` | Remove `next` from async password hooks in `User.js` / `Admin.js` | Fixed |
| BUG-002 | Critical | Notifications | In-app notifications never created (`[notification] create failed: next is not a function`) | Register a user and inspect server logs | Same Mongoose 9 issue in sync `pre('validate')` on `Notification` (also `Inventory`, `Coupon`) | Stop calling `next` in those hooks | Fixed |
| BUG-003 | High | Auth / Frontend | Email verification links open `/verify-email?token=…` but the route/page was missing (404 shell) | Register → open verify URL from `[email:dev-fallback]` log | Backend `emailService` and Phase 14 emails assumed a client page that was never wired | Add `VerifyEmail.jsx`, route in `AppRouter`, resend on Login when login returns unverified 403 | Fixed |
| BUG-004 | High | Checkout / Payments | Second order (esp. COD) fails with `409 Duplicate value for transactionId` | Place any order, then place another COD/online unpaid order | Unique **sparse** index on `transactionId` still indexes explicit `null`; only one unpaid payment could exist | Partial unique indexes on string ids; omit null ids on create; `utils/fixPaymentIndexes.js` to repair DB | Fixed |
| BUG-005 | Medium | Inventory seed | `npm run seed:inventory` fails with `E11000 … name: "Tomato"` | Fresh DB seed after menu enums + builder sauces/veg both include `tomato` | Global `unique: true` on inventory `name` across categories | Remove name uniqueness; keep `sku` + `{category,itemKey}` unique; drop stale `name_1` index | Fixed |
| BUG-006 | Low | Models / Startup | Duplicate schema index warnings for Pizza `basePrice`, Cart `user`/`guestId`, Order `orderNumber` | Start server and read Node warnings | Field-level `index`/`unique` plus redundant `schema.index()` | Remove redundant compound/field indexes | Fixed |
| BUG-007 | Low | Auth UX | Unverified users only saw a toast; no path to resend verification in UI | Login before verifying email | Incomplete login UX around required email verification | Resend button on Login when message matches verify requirement | Fixed |

### By design / not bugs

| Note | Detail |
|------|--------|
| Admin status skip-ahead | `ORDER_TRACKING.md`: forward skip (e.g. `confirmed` → `delivered`) is allowed; backward rejected |
| COD “Payment successful” email on deliver | Intentional: COD marked paid on delivery, then `notifyPaymentSuccess` |
| Review HTML in comment text | Stored as text; React text nodes escape — no `dangerouslySetInnerHTML` found |
| Guest cart without auth | Expected via `optionalUser` + `X-Guest-Id` |

### Remaining (non-blocking)

| ID | Severity | Area | Notes | Status |
| ---- | -------- | ---- | ----- | ------ |
| BUG-008 | Low | Auth UX | “Forgot password?” still only toasts to use the API; no `/forgot-password` / `/reset-password` pages | Open |
| BUG-009 | Informational | Deprecation | Seed scripts / services still pass `new: true` to `findOneAndUpdate` (Mongoose deprecation → prefer `returnDocument: 'after'`) | Open |
| BUG-010 | Informational | Build | Vite chunk size warning for Three.js pizza scene | Open |
| BUG-011 | Informational | Lint | Client `react-refresh/only-export-components` warning in `AdminAuthContext.jsx` | Open |

---

## Retest evidence (after fixes)

| Flow | Result |
|------|--------|
| Register → verify (`GET /auth/verify-email/:token`) → login | Pass |
| `/verify-email` frontend route | HTTP 200 |
| Menu pizza → cart → address → COD order (×2) + Razorpay order create | Pass (Razorpay pay create → 503 without keys) |
| Payment fail marking | Pass |
| Admin status lifecycle + cancel + isolation | Pass |
| Reviews create / duplicate 409 | Pass |
| Notifications create (post-hook fix) | Pass |
| Admin dashboard / inventory / users / notifications auth | Pass |

---

## Automated checks

| Command | Result |
|---------|--------|
| `server`: `npm run lint` | Pass |
| `server`: `npm run test:phase13` | Pass |
| `server`: `npm run test:payments` | Pass (signature helpers; live Razorpay noted as unavailable) |
| `server`: `npm run test:notifications` | Pass |
| `server`: `npm run test:tracking` | Pass |
| `client`: `npm run lint` | Pass (1 pre-existing warning) |
| `client`: `npm run build` | Pass |

**Could not run fully:** live Razorpay Checkout UI (missing test keys); real SMTP delivery (example host).

---

## Summary counts

| Metric | Count |
|--------|------:|
| Bugs discovered (table + remaining) | 11 |
| Critical | 2 (both fixed) |
| High | 2 (both fixed) |
| Medium | 1 (fixed) |
| Low | 3 (2 fixed, 1 open) |
| Informational | 3 (open / env) |
| Fixed | 7 |
| Remaining | 4 (Low/Informational only) |

---

## Acceptance

Within the tested scope (local Mongo, mocked email, Razorpay unconfigured):

> **No known reproducible Critical or High application bugs remain.**  
> Backend and frontend start cleanly; major customer and admin API flows work after the fixes above.
