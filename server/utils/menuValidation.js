import mongoose from 'mongoose';
import ApiError from '../utils/ApiError.js';
import {
  PIZZA_BASES,
  PIZZA_CHEESES,
  PIZZA_SAUCES,
  PIZZA_SIZES,
  PIZZA_VEGETABLES,
} from '../models/constants.js';

const isBlank = (value) =>
  value === undefined || value === null || String(value).trim() === '';

/**
 * Parses JSON arrays that may arrive as strings via multipart/form-data.
 */
export const parseMaybeJson = (value, fallback = undefined) => {
  if (value === undefined || value === null || value === '') {
    return fallback;
  }
  if (typeof value === 'string') {
    try {
      return JSON.parse(value);
    } catch {
      // Comma-separated fallback for simple string lists
      if (value.includes(',')) {
        return value.split(',').map((part) => part.trim()).filter(Boolean);
      }
      return value;
    }
  }
  return value;
};

export const parseBoolean = (value, fallback = undefined) => {
  if (value === undefined || value === null || value === '') {
    return fallback;
  }
  if (typeof value === 'boolean') return value;
  if (value === 'true' || value === '1') return true;
  if (value === 'false' || value === '0') return false;
  return fallback;
};

export const parseNumber = (value, fallback = undefined) => {
  if (value === undefined || value === null || value === '') {
    return fallback;
  }
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
};

export const assertValidObjectId = (id, label = 'ID') => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, `Invalid ${label}`);
  }
};

const assertEnumArray = (values, allowed, field) => {
  if (!Array.isArray(values)) {
    throw new ApiError(400, `${field} must be an array`, [
      { field, message: `${field} must be an array` },
    ]);
  }
  const invalid = values.filter((v) => !allowed.includes(v));
  if (invalid.length > 0) {
    throw new ApiError(400, `Invalid values in ${field}`, [
      { field, message: `Invalid: ${invalid.join(', ')}` },
    ]);
  }
};

export const validateCategoryPayload = (body, { partial = false } = {}) => {
  const errors = [];
  const data = {};

  if (!partial || body.name !== undefined) {
    if (isBlank(body.name)) {
      errors.push({ field: 'name', message: 'Name is required' });
    } else if (String(body.name).trim().length < 2) {
      errors.push({ field: 'name', message: 'Name must be at least 2 characters' });
    } else {
      data.name = String(body.name).trim();
    }
  }

  if (body.description !== undefined) {
    data.description = String(body.description || '').trim();
  }

  if (body.sortOrder !== undefined) {
    const sortOrder = parseNumber(body.sortOrder);
    if (sortOrder === undefined || sortOrder < 0) {
      errors.push({ field: 'sortOrder', message: 'sortOrder must be a non-negative number' });
    } else {
      data.sortOrder = sortOrder;
    }
  }

  if (body.isActive !== undefined) {
    data.isActive = parseBoolean(body.isActive, true);
  }

  if (body.slug !== undefined && !isBlank(body.slug)) {
    data.slug = String(body.slug).trim().toLowerCase();
  }

  if (errors.length) {
    throw new ApiError(400, 'Validation failed', errors);
  }

  return data;
};

