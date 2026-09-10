import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../middleware/auth.js';
import { PushNotificationService } from './pushNotificationService.js';
import { Notification } from '../../models/Notification.js';
import { AppError } from '../../middleware/errorHandler.js';
import { NotificationTemplates } from './notificationTemplates.js';

export class NotificationController {
  /**
   * GET /api/notifications/public-key
   * Returns VAPID public key
   */
  public static async getPublicKey(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const publicKey = PushNotificationService.getPublicKey();
      res.json({
        success: true,
        data: { publicKey }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/notifications/subscribe
   * Register a new PushSubscription for the authenticated user
   */
  public static async subscribe(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new AppError('Authentication required to register push subscriptions.', 401, 'UNAUTHORIZED');
      }

      const { subscription, deviceName, browser } = req.body;
      if (!subscription || !subscription.endpoint || !subscription.keys) {
        throw new AppError('Invalid subscription object.', 400, 'INVALID_SUBSCRIPTION');
      }

      const subDoc = await PushNotificationService.subscribe(
        userId,
        subscription,
        deviceName || req.headers['user-agent']?.slice(0, 40) || 'Web Browser',
        browser || 'Chrome'
      );

      res.status(201).json({
        success: true,
        message: 'Push subscription successfully registered.',
        data: { subscriptionId: subDoc._id }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/notifications/unsubscribe
   * Unsubscribe endpoint
   */
  public static async unsubscribe(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new AppError('Authentication required.', 401, 'UNAUTHORIZED');
      }

      const { endpoint } = req.body || {};
      await PushNotificationService.unsubscribe(userId, endpoint);

      res.json({
        success: true,
        message: 'Push subscription deactivated.'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/notifications/preferences
   * Get user notification preferences
   */
  public static async getPreferences(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id || 'guest-pharmacist-001';
      const preferences = await PushNotificationService.getPreferences(userId);

      res.json({
        success: true,
        data: { preferences }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/notifications/preferences
   * Update user notification preferences
   */
  public static async updatePreferences(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id || 'guest-pharmacist-001';
      const updates = req.body;

      const preferences = await PushNotificationService.updatePreferences(userId, updates);

      res.json({
        success: true,
        message: 'Notification preferences updated successfully.',
        data: { preferences }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/notifications/history
   * Retrieve notification history for the authenticated user
   */
  public static async getHistory(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id || 'guest-pharmacist-001';
      const userRole = req.user?.role || 'PHARMACIST';
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const limit = Math.min(50, parseInt(req.query.limit as string) || 20);
      const category = req.query.category as string;
      const unreadOnly = req.query.unread === 'true';

      const query: any = {
        $or: [
          { userId },
          { targetRole: userRole },
          { targetRole: 'ALL' }
        ]
      };

      if (category && category !== 'ALL') {
        query.type = category;
      }

      if (unreadOnly) {
        query.isRead = false;
      }

      const skip = (page - 1) * limit;

      const [notifications, total, unreadCount] = await Promise.all([
        Notification.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
        Notification.countDocuments(query),
        Notification.countDocuments({
          $or: [
            { userId },
            { targetRole: userRole },
            { targetRole: 'ALL' }
          ],
          isRead: false
        })
      ]);

      res.json({
        success: true,
        data: {
          notifications,
          unreadCount,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/notifications/:id/read
   * Mark notification as read
   */
  public static async markAsRead(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const notif = await Notification.findByIdAndUpdate(id, { isRead: true }, { new: true });
      if (!notif) {
        throw new AppError('Notification not found.', 404, 'NOT_FOUND');
      }

      res.json({
        success: true,
        message: 'Notification marked as read.',
        data: { notification: notif }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/notifications/read-all
   * Mark all notifications as read for this user
   */
  public static async markAllAsRead(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id || 'guest-pharmacist-001';
      const userRole = req.user?.role || 'PHARMACIST';

      await Notification.updateMany({
        $or: [
          { userId },
          { targetRole: userRole },
          { targetRole: 'ALL' }
        ],
        isRead: false
      }, { isRead: true });

      res.json({
        success: true,
        message: 'All notifications marked as read.'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/notifications/:id
   * Delete a notification
   */
  public static async deleteNotification(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const deleted = await Notification.findByIdAndDelete(id);
      if (!deleted) {
        throw new AppError('Notification not found.', 404, 'NOT_FOUND');
      }

      res.json({
        success: true,
        message: 'Notification deleted successfully.'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/notifications/test
   * Trigger a test notification to verify browser push delivery
   */
  public static async sendTestNotification(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id || 'guest-pharmacist-001';
      const { type = 'LOW_STOCK' } = req.body;

      let payload;
      switch (type) {
        case 'OUT_OF_STOCK':
          payload = NotificationTemplates.OUT_OF_STOCK('Panadol Extra 500mg (Test)');
          break;
        case 'EXPIRY_WARNING':
          payload = NotificationTemplates.EXPIRY_WARNING('Augmentin 1g (Test)', 'B-9982', 7);
          break;
        case 'ADMIN_ALERT':
          payload = NotificationTemplates.ADMIN_ALERT('Critical Shortage', 'Amoxicillin syrup inventory has dropped to critical zero across all shelves.');
          break;
        case 'SHIFT_ALERT':
          payload = NotificationTemplates.SHIFT_ALERT('Shift Handover Reminder', 'Please complete pending prescription verifications before shift end.');
          break;
        case 'LOW_STOCK':
        default:
          payload = NotificationTemplates.LOW_STOCK('Brufen 400mg (Test)', 2, 5);
          break;
      }

      const result = await PushNotificationService.sendToUser(userId, payload);

      res.json({
        success: true,
        message: `Test ${type} notification sent! Check your browser system notifications.`,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }
}
