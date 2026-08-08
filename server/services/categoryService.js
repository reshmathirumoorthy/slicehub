import Category from '../models/Category.js';
import Pizza from '../models/Pizza.js';
import ApiError from '../utils/ApiError.js';
import { ensureUniqueSlug, slugify } from '../utils/slugify.js';
import {
  assertValidObjectId,
  validateCategoryPayload,
} from '../utils/menuValidation.js';

export const listCategories = async ({ includeInactive = false } = {}) => {
  const filter = includeInactive ? {} : { isActive: true };
  return Category.find(filter).sort({ sortOrder: 1, name: 1 });
};

export const getCategoryById = async (id) => {
  assertValidObjectId(id, 'category ID');
  const category = await Category.findById(id);
  if (!category) {
    throw new ApiError(404, 'Category not found');
  }
  return category;
};

export const createCategory = async (payload, imagePath = null) => {
  const data = validateCategoryPayload(payload);
  const baseSlug = data.slug || slugify(data.name);
  data.slug = await ensureUniqueSlug(Category, baseSlug);
  if (imagePath) {
    data.image = imagePath;
  }

  try {
    return await Category.create(data);
  } catch (error) {
    if (error.code === 11000) {
      throw new ApiError(409, 'A category with this name or slug already exists');
    }
    throw error;
  }
};

export const updateCategory = async (id, payload, imagePath = undefined) => {
  assertValidObjectId(id, 'category ID');
  const data = validateCategoryPayload(payload, { partial: true });

  if (data.name && !payload.slug) {
    data.slug = await ensureUniqueSlug(Category, slugify(data.name), id);
  } else if (data.slug) {
    data.slug = await ensureUniqueSlug(Category, data.slug, id);
  }

  if (imagePath !== undefined) {
    data.image = imagePath;
  }

  try {
    const category = await Category.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    });
    if (!category) {
      throw new ApiError(404, 'Category not found');
    }
    return category;
  } catch (error) {
    if (error.code === 11000) {
      throw new ApiError(409, 'A category with this name or slug already exists');
    }
    throw error;
  }
};

export const deleteCategory = async (id) => {
  assertValidObjectId(id, 'category ID');

  const pizzaCount = await Pizza.countDocuments({ category: id });
  if (pizzaCount > 0) {
    throw new ApiError(
      409,
      `Cannot delete category while ${pizzaCount} pizza(s) still reference it`,
    );
  }

  const category = await Category.findByIdAndDelete(id);
  if (!category) {
    throw new ApiError(404, 'Category not found');
  }
  return category;
};
