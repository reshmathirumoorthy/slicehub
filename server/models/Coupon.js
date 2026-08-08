import mongoose from 'mongoose';
import { COUPON_TYPES } from './constants.js';

/**
 * Discount coupon applied to orders.
 */
const couponSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: [true, 'Coupon code is required'],
      unique: true,
      uppercase: true,
      trim: true,
      minlength: [3, 'Coupon code must be at least 3 characters'],
      maxlength: [30, 'Coupon code cannot exceed 30 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [250, 'Description cannot exceed 250 characters'],
      default: '',
    },
    discountType: {
      type: String,
      enum: {
        values: Object.values(COUPON_TYPES),
        message: 'Invalid coupon type',
      },
      required: [true, 'Discount type is required'],
    },
    discountValue: {
      type: Number,
      required: [true, 'Discount value is required'],
      min: [0, 'Discount value cannot be negative'],
    },
    minOrderAmount: {
      type: Number,
      default: 0,
      min: [0, 'Minimum order amount cannot be negative'],
    },
    maxDiscountAmount: {
      type: Number,
      default: null,
      min: [0, 'Max discount amount cannot be negative'],
    },
    startDate: {
      type: Date,
      required: [true, 'Start date is required'],
    },
    endDate: {
      type: Date,
      required: [true, 'End date is required'],
      validate: {
        validator(value) {
          return !this.startDate || value > this.startDate;
        },
        message: 'End date must be after start date',
      },
    },
    usageLimit: {
      type: Number,
      default: null,
      min: [1, 'Usage limit must be at least 1'],
    },
    usedCount: {
      type: Number,
      default: 0,
      min: [0, 'Used count cannot be negative'],
    },
    perUserLimit: {
      type: Number,
      default: 1,
      min: [1, 'Per-user limit must be at least 1'],
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

couponSchema.index({ startDate: 1, endDate: 1 });
couponSchema.index({ isActive: 1, code: 1 });

couponSchema.pre('validate', function ensurePercentageBounds() {
  // Mongoose 9+ does not pass a `next` callback to document middleware.
  if (
    this.discountType === COUPON_TYPES.PERCENTAGE &&
    this.discountValue > 100
  ) {
    this.invalidate(
      'discountValue',
      'Percentage discount cannot exceed 100',
    );
  }
});

const Coupon = mongoose.model('Coupon', couponSchema);

export default Coupon;
