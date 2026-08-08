import User from '../models/User.js';
import Order from '../models/Order.js';
import Inventory from '../models/Inventory.js';
import Pizza from '../models/Pizza.js';
import {
  ORDER_STATUS,
  PAYMENT_STATUS,
} from '../models/constants.js';
import { getReviewDashboardStats } from './reviewService.js';

const startOfDay = (date = new Date()) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

const endOfDay = (date = new Date()) => {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
};

/**
 * Resolve analytics date window.
 * @param {'today'|'7d'|'30d'|'month'|'custom'} range
 */
export const resolveDateRange = ({ range = '7d', from, to } = {}) => {
  const now = new Date();
  let start;
  let end = endOfDay(now);

  switch (range) {
    case 'today':
      start = startOfDay(now);
      break;
    case '30d':
      start = startOfDay(new Date(now.getTime() - 29 * 24 * 60 * 60 * 1000));
      break;
    case 'month':
      start = startOfDay(new Date(now.getFullYear(), now.getMonth(), 1));
      break;
    case 'custom':
      start = from ? startOfDay(new Date(from)) : startOfDay(new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000));
      end = to ? endOfDay(new Date(to)) : endOfDay(now);
      break;
    case '7d':
    default:
      start = startOfDay(new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000));
      break;
  }

  if (start > end) {
    const tmp = start;
    start = startOfDay(end);
    end = endOfDay(tmp);
  }

  return { start, end, range };
};

const paidMatch = { paymentStatus: PAYMENT_STATUS.PAID };

const sumRevenue = async (match = {}) => {
  const result = await Order.aggregate([
    { $match: { ...paidMatch, ...match } },
    {
      $group: {
        _id: null,
        total: { $sum: '$pricing.total' },
        count: { $sum: 1 },
      },
    },
  ]);
  return {
    revenue: result[0]?.total || 0,
    paidOrderCount: result[0]?.count || 0,
  };
};

const inventorySummary = async () => {
  const items = await Inventory.find({})
    .select('quantityInStock minimumThreshold reorderLevel')
    .lean();

  let lowStock = 0;
  let outOfStock = 0;
  for (const item of items) {
    if (item.quantityInStock <= 0) outOfStock += 1;
    else {
      const threshold = item.minimumThreshold ?? item.reorderLevel ?? 0;
      if (item.quantityInStock <= threshold) lowStock += 1;
    }
  }

  return {
    totalItems: items.length,
    lowStock,
    outOfStock,
  };
};

/**
 * Dashboard overview cards — all values from live DB collections.
 */
export const getDashboardOverview = async () => {
  const todayStart = startOfDay();
  const todayEnd = endOfDay();

  const [
    totalUsers,
    totalOrders,
    todayOrders,
    pendingOrders,
    completedOrders,
    totalRevenue,
    todayRevenue,
    inventory,
    recentOrders,
    reviewStats,
  ] = await Promise.all([
    User.countDocuments({}),
    Order.countDocuments({}),
    Order.countDocuments({
      createdAt: { $gte: todayStart, $lte: todayEnd },
    }),
    Order.countDocuments({ status: ORDER_STATUS.PENDING }),
    Order.countDocuments({ status: ORDER_STATUS.DELIVERED }),
    sumRevenue(),
    sumRevenue({ createdAt: { $gte: todayStart, $lte: todayEnd } }),
    inventorySummary(),
    Order.find({})
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .limit(8)
      .lean(),
    getReviewDashboardStats(),
  ]);

  return {
    cards: {
      totalUsers,
      totalOrders,
      todayOrders,
      totalRevenue: totalRevenue.revenue,
      todayRevenue: todayRevenue.revenue,
      pendingOrders,
      completedOrders,
      lowStockItems: inventory.lowStock,
      outOfStockItems: inventory.outOfStock,
      totalInventoryItems: inventory.totalItems,
      totalReviews: reviewStats.totalReviews,
      averageRating: reviewStats.averageRating,
      fiveStarReviews: reviewStats.fiveStarReviews,
      hiddenReviews: reviewStats.hiddenReviews,
    },
    notes: {
      revenueDefinition:
        'Revenue sums Order.pricing.total where paymentStatus is paid (excludes unpaid COD until delivery settlement and excludes refunded).',
      completedOrdersDefinition:
        'Completed orders count status=delivered (not payment status).',
    },
    recentOrders: recentOrders.map((order) => ({
      id: order._id.toString(),
      orderNumber: order.orderNumber,
      customer: order.user?.name || order.addressSnapshot?.fullName || 'Customer',
      email: order.user?.email || null,
      createdAt: order.createdAt,
      amount: order.pricing?.total || 0,
      paymentStatus: order.paymentStatus,
      status: order.status,
    })),
  };
};

