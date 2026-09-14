import React from 'react';
import { NavLink } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import {
  Pill, Globe,
  LayoutDashboard, Search, Database, Package, AlertTriangle, Settings
} from 'lucide-react';
import { NotificationBell } from '../notifications/NotificationBell';
import { NotificationCenter } from '../notifications/NotificationCenter';

export const Navbar: React.FC = () => {
  const { language, toggleLanguage, t } = useLanguage();

  const navItems = [
    { to: '/dashboard', label: t('nav.dashboard', 'Dashboard'), icon: LayoutDashboard, end: true },
    { to: '/search', label: t('nav.search', 'Search'), icon: Search },
    { to: '/shortages', label: t('nav.shortages', 'Shortages'), icon: AlertTriangle },
    { to: '/catalog', label: t('nav.catalog', 'Catalog'), icon: Database },
    { to: '/inventory', label: t('nav.inventory', 'Inventory'), icon: Package },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top row: Brand + Controls */}
        <div className="h-14 flex items-center justify-between">
          {/* Brand */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg gradient-blue flex items-center justify-center text-white">
              <Pill className="w-4.5 h-4.5" />
            </div>
            <span className="text-lg font-bold tracking-tight text-slate-900">
              Pharma<span className="text-blue-600">Tech</span>
            </span>
          </div>

          {/* Right controls */}
          <div className="flex items-center gap-2.5">
            {/* Language */}
            <button
              onClick={toggleLanguage}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
              title="Toggle Language / تغيير اللغة"
            >
              <Globe className="w-3.5 h-3.5 text-blue-600" />
              <span>{language === 'en' ? 'عربي' : 'English'}</span>
            </button>

            {/* Notification Bell */}
            <NotificationBell />
          </div>
        </div>

        {/* Notification Center Dropdown */}
        <NotificationCenter />

        {/* Bottom row: Navigation tabs */}
        <nav className="flex items-center gap-1 -mb-px">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium border-b-2 transition-colors ${
                    isActive
                      ? 'border-blue-600 text-blue-700'
                      : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
                  }`
                }
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
