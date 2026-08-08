import mongoose from 'mongoose';
import { ORDER_STATUS, PAYMENT_STATUS } from './constants.js';

/**
 * Snapshot of a pizza line item at order time.
 * Prices and customizations are copied so history stays accurate.
 */
const orderItemSchema = new mongoose.Schema(
  {
    pizza: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Pizza',
      default: null,
    },
    itemType: {
      type: String,
      enum: ['custom', 'menu'],
      default: 'custom',
    },
    name: {
      type: String,
      required: [true, 'Pizza name snapshot is required'],
      trim: true,
    },
    image: {
      type: String,
      default: null,
    },
    size: {
      type: String,
      required: [true, 'Size is required'],
      trim: true,
    },
    base: {
      type: String,
      required: [true, 'Base is required'],
      trim: true,
    },
    sauce: {
      type: String,
      required: [true, 'Sauce is required'],
      trim: true,
    },
    cheese: {
      type: String,
      required: [true, 'Cheese is required'],
      trim: true,
    },
    vegetables: {
      type: [{ type: String, trim: true }],
      default: [],
    },
    extraCheese: {
      type: Boolean,
      default: false,
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [1, 'Quantity must be at least 1'],
      max: [50, 'Quantity cannot exceed 50'],
    },
    unitPrice: {
      type: Number,
      required: [true, 'Unit price is required'],
      min: [0, 'Unit price cannot be negative'],
    },
    lineTotal: {
      type: Number,
      required: [true, 'Line total is required'],
      min: [0, 'Line total cannot be negative'],
    },
    labels: {
      size: String,
      base: String,
      sauce: String,
      cheese: String,
      vegetables: [String],
    },
  },
  { _id: false },
);

/**
 * Customer order.
 */
const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      required: [true, 'Order number is required'],
      unique: true,
      uppercase: true,
      trim: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User is required'],
      index: true,
    },
    items: {
      type: [orderItemSchema],
      validate: {
        validator(value) {
          return Array.isArray(value) && value.length > 0;
        },
        message: 'Order must contain at least one item',
      },
    },
    deliveryAddress: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Address',
      required: [true, 'Delivery address is required'],
    },
    /** Immutable address snapshot for delivery history */
    addressSnapshot: {
      fullName: { type: String, required: true, trim: true },
      phone: { type: String, required: true, trim: true },
      street: { type: String, required: true, trim: true },
      landmark: { type: String, default: '', trim: true },
      city: { type: String, required: true, trim: true },
      state: { type: String, required: true, trim: true },
      postalCode: { type: String, required: true, trim: true },
      country: { type: String, required: true, trim: true },
    },
    status: {
      type: String,
      enum: {
        values: Object.values(ORDER_STATUS),
        message: 'Invalid order status',
      },
      default: ORDER_STATUS.PENDING,
      index: true,
    },
    paymentStatus: {
      type: String,
      enum: {
        values: Object.values(PAYMENT_STATUS),
        message: 'Invalid payment status',
      },
      default: PAYMENT_STATUS.PENDING,
      index: true,
    },
    paymentMethod: {
      type: String,
      default: null,
      trim: true,
    },
    coupon: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Coupon',
      default: null,
    },
    couponCode: {
      type: String,
      default: null,
      uppercase: true,
      trim: true,
    },
    pricing: {
      subtotal: {
        type: Number,
        required: true,
        min: [0, 'Subtotal cannot be negative'],
      },
      discount: {
        type: Number,
        default: 0,
        min: [0, 'Discount cannot be negative'],
      },
      deliveryFee: {
        type: Number,
        default: 0,
        min: [0, 'Delivery fee cannot be negative'],
      },
      tax: {
        type: Number,
        default: 0,
        min: [0, 'Tax cannot be negative'],
      },
      total: {
        type: Number,
        required: true,
        min: [0, 'Total cannot be negative'],
      },
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [500, 'Notes cannot exceed 500 characters'],
      default: '',
    },
    estimatedDeliveryAt: {
      type: Date,
      default: null,
    },
    deliveredAt: {
      type: Date,
      default: null,
    },
    cancelledAt: {
      type: Date,
      default: null,
    },
    cancellationReason: {
      type: String,
      trim: true,
      maxlength: [300, 'Cancellation reason cannot exceed 300 characters'],
      default: null,
    },
    assignedAdmin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
      default: null,
    },
    /** Idempotency: stock decremented only once after successful payment */
    inventoryDeducted: {
      type: Boolean,
      default: false,
      index: true,
    },
    inventoryDeductedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

orderSchema.index({ createdAt: -1 });
orderSchema.index({ user: 1, status: 1 });
orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({ orderNumber: 1 });

orderSchema.virtual('payment', {
  ref: 'Payment',
  localField: '_id',
  foreignField: 'order',
  justOne: true,
});

const Order = mongoose.model('Order', orderSchema);

export default Order;
