import webpush from 'web-push';
import { PushSubscription, IPushSubscriptionDoc } from '../../models/PushSubscription.js';
import { Notification, INotificationDoc } from '../../models/Notification.js';
import { NotificationPreference, INotificationPreferenceDoc } from '../../models/NotificationPreference.js';
import { User } from '../../models/User.js';
import { NotificationPayload } from './notificationTemplates.js';
import { UserRole, NotificationType } from '../../types/index.js';

// Setup VAPID keys
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || 'BNhuMXcIPbqG6SYrgnoI6arrCZ5T6Y7G8-APHTkH8du94j4fw_36ivpbfb2tXyb8oObORPiNWXPth02ih3_4-iE';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || '3F-XW9zQYgmckMxGehzZMPrz-O0dYx5rQtkpivqXtbU';
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:admin@pharmamatch.ai';

try {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
} catch (err: any) {
  console.warn('[PushNotificationService] Failed to configure VAPID details:', err.message);
}

// Map notification type to preference field
const TYPE_TO_PREF_KEY: Record<NotificationType, keyof INotificationPreferenceDoc> = {
  LOW_STOCK: 'lowStock',
  OUT_OF_STOCK: 'outOfStock',
  EXPIRY_WARNING: 'expiry',
  SALE: 'sales',
  ADMIN_ALERT: 'adminAlerts',
  SYSTEM_ALERT: 'systemAlerts',
  NEW_USER: 'adminAlerts',
  SHIFT_ALERT: 'shiftAlerts'
};

export class PushNotificationService {
  /**
   * Get the public VAPID key for frontend registration
   */
  public static getPublicKey(): string {
    return VAPID_PUBLIC_KEY;
  }

  /**
   * Register or update a browser push subscription for a user
   */
  public static async subscribe(
    userId: string,
    subscriptionData: { endpoint: string; keys: { p256dh: string; auth: string } },
    deviceName: string = 'Web Browser',
    browser: string = 'Chrome'
  ): Promise<IPushSubscriptionDoc> {
    if (!subscriptionData.endpoint || !subscriptionData.keys?.p256dh || !subscriptionData.keys?.auth) {
      throw new Error('Invalid subscription data structure.');
    }

    const existing = await PushSubscription.findOne({ endpoint: subscriptionData.endpoint });

    if (existing) {
      existing.userId = userId;
      existing.keys = subscriptionData.keys;
      existing.deviceName = deviceName;
      existing.browser = browser;
      existing.isActive = true;
      return await existing.save();
    }

    const newSub = new PushSubscription({
      userId,
      endpoint: subscriptionData.endpoint,
      keys: subscriptionData.keys,
      deviceName,
      browser,
      isActive: true
    });

    return await newSub.save();
  }

  /**
   * Unsubscribe / deactivate a push subscription endpoint
   */
  public static async unsubscribe(userId: string, endpoint?: string): Promise<boolean> {
    const query: any = { userId };
    if (endpoint) query.endpoint = endpoint;

    await PushSubscription.updateMany(query, { isActive: false });
    return true;
  }

  /**
   * Get user notification preferences (initializes defaults if not present)
   */
  public static async getPreferences(userId: string): Promise<INotificationPreferenceDoc> {
    let pref = await NotificationPreference.findOne({ userId });
    if (!pref) {
      pref = await NotificationPreference.create({
        userId,
        lowStock: true,
        outOfStock: true,
        expiry: true,
        sales: false,
        adminAlerts: true,
        shiftAlerts: true,
        systemAlerts: true,
        enabledAll: true
      });
    }
    return pref;
  }

  /**
   * Update user notification preferences
   */
  public static async updatePreferences(
    userId: string,
    updates: Partial<INotificationPreferenceDoc>
  ): Promise<INotificationPreferenceDoc> {
    let pref = await NotificationPreference.findOne({ userId });
    if (!pref) {
      pref = new NotificationPreference({ userId, ...updates });
    } else {
      Object.assign(pref, updates);
    }
    return await pref.save();
  }

