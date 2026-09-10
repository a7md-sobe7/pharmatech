import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import {
  Pill, User as UserIcon, Globe,
  LayoutDashboard, Search, Database, Package, AlertTriangle, Settings
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, switchRole } = useAuth();
  const { language, toggleLanguage } = useLanguage();

  const navItems = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
    { to: '/search', label: 'Search', icon: Search },
    { to: '/shortages', label: 'نواقص', icon: AlertTriangle },
    { to: '/catalog', label: 'Catalog', icon: Database },
    { to: '/inventory', label: 'Inventory', icon: Package },
    ...(user?.role === 'ADMIN' ? [{ to: '/admin', label: 'Admin', icon: Settings }] : []),
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
              Pharma<span className="text-blue-600">Match</span>
            </span>
          </div>

          {/* Right controls */}
          <div className="flex items-center gap-2.5">
            {/* Language */}
            <button
              onClick={toggleLanguage}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-600 transition"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>{language === 'en' ? 'AR' : 'EN'}</span>
            </button>

            {/* Role Switcher */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg text-xs">
              <button
                onClick={() => switchRole('PHARMACIST')}
                className={`px-2.5 py-1 rounded-md font-medium transition ${
                  user?.role === 'PHARMACIST' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Pharmacist
              </button>
              <button
                onClick={() => switchRole('ADMIN')}
                className={`px-2.5 py-1 rounded-md font-medium transition ${
                  user?.role === 'ADMIN' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Admin
              </button>
            </div>

            {/* User */}
            <div className="flex items-center gap-2 pl-2.5 border-l border-slate-200">
              <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                <UserIcon className="w-3.5 h-3.5" />
              </div>
              <div className="hidden lg:block text-left">
                <p className="text-xs font-semibold text-slate-800 leading-tight">{user?.name}</p>
                <p className="text-[10px] text-slate-500 leading-tight">{user?.pharmacyName}</p>
              </div>
            </div>
          </div>
        </div>

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
