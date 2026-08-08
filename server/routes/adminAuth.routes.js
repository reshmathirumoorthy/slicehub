import { Router } from 'express';
import * as adminAuthController from '../controllers/adminAuthController.js';
import { protectAdmin, authorizeAdmin } from '../middleware/auth.js';
import { ADMIN_ROLES } from '../models/constants.js';
import {
  emailValidation,
  loginValidation,
  resetPasswordValidation,
} from '../middleware/validate.js';

const router = Router();

router.post('/login', loginValidation, adminAuthController.login);
router.post('/logout', adminAuthController.logout);

router.get('/me', protectAdmin, adminAuthController.getMe);

/** Example RBAC-protected probe for admin roles */
router.get(
  '/roles/check',
  protectAdmin,
  authorizeAdmin(
    ADMIN_ROLES.SUPER_ADMIN,
    ADMIN_ROLES.MANAGER,
    ADMIN_ROLES.SUPPORT,
  ),
  (req, res) => {
    res.status(200).json({
      success: true,
      message: 'Admin role authorized',
      data: {
        role: req.admin.role,
        permissions: req.admin.permissions,
      },
    });
  },
);

router.post(
  '/forgot-password',
  emailValidation,
  adminAuthController.forgotPassword,
);
router.post(
  '/reset-password/:token',
  resetPasswordValidation,
  adminAuthController.resetPassword,
);

export default router;
