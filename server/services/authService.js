import User from '../models/User.js';
import ApiError from '../utils/ApiError.js';
import { hashToken } from '../utils/tokenCrypto.js';
import { signToken } from '../utils/jwt.js';
import { AUTH_ACCOUNT_TYPES } from '../models/constants.js';
import {
  sendPasswordResetEmail,
  sendVerificationEmail,
} from './emailService.js';
import { notifyNewCustomerRegistered } from './notificationEvents.js';

const sanitizeUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  phone: user.phone,
  role: user.role,
  avatar: user.avatar,
  isEmailVerified: user.isEmailVerified,
  isActive: user.isActive,
  lastLoginAt: user.lastLoginAt,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

const issueUserAuth = async (user) => {
  user.lastLoginAt = new Date();
  await user.save({ validateBeforeSave: false });

  const token = signToken({
    id: user._id.toString(),
    role: user.role,
    accountType: AUTH_ACCOUNT_TYPES.USER,
  });

  return { token, user: sanitizeUser(user) };
};

export const registerUser = async ({ name, email, password, phone }) => {
  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    throw new ApiError(409, 'An account with this email already exists');
  }

  const user = new User({ name, email, password, phone });
  const verificationToken = user.createEmailVerificationToken();
  await user.save();

  try {
    await sendVerificationEmail({
      to: user.email,
      name: user.name,
      token: verificationToken,
    });
  } catch (error) {
    console.error('Failed to send verification email:', error.message);
  }

  await notifyNewCustomerRegistered(user);

  return {
    user: sanitizeUser(user),
    message:
      'Registration successful. Please check your email to verify your account.',
  };
};

export const loginUser = async ({ email, password }) => {
  const user = await User.findOne({ email: email.toLowerCase() }).select(
    '+password',
  );

  if (!user || !(await user.comparePassword(password))) {
    throw new ApiError(401, 'Invalid email or password');
  }

  if (!user.isActive) {
    throw new ApiError(403, 'Your account has been deactivated');
  }

  if (!user.isEmailVerified) {
    throw new ApiError(
      403,
      'Please verify your email before logging in',
    );
  }

  return issueUserAuth(user);
};

export const verifyUserEmail = async (rawToken) => {
  if (!rawToken) {
    throw new ApiError(400, 'Verification token is required');
  }

  const hashed = hashToken(rawToken);
  const user = await User.findOne({
    emailVerificationToken: hashed,
    emailVerificationExpires: { $gt: new Date() },
  }).select('+emailVerificationToken +emailVerificationExpires');

  if (!user) {
    throw new ApiError(400, 'Invalid or expired verification token');
  }

  user.isEmailVerified = true;
  user.emailVerificationToken = null;
  user.emailVerificationExpires = null;
  await user.save({ validateBeforeSave: false });

  return {
    user: sanitizeUser(user),
    message: 'Email verified successfully. You can now log in.',
  };
};

export const resendVerificationEmail = async (email) => {
  const user = await User.findOne({ email: email.toLowerCase() });

  // Avoid account enumeration
  if (!user) {
    return {
      message:
        'If an account exists for that email, a verification link has been sent.',
    };
  }

  if (user.isEmailVerified) {
    throw new ApiError(400, 'Email is already verified');
  }

  const verificationToken = user.createEmailVerificationToken();
  await user.save({ validateBeforeSave: false });

  await sendVerificationEmail({
    to: user.email,
    name: user.name,
    token: verificationToken,
  });

  return {
    message:
      'If an account exists for that email, a verification link has been sent.',
  };
};

export const forgotPassword = async (email) => {
  const user = await User.findOne({ email: email.toLowerCase() });

  if (user && user.isActive) {
    const resetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });

    try {
      await sendPasswordResetEmail({
        to: user.email,
        name: user.name,
        token: resetToken,
      });
    } catch {
      user.passwordResetToken = null;
      user.passwordResetExpires = null;
      await user.save({ validateBeforeSave: false });
      throw new ApiError(500, 'Failed to send password reset email');
    }
  }

  return {
    message:
      'If an account exists for that email, a password reset link has been sent.',
  };
};

export const resetPassword = async ({ rawToken, password }) => {
  if (!rawToken) {
    throw new ApiError(400, 'Reset token is required');
  }

  const hashed = hashToken(rawToken);
  const user = await User.findOne({
    passwordResetToken: hashed,
    passwordResetExpires: { $gt: new Date() },
  }).select('+passwordResetToken +passwordResetExpires');

  if (!user) {
    throw new ApiError(400, 'Invalid or expired password reset token');
  }

  user.password = password;
  user.passwordResetToken = null;
  user.passwordResetExpires = null;
  await user.save();

  return {
    message: 'Password reset successful. You can now log in.',
  };
};

export const getCurrentUser = async (userId) => {
  const user = await User.findById(userId);
  if (!user || !user.isActive) {
    throw new ApiError(404, 'User not found');
  }
  return sanitizeUser(user);
};

export { sanitizeUser };
