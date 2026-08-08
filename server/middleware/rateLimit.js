import rateLimit from 'express-rate-limit';

const jsonMessage = (message) => ({
  success: false,
  message,
});

/**
 * Broader limiter for auth registration / login surfaces.
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 40,
  standardHeaders: true,
  legacyHeaders: false,
  message: jsonMessage('Too many authentication attempts. Please try again later.'),
});

/**
 * Stricter limiter for password reset / forgot-password.
 */
export const authStrictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: jsonMessage('Too many password reset attempts. Please try again later.'),
});

/**
 * Payment verify / create-order abuse protection.
 */
export const paymentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: jsonMessage('Too many payment requests. Please try again later.'),
});
