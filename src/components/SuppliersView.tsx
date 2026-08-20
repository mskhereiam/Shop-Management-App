import React, { useState } from 'react';
import {
  Truck,
  Plus,
  Search,
  Phone,
  Mail,
  MapPin,
  DollarSign,
  X,
  CheckCircle,
  Edit,
  Trash2,
  Save,
  BookOpen
} from 'lucide-react';
import { Supplier, SupplierLedgerEntry, ShopSettings, PaymentMethod } from '../types';
import { ConfirmDialog } from './ConfirmDialog';

interface SuppliersViewProps {
  suppliers: Supplier[];
  supplierLedger: SupplierLedgerEntry[];
  settings: ShopSettings;
  onSaveSupplier: (s: Supplier) => void;
  onDeleteSupplier?: (id: string) => void;
  onPaySupplier: (supplierId: string, amount: number, method: PaymentMethod, note: string) => void;
}

export const SuppliersView: React.FC<SuppliersViewProps> = ({
  suppliers,
  supplierLedger,
  settings,
  onSaveSupplier,
  onDeleteSupplier,
  onPaySupplier
}) => {
  const currency = settings.currencySymbol || '৳';

  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [supName, setSupName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [supPhone, setSupPhone] = useState('');
  const [supEmail, setSupEmail] = useState('');
  const [supAddress, setSupAddress] = useState('');

  // Delete State
  const [deletingSupplier, setDeletingSupplier] = useState<Supplier | null>(null);

  // Pay Supplier Modal
  const [paySupplierObj, setPaySupplierObj] = useState<Supplier | null>(null);
  const [payAmount, setPayAmount] = useState<number>(0);
  const [payMethod, setPayMethod] = useState<PaymentMethod>('Bank');
  const [payNote, setPayNote] = useState('');

  // Ledger Drawer
  const [selectedSupplierForLedger, setSelectedSupplierForLedger] = useState<Supplier | null>(null);

  const filteredSuppliers = suppliers.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.companyName && s.companyName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      s.phone.includes(searchQuery)
  );

  const handleOpenAdd = () => {
    setEditingSupplier(null);
    setSupName('');
    setCompanyName('');
    setSupPhone('');
    setSupEmail('');
    setSupAddress('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (s: Supplier) => {
    setEditingSupplier(s);
    setSupName(s.name);
    setCompanyName(s.companyName || '');
    setSupPhone(s.phone);
    setSupEmail(s.email || '');
    setSupAddress(s.address || '');
    setIsModalOpen(true);
  };

  const handleSaveSupplierSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supName.trim() || !supPhone.trim()) {
      alert('সাপ্লায়ারের নাম ও ফোন নম্বর আবশ্যক।');
      return;
    }
    const supplierObj: Supplier = {
      id: editingSupplier ? editingSupplier.id : `sup-${Date.now()}`,
      name: supName.trim(),
      companyName: companyName.trim() || supName.trim(),
      phone: supPhone.trim(),
      email: supEmail.trim() || undefined,
      address: supAddress.trim() || undefined,
      dueAmount: editingSupplier ? editingSupplier.dueAmount : 0,
      createdAt: editingSupplier ? editingSupplier.createdAt : new Date().toISOString().split('T')[0]
    };
    onSaveSupplier(supplierObj);
    setIsModalOpen(false);
  };

  const handlePaySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!paySupplierObj || payAmount <= 0) return;
    onPaySupplier(paySupplierObj.id, payAmount, payMethod, payNote || 'Supplier Payment Outflow');
    setPaySupplierObj(null);
    setPayAmount(0);
    setPayNote('');
  };

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-xl">
        <div>
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <Truck className="w-5 h-5 text-indigo-400" />
            সাপ্লায়ার ডিরেক্টরি ও পাওনাদার খতিয়ান (Suppliers & Payables)
          </h2>
          <p className="text-xs text-slate-400">ভেন্ডর তথ্য পরিচালনা, ক্রয় হিসাব, বকেয়া পরিশোধ ও খতিয়ান</p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs rounded-xl shadow-lg flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> নতুন সাপ্লায়ার যোগ করুন
        </button>
      </div>

      <div className="bg-slate-900 border border-slate-800 p-3 rounded-2xl">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="সাপ্লায়ার নাম, কোম্পানি বা ফোন নম্বর দিয়ে খুঁজুন..."
            className="w-full bg-slate-950 text-slate-200 text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-700/80 focus:outline-none"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredSuppliers.map((s) => (
          <div
            key={s.id}
            className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-4 shadow-xl flex flex-col justify-between space-y-3"
          >
            <div>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-extrabold text-sm text-slate-100">{s.name}</h3>
                  <p className="text-[11px] text-indigo-400 font-bold">{s.companyName}</p>
                </div>
                <div className="flex items-center gap-1.5">
                  {s.dueAmount > 0 ? (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-500/20 text-rose-300 border border-rose-500/30 font-mono">
                      Due: {currency}{s.dueAmount.toFixed(2)}
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      Settled
                    </span>
                  )}
                  <button
                    onClick={() => handleOpenEdit(s)}
                    className="p-1 text-slate-400 hover:text-blue-400 hover:bg-slate-800 rounded"
                    title="সাপ্লায়ার এডিট করুন"
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </button>
                  {onDeleteSupplier && (
                    <button
                      onClick={() => setDeletingSupplier(s)}
                      className="p-1 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded"
                      title="সাপ্লায়ার মুছুন"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              <div className="mt-2 space-y-1 text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="font-mono">{s.phone}</span>
                </div>
                {s.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-slate-500" />
                    <span>{s.email}</span>
                  </div>
                )}
                {s.address && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-500" />
                    <span className="truncate">{s.address}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
              <div>
                <span className="text-[10px] text-slate-500 uppercase block font-semibold">Current Payable</span>
                <span className="font-extrabold text-rose-400 font-mono">{currency}{s.dueAmount.toFixed(2)}</span>
              </div>
              <div className="flex items-center gap-2">
                {s.dueAmount > 0 && (
                  <button
                    onClick={() => {
                      setPaySupplierObj(s);
                      setPayAmount(s.dueAmount);
                    }}
                    className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs shadow"
                  >
                    পেমেন্ট করুন
                  </button>
                )}
                <button
                  onClick={() => setSelectedSupplierForLedger(s)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs border border-slate-700"
                >
                  খতিয়ান
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* CREATE / EDIT SUPPLIER MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl p-6">
            <div className="flex justify-between items-center pb-3 border-b border-slate-800 mb-4">
              <h3 className="text-base font-bold text-slate-100">
                {editingSupplier ? 'সাপ্লায়ার তথ্য এডিট করুন' : 'নতুন সাপ্লায়ার যোগ করুন'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveSupplierSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 font-bold mb-1">সাপ্লায়ার / প্রতিনিধির নাম *</label>
                <input
                  type="text"
                  required
                  value={supName}
                  onChange={(e) => setSupName(e.target.value)}
                  placeholder="যেমন: মোঃ আবুল কালাম"
                  className="w-full bg-slate-950 text-slate-100 p-2.5 rounded-xl border border-slate-700"
                />
              </div>
              <div>
                <label className="block text-slate-400 font-bold mb-1">কোম্পানি / প্রতিষ্ঠানের নাম</label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="যেমন: এস কে এফ ড্রিস্ট্রিবিউটর"
                  className="w-full bg-slate-950 text-slate-100 p-2.5 rounded-xl border border-slate-700"
                />
              </div>
              <div>
                <label className="block text-slate-400 font-bold mb-1">ফোন নম্বর *</label>
                <input
                  type="text"
                  required
                  value={supPhone}
                  onChange={(e) => setSupPhone(e.target.value)}
                  placeholder="01800000000"
                  className="w-full bg-slate-950 text-slate-100 p-2.5 rounded-xl border border-slate-700 font-mono"
                />
              </div>
              <div>
                <label className="block text-slate-400 font-bold mb-1">ইমেইল ঠিকানা</label>
                <input
                  type="email"
                  value={supEmail}
                  onChange={(e) => setSupEmail(e.target.value)}
                  placeholder="vendor@company.com"
                  className="w-full bg-slate-950 text-slate-100 p-2.5 rounded-xl border border-slate-700"
                />
              </div>
              <div>
                <label className="block text-slate-400 font-bold mb-1">ঠিকানা / ওয়ারহাউজ</label>
                <input
                  type="text"
                  value={supAddress}
                  onChange={(e) => setSupAddress(e.target.value)}
                  placeholder="অফিস বা গোডাউনের ঠিকানা"
                  className="w-full bg-slate-950 text-slate-100 p-2.5 rounded-xl border border-slate-700"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 font-bold rounded-xl"
                >
                  বাতিল
                </button>
                <button type="submit" className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-lg flex items-center gap-1.5">
                  <Save className="w-4 h-4" /> {editingSupplier ? 'আপডেট সংরক্ষণ' : 'সাপ্লায়ার সংরক্ষণ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PAY SUPPLIER MODAL */}
      {paySupplierObj && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl p-6">
            <div className="flex justify-between items-center pb-3 border-b border-slate-800 mb-4">
              <h3 className="text-base font-bold text-slate-100">সাপ্লায়ার বকেয়া পরিশোধ (Supplier Payment)</h3>
              <button onClick={() => setPaySupplierObj(null)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handlePaySubmit} className="space-y-3 text-xs">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <div className="font-bold text-slate-200">{paySupplierObj.name} ({paySupplierObj.companyName})</div>
                <div className="text-[10px] text-rose-400 font-bold mt-0.5 font-mono">
                  বর্তমান পাওনা বকেয়া: {currency}{paySupplierObj.dueAmount.toFixed(2)}
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">পরিশোধের পরিমাণ ({currency})</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={payAmount || ''}
                  onChange={(e) => setPayAmount(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-950 text-rose-400 font-bold p-2.5 rounded-xl border border-slate-700 text-sm font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">পেমেন্ট মাধ্যম</label>
                <select
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value as PaymentMethod)}
                  className="w-full bg-slate-950 text-slate-100 p-2.5 rounded-xl border border-slate-700 font-semibold"
                >
                  <option value="Cash">ক্যাশ (Cash)</option>
                  <option value="Bank">ব্যাংক অ্যাকাউন্ট / চেক</option>
                  <option value="Mobile Banking">মোবাইল ব্যাংকিং (bKash/Nagad)</option>
                  <option value="Card">কার্ড (Card)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">নোট / রেফারেন্স বা চেক নম্বর</label>
                <input
                  type="text"
                  value={payNote}
                  onChange={(e) => setPayNote(e.target.value)}
                  placeholder="চেক নম্বর বা ব্যাংকিং রেফারেন্স"
                  className="w-full bg-slate-950 text-slate-100 p-2.5 rounded-xl border border-slate-700"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setPaySupplierObj(null)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 font-bold rounded-xl"
                >
                  বাতিল
                </button>
                <button type="submit" className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl shadow-lg">
                  পেমেন্ট সম্পন্ন করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SUPPLIER LEDGER STATEMENT DRAWER */}
      {selectedSupplierForLedger && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg bg-slate-900 border-l border-slate-800 h-full p-6 overflow-y-auto space-y-4 custom-scrollbar">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-sm font-bold text-slate-100">সাপ্লায়ার খতিয়ান স্টেটমেন্ট</h3>
                <p className="text-xs text-indigo-400 font-bold">{selectedSupplierForLedger.name} ({selectedSupplierForLedger.companyName})</p>
              </div>
              <button onClick={() => setSelectedSupplierForLedger(null)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              {supplierLedger
                .filter((sl) => sl.supplierId === selectedSupplierForLedger.id)
                .map((sl) => (
                  <div key={sl.id} className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/50 text-xs space-y-1">
                    <div className="flex justify-between font-bold text-slate-200">
                      <span>{sl.type} ({sl.referenceNo})</span>
                      <span className="text-slate-400 font-mono">{sl.date}</span>
                    </div>
                    <p className="text-[10px] text-slate-400">{sl.description}</p>
                    <div className="flex justify-between pt-1 font-mono text-[11px] border-t border-slate-800">
                      <span className="text-emerald-400">পরিশোধ: {currency}{sl.debit.toFixed(2)}</span>
                      <span className="text-rose-400">বিল: {currency}{sl.credit.toFixed(2)}</span>
                      <span className="text-slate-200 font-bold">বকেয়া: {currency}{sl.balance.toFixed(2)}</span>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* Delete Supplier Confirmation */}
      <ConfirmDialog
        isOpen={!!deletingSupplier}
        title="সাপ্লায়ার মুছে ফেলতে চান?"
        message={`আপনি কি "${deletingSupplier?.name}" (${deletingSupplier?.companyName}) নিশ্চিতভাবে মুছে ফেলতে চান?`}
        confirmLabel="হ্যাঁ, মুছুন"
        cancelLabel="না, বাতিল"
        variant="danger"
        onConfirm={() => {
          if (deletingSupplier && onDeleteSupplier) {
            onDeleteSupplier(deletingSupplier.id);
          }
          setDeletingSupplier(null);
        }}
        onCancel={() => setDeletingSupplier(null)}
      />
    </div>
  );
};
