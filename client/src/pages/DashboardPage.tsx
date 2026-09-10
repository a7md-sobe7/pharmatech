import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../api/client';
import {
  Package, AlertTriangle, CheckCircle2, XCircle,
  Search, ArrowRight, Pill, Activity,
  Plus, Clock, Flame, Check
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const [stats, setStats] = useState<any>({
    totalProducts: 15,
    availableCount: 11,
    outOfStockCount: 5,
    expiredCount: 1,
    totalUnits: 340,
  });
  const [shortages, setShortages] = useState<any[]>([]);
  const [recentLogs, setRecentLogs] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [shortageStats, setShortageStats] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, logsRes, shortagesRes, shortageStatsRes]: any = await Promise.all([
          apiClient.get('/inventory/stats'),
          apiClient.get('/audit/logs?limit=5'),
          apiClient.get('/shortages?limit=6'),
          apiClient.get('/shortages/stats'),
        ]);
        if (statsRes.success) setStats(statsRes.data);
        if (logsRes.success) setRecentLogs(logsRes.data.logs || []);
        if (shortagesRes.success) setShortages(shortagesRes.data.items || []);
        if (shortageStatsRes.success) setShortageStats(shortageStatsRes.data);
      } catch (err) {
        // use defaults
      }
    };
    fetchData();
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const urgencyColor = (u: string) => {
    if (u === 'CRITICAL') return 'bg-red-500';
    if (u === 'HIGH') return 'bg-orange-500';
    return 'bg-amber-400';
  };

  const statusLabel = (s: string) => {
    if (s === 'RESOLVED') return { text: 'Resolved', cls: 'text-emerald-600 bg-emerald-50' };
    if (s === 'ORDERED') return { text: 'Ordered', cls: 'text-blue-600 bg-blue-50' };
    return { text: 'Pending', cls: 'text-slate-600 bg-slate-100' };
  };

  const totalShortages = shortageStats
    ? shortageStats.byCritical + shortageStats.byHigh + shortageStats.byMedium
    : shortages.length;

  return (
    <div className="bento-grid grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* ═══════════════════════════════════════════════════════════════
          WIDGET 5: Hero Search (spans 2 cols)
          ═══════════════════════════════════════════════════════════════ */}
      <div className="lg:col-span-2 gradient-blue rounded-2xl p-6 text-white relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute -right-8 -bottom-8 opacity-10">
          <Pill className="w-40 h-40" />
        </div>

        <div className="relative z-10 space-y-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Find Drug Alternatives Instantly
            </h1>
            <p className="text-blue-100 text-sm mt-1">
              Search any out-of-stock medication to discover clinically verified substitutions based on active ingredients.
            </p>
          </div>

          <form onSubmit={handleSearchSubmit} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search drug name (e.g. Augmentin, كالماج)..."
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/15 backdrop-blur border border-white/25 text-white placeholder:text-blue-200 text-sm focus:outline-none focus:ring-2 focus:ring-white/40 transition"
              />
            </div>
            <button
              type="submit"
              className="px-6 py-3 rounded-xl bg-white text-blue-700 font-bold text-sm hover:bg-blue-50 transition flex items-center gap-2 shadow-sm"
            >
              <span>Search</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          WIDGET 2: Quick Stats (4 mini tiles in a 2×2 grid)
          ═══════════════════════════════════════════════════════════════ */}
      <div className="bento-card">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Pharmacy Overview</h3>
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Drug Catalog', value: stats.totalProducts, icon: Package, color: 'text-blue-600', bg: 'bg-blue-50' },
            { label: 'In Stock', value: stats.availableCount, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
            { label: 'Out of Stock', value: stats.outOfStockCount, icon: XCircle, color: 'text-rose-600', bg: 'bg-rose-50' },
            { label: 'Shortages', value: totalShortages, icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-50' },
          ].map(({ label, value, icon: Icon, color, bg }) => (
            <div key={label} className={`${bg} rounded-xl p-3 flex flex-col gap-1`}>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold text-slate-500 uppercase">{label}</span>
                <Icon className={`w-3.5 h-3.5 ${color}`} />
              </div>
              <span className={`text-xl font-bold ${color}`}>{value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          WIDGET 3: Quick Actions
          ═══════════════════════════════════════════════════════════════ */}
      <div className="bento-card">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Quick Actions</h3>
        <div className="space-y-2.5">
          <button
            onClick={() => navigate('/shortages')}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl gradient-red text-white text-sm font-semibold hover:opacity-90 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Report New Shortage</span>
          </button>
          <button
            onClick={() => navigate('/search')}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl gradient-blue text-white text-sm font-semibold hover:opacity-90 transition"
          >
            <Search className="w-4 h-4" />
            <span>Run Similarity Search</span>
          </button>
          <button
            onClick={() => navigate('/catalog')}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-100 text-slate-700 text-sm font-semibold hover:bg-slate-200 transition"
          >
            <Pill className="w-4 h-4" />
            <span>Browse Drug Catalog</span>
          </button>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          WIDGET 4: Recent Activity (spans 2 cols)
          ═══════════════════════════════════════════════════════════════ */}
      <div className="lg:col-span-2 bento-card">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-800">Recent Activity</h3>
          </div>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
        </div>

        {recentLogs.length > 0 ? (
          <div className="space-y-2">
            {recentLogs.map((log: any, i: number) => (
              <div key={i} className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-slate-50 text-xs">
                <div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                  <Clock className="w-3.5 h-3.5 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-800 truncate">
                    {log.action?.replace('_', ' ') || 'Activity'}
                  </p>
                  <p className="text-[10px] text-slate-500 truncate">
                    {log.target || 'System'}
                  </p>
                </div>
                <span className="text-[10px] text-slate-400 font-mono shrink-0">
                  {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-slate-400">
            <Activity className="w-6 h-6 mx-auto mb-2 opacity-30" />
            <p className="text-xs">No recent activity. Run a search to generate records.</p>
          </div>
        )}
      </div>
      
    </div>
  );
};
