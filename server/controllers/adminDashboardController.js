import asyncHandler from '../utils/asyncHandler.js';
import * as adminDashboardService from '../services/adminDashboardService.js';

export const getOverview = asyncHandler(async (_req, res) => {
  const data = await adminDashboardService.getDashboardOverview();
  res.status(200).json({ success: true, data });
});

export const getAnalytics = asyncHandler(async (req, res) => {
  const data = await adminDashboardService.getDashboardAnalytics({
    range: req.query.range || '7d',
    from: req.query.from,
    to: req.query.to,
  });
  res.status(200).json({ success: true, data });
});