/**
 * Analytics for charts — server-side aggregations for a date range.
 */
export const getDashboardAnalytics = async (rangeInput = {}) => {
  const { start, end, range } = resolveDateRange(rangeInput);
  const createdInRange = { createdAt: { $gte: start, $lte: end } };

  const [revenueOverTime, ordersOverTime, ordersByStatus, topPizzas, categoryPopularity] =
    await Promise.all([
      Order.aggregate([
        {
          $match: {
            ...paidMatch,
            ...createdInRange,
          },
        },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
            },
            revenue: { $sum: '$pricing.total' },
            orders: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      Order.aggregate([
        { $match: createdInRange },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      Order.aggregate([
        { $match: createdInRange },
        { $group: { _id: '$status', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      Order.aggregate([
        { $match: createdInRange },
        { $unwind: '$items' },
        {
          $group: {
            _id: {
              pizzaId: '$items.pizza',
              name: '$items.name',
            },
            quantity: { $sum: '$items.quantity' },
            revenue: { $sum: '$items.lineTotal' },
          },
        },
        { $sort: { quantity: -1 } },
        { $limit: 8 },
      ]),
      Order.aggregate([
        { $match: createdInRange },
        { $unwind: '$items' },
        {
          $lookup: {
            from: 'pizzas',
            localField: 'items.pizza',
            foreignField: '_id',
            as: 'pizzaDoc',
          },
        },
        {
          $unwind: {
            path: '$pizzaDoc',
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $lookup: {
            from: 'categories',
            localField: 'pizzaDoc.category',
            foreignField: '_id',
            as: 'categoryDoc',
          },
        },
        {
          $unwind: {
            path: '$categoryDoc',
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $group: {
            _id: {
              $ifNull: ['$categoryDoc.name', 'Custom / Uncategorized'],
            },
            quantity: { $sum: '$items.quantity' },
          },
        },
        { $sort: { quantity: -1 } },
        { $limit: 8 },
      ]),
    ]);

  const periodRevenue = await sumRevenue(createdInRange);

  return {
    range,
    from: start.toISOString(),
    to: end.toISOString(),
    summary: {
      revenue: periodRevenue.revenue,
      paidOrders: periodRevenue.paidOrderCount,
      orders: await Order.countDocuments(createdInRange),
    },
    revenueOverTime: revenueOverTime.map((row) => ({
      date: row._id,
      revenue: row.revenue,
      orders: row.orders,
    })),
    ordersOverTime: ordersOverTime.map((row) => ({
      date: row._id,
      count: row.count,
    })),
    ordersByStatus: ordersByStatus.map((row) => ({
      status: row._id,
      count: row.count,
    })),
    topPizzas: topPizzas.map((row) => ({
      name: row._id.name,
      pizzaId: row._id.pizzaId ? String(row._id.pizzaId) : null,
      quantity: row.quantity,
      revenue: row.revenue,
    })),
    popularCategories: categoryPopularity.map((row) => ({
      category: row._id,
      quantity: row.quantity,
    })),
    pizzaCount: await Pizza.countDocuments({}),
  };
};
