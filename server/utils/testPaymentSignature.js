/**
 * Local signature / idempotency checks (no live Razorpay call required).
 * Usage: node utils/testPaymentSignature.js
 */
import crypto from 'crypto';
import env from '../config/env.js';
import { verifyRazorpaySignature } from './razorpaySignature.js';
import { escapeRegex } from './escapeRegex.js';

const assert = (ok, msg) => {
  if (!ok) throw new Error(msg);
};

const sign = (orderId, paymentId, secret) =>
  crypto
    .createHmac('sha256', secret)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');

const run = () => {
  const secret = env.razorpay.keySecret || 'test_secret_for_unit';
  const orderId = 'order_test123';
  const paymentId = 'pay_test456';
  const good = sign(orderId, paymentId, secret);
  const bad = sign(orderId, paymentId, 'wrong_secret');

  assert(good !== bad, 'signatures should differ');
  assert(
    good === sign(orderId, paymentId, secret),
    'signature must be deterministic',
  );
  assert(good !== sign('order_other', paymentId, secret), 'order id binds sig');

  assert(
    verifyRazorpaySignature({
      razorpayOrderId: orderId,
      razorpayPaymentId: paymentId,
      razorpaySignature: good,
      secret,
    }),
    'timing-safe verify must accept valid signature',
  );
  assert(
    !verifyRazorpaySignature({
      razorpayOrderId: orderId,
      razorpayPaymentId: paymentId,
      razorpaySignature: bad,
      secret,
    }),
    'timing-safe verify must reject invalid signature',
  );
  assert(
    !verifyRazorpaySignature({
      razorpayOrderId: orderId,
      razorpayPaymentId: paymentId,
      razorpaySignature: 'short',
      secret,
    }),
    'timing-safe verify must reject length-mismatched signature',
  );

  assert(
    escapeRegex('a+b(c)') === 'a\\+b\\(c\\)',
    'escapeRegex must escape regex metacharacters',
  );

  console.log('PASS payment signature helpers (timing-safe)');
  console.log('PASS escapeRegex helper');
  if (!env.razorpay.keyId || !env.razorpay.keySecret) {
    console.log(
      'NOTE: Set RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET in .env for live TEST checkout.',
    );
  } else {
    console.log('Razorpay env keys detected (test mode expected).');
  }
};

run();
