import Admin from '../models/Admin.js';
import ApiError from '../utils/ApiError.js';
import { hashToken } from '../utils/tokenCrypto.js';
import { signToken } from '../utils/jwt.js';
import { AUTH_ACCOUNT_TYPES } from '../models/constants.js';
import { sendPasswordResetEmail } from './emailService.js';

const sanitizeAdmin = (admin) => ({
  id: admin._id,
  name: admin.name,
  email: admin.email,
  phone: admin.phone,
  role: admin.role,
  permissions: admin.permissions,
  isActive: admin.isActive,
  lastLoginAt: admin.lastLoginAt,
  createdAt: admin.createdAt,
  updatedAt: admin.updatedAt,
});

export const loginAdmin = async ({ email, password }) => {
  const admin = await Admin.findOne({ email: email.toLowerCase() }).select(
    '+password',
  );

  if (!admin || !(await admin.comparePassword(password))) {
    throw new ApiError(401, 'Invalid email or password');
  }

  if (!admin.isActive) {
    throw new ApiError(403, 'Your admin account has been deactivated');
  }

  admin.lastLoginAt = new Date();
  await admin.save({ validateBeforeSave: false });

  const token = signToken({
    id: admin._id.toString(),
    role: admin.role,
    accountType: AUTH_ACCOUNT_TYPES.ADMIN,
  });

  return { token, admin: sanitizeAdmin(admin) };
};

export const forgotAdminPassword = async (email) => {
  const admin = await Admin.findOne({ email: email.toLowerCase() });

  if (admin && admin.isActive) {
    const resetToken = admin.createPasswordResetToken();
    await admin.save({ validateBeforeSave: false });

    try {
      await sendPasswordResetEmail({
        to: admin.email,
        name: admin.name,
        token: resetToken,
        isAdmin: true,
      });
    } catch {
      admin.passwordResetToken = null;
      admin.passwordResetExpires = null;
      await admin.save({ validateBeforeSave: false });
      throw new ApiError(500, 'Failed to send password reset email');
    }
  }

  return {
    message:
      'If an admin account exists for that email, a password reset link has been sent.',
  };
};

export const resetAdminPassword = async ({ rawToken, password }) => {
  if (!rawToken) {
    throw new ApiError(400, 'Reset token is required');
  }

  const hashed = hashToken(rawToken);
  const admin = await Admin.findOne({
    passwordResetToken: hashed,
    passwordResetExpires: { $gt: new Date() },
  }).select('+passwordResetToken +passwordResetExpires');

  if (!admin) {
    throw new ApiError(400, 'Invalid or expired password reset token');
  }

  admin.password = password;
  admin.passwordResetToken = null;
  admin.passwordResetExpires = null;
  await admin.save();

  return {
    message: 'Password reset successful. You can now log in.',
  };
};

export const getCurrentAdmin = async (adminId) => {
  const admin = await Admin.findById(adminId);
  if (!admin || !admin.isActive) {
    throw new ApiError(404, 'Admin not found');
  }
  return sanitizeAdmin(admin);
};

export { sanitizeAdmin };
