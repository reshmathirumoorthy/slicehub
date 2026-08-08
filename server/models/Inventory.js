import mongoose from 'mongoose';
import {
  INVENTORY_CATEGORIES,
  INVENTORY_STOCK_STATUS,
  INVENTORY_UNITS,
} from './constants.js';

/**
 * Stock / ingredient inventory item (bases, sauces, cheeses, vegetables).
 */
const inventorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Inventory item name is required'],
      trim: true,
      unique: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    sku: {
      type: String,
      required: [true, 'SKU is required'],
      unique: true,
      uppercase: true,
      trim: true,
      maxlength: [40, 'SKU cannot exceed 40 characters'],
    },
    /** Stable key matching order/builder customization values */
    itemKey: {
      type: String,
      required: [true, 'Item key is required'],
      trim: true,
      lowercase: true,
      index: true,
    },
    category: {
      type: String,
      enum: {
        values: Object.values(INVENTORY_CATEGORIES),
        message: 'Invalid inventory category',
      },
      required: [true, 'Category is required'],
      index: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
      default: '',
    },
    unit: {
      type: String,
      enum: {
        values: Object.values(INVENTORY_UNITS),
        message: 'Invalid inventory unit',
      },
      required: [true, 'Unit is required'],
      default: INVENTORY_UNITS.PIECE,
    },
    quantityInStock: {
      type: Number,
      required: [true, 'Quantity in stock is required'],
      min: [0, 'Quantity cannot be negative'],
      default: 0,
    },
    /** Phase 10 minimumThreshold — alias field kept in sync with reorderLevel */
    minimumThreshold: {
      type: Number,
      required: [true, 'Minimum threshold is required'],
      min: [0, 'Minimum threshold cannot be negative'],
      default: 10,
    },
    reorderLevel: {
      type: Number,
      required: [true, 'Reorder level is required'],
      min: [0, 'Reorder level cannot be negative'],
      default: 10,
    },
    unitCost: {
      type: Number,
      min: [0, 'Unit cost cannot be negative'],
      default: 0,
    },
    supplier: {
      type: String,
      trim: true,
      maxlength: [120, 'Supplier cannot exceed 120 characters'],
      default: '',
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    lastRestockedAt: {
      type: Date,
      default: null,
    },
    /** Anti-spam: last low/out-of-stock admin email for this SKU */
    lastLowStockAlertAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

inventorySchema.index({ category: 1, itemKey: 1 }, { unique: true });
inventorySchema.index({ quantityInStock: 1, minimumThreshold: 1 });
inventorySchema.index({ name: 'text' });

inventorySchema.pre('validate', function syncThreshold(next) {
  if (this.isModified('minimumThreshold') && !this.isModified('reorderLevel')) {
    this.reorderLevel = this.minimumThreshold;
  } else if (
    this.isModified('reorderLevel') &&
    !this.isModified('minimumThreshold')
  ) {
    this.minimumThreshold = this.reorderLevel;
  } else if (this.minimumThreshold == null && this.reorderLevel != null) {
    this.minimumThreshold = this.reorderLevel;
  } else if (this.reorderLevel == null && this.minimumThreshold != null) {
    this.reorderLevel = this.minimumThreshold;
  }
  next();
});

inventorySchema.virtual('isLowStock').get(function isLowStock() {
  const threshold = this.minimumThreshold ?? this.reorderLevel ?? 0;
  return this.quantityInStock > 0 && this.quantityInStock <= threshold;
});

inventorySchema.virtual('isOutOfStock').get(function isOutOfStock() {
  return this.quantityInStock <= 0;
});

inventorySchema.virtual('stockStatus').get(function stockStatus() {
  if (this.quantityInStock <= 0) return INVENTORY_STOCK_STATUS.OUT_OF_STOCK;
  const threshold = this.minimumThreshold ?? this.reorderLevel ?? 0;
  if (this.quantityInStock <= threshold) {
    return INVENTORY_STOCK_STATUS.LOW_STOCK;
  }
  return INVENTORY_STOCK_STATUS.IN_STOCK;
});

const Inventory = mongoose.model('Inventory', inventorySchema);

export default Inventory;
