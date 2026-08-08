import ApiError from '../utils/ApiError.js';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phoneRegex = /^[0-9+\-\s()]{7,20}$/;
const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;

const isBlank = (value) =>
  value === undefined || value === null || String(value).trim() === '';

/**
 * Runs a list of field validators against req.body.
 * Each rule: { field, required?, type?, min?, max?, pattern?, message?, custom? }
 */
export const validateBody = (rules) => (req, _res, next) => {
  const errors = [];

  for (const rule of rules) {
    const raw = req.body?.[rule.field];
    const value = typeof raw === 'string' ? raw.trim() : raw;

    if (isBlank(value)) {
      if (rule.required !== false) {
        errors.push({
          field: rule.field,
          message: rule.message || `${rule.field} is required`,
        });
      }
      continue;
    }

    if (rule.type === 'email' && !emailRegex.test(String(value))) {
      errors.push({ field: rule.field, message: 'Invalid email address' });
      continue;
    }

    if (rule.type === 'phone' && !phoneRegex.test(String(value))) {
      errors.push({ field: rule.field, message: 'Invalid phone number' });
      continue;
    }

    if (rule.type === 'password' && !passwordRegex.test(String(value))) {
      errors.push({
        field: rule.field,
        message:
          'Password must be at least 8 characters and include a letter and a number',
      });
      continue;
    }

    if (rule.min !== undefined && String(value).length < rule.min) {
      errors.push({
        field: rule.field,
        message: `${rule.field} must be at least ${rule.min} characters`,
      });
      continue;
    }

    if (rule.max !== undefined && String(value).length > rule.max) {
      errors.push({
        field: rule.field,
        message: `${rule.field} cannot exceed ${rule.max} characters`,
      });
      continue;
    }

    if (rule.pattern && !rule.pattern.test(String(value))) {
      errors.push({
        field: rule.field,
        message: rule.message || `${rule.field} is invalid`,
      });
      continue;
    }

    if (typeof rule.custom === 'function') {
      const customError = rule.custom(value, req.body);
      if (customError) {
        errors.push({ field: rule.field, message: customError });
      }
    }

    // Write trimmed strings back
    if (typeof raw === 'string') {
      req.body[rule.field] = value;
    }
  }

  if (errors.length > 0) {
    return next(new ApiError(400, 'Validation failed', errors));
  }

  return next();
};

export const registerValidation = validateBody([
  { field: 'name', min: 2, max: 80 },
  { field: 'email', type: 'email' },
  { field: 'password', type: 'password' },
  { field: 'phone', type: 'phone' },
]);

export const loginValidation = validateBody([
  { field: 'email', type: 'email' },
  { field: 'password', required: true },
]);

export const emailValidation = validateBody([
  { field: 'email', type: 'email' },
]);

export const resetPasswordValidation = validateBody([
  { field: 'password', type: 'password' },
  {
    field: 'confirmPassword',
    custom: (value, body) =>
      value !== body.password ? 'Passwords do not match' : null,
  },
]);

/** Customer profile update — name + phone only (email changes need re-verify). */
export const updateProfileValidation = validateBody([
  { field: 'name', min: 2, max: 80 },
  { field: 'phone', type: 'phone' },
]);
