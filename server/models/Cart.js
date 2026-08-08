import mongoose from 'mongoose';

/**
 * Shopping cart — one per authenticated user or guest session.
 * Item prices are always written by the server, never trusted from clients.
 */
const cartItemSchema = new mongoose.Schema(
  {
    fingerprint: {
      type: String,
      required: true,
      index: true,
    },
    itemType: {
      type: String,
      enum: ['custom', 'menu'],
      default: 'custom',
    },
    pizza: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Pizza',
      default: null,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    image: {
      type: String,
      default: null,
    },
    size: {
      type: String,
      required: true,
      trim: true,
    },
    base: {
      type: String,
      required: true,
      trim: true,
    },
    sauce: {
      type: String,
      required: true,
      trim: true,
    },
    cheese: {
      type: String,
      required: true,
      trim: true,
    },
    vegetables: {
      type: [{ type: String, trim: true }],
      default: [],
    },
    extraCheese: {
      type: Boolean,
      default: false,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
      max: 10,
    },
    unitPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    lineTotal: {
      type: Number,
      required: true,
      min: 0,
    },
    labels: {
      size: String,
      base: String,
      sauce: String,
      cheese: String,
      vegetables: [String],
    },
  },
  { _id: true, timestamps: true },
);

const cartSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    guestId: {
      type: String,
      default: null,
      trim: true,
    },
    items: {
      type: [cartItemSchema],
      default: [],
    },
    couponCode: {
      type: String,
      default: null,
      uppercase: true,
      trim: true,
    },
  },
  { timestamps: true },
);

cartSchema.index(
  { user: 1 },
  {
    unique: true,
    partialFilterExpression: { user: { $type: 'objectId' } },
  },
);

cartSchema.index(
  { guestId: 1 },
  {
    unique: true,
    partialFilterExpression: { guestId: { $type: 'string' } },
  },
);

const Cart = mongoose.model('Cart', cartSchema);

export default Cart;
