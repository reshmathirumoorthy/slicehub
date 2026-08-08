import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import * as cartService from '../services/cartService.js';

const resolveIdentity = (req) => {
  const userId = req.user?._id || null;
  const guestId = req.headers['x-guest-id'] || req.body?.guestId || null;

  if (!userId && !guestId) {
    throw new ApiError(
      400,
      'Provide a user session or X-Guest-Id header for cart access',
    );
  }

  return { userId, guestId: userId ? null : String(guestId) };
};

export const getCart = asyncHandler(async (req, res) => {
  const identity = resolveIdentity(req);
  const cart = await cartService.getCartView(identity);

  res.status(200).json({
    success: true,
    data: { cart },
  });
});

export const addItem = asyncHandler(async (req, res) => {
  const identity = resolveIdentity(req);
  const cart = await cartService.addCartItem({
    ...identity,
    payload: req.body,
  });

  res.status(201).json({
    success: true,
    message: 'Item added to cart',
    data: { cart },
  });
});

export const updateItem = asyncHandler(async (req, res) => {
  const identity = resolveIdentity(req);
  const cart = await cartService.updateCartItemQuantity({
    ...identity,
    itemId: req.params.itemId,
    quantity: req.body.quantity,
  });

  res.status(200).json({
    success: true,
    message: 'Cart item updated',
    data: { cart },
  });
});

export const removeItem = asyncHandler(async (req, res) => {
  const identity = resolveIdentity(req);
  const cart = await cartService.removeCartItem({
    ...identity,
    itemId: req.params.itemId,
  });

  res.status(200).json({
    success: true,
    message: 'Cart item removed',
    data: { cart },
  });
});

export const clearCart = asyncHandler(async (req, res) => {
  const identity = resolveIdentity(req);
  const cart = await cartService.clearCart(identity);

  res.status(200).json({
    success: true,
    message: 'Cart cleared',
    data: { cart },
  });
});

export const applyCoupon = asyncHandler(async (req, res) => {
  const identity = resolveIdentity(req);
  const cart = await cartService.applyCoupon({
    ...identity,
    code: req.body.code,
  });

  res.status(200).json({
    success: true,
    message: 'Coupon applied',
    data: { cart },
  });
});

export const removeCoupon = asyncHandler(async (req, res) => {
  const identity = resolveIdentity(req);
  const cart = await cartService.removeCoupon(identity);

  res.status(200).json({
    success: true,
    message: 'Coupon removed',
    data: { cart },
  });
});

export const mergeCart = asyncHandler(async (req, res) => {
  if (!req.user) {
    throw new ApiError(401, 'Authentication required to merge cart');
  }

  const guestId = req.headers['x-guest-id'] || req.body?.guestId;
  const cart = await cartService.mergeGuestCartIntoUser({
    userId: req.user._id,
    guestId: guestId ? String(guestId) : null,
  });

  res.status(200).json({
    success: true,
    message: 'Guest cart merged',
    data: { cart },
  });
});
