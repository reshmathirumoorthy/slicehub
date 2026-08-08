# SliceHub — Phase 13 QA & Security Audit

**Date:** 2026-08-08  
**Scope:** Phases 1–12 existing application (stabilize / secure / document)  
**Status:** **PASS WITH LIMITATIONS**

---

## Executive Summary

SliceHub’s core authorization model is sound: customer and admin JWTs are separated, order/address/payment/review ownership is enforced server-side, Razorpay secrets stay on the server, Helmet + CORS are configured, and review text is rendered safely in React (no `dangerouslySetInnerHTML`).

Phase 13 focused on hardening genuine risks without rewriting features:

1. Rate limiting on auth and payment mutation routes  
2. Production fail-closed JWT / Mongo configuration  
3. Timing-safe Razorpay signature verification  
4. Escaped regex search inputs (ReDoS mitigation)  
5. Public pizza list no longer accepts availability override query params  
6. Safer CastError messages and smaller JSON body limits  

Automated Jest/Vitest suites are still absent; live browser E2E and full live payment/review matrix against MongoDB were not fully executed in this session. Offline security helpers and existing payment signature scripts **did** pass. Server lint and client lint/build **passed**.

---

## Tested Areas

| Area | How tested |
|------|------------|
| Code inspection | Auth, payments, cart, orders, reviews, uploads, CORS, errors, admin routes |
| Secrets / `.gitignore` | Confirmed `.env` ignored; client `VITE_*` has no secrets |
| XSS surface | Grep — no `dangerouslySetInnerHTML` in client |
| Payment signature | `npm run test:payments` |
| Offline Phase 13 helpers | `npm run test:phase13` |
| Server lint | `npm run lint` |
| Client lint / build | `npm run lint`, `npm run build` |
| Live HTTP auth/order/review matrix | **Not fully run** (no automated suite + no guaranteed live Mongo in session) |
| Mobile UI walkthrough | **Code/responsive review only** — not device QA |

---

## Test Results

| Area | Result | Notes |
|------|--------|-------|
| Authentication | FIXED / PASS WITH LIMITATIONS | Rate limits added; production JWT fail-closed. Live register/login not re-hit in this session. |
| Authorization | PASS (code review) | `protectUser` / `protectAdmin` + accountType checks; admin APIs reject customer JWTs by design. |
| Cart | PASS WITH LIMITATIONS | Server-priced cart; guest cart keyed by client `X-Guest-Id` (Medium residual risk). |
| Orders | PASS (code review) | `getMyOrder` / create scoped to `user`. Live cancel matrix not re-run. |
| Payments | FIXED / PASS WITH LIMITATIONS | Timing-safe HMAC; public config returns keyId only. No live Razorpay amount re-fetch yet. |
| Inventory | PASS WITH LIMITATIONS | Phase 10 logic unchanged. Deduction failure after paid verify still logged (known limitation). |
| Reviews (Phase 12) | PASS (code review + prior phase) | Purchase gate, ownership, unique user+pizza, rating 1–5, admin visibility. Live purchase→review path not re-executed here. |
| Admin | PASS (code review) | Dashboard/users/orders/inventory/reviews behind `protectAdmin`. |
| Frontend | PASS WITH LIMITATIONS | Lint clean (1 pre-existing react-refresh warning); build OK. Full UI click-through not automated. |
| Security | FIXED | See findings table. Residual: JWT in localStorage, guest cart ID, MIME-only uploads. |
| Performance | PASS WITH LIMITATIONS | JSON limit reduced to 1mb; large Vite chunks remain informational. |
| Input validation | FIXED / PASS | Admin search regex escaped; public pizza availability override closed. |
| Error handling | FIXED | CastError no longer echoes raw ObjectId values; stacks only in development. |
| File uploads | PASS WITH LIMITATIONS | MIME allowlist + size + admin-only; no magic-byte check yet. |
| Database | PASS WITH LIMITATIONS | Indexes exist on key models; no load testing performed. |

---

## Security Findings

