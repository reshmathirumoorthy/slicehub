import mongoose from 'mongoose';
import {
  NOTIFICATION_AUDIENCE,
  NOTIFICATION_TYPES,
} from './constants.js';

/**
 * In-app notification for customers or admins.
 */
const notificationSchema = new mongoose.Schema(
  {
    audience: {
      type: String,
      enum: {
        values: Object.values(NOTIFICATION_AUDIENCE),
        message: 'Invalid notification audience',
      },
      required: [true, 'Audience is required'],
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
      default: null,
      index: true,
    },
    type: {
      type: String,
      enum: {
        values: Object.values(NOTIFICATION_TYPES),
        message: 'Invalid notification type',
      },
      required: [true, 'Notification type is required'],
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [120, 'Title cannot exceed 120 characters'],
    },
    message: {
      type: String,
      required: [true, 'Message is required'],
      trim: true,
      maxlength: [1000, 'Message cannot exceed 1000 characters'],
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      default: null,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    /**
     * Idempotency key, e.g. user:<id>:order:<id>:status:delivered
     * Sparse unique — prevents duplicate event notifications.
     */
    eventKey: {
      type: String,
      default: null,
      trim: true,
      maxlength: [200, 'eventKey cannot exceed 200 characters'],
    },
    link: {
      type: String,
      default: null,
      trim: true,
      maxlength: [300, 'Link cannot exceed 300 characters'],
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
    readAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

notificationSchema.index({ audience: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ user: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ admin: 1, isRead: 1, createdAt: -1 });
notificationSchema.index(
  { eventKey: 1 },
  { unique: true, sparse: true },
);

notificationSchema.pre('validate', function requireRecipient() {
  // Mongoose 9+ does not pass a `next` callback to document middleware.
  if (this.audience === NOTIFICATION_AUDIENCE.USER && !this.user) {
    this.invalidate('user', 'User is required for user notifications');
  }
  if (this.audience === NOTIFICATION_AUDIENCE.ADMIN && !this.admin) {
    this.invalidate('admin', 'Admin is required for admin notifications');
  }
});

const Notification = mongoose.model('Notification', notificationSchema);

export default Notification;
