import crypto from 'crypto';

/**
 * SHA-256 hash for one-time email / reset tokens stored in the database.
 */
export const hashToken = (rawToken) =>
  crypto.createHash('sha256').update(rawToken).digest('hex');
