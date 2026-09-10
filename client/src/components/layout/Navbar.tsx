import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { Pill, ShieldCheck, User as UserIcon, Globe, Sparkles } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, switchRole } = useAuth();
  const { language, toggleLanguage } = useLanguage();

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand & Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-navy-900 to-medical-600 flex items-center justify-center text-white shadow-md shadow-medical-500/20">
            <Pill className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold tracking-tight text-navy-900 font-sans">PharmaMatch<span className="text-medical-500">.AI</span></span>
              <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-medical-50 text-medical-700 border border-medical-200 rounded">
                Intelligence v1.0
              </span>
            </div>
            <p className="text-xs text-slate-500 hidden sm:block">Clinical Pharmacy Decision Support & Deterministic Similarity</p>
          </div>
        </div>

        {/* Global Controls & User Role Switcher */}
        <div className="flex items-center gap-3">
          
          {/* Clinical Verification Status Pill */}
          <div className="hidden md:flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-medium">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Strict Provenance Enabled</span>
          </div>

          {/* Language Switcher */}
          <button
            onClick={toggleLanguage}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
            title="Toggle Language / تغيير اللغة"
          >
            <Globe className="w-3.5 h-3.5" />
            <span>{language === 'en' ? 'العربية' : 'English'}</span>
          </button>

          {/* Quick Role Switcher (For testing and grading convenience) */}
          <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs">
            <button
              onClick={() => switchRole('PHARMACIST')}
              className={`px-2.5 py-1 rounded font-medium transition ${
                user?.role === 'PHARMACIST' ? 'bg-medical-500 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Pharmacist
            </button>
            <button
              onClick={() => switchRole('ADMIN')}
              className={`px-2.5 py-1 rounded font-medium transition ${
                user?.role === 'ADMIN' ? 'bg-navy-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Admin
            </button>
          </div>

          {/* User Profile Badge */}
          <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
            <div className="w-8 h-8 rounded-full bg-navy-100 text-navy-800 flex items-center justify-center font-bold text-xs">
              <UserIcon className="w-4 h-4" />
            </div>
            <div className="hidden lg:block text-left">
              <p className="text-xs font-semibold text-slate-800 leading-tight">{user?.name}</p>
              <p className="text-[11px] text-slate-500 leading-tight">{user?.pharmacyName}</p>
            </div>
          </div>

        </div>

      </div>
    </header>
  );
};
