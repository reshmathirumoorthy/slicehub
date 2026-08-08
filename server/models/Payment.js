import mongoose from 'mongoose';
import { PAYMENT_METHODS, PAYMENT_STATUS } from './constants.js';

/**
 * Payment record linked to an order.
 */
const paymentSchema = new mongoose.Schema(
  {
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: [true, 'Order is required'],
      unique: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User is required'],
      index: true,
    },
    method: {
      type: String,
      enum: {
        values: Object.values(PAYMENT_METHODS),
        message: 'Invalid payment method',
      },
      required: [true, 'Payment method is required'],
    },
    amount: {
      type: Number,
      required: [true, 'Payment amount is required'],
      min: [0, 'Amount cannot be negative'],
    },
    /** Authoritative amount in paise for Razorpay */
    amountPaise: {
      type: Number,
      default: null,
      min: [0, 'Amount in paise cannot be negative'],
    },
    currency: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
      default: 'INR',
      maxlength: [3, 'Currency must be a 3-letter code'],
    },
    status: {
      type: String,
      enum: {
        values: Object.values(PAYMENT_STATUS),
        message: 'Invalid payment status',
      },
      default: PAYMENT_STATUS.CREATED,
      index: true,
    },
    transactionId: {
      type: String,
      trim: true,
      default: null,
      sparse: true,
      unique: true,
    },
    razorpayOrderId: {
      type: String,
      trim: true,
      default: null,
      index: true,
      sparse: true,
    },
    razorpayPaymentId: {
      type: String,
      trim: true,
      default: null,
      sparse: true,
      unique: true,
    },
    razorpaySignature: {
      type: String,
      trim: true,
      default: null,
      select: false,
    },
    gateway: {
      type: String,
      trim: true,
      default: null,
      maxlength: [60, 'Gateway name cannot exceed 60 characters'],
    },
    gatewayResponse: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    paidAt: {
      type: Date,
      default: null,
    },
    refundedAt: {
      type: Date,
      default: null,
    },
    refundAmount: {
      type: Number,
      default: 0,
      min: [0, 'Refund amount cannot be negative'],
    },
    failureReason: {
      type: String,
      trim: true,
      maxlength: [300, 'Failure reason cannot exceed 300 characters'],
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

paymentSchema.index({ status: 1, createdAt: -1 });
paymentSchema.index({ user: 1, createdAt: -1 });

const Payment = mongoose.model('Payment', paymentSchema);

export default Payment;
