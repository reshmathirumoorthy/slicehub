import mongoose from 'mongoose';
import Review from '../models/Review.js';
import Pizza from '../models/Pizza.js';
import Order from '../models/Order.js';
import User from '../models/User.js';
import ApiError from '../utils/ApiError.js';
import { assertValidObjectId } from '../utils/menuValidation.js';
import { escapeRegex } from '../utils/escapeRegex.js';
import {
  ORDER_STATUS,
  PAYMENT_STATUS,
} from '../models/constants.js';

const COMMENT_MIN = 5;
const COMMENT_MAX = 1000;
const TITLE_MAX = 100;

const visibleMatch = {
  isVisible: true,
  isApproved: true,
};

/**
 * Orders that prove the customer purchased this menu pizza.
 */
const purchasedOrderFilter = (userId, pizzaId) => ({
  user: userId,
  status: { $ne: ORDER_STATUS.CANCELLED },
  paymentStatus: { $ne: PAYMENT_STATUS.REFUNDED },
  items: {
    $elemMatch: {
      pizza: new mongoose.Types.ObjectId(String(pizzaId)),
    },
  },
  $or: [
    { paymentStatus: PAYMENT_STATUS.PAID },
    { status: ORDER_STATUS.DELIVERED },
  ],
});

const sanitizePublicReview = (review) => ({
  id: review._id.toString(),
  rating: review.rating,
  title: review.title || '',
  comment: review.comment,
  createdAt: review.createdAt,
  updatedAt: review.updatedAt,
  user: {
    id: review.user?._id?.toString?.() || review.user?.toString?.() || null,
    name: review.user?.name || 'Customer',
  },
  pizza: review.pizza
    ? {
        id:
          review.pizza._id?.toString?.() ||
          review.pizza.toString?.() ||
          null,
        name: review.pizza.name || undefined,
      }
    : undefined,
});

const sanitizeOwnReview = (review) => ({
  ...sanitizePublicReview(review),
  orderId: review.order ? review.order.toString() : null,
  isVisible: review.isVisible,
  isApproved: review.isApproved,
});

const sanitizeAdminReview = (review) => ({
  id: review._id.toString(),
  rating: review.rating,
  title: review.title || '',
  comment: review.comment,
  isVisible: review.isVisible,
  isApproved: review.isApproved,
  createdAt: review.createdAt,
  updatedAt: review.updatedAt,
  orderId: review.order?._id?.toString?.() || review.order?.toString?.() || null,
  user: {
    id: review.user?._id?.toString?.() || null,
    name: review.user?.name || 'Customer',
    email: review.user?.email || null,
  },
  pizza: {
    id: review.pizza?._id?.toString?.() || null,
    name: review.pizza?.name || 'Unknown pizza',
  },
});

const parseRating = (value) => {
  const rating = Number(value);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    throw new ApiError(400, 'Rating must be an integer between 1 and 5');
  }
  return rating;
};

const parseComment = (value) => {
  const comment = String(value || '').trim();
  if (!comment) {
    throw new ApiError(400, 'Review text is required');
  }
  if (comment.length < COMMENT_MIN) {
    throw new ApiError(
      400,
      `Review text must be at least ${COMMENT_MIN} characters`,
    );
  }
  if (comment.length > COMMENT_MAX) {
    throw new ApiError(
      400,
      `Review text cannot exceed ${COMMENT_MAX} characters`,
    );
  }
  return comment;
};

const parseTitle = (value) => {
  if (value == null || value === '') return '';
  const title = String(value).trim();
  if (title.length > TITLE_MAX) {
    throw new ApiError(400, `Title cannot exceed ${TITLE_MAX} characters`);
  }
  return title;
};

/**
 * Recalculate denormalized pizza rating fields from visible reviews.
 */
export const refreshPizzaRatingStats = async (pizzaId) => {
  const id = new mongoose.Types.ObjectId(String(pizzaId));
  const [stats] = await Review.aggregate([
    { $match: { pizza: id, ...visibleMatch } },
    {
      $group: {
        _id: null,
        averageRating: { $avg: '$rating' },
        reviewCount: { $sum: 1 },
      },
    },
  ]);

  const averageRating = stats
    ? Math.round((stats.averageRating || 0) * 10) / 10
    : 0;
  const reviewCount = stats?.reviewCount || 0;

  await Pizza.findByIdAndUpdate(id, { averageRating, reviewCount });
  return { averageRating, reviewCount };
};