| Finding | Severity | Impact | Fix | Status |
|---------|----------|--------|-----|--------|
| No rate limiting on auth/payment | High | Brute-force / abuse | `express-rate-limit` on auth + payment mutations | **FIXED** |
| Weak JWT fallback usable in misconfigured prod | High | Forged tokens | Fail boot if production JWT secret missing/weak; require `MONGODB_URI` | **FIXED** |
| HMAC signature compared with `===` | Medium | Timing side-channel (theoretical) | `crypto.timingSafeEqual` via `utils/razorpaySignature.js` | **FIXED** |
| Unescaped `RegExp` in admin searches | Medium | ReDoS on admin search | `escapeRegex` in users/orders/inventory/reviews | **FIXED** |
| Public pizza list honored `isAvailable` / `includeUnavailable` | Low | Leak unavailable catalog | Public always filters `isAvailable: true` | **FIXED** |
| CastError included `err.value` | Low | Minor ID leakage | Generic “Invalid resource identifier” | **FIXED** |
| JSON body limit 10mb | Low | Memory DoS surface | Reduced to 1mb | **FIXED** |
| JWT stored in `localStorage` | Medium | XSS → token theft | Prefer httpOnly cookies long-term | **DOCUMENTED** (not migrated) |
| Guest cart IDOR via `X-Guest-Id` | Medium | Cart tampering if UUID known | Treat as secret / sign IDs later | **DOCUMENTED** |
| Upload trusts client MIME only | Medium | Malicious “image” storage | Magic-byte validation later | **DOCUMENTED** |
| Paid cancel marks refunded without gateway refund | Medium | Accounting mismatch | Gateway refund workflow later | **DOCUMENTED** |
| Inventory deduct failure after paid verify swallowed | Medium | Paid order without stock deduct | Retry/alert job later | **DOCUMENTED** |
| Default seed admin password | Medium | Weak bootstrap creds if used in prod | Env-required password later | **DOCUMENTED** |
| No automated IDOR/auth test suite | Medium (quality) | Regressions harder to catch | `test:phase13` offline helpers only | **PARTIAL** |

**Critical findings:** none identified.

---

## Phase 13 Code Changes (summary)

### Added
- `server/middleware/rateLimit.js`
- `server/utils/escapeRegex.js`
- `server/utils/razorpaySignature.js`
- `server/utils/testPhase13Security.js`
- `server/docs/QA_SECURITY_AUDIT.md` (this file)

### Modified (hardening only)
- `server/config/env.js` — production secret guards  
- `server/app.js` — 1mb body limits  
- `server/middleware/errorHandler.js` — safer CastError  
- `server/routes/auth.routes.js`, `adminAuth.routes.js`, `payment.routes.js` — rate limits  
- `server/services/paymentService.js` — timing-safe verify  
- `server/services/adminUserService.js`, `orderService.js`, `inventoryService.js`, `reviewService.js` — escaped search  
- `server/services/pizzaService.js` — public availability lock  
- `server/utils/testPaymentSignature.js` — covers timing-safe path  
- `server/package.json` — `express-rate-limit`, `test:phase13`  
- `server/.env.example` — production JWT note  

**Not changed:** Phase 10 inventory deduction algorithm, Razorpay order creation flow, Review model schema, customer-facing redesigns.

---

## Remaining Limitations

1. **No full live API matrix** in this session (register → order → pay → review → admin hide) against a running Mongo + Razorpay test account.  
2. **No browser E2E** (Playwright/Cypress) for UI flows.  
3. **JWT still in localStorage** (httpOnly cookie migration deferred to avoid auth rewrite).  
4. **Guest carts** remain bearer-token-like via client UUID.  
5. **Upload magic-byte validation** not added.  
6. **Razorpay `payments.fetch` amount re-check** after signature not added (relies on Orders API binding + HMAC).  
7. **Coupon `usedCount`** still increments at order create (pre-payment) — known commerce limitation.  
8. Client bundle size warning (>500kb) remains informational.

---

## Commands Executed

```bash
cd server && npm run test:phase13   # PASS
cd server && npm run test:payments  # PASS
cd server && npm run lint           # PASS
cd client && npm run lint           # PASS (1 pre-existing warning)
cd client && npm run build          # PASS
```

---

## Phase 13 Status

```text
Phase 13 Status:
PASS WITH LIMITATIONS
```

Use **PASS WITH LIMITATIONS** because offline security tests, lint, build, and code-level auth/IDOR/payment reviews were completed and high-priority fixes landed, while full live E2E purchase/review/payment journeys were not re-executed end-to-end in this audit session.
