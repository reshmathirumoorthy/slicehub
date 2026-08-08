import asyncHandler from '../utils/asyncHandler.js';
import env from '../config/env.js';
import { getAuthCookieOptions } from '../utils/jwt.js';
import * as authService from '../services/authService.js';

const setUserCookie = (res, token) => {
  res.cookie(env.jwt.cookieName, token, getAuthCookieOptions());
};

const clearUserCookie = (res) => {
  res.clearCookie(env.jwt.cookieName, {
    httpOnly: true,
    secure: env.nodeEnv === 'production',
    sameSite: env.nodeEnv === 'production' ? 'strict' : 'lax',
    path: '/',
  });
};

/**
 * POST /api/auth/register
 */
export const register = asyncHandler(async (req, res) => {
  const result = await authService.registerUser(req.body);

  res.status(201).json({
    success: true,
    message: result.message,
    data: { user: result.user },
  });
});

/**
 * POST /api/auth/login
 */
export const login = asyncHandler(async (req, res) => {
  const result = await authService.loginUser(req.body);
  setUserCookie(res, result.token);

  res.status(200).json({
    success: true,
    message: 'Login successful',
    data: {
      token: result.token,
      user: result.user,
    },
  });
});

/**
 * POST /api/auth/logout
 */
export const logout = asyncHandler(async (_req, res) => {
  clearUserCookie(res);

  res.status(200).json({
    success: true,
    message: 'Logged out successfully',
  });
});

/**
 * GET /api/auth/me
 */
export const getMe = asyncHandler(async (req, res) => {
  const user = await authService.getCurrentUser(req.user._id);

  res.status(200).json({
    success: true,
    data: { user },
  });
});

/**
 * GET /api/auth/verify-email/:token
 */
export const verifyEmail = asyncHandler(async (req, res) => {
  const result = await authService.verifyUserEmail(req.params.token);

  res.status(200).json({
    success: true,
    message: result.message,
    data: { user: result.user },
  });
});

/**
 * POST /api/auth/resend-verification
 */
export const resendVerification = asyncHandler(async (req, res) => {
  const result = await authService.resendVerificationEmail(req.body.email);

  res.status(200).json({
    success: true,
    message: result.message,
  });
});

/**
 * POST /api/auth/forgot-password
 */
export const forgotPassword = asyncHandler(async (req, res) => {
  const result = await authService.forgotPassword(req.body.email);

  res.status(200).json({
    success: true,
    message: result.message,
  });
});

/**
 * POST /api/auth/reset-password/:token
 */
export const resetPassword = asyncHandler(async (req, res) => {
  const result = await authService.resetPassword({
    rawToken: req.params.token,
    password: req.body.password,
  });

  res.status(200).json({
    success: true,
    message: result.message,
  });
});
