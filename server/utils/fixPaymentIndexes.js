/**
 * One-shot repair: unpaid payments must not collide on sparse unique null ids.
 * Usage: node utils/fixPaymentIndexes.js
 */
import mongoose from 'mongoose';
import env from '../config/env.js';

const run = async () => {
  await mongoose.connect(env.mongodbUri);
  const col = mongoose.connection.db.collection('payments');

  const unset = await col.updateMany(
    {
      $or: [
        { transactionId: null },
        { razorpayPaymentId: null },
        { razorpayOrderId: null },
      ],
    },
    {
      $unset: {
        transactionId: '',
        razorpayPaymentId: '',
        razorpayOrderId: '',
      },
    },
  );
  console.log('Unset null gateway ids on', unset.modifiedCount, 'payments');

  for (const name of ['transactionId_1', 'razorpayPaymentId_1']) {
    try {
      await col.dropIndex(name);
      console.log('Dropped', name);
    } catch (error) {
      console.log('Skip drop', name, '-', error.message);
    }
  }

  await col.createIndex(
    { transactionId: 1 },
    {
      unique: true,
      name: 'transactionId_1',
      partialFilterExpression: { transactionId: { $type: 'string' } },
    },
  );
  await col.createIndex(
    { razorpayPaymentId: 1 },
    {
      unique: true,
      name: 'razorpayPaymentId_1',
      partialFilterExpression: { razorpayPaymentId: { $type: 'string' } },
    },
  );

  console.log(
    'Indexes:',
    (await col.indexes()).map((idx) => ({
      name: idx.name,
      unique: idx.unique,
      sparse: idx.sparse,
      partial: idx.partialFilterExpression,
    })),
  );

  await mongoose.disconnect();
};

run().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
