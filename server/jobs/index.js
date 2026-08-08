import cron from 'node-cron';
import env from '../config/env.js';
import { runLowStockAlertJob } from './lowStockAlertJob.js';
import { cleanupOldNotifications } from '../services/notificationService.js';
import { NOTIFICATION_RETENTION_DAYS } from '../models/constants.js';

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

/**
 * Daily cleanup of old in-app notifications (does not touch orders/payments).
 */
export const startNotificationCleanupJob = () => {
  const schedule = '15 3 * * *'; // 03:15 daily
  if (!cron.validate(schedule)) return null;

  const task = cron.schedule(schedule, async () => {
    try {
      const result = await cleanupOldNotifications(NOTIFICATION_RETENTION_DAYS);
      console.info(
        `[cron] notification cleanup deleted ${result.deleted} (older than ${NOTIFICATION_RETENTION_DAYS}d)`,
      );
    } catch (error) {
      console.error('[cron] notification cleanup failed:', error.message);
    }
  });

  console.log(
    `[cron] Notification cleanup scheduled (${schedule}, retain ${NOTIFICATION_RETENTION_DAYS}d)`,
  );
  return task;
};

export const startAllJobs = () => {
  startInventoryJobs();
  startNotificationCleanupJob();
};
