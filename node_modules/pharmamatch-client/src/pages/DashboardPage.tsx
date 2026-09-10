import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../api/client';
import { 
  Package, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Search, 
  ArrowRight, 
  Activity, 
  Pill,
  Sparkles,
  ShieldCheck,
  TrendingUp
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const [stats, setStats] = useState<any>({
    totalProducts: 15,
    availableCount: 11,
    lowStockCount: 2,
    outOfStockCount: 5,
    expiredCount: 1,
    totalUnits: 340,
    totalValue: 24500,
    currency: 'EGP'
  });
  const [recentLogs, setRecentLogs] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [statsRes, logsRes]: any = await Promise.all([
          apiClient.get('/inventory/stats'),
          apiClient.get('/audit/logs?limit=6')
        ]);
        if (statsRes.success) setStats(statsRes.data);
        if (logsRes.success) setRecentLogs(logsRes.data.logs || []);
      } catch (err) {
        // use default stats
      }
    };
    fetchDashboardData();
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const quickScenarios = [
    { name: 'Calmag', arabic: 'كالماج', tag: 'Out of Stock', match: 'Calcium Primary Match (Calcitron, Osteocare)' },
    { name: 'Augmentin 1g', arabic: 'أوجمنتين 1 جم', tag: 'Out of Stock', match: 'Amoxicillin Match (Curam, Megamox, Hibiotic)' },
    { name: 'Panadol Extra', arabic: 'بنادول اكسترا', tag: 'Out of Stock', match: 'Paracetamol + Caffeine (Cetal Extra, Abimol Extra)' },
    { name: 'Concor 5mg', arabic: 'كونكور 5 مج', tag: 'Out of Stock', match: 'Bisoprolol 5mg (Bisocard, Bisotens)' },
    { name: 'Cataflam 50mg', arabic: 'كتافلام 50 مج', tag: 'Out of Stock', match: 'Diclofenac Match (Voltaren, Declophen)' },
    { name: 'Controloc 40mg', arabic: 'كونترولوك 40 مج', tag: 'Out of Stock', match: 'Pantoprazole Match (Pantozol, Zurcal)' },
  ];

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-navy-900 via-navy-800 to-medical-900 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 opacity-10 pointer-events-none flex items-center pr-8">
          <Pill className="w-64 h-64 text-white" />
        </div>

        <div className="max-w-2xl relative z-10 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-medical-500/20 text-medical-200 border border-medical-400/30 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-medical-300" />
            <span>AI-Assisted Deterministic Pharmacy Intelligence</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Verify Medication Similarity with Clinical Provenance
          </h1>
          <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
            When a requested medication is out of stock, PharmaMatch AI extracts its primary active ingredient, calculates multi-factor similarity, cross-references shelf inventory, and presents available alternatives for pharmacist validation.
          </p>

          {/* Quick Search Box */}
          <form onSubmit={handleSearchSubmit} className="pt-2 flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search unavailable product (e.g. Calmag, Augmentin, كالماج)..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/10 backdrop-blur border border-white/20 text-white placeholder:text-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-medical-400 focus:bg-white/15 transition"
              />
            </div>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-medical-500 hover:bg-medical-600 font-bold text-sm text-white shadow-md transition flex items-center gap-2"
            >
              <span>Analyze</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        
        {/* Total Stock */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs card-hover">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase">{t('metric.totalDrugs', 'Drug Catalog')}</span>
            <Package className="w-4 h-4 text-medical-600" />
          </div>
          <p className="text-2xl font-bold text-navy-900">{stats.totalProducts}</p>
          <p className="text-[11px] text-slate-500 mt-1">Total active registered monographs</p>
        </div>

        {/* Available In Stock */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs card-hover">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase">{t('metric.availableStock', 'In Stock')}</span>
            <CheckCircle className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold text-emerald-600">{stats.availableCount}</p>
          <p className="text-[11px] text-slate-500 mt-1">{stats.totalUnits} available units on shelves</p>
        </div>

        {/* Out of Stock */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs card-hover">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase">{t('metric.outOfStock', 'Out of Stock')}</span>
            <XCircle className="w-4 h-4 text-rose-600" />
          </div>
          <p className="text-2xl font-bold text-rose-600">{stats.outOfStockCount}</p>
          <p className="text-[11px] text-slate-500 mt-1">Requires similarity lookup</p>
        </div>

        {/* Expired / Quarantine */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs card-hover">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase">{t('metric.expired', 'Expired Filtered')}</span>
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-2xl font-bold text-amber-600">{stats.expiredCount}</p>
          <p className="text-[11px] text-slate-500 mt-1">Strictly blocked from candidates</p>
        </div>

      </div>

      {/* Two Column Layout: Quick Test Scenarios & Real-Time Audit Log Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Quick Clinical Test Scenarios */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-bold text-navy-900 text-sm">Key Clinical Substitution Test Scenarios</h2>
              <p className="text-xs text-slate-500">Click any product to inspect out-of-stock primary ingredient matching</p>
            </div>
            <span className="px-2 py-0.5 text-[10px] font-bold uppercase bg-slate-100 text-slate-600 rounded">
              Ready to Demo
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {quickScenarios.map((sc, i) => (
              <div
                key={i}
                onClick={() => navigate(`/search?q=${encodeURIComponent(sc.name)}`)}
                className="p-3.5 rounded-xl border border-slate-200 hover:border-medical-400 bg-slate-50/50 hover:bg-medical-50/20 cursor-pointer transition flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 text-sm group-hover:text-medical-600 transition">
                      {sc.name} <span className="text-xs font-normal text-slate-500">({sc.arabic})</span>
                    </span>
                    <span className="px-2 py-0.5 text-[10px] font-bold uppercase bg-rose-50 text-rose-700 border border-rose-200 rounded">
                      {sc.tag}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1.5 leading-tight">{sc.match}</p>
                </div>
                <div className="mt-3 flex items-center text-[11px] font-semibold text-medical-600 group-hover:translate-x-1 transition-transform">
                  <span>Run Similarity Analysis</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Live Security & Audit Trail */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-navy-900 text-sm flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-medical-600" />
                <span>Recent Audit Activity</span>
              </h2>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">Real-time search & similarity lookups</p>

            <div className="mt-3 space-y-2.5">
              {recentLogs.length > 0 ? (
                recentLogs.map((log, i) => (
                  <div key={i} className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-xs">
                    <div className="flex items-center justify-between font-semibold text-slate-800">
                      <span>{log.action.replace('_', ' ')}</span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 truncate mt-0.5">
                      Target: <span className="text-navy-900 font-medium">{log.target || 'System'}</span>
                    </p>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-xs text-slate-400">
                  No activity recorded yet. Run a search to generate audit records.
                </div>
              )}
            </div>
          </div>

          <button
            onClick={() => navigate('/admin')}
            className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition"
          >
            View Full Audit Logs
          </button>
        </div>

      </div>

    </div>
  );
};
