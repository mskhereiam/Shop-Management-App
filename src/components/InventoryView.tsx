import React, { useState } from 'react';
import { Boxes, AlertTriangle, Plus, Minus, RotateCcw, Wrench, Search, Sparkles } from 'lucide-react';
import { Product, StockMovement, ShopSettings } from '../types';

interface InventoryViewProps {
  products: Product[];
  stockMovements: StockMovement[];
  settings: ShopSettings;
  onAdjustStock: (productId: string, quantity: number, type: 'ADJUSTMENT' | 'DAMAGE' | 'RETURN', note: string) => void;
  onQuickPO: (p: Product) => void;
}

export const InventoryView: React.FC<InventoryViewProps> = ({
  products,
  stockMovements,
  settings,
  onAdjustStock,
  onQuickPO
}) => {
  const currency = settings.currencySymbol || '৳';

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'ALL' | 'LOW' | 'OUT'>('ALL');

  // Adjustment Modal
  const [adjustProduct, setAdjustProduct] = useState<Product | null>(null);
  const [adjustQty, setAdjustQty] = useState<number>(1);
  const [adjustType, setAdjustType] = useState<'ADJUSTMENT' | 'DAMAGE' | 'RETURN'>('ADJUSTMENT');
  const [adjustNote, setAdjustNote] = useState('');

  const filteredProducts = products.filter((p) => {
    const q = searchQuery.toLowerCase();
    const matchesQ = p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q) || p.barcode.includes(q);
    if (selectedFilter === 'LOW') return matchesQ && p.currentStock > 0 && p.currentStock <= p.minStock;
    if (selectedFilter === 'OUT') return matchesQ && p.currentStock === 0;
    return matchesQ;
  });

  const handleAdjustSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustProduct || adjustQty <= 0) return;
    onAdjustStock(adjustProduct.id, adjustQty, adjustType, adjustNote || 'Physical stock audit');
    setAdjustProduct(null);
    setAdjustQty(1);
    setAdjustNote('');
  };

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-xl">
        <div>
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <Boxes className="w-5 h-5 text-indigo-400" />
            Live Inventory Control & Stock Audit
          </h2>
          <p className="text-xs text-slate-400">Monitor real-time product quantities, log damaged items, and audit physical counts</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-col sm:flex-row gap-3 bg-slate-900 border border-slate-800 p-3 rounded-2xl">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search SKU, Barcode, or Product Name..."
            className="w-full bg-slate-950 text-slate-200 text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-700/80 focus:outline-none"
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setSelectedFilter('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold ${
              selectedFilter === 'ALL' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'
            }`}
          >
            All Stock ({products.length})
          </button>
          <button
            onClick={() => setSelectedFilter('LOW')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold ${
              selectedFilter === 'LOW' ? 'bg-amber-600 text-white' : 'bg-slate-800 text-amber-400'
            }`}
          >
            Low Stock ({products.filter((p) => p.currentStock > 0 && p.currentStock <= p.minStock).length})
          </button>
          <button
            onClick={() => setSelectedFilter('OUT')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold ${
              selectedFilter === 'OUT' ? 'bg-rose-600 text-white' : 'bg-slate-800 text-rose-400'
            }`}
          >
            Out of Stock ({products.filter((p) => p.currentStock === 0).length})
          </button>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-950 text-slate-400 font-bold border-b border-slate-800 uppercase tracking-wider">
                <th className="p-3.5">Product Title</th>
                <th className="p-3.5">SKU / Barcode</th>
                <th className="p-3.5 text-right">Asset Value</th>
                <th className="p-3.5 text-center">Safety Threshold</th>
                <th className="p-3.5 text-center">Current Stock</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-200">
              {filteredProducts.map((p) => {
                const totalAssetVal = p.currentStock * p.purchasePrice;
                const isLow = p.currentStock > 0 && p.currentStock <= p.minStock;
                const isOut = p.currentStock === 0;

                return (
                  <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-3.5 font-bold text-slate-100">{p.name}</td>
                    <td className="p-3.5 font-mono text-[11px] text-slate-400">SKU: {p.sku} | BC: {p.barcode}</td>
                    <td className="p-3.5 text-right font-bold text-emerald-400">{currency}{totalAssetVal.toFixed(2)}</td>
                    <td className="p-3.5 text-center font-semibold text-slate-400">{p.minStock} Units</td>
                    <td className="p-3.5 text-center">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold ${
                        isOut
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : isLow
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      }`}>
                        {p.currentStock} Units
                      </span>
                    </td>
                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setAdjustProduct(p)}
                          className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-lg text-xs"
                        >
                          Stock Audit / Adjust
                        </button>
                        {(isLow || isOut) && (
                          <button
                            onClick={() => onQuickPO(p)}
                            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs shadow"
                          >
                            + Restock PO
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADJUSTMENT MODAL */}
      {adjustProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl p-6">
            <h3 className="text-base font-bold text-slate-100 mb-2">Adjust Inventory Stock</h3>
            <p className="text-xs text-indigo-400 font-bold mb-4">{adjustProduct.name} (Current: {adjustProduct.currentStock})</p>

            <form onSubmit={handleAdjustSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 font-bold mb-1">Adjustment Reason / Type</label>
                <select
                  value={adjustType}
                  onChange={(e) => setAdjustType(e.target.value as any)}
                  className="w-full bg-slate-950 text-slate-100 p-2.5 rounded-xl border border-slate-700"
                >
                  <option value="ADJUSTMENT">Physical Inventory Audit Sync (+)</option>
                  <option value="DAMAGE">Damaged / Broken / Expired (-)</option>
                  <option value="RETURN">Customer Return Restock (+)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">Quantity</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={adjustQty}
                  onChange={(e) => setAdjustQty(parseInt(e.target.value) || 1)}
                  className="w-full bg-slate-950 text-slate-100 font-bold text-sm p-2.5 rounded-xl border border-slate-700"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">Note / Audit Reason</label>
                <input
                  type="text"
                  value={adjustNote}
                  onChange={(e) => setAdjustNote(e.target.value)}
                  placeholder="e.g. Shelf audit mismatch or water damage"
                  className="w-full bg-slate-950 text-slate-100 p-2.5 rounded-xl border border-slate-700"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setAdjustProduct(null)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-lg">
                  Apply Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
