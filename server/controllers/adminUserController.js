import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import * as adminUserService from '../services/adminUserService.js';

export const listUsers = asyncHandler(async (req, res) => {
  let isActive;
  if (req.query.isActive === 'true') isActive = true;
  if (req.query.isActive === 'false') isActive = false;

  const result = await adminUserService.listUsers({
    page: Number(req.query.page) || 1,
    limit: Number(req.query.limit) || 20,
    search: req.query.search || req.query.q,
    isActive,
  });

  res.status(200).json({ success: true, data: result });
});

export const getUser = asyncHandler(async (req, res) => {
  const user = await adminUserService.getUserById(req.params.id);
  res.status(200).json({ success: true, data: { user } });
});

export const setUserStatus = asyncHandler(async (req, res) => {
  if (typeof req.body.isActive !== 'boolean') {
    throw new ApiError(400, 'isActive boolean is required');
  }
  const user = await adminUserService.setUserActive(
    req.params.id,
    req.body.isActive,
  );
  res.status(200).json({
    success: true,
    message: user.isActive ? 'User activated' : 'User deactivated',
    data: { user },
  });
});
