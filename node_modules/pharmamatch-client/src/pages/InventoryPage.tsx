import React, { useState, useEffect } from 'react';
import { apiClient } from '../api/client';
import { IPharmacyInventory } from '../types';
import { Package, Search, Filter, AlertTriangle, CheckCircle, XCircle, Clock, MapPin, Tag } from 'lucide-react';

export const InventoryPage: React.FC = () => {
  const [items, setItems] = useState<IPharmacyInventory[]>([]);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(false);

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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'AVAILABLE':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">Available</span>;
      case 'LOW_STOCK':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">Low Stock</span>;
      case 'OUT_OF_STOCK':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">Out of Stock</span>;
      case 'EXPIRED':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200">Expired</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header & Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-navy-900 flex items-center gap-2">
            <Package className="w-5 h-5 text-medical-600" />
            <span>Pharmacy Inventory Management</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">Real-time shelf batches, quantities, expiration dates, and quarantine status</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          
          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search batch, product..."
              className="pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-medical-500 bg-white"
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
                {st.replace('_', ' ')}
              </button>
            ))}
          </div>

        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Product Name</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Available Qty</th>
                <th className="py-3 px-4">Price</th>
                <th className="py-3 px-4">Batch #</th>
                <th className="py-3 px-4">Expiration Date</th>
                <th className="py-3 px-4">Location</th>
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
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-800">
                      <span className={item.availableQuantity === 0 ? 'text-rose-600' : 'text-emerald-700'}>
                        {item.availableQuantity} units
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-semibold text-slate-700">
                      {item.price} {item.currency}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-600">{item.batchNumber}</td>
                    <td className="py-3.5 px-4">
                      <div className={`flex items-center gap-1 font-mono ${isExp ? 'text-rose-600 font-bold' : 'text-slate-600'}`}>
                        <Clock className="w-3.5 h-3.5" />
                        <span>{new Date(item.expirationDate).toLocaleDateString()}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1 text-slate-600">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span>{item.storageLocation}</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
