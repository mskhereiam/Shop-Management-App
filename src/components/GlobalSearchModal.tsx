import React, { useState, useEffect } from 'react';
import { Search, X, Package, Users, Truck, FileText, ArrowRight } from 'lucide-react';
import { Product, Customer, Supplier, SaleInvoice, ShopSettings } from '../types';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  customers: Customer[];
  suppliers: Supplier[];
  sales: SaleInvoice[];
  settings?: ShopSettings;
  onSelectResult: (type: 'product' | 'customer' | 'supplier' | 'invoice', item: any) => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  products,
  customers,
  suppliers,
  sales,
  settings,
  onSelectResult
}) => {
  const currency = settings?.currencySymbol || '৳';
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else {
          // Open search modal via header
        }
      } else if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const q = query.toLowerCase().trim();

  const filteredProducts = q
    ? products.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.barcode.includes(q) ||
          p.sku.toLowerCase().includes(q)
      ).slice(0, 4)
    : [];

  const filteredCustomers = q
    ? customers.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.phone.includes(q) ||
          (c.email && c.email.toLowerCase().includes(q))
      ).slice(0, 3)
    : [];

  const filteredSuppliers = q
    ? suppliers.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.phone.includes(q) ||
          (s.companyName && s.companyName.toLowerCase().includes(q))
      ).slice(0, 3)
    : [];

  const filteredSales = q
    ? sales.filter(
        (s) =>
          s.invoiceNumber.toLowerCase().includes(q) ||
          s.customerName.toLowerCase().includes(q)
      ).slice(0, 3)
    : [];

  const hasResults =
    filteredProducts.length > 0 ||
    filteredCustomers.length > 0 ||
    filteredSuppliers.length > 0 ||
    filteredSales.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 px-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Search Header */}
        <div className="flex items-center px-4 py-3 border-b border-slate-800 gap-3">
          <Search className="w-5 h-5 text-indigo-400 shrink-0" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type product name, barcode (890...), customer phone, or invoice #..."
            className="w-full bg-transparent text-sm text-slate-100 placeholder-slate-400 focus:outline-none"
          />
          {query && (
            <button onClick={() => setQuery('')} className="p-1 text-slate-400 hover:text-slate-200">
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="px-2 py-1 text-xs font-semibold text-slate-400 hover:text-slate-200 bg-slate-800 rounded-lg"
          >
            ESC
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-[60vh] overflow-y-auto p-4 space-y-4 custom-scrollbar">
          {!query && (
            <div className="text-center py-8 text-xs text-slate-400">
              Search live database across Products, Customers, Suppliers, and Invoices.
            </div>
          )}

          {query && !hasResults && (
            <div className="text-center py-8 text-xs text-slate-400">
              No matching records found for "{query}".
            </div>
          )}

          {/* Products */}
          {filteredProducts.length > 0 && (
            <div>
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5 text-indigo-400" /> Products
              </div>
              <div className="space-y-1.5">
                {filteredProducts.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      onSelectResult('product', p);
                      onClose();
                    }}
                    className="w-full text-left p-2.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/50 flex items-center justify-between transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      {p.image ? (
                        <img src={p.image} alt={p.name} className="w-9 h-9 rounded-lg object-cover shrink-0" />
                      ) : (
                        <div className="w-9 h-9 rounded-lg bg-indigo-500/20 text-indigo-300 font-bold flex items-center justify-center shrink-0 text-xs">
                          PROD
                        </div>
                      )}
                      <div>
                        <div className="text-xs font-bold text-slate-200 group-hover:text-indigo-300">{p.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          SKU: {p.sku} | Barcode: {p.barcode} | Stock: {p.currentStock}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-bold text-emerald-400">{currency}{p.salePrice.toFixed(2)}</div>
                      <div className="text-[10px] text-slate-400">Stock: {p.currentStock}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Customers */}
          {filteredCustomers.length > 0 && (
            <div>
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-blue-400" /> Customers
              </div>
              <div className="space-y-1.5">
                {filteredCustomers.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => {
                      onSelectResult('customer', c);
                      onClose();
                    }}
                    className="w-full text-left p-2.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/50 flex items-center justify-between transition-colors group"
                  >
                    <div>
                      <div className="text-xs font-bold text-slate-200 group-hover:text-blue-300">{c.name}</div>
                      <div className="text-[10px] text-slate-400">Phone: {c.phone} | {c.email || 'No email'}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-bold text-slate-300">{currency}{c.totalSpent.toFixed(2)} Spent</div>
                      {c.dueAmount > 0 && (
                        <div className="text-[10px] text-amber-400 font-bold">Due: {currency}{c.dueAmount.toFixed(2)}</div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Sales Invoices */}
          {filteredSales.length > 0 && (
            <div>
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-emerald-400" /> Sales Invoices
              </div>
              <div className="space-y-1.5">
                {filteredSales.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => {
                      onSelectResult('invoice', s);
                      onClose();
                    }}
                    className="w-full text-left p-2.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/50 flex items-center justify-between transition-colors group"
                  >
                    <div>
                      <div className="text-xs font-bold text-slate-200 group-hover:text-emerald-300">{s.invoiceNumber}</div>
                      <div className="text-[10px] text-slate-400">Customer: {s.customerName} | Paid: {s.paymentMethod}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-bold text-emerald-400">{currency}{s.grandTotal.toFixed(2)}</div>
                      <div className={`text-[10px] font-bold ${s.paymentStatus === 'PAID' ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {s.paymentStatus}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
