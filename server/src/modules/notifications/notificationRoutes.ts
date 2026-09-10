import { Router } from 'express';
import { NotificationController } from './notificationController.js';
import { authenticate } from '../../middleware/auth.js';

export const notificationRoutes = Router();

// Public VAPID key (authenticated or accessible for setup)
notificationRoutes.get('/public-key', authenticate as any, NotificationController.getPublicKey as any);

// Subscription management
notificationRoutes.post('/subscribe', authenticate as any, NotificationController.subscribe as any);
notificationRoutes.delete('/unsubscribe', authenticate as any, NotificationController.unsubscribe as any);

// User notification preferences
notificationRoutes.get('/preferences', authenticate as any, NotificationController.getPreferences as any);
notificationRoutes.put('/preferences', authenticate as any, NotificationController.updatePreferences as any);

// Notification feed and actions
notificationRoutes.get('/history', authenticate as any, NotificationController.getHistory as any);
notificationRoutes.patch('/read-all', authenticate as any, NotificationController.markAllAsRead as any);
notificationRoutes.patch('/:id/read', authenticate as any, NotificationController.markAsRead as any);
notificationRoutes.delete('/:id', authenticate as any, NotificationController.deleteNotification as any);

// Test notification dispatch
notificationRoutes.post('/test', authenticate as any, NotificationController.sendTestNotification as any);
