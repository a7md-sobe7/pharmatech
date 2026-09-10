import React, { useState } from 'react';
import {
  X, Bell, Shield, AlertTriangle, XCircle, Clock,
  DollarSign, Sparkles, Send, Check, Power, AlertCircle
} from 'lucide-react';
import { useNotifications } from '../../context/NotificationContext';
import { useLanguage } from '../../context/LanguageContext';
import { NotificationType } from '../../types';

export const NotificationSettingsModal: React.FC = () => {
  const {
    preferences,
    updatePreferences,
    isSubscribed,
    permissionState,
    subscribeToPush,
    unsubscribeFromPush,
    sendTestNotification,
    isSettingsOpen,
    setIsSettingsOpen
  } = useNotifications();
  const { t } = useLanguage();

  const [testSent, setTestSent] = useState<string | null>(null);
  const [isUpdatingSub, setIsUpdatingSub] = useState<boolean>(false);

  if (!isSettingsOpen) return null;

  const handleToggleCategory = (key: string, value: boolean) => {
    updatePreferences({ [key]: value });
  };

  const handleToggleAll = (enable: boolean) => {
    updatePreferences({
      enabledAll: enable,
      lowStock: enable,
      outOfStock: enable,
      expiry: enable,
      sales: enable,
      adminAlerts: enable,
      shiftAlerts: enable,
      systemAlerts: enable
    });
  };

  const handleSubscriptionToggle = async () => {
    setIsUpdatingSub(true);
    try {
      if (isSubscribed) {
        await unsubscribeFromPush();
      } else {
        await subscribeToPush();
      }
    } finally {
      setIsUpdatingSub(false);
    }
  };

  const handleSendTest = async (type: NotificationType) => {
    await sendTestNotification(type);
    setTestSent(type);
    setTimeout(() => setTestSent(null), 3000);
  };

  const categories = [
    {
      key: 'lowStock',
      label: t('notif.settings.lowStockTitle', 'Low Stock Alerts'),
      desc: t('notif.settings.lowStockDesc', 'Notify when medicine quantity drops below minimum threshold'),
      icon: AlertTriangle,
      color: 'text-amber-600 bg-amber-50'
    },
    {
      key: 'outOfStock',
      label: t('notif.settings.outOfStockTitle', 'Out of Stock Alerts'),
      desc: t('notif.settings.outOfStockDesc', 'Critical alert when inventory drops to zero'),
      icon: XCircle,
      color: 'text-red-600 bg-red-50'
    },
    {
      key: 'expiry',
      label: t('notif.settings.expiryTitle', 'Medicine Expiry Warnings'),
      desc: t('notif.settings.expiryDesc', 'Alerts at 30, 14, 7 days before batch expiration and on expiry'),
      icon: Clock,
      color: 'text-orange-600 bg-orange-50'
    },
    {
      key: 'shiftAlerts',
      label: t('notif.settings.shiftTitle', 'Shift & Handover Notices'),
      desc: t('notif.settings.shiftDesc', 'Handover notifications and shift-specific alerts'),
      icon: Sparkles,
      color: 'text-blue-600 bg-blue-50'
    },
    {
      key: 'adminAlerts',
      label: t('notif.settings.adminTitle', 'Administrative & Security Alerts'),
      desc: t('notif.settings.adminDesc', 'New registrations, severe shortages, and system errors'),
      icon: Shield,
      color: 'text-indigo-600 bg-indigo-50'
    },
    {
      key: 'sales',
      label: t('notif.settings.salesTitle', 'Sales & Inventory Transactions'),
      desc: t('notif.settings.salesDesc', 'Alerts when large orders or stock sales occur'),
      icon: DollarSign,
      color: 'text-emerald-600 bg-emerald-50'
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-fade-in-up my-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600/30 flex items-center justify-center text-blue-400">
              <Bell className="w-4.5 h-4.5" />
            </div>
            <div>
              <h3 className="font-bold text-base">{t('notif.settings.title', 'Notification Preferences')}</h3>
              <p className="text-xs text-slate-300">{t('notif.settings.subtitle', 'Customize browser push and alert triggers')}</p>
            </div>
          </div>
          <button
            onClick={() => setIsSettingsOpen(false)}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Master Push Switch */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  isSubscribed ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'
                }`}
              >
                <Power className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">
                  {t('notif.settings.masterPush', 'Browser Push Notifications')}
                </h4>
                <p className="text-xs text-slate-500">
                  {permissionState === 'denied'
                    ? t('notif.settings.masterBlocked', 'Blocked by browser permissions')
                    : isSubscribed
                    ? t('notif.settings.masterActive', 'Active and receiving background alerts')
                    : t('notif.settings.masterInactive', 'Inactive on this device')}
                </p>
              </div>
            </div>

            <button
              onClick={handleSubscriptionToggle}
              disabled={isUpdatingSub || permissionState === 'denied'}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm ${
                isSubscribed
                  ? 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              } disabled:opacity-50`}
            >
              {isUpdatingSub
                ? t('common.processing', 'Processing…')
                : isSubscribed
                ? t('notif.settings.disablePush', 'Disable Push')
                : t('notif.settings.enablePush', 'Enable Push')}
            </button>
          </div>

          {permissionState === 'denied' && (
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                {t('notif.settings.blockedNotice', 'Notifications are blocked in your browser settings. To receive push alerts, please click the lock/settings icon in your browser address bar and allow notifications.')}
              </span>
            </div>
          )}

          {/* Quick Actions */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {t('notif.settings.categories', 'Alert Categories')}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleToggleAll(true)}
                className="text-xs text-blue-600 hover:text-blue-800 font-semibold"
              >
                {t('notif.settings.enableAll', 'Enable All')}
              </button>
              <span className="text-slate-300">|</span>
              <button
                onClick={() => handleToggleAll(false)}
                className="text-xs text-slate-500 hover:text-slate-700 font-medium"
              >
                {t('notif.settings.disableAll', 'Disable All')}
              </button>
            </div>
          </div>

          {/* Category List */}
          <div className="space-y-3">
            {categories.map((cat) => {
              const Icon = cat.icon;
              const isEnabled = preferences ? (preferences as any)[cat.key] ?? true : true;

              return (
                <div
                  key={cat.key}
                  className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:border-slate-200 hover:bg-slate-50/50 transition"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${cat.color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800">{cat.label}</p>
                      <p className="text-[11px] text-slate-500 leading-tight">{cat.desc}</p>
                    </div>
                  </div>

                  <label className="relative inline-flex items-center cursor-pointer ml-3 rtl:ml-0 rtl:mr-3 shrink-0">
                    <input
                      type="checkbox"
                      checked={isEnabled}
                      onChange={(e) => handleToggleCategory(cat.key, e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] rtl:after:left-auto rtl:after:right-[2px] rtl:peer-checked:after:-translate-x-full after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              );
            })}
          </div>

          {/* Test Push Notifications Section */}
          <div className="pt-4 border-t border-slate-200">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">
              🧪 {t('notif.settings.test', 'Test Web Push Delivery')}
            </span>
            <p className="text-xs text-slate-500 mb-3">
              {t('notif.settings.testDesc', 'Trigger instant test notifications to verify system push banners in your operating system.')}
            </p>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleSendTest('LOW_STOCK')}
                className="px-3 py-2 rounded-xl text-xs font-semibold bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200 transition flex items-center justify-center gap-1.5"
              >
                {testSent === 'LOW_STOCK' ? <Check className="w-3.5 h-3.5" /> : <Send className="w-3.5 h-3.5" />}
                <span>{t('notif.settings.testLowStock', 'Test Low Stock')}</span>
              </button>

              <button
                onClick={() => handleSendTest('OUT_OF_STOCK')}
                className="px-3 py-2 rounded-xl text-xs font-semibold bg-red-50 text-red-800 hover:bg-red-100 border border-red-200 transition flex items-center justify-center gap-1.5"
              >
                {testSent === 'OUT_OF_STOCK' ? <Check className="w-3.5 h-3.5" /> : <Send className="w-3.5 h-3.5" />}
                <span>{t('notif.settings.testOutOfStock', 'Test Out of Stock')}</span>
              </button>

              <button
                onClick={() => handleSendTest('EXPIRY_WARNING')}
                className="px-3 py-2 rounded-xl text-xs font-semibold bg-orange-50 text-orange-800 hover:bg-orange-100 border border-orange-200 transition flex items-center justify-center gap-1.5"
              >
                {testSent === 'EXPIRY_WARNING' ? <Check className="w-3.5 h-3.5" /> : <Send className="w-3.5 h-3.5" />}
                <span>{t('notif.settings.testExpiry', 'Test Expiry Warning')}</span>
              </button>

              <button
                onClick={() => handleSendTest('ADMIN_ALERT')}
                className="px-3 py-2 rounded-xl text-xs font-semibold bg-indigo-50 text-indigo-800 hover:bg-indigo-100 border border-indigo-200 transition flex items-center justify-center gap-1.5"
              >
                {testSent === 'ADMIN_ALERT' ? <Check className="w-3.5 h-3.5" /> : <Send className="w-3.5 h-3.5" />}
                <span>{t('notif.settings.testAdmin', 'Test Admin Alert')}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex justify-end">
          <button
            onClick={() => setIsSettingsOpen(false)}
            className="px-5 py-2 rounded-xl text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 transition shadow-sm"
          >
            {t('common.done', 'Done')}
          </button>
        </div>
      </div>
    </div>
  );
};
