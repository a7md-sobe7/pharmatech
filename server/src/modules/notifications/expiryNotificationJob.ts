import { PharmacyInventory } from '../../models/PharmacyInventory.js';
import { Notification } from '../../models/Notification.js';
import { PushNotificationService } from './pushNotificationService.js';
import { NotificationTemplates } from './notificationTemplates.js';

export class ExpiryNotificationJob {
  /**
   * Evaluates all inventory batches for impending expiry and dispatches alerts
   */
  public static async runCheck(): Promise<{ evaluated: number; alertsSent: number }> {
    try {
      const now = new Date();
      const thirtyDaysAhead = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      // Find items expiring within 30 days or already expired
      const expiringItems = await PharmacyInventory.find({
        expirationDate: { $lte: thirtyDaysAhead }
      }).lean();

      let alertsSent = 0;

      for (const item of expiringItems) {
        if (!item.expirationDate) continue;

        const expDate = new Date(item.expirationDate);
        const diffMs = expDate.getTime() - now.getTime();
        const daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

        // Determine tier
        let tier = '';
        if (daysLeft <= 0) {
          tier = 'EXPIRED';
        } else if (daysLeft <= 7) {
          tier = '7_DAYS';
        } else if (daysLeft <= 14) {
          tier = '14_DAYS';
        } else if (daysLeft <= 30) {
          tier = '30_DAYS';
        }

        if (!tier) continue;

        // Deduplication: Check if an alert for this batch and tier was sent recently (last 24 hours)
        const recentAlert = await Notification.findOne({
          type: 'EXPIRY_WARNING',
          'data.batchNumber': item.batchNumber,
          'data.expiryTier': tier,
          createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
        });

        if (recentAlert) {
          continue; // Already notified recently
        }

        const template = NotificationTemplates.EXPIRY_WARNING(
          item.productName,
          item.batchNumber,
          daysLeft,
          String(item._id)
        );

        if (template.data) {
          template.data.expiryTier = tier;
        }

        await PushNotificationService.broadcast(template);
        alertsSent++;
      }

      console.log(`[ExpiryNotificationJob] Evaluated ${expiringItems.length} items, dispatched ${alertsSent} expiry notifications.`);
      return { evaluated: expiringItems.length, alertsSent };
    } catch (err: any) {
      console.error('[ExpiryNotificationJob] Error during expiry evaluation:', err.message);
      return { evaluated: 0, alertsSent: 0 };
    }
  }

  /**
   * Start periodic cron-like timer for expiry checks (every 12 hours)
   */
  public static startSchedule(intervalMs: number = 12 * 60 * 60 * 1000): NodeJS.Timeout {
    // Run initial check after 10 seconds of startup
    setTimeout(() => {
      this.runCheck().catch(console.error);
    }, 10000);

    return setInterval(() => {
      this.runCheck().catch(console.error);
    }, intervalMs);
  }
}
