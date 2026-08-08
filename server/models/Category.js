import mongoose from 'mongoose';

/**
 * Menu category (e.g. Classic, Veg, Non-Veg, Premium).
 */
const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Category name is required'],
      trim: true,
      unique: true,
      minlength: [2, 'Category name must be at least 2 characters'],
      maxlength: [60, 'Category name cannot exceed 60 characters'],
    },
    slug: {
      type: String,
      required: [true, 'Category slug is required'],
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
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
      default: '',
    },
    image: {
      type: String,
      default: null,
      trim: true,
    },
    sortOrder: {
      type: Number,
      default: 0,
      min: [0, 'Sort order cannot be negative'],
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

categorySchema.index({ sortOrder: 1, name: 1 });

categorySchema.virtual('pizzas', {
  ref: 'Pizza',
  localField: '_id',
  foreignField: 'category',
});

const Category = mongoose.model('Category', categorySchema);

export default Category;
