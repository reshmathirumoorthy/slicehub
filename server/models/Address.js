import mongoose from 'mongoose';
import { ADDRESS_LABELS } from './constants.js';

/**
 * Delivery address belonging to a customer.
 */
const addressSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User is required'],
      index: true,
    },
    label: {
      type: String,
      enum: {
        values: Object.values(ADDRESS_LABELS),
        message: 'Invalid address label',
      },
      default: ADDRESS_LABELS.HOME,
    },
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
      maxlength: [80, 'Full name cannot exceed 80 characters'],
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
    },
    street: {
      type: String,
      required: [true, 'Street address is required'],
      trim: true,
      maxlength: [200, 'Street cannot exceed 200 characters'],
    },
    landmark: {
      type: String,
      trim: true,
      maxlength: [120, 'Landmark cannot exceed 120 characters'],
      default: '',
    },
    city: {
      type: String,
      required: [true, 'City is required'],
      trim: true,
      maxlength: [80, 'City cannot exceed 80 characters'],
    },
    state: {
      type: String,
      required: [true, 'State is required'],
      trim: true,
      maxlength: [80, 'State cannot exceed 80 characters'],
    },
    postalCode: {
      type: String,
      required: [true, 'Postal code is required'],
      trim: true,
      maxlength: [20, 'Postal code cannot exceed 20 characters'],
    },
    country: {
      type: String,
      required: [true, 'Country is required'],
      trim: true,
      default: 'India',
      maxlength: [80, 'Country cannot exceed 80 characters'],
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
      },
      coordinates: {
        type: [Number],
        validate: {
          validator(value) {
            if (value == null) return true;
            return (
              Array.isArray(value) &&
              value.length === 2 &&
              value.every((n) => typeof n === 'number')
            );
          },
          message: 'Coordinates must be [longitude, latitude]',
        },
      },
    },
    isDefault: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  },
);

addressSchema.index({ user: 1, isDefault: 1 });
addressSchema.index({ location: '2dsphere' }, { sparse: true });

const Address = mongoose.model('Address', addressSchema);

export default Address;
