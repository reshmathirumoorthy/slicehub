import cron from 'node-cron';
import env from '../config/env.js';
import { runLowStockAlertJob } from './lowStockAlertJob.js';

/**
 * Register inventory cron jobs. Safe to call once at server boot.
 */
export const startInventoryJobs = () => {
  const schedule = env.inventory.cronSchedule || '0 * * * *';

  if (!cron.validate(schedule)) {
    console.error(`[cron] Invalid INVENTORY_CRON schedule: ${schedule}`);
    return null;
  }

  const task = cron.schedule(schedule, async () => {
    try {
      await runLowStockAlertJob();
    } catch (error) {
      console.error('[cron] low-stock job failed:', error.message);
    }
  });

  console.log(`[cron] Low-stock inventory alerts scheduled (${schedule})`);
  return task;
};
