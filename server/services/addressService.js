import Address from '../models/Address.js';
import ApiError from '../utils/ApiError.js';
import { ADDRESS_LABELS } from '../models/constants.js';

const PHONE_RE = /^[+]?[\d\s-]{8,15}$/;
const POSTAL_RE = /^[A-Za-z0-9\s-]{3,12}$/;

const normalizeAddressPayload = (payload = {}) => {
  const street =
    typeof payload.street === 'string'
      ? payload.street.trim()
      : typeof payload.address === 'string'
        ? payload.address.trim()
        : '';

  return {
    label: payload.label || ADDRESS_LABELS.HOME,
    fullName: String(payload.fullName || '').trim(),
    phone: String(payload.phone || '').trim(),
    street,
    landmark: String(payload.landmark || '').trim(),
    city: String(payload.city || '').trim(),
    state: String(payload.state || '').trim(),
    postalCode: String(payload.postalCode || '').trim(),
    country: String(payload.country || 'India').trim() || 'India',
    isDefault: Boolean(payload.isDefault),
  };
};

export const validateAddressFields = (payload) => {
  const data = normalizeAddressPayload(payload);
  const errors = [];

  if (!data.fullName || data.fullName.length < 2) {
    errors.push({ field: 'fullName', message: 'Full name is required' });
  }
  if (!data.phone || !PHONE_RE.test(data.phone)) {
    errors.push({ field: 'phone', message: 'Valid phone number is required' });
  }
  if (!data.street || data.street.length < 5) {
    errors.push({ field: 'street', message: 'Address is required' });
  }
  if (!data.city) {
    errors.push({ field: 'city', message: 'City is required' });
  }
  if (!data.state) {
    errors.push({ field: 'state', message: 'State is required' });
  }
  if (!data.postalCode || !POSTAL_RE.test(data.postalCode)) {
    errors.push({ field: 'postalCode', message: 'Valid postal code is required' });
  }
  if (
    data.label &&
    !Object.values(ADDRESS_LABELS).includes(data.label)
  ) {
    errors.push({ field: 'label', message: 'Invalid address label' });
  }

  if (errors.length) {
    throw new ApiError(400, 'Invalid address', errors);
  }

  return data;
};

export const serializeAddress = (address) => ({
  id: address._id.toString(),
  label: address.label,
  fullName: address.fullName,
  phone: address.phone,
  street: address.street,
  address: address.street,
  landmark: address.landmark || '',
  city: address.city,
  state: address.state,
  postalCode: address.postalCode,
  country: address.country,
  isDefault: Boolean(address.isDefault),
  createdAt: address.createdAt,
  updatedAt: address.updatedAt,
});

const clearOtherDefaults = async (userId, keepId = null) => {
  const filter = { user: userId, isDefault: true };
  if (keepId) filter._id = { $ne: keepId };
  await Address.updateMany(filter, { $set: { isDefault: false } });
};

export const listAddresses = async (userId) => {
  const addresses = await Address.find({ user: userId }).sort({
    isDefault: -1,
    updatedAt: -1,
  });
  return addresses.map(serializeAddress);
};

export const createAddress = async (userId, payload) => {
  const data = validateAddressFields(payload);
  const count = await Address.countDocuments({ user: userId });

  if (count === 0) {
    data.isDefault = true;
  }

  if (data.isDefault) {
    await clearOtherDefaults(userId);
  }

  const address = await Address.create({ ...data, user: userId });
  return serializeAddress(address);
};

export const updateAddress = async (userId, addressId, payload) => {
  const address = await Address.findOne({ _id: addressId, user: userId });
  if (!address) {
    throw new ApiError(404, 'Address not found');
  }

  const data = validateAddressFields({
    ...serializeAddress(address),
    ...payload,
  });

  Object.assign(address, data);

  if (data.isDefault) {
    await clearOtherDefaults(userId, address._id);
    address.isDefault = true;
  }

  await address.save();
  return serializeAddress(address);
};

export const deleteAddress = async (userId, addressId) => {
  const address = await Address.findOne({ _id: addressId, user: userId });
  if (!address) {
    throw new ApiError(404, 'Address not found');
  }

  const wasDefault = address.isDefault;
  await address.deleteOne();

  if (wasDefault) {
    const next = await Address.findOne({ user: userId }).sort({
      updatedAt: -1,
    });
    if (next) {
      next.isDefault = true;
      await next.save();
    }
  }

  return { deleted: true };
};

export const setDefaultAddress = async (userId, addressId) => {
  const address = await Address.findOne({ _id: addressId, user: userId });
  if (!address) {
    throw new ApiError(404, 'Address not found');
  }

  await clearOtherDefaults(userId, address._id);
  address.isDefault = true;
  await address.save();
  return serializeAddress(address);
};

export const getUserAddressOrThrow = async (userId, addressId) => {
  const address = await Address.findOne({ _id: addressId, user: userId });
  if (!address) {
    throw new ApiError(404, 'Delivery address not found');
  }
  return address;
};