  /**
   * Check if a user allows notifications for a specific type
   */
  public static async isNotificationEnabledForUser(userId: string, type: NotificationType): Promise<boolean> {
    const pref = await this.getPreferences(userId);
    if (!pref.enabledAll) return false;

    const prefKey = TYPE_TO_PREF_KEY[type];
    if (prefKey && typeof (pref as any)[prefKey] === 'boolean') {
      return (pref as any)[prefKey];
    }
    return true;
  }

  /**
   * Dispatch push notification to a specific push subscription
   */
  private static async sendToSubscription(sub: IPushSubscriptionDoc, payload: NotificationPayload): Promise<boolean> {
    const pushPayload = JSON.stringify({
      title: payload.title,
      body: payload.message,
      icon: payload.icon || '/vite.svg',
      badge: payload.badge || '/vite.svg',
      data: {
        type: payload.type,
        url: payload.data?.url || '/',
        ...payload.data
      },
      tag: payload.data?.medicineId || `${payload.type}-${Date.now()}`
    });

    try {
      await webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.keys.p256dh,
            auth: sub.keys.auth
          }
        },
        pushPayload
      );
      console.log(`[PushService] Push sent to user ${sub.userId} (device: ${sub.deviceName})`);
      return true;
    } catch (err: any) {
      console.error(`[PushService] Error sending push to ${sub.endpoint.slice(0, 30)}...:`, err.statusCode || err.message);

      // Subscription is no longer valid or unsubscribed on browser side
      if (err.statusCode === 404 || err.statusCode === 410) {
        console.warn(`[PushService] Subscription expired or gone (${err.statusCode}). Deactivating subscription.`);
        sub.isActive = false;
        await sub.save();
      }
      return false;
    }
  }

  /**
   * Send notification to a specific user
   */
  public static async sendToUser(userId: string, payload: NotificationPayload): Promise<{ success: boolean; notificationId?: string }> {
    // 1. Create persistent Notification record in DB
    const notif = await Notification.create({
      userId,
      type: payload.type,
      title: payload.title,
      message: payload.message,
      data: payload.data || {},
      priority: payload.priority || 'NORMAL',
      isRead: false
    });

    // 2. Check user notification preferences
    const isAllowed = await this.isNotificationEnabledForUser(userId, payload.type);
    if (!isAllowed) {
      console.log(`[PushService] User ${userId} has disabled notifications of category: ${payload.type}`);
      return { success: true, notificationId: String(notif._id) };
    }

    // 3. Find all active subscriptions for this user
    const subscriptions = await PushSubscription.find({ userId, isActive: true });
    if (subscriptions.length === 0) {
      return { success: true, notificationId: String(notif._id) };
    }

    // 4. Send web push to all active devices
    await Promise.allSettled(
      subscriptions.map(sub => this.sendToSubscription(sub, payload))
    );

    return { success: true, notificationId: String(notif._id) };
  }

  /**
   * Send notification to all users matching a target role (e.g. 'ADMIN', 'PHARMACIST', 'MORNING_SHIFT', 'NIGHT_SHIFT', 'ALL')
   */
  public static async sendToRole(
    targetRole: UserRole | 'ALL',
    payload: NotificationPayload
  ): Promise<{ recipientCount: number }> {
    // 1. Find matching users
    const query: any = { isActive: true };
    if (targetRole !== 'ALL') {
      query.role = targetRole;
    }

    const users = await User.find(query).select('_id role').lean();
    if (users.length === 0) {
      // Create broadcast notification record for general history
      await Notification.create({
        targetRole,
        type: payload.type,
        title: payload.title,
        message: payload.message,
        data: payload.data || {},
        priority: payload.priority || 'NORMAL',
        isRead: false
      });
      return { recipientCount: 0 };
    }

    let count = 0;
    for (const user of users) {
      const uId = String(user._id);
      await this.sendToUser(uId, payload);
      count++;
    }

    return { recipientCount: count };
  }

  /**
   * Broadcast an alert to all active pharmacy users (Admin + Pharmacists + Shift Staff)
   */
  public static async broadcast(payload: NotificationPayload): Promise<{ recipientCount: number }> {
    return await this.sendToRole('ALL', payload);
  }
}
