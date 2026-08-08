import Pizza from '../models/Pizza.js';
import Category from '../models/Category.js';
import ApiError from '../utils/ApiError.js';
import { ensureUniqueSlug, slugify } from '../utils/slugify.js';
import {
  assertValidObjectId,
  parseBoolean,
  parseNumber,
  validatePizzaPayload,
} from '../utils/menuValidation.js';

const SORT_MAP = {
  price_asc: { basePrice: 1 },
  price_desc: { basePrice: -1 },
  popularity: { averageRating: -1, reviewCount: -1 },
  newest: { createdAt: -1 },
  name_asc: { name: 1 },
};

export const listPizzas = async (query = {}) => {
  const page = Math.max(1, parseNumber(query.page, 1));
  const limit = Math.min(50, Math.max(1, parseNumber(query.limit, 12)));
  const skip = (page - 1) * limit;

  const filter = {};

  if (query.search) {
    const term = String(query.search).trim();
    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    filter.$or = [
      { name: { $regex: escaped, $options: 'i' } },
      { description: { $regex: escaped, $options: 'i' } },
    ];
  }

  if (query.category) {
    assertValidObjectId(query.category, 'category ID');
    filter.category = query.category;
  }

  const minPrice = parseNumber(query.minPrice);
  const maxPrice = parseNumber(query.maxPrice);
  if (minPrice !== undefined || maxPrice !== undefined) {
    filter.basePrice = {};
    if (minPrice !== undefined) filter.basePrice.$gte = minPrice;
    if (maxPrice !== undefined) filter.basePrice.$lte = maxPrice;
  }

  if (query.admin === 'true') {
    if (query.isAvailable !== undefined && query.isAvailable !== '') {
      filter.isAvailable = parseBoolean(query.isAvailable, true);
    }
    // Admins see all pizzas unless they filter availability explicitly
  } else {
    // Public listings never expose availability overrides
    filter.isAvailable = true;
  }

  if (query.isVegetarian !== undefined && query.isVegetarian !== '') {
    filter.isVegetarian = parseBoolean(query.isVegetarian);
  }

  const sortKey = query.sort || 'newest';
  const sort = SORT_MAP[sortKey] || SORT_MAP.newest;

  const [items, total] = await Promise.all([
    Pizza.find(filter)
      .populate('category', 'name slug')
      .sort(sort)
      .skip(skip)
      .limit(limit),
    Pizza.countDocuments(filter),
  ]);

  return {
    items,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
      hasNextPage: page * limit < total,
      hasPrevPage: page > 1,
    },
  };
};

export const getPizzaById = async (id) => {
  assertValidObjectId(id, 'pizza ID');
  const pizza = await Pizza.findById(id).populate('category', 'name slug');
  if (!pizza) {
    throw new ApiError(404, 'Pizza not found');
  }
  return pizza;
};

export const createPizza = async (payload, imagePath = null) => {
  const data = validatePizzaPayload(payload);

  const category = await Category.findById(data.category);
  if (!category) {
    throw new ApiError(404, 'Category not found');
  }
  if (!category.isActive) {
    throw new ApiError(400, 'Cannot assign pizza to an inactive category');
  }

  const baseSlug = data.slug || slugify(data.name);
  data.slug = await ensureUniqueSlug(Pizza, baseSlug);
  if (imagePath) {
    data.image = imagePath;
  }

  try {
    const pizza = await Pizza.create(data);
    return Pizza.findById(pizza._id).populate('category', 'name slug');
  } catch (error) {
    if (error.code === 11000) {
      throw new ApiError(409, 'A pizza with this slug already exists');
    }
    throw error;
  }
};

export const updatePizza = async (id, payload, imagePath = undefined) => {
  assertValidObjectId(id, 'pizza ID');
  const data = validatePizzaPayload(payload, { partial: true });

  if (data.category) {
    const category = await Category.findById(data.category);
    if (!category) {
      throw new ApiError(404, 'Category not found');
    }
  }

  if (data.name && !payload.slug) {
    data.slug = await ensureUniqueSlug(Pizza, slugify(data.name), id);
  } else if (data.slug) {
    data.slug = await ensureUniqueSlug(Pizza, data.slug, id);
  }

  if (imagePath !== undefined) {
    data.image = imagePath;
  }

  try {
    const pizza = await Pizza.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    }).populate('category', 'name slug');

    if (!pizza) {
      throw new ApiError(404, 'Pizza not found');
    }
    return pizza;
  } catch (error) {
    if (error.code === 11000) {
      throw new ApiError(409, 'A pizza with this slug already exists');
    }
    throw error;
  }
};

export const deletePizza = async (id) => {
  assertValidObjectId(id, 'pizza ID');
  const pizza = await Pizza.findByIdAndDelete(id);
  if (!pizza) {
    throw new ApiError(404, 'Pizza not found');
  }
  return pizza;
};
