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
  Trash2,
  Edit,
  Search,
  DollarSign,
  Save,
  Clock,
  ArrowRight
} from 'lucide-react';
import { PurchaseInvoice, Supplier, Product, PurchaseItem, ShopSettings, PaymentMethod } from '../types';
import { ConfirmDialog } from './ConfirmDialog';

interface PurchasesViewProps {
  purchases: PurchaseInvoice[];
  suppliers: Supplier[];
  products: Product[];
  settings: ShopSettings;
  onSavePurchase: (po: PurchaseInvoice) => void;
  onUpdatePurchase?: (po: PurchaseInvoice) => void;
  onDeletePurchase?: (poId: string) => void;
}

export const PurchasesView: React.FC<PurchasesViewProps> = ({
  purchases,
  suppliers,
  products,
  settings,
  onSavePurchase,
  onUpdatePurchase,
  onDeletePurchase
}) => {
  const currency = settings.currencySymbol || '৳';

  const [searchQuery, setSearchQuery] = useState('');
  const [isNewPOModalOpen, setIsNewPOModalOpen] = useState(false);
  const [selectedSupplierId, setSelectedSupplierId] = useState(suppliers[0]?.id || '');
  const [poItems, setPoItems] = useState<PurchaseItem[]>([]);
  const [selectedProductId, setSelectedProductId] = useState(products[0]?.id || '');
  const [inputQty, setInputQty] = useState<number>(10);
  const [inputCost, setInputCost] = useState<number>(15);
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Bank');

  // Edit PO state
  const [editingPO, setEditingPO] = useState<PurchaseInvoice | null>(null);
  const [editSupplierId, setEditSupplierId] = useState('');
  const [editPoItems, setEditPoItems] = useState<PurchaseItem[]>([]);
  const [editDiscount, setEditDiscount] = useState<number>(0);
  const [editPaidAmount, setEditPaidAmount] = useState<number>(0);
  const [editPaymentMethod, setEditPaymentMethod] = useState<PaymentMethod>('Bank');
  const [editDate, setEditDate] = useState('');
  const [editStatus, setEditStatus] = useState<'RECEIVED' | 'ORDERED' | 'CANCELLED'>('RECEIVED');
  const [editAddProductId, setEditAddProductId] = useState('');

  // Delete state
  const [deletingPO, setDeletingPO] = useState<PurchaseInvoice | null>(null);

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
      alert('ক্রয় অর্ডারে কমপক্ষে একটি পণ্য যোগ করুন।');
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

  // Open Edit Modal
  const handleOpenEditPO = (po: PurchaseInvoice) => {
    setEditingPO(po);
    setEditSupplierId(po.supplierId);
    setEditPoItems([...po.items]);
    setEditDiscount(po.discount || 0);
    setEditPaidAmount(po.paidAmount || 0);
    setEditPaymentMethod(po.paymentMethod || 'Bank');
    setEditDate(po.date.split('T')[0]);
    setEditStatus(po.status || 'RECEIVED');
    if (products.length > 0) {
      setEditAddProductId(products[0].id);
    }
  };

  const handleEditAddItem = () => {
    const prod = products.find((p) => p.id === editAddProductId);
    if (!prod) return;
    setEditPoItems((prev) => [
      ...prev,
      {
        productId: prod.id,
        productName: prod.name,
        quantity: 10,
        unitCost: prod.purchasePrice || 0,
        totalCost: 10 * (prod.purchasePrice || 0)
      }
    ]);
  };

  const handleUpdateEditItemQty = (idx: number, qty: number) => {
    if (qty <= 0) return;
    setEditPoItems((prev) => {
      const copy = [...prev];
      copy[idx] = {
        ...copy[idx],
        quantity: qty,
        totalCost: qty * copy[idx].unitCost
      };
      return copy;
    });
  };

  const handleUpdateEditItemCost = (idx: number, cost: number) => {
    if (cost < 0) return;
    setEditPoItems((prev) => {
      const copy = [...prev];
      copy[idx] = {
        ...copy[idx],
        unitCost: cost,
        totalCost: copy[idx].quantity * cost
      };
      return copy;
    });
  };

  const handleRemoveEditItem = (idx: number) => {
    setEditPoItems((prev) => prev.filter((_, i) => i !== idx));
  };

  // Calculations for Edit PO
  const editSubtotal = editPoItems.reduce((acc, i) => acc + i.totalCost, 0);
  const editGrandTotal = Math.max(0, editSubtotal - editDiscount);
  const editDueAmount = Math.max(0, editGrandTotal - editPaidAmount);

  const handleSaveEditedPO = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPO) return;
    if (editPoItems.length === 0) {
      alert('ক্রয় অর্ডারে কমপক্ষে একটি পণ্য থাকতে হবে।');
      return;
    }

    const sup = suppliers.find((s) => s.id === editSupplierId) || suppliers[0];

    const updatedPO: PurchaseInvoice = {
      ...editingPO,
      supplierId: sup.id,
      supplierName: sup.name,
      date: new Date(editDate || editingPO.date).toISOString(),
      items: editPoItems,
      subtotal: editSubtotal,
      discount: editDiscount,
      grandTotal: editGrandTotal,
      paidAmount: editPaidAmount,
      dueAmount: editDueAmount,
      status: editStatus,
      paymentMethod: editPaymentMethod
    };

    if (onUpdatePurchase) {
      onUpdatePurchase(updatedPO);
    }
    setEditingPO(null);
  };

  const filteredPurchases = purchases.filter((po) => {
    const q = searchQuery.toLowerCase().trim();
    return (
      !q ||
      po.poNumber.toLowerCase().includes(q) ||
      po.supplierName.toLowerCase().includes(q)
    );
  });

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-xl">
        <div>
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-indigo-400" />
            সাপ্লায়ার ক্রয় ও পারচেজ অর্ডার (Purchase Orders & Restock)
          </h2>
          <p className="text-xs text-slate-400">পণ্য ক্রয় হিসাব, এডিট, বিল পরিশোধ এবং সাপ্লায়ার বকেয়া ট্র্যাকিং</p>
        </div>
        <button
          onClick={() => setIsNewPOModalOpen(true)}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs rounded-xl shadow-lg flex items-center gap-2 self-stretch sm:self-auto justify-center"
        >
          <Plus className="w-4 h-4" /> নতুন ক্রয় অর্ডার (Create PO)
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-slate-900 border border-slate-800 p-3 rounded-2xl">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="পিও নম্বর (#PO) বা সাপ্লায়ার নাম দিয়ে খুঁজুন..."
            className="w-full bg-slate-950 text-slate-100 text-xs pl-9 pr-4 py-2 rounded-xl border border-slate-700 focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Purchase Invoices Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-950 text-slate-400 font-bold border-b border-slate-800 uppercase tracking-wider">
                <th className="p-3.5">PO নম্বর</th>
                <th className="p-3.5">তারিখ</th>
                <th className="p-3.5">সাপ্লায়ার</th>
                <th className="p-3.5 text-center">পণ্য লাইন</th>
                <th className="p-3.5 text-right">মোট ক্রয়মূল্য</th>
                <th className="p-3.5 text-right">পরিশোধ</th>
                <th className="p-3.5 text-right">বাকি</th>
                <th className="p-3.5 text-center">স্ট্যাটাস</th>
                <th className="p-3.5 text-right">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-200">
              {filteredPurchases.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-500">
                    কোনো ক্রয় রেকর্ড পাওয়া যায়নি।
                  </td>
                </tr>
              ) : (
                filteredPurchases.map((po) => (
                  <tr key={po.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-3.5 font-mono font-bold text-indigo-400">{po.poNumber}</td>
                    <td className="p-3.5 text-slate-400">{new Date(po.date).toLocaleDateString()}</td>
                    <td className="p-3.5 font-semibold text-slate-100">{po.supplierName}</td>
                    <td className="p-3.5 text-center font-bold text-slate-300">{po.items.length} টি</td>
                    <td className="p-3.5 text-right font-black text-slate-100">{currency}{po.grandTotal.toFixed(2)}</td>
                    <td className="p-3.5 text-right font-bold text-emerald-400">{currency}{po.paidAmount.toFixed(2)}</td>
                    <td className="p-3.5 text-right font-bold text-rose-400">{currency}{po.dueAmount.toFixed(2)}</td>
                    <td className="p-3.5 text-center">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        {po.status}
                      </span>
                    </td>
                    <td className="p-3.5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        {onUpdatePurchase && (
                          <button
                            onClick={() => handleOpenEditPO(po)}
                            className="p-1.5 bg-blue-600/20 hover:bg-blue-600 text-blue-300 hover:text-white rounded-lg transition-colors"
                            title="ক্রয় অর্ডার এডিট করুন"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {onDeletePurchase && (
                          <button
                            onClick={() => setDeletingPO(po)}
                            className="p-1.5 bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white rounded-lg transition-colors"
                            title="ক্রয় অর্ডার মুছুন"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE NEW PURCHASE ORDER MODAL */}
      {isNewPOModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl p-6 max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="flex justify-between items-center pb-3 border-b border-slate-800 mb-4">
              <h3 className="text-base font-bold text-slate-100">নতুন সাপ্লায়ার ক্রয় অর্ডার তৈরি করুন</h3>
              <button onClick={() => setIsNewPOModalOpen(false)} className="p-1.5 text-slate-400 hover:text-white bg-slate-800 rounded-xl">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitPO} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 font-bold mb-1">সাপ্লায়ার নির্বাচন করুন</label>
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
                <span className="text-[10px] font-bold text-indigo-400 uppercase">পণ্য যোগ করুন</span>
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
                      <option key={p.id} value={p.id}>{p.name} (বর্তমান স্টক: {p.currentStock})</option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min="1"
                    value={inputQty}
                    onChange={(e) => setInputQty(parseInt(e.target.value) || 1)}
                    placeholder="পরিমাণ"
                    className="bg-slate-900 text-slate-100 p-2 rounded-lg border border-slate-700 font-bold"
                  />
                  <input
                    type="number"
                    step="0.01"
                    value={inputCost}
                    onChange={(e) => setInputCost(parseFloat(e.target.value) || 0)}
                    placeholder="ক্রয়মূল্য"
                    className="bg-slate-900 text-slate-100 p-2 rounded-lg border border-slate-700 font-bold"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleAddItem}
                  className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg"
                >
                  + পণ্য লাইনে যোগ করুন
                </button>
              </div>

              {/* Added Line Items */}
              <div className="space-y-1.5">
                {poItems.map((item, idx) => (
                  <div key={idx} className="p-2.5 bg-slate-800/60 rounded-xl border border-slate-700 flex justify-between items-center">
                    <div>
                      <div className="font-bold text-slate-200">{item.productName}</div>
                      <div className="text-[10px] text-slate-400">{item.quantity} পিস x {currency}{item.unitCost}</div>
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
                  <label className="block text-slate-400 font-bold mb-1">ডিসকাউন্ট ({currency})</label>
                  <input
                    type="number"
                    value={discountAmount || ''}
                    onChange={(e) => setDiscountAmount(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-950 text-slate-100 p-2 rounded-xl border border-slate-700"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-bold mb-1">পরিশোধ ({currency})</label>
                  <input
                    type="number"
                    value={paidAmount || ''}
                    onChange={(e) => setPaidAmount(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-950 text-emerald-400 font-bold p-2 rounded-xl border border-slate-700"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-bold mb-1">বকেয়া ({currency})</label>
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
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-lg"
                >
                  অর্ডার সংরক্ষণ ও স্টক আপডেট করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT PURCHASE ORDER MODAL */}
      {editingPO && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl p-6 max-h-[90vh] overflow-y-auto custom-scrollbar space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Edit className="w-5 h-5 text-blue-400" />
                <h3 className="text-base font-bold text-slate-100">ক্রয় অর্ডার এডিট করুন (#{editingPO.poNumber})</h3>
              </div>
              <button onClick={() => setEditingPO(null)} className="p-1.5 text-slate-400 hover:text-white bg-slate-800 rounded-xl">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEditedPO} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">সাপ্লায়ার</label>
                  <select
                    value={editSupplierId}
                    onChange={(e) => setEditSupplierId(e.target.value)}
                    className="w-full bg-slate-950 text-slate-100 p-2 rounded-xl border border-slate-700"
                  >
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>{s.name} ({s.companyName})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 font-bold mb-1">তারিখ</label>
                  <input
                    type="date"
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                    className="w-full bg-slate-950 text-slate-100 p-2 rounded-xl border border-slate-700 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-bold mb-1">স্ট্যাটাস</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as any)}
                    className="w-full bg-slate-950 text-slate-100 p-2 rounded-xl border border-slate-700 font-semibold"
                  >
                    <option value="RECEIVED">RECEIVED</option>
                    <option value="ORDERED">ORDERED</option>
                    <option value="CANCELLED">CANCELLED</option>
                  </select>
                </div>
              </div>

              {/* Add Product Dropdown */}
              <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
                <select
                  value={editAddProductId}
                  onChange={(e) => setEditAddProductId(e.target.value)}
                  className="flex-1 bg-slate-950 text-slate-100 p-2 rounded-xl border border-slate-700"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>{p.name} ({currency}{p.purchasePrice})</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={handleEditAddItem}
                  className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> পণ্য যোগ করুন
                </button>
              </div>

              {/* Item Rows */}
              <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
                {editPoItems.map((it, idx) => (
                  <div key={idx} className="p-3 bg-slate-950 rounded-xl border border-slate-800 grid grid-cols-12 gap-2 items-center">
                    <div className="col-span-5 font-bold text-slate-200 truncate">{it.productName}</div>
                    <div className="col-span-3">
                      <input
                        type="number"
                        min="1"
                        value={it.quantity}
                        onChange={(e) => handleUpdateEditItemQty(idx, parseInt(e.target.value) || 1)}
                        className="w-full bg-slate-900 text-center font-bold text-slate-100 p-1.5 rounded-lg border border-slate-700"
                        placeholder="Qty"
                      />
                    </div>
                    <div className="col-span-3">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={it.unitCost}
                        onChange={(e) => handleUpdateEditItemCost(idx, parseFloat(e.target.value) || 0)}
                        className="w-full bg-slate-900 text-right font-bold text-slate-100 p-1.5 rounded-lg border border-slate-700"
                        placeholder="Cost"
                      />
                    </div>
                    <div className="col-span-1 text-center">
                      <button type="button" onClick={() => handleRemoveEditItem(idx)} className="text-rose-400 hover:text-rose-300">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Calculations */}
              <div className="grid grid-cols-3 gap-3 pt-2 bg-slate-950 p-3 rounded-2xl border border-slate-800">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">ডিসকাউন্ট ({currency})</label>
                  <input
                    type="number"
                    value={editDiscount}
                    onChange={(e) => setEditDiscount(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-900 text-slate-100 p-2 rounded-xl border border-slate-700 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-bold mb-1">পরিশোধিত ({currency})</label>
                  <input
                    type="number"
                    value={editPaidAmount}
                    onChange={(e) => setEditPaidAmount(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-900 text-emerald-400 font-bold p-2 rounded-xl border border-slate-700 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-bold mb-1">বাকি ({currency})</label>
                  <div className="p-2 bg-slate-900 text-rose-400 font-bold rounded-xl border border-slate-700 font-mono">
                    {currency}{editDueAmount.toFixed(2)}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingPO(null)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 font-bold rounded-xl"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-extrabold rounded-xl shadow-lg flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" /> আপডেট করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deletingPO}
        title="ক্রয় অর্ডার মুছে ফেলতে নিশ্চিত?"
        message={`আপনি কি ক্রয় অর্ডার #${deletingPO?.poNumber} (${currency}${deletingPO?.grandTotal.toFixed(2)}) নিশ্চিতভাবে মুছে ফেলতে চান?`}
        confirmLabel="হ্যাঁ, মুছুন"
        cancelLabel="না, বাতিল"
        variant="danger"
        onConfirm={() => {
          if (deletingPO && onDeletePurchase) {
            onDeletePurchase(deletingPO.id);
          }
          setDeletingPO(null);
        }}
        onCancel={() => setDeletingPO(null)}
      />
    </div>
  );
};
