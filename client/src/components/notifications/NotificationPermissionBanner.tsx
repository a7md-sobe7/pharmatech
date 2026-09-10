import React, { useState, useEffect } from 'react';
import { Bell, X, ShieldCheck } from 'lucide-react';
import { useNotifications } from '../../context/NotificationContext';
import { useLanguage } from '../../context/LanguageContext';

export const NotificationPermissionBanner: React.FC = () => {
  const { permissionState, isSupported, isSubscribed, subscribeToPush, isLoading } = useNotifications();
  const { t } = useLanguage();
  const [isDismissed, setIsDismissed] = useState<boolean>(true);

  useEffect(() => {
    const dismissedUntil = localStorage.getItem('pharmamatch_notif_dismissed');
    const now = Date.now();
    if (
      isSupported &&
      !isSubscribed &&
      permissionState === 'default' &&
      (!dismissedUntil || now > parseInt(dismissedUntil, 10))
    ) {
      setIsDismissed(false);
    } else {
      setIsDismissed(true);
    }
  }, [permissionState, isSupported, isSubscribed]);

  const handleDismiss = () => {
    setIsDismissed(true);
    // Dismiss for 3 days
    localStorage.setItem('pharmamatch_notif_dismissed', String(Date.now() + 3 * 24 * 60 * 60 * 1000));
  };

  const handleEnable = async () => {
    const success = await subscribeToPush();
    if (success) {
      setIsDismissed(true);
    }
  };

  if (isDismissed || !isSupported || isSubscribed || permissionState !== 'default') {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 text-white shadow-lg border-b border-blue-600/30 px-4 py-2.5 sm:px-6">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
            <Bell className="w-4.5 h-4.5 text-white animate-bounce-short" />
          </div>
          <div>
            <p className="text-xs font-bold sm:text-sm">
              {t('notif.banner.title', 'Enable Real-time Pharmacy Push Alerts')}
            </p>
            <p className="text-[11px] text-blue-100 hidden sm:block">
              {t('notif.banner.desc', 'Receive instant alerts for low stock thresholds, out-of-stock medicines, and expiry dates even when the tab is closed.')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <button
            onClick={handleDismiss}
            className="px-3 py-1.5 rounded-lg text-xs font-medium text-blue-100 hover:text-white hover:bg-white/10 transition"
          >
            {t('notif.banner.later', 'Not Now')}
          </button>
          <button
            onClick={handleEnable}
            disabled={isLoading}
            className="px-4 py-1.5 rounded-lg text-xs font-bold bg-white text-blue-900 hover:bg-blue-50 shadow-sm transition flex items-center gap-1.5 disabled:opacity-75"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-blue-700" />
            <span>{isLoading ? t('common.loading', 'Enabling…') : t('notif.banner.btn', 'Enable Notifications')}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
