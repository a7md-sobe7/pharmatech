import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Search, 
  Database, 
  Package, 
  Settings, 
  AlertCircle,
  FileCheck2,
  AlertTriangle
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { useEffect, useState } from 'react';
import { apiClient } from '../../api/client';

export const Sidebar: React.FC = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [urgentCount, setUrgentCount] = useState(0);

  useEffect(() => {
    apiClient.get('/shortages/stats').then((res: any) => {
      if (res.success) setUrgentCount((res.data.byCritical || 0) + (res.data.byHigh || 0));
    }).catch(() => {});
  }, []);

  interface NavItem {
    to: string;
    label: string;
    icon: React.ElementType;
    badge?: string;
    urgentBadge?: string;
  }

  const navItems: NavItem[] = [
    { to: '/', label: t('nav.dashboard', 'Dashboard'), icon: LayoutDashboard },
    { to: '/search', label: t('nav.search', 'Similarity Studio'), icon: Search },
    { to: '/catalog', label: t('nav.catalog', 'Drug Knowledge DB'), icon: Database },
    { to: '/inventory', label: t('nav.inventory', 'Pharmacy Inventory'), icon: Package },
    { to: '/shortages', label: 'نواقص', icon: AlertTriangle, urgentBadge: urgentCount > 0 ? String(urgentCount) : undefined },
    ...(user?.role === 'ADMIN' ? [{ to: '/admin', label: t('nav.admin', 'Admin Center'), icon: Settings }] : []),
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col justify-between shrink-0 min-h-[calc(100vh-4rem)]">
      {/* Navigation Links */}
      <div className="p-4 space-y-1">
        <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
          Core Workflows
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-medical-50 text-medical-700 font-semibold shadow-xs border border-medical-200'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`
              }
            >
              <div className="flex items-center gap-3">
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className="px-1.5 py-0.5 text-[10px] font-extrabold uppercase bg-medical-500 text-white rounded">
                  {item.badge}
                </span>
              )}
              {item.urgentBadge && (
                <span className="px-1.5 py-0.5 text-[10px] font-extrabold bg-red-500 text-white rounded-full animate-pulse">
                  {item.urgentBadge}
                </span>
              )}
            </NavLink>
          );
        })}
      </div>

      {/* Safety Compliance & Legal Disclaimer Card */}
      <div className="p-4 m-3 bg-amber-50/80 border border-amber-200 rounded-xl">
        <div className="flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-900">
            <p className="font-bold text-[11px] uppercase tracking-wide text-amber-800">Safety Protocol</p>
            <p className="mt-1 text-[11px] leading-relaxed text-amber-800/90">
              Similarity is based on primary active ingredient. Final substitution requires licensed pharmacist validation.
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
};
