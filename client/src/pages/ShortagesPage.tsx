import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  AlertTriangle, Plus, Trash2, Edit3, Check, X,
  ChevronDown, Search, Flame, ShieldAlert, Minus, Package,
  RefreshCw, CheckCircle2, ClipboardList
} from 'lucide-react';
import { apiClient } from '../api/client';
import { IShortage, IShortageStats, IDrugReference, ShortageUrgency, ShortageStatus } from '../types/shortage';

// ─── Drug Reference DB (loaded once from bundled JSON) ──────────────────────
// We import only the fields we need via a fetch to avoid bundling 8 MB
let drugRefCache: IDrugReference[] | null = null;

async function loadDrugRef(): Promise<IDrugReference[]> {
  if (drugRefCache) return drugRefCache;
  try {
    // The JSON file is served from the reference database folder via the dev proxy
    // Fall back to fetching the raw static file path
    const res = await fetch('/reference-db/egyptian-drugs.json');
    if (!res.ok) throw new Error('not found');
    drugRefCache = await res.json();
    return drugRefCache!;
  } catch {
    return [];
  }
}

// ─── Urgency helpers ─────────────────────────────────────────────────────────
function suggestUrgency(neededQty: number): ShortageUrgency {
  if (neededQty > 5) return 'CRITICAL';
  if (neededQty >= 2 && neededQty <= 5) return 'MEDIUM';
  return 'HIGH'; // 0 or 1 unit
}

const URGENCY_META: Record<ShortageUrgency, { label: string; color: string; bg: string; border: string; dot: string }> = {
  CRITICAL: {
    label: 'CRITICAL',
    color: 'text-red-700',
    bg: 'bg-red-50',
    border: 'border-red-300',
    dot: 'bg-red-500',
  },
  HIGH: {
    label: 'HIGH',
    color: 'text-orange-700',
    bg: 'bg-orange-50',
    border: 'border-orange-300',
    dot: 'bg-orange-500',
  },
  MEDIUM: {
    label: 'MEDIUM',
    color: 'text-amber-700',
    bg: 'bg-amber-50',
    border: 'border-amber-300',
    dot: 'bg-amber-400',
  },
};

const STATUS_META: Record<ShortageStatus, { label: string; color: string; bg: string }> = {
  PENDING: { label: 'Pending', color: 'text-slate-700', bg: 'bg-slate-100' },
  ORDERED: { label: 'Ordered', color: 'text-blue-700', bg: 'bg-blue-50' },
  RESOLVED: { label: 'Resolved', color: 'text-emerald-700', bg: 'bg-emerald-50' },
};

// ─── Subcomponents ───────────────────────────────────────────────────────────

