import User from '../models/User.js';
import Order from '../models/Order.js';
import Admin from '../models/Admin.js';
import ApiError from '../utils/ApiError.js';

const sanitizeUser = (user, orderCount = 0) => ({
  id: user._id.toString(),
  name: user.name,
  email: user.email,
  phone: user.phone || null,
  role: user.role,
  isActive: Boolean(user.isActive),
  isEmailVerified: Boolean(user.isEmailVerified),
  lastLoginAt: user.lastLoginAt,
  orderCount,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

export const listUsers = async ({
  page = 1,
  limit = 20,
  search,
  isActive,
} = {}) => {
  const filter = {};
  if (typeof isActive === 'boolean') filter.isActive = isActive;
  if (search) {
    const q = String(search).trim();
    filter.$or = [
      { name: new RegExp(q, 'i') },
      { email: new RegExp(q, 'i') },
      { phone: new RegExp(q, 'i') },
    ];
  }

  const pageNum = Math.max(1, Number(page) || 1);
  const limitNum = Math.min(50, Math.max(1, Number(limit) || 20));
  const skip = (pageNum - 1) * limitNum;

  const [users, total] = await Promise.all([
    User.find(filter)
      .select('-password -emailVerificationToken -passwordResetToken')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean(),
    User.countDocuments(filter),
  ]);

  const ids = users.map((u) => u._id);
  const counts = await Order.aggregate([
    { $match: { user: { $in: ids } } },
    { $group: { _id: '$user', count: { $sum: 1 } } },
  ]);
  const countMap = new Map(counts.map((c) => [String(c._id), c.count]));

  return {
    users: users.map((u) =>
      sanitizeUser(u, countMap.get(String(u._id)) || 0),
    ),
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      pages: Math.ceil(total / limitNum) || 1,
    },
  };
};

export const getUserById = async (id) => {
  const user = await User.findById(id)
    .select('-password -emailVerificationToken -passwordResetToken')
    .lean();
  if (!user) throw new ApiError(404, 'User not found');
  const orderCount = await Order.countDocuments({ user: user._id });
  return sanitizeUser(user, orderCount);
};

export const setUserActive = async (id, isActive) => {
  if (typeof isActive !== 'boolean') {
    throw new ApiError(400, 'isActive boolean is required');
  }

  const user = await User.findById(id).select(
    '-password -emailVerificationToken -passwordResetToken',
  );
  if (!user) throw new ApiError(404, 'User not found');

  user.isActive = isActive;
  await user.save();

  const orderCount = await Order.countDocuments({ user: user._id });
  return sanitizeUser(user.toObject(), orderCount);
};

/**
 * Safety helper — ensures at least one active admin remains.
 * Used only when deactivating Admin accounts (not customer Users).
 */
export const assertNotLastActiveAdmin = async (adminId) => {
  const activeCount = await Admin.countDocuments({ isActive: true });
  if (activeCount <= 1) {
    const only = await Admin.findOne({ isActive: true });
    if (only && String(only._id) === String(adminId)) {
      throw new ApiError(400, 'Cannot deactivate the only active administrator');
    }
  }
};
