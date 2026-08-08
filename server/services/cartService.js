import crypto from 'crypto';
import Cart from '../models/Cart.js';
import Pizza from '../models/Pizza.js';
import Coupon from '../models/Coupon.js';
import ApiError from '../utils/ApiError.js';
import { quoteCustomPizza } from './pizzaBuilderService.js';
import {
  BUILDER_BASES,
  BUILDER_CHEESES,
  BUILDER_SAUCES,
  BUILDER_SIZES,
  BUILDER_VEGETABLES,
} from '../config/pizzaBuilderPricing.js';
import {
  CART_CURRENCY,
  CART_DELIVERY_FEE,
  CART_FREE_DELIVERY_MIN,
  CART_TAX_RATE,
} from '../config/cartPricing.js';
import { COUPON_TYPES } from '../models/constants.js';

const labelOf = (catalog, key) => catalog[key]?.label || formatFallbackLabel(key);

const formatFallbackLabel = (key) =>
  String(key || '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());

const buildLabels = ({ size, base, sauce, cheese, vegetables }) => ({
  size: labelOf(BUILDER_SIZES, size),
  base: labelOf(BUILDER_BASES, base),
  sauce: labelOf(BUILDER_SAUCES, sauce),
  cheese: labelOf(BUILDER_CHEESES, cheese),
  vegetables: vegetables.map((v) => labelOf(BUILDER_VEGETABLES, v)),
});

const assertOwnerIdentity = ({ userId, guestId }) => {
  if (!userId && !guestId) {
    throw new ApiError(400, 'Authentication or guest session is required');
  }
};

export const buildFingerprint = ({
  itemType = 'custom',
  pizzaId = null,
  size,
  base,
  sauce,
  cheese,
  vegetables = [],
  extraCheese = false,
}) => {
  const veg = [...vegetables].map(String).sort().join(',');
  const extra = extraCheese ? '1' : '0';
  if (itemType === 'menu' && pizzaId) {
    return `menu:${pizzaId}:${size}:${base}:${sauce}:${cheese}:${veg}:${extra}`;
  }
  return `custom:${size}:${base}:${sauce}:${cheese}:${veg}:${extra}`;
};

const serializeCart = (cart, totals) => ({
  id: cart._id,
  items: cart.items.map((item) => ({
    id: item._id.toString(),
    fingerprint: item.fingerprint,
    itemType: item.itemType,
    pizzaId: item.pizza ? item.pizza.toString() : null,
    name: item.name,
    image: item.image,
    size: item.size,
    base: item.base,
    sauce: item.sauce,
    cheese: item.cheese,
    vegetables: item.vegetables,
    extraCheese: item.extraCheese,
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    lineTotal: item.lineTotal,
    labels: item.labels,
    isCustom: item.itemType === 'custom',
  })),
  couponCode: cart.couponCode,
  totals,
  updatedAt: cart.updatedAt,
});

export const calculateCartTotals = async (cart) => {
  const subtotal = cart.items.reduce((sum, item) => sum + item.lineTotal, 0);

  let discount = 0;
  let coupon = null;

  if (cart.couponCode) {
    coupon = await Coupon.findOne({
      code: cart.couponCode,
      isActive: true,
      startDate: { $lte: new Date() },
      endDate: { $gte: new Date() },
    });

    if (!coupon) {
      cart.couponCode = null;
    } else if (subtotal < (coupon.minOrderAmount || 0)) {
      discount = 0;
    } else if (coupon.discountType === COUPON_TYPES.PERCENTAGE) {
      discount = Math.round((subtotal * coupon.discountValue) / 100);
      if (coupon.maxDiscountAmount != null) {
        discount = Math.min(discount, coupon.maxDiscountAmount);
      }
    } else {
      discount = Math.min(subtotal, coupon.discountValue);
    }
  }

  const taxable = Math.max(0, subtotal - discount);
  const deliveryFee =
    taxable <= 0
      ? 0
      : taxable >= CART_FREE_DELIVERY_MIN
        ? 0
        : CART_DELIVERY_FEE;
  const tax = Math.round(taxable * CART_TAX_RATE);
  const grandTotal = taxable + deliveryFee + tax;

  return {
    subtotal,
    discount,
    deliveryFee,
    tax,
    taxRate: CART_TAX_RATE,
    grandTotal,
    currency: CART_CURRENCY,
    itemCount: cart.items.reduce((sum, item) => sum + item.quantity, 0),
    freeDeliveryMin: CART_FREE_DELIVERY_MIN,
    couponCode: cart.couponCode,
    couponValid: Boolean(coupon && discount >= 0 && cart.couponCode),
  };
};

export const getOrCreateCart = async ({ userId = null, guestId = null }) => {
  assertOwnerIdentity({ userId, guestId });

  let cart = null;
  if (userId) {
    cart = await Cart.findOne({ user: userId });
  } else {
    cart = await Cart.findOne({ guestId });
  }

  if (!cart) {
    cart = await Cart.create({
      user: userId || null,
      guestId: userId ? null : guestId,
      items: [],
    });
  }

  return cart;
};

const assertQuantity = (quantity) => {
  const qty = Number(quantity ?? 1);
  if (!Number.isInteger(qty) || qty < 1 || qty > 10) {
    throw new ApiError(400, 'Quantity must be an integer between 1 and 10');
  }
  return qty;
};

/**
 * Menu pizzas use catalog size prices; custom pizzas use builder quote.
 * Client-supplied unitPrice / total are always ignored.
 */
export const resolveConfiguredItem = async (payload) => {
  const itemType = payload.pizzaId ? 'menu' : 'custom';
  const quantity = assertQuantity(payload.quantity);
  const extraCheese = Boolean(payload.extraCheese);
  const vegetables = Array.isArray(payload.vegetables)
    ? [...new Set(payload.vegetables.map(String))]
    : [];

  if (itemType === 'custom') {
    const quote = quoteCustomPizza({
      size: payload.size,
      base: payload.base,
      sauce: payload.sauce,
      cheese: payload.cheese,
      vegetables,
      extraCheese,
      quantity,
    });

    const fingerprint = buildFingerprint({
      itemType: 'custom',
      size: quote.configuration.size,
      base: quote.configuration.base,
      sauce: quote.configuration.sauce,
      cheese: quote.configuration.cheese,
      vegetables: quote.configuration.vegetables,
      extraCheese: quote.configuration.extraCheese,
    });

    return {
      fingerprint,
      itemType: 'custom',
      pizza: null,
      name: payload.name || 'Custom SliceHub Pizza',
      image: null,
      size: quote.configuration.size,
      base: quote.configuration.base,
      sauce: quote.configuration.sauce,
      cheese: quote.configuration.cheese,
      vegetables: quote.configuration.vegetables,
      extraCheese: quote.configuration.extraCheese,
      quantity: quote.configuration.quantity,
      unitPrice: quote.breakdown.unitPrice,
      lineTotal: quote.breakdown.total,
      labels: quote.labels,
    };
  }

  const pizza = await Pizza.findById(payload.pizzaId);
  if (!pizza) {
    throw new ApiError(404, 'Pizza not found');
  }
  if (!pizza.isAvailable) {
    throw new ApiError(409, 'This pizza is currently unavailable');
  }

  const size = payload.size;
  const base = payload.base;
  const sauce = payload.sauce;
  const cheese = payload.cheese;
  const sizeRow = pizza.sizes?.find((entry) => entry.size === size);

  if (!sizeRow) {
    throw new ApiError(400, 'Selected size is not available for this pizza');
  }
  if (!pizza.availableBases?.includes(base)) {
    throw new ApiError(400, 'Selected base is not available for this pizza');
  }
  if (!pizza.availableSauces?.includes(sauce)) {
    throw new ApiError(400, 'Selected sauce is not available for this pizza');
  }
  if (!pizza.availableCheeses?.includes(cheese)) {
    throw new ApiError(400, 'Selected cheese is not available for this pizza');
  }

  const invalidVeg = vegetables.filter(
    (veg) => !pizza.availableVegetables?.includes(veg),
  );
  if (invalidVeg.length > 0) {
    throw new ApiError(
      400,
      `Invalid vegetables for this pizza: ${invalidVeg.join(', ')}`,
    );
  }

  const unitPrice =
    Number(sizeRow.price) +
    (extraCheese ? Number(pizza.extraCheesePrice || 0) : 0);

  const fingerprint = buildFingerprint({
    itemType: 'menu',
    pizzaId: pizza._id,
    size,
    base,
    sauce,
    cheese,
    vegetables,
    extraCheese,
  });

  return {
    fingerprint,
    itemType: 'menu',
    pizza: pizza._id,
    name: pizza.name,
    image: pizza.image,
    size,
    base,
    sauce,
    cheese,
    vegetables,
    extraCheese,
    quantity,
    unitPrice,
    lineTotal: unitPrice * quantity,
    labels: buildLabels({ size, base, sauce, cheese, vegetables }),
  };
};

const requoteExistingItem = async (item, quantity) => {
  return resolveConfiguredItem({
    pizzaId: item.pizza || undefined,
    name: item.name,
    size: item.size,
    base: item.base,
    sauce: item.sauce,
    cheese: item.cheese,
    vegetables: item.vegetables,
    extraCheese: item.extraCheese,
    quantity,
  });
};

export const getCartView = async ({ userId, guestId }) => {
  const cart = await getOrCreateCart({ userId, guestId });
  const totals = await calculateCartTotals(cart);
  await cart.save();
  return serializeCart(cart, totals);
};

export const addCartItem = async ({ userId, guestId, payload }) => {
  const cart = await getOrCreateCart({ userId, guestId });
  const configured = await resolveConfiguredItem(payload);

  const existing = cart.items.find(
    (item) => item.fingerprint === configured.fingerprint,
  );

  if (existing) {
    const nextQty = existing.quantity + configured.quantity;
    if (nextQty > 10) {
      throw new ApiError(400, 'Quantity cannot exceed 10 for this item');
    }
    existing.quantity = nextQty;
    existing.unitPrice = configured.unitPrice;
    existing.lineTotal = configured.unitPrice * nextQty;
    existing.labels = configured.labels;
  } else {
    cart.items.push(configured);
  }

  await cart.save();
  const totals = await calculateCartTotals(cart);
  await cart.save();
  return serializeCart(cart, totals);
};

export const updateCartItemQuantity = async ({
  userId,
  guestId,
  itemId,
  quantity,
}) => {
  const qty = Number(quantity);
  if (!Number.isInteger(qty) || qty < 0 || qty > 10) {
    throw new ApiError(400, 'Quantity must be an integer between 0 and 10');
  }

  const cart = await getOrCreateCart({ userId, guestId });
  const item = cart.items.id(itemId);
  if (!item) {
    throw new ApiError(404, 'Cart item not found');
  }

  if (qty === 0) {
    item.deleteOne();
  } else {
    const requoted = await requoteExistingItem(item, qty);
    item.quantity = requoted.quantity;
    item.unitPrice = requoted.unitPrice;
    item.lineTotal = requoted.lineTotal;
    item.labels = requoted.labels;
  }

  await cart.save();
  const totals = await calculateCartTotals(cart);
  await cart.save();
  return serializeCart(cart, totals);
};

export const removeCartItem = async ({ userId, guestId, itemId }) => {
  const cart = await getOrCreateCart({ userId, guestId });
  const item = cart.items.id(itemId);
  if (!item) {
    throw new ApiError(404, 'Cart item not found');
  }
  item.deleteOne();
  await cart.save();
  const totals = await calculateCartTotals(cart);
  await cart.save();
  return serializeCart(cart, totals);
};

export const clearCart = async ({ userId, guestId }) => {
  const cart = await getOrCreateCart({ userId, guestId });
  cart.items = [];
  cart.couponCode = null;
  await cart.save();
  const totals = await calculateCartTotals(cart);
  return serializeCart(cart, totals);
};

export const applyCoupon = async ({ userId, guestId, code }) => {
  const cart = await getOrCreateCart({ userId, guestId });
  if (!code || !String(code).trim()) {
    throw new ApiError(400, 'Coupon code is required');
  }

  const coupon = await Coupon.findOne({
    code: String(code).trim().toUpperCase(),
    isActive: true,
  });

  if (!coupon) {
    throw new ApiError(404, 'Coupon not found');
  }

  const now = new Date();
  if (coupon.startDate > now || coupon.endDate < now) {
    throw new ApiError(400, 'Coupon is not active');
  }

  const provisionalSubtotal = cart.items.reduce(
    (sum, item) => sum + item.lineTotal,
    0,
  );
  if (provisionalSubtotal < (coupon.minOrderAmount || 0)) {
    throw new ApiError(
      400,
      `Minimum order amount for this coupon is ${coupon.minOrderAmount}`,
    );
  }

  cart.couponCode = coupon.code;
  await cart.save();
  const totals = await calculateCartTotals(cart);
  await cart.save();
  return serializeCart(cart, totals);
};

export const removeCoupon = async ({ userId, guestId }) => {
  const cart = await getOrCreateCart({ userId, guestId });
  cart.couponCode = null;
  await cart.save();
  const totals = await calculateCartTotals(cart);
  return serializeCart(cart, totals);
};

/**
 * Merge guest cart into authenticated user cart after login.
 */
export const mergeGuestCartIntoUser = async ({ userId, guestId }) => {
  if (!userId || !guestId) {
    return getCartView({ userId, guestId: null });
  }

  const userCart = await getOrCreateCart({ userId, guestId: null });
  const guestCart = await Cart.findOne({ guestId });

  if (!guestCart || guestCart.items.length === 0) {
    return getCartView({ userId, guestId: null });
  }

  for (const guestItem of guestCart.items) {
    const existing = userCart.items.find(
      (item) => item.fingerprint === guestItem.fingerprint,
    );
    if (existing) {
      existing.quantity = Math.min(10, existing.quantity + guestItem.quantity);
      existing.unitPrice = guestItem.unitPrice;
      existing.lineTotal = existing.unitPrice * existing.quantity;
    } else {
      userCart.items.push({
        fingerprint: guestItem.fingerprint,
        itemType: guestItem.itemType,
        pizza: guestItem.pizza,
        name: guestItem.name,
        image: guestItem.image,
        size: guestItem.size,
        base: guestItem.base,
        sauce: guestItem.sauce,
        cheese: guestItem.cheese,
        vegetables: guestItem.vegetables,
        extraCheese: guestItem.extraCheese,
        quantity: guestItem.quantity,
        unitPrice: guestItem.unitPrice,
        lineTotal: guestItem.lineTotal,
        labels: guestItem.labels,
      });
    }
  }

  if (guestCart.couponCode && !userCart.couponCode) {
    userCart.couponCode = guestCart.couponCode;
  }

  await userCart.save();
  await Cart.deleteOne({ _id: guestCart._id });

  const totals = await calculateCartTotals(userCart);
  await userCart.save();
  return serializeCart(userCart, totals);
};

export const createGuestId = () => crypto.randomUUID();
