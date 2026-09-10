import { apiClient } from '../api/client';
import { INotification, INotificationPreference, NotificationType } from '../types';

/**
  * Utility function to convert VAPID base64 string to Uint8Array for PushManager
  */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(new ArrayBuffer(rawData.length));
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export class NotificationService {
  /**
   * Check if Web Push, Service Worker, and Notification APIs are supported in this browser
   */
  public static isPushSupported(): boolean {
    return (
      typeof window !== 'undefined' &&
      'serviceWorker' in navigator &&
      'PushManager' in window &&
      'Notification' in window
    );
  }

  /**
   * Get current browser notification permission ('default' | 'granted' | 'denied')
   */
  public static getPermissionState(): NotificationPermission {
    if (!this.isPushSupported()) return 'denied';
    return Notification.permission;
  }

  /**
   * Register the lightweight Web Push Service Worker (no caching/PWA features)
   */
  public static async registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
    if (!this.isPushSupported()) return null;
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });
      await navigator.serviceWorker.ready;
      return registration;
    } catch (error) {
      console.error('[NotificationService] Service Worker registration failed:', error);
      return null;
    }
  }

  /**
   * Fetch VAPID public key from backend
   */
  public static async fetchPublicKey(): Promise<string> {
    const res: any = await apiClient.get('/notifications/public-key');
    if (res.success && res.data?.publicKey) {
      return res.data.publicKey;
    }
    throw new Error('Failed to retrieve VAPID public key.');
  }

  /**
   * Request browser permission and subscribe to Web Push
   */
  public static async subscribe(): Promise<{ success: boolean; subscription?: PushSubscription }> {
    if (!this.isPushSupported()) {
      throw new Error('Push notifications are not supported in this browser.');
    }

    // 1. Request permission
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      return { success: false };
    }

    // 2. Register Service Worker
    const registration = await this.registerServiceWorker();
    if (!registration) {
      throw new Error('Could not register service worker.');
    }

    // 3. Fetch public key
    const publicKey = await this.fetchPublicKey();
    const applicationServerKey = urlBase64ToUint8Array(publicKey);

    // 4. Check existing subscription or create new
    let subscription = await registration.pushManager.getSubscription();
    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey as unknown as BufferSource
      });
    }

    // 5. Send subscription to backend
    const subJSON = subscription.toJSON();
    await apiClient.post('/notifications/subscribe', {
      subscription: {
        endpoint: subJSON.endpoint,
        keys: subJSON.keys
      },
      deviceName: navigator.userAgent.slice(0, 50),
      browser: navigator.userAgent.includes('Chrome') ? 'Chrome' : 'Browser'
    });

    return { success: true, subscription };
  }

  /**
   * Unsubscribe from Web Push on browser and backend
   */
  public static async unsubscribe(): Promise<boolean> {
    if (!this.isPushSupported()) return true;

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        const endpoint = subscription.endpoint;
        await subscription.unsubscribe();
        await apiClient.delete('/notifications/unsubscribe', { data: { endpoint } });
      } else {
        await apiClient.delete('/notifications/unsubscribe');
      }
      return true;
    } catch (err) {
      console.error('[NotificationService] Unsubscribe error:', err);
      return false;
    }
  }

  /**
   * Check if current browser session is actively subscribed
   */
  public static async isSubscribed(): Promise<boolean> {
    if (!this.isPushSupported()) return false;
    if (Notification.permission !== 'granted') return false;

    try {
      const registration = await navigator.serviceWorker.ready;
      const sub = await registration.pushManager.getSubscription();
      return !!sub;
    } catch {
      return false;
    }
  }

  /**
   * Fetch user notification preferences
   */
  public static async getPreferences(): Promise<INotificationPreference> {
    const res: any = await apiClient.get('/notifications/preferences');
    return res.data?.preferences;
  }

  /**
   * Update user notification preferences
   */
  public static async updatePreferences(updates: Partial<INotificationPreference>): Promise<INotificationPreference> {
    const res: any = await apiClient.put('/notifications/preferences', updates);
    return res.data?.preferences;
  }

  /**
   * Fetch paginated notification history
   */
  public static async getHistory(params?: { page?: number; limit?: number; category?: string; unread?: boolean }): Promise<{
    notifications: INotification[];
    unreadCount: number;
    pagination: { page: number; limit: number; total: number; totalPages: number };
  }> {
    const res: any = await apiClient.get('/notifications/history', { params });
    return res.data;
  }

  /**
   * Mark a single notification as read
   */
  public static async markAsRead(id: string): Promise<void> {
    await apiClient.patch(`/notifications/${id}/read`);
  }

  /**
   * Mark all notifications as read
   */
  public static async markAllAsRead(): Promise<void> {
    await apiClient.patch('/notifications/read-all');
  }

  /**
   * Delete a notification
   */
  public static async deleteNotification(id: string): Promise<void> {
    await apiClient.delete(`/notifications/${id}`);
  }

  /**
   * Trigger a test push notification
   */
  public static async sendTestNotification(type: NotificationType = 'LOW_STOCK'): Promise<void> {
    await apiClient.post('/notifications/test', { type });
  }
}
