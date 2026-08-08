import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import * as reviewService from '../services/reviewService.js';

export const listReviews = asyncHandler(async (req, res) => {
  let isVisible;
  if (req.query.isVisible === 'true') isVisible = true;
  if (req.query.isVisible === 'false') isVisible = false;

  const result = await reviewService.listAdminReviews({
    page: Number(req.query.page) || 1,
    limit: Number(req.query.limit) || 20,
    search: req.query.search || req.query.q,
    rating: req.query.rating,
    isVisible,
    pizzaId: req.query.pizzaId,
  });

  res.status(200).json({ success: true, data: result });
});

export const setVisibility = asyncHandler(async (req, res) => {
  if (typeof req.body.isVisible !== 'boolean') {
    throw new ApiError(400, 'isVisible boolean is required');
  }
  const review = await reviewService.setReviewVisibility(
    req.params.id,
    req.body.isVisible,
  );
  res.status(200).json({
    success: true,
    message: review.isVisible ? 'Review restored' : 'Review hidden',
    data: { review },
  });
});
