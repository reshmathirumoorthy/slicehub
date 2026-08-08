import mongoose from 'mongoose';
import env from './env.js';

/**
 * Establishes the MongoDB connection.
 * Models and seed data are intentionally deferred to later phases.
 */
const connectDB = async () => {
  try {
    const connection = await mongoose.connect(env.mongodbUri);
    console.log(`MongoDB connected: ${connection.connection.host}`);
  } catch (error) {
    console.error(`MongoDB connection error: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;
