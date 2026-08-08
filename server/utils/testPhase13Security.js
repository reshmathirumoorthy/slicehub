/**
 * Phase 13 offline security helpers (no Mongo / live HTTP required).
 * Usage: node utils/testPhase13Security.js
 */
import { escapeRegex } from './escapeRegex.js';
import { verifyRazorpaySignature } from './razorpaySignature.js';
import crypto from 'crypto';

const assert = (ok, msg) => {
  if (!ok) throw new Error(msg);
};

const sign = (orderId, paymentId, secret) =>
  crypto
    .createHmac('sha256', secret)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');

const run = () => {
  assert(escapeRegex('.*') === '\\.\\*', 'escape .*');
  assert(escapeRegex('(a|b)+') === '\\(a\\|b\\)\\+', 'escape groups');

  const secret = 'phase13_test_secret';
  const good = sign('order_1', 'pay_1', secret);
  assert(
    verifyRazorpaySignature({
      razorpayOrderId: 'order_1',
      razorpayPaymentId: 'pay_1',
      razorpaySignature: good,
      secret,
    }),
    'valid signature',
  );
  assert(
    !verifyRazorpaySignature({
      razorpayOrderId: 'order_1',
      razorpayPaymentId: 'pay_1',
      razorpaySignature: '0'.repeat(good.length),
      secret,
    }),
    'invalid signature',
  );

  console.log('PASS Phase 13 offline security checks');
};

run();
