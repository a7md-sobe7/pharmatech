import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell, CheckCheck, Trash2, Settings, X, ExternalLink,
  AlertTriangle, XCircle, Clock, ShieldAlert, Sparkles, RefreshCw, Eye
} from 'lucide-react';
import { useNotifications } from '../../context/NotificationContext';
import { useLanguage } from '../../context/LanguageContext';
import { INotification, NotificationType } from '../../types';

function getTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function getNotificationIcon(type: NotificationType) {
  switch (type) {
    case 'LOW_STOCK':
      return <AlertTriangle className="w-4 h-4 text-amber-600" />;
    case 'OUT_OF_STOCK':
      return <XCircle className="w-4 h-4 text-red-600" />;
    case 'EXPIRY_WARNING':
      return <Clock className="w-4 h-4 text-orange-600" />;
    case 'ADMIN_ALERT':
    case 'NEW_USER':
      return <ShieldAlert className="w-4 h-4 text-indigo-600" />;
    case 'SHIFT_ALERT':
      return <Sparkles className="w-4 h-4 text-blue-600" />;
    case 'SALE':
      return <CheckCheck className="w-4 h-4 text-emerald-600" />;
    default:
      return <Bell className="w-4 h-4 text-slate-600" />;
  }
}

function getCategoryColor(type: NotificationType): { bg: string; text: string; border: string } {
  switch (type) {
    case 'LOW_STOCK':
      return { bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200' };
    case 'OUT_OF_STOCK':
      return { bg: 'bg-red-50', text: 'text-red-800', border: 'border-red-200' };
    case 'EXPIRY_WARNING':
      return { bg: 'bg-orange-50', text: 'text-orange-800', border: 'border-orange-200' };
    case 'ADMIN_ALERT':
      return { bg: 'bg-indigo-50', text: 'text-indigo-800', border: 'border-indigo-200' };
    case 'SHIFT_ALERT':
      return { bg: 'bg-blue-50', text: 'text-blue-800', border: 'border-blue-200' };
    case 'SALE':
      return { bg: 'bg-emerald-50', text: 'text-emerald-800', border: 'border-emerald-200' };
    default:
      return { bg: 'bg-slate-50', text: 'text-slate-800', border: 'border-slate-200' };
  }
}

export const NotificationCenter: React.FC = () => {
  const navigate = useNavigate();
  const {
    notifications,
    unreadCount,
    isCenterOpen,
    setIsCenterOpen,
    setIsSettingsOpen,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refreshNotifications,
    isSubscribed,
    subscribeToPush
  } = useNotifications();
  const { t } = useLanguage();

  const [activeTab, setActiveTab] = useState<'ALL' | 'STOCK' | 'EXPIRY' | 'ADMIN'>('ALL');
  const [unreadOnly, setUnreadOnly] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node) &&
        !(e.target as HTMLElement).closest('button[title="Notifications"]')
      ) {
        setIsCenterOpen(false);
      }
    };
    if (isCenterOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isCenterOpen, setIsCenterOpen]);

  if (!isCenterOpen) return null;

  // Filter notifications
  const filteredNotifications = notifications.filter((n) => {
    if (unreadOnly && n.isRead) return false;
    if (activeTab === 'STOCK') {
      return n.type === 'LOW_STOCK' || n.type === 'OUT_OF_STOCK';
    }
    if (activeTab === 'EXPIRY') {
      return n.type === 'EXPIRY_WARNING';
    }
    if (activeTab === 'ADMIN') {
      return n.type === 'ADMIN_ALERT' || n.type === 'SYSTEM_ALERT' || n.type === 'NEW_USER';
    }
    return true;
  });

  const handleNotificationClick = async (n: INotification) => {
    if (!n.isRead) {
      await markAsRead(n._id);
    }
    if (n.data?.url) {
      setIsCenterOpen(false);
      navigate(n.data.url);
    }
  };

  return (
    <div
      ref={containerRef}
      className="absolute top-14 right-4 rtl:right-auto rtl:left-4 sm:right-6 lg:right-8 w-96 max-w-[calc(100vw-2rem)] bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 overflow-hidden animate-fade-in-up"
    >
      {/* Header */}
      <div className="px-4 py-3 bg-gradient-to-r from-slate-900 to-blue-950 text-white flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-blue-400" />
          <h3 className="font-bold text-sm tracking-wide">{t('notif.title', 'Notifications')}</h3>
          {unreadCount > 0 && (
            <span className="bg-red-500 text-white text-[10px] font-extrabold px-1.5 py-0.5 rounded-full">
              {unreadCount} {t('notif.unread', 'new')}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="p-1 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition text-xs flex items-center gap-1"
              title={t('notif.readAll', 'Mark all as read')}
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span className="hidden sm:inline text-[11px]">{t('notif.readAll', 'Read all')}</span>
            </button>
          )}
          <button
            onClick={() => {
              setIsCenterOpen(false);
              setIsSettingsOpen(true);
            }}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition"
            title={t('notif.preferences', 'Settings')}
          >
            <Settings className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setIsCenterOpen(false)}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition"
            title={t('common.close', 'Close')}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center justify-between px-3 py-2 bg-slate-50 border-b border-slate-200 text-xs font-semibold">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveTab('ALL')}
            className={`px-2.5 py-1 rounded-lg transition ${
              activeTab === 'ALL'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            {t('common.all', 'All')}
          </button>
          <button
            onClick={() => setActiveTab('STOCK')}
            className={`px-2.5 py-1 rounded-lg transition ${
              activeTab === 'STOCK'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            {t('dashboard.stats.shortages', 'Stock')}
          </button>
          <button
            onClick={() => setActiveTab('EXPIRY')}
            className={`px-2.5 py-1 rounded-lg transition ${
              activeTab === 'EXPIRY'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            {t('status.expired', 'Expiry')}
          </button>
          <button
            onClick={() => setActiveTab('ADMIN')}
            className={`px-2.5 py-1 rounded-lg transition ${
              activeTab === 'ADMIN'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            {t('role.admin', 'Admin')}
          </button>
        </div>

        <button
          onClick={() => setUnreadOnly(!unreadOnly)}
          className={`px-2 py-0.5 rounded-md text-[11px] font-medium border transition ${
            unreadOnly
              ? 'bg-blue-100 text-blue-700 border-blue-300'
              : 'text-slate-500 border-slate-200 hover:bg-slate-100'
          }`}
        >
          {t('notif.unread', 'Unread')}
        </button>
      </div>

      {/* Notification List */}
      <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-100">
        {filteredNotifications.length === 0 ? (
          <div className="py-12 px-4 text-center">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center mb-3">
              <Bell className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-slate-700">{t('notif.empty', 'No notifications yet')}</p>
            <p className="text-xs text-slate-400 mt-1">
              {unreadOnly ? t('notif.empty', 'No unread notifications') : t('notif.emptyDesc', 'Real-time alerts will appear here as stock changes.')}
            </p>
          </div>
        ) : (
          filteredNotifications.map((item) => {
            const colors = getCategoryColor(item.type);
            return (
              <div
                key={item._id}
                className={`p-3.5 transition flex gap-3 items-start group hover:bg-slate-50/80 ${
                  !item.isRead ? 'bg-blue-50/40' : 'bg-white'
                }`}
              >
                {/* Icon box */}
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border ${colors.bg} ${colors.border}`}>
                  {getNotificationIcon(item.type)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1 mb-0.5">
                    <h4 className={`text-xs font-bold truncate ${!item.isRead ? 'text-slate-900' : 'text-slate-700'}`}>
                      {item.title}
                    </h4>
                    <span className="text-[10px] text-slate-400 shrink-0 font-medium">
                      {getTimeAgo(item.createdAt)}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 leading-snug line-clamp-2">
                    {item.message}
                  </p>

                  {/* Actions row */}
                  <div className="flex items-center justify-between mt-2 pt-1 border-t border-slate-100/60">
                    {item.data?.url ? (
                      <button
                        onClick={() => handleNotificationClick(item)}
                        className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
                      >
                        <span>{t('common.view', 'View Details')}</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    ) : (
                      <span />
                    )}

                    <div className="flex items-center gap-2 opacity-80 group-hover:opacity-100 transition">
                      {!item.isRead && (
                        <button
                          onClick={() => markAsRead(item._id)}
                          className="text-[11px] text-slate-500 hover:text-blue-600 font-medium"
                          title={t('notif.markRead', 'Mark read')}
                        >
                          {t('notif.markRead', 'Mark read')}
                        </button>
                      )}
                      <button
                        onClick={() => deleteNotification(item._id)}
                        className="text-slate-400 hover:text-red-500 p-0.5 rounded"
                        title={t('common.delete', 'Delete')}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Unread dot */}
                {!item.isRead && (
                  <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0 mt-1.5" />
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs">
        {!isSubscribed ? (
          <button
            onClick={() => subscribeToPush()}
            className="text-blue-600 font-semibold hover:underline flex items-center gap-1.5"
          >
            <Bell className="w-3.5 h-3.5" />
            <span>{t('notif.enablePush', 'Enable Push Notifications')}</span>
          </button>
        ) : (
          <span className="text-emerald-700 font-medium flex items-center gap-1.5 text-[11px]">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>{t('notif.pushActive', 'Push alerts enabled')}</span>
          </span>
        )}

        <button
          onClick={() => {
            setIsCenterOpen(false);
            setIsSettingsOpen(true);
          }}
          className="text-slate-500 hover:text-slate-800 font-medium"
        >
          {t('notif.preferences', 'Preferences')}
        </button>
      </div>
    </div>
  );
};
