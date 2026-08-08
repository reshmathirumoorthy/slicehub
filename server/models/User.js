import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { USER_ROLES } from './constants.js';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phoneRegex = /^[0-9+\-\s()]{7,20}$/;

/**
 * Customer account with auth token fields for verification & password reset.
 */
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [80, 'Name cannot exceed 80 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [emailRegex, 'Please provide a valid email address'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false,
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
      match: [phoneRegex, 'Please provide a valid phone number'],
    },
    role: {
      type: String,
      enum: {
        values: Object.values(USER_ROLES),
        message: 'Invalid user role',
      },
      default: USER_ROLES.CUSTOMER,
    },
    avatar: {
      type: String,
      default: null,
      trim: true,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    emailVerificationToken: {
      type: String,
      select: false,
      default: null,
    },
    emailVerificationExpires: {
      type: Date,
      select: false,
      default: null,
    },
    passwordResetToken: {
      type: String,
      select: false,
      default: null,
    },
    passwordResetExpires: {
      type: Date,
      select: false,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    lastLoginAt: {
      type: Date,
      default: null,
    },
    notificationPreferences: {
      orderEmails: {
        type: Boolean,
        default: true,
      },
      reviewEmails: {
        type: Boolean,
        default: false,
      },
      promoEmails: {
        type: Boolean,
        default: false,
      },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

userSchema.index({ phone: 1 });
userSchema.index({ createdAt: -1 });
userSchema.index({ emailVerificationToken: 1 }, { sparse: true });
userSchema.index({ passwordResetToken: 1 }, { sparse: true });

userSchema.virtual('addresses', {
  ref: 'Address',
  localField: '_id',
  foreignField: 'user',
});

userSchema.virtual('orders', {
  ref: 'Order',
  localField: '_id',
  foreignField: 'user',
});

userSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('password')) {
    return next();
  }

  this.password = await bcrypt.hash(this.password, 12);
  return next();
});

userSchema.methods.comparePassword = async function comparePassword(
  candidatePassword,
) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.createEmailVerificationToken =
  function createEmailVerificationToken() {
    const rawToken = crypto.randomBytes(32).toString('hex');

    this.emailVerificationToken = crypto
      .createHash('sha256')
      .update(rawToken)
      .digest('hex');
    this.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    return rawToken;
  };

userSchema.methods.createPasswordResetToken =
  function createPasswordResetToken() {
    const rawToken = crypto.randomBytes(32).toString('hex');

    this.passwordResetToken = crypto
      .createHash('sha256')
      .update(rawToken)
      .digest('hex');
    this.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000);

    return rawToken;
  };

const User = mongoose.model('User', userSchema);

export default User;
