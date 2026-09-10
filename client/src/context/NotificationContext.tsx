import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { INotification, INotificationPreference, NotificationType } from '../types';
import { NotificationService } from '../services/notificationService';
import { useAuth } from './AuthContext';

interface NotificationContextType {
  unreadCount: number;
  notifications: INotification[];
  preferences: INotificationPreference | null;
  permissionState: NotificationPermission;
  isSupported: boolean;
  isSubscribed: boolean;
  isLoading: boolean;
  isCenterOpen: boolean;
  setIsCenterOpen: (open: boolean) => void;
  isSettingsOpen: boolean;
  setIsSettingsOpen: (open: boolean) => void;
  subscribeToPush: () => Promise<boolean>;
  unsubscribeFromPush: () => Promise<boolean>;
  updatePreferences: (updates: Partial<INotificationPreference>) => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  sendTestNotification: (type?: NotificationType) => Promise<void>;
  refreshNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, token } = useAuth();

  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [notifications, setNotifications] = useState<INotification[]>([]);
  const [preferences, setPreferences] = useState<INotificationPreference | null>(null);
  const [permissionState, setPermissionState] = useState<NotificationPermission>(
    NotificationService.getPermissionState()
  );
  const [isSupported] = useState<boolean>(NotificationService.isPushSupported());
  const [isSubscribed, setIsSubscribed] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isCenterOpen, setIsCenterOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);

  // Check subscription status
  const checkSubStatus = useCallback(async () => {
    if (isSupported) {
      const subbed = await NotificationService.isSubscribed();
      setIsSubscribed(subbed);
      setPermissionState(NotificationService.getPermissionState());
    }
  }, [isSupported]);

  // Refresh notifications and unread count
  const refreshNotifications = useCallback(async () => {
    if (!token) return;
    try {
      const data = await NotificationService.getHistory({ limit: 30 });
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch (err) {
      console.warn('[NotificationContext] Failed to fetch notification history:', err);
    }
  }, [token]);

  // Fetch preferences
  const fetchPrefs = useCallback(async () => {
    if (!token) return;
    try {
      const prefs = await NotificationService.getPreferences();
      setPreferences(prefs);
    } catch (err) {
      console.warn('[NotificationContext] Failed to fetch preferences:', err);
    }
  }, [token]);

  // Initial load on user/token change
  useEffect(() => {
    checkSubStatus();
    refreshNotifications();
    fetchPrefs();

    // Poll every 30 seconds for background in-app counter sync
    const interval = setInterval(() => {
      refreshNotifications();
    }, 30000);

    return () => clearInterval(interval);
  }, [user, token, checkSubStatus, refreshNotifications, fetchPrefs]);

  const subscribeToPush = async (): Promise<boolean> => {
    setIsLoading(true);
    try {
      const res = await NotificationService.subscribe();
      setPermissionState(NotificationService.getPermissionState());
      if (res.success) {
        setIsSubscribed(true);
        await refreshNotifications();
        return true;
      }
      return false;
    } catch (error) {
      console.error('[NotificationContext] Subscribe error:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const unsubscribeFromPush = async (): Promise<boolean> => {
    setIsLoading(true);
    try {
      const success = await NotificationService.unsubscribe();
      if (success) {
        setIsSubscribed(false);
      }
      return success;
    } catch (error) {
      console.error('[NotificationContext] Unsubscribe error:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const updatePreferences = async (updates: Partial<INotificationPreference>): Promise<void> => {
    try {
      const updated = await NotificationService.updatePreferences(updates);
      setPreferences(updated);
    } catch (error) {
      console.error('[NotificationContext] Update preferences error:', error);
    }
  };

  const markAsRead = async (id: string): Promise<void> => {
    // Optimistic UI update
    setNotifications((prev) =>
      prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));

    try {
      await NotificationService.markAsRead(id);
    } catch (error) {
      console.error('[NotificationContext] Mark as read error:', error);
      await refreshNotifications();
    }
  };

  const markAllAsRead = async (): Promise<void> => {
    // Optimistic UI update
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);

    try {
      await NotificationService.markAllAsRead();
    } catch (error) {
      console.error('[NotificationContext] Mark all as read error:', error);
      await refreshNotifications();
    }
  };

  const deleteNotification = async (id: string): Promise<void> => {
    const target = notifications.find((n) => n._id === id);
    setNotifications((prev) => prev.filter((n) => n._id !== id));
    if (target && !target.isRead) {
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }

    try {
      await NotificationService.deleteNotification(id);
    } catch (error) {
      console.error('[NotificationContext] Delete notification error:', error);
      await refreshNotifications();
    }
  };

  const sendTestNotification = async (type: NotificationType = 'LOW_STOCK'): Promise<void> => {
    try {
      await NotificationService.sendTestNotification(type);
      setTimeout(() => {
        refreshNotifications();
      }, 1000);
    } catch (error) {
      console.error('[NotificationContext] Send test notification error:', error);
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        unreadCount,
        notifications,
        preferences,
        permissionState,
        isSupported,
        isSubscribed,
        isLoading,
        isCenterOpen,
        setIsCenterOpen,
        isSettingsOpen,
        setIsSettingsOpen,
        subscribeToPush,
        unsubscribeFromPush,
        updatePreferences,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        sendTestNotification,
        refreshNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
