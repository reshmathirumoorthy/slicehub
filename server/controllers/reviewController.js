import asyncHandler from '../utils/asyncHandler.js';
import * as reviewService from '../services/reviewService.js';

export const listPizzaReviews = asyncHandler(async (req, res) => {
  const data = await reviewService.listPizzaReviews(req.params.pizzaId, {
    page: Number(req.query.page) || 1,
    limit: Number(req.query.limit) || 10,
    userId: req.user?._id || null,
  });
  res.status(200).json({ success: true, data });
});

export const getEligibility = asyncHandler(async (req, res) => {
  const eligibility = await reviewService.getReviewEligibility(
    req.user._id,
    req.params.pizzaId,
  );
  res.status(200).json({ success: true, data: { eligibility } });
});

export const createReview = asyncHandler(async (req, res) => {
  const review = await reviewService.createReview(req.user._id, {
    pizzaId: req.body.pizzaId || req.body.pizza,
    orderId: req.body.orderId || req.body.order,
    rating: req.body.rating,
    comment: req.body.comment,
    title: req.body.title,
  });
  res.status(201).json({
    success: true,
    message: 'Review submitted',
    data: { review },
  });
});

export const updateReview = asyncHandler(async (req, res) => {
  const review = await reviewService.updateReview(
    req.user._id,
    req.params.id,
    {
      rating: req.body.rating,
      comment: req.body.comment,
      title: req.body.title,
    },
  );
  res.status(200).json({
    success: true,
    message: 'Review updated',
    data: { review },
  });
});

export const deleteReview = asyncHandler(async (req, res) => {
  await reviewService.deleteReview(req.user._id, req.params.id);
  res.status(200).json({
    success: true,
    message: 'Review deleted',
    data: { deleted: true },
  });
});
