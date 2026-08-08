/**
 * Seed a sample coupon for cart discount testing.
 * Usage: node utils/seedCoupon.js
 */
import mongoose from 'mongoose';
import env from '../config/env.js';
import Coupon from '../models/Coupon.js';
import { COUPON_TYPES } from '../models/constants.js';

const seedCoupon = async () => {
  await mongoose.connect(env.mongodbUri);

  const now = new Date();
  const end = new Date();
  end.setFullYear(end.getFullYear() + 1);

  const coupon = await Coupon.findOneAndUpdate(
    { code: 'SLICE10' },
    {
      code: 'SLICE10',
      description: '10% off your pizza order',
      discountType: COUPON_TYPES.PERCENTAGE,
      discountValue: 10,
      minOrderAmount: 200,
      maxDiscountAmount: 150,
      startDate: now,
      endDate: end,
      usageLimit: 1000,
      usedCount: 0,
      perUserLimit: 5,
      isActive: true,
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );

  console.log('Coupon ready:', coupon.code);
  await mongoose.disconnect();
};

seedCoupon().catch(async (error) => {
  console.error(error.message);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