export const getRatingSummary = async (pizzaId) => {
  assertValidObjectId(pizzaId, 'pizza ID');
  const id = new mongoose.Types.ObjectId(String(pizzaId));

  const [agg] = await Review.aggregate([
    { $match: { pizza: id, ...visibleMatch } },
    {
      $group: {
        _id: null,
        averageRating: { $avg: '$rating' },
        totalReviews: { $sum: 1 },
        distribution: { $push: '$rating' },
      },
    },
  ]);

  const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  if (agg?.distribution) {
    for (const rating of agg.distribution) {
      const key = String(rating);
      if (distribution[key] != null) distribution[key] += 1;
    }
  }

  return {
    averageRating: agg
      ? Math.round((agg.averageRating || 0) * 10) / 10
      : 0,
    totalReviews: agg?.totalReviews || 0,
    distribution,
  };
};

export const findEligibleOrder = async (userId, pizzaId, orderId) => {
  assertValidObjectId(pizzaId, 'pizza ID');

  if (orderId) {
    assertValidObjectId(orderId, 'order ID');
    const order = await Order.findOne({
      _id: orderId,
      ...purchasedOrderFilter(userId, pizzaId),
    }).lean();

    if (!order) {
      throw new ApiError(
        403,
        'You can only review a pizza from your own eligible purchase',
      );
    }
    return order;
  }

  const order = await Order.findOne(purchasedOrderFilter(userId, pizzaId))
    .sort({ createdAt: -1 })
    .lean();

  return order;
};

export const getReviewEligibility = async (userId, pizzaId) => {
  assertValidObjectId(pizzaId, 'pizza ID');

  const pizza = await Pizza.findById(pizzaId).select('_id name').lean();
  if (!pizza) throw new ApiError(404, 'Pizza not found');

  const existing = await Review.findOne({ user: userId, pizza: pizzaId }).lean();
  const order = await findEligibleOrder(userId, pizzaId);

  return {
    pizzaId: pizza._id.toString(),
    canReview: Boolean(order) && !existing,
    hasPurchased: Boolean(order),
    hasReviewed: Boolean(existing),
    eligibleOrderId: order?._id?.toString() || null,
    existingReviewId: existing?._id?.toString() || null,
  };
};

export const listPizzaReviews = async (
  pizzaId,
  { page = 1, limit = 10, userId = null } = {},
) => {
  assertValidObjectId(pizzaId, 'pizza ID');

  const pizza = await Pizza.findById(pizzaId).select('_id').lean();
  if (!pizza) throw new ApiError(404, 'Pizza not found');

  const pageNum = Math.max(1, Number(page) || 1);
  const limitNum = Math.min(50, Math.max(1, Number(limit) || 10));
  const skip = (pageNum - 1) * limitNum;

  const filter = { pizza: pizzaId, ...visibleMatch };

  const [reviews, total, summary, myReviewDoc] = await Promise.all([
    Review.find(filter)
      .populate('user', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean(),
    Review.countDocuments(filter),
    getRatingSummary(pizzaId),
    userId
      ? Review.findOne({ user: userId, pizza: pizzaId })
          .populate('user', 'name')
          .lean()
      : null,
  ]);

  let eligibility = null;
  if (userId) {
    eligibility = await getReviewEligibility(userId, pizzaId);
  }

  return {
    summary,
    reviews: reviews.map(sanitizePublicReview),
    myReview: myReviewDoc ? sanitizeOwnReview(myReviewDoc) : null,
    eligibility,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      pages: Math.ceil(total / limitNum) || 1,
    },
  };
};

export const createReview = async (userId, payload = {}) => {
  const pizzaId = payload.pizzaId || payload.pizza;
  assertValidObjectId(pizzaId, 'pizza ID');

  const pizza = await Pizza.findById(pizzaId).select('_id').lean();
  if (!pizza) throw new ApiError(404, 'Pizza not found');

  const existing = await Review.findOne({ user: userId, pizza: pizzaId }).lean();
  if (existing) {
    throw new ApiError(409, 'You have already reviewed this pizza');
  }

  const order = await findEligibleOrder(userId, pizzaId, payload.orderId);
  if (!order) {
    throw new ApiError(
      403,
      'You can only review pizzas you have purchased',
    );
  }

  const rating = parseRating(payload.rating);
  const comment = parseComment(payload.comment);
  const title = parseTitle(payload.title);

  let review;
  try {
    review = await Review.create({
      user: userId,
      pizza: pizzaId,
      order: order._id,
      rating,
      comment,
      title,
      isApproved: true,
      isVisible: true,
    });
  } catch (err) {
    if (err?.code === 11000) {
      throw new ApiError(409, 'You have already reviewed this pizza');
    }
    throw err;
  }

  await refreshPizzaRatingStats(pizzaId);
  const populated = await Review.findById(review._id)
    .populate('user', 'name')
    .lean();

  return sanitizeOwnReview(populated);
};

