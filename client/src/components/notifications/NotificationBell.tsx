import React, { useRef, useEffect } from 'react';
import { Bell, BellRing, Settings } from 'lucide-react';
import { useNotifications } from '../../context/NotificationContext';

export const NotificationBell: React.FC = () => {
  const {
    unreadCount,
    isSubscribed,
    isCenterOpen,
    setIsCenterOpen,
    setIsSettingsOpen
  } = useNotifications();

  return (
    <div className="relative">
      <button
        onClick={() => setIsCenterOpen(!isCenterOpen)}
        className={`relative p-2 rounded-xl transition-all duration-200 flex items-center justify-center ${
          isCenterOpen
            ? 'bg-blue-50 text-blue-700 shadow-inner'
            : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
        }`}
        title="Notifications"
        aria-label="Notifications"
      >
        {unreadCount > 0 ? (
          <BellRing className="w-4.5 h-4.5 text-blue-600 animate-wiggle" />
        ) : (
          <Bell className="w-4.5 h-4.5" />
        )}

        {/* Unread badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 min-w-[20px] px-1 items-center justify-center rounded-full bg-gradient-to-r from-red-500 to-rose-600 text-[10px] font-extrabold text-white shadow-md border-2 border-white animate-bounce-short">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}

        {/* Push status dot */}
        <span
          className={`absolute bottom-0.5 right-0.5 w-2 h-2 rounded-full border border-white ${
            isSubscribed ? 'bg-emerald-500' : 'bg-amber-400'
          }`}
          title={isSubscribed ? 'Browser Push Active' : 'Push Inactive'}
        />
      </button>
    </div>
  );
};