interface UrgencyBadgeProps { urgency: ShortageUrgency; pulse?: boolean }
const UrgencyBadge: React.FC<UrgencyBadgeProps> = ({ urgency, pulse }) => {
  const m = URGENCY_META[urgency];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider border ${m.bg} ${m.color} ${m.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${m.dot} ${pulse && urgency === 'CRITICAL' ? 'animate-pulse' : ''}`} />
      {m.label}
    </span>
  );
};

interface StatusBadgeProps { status: ShortageStatus }
const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const m = STATUS_META[status];
  return (
    <span className={`inline-flex px-2.5 py-1 rounded-full text-[11px] font-bold ${m.bg} ${m.color}`}>
      {m.label}
    </span>
  );
};

// ─── Drug Autocomplete Input ─────────────────────────────────────────────────
interface DrugAutocompleteProps {
  value: string;
  onChange: (drug: IDrugReference | null, rawText: string) => void;
}

const DrugAutocomplete: React.FC<DrugAutocompleteProps> = ({ value, onChange }) => {
  const [query, setQuery] = useState(value);
  const [suggestions, setSuggestions] = useState<IDrugReference[]>([]);
  const [open, setOpen] = useState(false);
  const [drugDb, setDrugDb] = useState<IDrugReference[]>([]);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadDrugRef().then(setDrugDb);
  }, []);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  useEffect(() => {
    if (!query || query.length < 2) {
      setSuggestions([]);
      setOpen(false);
      return;
    }
    const q = query.toLowerCase().trim();
    const tokens = q.split(/\s+/).filter(Boolean);
    const matches = drugDb
      .filter((d) => {
        const searchableText = `${d.commercial_name_en || ''} ${d.commercial_name_ar || ''} ${d.scientific_name || ''}`.toLowerCase();
        return tokens.every((token) => searchableText.includes(token));
      })
      .slice(0, 12);
    setSuggestions(matches);
    setOpen(matches.length > 0);
  }, [query, drugDb]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const pick = (drug: IDrugReference) => {
    setQuery(drug.commercial_name_en);
    setOpen(false);
    onChange(drug, drug.commercial_name_en);
  };

  return (
    <div className="relative" ref={ref}>
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          id="shortage-medicine-name"
          type="text"
          autoComplete="off"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            onChange(null, e.target.value);
          }}
          placeholder="Search Egyptian drug database..."
          className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 bg-white placeholder:text-slate-400"
        />
      </div>
      {open && (
        <div className="absolute z-50 top-full mt-1 left-0 right-0 bg-white border border-slate-200 rounded-xl shadow-xl max-h-64 overflow-y-auto">
          {suggestions.map((d, i) => (
            <button
              key={i}
              type="button"
              onClick={() => pick(d)}
              className="w-full text-left px-4 py-2.5 hover:bg-red-50 border-b border-slate-100 last:border-0 transition"
            >
              <div className="font-semibold text-sm text-slate-800 truncate">{d.commercial_name_en}</div>
              <div className="flex items-center gap-2 mt-0.5">
                {d.commercial_name_ar && (
                  <span className="text-[11px] text-slate-500 font-arabic">{d.commercial_name_ar}</span>
                )}
                <span className="text-[10px] text-slate-400">• {d.scientific_name?.slice(0, 40)}</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Add / Edit Modal ────────────────────────────────────────────────────────
interface ModalForm {
  medicineName: string;
  medicineNameAr: string;
  concentration: string;
  scientificName: string;
  manufacturer: string;
  drugClass: string;
  currentQuantity: number;
  neededQuantity: number;
  urgency: ShortageUrgency;
}

const EMPTY_FORM: ModalForm = {
  medicineName: '',
  medicineNameAr: '',
  concentration: '',
  scientificName: '',
  manufacturer: '',
  drugClass: '',
  currentQuantity: 0,
  neededQuantity: 1,
  urgency: 'HIGH',
};

interface ShortageModalProps {
  mode: 'add' | 'edit';
  initial?: Partial<ModalForm>;
  onClose: () => void;
  onSave: (form: ModalForm) => Promise<void>;
}

const ShortageModal: React.FC<ShortageModalProps> = ({ mode, initial, onClose, onSave }) => {
  const [form, setForm] = useState<ModalForm>({ ...EMPTY_FORM, ...initial });
  const [saving, setSaving] = useState(false);
  const [userOverrodeUrgency, setUserOverrodeUrgency] = useState(false);

  // Auto-suggest urgency when neededQuantity changes (unless user overrode)
  useEffect(() => {
    if (!userOverrodeUrgency) {
      setForm((f) => ({ ...f, urgency: suggestUrgency(f.neededQuantity) }));
    }
  }, [form.neededQuantity, userOverrodeUrgency]);

  const handleDrugPick = (drug: IDrugReference | null, rawText: string) => {
    if (drug) {
      setForm((f) => ({
        ...f,
        medicineName: drug.commercial_name_en,
        medicineNameAr: drug.commercial_name_ar || '',
        concentration: drug.commercial_name_en, // each DB row IS a specific concentration/form
        scientificName: drug.scientific_name || '',
        manufacturer: drug.manufacturer || '',
        drugClass: drug.drug_class || '',
      }));
    } else {
      setForm((f) => ({ ...f, medicineName: rawText }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.medicineName || form.neededQuantity < 1) return;
    setSaving(true);
    try {
      await onSave(form);
    } finally {
      setSaving(false);
    }
  };

  const u = URGENCY_META[form.urgency];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-red-600 to-orange-500 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-white">
            <AlertTriangle className="w-5 h-5" />
            <h2 className="font-extrabold text-base tracking-tight">
              {mode === 'add' ? 'إضافة نقص جديد' : 'تعديل النقص'}
              <span className="block text-white/70 text-[11px] font-normal mt-0.5">
                {mode === 'add' ? 'Add new shortage entry' : 'Edit shortage entry'}
              </span>
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-white/80 hover:text-white transition rounded-lg p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* 1. Medicine Name — Autocomplete */}
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">
              Medicine Name <span className="text-red-500">*</span>
            </label>
            {mode === 'add' ? (
              <DrugAutocomplete
                value={form.medicineName}
                onChange={handleDrugPick}
              />
            ) : (
              <div className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-700 font-semibold">
                {form.medicineName}
              </div>
            )}
            {form.medicineNameAr && (
              <p className="text-[11px] text-slate-500 mt-1 font-arabic">{form.medicineNameAr}</p>
            )}
          </div>

          {/* 2. Concentration (auto-filled, read-only hint) */}
          {form.concentration && (
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">
                Concentration / Form
              </label>
              <div className="w-full px-3 py-2.5 rounded-xl border border-slate-100 bg-slate-50 text-xs text-slate-600">
                {form.concentration}
              </div>
            </div>
          )}

          {/* 3. Current Quantity */}
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">
              Current Quantity on Shelf
            </label>
            <input
              id="shortage-current-qty"
              type="number"
              min={0}
              value={form.currentQuantity}
              onChange={(e) => setForm((f) => ({ ...f, currentQuantity: Number(e.target.value) }))}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
            />
          </div>

          {/* 4. Needed Quantity */}
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">
              Needed Quantity (to order) <span className="text-red-500">*</span>
            </label>
            <input
              id="shortage-needed-qty"
              type="number"
              min={1}
              value={form.neededQuantity}
              onChange={(e) => setForm((f) => ({ ...f, neededQuantity: Number(e.target.value) }))}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Urgency is auto-suggested based on this quantity
            </p>
          </div>

          {/* 5. Urgency */}
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">
              Urgency
            </label>
            <div className="flex gap-2">
              {(['MEDIUM', 'HIGH', 'CRITICAL'] as ShortageUrgency[]).map((lvl) => {
                const m = URGENCY_META[lvl];
                const isActive = form.urgency === lvl;
                return (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => {
                      setForm((f) => ({ ...f, urgency: lvl }));
                      setUserOverrodeUrgency(true);
                    }}
                    className={`flex-1 py-2 rounded-xl border text-xs font-bold uppercase tracking-wide transition
                      ${isActive ? `${m.bg} ${m.color} ${m.border} shadow-sm` : 'bg-white text-slate-400 border-slate-200 hover:border-slate-300'}`}
                  >
                    {lvl}
                  </button>
                );
              })}
            </div>
            <div className={`mt-2 text-[11px] px-3 py-1.5 rounded-lg ${u.bg} ${u.color} flex items-center gap-1.5`}>
              <span className={`w-1.5 h-1.5 rounded-full ${u.dot} ${form.urgency === 'CRITICAL' ? 'animate-pulse' : ''}`} />
              {form.urgency === 'CRITICAL' && 'Critical shortage — immediate action required'}
              {form.urgency === 'HIGH' && 'High priority — order soon'}
              {form.urgency === 'MEDIUM' && 'Medium — monitor and plan order'}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !form.medicineName || form.neededQuantity < 1}
              className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-orange-500 text-white text-sm font-bold shadow-md hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving…' : mode === 'add' ? 'Add Shortage' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── Main Page ───────────────────────────────────────────────────────────────
export const ShortagesPage: React.FC = () => {
  const [items, setItems] = useState<IShortage[]>([]);
  const [stats, setStats] = useState<IShortageStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [filterUrgency, setFilterUrgency] = useState<'ALL' | ShortageUrgency>('ALL');
  const [filterStatus, setFilterStatus] = useState<'ALL' | ShortageStatus>('ALL');
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [editItem, setEditItem] = useState<IShortage | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteName, setDeleteName] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      let url = '/shortages?';
      if (filterUrgency !== 'ALL') url += `urgency=${filterUrgency}&`;
      if (filterStatus !== 'ALL') url += `status=${filterStatus}&`;
      if (search) url += `search=${encodeURIComponent(search)}&`;

      const [listRes, statsRes]: any[] = await Promise.all([
        apiClient.get(url),
        apiClient.get('/shortages/stats'),
      ]);

      if (listRes.success) setItems(listRes.data.items);
      if (statsRes.success) setStats(statsRes.data);
    } catch (err) {
      showToast('Failed to load shortages.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [filterUrgency, filterStatus, search]);

  const handleAdd = async (form: ModalForm) => {
    await apiClient.post('/shortages', form);
    setShowAdd(false);
    showToast('Shortage entry added successfully.');
    fetchData();
  };

  const handleEdit = async (form: ModalForm) => {
    if (!editItem) return;
    await apiClient.patch(`/shortages/${editItem._id}`, {
      currentQuantity: form.currentQuantity,
      neededQuantity: form.neededQuantity,
      urgency: form.urgency,
    });
    setEditItem(null);
    showToast('Shortage entry updated.');
    fetchData();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await apiClient.delete(`/shortages/${deleteId}`);
      setDeleteId(null);
      showToast('Entry deleted.');
      fetchData();
    } catch {
      showToast('Delete failed.', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const handleStatusChange = async (id: string, status: ShortageStatus) => {
    try {
      await apiClient.patch(`/shortages/${id}`, { status });
      showToast(`Marked as ${status.toLowerCase()}.`);
      fetchData();
    } catch {
      showToast('Failed to update status.', 'error');
    }
  };

  const urgentCount = stats ? stats.byCritical + stats.byHigh : 0;

  return (
    <div className="space-y-6 relative">

      {/* ── Toast ── */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-lg text-sm font-semibold flex items-center gap-2 animate-fade-in
          ${toast.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'}`}>
          {toast.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
          {toast.msg}
        </div>
      )}

      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center shadow-md">
              <AlertTriangle className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="block leading-tight" style={{ fontFamily: 'Arial, sans-serif' }}>نواقص</span>
              <span className="block text-sm font-normal text-slate-500 -mt-0.5">Danger Zone — Low Stock Tracker</span>
            </div>
          </h1>
        </div>
        <button
          id="add-shortage-btn"
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-orange-500 text-white text-sm font-bold shadow-md hover:opacity-90 transition shrink-0"
        >
          <Plus className="w-4 h-4" />
          إضافة نقص &nbsp;/ Add Shortage
        </button>
      </div>

      {/* ── Stats Bar ── */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Critical', labelAr: 'حرج', count: stats.byCritical, icon: Flame, color: 'from-red-500 to-red-600', text: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200' },
            { label: 'High', labelAr: 'عالي', count: stats.byHigh, icon: ShieldAlert, color: 'from-orange-400 to-orange-500', text: 'text-orange-700', bg: 'bg-orange-50', border: 'border-orange-200' },
            { label: 'Medium', labelAr: 'متوسط', count: stats.byMedium, icon: Minus, color: 'from-amber-400 to-amber-500', text: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200' },
            { label: 'Resolved', labelAr: 'محلول', count: stats.resolved, icon: CheckCircle2, color: 'from-emerald-400 to-emerald-500', text: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200' },
          ].map(({ label, labelAr, count, icon: Icon, color, text, bg, border }) => (
            <div key={label} className={`rounded-2xl border ${border} ${bg} p-4 flex items-center gap-3`}>
              <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center shadow-sm shrink-0`}>
                <Icon className="w-4 h-4 text-white" />
              </div>
              <div>
                <div className={`text-2xl font-extrabold ${text}`}>{count}</div>
                <div className={`text-[11px] font-semibold ${text} opacity-80`}>{label} <span className="font-arabic">/ {labelAr}</span></div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Alert Banner (if critical items exist) ── */}
      {stats && stats.byCritical > 0 && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-300 rounded-2xl px-4 py-3">
          <Flame className="w-5 h-5 text-red-600 shrink-0 animate-pulse" />
          <p className="text-sm text-red-700 font-semibold">
            <span className="font-extrabold">{stats.byCritical} critical shortage{stats.byCritical > 1 ? 's' : ''}</span> require immediate attention.
            {' '}<span style={{ fontFamily: 'Arial' }}>{stats.byCritical} نقص حرج يحتاج تدخل فوري.</span>
          </p>
        </div>
      )}

      {/* ── Filters ── */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search medicine…"
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-red-300 bg-white"
          />
        </div>

        {/* Urgency filter */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs gap-0.5">
          {(['ALL', 'CRITICAL', 'HIGH', 'MEDIUM'] as const).map((u) => (
            <button
              key={u}
              onClick={() => setFilterUrgency(u)}
              className={`px-3 py-1.5 rounded-lg font-semibold transition ${filterUrgency === u ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-800'}`}
            >
              {u === 'ALL' ? 'All' : u}
            </button>
          ))}
        </div>

        {/* Status filter */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs gap-0.5">
          {(['ALL', 'PENDING', 'ORDERED', 'RESOLVED'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-3 py-1.5 rounded-lg font-semibold transition ${filterStatus === s ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-800'}`}
            >
              {s === 'ALL' ? 'All' : s}
            </button>
          ))}
        </div>

        <button
          onClick={fetchData}
          className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition text-slate-500"
          title="Refresh"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* ── Shortages Table ── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading && items.length === 0 ? (
          <div className="flex items-center justify-center py-20 text-slate-400 gap-3">
            <RefreshCw className="w-5 h-5 animate-spin" />
            <span className="text-sm">Loading shortages…</span>
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <Package className="w-12 h-12 mb-3 opacity-30" />
            <p className="text-sm font-medium">No shortage entries found</p>
            <p className="text-xs mt-1 opacity-70">لا توجد نواقص مسجلة</p>
            <button
              onClick={() => setShowAdd(true)}
              className="mt-4 px-4 py-2 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold hover:bg-red-100 transition"
            >
              + Add first shortage
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Medicine</th>
                  <th className="py-3 px-4">Urgency</th>
                  <th className="py-3 px-4">On Shelf</th>
                  <th className="py-3 px-4">To Order</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((item) => (
                  <tr
                    key={item._id}
                    className={`hover:bg-slate-50/60 transition ${item.urgency === 'CRITICAL' ? 'bg-red-50/30' : ''}`}
                  >
                    {/* Medicine */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-800 text-sm max-w-[200px] truncate">{item.medicineName}</div>
                      {item.medicineNameAr && (
                        <div className="text-[11px] text-slate-500 font-arabic">{item.medicineNameAr}</div>
                      )}
                      {item.concentration && item.concentration !== item.medicineName && (
                        <div className="text-[10px] text-slate-400 mt-0.5 max-w-[200px] truncate">{item.concentration}</div>
                      )}
                    </td>

                    {/* Urgency */}
                    <td className="py-3.5 px-4">
                      <UrgencyBadge urgency={item.urgency} pulse />
                    </td>

                    {/* On shelf */}
                    <td className="py-3.5 px-4 font-mono font-bold">
                      <span className={item.currentQuantity === 0 ? 'text-red-600' : 'text-slate-700'}>
                        {item.currentQuantity} units
                      </span>
                    </td>

                    {/* To order */}
                    <td className="py-3.5 px-4 font-mono font-extrabold text-red-600">
                      {item.neededQuantity} units
                    </td>

                    {/* Status dropdown */}
                    <td className="py-3.5 px-4">
                      <div className="relative group inline-block">
                        <button className="flex items-center gap-1">
                          <StatusBadge status={item.status} />
                          <ChevronDown className="w-3 h-3 text-slate-400" />
                        </button>
                        <div className="absolute left-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-20 hidden group-hover:block min-w-[120px]">
                          {(['PENDING', 'ORDERED', 'RESOLVED'] as ShortageStatus[]).map((s) => (
                            <button
                              key={s}
                              onClick={() => handleStatusChange(item._id, s)}
                              className={`w-full text-left px-3 py-2 text-xs font-semibold hover:bg-slate-50 first:rounded-t-xl last:rounded-b-xl transition
                                ${item.status === s ? 'text-medical-700 font-extrabold' : 'text-slate-600'}`}
                            >
                              {s}
                            </button>
                          ))}
                        </div>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          id={`edit-shortage-${item._id}`}
                          onClick={() => setEditItem(item)}
                          className="p-1.5 rounded-lg text-slate-500 hover:bg-blue-50 hover:text-blue-600 transition"
                          title="Edit"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          id={`delete-shortage-${item._id}`}
                          onClick={() => { setDeleteId(item._id); setDeleteName(item.medicineName); }}
                          className="p-1.5 rounded-lg text-slate-500 hover:bg-red-50 hover:text-red-600 transition"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Add Modal ── */}
      {showAdd && (
        <ShortageModal
          mode="add"
          onClose={() => setShowAdd(false)}
          onSave={handleAdd}
        />
      )}

      {/* ── Edit Modal ── */}
      {editItem && (
        <ShortageModal
          mode="edit"
          initial={{
            medicineName: editItem.medicineName,
            medicineNameAr: editItem.medicineNameAr || '',
            concentration: editItem.concentration || '',
            scientificName: editItem.scientificName || '',
            manufacturer: editItem.manufacturer || '',
            drugClass: editItem.drugClass || '',
            currentQuantity: editItem.currentQuantity,
            neededQuantity: editItem.neededQuantity,
            urgency: editItem.urgency,
          }}
          onClose={() => setEditItem(null)}
          onSave={handleEdit}
        />
      )}

      {/* ── Delete Confirmation ── */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-800">Delete Entry?</h3>
                <p className="text-xs text-slate-500 mt-0.5">This action cannot be undone.</p>
              </div>
            </div>
            <p className="text-sm text-slate-600 bg-slate-50 rounded-xl px-3 py-2 mb-5 font-medium truncate">
              {deleteName}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteId(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-sm font-bold hover:bg-red-700 transition disabled:opacity-60"
              >
                {deleting ? 'Deleting…' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
