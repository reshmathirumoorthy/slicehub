import jwt from 'jsonwebtoken';
import env from '../config/env.js';
import ApiError from './ApiError.js';

/**
 * Signs a JWT for a user or admin account.
 * @param {{ id: string, role: string, accountType: string }} payload
 */
export const signToken = (payload) => {
  return jwt.sign(
    {
      id: payload.id,
      role: payload.role,
      accountType: payload.accountType,
    },
    env.jwt.secret,
    { expiresIn: env.jwt.expiresIn },
  );
};

/**
 * Verifies a JWT and returns the decoded payload.
 */
export const verifyToken = (token) => {
  try {
    return jwt.verify(token, env.jwt.secret);
  } catch {
    throw new ApiError(401, 'Invalid or expired token');
  }
};

/**
 * Cookie options for auth tokens.
 */
export const getAuthCookieOptions = () => ({
  httpOnly: true,
  secure: env.nodeEnv === 'production',
  sameSite: env.nodeEnv === 'production' ? 'strict' : 'lax',
  maxAge: env.jwt.cookieMaxAgeMs,
  path: '/',
});
