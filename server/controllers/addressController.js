import asyncHandler from '../utils/asyncHandler.js';
import * as addressService from '../services/addressService.js';

export const listAddresses = asyncHandler(async (req, res) => {
  const addresses = await addressService.listAddresses(req.user._id);
  res.status(200).json({
    success: true,
    data: { addresses },
  });
});

export const createAddress = asyncHandler(async (req, res) => {
  const address = await addressService.createAddress(req.user._id, req.body);
  res.status(201).json({
    success: true,
    message: 'Address added',
    data: { address },
  });
});

export const updateAddress = asyncHandler(async (req, res) => {
  const address = await addressService.updateAddress(
    req.user._id,
    req.params.id,
    req.body,
  );
  res.status(200).json({
    success: true,
    message: 'Address updated',
    data: { address },
  });
});

export const deleteAddress = asyncHandler(async (req, res) => {
  await addressService.deleteAddress(req.user._id, req.params.id);
  res.status(200).json({
    success: true,
    message: 'Address deleted',
  });
});

export const setDefaultAddress = asyncHandler(async (req, res) => {
  const address = await addressService.setDefaultAddress(
    req.user._id,
    req.params.id,
  );
  res.status(200).json({
    success: true,
    message: 'Default address updated',
    data: { address },
  });
});
