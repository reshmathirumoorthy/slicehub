import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { ADMIN_ROLES } from './constants.js';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Staff / admin account (separate from customer User).
 */
const adminSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Admin name is required'],
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
    role: {
      type: String,
      enum: {
        values: Object.values(ADMIN_ROLES),
        message: 'Invalid admin role',
      },
      default: ADMIN_ROLES.MANAGER,
      index: true,
    },
    phone: {
      type: String,
      trim: true,
      default: null,
    },
    permissions: {
      type: [String],
      default: [],
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
  },
  {
    timestamps: true,
  },
);

adminSchema.index({ createdAt: -1 });
adminSchema.index({ passwordResetToken: 1 }, { sparse: true });

adminSchema.pre('save', async function hashPassword() {
  // Mongoose 9+ async middleware must not use the legacy `next` callback.
  if (!this.isModified('password')) {
    return;
  }

  this.password = await bcrypt.hash(this.password, 12);
});

adminSchema.methods.comparePassword = async function comparePassword(
  candidatePassword,
) {
  return bcrypt.compare(candidatePassword, this.password);
};

adminSchema.methods.createPasswordResetToken =
  function createPasswordResetToken() {
    const rawToken = crypto.randomBytes(32).toString('hex');

    this.passwordResetToken = crypto
      .createHash('sha256')
      .update(rawToken)
      .digest('hex');
    this.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000);

    return rawToken;
  };

const Admin = mongoose.model('Admin', adminSchema);

export default Admin;
