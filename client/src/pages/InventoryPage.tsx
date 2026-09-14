import React, { useState, useEffect } from 'react';
import { apiClient } from '../api/client';
import { IPharmacyInventory } from '../types';
import { Package, Search, Clock, Plus, Minus, Edit, Trash2, X } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export const InventoryPage: React.FC = () => {
  const { t } = useLanguage();
  const [items, setItems] = useState<IPharmacyInventory[]>([]);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [formData, setFormData] = useState<Partial<IPharmacyInventory>>({});

  // Search State for Modal
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    const searchProducts = async () => {
      const term = formData.productName || '';
      if (term.length < 2) {
        setSearchResults([]);
        setIsSearching(false);
        return;
      }
      setIsSearching(true);
      try {
        const res: any = await apiClient.get(`/products/search?q=${encodeURIComponent(term)}`);
        if (res.success && res.data) {
          setSearchResults(res.data.results || []);
        } else {
          setSearchResults([]);
        }
      } catch (err) {
        console.error(err);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    };
    
    const timer = setTimeout(() => {
      if (isModalOpen && showDropdown && modalMode === 'add') {
        searchProducts();
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [formData.productName, isModalOpen, showDropdown, modalMode]);

  const handleSelectProduct = (product: any) => {
    setFormData(prev => ({
      ...prev,
      drugProductId: product._id,
      productName: product.productName,
      arabicName: product.arabicName || prev.arabicName || '',
      price: product.referencePrice || prev.price || 0,
    }));
    setShowDropdown(false);
  };

  const fetchInventory = async () => {
    setIsLoading(true);
    try {
      let url = `/inventory?limit=50`;
      if (statusFilter !== 'ALL') url += `&status=${statusFilter}`;
      if (search) url += `&search=${encodeURIComponent(search)}`;
      
      const res: any = await apiClient.get(url);
      if (res.success && res.data) {
        setItems(res.data.items);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, [statusFilter, search]);

  const updateQuantity = async (id: string, currentAvailable: number, currentTotal: number, newAvailable: number) => {
    if (newAvailable < 0) return;
    try {
      const diff = newAvailable - currentAvailable;
      const newTotalQuantity = currentTotal + diff;
      
      setItems((prev) => prev.map(item => 
        item._id === id 
          ? { ...item, availableQuantity: newAvailable, quantity: newTotalQuantity } 
          : item
      ));
      
      const res: any = await apiClient.patch(`/inventory/${id}`, { quantity: newTotalQuantity });
      if (!res.success) {
        fetchInventory(); // revert on fail
      }
    } catch (err) {
      console.error(err);
      fetchInventory(); // revert on fail
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;
    try {
      const res: any = await apiClient.delete(`/inventory/${id}`);
      if (res.success) {
        fetchInventory();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const openAddModal = () => {
    setModalMode('add');
    setFormData({
      productName: '',
      arabicName: '',
      quantity: 0,
      price: 0,
      expirationDate: new Date().toISOString().split('T')[0],
      minimumStockLevel: 5
    });
    setShowDropdown(false);
    setSearchResults([]);
    setIsSearching(false);
    setIsModalOpen(true);
  };

  const openEditModal = (item: IPharmacyInventory) => {
    setModalMode('edit');
    setFormData({
      ...item,
      expirationDate: item.expirationDate ? new Date(item.expirationDate).toISOString().split('T')[0] : undefined
    });
    setIsModalOpen(true);
  };

  const handleSaveModal = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (modalMode === 'add') {
        const res: any = await apiClient.post('/inventory', formData);
        if (res.success) fetchInventory();
      } else {
        const res: any = await apiClient.patch(`/inventory/${formData._id}`, formData);
        if (res.success) fetchInventory();
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error('Failed to save item', err);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'AVAILABLE':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">{t('status.available', 'Available')}</span>;
      case 'LOW_STOCK':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">{t('status.lowStock', 'Low Stock')}</span>;
      case 'OUT_OF_STOCK':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">{t('status.outOfStock', 'Out of Stock')}</span>;
      case 'EXPIRED':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200">{t('status.expired', 'Expired')}</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700">{status}</span>;
    }
  };

  const getFilterLabel = (st: string) => {
    switch (st) {
      case 'ALL': return t('common.all', 'All');
      case 'AVAILABLE': return t('status.available', 'Available');
      case 'LOW_STOCK': return t('status.lowStock', 'Low Stock');
      case 'OUT_OF_STOCK': return t('status.outOfStock', 'Out of Stock');
      case 'EXPIRED': return t('status.expired', 'Expired');
      default: return st;
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header & Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-navy-900 flex items-center gap-2">
            <Package className="w-5 h-5 text-blue-600" />
            <span>{t('inventory.title', 'Pharmacy Inventory Management')}</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time quantities, expiration dates, and quarantine status
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          
          <button
            onClick={openAddModal}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Add Item</span>
          </button>

          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 rtl:left-auto rtl:right-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('inventory.searchPlaceholder', 'Search product...')}
              className="pl-9 pr-3 rtl:pr-9 rtl:pl-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            />
          </div>

          {/* Status Filter Tabs */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
            {['ALL', 'AVAILABLE', 'LOW_STOCK', 'OUT_OF_STOCK', 'EXPIRED'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1 rounded-lg font-medium transition ${
                  statusFilter === st ? 'bg-white text-navy-900 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {getFilterLabel(st)}
              </button>
            ))}
          </div>

        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left rtl:text-right text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">{t('inventory.table.product', 'Product / Arabic Name')}</th>
                <th className="py-3 px-4">{t('inventory.table.status', 'Status')}</th>
                <th className="py-3 px-4">{t('inventory.table.quantity', 'Available Stock')}</th>
                <th className="py-3 px-4">{t('inventory.table.price', 'Price')}</th>
                <th className="py-3 px-4">{t('inventory.table.expiry', 'Expiration Date')}</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {items.map((item) => {
                const isExp = item.expirationDate && new Date(item.expirationDate) <= new Date();
                return (
                  <tr key={item._id} className="hover:bg-slate-50/60 transition">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-navy-900 text-sm">{item.productName}</div>
                      {item.arabicName && <div className="text-[11px] text-slate-500 font-sans">{item.arabicName}</div>}
                    </td>
                    <td className="py-3.5 px-4">{getStatusBadge(isExp ? 'EXPIRED' : item.status)}</td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => updateQuantity(item._id, item.availableQuantity, item.quantity, item.availableQuantity - 1)}
                          disabled={item.availableQuantity <= 0}
                          className="w-6 h-6 flex items-center justify-center rounded-md bg-slate-100 text-slate-500 hover:bg-rose-100 hover:text-rose-600 transition disabled:opacity-50 disabled:hover:bg-slate-100 disabled:hover:text-slate-500"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <div className={`font-mono font-bold min-w-[50px] text-center text-sm ${item.availableQuantity === 0 ? 'text-rose-600' : 'text-emerald-700'}`}>
                          {item.availableQuantity}
                        </div>
                        <button
                          onClick={() => updateQuantity(item._id, item.availableQuantity, item.quantity, item.availableQuantity + 1)}
                          className="w-6 h-6 flex items-center justify-center rounded-md bg-slate-100 text-slate-500 hover:bg-emerald-100 hover:text-emerald-600 transition"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-semibold text-slate-700">
                      {item.price} {t('common.currency', 'EGP')}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className={`flex items-center gap-1 font-mono ${isExp ? 'text-rose-600 font-bold' : 'text-slate-600'}`}>
                        <Clock className="w-3.5 h-3.5" />
                        <span>{new Date(item.expirationDate).toLocaleDateString()}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex justify-center items-center gap-2 text-slate-400">
                        <button onClick={() => openEditModal(item)} className="hover:text-blue-600 p-1 rounded hover:bg-blue-50 transition">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(item._id)} className="hover:text-rose-600 p-1 rounded hover:bg-rose-50 transition">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* CRUD Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-800">
                {modalMode === 'add' ? 'Add Inventory Item' : 'Edit Inventory Item'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveModal} className="p-5 space-y-4">
              <div className="relative">
                <label className="block text-xs font-semibold text-slate-700 mb-1">Product Name</label>
                <input
                  type="text"
                  required
                  value={formData.productName || ''}
                  onChange={e => {
                    setFormData({...formData, productName: e.target.value});
                    if (modalMode === 'add') setShowDropdown(true);
                  }}
                  onFocus={() => { if (modalMode === 'add') setShowDropdown(true); }}
                  onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                  disabled={modalMode === 'edit'}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-slate-50 disabled:text-slate-500"
                  autoComplete="off"
                  placeholder="Search reference database..."
                />
                {modalMode === 'add' && showDropdown && (formData.productName || '').length >= 2 && (
                  <ul className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                    {isSearching ? (
                      <li className="px-3 py-3 text-sm text-slate-500 text-center">Searching...</li>
                    ) : searchResults.length > 0 ? (
                      searchResults.map(product => (
                        <li
                          key={product._id}
                          onMouseDown={(e) => {
                            e.preventDefault(); // Prevent input onBlur
                            handleSelectProduct(product);
                          }}
                          className="px-3 py-2 hover:bg-slate-50 cursor-pointer text-sm border-b border-slate-100 last:border-b-0"
                        >
                          <div className="font-bold text-navy-900">{product.productName}</div>
                          {(product.arabicName || product.genericName) && (
                            <div className="text-xs text-slate-500 flex justify-between mt-0.5">
                              <span className="truncate mr-2">{product.genericName}</span>
                              <span>{product.arabicName}</span>
                            </div>
                          )}
                        </li>
                      ))
                    ) : (
                      <li className="px-3 py-3 text-sm text-slate-500 text-center">No products found</li>
                    )}
                  </ul>
                )}
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Arabic Name</label>
                <input
                  type="text"
                  value={formData.arabicName || ''}
                  onChange={e => setFormData({...formData, arabicName: e.target.value})}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Quantity</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formData.quantity || 0}
                    onChange={e => setFormData({...formData, quantity: Number(e.target.value)})}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Price (EGP)</label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={formData.price || 0}
                    onChange={e => setFormData({...formData, price: Number(e.target.value)})}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Expiration Date</label>
                  <input
                    type="date"
                    required
                    value={formData.expirationDate || ''}
                    onChange={e => setFormData({...formData, expirationDate: e.target.value})}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Min Stock Level</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formData.minimumStockLevel || 0}
                    onChange={e => setFormData({...formData, minimumStockLevel: Number(e.target.value)})}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>
              <div className="pt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 transition shadow-sm"
                >
                  Save Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
