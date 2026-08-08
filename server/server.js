import createApp from './app.js';
import connectDB from './config/db.js';
import env from './config/env.js';
import { startInventoryJobs } from './jobs/index.js';

/**
 * Server entry point.
 * Connects to MongoDB, starts HTTP, registers cron jobs.
 */
const startServer = async () => {
  await connectDB();

  const app = createApp();

  app.listen(env.port, () => {
    console.log(
      `SliceHub server running in ${env.nodeEnv} mode on port ${env.port}`,
    );
  });

  startInventoryJobs();
};

startServer().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
