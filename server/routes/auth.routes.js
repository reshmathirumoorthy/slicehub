import { Router } from 'express';
import * as authController from '../controllers/authController.js';
import { protectUser } from '../middleware/auth.js';
import {
  authLimiter,
  authStrictLimiter,
} from '../middleware/rateLimit.js';
import {
  emailValidation,
  loginValidation,
  registerValidation,
  resetPasswordValidation,
  updateProfileValidation,
} from '../middleware/validate.js';

const router = Router();

router.post(
  '/register',
  authLimiter,
  registerValidation,
  authController.register,
);
router.post('/login', authLimiter, loginValidation, authController.login);
router.post('/logout', authController.logout);

router.get('/me', protectUser, authController.getMe);
router.patch(
  '/me',
  protectUser,
  updateProfileValidation,
  authController.updateMe,
);

router.get('/verify-email/:token', authController.verifyEmail);
router.post(
  '/resend-verification',
  authStrictLimiter,
  emailValidation,
  authController.resendVerification,
);

router.post(
  '/forgot-password',
  authStrictLimiter,
  emailValidation,
  authController.forgotPassword,
);
router.post(
  '/reset-password/:token',
  authStrictLimiter,
  resetPasswordValidation,
  authController.resetPassword,
);

export default router;
