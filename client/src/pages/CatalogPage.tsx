import React, { useState, useEffect } from 'react';
import { apiClient } from '../api/client';
import { IDrugProduct } from '../types';
import { Search, Database, FileText, ChevronLeft, ChevronRight } from 'lucide-react';
import { ProductDetailsModal } from '../components/common/ProductDetailsModal';
import { useLanguage } from '../context/LanguageContext';

export const CatalogPage: React.FC = () => {
  const { t } = useLanguage();
  const [products, setProducts] = useState<IDrugProduct[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, limit: 12, total: 0, totalPages: 1 });
  const [selectedProduct, setSelectedProduct] = useState<IDrugProduct | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Debounced search effect
  useEffect(() => {
    const handler = setTimeout(() => {
      if (search.trim()) {
        fetchSearchResults(search);
      } else {
        fetchProducts(1);
      }
    }, 500);
    return () => clearTimeout(handler);
  }, [search]);

  const fetchProducts = async (page: number) => {
    setIsLoading(true);
    try {
      const res: any = await apiClient.get(`/products?page=${page}&limit=12`);
      if (res.success && res.data) {
        setProducts(res.data.products);
        setPagination(res.data.pagination);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSearchResults = async (query: string) => {
    setIsLoading(true);
    try {
      const res: any = await apiClient.get(`/products/search?q=${encodeURIComponent(query)}`);
      if (res.success && res.data) {
        setProducts(res.data.results);
        // Reset pagination for search mode (search doesn't paginate currently)
        setPagination({ page: 1, limit: 12, total: res.data.count, totalPages: 1 });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNextPage = () => {
    if (pagination.page < pagination.totalPages) {
      fetchProducts(pagination.page + 1);
    }
  };

  const handlePrevPage = () => {
    if (pagination.page > 1) {
      fetchProducts(pagination.page - 1);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-navy-900 flex items-center gap-2">
            <Database className="w-5 h-5 text-blue-600" />
            <span>{t('catalog.title', 'Drug Knowledge Database')}</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {t('catalog.subtitle', 'Comprehensive Egyptian pharmaceutical formulations and scientific properties')} ({pagination.total.toLocaleString()} products)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 rtl:left-auto rtl:right-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('catalog.searchPlaceholder', 'Search catalog by brand, active ingredient, or Arabic name...')}
              className="pl-9 pr-3 rtl:pr-9 rtl:pl-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white w-72 shadow-sm"
            />
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <>
          {/* Products Grid */}
          {products.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-2xl border border-slate-200">
              <Database className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">{t('common.no', 'No')} products found matching your criteria.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {products.map((p) => (
                <div
                  key={p._id}
                  onClick={() => {
                    setSelectedProduct(p);
                    setIsModalOpen(true);
                  }}
                  className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-blue-400 transition cursor-pointer card-hover flex flex-col justify-between space-y-3"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-bold text-navy-900 text-sm">{p.productName}</h3>
                        {p.arabicName && <p className="text-xs text-slate-500 font-sans">{p.arabicName}</p>}
                      </div>
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-slate-100 text-slate-700">
                        {p.dosageForm}
                      </span>
                    </div>

                    <p className="text-xs text-slate-500 mt-1">{p.brandName} • {p.manufacturer}</p>

                    {/* Primary Active Ingredient Pill */}
                    <div className="mt-3 p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs">
                      <span className="text-[10px] font-bold uppercase text-slate-400 block">{t('catalog.table.ingredient', 'Primary Ingredient')}</span>
                      <span className="font-bold text-navy-900">
                        {p.primaryActiveIngredient?.name} {p.primaryActiveIngredient?.strength ? `(${p.primaryActiveIngredient?.strength} ${p.primaryActiveIngredient?.unit || ''})` : ''}
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                    <span>Source: <strong className="text-slate-700">{p.source}</strong></span>
                    <span className="text-blue-600 font-semibold flex items-center gap-1">
                      <FileText className="w-3.5 h-3.5" />
                      <span>{t('search.monograph', 'Full Monograph')}</span>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination Controls */}
          {!search.trim() && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 pb-8">
              <span className="text-sm text-slate-500">
                {t('catalog.page', 'Page')} <strong className="text-navy-900">{pagination.page}</strong> {t('catalog.of', 'of')} <strong className="text-navy-900">{pagination.totalPages}</strong>
              </span>
              <div className="flex gap-2">
                <button
                  onClick={handlePrevPage}
                  disabled={pagination.page === 1}
                  className="flex items-center gap-1 px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  <ChevronLeft className="w-4 h-4 rtl:rotate-180" /> {t('catalog.previous', 'Previous')}
                </button>
                <button
                  onClick={handleNextPage}
                  disabled={pagination.page === pagination.totalPages}
                  className="flex items-center gap-1 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  {t('catalog.next', 'Next')} <ChevronRight className="w-4 h-4 rtl:rotate-180" />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Monograph Modal */}
      <ProductDetailsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        product={selectedProduct}
      />

    </div>
  );
};