export const validatePizzaPayload = (body, { partial = false } = {}) => {
  const errors = [];
  const data = {};

  const name = body.name;
  const description = body.description;
  const category = body.category;
  const basePrice = parseNumber(body.basePrice);
  const sizes = parseMaybeJson(body.sizes);
  const availableBases = parseMaybeJson(body.availableBases);
  const availableSauces = parseMaybeJson(body.availableSauces);
  const availableCheeses = parseMaybeJson(body.availableCheeses);
  const availableVegetables = parseMaybeJson(body.availableVegetables);
  const extraCheesePrice = parseNumber(body.extraCheesePrice);
  const isVegetarian = parseBoolean(body.isVegetarian);
  const isAvailable = parseBoolean(body.isAvailable);
  const preparationTimeMinutes = parseNumber(body.preparationTimeMinutes);

  if (!partial || name !== undefined) {
    if (isBlank(name)) {
      errors.push({ field: 'name', message: 'Name is required' });
    } else {
      data.name = String(name).trim();
    }
  }

  if (!partial || description !== undefined) {
    if (isBlank(description)) {
      errors.push({ field: 'description', message: 'Description is required' });
    } else {
      data.description = String(description).trim();
    }
  }

  if (!partial || category !== undefined) {
    if (isBlank(category) || !mongoose.Types.ObjectId.isValid(category)) {
      errors.push({ field: 'category', message: 'Valid category ID is required' });
    } else {
      data.category = category;
    }
  }

  if (!partial || body.basePrice !== undefined) {
    if (basePrice === undefined || basePrice < 0) {
      errors.push({ field: 'basePrice', message: 'Valid basePrice is required' });
    } else {
      data.basePrice = basePrice;
    }
  }

  if (!partial || body.sizes !== undefined) {
    if (!Array.isArray(sizes) || sizes.length === 0) {
      errors.push({ field: 'sizes', message: 'At least one size is required' });
    } else {
      const allowedSizes = Object.values(PIZZA_SIZES);
      const normalized = [];
      for (const entry of sizes) {
        if (!entry?.size || !allowedSizes.includes(entry.size)) {
          errors.push({ field: 'sizes', message: `Invalid size: ${entry?.size}` });
          break;
        }
        const price = Number(entry.price);
        if (!Number.isFinite(price) || price < 0) {
          errors.push({ field: 'sizes', message: `Invalid price for size ${entry.size}` });
          break;
        }
        normalized.push({ size: entry.size, price });
      }
      if (normalized.length === sizes.length) {
        data.sizes = normalized;
      }
    }
  }

  if (availableBases !== undefined) {
    try {
      assertEnumArray(availableBases, Object.values(PIZZA_BASES), 'availableBases');
      data.availableBases = availableBases;
    } catch (error) {
      if (error.errors) errors.push(...error.errors);
      else errors.push({ field: 'availableBases', message: error.message });
    }
  }

  if (availableSauces !== undefined) {
    try {
      assertEnumArray(availableSauces, Object.values(PIZZA_SAUCES), 'availableSauces');
      data.availableSauces = availableSauces;
    } catch (error) {
      if (error.errors) errors.push(...error.errors);
      else errors.push({ field: 'availableSauces', message: error.message });
    }
  }

  if (availableCheeses !== undefined) {
    try {
      assertEnumArray(availableCheeses, Object.values(PIZZA_CHEESES), 'availableCheeses');
      data.availableCheeses = availableCheeses;
    } catch (error) {
      if (error.errors) errors.push(...error.errors);
      else errors.push({ field: 'availableCheeses', message: error.message });
    }
  }

  if (availableVegetables !== undefined) {
    try {
      assertEnumArray(
        availableVegetables,
        Object.values(PIZZA_VEGETABLES),
        'availableVegetables',
      );
      data.availableVegetables = availableVegetables;
    } catch (error) {
      if (error.errors) errors.push(...error.errors);
      else errors.push({ field: 'availableVegetables', message: error.message });
    }
  }

  if (body.extraCheesePrice !== undefined) {
    if (extraCheesePrice === undefined || extraCheesePrice < 0) {
      errors.push({
        field: 'extraCheesePrice',
        message: 'extraCheesePrice must be a non-negative number',
      });
    } else {
      data.extraCheesePrice = extraCheesePrice;
    }
  }

  if (isVegetarian !== undefined) data.isVegetarian = isVegetarian;
  if (isAvailable !== undefined) data.isAvailable = isAvailable;

  if (body.preparationTimeMinutes !== undefined) {
    if (
      preparationTimeMinutes === undefined ||
      preparationTimeMinutes < 5 ||
      preparationTimeMinutes > 180
    ) {
      errors.push({
        field: 'preparationTimeMinutes',
        message: 'preparationTimeMinutes must be between 5 and 180',
      });
    } else {
      data.preparationTimeMinutes = preparationTimeMinutes;
    }
  }

  if (body.slug !== undefined && !isBlank(body.slug)) {
    data.slug = String(body.slug).trim().toLowerCase();
  }

  if (errors.length) {
    throw new ApiError(400, 'Validation failed', errors);
  }

  return data;
};
