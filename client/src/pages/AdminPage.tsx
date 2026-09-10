import React, { useState, useEffect } from 'react';
import { apiClient } from '../api/client';
import { ISimilarityConfig, IAuditLog } from '../types';
import { Settings, Sliders, Shield, Activity, Save, CheckCircle2, AlertCircle, ThumbsUp, ThumbsDown } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export const AdminPage: React.FC = () => {
  const { t } = useLanguage();
  const [config, setConfig] = useState<ISimilarityConfig>({
    primaryIngredientWeight: 0.60,
    strengthWeight: 0.20,
    dosageFormWeight: 0.10,
    secondaryIngredientWeight: 0.10,
    thresholds: { veryHigh: 90, high: 75, moderate: 50, low: 25 },
    version: '1.0.0'
  });
  const [logs, setLogs] = useState<IAuditLog[]>([]);
  const [feedbackStats, setFeedbackStats] = useState<any>({ total: 0, useful: 0, notUseful: 0, notClinicallySuitable: 0, acceptanceRate: 100 });
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [configRes, logsRes, feedbackRes]: any = await Promise.all([
          apiClient.get('/similarity/config'),
          apiClient.get('/audit/logs?limit=20'),
          apiClient.get('/audit/feedback/stats')
        ]);
        if (configRes.success && configRes.data.config) setConfig(configRes.data.config);
        if (logsRes.success && logsRes.data.logs) setLogs(logsRes.data.logs);
        if (feedbackRes.success && feedbackRes.data) setFeedbackStats(feedbackRes.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchData();
  }, []);

  const totalWeight = Number((
    config.primaryIngredientWeight + 
    config.strengthWeight + 
    config.dosageFormWeight + 
    config.secondaryIngredientWeight
  ).toFixed(2));

  const isWeightValid = Math.abs(totalWeight - 1.0) < 0.001;

  const handleSaveConfig = async () => {
    if (!isWeightValid) {
      setErrorMessage(`Weights must sum to 100% (currently ${Math.round(totalWeight * 100)}%).`);
      return;
    }

    setIsSaving(true);
    setErrorMessage('');
    setSaveSuccess(false);

    try {
      const res: any = await apiClient.patch('/similarity/config', config);
      if (res.success) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to update configuration.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div>
        <h1 className="text-xl font-extrabold text-navy-900 flex items-center gap-2">
          <Settings className="w-5 h-5 text-blue-600" />
          <span>{t('admin.title', 'Admin Center & Algorithm Weights')}</span>
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          {t('admin.subtitle', 'Configure mathematical weights, inspect audit trails, and review clinical feedback')}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Similarity Configuration Box (2 Columns) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-blue-600" />
              <h2 className="font-bold text-navy-900 text-sm">
                {t('admin.weights.title', 'Similarity Scoring Weights')}
              </h2>
            </div>
            <span className="text-xs text-slate-500 font-mono">Engine Version: {config.version}</span>
          </div>

          <div className="space-y-4">
            
            {/* Primary Active Ingredient Slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold text-slate-800">
                <span>{t('admin.weights.primary', 'Primary Active Ingredient (Core Anchor)')}</span>
                <span className="text-blue-600 font-mono">{Math.round(config.primaryIngredientWeight * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.40"
                max="0.90"
                step="0.05"
                value={config.primaryIngredientWeight}
                onChange={(e) => setConfig({ ...config, primaryIngredientWeight: parseFloat(e.target.value) })}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
              <p className="text-[11px] text-slate-500">Strongest medical compatibility factor. Candidates without matching primary ingredient fail match.</p>
            </div>

            {/* Strength Slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold text-slate-800">
                <span>{t('admin.weights.strength', 'Strength / Concentration Normalization')}</span>
                <span className="text-blue-600 font-mono">{Math.round(config.strengthWeight * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.05"
                max="0.40"
                step="0.05"
                value={config.strengthWeight}
                onChange={(e) => setConfig({ ...config, strengthWeight: parseFloat(e.target.value) })}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
              <p className="text-[11px] text-slate-500">Proportional proximity ratio comparing normalized base values (mg, g, IU).</p>
            </div>

            {/* Dosage Form Slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold text-slate-800">
                <span>{t('admin.weights.form', 'Dosage Form & Route Compatibility')}</span>
                <span className="text-blue-600 font-mono">{Math.round(config.dosageFormWeight * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.05"
                max="0.30"
                step="0.05"
                value={config.dosageFormWeight}
                onChange={(e) => setConfig({ ...config, dosageFormWeight: parseFloat(e.target.value) })}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
              <p className="text-[11px] text-slate-500">Evaluates form family (Tablet vs Capsule: 80%, Tablet vs Topical: 0%).</p>
            </div>

            {/* Secondary Ingredients Slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold text-slate-800">
                <span>{t('admin.weights.secondary', 'Secondary Ingredients Jaccard Overlap')}</span>
                <span className="text-blue-600 font-mono">{Math.round(config.secondaryIngredientWeight * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.05"
                max="0.30"
                step="0.05"
                value={config.secondaryIngredientWeight}
                onChange={(e) => setConfig({ ...config, secondaryIngredientWeight: parseFloat(e.target.value) })}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
              <p className="text-[11px] text-slate-500">Measures intersection over union across non-primary vitamins, minerals, and buffers.</p>
            </div>

          </div>

          {/* Validation & Save Footer */}
          <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs">
              <span className="font-semibold text-slate-600">{t('admin.weights.total', 'Total Weight')}:</span>
              <span className={`font-mono font-bold px-2 py-0.5 rounded text-xs ${
                isWeightValid ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
              }`}>
                {Math.round(totalWeight * 100)}%
              </span>
              {!isWeightValid && <span className="text-rose-600 text-xs">(Must equal 100%)</span>}
            </div>

            <div className="flex items-center gap-3">
              {saveSuccess && (
                <span className="text-emerald-600 text-xs font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{t('admin.weights.saved', 'Weights Saved!')}</span>
                </span>
              )}
              {errorMessage && (
                <span className="text-rose-600 text-xs font-semibold">{errorMessage}</span>
              )}
              <button
                onClick={handleSaveConfig}
                disabled={!isWeightValid || isSaving}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{isSaving ? t('common.saving', 'Saving…') : t('common.save', 'Save Configuration')}</span>
              </button>
            </div>
          </div>

        </div>

        {/* Pharmacist Review Feedback Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Shield className="w-4 h-4 text-emerald-600" />
            <h2 className="font-bold text-navy-900 text-sm">{t('admin.feedback.title', 'Pharmacist Feedback Analytics')}</h2>
          </div>

          <div className="space-y-3">
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-emerald-900 font-semibold">
                <ThumbsUp className="w-4 h-4 text-emerald-600" />
                <span>{t('search.feedback.useful', 'Useful Matches')}</span>
              </div>
              <span className="text-lg font-extrabold text-emerald-700 font-mono">{feedbackStats.useful || 0}</span>
            </div>

            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-rose-900 font-semibold">
                <ThumbsDown className="w-4 h-4 text-rose-600" />
                <span>{t('search.feedback.notSuitable', 'Not Clinically Suitable')}</span>
              </div>
              <span className="text-lg font-extrabold text-rose-700 font-mono">{feedbackStats.notClinicallySuitable || 0}</span>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center">
              <span className="text-[11px] text-slate-500">{t('admin.feedback.rate', 'Acceptance Rate')}</span>
              <p className="text-xl font-extrabold text-navy-900 font-mono mt-0.5">{feedbackStats.acceptanceRate}%</p>
            </div>
          </div>
        </div>

      </div>

      {/* Audit Logs Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-navy-900" />
            <h2 className="font-bold text-navy-900 text-sm">{t('admin.logs.title', 'System Audit Trail & Access Logs')}</h2>
          </div>
          <span className="text-xs text-slate-500">Last 20 events</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left rtl:text-right text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px]">
              <tr>
                <th className="py-2.5 px-3">{t('admin.logs.timestamp', 'Timestamp')}</th>
                <th className="py-2.5 px-3">{t('admin.logs.action', 'Action')}</th>
                <th className="py-2.5 px-3">{t('admin.logs.user', 'Pharmacist / User')}</th>
                <th className="py-2.5 px-3">{t('admin.logs.target', 'Target Drug / Entity')}</th>
                <th className="py-2.5 px-3">{t('admin.logs.status', 'Status')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {logs.map((log) => (
                <tr key={log._id} className="hover:bg-slate-50/60 transition">
                  <td className="py-2.5 px-3 text-slate-500 font-mono text-[11px]">
                    {new Date(log.createdAt).toLocaleString()}
                  </td>
                  <td className="py-2.5 px-3 font-semibold text-slate-800">
                    {log.action}
                  </td>
                  <td className="py-2.5 px-3 text-slate-600">
                    {log.userName || 'Pharmacist'}
                  </td>
                  <td className="py-2.5 px-3 font-medium text-navy-900">
                    {log.target || 'N/A'}
                  </td>
                  <td className="py-2.5 px-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      {log.resultStatus}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