export const updateReview = async (userId, reviewId, payload = {}) => {
  assertValidObjectId(reviewId, 'review ID');

  const review = await Review.findById(reviewId);
  if (!review) throw new ApiError(404, 'Review not found');

  if (String(review.user) !== String(userId)) {
    throw new ApiError(403, 'You can only edit your own review');
  }

  if (payload.rating !== undefined) {
    review.rating = parseRating(payload.rating);
  }
  if (payload.comment !== undefined) {
    review.comment = parseComment(payload.comment);
  }
  if (payload.title !== undefined) {
    review.title = parseTitle(payload.title);
  }

  await review.save();
  await refreshPizzaRatingStats(review.pizza);

  const populated = await Review.findById(review._id)
    .populate('user', 'name')
    .lean();
  return sanitizeOwnReview(populated);
};

export const deleteReview = async (userId, reviewId) => {
  assertValidObjectId(reviewId, 'review ID');

  const review = await Review.findById(reviewId);
  if (!review) throw new ApiError(404, 'Review not found');

  if (String(review.user) !== String(userId)) {
    throw new ApiError(403, 'You can only delete your own review');
  }

  const pizzaId = review.pizza;
  await review.deleteOne();
  await refreshPizzaRatingStats(pizzaId);

  return { deleted: true };
};

export const listAdminReviews = async ({
  page = 1,
  limit = 20,
  search,
  rating,
  isVisible,
  pizzaId,
} = {}) => {
  const filter = {};

  if (typeof isVisible === 'boolean') filter.isVisible = isVisible;
  if (rating != null && rating !== '') {
    filter.rating = parseRating(rating);
  }
  if (pizzaId) {
    assertValidObjectId(pizzaId, 'pizza ID');
    filter.pizza = pizzaId;
  }

  if (search) {
    const q = escapeRegex(String(search).trim());
    if (q) {
      const users = await User.find({
        $or: [
          { name: new RegExp(q, 'i') },
          { email: new RegExp(q, 'i') },
        ],
      })
        .select('_id')
        .lean();
      const pizzas = await Pizza.find({ name: new RegExp(q, 'i') })
        .select('_id')
        .lean();
      filter.$or = [
        { comment: new RegExp(q, 'i') },
        { title: new RegExp(q, 'i') },
        { user: { $in: users.map((u) => u._id) } },
        { pizza: { $in: pizzas.map((p) => p._id) } },
      ];
    }
  }

  const pageNum = Math.max(1, Number(page) || 1);
  const limitNum = Math.min(50, Math.max(1, Number(limit) || 20));
  const skip = (pageNum - 1) * limitNum;

  const [reviews, total] = await Promise.all([
    Review.find(filter)
      .populate('user', 'name email')
      .populate('pizza', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean(),
    Review.countDocuments(filter),
  ]);

  return {
    reviews: reviews.map(sanitizeAdminReview),
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      pages: Math.ceil(total / limitNum) || 1,
    },
  };
};

export const setReviewVisibility = async (reviewId, isVisible) => {
  assertValidObjectId(reviewId, 'review ID');
  if (typeof isVisible !== 'boolean') {
    throw new ApiError(400, 'isVisible boolean is required');
  }

  const review = await Review.findById(reviewId);
  if (!review) throw new ApiError(404, 'Review not found');

  review.isVisible = isVisible;
  await review.save();
  await refreshPizzaRatingStats(review.pizza);

  const populated = await Review.findById(review._id)
    .populate('user', 'name email')
    .populate('pizza', 'name')
    .lean();

  return sanitizeAdminReview(populated);
};

export const getReviewDashboardStats = async () => {
  const [totalReviews, hiddenReviews, fiveStarReviews, avgAgg] =
    await Promise.all([
      Review.countDocuments({}),
      Review.countDocuments({ isVisible: false }),
      Review.countDocuments({ rating: 5, isVisible: true, isApproved: true }),
      Review.aggregate([
        { $match: visibleMatch },
        {
          $group: {
            _id: null,
            averageRating: { $avg: '$rating' },
          },
        },
      ]),
    ]);

  return {
    totalReviews,
    averageRating: avgAgg[0]
      ? Math.round((avgAgg[0].averageRating || 0) * 10) / 10
      : 0,
    fiveStarReviews,
    hiddenReviews,
  };
};
