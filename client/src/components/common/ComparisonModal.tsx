import React from 'react';
import { ISimilarityResult } from '../../types';
import { X, CheckCircle2, AlertTriangle, Scale, ShieldAlert } from 'lucide-react';
import { SimilarityBadge } from './SimilarityBadge';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  targetProduct: any;
  candidateResult: ISimilarityResult | null;
}

export const ComparisonModal: React.FC<Props> = ({ isOpen, onClose, targetProduct, candidateResult }) => {
  if (!isOpen || !candidateResult || !targetProduct) return null;

  const candProduct = candidateResult.candidateProduct;
  const comp = candidateResult.comparison;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-medical-50 text-medical-600 flex items-center justify-center">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Side-by-Side Formulation Comparison</h2>
              <p className="text-xs text-slate-500">Deterministic structured attribute cross-examination</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          
          {/* Comparison Header Cards */}
          <div className="grid grid-cols-2 gap-4">
            
            {/* Target Product (Requested / Unavailable) */}
            <div className="p-4 rounded-xl border-2 border-slate-300 bg-slate-50 relative">
              <span className="absolute top-3 right-3 px-2 py-0.5 text-[10px] font-bold uppercase bg-slate-200 text-slate-700 rounded">
                Requested Target
              </span>
              <h3 className="font-bold text-slate-900 text-base">{targetProduct.productName}</h3>
              <p className="text-xs text-slate-600 mt-0.5">{targetProduct.brandName} • {targetProduct.manufacturer}</p>
              <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-rose-50 text-rose-700 border border-rose-200 text-xs font-semibold">
                Status: {targetProduct.inventory?.status || 'OUT_OF_STOCK'} (0 units)
              </div>
            </div>

            {/* Candidate Product (In Stock Alternative) */}
            <div className="p-4 rounded-xl border-2 border-medical-500 bg-medical-50/40 relative">
              <span className="absolute top-3 right-3">
                <SimilarityBadge level={candidateResult.similarityLevel} score={candidateResult.percentageScore} />
              </span>
              <h3 className="font-bold text-slate-900 text-base">{candProduct.productName}</h3>
              <p className="text-xs text-slate-600 mt-0.5">{candProduct.brandName} • {candProduct.manufacturer}</p>
              <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold">
                In Stock: {candidateResult.inventory?.availableQuantity || 0} units ({candidateResult.inventory?.price} {candidateResult.inventory?.currency || 'EGP'})
              </div>
            </div>

          </div>

          {/* Structured Attributes Comparison Table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-700 uppercase tracking-wider font-bold">
                  <th className="py-2.5 px-4 w-1/3">Clinical Attribute</th>
                  <th className="py-2.5 px-4 w-1/3">Target ({targetProduct.productName})</th>
                  <th className="py-2.5 px-4 w-1/3">Candidate ({candProduct.productName})</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-sans">
                
                {/* Primary Active Ingredient */}
                <tr className="bg-emerald-50/30">
                  <td className="py-3 px-4 font-semibold text-slate-900 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Primary Active Ingredient (60% Weight)</span>
                  </td>
                  <td className="py-3 px-4 font-bold text-navy-900">
                    {comp.primaryIngredient.target}
                  </td>
                  <td className="py-3 px-4 font-bold text-medical-600">
                    {comp.primaryIngredient.candidate}
                  </td>
                </tr>

                {/* Strength */}
                <tr>
                  <td className="py-3 px-4 font-medium text-slate-700">
                    Strength / Concentration (20% Weight)
                  </td>
                  <td className="py-3 px-4 text-slate-800 font-mono">
                    {comp.strength.target}
                  </td>
                  <td className="py-3 px-4 text-slate-800 font-mono">
                    {comp.strength.candidate} <span className="text-[11px] text-slate-500 font-sans">({comp.strength.matchPercentage}% match)</span>
                  </td>
                </tr>

                {/* Dosage Form */}
                <tr>
                  <td className="py-3 px-4 font-medium text-slate-700">
                    Dosage Form & Route (10% Weight)
                  </td>
                  <td className="py-3 px-4 text-slate-800">
                    {comp.dosageForm.target}
                  </td>
                  <td className="py-3 px-4 text-slate-800">
                    {comp.dosageForm.candidate}
                  </td>
                </tr>

                {/* Secondary Ingredients */}
                <tr className="bg-slate-50/50">
                  <td className="py-3 px-4 font-medium text-slate-700 align-top">
                    Secondary Active Ingredients (10% Weight)
                  </td>
                  <td className="py-3 px-4 text-slate-800 align-top">
                    {comp.secondaryIngredients.target.length > 0 ? (
                      <ul className="list-disc list-inside space-y-0.5">
                        {comp.secondaryIngredients.target.map((s, i) => (
                          <li key={i}>{s}</li>
                        ))}
                      </ul>
                    ) : (
                      <span className="text-slate-400 italic">None (Single agent)</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-slate-800 align-top">
                    {comp.secondaryIngredients.candidate.length > 0 ? (
                      <ul className="list-disc list-inside space-y-0.5">
                        {comp.secondaryIngredients.candidate.map((s, i) => {
                          const isShared = comp.secondaryIngredients.overlap.includes(s);
                          return (
                            <li key={i} className={isShared ? 'text-emerald-700 font-medium' : 'text-slate-700'}>
                              {s} {isShared && '✓ (shared)'}
                            </li>
                          );
                        })}
                      </ul>
                    ) : (
                      <span className="text-slate-400 italic">None (Single agent)</span>
                    )}
                  </td>
                </tr>

                {/* Therapeutic Class */}
                <tr>
                  <td className="py-3 px-4 font-medium text-slate-700">
                    Therapeutic Classification
                  </td>
                  <td className="py-3 px-4 text-slate-800">
                    {targetProduct.therapeuticClass}
                  </td>
                  <td className="py-3 px-4 text-slate-800">
                    {candProduct.therapeuticClass}
                  </td>
                </tr>

              </tbody>
            </table>
          </div>

          {/* Component Score Bar */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-800">
              <span>Overall Deterministic Similarity Score:</span>
              <span className="text-medical-600 text-sm font-mono">{candidateResult.percentageScore}%</span>
            </div>
            <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden flex">
              <div
                className="bg-medical-500 h-full transition-all duration-500"
                style={{ width: `${candidateResult.percentageScore}%` }}
              ></div>
            </div>
            <div className="grid grid-cols-4 gap-2 pt-2 text-[11px] text-slate-500 text-center">
              <div>Primary Active: <span className="font-semibold text-slate-800 font-mono">{candidateResult.componentScores.primaryIngredientScore * 100}%</span></div>
              <div>Strength: <span className="font-semibold text-slate-800 font-mono">{candidateResult.componentScores.strengthScore * 100}%</span></div>
              <div>Form: <span className="font-semibold text-slate-800 font-mono">{candidateResult.componentScores.dosageFormScore * 100}%</span></div>
              <div>Secondary: <span className="font-semibold text-slate-800 font-mono">{candidateResult.componentScores.secondaryIngredientScore * 100}%</span></div>
            </div>
          </div>

          {/* Mandatory Healthcare Verification Note */}
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5 text-xs text-amber-900">
            <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-amber-800">Pharmacist Verification Notice: </span>
              This side-by-side comparison is an informational tool based on structured catalog properties. It does not replace clinical pharmacokinetics, patient allergy history, or practitioner prescription requirements.
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-navy-900 hover:bg-navy-800 text-white text-xs font-bold rounded-lg transition"
          >
            Close Comparison
          </button>
        </div>

      </div>
    </div>
  );
};
