import React, { useState } from 'react';
import {
  ShoppingBag,
  Plus,
  Truck,
  FileText,
  Calendar,
  CheckCircle,
  X,
  PlusCircle,
  Trash2
} from 'lucide-react';
import { PurchaseInvoice, Supplier, Product, PurchaseItem, ShopSettings, PaymentMethod } from '../types';

interface PurchasesViewProps {
  purchases: PurchaseInvoice[];
  suppliers: Supplier[];
  products: Product[];
  settings: ShopSettings;
  onSavePurchase: (po: PurchaseInvoice) => void;
}

export const PurchasesView: React.FC<PurchasesViewProps> = ({
  purchases,
  suppliers,
  products,
  settings,
  onSavePurchase
}) => {
  const currency = settings.currencySymbol || '৳';

  const [isNewPOModalOpen, setIsNewPOModalOpen] = useState(false);
  const [selectedSupplierId, setSelectedSupplierId] = useState(suppliers[0]?.id || '');
  const [poItems, setPoItems] = useState<PurchaseItem[]>([]);
  const [selectedProductId, setSelectedProductId] = useState(products[0]?.id || '');
  const [inputQty, setInputQty] = useState<number>(10);
  const [inputCost, setInputCost] = useState<number>(15);
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Bank');

  const handleAddItem = () => {
    const prod = products.find((p) => p.id === selectedProductId);
    if (!prod) return;
    setPoItems((prev) => [
      ...prev,
      {
        productId: prod.id,
        productName: prod.name,
        quantity: inputQty,
        unitCost: inputCost,
        totalCost: inputQty * inputCost
      }
    ]);
  };

  const handleRemoveItem = (idx: number) => {
    setPoItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const subtotal = poItems.reduce((acc, i) => acc + i.totalCost, 0);
  const grandTotal = Math.max(0, subtotal - discountAmount);
  const dueVal = Math.max(0, grandTotal - paidAmount);

  const handleSubmitPO = (e: React.FormEvent) => {
    e.preventDefault();
    if (poItems.length === 0) {
      alert('Add at least one product item to purchase order.');
      return;
    }
    const sup = suppliers.find((s) => s.id === selectedSupplierId) || suppliers[0];

    const newPO: PurchaseInvoice = {
      id: `po-${Date.now()}`,
      poNumber: `PO-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      date: new Date().toISOString(),
      supplierId: sup.id,
      supplierName: sup.name,
      items: poItems,
      subtotal,
      taxAmount: 0,
      discount: discountAmount,
      grandTotal,
      paidAmount,
      dueAmount: dueVal,
      status: 'RECEIVED',
      paymentMethod
    };

    onSavePurchase(newPO);
    setIsNewPOModalOpen(false);
    setPoItems([]);
    setDiscountAmount(0);
    setPaidAmount(0);
  };

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-xl">
        <div>
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-indigo-400" />
            Supplier Purchase Orders & Restock Invoices
          </h2>
          <p className="text-xs text-slate-400">Track incoming stock purchases, supplier billing & payables</p>
        </div>
        <button
          onClick={() => setIsNewPOModalOpen(true)}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs rounded-xl shadow-lg flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Create Purchase Order
        </button>
      </div>

      {/* Purchase Invoices Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-950 text-slate-400 font-bold border-b border-slate-800 uppercase tracking-wider">
                <th className="p-3.5">PO Number</th>
                <th className="p-3.5">Date</th>
                <th className="p-3.5">Supplier</th>
                <th className="p-3.5 text-center">Items</th>
                <th className="p-3.5 text-right">Grand Total</th>
                <th className="p-3.5 text-right">Paid</th>
                <th className="p-3.5 text-right">Due Balance</th>
                <th className="p-3.5 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-200">
              {purchases.map((po) => (
                <tr key={po.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="p-3.5 font-mono font-bold text-indigo-400">{po.poNumber}</td>
                  <td className="p-3.5 text-slate-400">{new Date(po.date).toLocaleDateString()}</td>
                  <td className="p-3.5 font-semibold text-slate-100">{po.supplierName}</td>
                  <td className="p-3.5 text-center font-bold text-slate-300">{po.items.length} lines</td>
                  <td className="p-3.5 text-right font-black text-slate-100">{currency}{po.grandTotal.toFixed(2)}</td>
                  <td className="p-3.5 text-right font-bold text-emerald-400">{currency}{po.paidAmount.toFixed(2)}</td>
                  <td className="p-3.5 text-right font-bold text-rose-400">{currency}{po.dueAmount.toFixed(2)}</td>
                  <td className="p-3.5 text-center">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      {po.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE NEW PURCHASE ORDER MODAL */}
      {isNewPOModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl p-6 max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="flex justify-between items-center pb-3 border-b border-slate-800 mb-4">
              <h3 className="text-base font-bold text-slate-100">Create Supplier Restock Purchase Order</h3>
              <button onClick={() => setIsNewPOModalOpen(false)} className="p-1.5 text-slate-400 hover:text-white bg-slate-800 rounded-xl">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitPO} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 font-bold mb-1">Select Supplier</label>
                <select
                  value={selectedSupplierId}
                  onChange={(e) => setSelectedSupplierId(e.target.value)}
                  className="w-full bg-slate-950 text-slate-100 p-2.5 rounded-xl border border-slate-700"
                >
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>{s.name} ({s.companyName})</option>
                  ))}
                </select>
              </div>

              {/* Add Item Row */}
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                <span className="text-[10px] font-bold text-indigo-400 uppercase">Add Product Line</span>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                  <select
                    value={selectedProductId}
                    onChange={(e) => {
                      setSelectedProductId(e.target.value);
                      const p = products.find((pr) => pr.id === e.target.value);
                      if (p) setInputCost(p.purchasePrice);
                    }}
                    className="sm:col-span-2 bg-slate-900 text-slate-100 p-2 rounded-lg border border-slate-700"
                  >
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>{p.name} (Stock: {p.currentStock})</option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min="1"
                    value={inputQty}
                    onChange={(e) => setInputQty(parseInt(e.target.value) || 1)}
                    placeholder="Qty"
                    className="bg-slate-900 text-slate-100 p-2 rounded-lg border border-slate-700 font-bold"
                  />
                  <input
                    type="number"
                    step="0.01"
                    value={inputCost}
                    onChange={(e) => setInputCost(parseFloat(e.target.value) || 0)}
                    placeholder="Cost Price"
                    className="bg-slate-900 text-slate-100 p-2 rounded-lg border border-slate-700 font-bold"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleAddItem}
                  className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg"
                >
                  + Add Line Item
                </button>
              </div>

              {/* Added Line Items */}
              <div className="space-y-1.5">
                {poItems.map((item, idx) => (
                  <div key={idx} className="p-2.5 bg-slate-800/60 rounded-xl border border-slate-700 flex justify-between items-center">
                    <div>
                      <div className="font-bold text-slate-200">{item.productName}</div>
                      <div className="text-[10px] text-slate-400">{item.quantity} units x {currency}{item.unitCost}</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-emerald-400">{currency}{item.totalCost.toFixed(2)}</span>
                      <button type="button" onClick={() => handleRemoveItem(idx)} className="text-rose-400">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-3 gap-3 pt-2">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Discount ({currency})</label>
                  <input
                    type="number"
                    value={discountAmount || ''}
                    onChange={(e) => setDiscountAmount(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-950 text-slate-100 p-2 rounded-xl border border-slate-700"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Paid Amount ({currency})</label>
                  <input
                    type="number"
                    value={paidAmount || ''}
                    onChange={(e) => setPaidAmount(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-950 text-emerald-400 font-bold p-2 rounded-xl border border-slate-700"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Due Amount ({currency})</label>
                  <div className="p-2 bg-slate-950 text-rose-400 font-bold rounded-xl border border-slate-800">
                    {currency}{dueVal.toFixed(2)}
                  </div>
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewPOModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-lg"
                >
                  Receive Order & Update Stock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
