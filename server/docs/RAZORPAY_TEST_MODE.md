# Razorpay TEST MODE — SliceHub

## Setup

1. Create a Razorpay account and open **Test Mode** (toggle in the dashboard).
2. Copy **Key Id** and **Key Secret** from https://dashboard.razorpay.com/app/keys
3. Put them only in `server/.env` (never commit):

```env
RAZORPAY_KEY_ID=rzp_test_xxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxx
PAYMENT_EXPIRY_MINUTES=30
```

4. Restart the API server. Confirm `GET /api/payments/config` returns `{ configured: true, keyId: "rzp_test_..." }` — **secret is never returned**.

## Checkout flow

1. Sign in → add items → Checkout → choose **UPI** or **Card** → Place order.
2. On the success / order details page, click **Pay Now**.
3. Razorpay Checkout opens (TEST). Complete or dismiss the payment.
4. Frontend sends the response to `POST /api/payments/verify`.
5. Backend verifies the HMAC signature with `RAZORPAY_KEY_SECRET`, then marks payment **paid** and confirms the order.

COD orders skip Razorpay entirely.

## Test cases

| Case | How |
|------|-----|
| **Success** | Use Razorpay test card `4111 1111 1111 1111`, any future expiry, any CVV. Or test UPI `success@razorpay`. |
| **Failure** | Use failure test instruments from Razorpay docs (e.g. card ending that triggers failure / `failure@razorpay`). UI shows failed state; order stays unpaid. |
| **Cancel** | Close the Razorpay modal. UI shows cancelled; `POST /api/payments/fail` records failure without marking paid. |
| **Duplicate verification** | Call `POST /api/payments/verify` twice with the same payload after success → second response is idempotent (`alreadyPaid: true`). |
| **Invalid signature** | Call verify with a tampered `razorpay_signature` → `400 Invalid payment signature`; payment marked failed. |
| **Already paid** | Click Pay Now again on a paid order → `409 Order is already paid`. |
| **Expired order** | Set `PAYMENT_EXPIRY_MINUTES=0` (or wait) → create-order / verify returns `410`. |
| **Price manipulation** | Client cannot change amount; create-order always uses `order.pricing.total` from MongoDB. |

## API

- `POST /api/payments/create-order` `{ orderId }` → public `keyId`, `razorpayOrderId`, `amount` (paise)
- `POST /api/payments/verify` `{ orderId, razorpay_order_id, razorpay_payment_id, razorpay_signature }`
- `POST /api/payments/fail` `{ orderId, reason? }`
- `GET /api/payments/config` → public key only

## Security checklist

- [x] `RAZORPAY_KEY_SECRET` only on the server
- [x] Amount taken from SliceHub order, not the client
- [x] Order ownership checked (`user` match)
- [x] Paid only after signature verification
- [x] Duplicate payment id / already-paid handled
