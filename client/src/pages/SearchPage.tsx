import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { apiClient } from '../api/client';
import { 
  Search, 
  Sparkles, 
  AlertCircle, 
  CheckCircle2, 
  Scale, 
  FileText, 
  ThumbsUp, 
  ThumbsDown, 
  ShieldAlert, 
  Filter,
  ArrowRight,
  PackageCheck,
  PackageX,
  Layers
} from 'lucide-react';
import { SimilarityBadge } from '../components/common/SimilarityBadge';
import { ComparisonModal } from '../components/common/ComparisonModal';
import { ProductDetailsModal } from '../components/common/ProductDetailsModal';
import { IDrugProduct, ISimilarityResult } from '../types';
import { useLanguage } from '../context/LanguageContext';

export const SearchPage: React.FC = () => {
  const { t } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';

  const [query, setQuery] = useState(initialQuery);
  const [isSearching, setIsSearching] = useState(false);
  const [targetProduct, setTargetProduct] = useState<IDrugProduct | null>(null);
  const [candidates, setCandidates] = useState<ISimilarityResult[]>([]);
  const [onlyAvailable, setOnlyAvailable] = useState(true);
  const [feedbackState, setFeedbackState] = useState<Record<string, string>>({});

  // Modals state
  const [selectedCandidateForComparison, setSelectedCandidateForComparison] = useState<ISimilarityResult | null>(null);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);
  const [selectedProductForMonograph, setSelectedProductForMonograph] = useState<IDrugProduct | null>(null);
  const [isMonographModalOpen, setIsMonographModalOpen] = useState(false);

  useEffect(() => {
    if (initialQuery) {
      handlePerformSearch(initialQuery);
    }
  }, [initialQuery, onlyAvailable]);

  const handlePerformSearch = async (searchStr: string) => {
    if (!searchStr.trim()) return;
    setIsSearching(true);
    setTargetProduct(null);
    setCandidates([]);

    try {
      // 1. Search for target product in DB
      const searchRes: any = await apiClient.get(`/products/search?q=${encodeURIComponent(searchStr.trim())}`);
      
      if (searchRes.success && searchRes.data.results.length > 0) {
        const foundTarget = searchRes.data.results[0];
        setTargetProduct(foundTarget);

        // 2. Fetch similar candidates cross-referenced with inventory
        const simRes: any = await apiClient.get(
          `/similarity/similar/${foundTarget._id}?onlyAvailable=${onlyAvailable}`
        );

        if (simRes.success && simRes.data.candidates) {
          setCandidates(simRes.data.candidates);
        }
      } else {
        setTargetProduct(null);
        setCandidates([]);
      }
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      setSearchParams({ q: query.trim() });
      handlePerformSearch(query.trim());
    }
  };

  const handleSelectQuickSuggestion = (suggestion: string) => {
    setQuery(suggestion);
    setSearchParams({ q: suggestion });
    handlePerformSearch(suggestion);
  };

  const handleRecordFeedback = async (
    candidateId: string, 
    candidateName: string, 
    rating: 'USEFUL' | 'NOT_USEFUL' | 'NOT_CLINICALLY_SUITABLE',
    score: number
  ) => {
    if (!targetProduct) return;
    setFeedbackState(prev => ({ ...prev, [candidateId]: rating }));

    try {
      await apiClient.post('/audit/feedback', {
        targetProductId: targetProduct._id,
        targetProductName: targetProduct.productName,
        candidateProductId: candidateId,
        candidateProductName: candidateName,
        calculatedScore: score,
        rating
      });
    } catch (err) {
      console.error('Failed to submit feedback:', err);
    }
  };

  const quickSearchSuggestions = [
    { label: 'Calmag', arabic: 'كالماج' },
    { label: 'Augmentin 1g', arabic: 'أوجمنتين 1 جم' },
    { label: 'Panadol Extra', arabic: 'بنادول اكسترا' },
    { label: 'Concor 5mg', arabic: 'كونكور 5 مج' },
    { label: 'Cataflam 50mg', arabic: 'كتافلام 50 مج' },
    { label: 'Controloc 40mg', arabic: 'كونترولوك 40 مج' }
  ];

  return (
    <div className="space-y-6">
      
      {/* Search Header Bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <form onSubmit={handleFormSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 rtl:left-auto rtl:right-3.5" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('search.placeholder', 'Search medication name in English or Arabic (e.g. Calmag, كالماج, Augmentin)...')}
              className="w-full pl-11 pr-4 rtl:pr-11 rtl:pl-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition bg-slate-50/50"
            />
          </div>
          <button
            type="submit"
            disabled={isSearching}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-sm rounded-xl shadow-xs transition flex items-center gap-2"
          >
            {isSearching ? <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></span> : <Sparkles className="w-4 h-4" />}
            <span>{t('dashboard.actions.runSimilarity', 'Analyze Similarity')}</span>
          </button>
        </form>

        {/* Quick Suggestion Chips */}
        <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
          <span className="text-slate-400 font-medium">{t('common.quickSuggestions', 'Quick Suggestions')}:</span>
          {quickSearchSuggestions.map((s, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleSelectQuickSuggestion(s.label)}
              className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-blue-50 hover:text-blue-600 border border-slate-200 text-slate-700 font-medium transition"
            >
              {s.label} <span className="text-[11px] text-slate-400 font-sans">({s.arabic})</span>
            </button>
          ))}
        </div>
      </div>

      {/* When a Product is Selected & Analyzed */}
      {targetProduct && (
        <div className="space-y-6 animate-in fade-in duration-200">
          
          {/* Target Product Overview Banner */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className={`p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b ${
              targetProduct.inventory?.status === 'OUT_OF_STOCK' || targetProduct.inventory?.availableQuantity === 0
                ? 'bg-rose-50/50 border-rose-100'
                : 'bg-emerald-50/50 border-emerald-100'
            }`}>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-800 text-white">
                    {t('search.targetDrug', 'Requested Medication')}
                  </span>
                  <h2 className="text-xl font-extrabold text-navy-900">{targetProduct.productName}</h2>
                  {targetProduct.arabicName && (
                    <span className="text-sm font-semibold text-slate-500 font-sans">({targetProduct.arabicName})</span>
                  )}
                </div>
                <p className="text-xs text-slate-600">
                  {targetProduct.brandName} • Generic: {targetProduct.genericName} • {targetProduct.manufacturer}
                </p>
              </div>

              {/* Real-time Inventory Tag */}
              <div className="flex items-center gap-3">
                {targetProduct.inventory?.status === 'OUT_OF_STOCK' || targetProduct.inventory?.availableQuantity === 0 ? (
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-rose-100 text-rose-800 border border-rose-200 text-xs font-bold">
                    <PackageX className="w-4 h-4 text-rose-600" />
                    <span>{t('status.outOfStock', 'OUT OF STOCK')} in Pharmacy</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold">
                    <PackageCheck className="w-4 h-4 text-emerald-600" />
                    <span>{t('status.available', 'IN STOCK')} ({targetProduct.inventory?.availableQuantity} {t('common.units', 'Units')})</span>
                  </div>
                )}

                <button
                  onClick={() => {
                    setSelectedProductForMonograph(targetProduct);
                    setIsMonographModalOpen(true);
                  }}
                  className="px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition flex items-center gap-1.5"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>{t('search.monograph', 'Monograph')}</span>
                </button>
              </div>
            </div>

            {/* Extracted Primary Active Ingredient Highlight Bar */}
            <div className="p-4 bg-slate-50 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-xs">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400">{t('search.activeIngredient', 'Primary Active Ingredient')}</span>
                  <p className="font-extrabold text-slate-900 text-sm">
                    {targetProduct.primaryActiveIngredient?.name} ({targetProduct.primaryActiveIngredient?.strength} {targetProduct.primaryActiveIngredient?.unit})
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 text-slate-500 text-[11px]">
                <span>Confidence: <strong className="text-emerald-600">{targetProduct.primaryActiveIngredient?.confidence}</strong></span>
                <span>•</span>
                <span>Source: {targetProduct.source}</span>
                <span>•</span>
                <span>{t('search.dosageForm', 'Form')}: <strong>{targetProduct.dosageForm}</strong></span>
              </div>
            </div>
          </div>

          {/* Results Filter Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-navy-900 text-base">
                {t('search.alternativesFound', 'Available In-Stock Candidates')} ({candidates.length})
              </h3>
              <span className="text-xs text-slate-500">
                (Matched by Primary Ingredient: <strong>{targetProduct.primaryActiveIngredient?.name}</strong>)
              </span>
            </div>

            {/* In-Stock Filter Toggle */}
            <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={onlyAvailable}
                onChange={(e) => setOnlyAvailable(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-400"
              />
              <span>{t('search.filter.onlyAvailable', 'Filter Only Currently Available Stock')}</span>
            </label>
          </div>

          {/* Candidates Grid */}
          {candidates.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {candidates.map((cand) => {
                const p = cand.candidateProduct;
                const inv = cand.inventory;
                const feedback = feedbackState[cand.candidateProductId];

                return (
                  <div
                    key={cand.candidateProductId}
                    className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 flex flex-col justify-between space-y-4 hover:border-blue-300 transition-all card-hover"
                  >
                    <div>
                      
                      {/* Top Row: Name, Match Badge, Score */}
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <h4 className="font-bold text-navy-900 text-base">{p.productName}</h4>
                            {p.arabicName && <span className="text-xs text-slate-500 font-sans">({p.arabicName})</span>}
                          </div>
                          <p className="text-xs text-slate-500">{p.brandName} • {p.manufacturer}</p>
                        </div>
                        <SimilarityBadge level={cand.similarityLevel} score={cand.percentageScore} />
                      </div>

                      {/* Stock & Batch Tag */}
                      <div className="mt-3 flex items-center justify-between p-2.5 bg-emerald-50/70 border border-emerald-200 rounded-xl text-xs">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span className="font-bold text-emerald-900">
                            {inv?.availableQuantity || 0} {t('common.units', 'Units In Stock')}
                          </span>
                        </div>
                        <div className="text-emerald-800 font-semibold">
                          {inv?.price} {t('common.currency', 'EGP')} <span className="text-[10px] text-emerald-600 font-normal">({inv?.storageLocation})</span>
                        </div>
                      </div>

                      {/* Itemized Reasons & Warnings */}
                      <div className="mt-3 space-y-1 text-xs">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                          {t('search.breakdown', 'Similarity Breakdown & Explainability')}:
                        </p>
                        {cand.reasons.map((r, i) => (
                          <div key={i} className="text-emerald-700 flex items-start gap-1.5">
                            <span className="text-emerald-500 font-bold shrink-0">{r.slice(0, 1)}</span>
                            <span>{r.slice(2)}</span>
                          </div>
                        ))}
                        {cand.warnings.map((w, i) => (
                          <div key={i} className="text-amber-700 flex items-start gap-1.5">
                            <span className="text-amber-500 font-bold shrink-0">{w.slice(0, 1)}</span>
                            <span>{w.slice(2)}</span>
                          </div>
                        ))}
                      </div>

                    </div>

                    {/* Action Buttons & Feedback Bar */}
                    <div className="pt-3 border-t border-slate-100 flex flex-col gap-2.5">
                      
                      <div className="flex items-center justify-between gap-2">
                        <button
                          onClick={() => {
                            setSelectedCandidateForComparison(cand);
                            setIsCompareModalOpen(true);
                          }}
                          className="flex-1 py-2 px-3 bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold text-xs rounded-xl transition flex items-center justify-center gap-1.5 border border-blue-200"
                        >
                          <Scale className="w-3.5 h-3.5" />
                          <span>{t('search.compare', 'Compare Formulations')}</span>
                        </button>

                        <button
                          onClick={() => {
                            setSelectedProductForMonograph(p);
                            setIsMonographModalOpen(true);
                          }}
                          className="py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition flex items-center justify-center gap-1.5"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>{t('common.view', 'Details')}</span>
                        </button>
                      </div>

                      {/* Pharmacist Clinical Feedback Recording */}
                      <div className="flex items-center justify-between text-[11px] bg-slate-50 p-2 rounded-xl border border-slate-200/70">
                        <span className="text-slate-500 font-medium">{t('search.pharmacistReview', 'Pharmacist Review')}:</span>
                        
                        {feedback ? (
                          <span className={`font-bold px-2 py-0.5 rounded text-[10px] ${
                            feedback === 'USEFUL' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                          }`}>
                            {t('search.logged', 'Logged')}: {feedback.replace('_', ' ')}
                          </span>
                        ) : (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleRecordFeedback(cand.candidateProductId, p.productName, 'USEFUL', cand.percentageScore)}
                              className="px-2 py-1 bg-white hover:bg-emerald-50 hover:text-emerald-700 text-slate-600 rounded border border-slate-200 transition flex items-center gap-1"
                              title="Mark as useful clinical candidate"
                            >
                              <ThumbsUp className="w-3 h-3" />
                              <span>{t('search.feedback.useful', 'Useful')}</span>
                            </button>
                            <button
                              onClick={() => handleRecordFeedback(cand.candidateProductId, p.productName, 'NOT_CLINICALLY_SUITABLE', cand.percentageScore)}
                              className="px-2 py-1 bg-white hover:bg-rose-50 hover:text-rose-700 text-slate-600 rounded border border-slate-200 transition flex items-center gap-1"
                              title="Mark as clinically unsuitable"
                            >
                              <ThumbsDown className="w-3 h-3" />
                              <span>{t('search.feedback.notSuitable', 'Not Suitable')}</span>
                            </button>
                          </div>
                        )}
                      </div>

                    </div>

                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white p-10 rounded-2xl border border-slate-200 text-center space-y-2">
              <AlertCircle className="w-8 h-8 text-amber-500 mx-auto" />
              <h4 className="font-bold text-slate-800">{t('search.noAlternatives', 'No In-Stock Alternatives Found')}</h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                {t('search.noAlternatives', 'No matching alternatives found in the pharmacy stock.')}
              </p>
            </div>
          )}

          {/* Mandatory Healthcare Legal & Clinical Disclaimer */}
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3 text-xs text-amber-900">
            <ShieldAlert className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-amber-800 text-sm">{t('search.disclaimerTitle', 'Mandatory Clinical Safety Notice')}</p>
              <p className="mt-1 leading-relaxed text-amber-900/90">
                {t('search.disclaimerText', 'PharmaMatch AI identifies candidate medications based on shared primary active ingredient and deterministic structured attributes.')}
              </p>
            </div>
          </div>

        </div>
      )}

      {/* No Query Empty State */}
      {!targetProduct && !isSearching && (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-medical-50 text-medical-600 flex items-center justify-center mx-auto">
            <Search className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-navy-900">{t('search.emptyStateTitle', 'Search for Medication')}</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            {t('search.emptyStateDesc', 'Enter the name of an unavailable medication to extract its primary active ingredient and discover available in-stock alternatives.')}
          </p>
        </div>
      )}

      {/* Modals */}
      <ComparisonModal
        isOpen={isCompareModalOpen}
        onClose={() => setIsCompareModalOpen(false)}
        targetProduct={targetProduct}
        candidateResult={selectedCandidateForComparison}
      />

      <ProductDetailsModal
        isOpen={isMonographModalOpen}
        onClose={() => setIsMonographModalOpen(false)}
        product={selectedProductForMonograph}
      />

    </div>
  );
};
