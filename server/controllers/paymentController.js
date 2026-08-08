import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import * as paymentService from '../services/paymentService.js';

export const createOrder = asyncHandler(async (req, res) => {
  const orderId = req.body.orderId || req.body.slicehubOrderId;
  if (!orderId) {
    throw new ApiError(400, 'orderId is required');
  }

  const checkout = await paymentService.createRazorpayOrder({
    userId: req.user._id,
    orderId,
  });

  res.status(200).json({
    success: true,
    message: 'Razorpay order created',
    data: { checkout },
  });
});

export const verifyPayment = asyncHandler(async (req, res) => {
  const {
    orderId,
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    razorpayOrderId,
    razorpayPaymentId,
    razorpaySignature,
  } = req.body;

  if (!orderId) {
    throw new ApiError(400, 'orderId is required');
  }

  const result = await paymentService.verifyRazorpayPayment({
    userId: req.user._id,
    orderId,
    razorpayOrderId: razorpayOrderId || razorpay_order_id,
    razorpayPaymentId: razorpayPaymentId || razorpay_payment_id,
    razorpaySignature: razorpaySignature || razorpay_signature,
  });

  res.status(200).json({
    success: true,
    message: result.alreadyPaid
      ? 'Payment already verified'
      : 'Payment verified successfully',
    data: result,
  });
});

export const markFailed = asyncHandler(async (req, res) => {
  const result = await paymentService.markPaymentFailed({
    userId: req.user._id,
    orderId: req.body.orderId,
    reason: req.body.reason,
  });

  res.status(200).json({
    success: true,
    message: 'Payment marked as failed',
    data: result,
  });
});

export const getConfig = asyncHandler(async (_req, res) => {
  res.status(200).json({
    success: true,
    data: paymentService.getPublicRazorpayConfig(),
  });
});
