import asyncHandler from '../utils/asyncHandler.js';
import env from '../config/env.js';
import { getAuthCookieOptions } from '../utils/jwt.js';
import * as adminAuthService from '../services/adminAuthService.js';

const setAdminCookie = (res, token) => {
  res.cookie(env.jwt.adminCookieName, token, getAuthCookieOptions());
};

const clearAdminCookie = (res) => {
  res.clearCookie(env.jwt.adminCookieName, {
    httpOnly: true,
    secure: env.nodeEnv === 'production',
    sameSite: env.nodeEnv === 'production' ? 'strict' : 'lax',
    path: '/',
  });
};

/**
 * POST /api/admin/auth/login
 */
export const login = asyncHandler(async (req, res) => {
  const result = await adminAuthService.loginAdmin(req.body);
  setAdminCookie(res, result.token);

  res.status(200).json({
    success: true,
    message: 'Admin login successful',
    data: {
      token: result.token,
      admin: result.admin,
    },
  });
});

/**
 * POST /api/admin/auth/logout
 */
export const logout = asyncHandler(async (_req, res) => {
  clearAdminCookie(res);

  res.status(200).json({
    success: true,
    message: 'Admin logged out successfully',
  });
});

/**
 * GET /api/admin/auth/me
 */
export const getMe = asyncHandler(async (req, res) => {
  const admin = await adminAuthService.getCurrentAdmin(req.admin._id);

  res.status(200).json({
    success: true,
    data: { admin },
  });
});

/**
 * POST /api/admin/auth/forgot-password
 */
export const forgotPassword = asyncHandler(async (req, res) => {
  const result = await adminAuthService.forgotAdminPassword(req.body.email);

  res.status(200).json({
    success: true,
    message: result.message,
  });
});

/**
 * POST /api/admin/auth/reset-password/:token
 */
export const resetPassword = asyncHandler(async (req, res) => {
  const result = await adminAuthService.resetAdminPassword({
    rawToken: req.params.token,
    password: req.body.password,
  });

  res.status(200).json({
    success: true,
    message: result.message,
  });
});
