import { Router } from 'express';
import * as authController from '../controllers/authController.js';
import { protectUser } from '../middleware/auth.js';
import {
  emailValidation,
  loginValidation,
  registerValidation,
  resetPasswordValidation,
} from '../middleware/validate.js';

const router = Router();

router.post('/register', registerValidation, authController.register);
router.post('/login', loginValidation, authController.login);
router.post('/logout', authController.logout);

router.get('/me', protectUser, authController.getMe);

router.get('/verify-email/:token', authController.verifyEmail);
router.post(
  '/resend-verification',
  emailValidation,
  authController.resendVerification,
);

router.post('/forgot-password', emailValidation, authController.forgotPassword);
router.post(
  '/reset-password/:token',
  resetPasswordValidation,
  authController.resetPassword,
);

export default router;
