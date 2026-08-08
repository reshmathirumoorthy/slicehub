/**
 * Wraps async route handlers so rejected promises reach Express error middleware.
 * Controllers in later phases should wrap handlers with this helper.
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

export default asyncHandler;
