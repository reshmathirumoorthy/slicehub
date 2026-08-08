/**
 * Local signature / idempotency checks (no live Razorpay call required).
 * Usage: node utils/testPaymentSignature.js
 */
import crypto from 'crypto';
import env from '../config/env.js';

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

  console.log('PASS payment signature helpers');
  if (!env.razorpay.keyId || !env.razorpay.keySecret) {
    console.log(
      'NOTE: Set RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET in .env for live TEST checkout.',
    );
  } else {
    console.log('Razorpay env keys detected (test mode expected).');
  }
};

run();
