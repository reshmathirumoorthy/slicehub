import Admin from '../models/Admin.js';
import env from '../config/env.js';
import { sendEmail } from '../services/emailService.js';
import {
  getItemsNeedingAlert,
  markAlerted,
  serializeInventoryItem,
} from '../services/inventoryService.js';
import { INVENTORY_STOCK_STATUS } from '../models/constants.js';
import { notifyLowStockDigest } from '../services/notificationEvents.js';

const resolveAlertRecipients = async () => {
  if (env.inventory.alertEmail) {
    return [env.inventory.alertEmail];
  }
  const admins = await Admin.find({ isActive: true })
    .select('email')
    .limit(20);
  return admins.map((a) => a.email).filter(Boolean);
};

/**
 * Scheduled / manual low-stock digest.
 * Skips SKUs already alerted within the cooldown window (anti-spam).
 */
export const runLowStockAlertJob = async ({ force = false } = {}) => {
  const cooldown = force ? 0 : env.inventory.alertCooldownHours;
  const items = await getItemsNeedingAlert(cooldown);

  if (!items.length) {
    return {
      sent: false,
      reason: 'nothing_to_alert',
      count: 0,
    };
  }

  const serialized = items.map(serializeInventoryItem);
  const out = serialized.filter(
    (i) => i.stockStatus === INVENTORY_STOCK_STATUS.OUT_OF_STOCK,
  );
  const low = serialized.filter(
    (i) => i.stockStatus === INVENTORY_STOCK_STATUS.LOW_STOCK,
  );

  const recipients = await resolveAlertRecipients();
  if (!recipients.length) {
    console.warn('[inventory-alert] No admin email recipients configured');
    await notifyLowStockDigest({
      count: items.length,
      outOfStock: out.length,
      lowStock: low.length,
    });
    return {
      sent: false,
      reason: 'no_recipients',
      count: items.length,
    };
  }

  const lines = serialized
    .map(
      (i) =>
        `- [${i.stockStatus}] ${i.name} (${i.category}/${i.itemKey}): ${i.quantityInStock} ${i.unit} (threshold ${i.minimumThreshold})`,
    )
    .join('\n');

  const subject = `[SliceHub] Inventory alert: ${out.length} out · ${low.length} low`;
  const text = `SliceHub inventory needs attention:\n\n${lines}\n\nOpen Admin → Inventory to restock.`;
  const html = `
    <h2>SliceHub inventory alert</h2>
    <p><strong>${out.length}</strong> out of stock · <strong>${low.length}</strong> low stock</p>
    <ul>
      ${serialized
        .map(
          (i) =>
            `<li><strong>${i.name}</strong> — ${i.quantityInStock} ${i.unit} (${i.stockStatus.replace(/_/g, ' ')})</li>`,
        )
        .join('')}
    </ul>
    <p>Open the admin inventory dashboard to restock.</p>
  `;

  await sendEmail({
    to: recipients.join(', '),
    subject,
    text,
    html,
  });

  await markAlerted(items.map((i) => i._id));

  await notifyLowStockDigest({
    count: items.length,
    outOfStock: out.length,
    lowStock: low.length,
  });

  console.info(
    `[inventory-alert] Sent digest for ${items.length} item(s) to ${recipients.length} recipient(s)`,
  );

  return {
    sent: true,
    count: items.length,
    outOfStock: out.length,
    lowStock: low.length,
    recipients,
  };
};
