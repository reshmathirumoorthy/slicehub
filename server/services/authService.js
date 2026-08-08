import User from '../models/User.js';
import ApiError from '../utils/ApiError.js';
import { hashToken } from '../utils/tokenCrypto.js';
import { signToken } from '../utils/jwt.js';
import { AUTH_ACCOUNT_TYPES } from '../models/constants.js';
import {
  getEmailDeliveryMode,
  isSmtpConfigured,
  sendPasswordResetEmail,
  sendVerificationEmail,
} from './emailService.js';
import { notifyNewCustomerRegistered } from './notificationEvents.js';

/** Minimum seconds between verification emails for the same account. */
const VERIFICATION_RESEND_COOLDOWN_SEC = 60;

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

const assertResendCooldown = (user) => {
  if (!user.emailVerificationLastSentAt) return;
  const elapsedMs = Date.now() - new Date(user.emailVerificationLastSentAt).getTime();
  const remainingMs = VERIFICATION_RESEND_COOLDOWN_SEC * 1000 - elapsedMs;
  if (remainingMs > 0) {
    const retryAfterSec = Math.ceil(remainingMs / 1000);
    throw new ApiError(
      429,
      `Please wait ${retryAfterSec} seconds before requesting another verification email.`,
      null,
      'VERIFICATION_COOLDOWN',
    );
  }
};

const dispatchVerificationEmail = async (user, rawToken) => {
  const result = await sendVerificationEmail({
    to: user.email,
    name: user.name,
    token: rawToken,
  });

  user.emailVerificationLastSentAt = new Date();
  await user.save({ validateBeforeSave: false });

  return {
    emailSent: Boolean(result.delivered),
    emailDelivery: result.mode || getEmailDeliveryMode(),
  };
};

export const registerUser = async ({ name, email, password, phone }) => {
  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    throw new ApiError(409, 'An account with this email already exists');
  }

  const user = new User({ name, email, password, phone });
  const verificationToken = user.createEmailVerificationToken();
  user.emailVerificationLastSentAt = new Date();
  await user.save();

  let emailSent = false;
  let emailDelivery = getEmailDeliveryMode();

  try {
    const delivery = await sendVerificationEmail({
      to: user.email,
      name: user.name,
      token: verificationToken,
    });
    emailSent = Boolean(delivery.delivered);
    emailDelivery = delivery.mode || emailDelivery;
  } catch (error) {
    console.error('Failed to send verification email:', error.message);
    emailSent = false;
    emailDelivery = 'send_failed';
  }

  await notifyNewCustomerRegistered(user);

  const baseMessage = emailSent
    ? 'Registration successful. Please check your email to verify your account.'
    : 'Registration successful, but the verification email could not be sent. Configure SMTP (EMAIL_* in server/.env) and use Resend on the verify page.';

  return {
    user: sanitizeUser(user),
    emailSent,
    emailDelivery,
    message: baseMessage,
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
      null,
      'EMAIL_NOT_VERIFIED',
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
  const normalized = String(email || '').toLowerCase().trim();
  const genericMessage =
    'If an account exists for that email, a verification link has been sent.';

  const user = await User.findOne({ email: normalized }).select(
    '+emailVerificationToken +emailVerificationExpires +emailVerificationLastSentAt',
  );

  // Avoid account enumeration for unknown emails
  if (!user) {
    return { message: genericMessage, emailSent: false };
  }

  if (user.isEmailVerified) {
    throw new ApiError(400, 'Email is already verified', null, 'ALREADY_VERIFIED');
  }

  if (!isSmtpConfigured()) {
    throw new ApiError(
      503,
      'Email service is not configured. Set EMAIL_HOST, EMAIL_USER, and EMAIL_PASS (Gmail App Password) in server/.env, then try again.',
      null,
      'SMTP_NOT_CONFIGURED',
    );
  }

  assertResendCooldown(user);

  const verificationToken = user.createEmailVerificationToken();
  await user.save({ validateBeforeSave: false });

  try {
    const delivery = await dispatchVerificationEmail(user, verificationToken);
    return {
      message: genericMessage,
      emailSent: delivery.emailSent,
      emailDelivery: delivery.emailDelivery,
    };
  } catch {
    throw new ApiError(
      503,
      'Failed to send verification email. Check SMTP settings and try again.',
      null,
      'EMAIL_SEND_FAILED',
    );
  }
};

export const forgotPassword = async (email) => {
  const user = await User.findOne({ email: email.toLowerCase() });

  if (user && user.isActive) {
    if (!isSmtpConfigured()) {
      throw new ApiError(
        503,
        'Email service is not configured. Set EMAIL_* in server/.env before resetting passwords.',
        null,
        'SMTP_NOT_CONFIGURED',
      );
    }

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

/**
 * Update authenticated customer profile fields (name, phone).
 * Email is intentionally not editable here to avoid verification bypass.
 */
export const updateCurrentUser = async (userId, { name, phone }) => {
  const user = await User.findById(userId);
  if (!user || !user.isActive) {
    throw new ApiError(404, 'User not found');
  }

  if (name !== undefined) {
    user.name = String(name).trim();
  }
  if (phone !== undefined) {
    user.phone = String(phone).trim();
  }

  await user.save();
  return sanitizeUser(user);
};

export { sanitizeUser, VERIFICATION_RESEND_COOLDOWN_SEC };
