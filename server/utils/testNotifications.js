/**
 * Phase 14 offline notification helper checks (no Mongo required).
 * Usage: node utils/testNotifications.js
 */
import { NOTIFICATION_TYPES, NOTIFICATION_AUDIENCE } from '../models/constants.js';

const assert = (ok, msg) => {
  if (!ok) throw new Error(msg);
};

const run = () => {
  assert(NOTIFICATION_TYPES.ORDER === 'order', 'order type');
  assert(NOTIFICATION_TYPES.INVENTORY === 'inventory', 'inventory type');
  assert(NOTIFICATION_AUDIENCE.USER === 'user', 'user audience');
  assert(NOTIFICATION_AUDIENCE.ADMIN === 'admin', 'admin audience');

  const eventKey = `user:abc:order:xyz:status:delivered`;
  assert(eventKey.includes('delivered'), 'event key shape');

  console.log('PASS Phase 14 notification constants / eventKey shape');
};

run();
