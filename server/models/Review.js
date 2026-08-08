import mongoose from 'mongoose';

/**
 * Customer review for a pizza (optionally tied to a completed order).
 */
const reviewSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User is required'],
      index: true,
    },
    pizza: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Pizza',
      required: [true, 'Pizza is required'],
      index: true,
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      default: null,
      index: true,
    },
    rating: {
      type: Number,
      required: [true, 'Rating is required'],
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot exceed 5'],
    },
    title: {
      type: String,
      trim: true,
      maxlength: [100, 'Title cannot exceed 100 characters'],
      default: '',
    },
    comment: {
      type: String,
      required: [true, 'Review comment is required'],
      trim: true,
      minlength: [5, 'Comment must be at least 5 characters'],
      maxlength: [1000, 'Comment cannot exceed 1000 characters'],
    },
    isApproved: {
      type: Boolean,
      default: true,
      index: true,
    },
    isVisible: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  },
);

/** One review per user per pizza (prevents spam duplicates). */
reviewSchema.index({ user: 1, pizza: 1 }, { unique: true });
reviewSchema.index({ pizza: 1, isApproved: 1, createdAt: -1 });
reviewSchema.index({ rating: -1 });

const Review = mongoose.model('Review', reviewSchema);

export default Review;
