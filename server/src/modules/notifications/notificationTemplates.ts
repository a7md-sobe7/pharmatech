import { NotificationType, NotificationPriority } from '../../types/index.js';

export interface NotificationPayload {
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, any>;
  priority?: NotificationPriority;
  icon?: string;
  badge?: string;
}

export const NotificationTemplates = {
  LOW_STOCK: (medicineName: string, currentStock: number, minimumStock: number, medicineId?: string): NotificationPayload => ({
    type: 'LOW_STOCK',
    title: '⚠️ Low Stock Alert',
    message: `${medicineName} has fallen below minimum stock level (${currentStock} left, min: ${minimumStock}).`,
    data: {
      url: `/inventory?search=${encodeURIComponent(medicineName)}`,
      medicineId,
      medicineName,
      currentStock,
      minimumStock,
      category: 'lowStock'
    },
    priority: 'HIGH',
    icon: '/vite.svg',
    badge: '/vite.svg'
  }),

  OUT_OF_STOCK: (medicineName: string, medicineId?: string): NotificationPayload => ({
    type: 'OUT_OF_STOCK',
    title: '🚨 Out of Stock Alert',
    message: `${medicineName} is now completely out of stock! Action required.`,
    data: {
      url: `/inventory?search=${encodeURIComponent(medicineName)}`,
      medicineId,
      medicineName,
      currentStock: 0,
      category: 'outOfStock'
    },
    priority: 'CRITICAL',
    icon: '/vite.svg',
    badge: '/vite.svg'
  }),

  EXPIRY_WARNING: (medicineName: string, batchNumber: string, daysLeft: number, medicineId?: string): NotificationPayload => {
    let title = '⏳ Expiry Warning';
    let message = `${medicineName} (Batch: ${batchNumber}) expires in ${daysLeft} days.`;
    let priority: NotificationPriority = 'NORMAL';

    if (daysLeft <= 0) {
      title = '❌ Medicine Expired';
      message = `${medicineName} (Batch: ${batchNumber}) has expired! Please isolate this batch immediately.`;
      priority = 'CRITICAL';
    } else if (daysLeft <= 7) {
      title = '🚨 Urgent: Medicine Expiring Soon';
      message = `${medicineName} (Batch: ${batchNumber}) expires in ${daysLeft} days!`;
      priority = 'HIGH';
    }

    return {
      type: 'EXPIRY_WARNING',
      title,
      message,
      data: {
        url: `/inventory?search=${encodeURIComponent(medicineName)}`,
        medicineId,
        medicineName,
        batchNumber,
        daysLeft,
        category: 'expiry'
      },
      priority,
      icon: '/vite.svg',
      badge: '/vite.svg'
    };
  },

  ADMIN_ALERT: (title: string, message: string, data?: Record<string, any>): NotificationPayload => ({
    type: 'ADMIN_ALERT',
    title: `🛡️ Admin Alert: ${title}`,
    message,
    data: {
      url: '/admin',
      category: 'adminAlerts',
      ...data
    },
    priority: 'HIGH',
    icon: '/vite.svg',
    badge: '/vite.svg'
  }),

  SYSTEM_ALERT: (title: string, message: string, data?: Record<string, any>): NotificationPayload => ({
    type: 'SYSTEM_ALERT',
    title: `ℹ️ System Alert: ${title}`,
    message,
    data: {
      url: '/',
      category: 'systemAlerts',
      ...data
    },
    priority: 'NORMAL',
    icon: '/vite.svg',
    badge: '/vite.svg'
  }),

  SHIFT_ALERT: (title: string, message: string, data?: Record<string, any>): NotificationPayload => ({
    type: 'SHIFT_ALERT',
    title: `🔄 Shift Notice: ${title}`,
    message,
    data: {
      url: '/',
      category: 'shiftAlerts',
      ...data
    },
    priority: 'NORMAL',
    icon: '/vite.svg',
    badge: '/vite.svg'
  }),

  SALE: (title: string, message: string, data?: Record<string, any>): NotificationPayload => ({
    type: 'SALE',
    title: `💰 Sale Completed: ${title}`,
    message,
    data: {
      url: '/inventory',
      category: 'sales',
      ...data
    },
    priority: 'LOW',
    icon: '/vite.svg',
    badge: '/vite.svg'
  })
};
