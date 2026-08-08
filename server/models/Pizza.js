import mongoose from 'mongoose';
import {
  PIZZA_BASES,
  PIZZA_CHEESES,
  PIZZA_SAUCES,
  PIZZA_SIZES,
  PIZZA_VEGETABLES,
} from './constants.js';

/**
 * Size-based pricing for a pizza.
 */
const sizePriceSchema = new mongoose.Schema(
  {
    size: {
      type: String,
      enum: {
        values: Object.values(PIZZA_SIZES),
        message: 'Invalid pizza size',
      },
      required: true,
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative'],
    },
  },
  { _id: false },
);

/**
 * Menu pizza item.
 */
const pizzaSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Pizza name is required'],
      trim: true,
      minlength: [2, 'Pizza name must be at least 2 characters'],
      maxlength: [100, 'Pizza name cannot exceed 100 characters'],
    },
    slug: {
      type: String,
      required: [true, 'Pizza slug is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
        'Slug must be lowercase kebab-case',
      ],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Category is required'],
      index: true,
    },
    image: {
      type: String,
      default: null,
      trim: true,
    },
    basePrice: {
      type: Number,
      required: [true, 'Base price is required'],
      min: [0, 'Base price cannot be negative'],
      index: true,
    },
    sizes: {
      type: [sizePriceSchema],
      validate: {
        validator(value) {
          return Array.isArray(value) && value.length > 0;
        },
        message: 'At least one size/price is required',
      },
    },
    availableBases: {
      type: [
        {
          type: String,
          enum: {
            values: Object.values(PIZZA_BASES),
            message: 'Invalid pizza base',
          },
        },
      ],
      default: [PIZZA_BASES.THIN],
    },
    availableSauces: {
      type: [
        {
          type: String,
          enum: {
            values: Object.values(PIZZA_SAUCES),
            message: 'Invalid pizza sauce',
          },
        },
      ],
      default: [PIZZA_SAUCES.TOMATO],
    },
    availableCheeses: {
      type: [
        {
          type: String,
          enum: {
            values: Object.values(PIZZA_CHEESES),
            message: 'Invalid pizza cheese',
          },
        },
      ],
      default: [PIZZA_CHEESES.MOZZARELLA],
    },
    availableVegetables: {
      type: [
        {
          type: String,
          enum: {
            values: Object.values(PIZZA_VEGETABLES),
            message: 'Invalid vegetable option',
          },
        },
      ],
      default: [],
    },
    extraCheesePrice: {
      type: Number,
      default: 50,
      min: [0, 'Extra cheese price cannot be negative'],
    },
    ingredients: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Inventory',
        },
      ],
      default: [],
    },
    isVegetarian: {
      type: Boolean,
      default: false,
      index: true,
    },
    isAvailable: {
      type: Boolean,
      default: true,
      index: true,
    },
    preparationTimeMinutes: {
      type: Number,
      default: 20,
      min: [5, 'Preparation time must be at least 5 minutes'],
      max: [180, 'Preparation time cannot exceed 180 minutes'],
    },
    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
      index: true,
    },
    reviewCount: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

pizzaSchema.index({ name: 'text', description: 'text' });
pizzaSchema.index({ isAvailable: 1, category: 1 });
pizzaSchema.index({ basePrice: 1 });
pizzaSchema.index({ averageRating: -1, reviewCount: -1 });

pizzaSchema.virtual('reviews', {
  ref: 'Review',
  localField: '_id',
  foreignField: 'pizza',
});

const Pizza = mongoose.model('Pizza', pizzaSchema);

export default Pizza;
