import User from '../models/User.js';
import Admin from '../models/Admin.js';
import env from '../config/env.js';
import ApiError from '../utils/ApiError.js';
import { verifyToken } from '../utils/jwt.js';
import { AUTH_ACCOUNT_TYPES } from '../models/constants.js';

const extractToken = (req, cookieName) => {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }
  return req.cookies?.[cookieName] || null;
};

/**
 * Requires a valid customer JWT (Bearer or cookie).
 */
export const protectUser = async (req, _res, next) => {
  try {
    const token = extractToken(req, env.jwt.cookieName);
    if (!token) {
      throw new ApiError(401, 'Authentication required');
    }

    const decoded = verifyToken(token);
    if (decoded.accountType !== AUTH_ACCOUNT_TYPES.USER) {
      throw new ApiError(403, 'Customer access only');
    }

    const user = await User.findById(decoded.id);
    if (!user || !user.isActive) {
      throw new ApiError(401, 'User not found or inactive');
    }

    req.user = user;
    req.accountType = AUTH_ACCOUNT_TYPES.USER;
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Requires a valid admin JWT (Bearer or cookie).
 */
export const protectAdmin = async (req, _res, next) => {
  try {
    const token = extractToken(req, env.jwt.adminCookieName);
    if (!token) {
      throw new ApiError(401, 'Admin authentication required');
    }

    const decoded = verifyToken(token);
    if (decoded.accountType !== AUTH_ACCOUNT_TYPES.ADMIN) {
      throw new ApiError(403, 'Admin access only');
    }

    const admin = await Admin.findById(decoded.id);
    if (!admin || !admin.isActive) {
      throw new ApiError(401, 'Admin not found or inactive');
    }

    req.admin = admin;
    req.accountType = AUTH_ACCOUNT_TYPES.ADMIN;
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Attaches customer if a valid user token is present; otherwise continues.
 */
export const optionalUser = async (req, _res, next) => {
  try {
    const token = extractToken(req, env.jwt.cookieName);
    if (!token) {
      return next();
    }

    const decoded = verifyToken(token);
    if (decoded.accountType !== AUTH_ACCOUNT_TYPES.USER) {
      return next();
    }

    const user = await User.findById(decoded.id);
    if (user?.isActive) {
      req.user = user;
      req.accountType = AUTH_ACCOUNT_TYPES.USER;
    }
    return next();
  } catch {
    return next();
  }
};

/**
 * Attaches admin if a valid admin token is present; otherwise continues.
 */
export const optionalAdmin = async (req, _res, next) => {
  try {
    const token = extractToken(req, env.jwt.adminCookieName);
    if (!token) {
      return next();
    }

    const decoded = verifyToken(token);
    if (decoded.accountType !== AUTH_ACCOUNT_TYPES.ADMIN) {
      return next();
    }

    const admin = await Admin.findById(decoded.id);
    if (admin?.isActive) {
      req.admin = admin;
      req.accountType = AUTH_ACCOUNT_TYPES.ADMIN;
    }
    return next();
  } catch {
    return next();
  }
};

/**
 * Role-based authorization for admins.
 * Usage: authorizeAdmin('super_admin', 'manager')
 */
export const authorizeAdmin =
  (...allowedRoles) =>
  (req, _res, next) => {
    if (!req.admin) {
      return next(new ApiError(401, 'Admin authentication required'));
    }

    if (allowedRoles.length > 0 && !allowedRoles.includes(req.admin.role)) {
      return next(
        new ApiError(403, 'You do not have permission to perform this action'),
      );
    }

    return next();
  };

/**
 * Ensures the authenticated customer has verified their email.
 */
export const requireVerifiedEmail = (req, _res, next) => {
  if (!req.user?.isEmailVerified) {
    return next(
      new ApiError(403, 'Please verify your email before continuing'),
    );
  }
  return next();
};
