/**
 * Phase 15 offline order-tracking helpers (no Mongo required).
 * Usage: node utils/testOrderTracking.js
 */
import { ORDER_STATUS } from '../models/constants.js';

const STATUS_FLOW = [
  ORDER_STATUS.PENDING,
  ORDER_STATUS.CONFIRMED,
  ORDER_STATUS.PREPARING,
  ORDER_STATUS.BAKING,
  ORDER_STATUS.OUT_FOR_DELIVERY,
  ORDER_STATUS.DELIVERED,
];

const assert = (ok, msg) => {
  if (!ok) throw new Error(msg);
};

const canTransition = (from, to) => {
  if (from === to) return true; // idempotent
  if (from === ORDER_STATUS.CANCELLED) return false;
  if (from === ORDER_STATUS.DELIVERED && to !== ORDER_STATUS.DELIVERED) {
    return false;
  }
  if (to === ORDER_STATUS.CANCELLED) return true;
  const fromIdx = STATUS_FLOW.indexOf(from);
  const toIdx = STATUS_FLOW.indexOf(to);
  if (fromIdx < 0 || toIdx < 0) return false;
  return toIdx > fromIdx;
};

const run = () => {
  assert(STATUS_FLOW.includes(ORDER_STATUS.BAKING), 'baking in flow');
  assert(!STATUS_FLOW.includes('ready'), 'no invented ready status');
  assert(canTransition('pending', 'confirmed'), 'forward ok');
  assert(canTransition('pending', 'baking'), 'skip forward ok');
  assert(!canTransition('baking', 'pending'), 'backward blocked');
  assert(!canTransition('delivered', 'baking'), 'delivered final');
  assert(canTransition('preparing', 'cancelled'), 'cancel allowed');
  assert(canTransition('baking', 'baking'), 'same status idempotent');

  console.log('PASS Phase 15 order tracking transition rules');
};

run();
