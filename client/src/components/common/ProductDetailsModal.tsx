import React from 'react';
import { IDrugProduct } from '../../types';
import { X, ExternalLink, ShieldCheck, FileText, AlertOctagon, CheckCircle } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  product: IDrugProduct | null;
}

export const ProductDetailsModal: React.FC<Props> = ({ isOpen, onClose, product }) => {
  const { t } = useLanguage();
  if (!isOpen || !product) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900">{product.productName}</h2>
              {product.arabicName && (
                <span className="text-xs text-slate-500 font-sans">({product.arabicName})</span>
              )}
            </div>
            <p className="text-xs text-slate-500">{product.brandName} • {product.manufacturer} • {product.therapeuticClass}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-700">
          
          {/* Primary Active Ingredient Callout */}
          <div className="p-4 rounded-xl bg-medical-50 border border-medical-200 flex items-start justify-between">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-medical-700">{t('product.primaryIngredient', 'Primary Active Ingredient')}</span>
              <p className="text-base font-bold text-navy-900 mt-0.5">
                {product.primaryActiveIngredient?.name} ({product.primaryActiveIngredient?.strength} {product.primaryActiveIngredient?.unit})
              </p>
              <p className="text-xs text-medical-800/80 mt-1">
                {t('product.confidence', 'Confidence')}: <span className="font-semibold">{product.primaryActiveIngredient?.confidence}</span> • {t('product.source', 'Source')}: {product.primaryActiveIngredient?.source || 'DailyMed'}
              </p>
            </div>
            <div className="px-3 py-1 rounded-full bg-medical-100 text-medical-800 text-xs font-semibold border border-medical-300">
              {product.dosageForm}
            </div>
          </div>

          {/* All Active Ingredients Table */}
          <div>
            <h3 className="font-bold text-slate-900 mb-2 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-slate-600" />
              <span>{t('product.allIngredients', 'Full Active Ingredients Breakdown')}</span>
            </h3>
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left rtl:text-right">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px]">
                  <tr>
                    <th className="py-2 px-3">{t('product.ingredient', 'Ingredient')}</th>
                    <th className="py-2 px-3">{t('product.role', 'Role')}</th>
                    <th className="py-2 px-3">{t('product.strength', 'Strength')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-sans">
                  {product.activeIngredients?.map((ing, i) => (
                    <tr key={i} className={ing.role === 'PRIMARY' ? 'bg-emerald-50/40 font-medium' : ''}>
                      <td className="py-2.5 px-3">{ing.name} {ing.arabicName && `(${ing.arabicName})`}</td>
                      <td className="py-2.5 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          ing.role === 'PRIMARY' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {ing.role}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-mono">{ing.strength ? `${ing.strength} ${ing.unit}` : t('product.unspecified', 'Unspecified')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Clinical Indications & Contraindications */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-3.5 bg-emerald-50/50 border border-emerald-200 rounded-xl">
              <h4 className="font-bold text-emerald-900 flex items-center gap-1.5 mb-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                <span>{t('product.indications', 'Indications')}</span>
              </h4>
              <ul className="list-disc list-inside space-y-1 text-slate-700">
                {product.indications?.map((ind, i) => (
                  <li key={i}>{ind}</li>
                ))}
              </ul>
            </div>

            <div className="p-3.5 bg-rose-50/50 border border-rose-200 rounded-xl">
              <h4 className="font-bold text-rose-900 flex items-center gap-1.5 mb-1.5">
                <AlertOctagon className="w-3.5 h-3.5 text-rose-600" />
                <span>{t('product.contraindications', 'Contraindications')}</span>
              </h4>
              <ul className="list-disc list-inside space-y-1 text-slate-700">
                {product.contraindications?.map((c, i) => (
                  <li key={i}>{c}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* Regulatory Provenance & External Links */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800">{t('product.provenance', 'Source Provenance')}: {product.source}</span>
              <span className="text-slate-500 text-[11px]">{t('product.lastVerified', 'Last verified')}: {new Date(product.lastVerifiedAt).toLocaleDateString()}</span>
            </div>
            {product.references && product.references.length > 0 && (
              <div className="space-y-1 pt-1">
                {product.references.map((ref, i) => (
                  <a
                    key={i}
                    href={ref.url || '#'}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 text-medical-600 hover:underline text-[11px]"
                  >
                    <ExternalLink className="w-3 h-3" />
                    <span>{ref.title} ({ref.source})</span>
                  </a>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-navy-900 hover:bg-navy-800 text-white text-xs font-bold rounded-lg transition"
          >
            {t('product.closeMonograph', 'Close Monograph')}
          </button>
        </div>

      </div>
    </div>
  );
};
