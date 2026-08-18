import React, { useState } from 'react';
import { Truck, Plus, Search, Phone, Mail, MapPin, DollarSign, X, CheckCircle } from 'lucide-react';
import { Supplier, SupplierLedgerEntry, ShopSettings, PaymentMethod } from '../types';

interface SuppliersViewProps {
  suppliers: Supplier[];
  supplierLedger: SupplierLedgerEntry[];
  settings: ShopSettings;
  onSaveSupplier: (s: Supplier) => void;
  onPaySupplier: (supplierId: string, amount: number, method: PaymentMethod, note: string) => void;
}

export const SuppliersView: React.FC<SuppliersViewProps> = ({
  suppliers,
  supplierLedger,
  settings,
  onSaveSupplier,
  onPaySupplier
}) => {
  const currency = settings.currencySymbol || '৳';

  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [supName, setSupName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [supPhone, setSupPhone] = useState('');
  const [supEmail, setSupEmail] = useState('');
  const [supAddress, setSupAddress] = useState('');

  // Pay Supplier Modal
  const [paySupplierObj, setPaySupplierObj] = useState<Supplier | null>(null);
  const [payAmount, setPayAmount] = useState<number>(0);
  const [payMethod, setPayMethod] = useState<PaymentMethod>('Bank');
  const [payNote, setPayNote] = useState('');

  const filteredSuppliers = suppliers.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.companyName && s.companyName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      s.phone.includes(searchQuery)
  );

  const handleCreateSupplier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supName.trim() || !supPhone.trim()) {
      alert('Supplier Name and Phone are required.');
      return;
    }
    const newSup: Supplier = {
      id: `sup-${Date.now()}`,
      name: supName.trim(),
      companyName: companyName.trim() || supName.trim(),
      phone: supPhone.trim(),
      email: supEmail.trim() || undefined,
      address: supAddress.trim() || undefined,
      dueAmount: 0,
      createdAt: new Date().toISOString().split('T')[0]
    };
    onSaveSupplier(newSup);
    setIsModalOpen(false);
    setSupName('');
    setCompanyName('');
    setSupPhone('');
    setSupEmail('');
    setSupAddress('');
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
            Supplier Directory & Payables Ledger
          </h2>
          <p className="text-xs text-slate-400">Manage vendor contact details, purchase history, and supplier payments</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs rounded-xl shadow-lg flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Add New Supplier
        </button>
      </div>

      <div className="bg-slate-900 border border-slate-800 p-3 rounded-2xl">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search supplier name or company..."
            className="w-full bg-slate-950 text-slate-200 text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-700/80 focus:outline-none"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredSuppliers.map((s) => (
          <div key={s.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-extrabold text-sm text-slate-100">{s.name}</h3>
                  <p className="text-[10px] text-indigo-400 font-bold">{s.companyName}</p>
                </div>
                {s.dueAmount > 0 ? (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                    Payable: {currency}{s.dueAmount.toFixed(2)}
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Settled
                  </span>
                )}
              </div>

              <div className="mt-2 space-y-1 text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-indigo-400" />
                  <span>{s.phone}</span>
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

            <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
              {s.dueAmount > 0 && (
                <button
                  onClick={() => {
                    setPaySupplierObj(s);
                    setPayAmount(s.dueAmount);
                  }}
                  className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs shadow"
                >
                  Pay Supplier
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* CREATE SUPPLIER MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl p-6">
            <div className="flex justify-between items-center pb-3 border-b border-slate-800 mb-4">
              <h3 className="text-base font-bold text-slate-100">Add Supplier Vendor</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSupplier} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 font-bold mb-1">Contact Name *</label>
                <input
                  type="text"
                  required
                  value={supName}
                  onChange={(e) => setSupName(e.target.value)}
                  placeholder="e.g. John Miller"
                  className="w-full bg-slate-950 text-slate-100 p-2.5 rounded-xl border border-slate-700"
                />
              </div>
              <div>
                <label className="block text-slate-400 font-bold mb-1">Company / Business Name</label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="e.g. Apex Global Supplies"
                  className="w-full bg-slate-950 text-slate-100 p-2.5 rounded-xl border border-slate-700"
                />
              </div>
              <div>
                <label className="block text-slate-400 font-bold mb-1">Phone *</label>
                <input
                  type="text"
                  required
                  value={supPhone}
                  onChange={(e) => setSupPhone(e.target.value)}
                  placeholder="+1 800-555-9000"
                  className="w-full bg-slate-950 text-slate-100 p-2.5 rounded-xl border border-slate-700"
                />
              </div>
              <div>
                <label className="block text-slate-400 font-bold mb-1">Email</label>
                <input
                  type="email"
                  value={supEmail}
                  onChange={(e) => setSupEmail(e.target.value)}
                  placeholder="orders@apex.com"
                  className="w-full bg-slate-950 text-slate-100 p-2.5 rounded-xl border border-slate-700"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-slate-800 text-slate-300 font-bold rounded-xl">
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-lg">
                  Save Supplier
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
              <h3 className="text-base font-bold text-slate-100">Pay Supplier Balance</h3>
              <button onClick={() => setPaySupplierObj(null)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handlePaySubmit} className="space-y-3 text-xs">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <div className="font-bold text-slate-200">{paySupplierObj.name} ({paySupplierObj.companyName})</div>
                <div className="text-[10px] text-rose-400 font-bold mt-0.5">Payable Balance Owed: {currency}{paySupplierObj.dueAmount.toFixed(2)}</div>
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">Payment Amount ({currency})</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={payAmount || ''}
                  onChange={(e) => setPayAmount(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-950 text-rose-400 font-bold p-2.5 rounded-xl border border-slate-700 text-sm"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">Payment Channel</label>
                <select
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value as PaymentMethod)}
                  className="w-full bg-slate-950 text-slate-100 p-2.5 rounded-xl border border-slate-700"
                >
                  <option value="Bank">Bank Wire Transfer</option>
                  <option value="Cash">Cash Out</option>
                  <option value="Mobile Banking">Mobile Banking</option>
                  <option value="Card">Corporate Card</option>
                </select>
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button type="button" onClick={() => setPaySupplierObj(null)} className="px-4 py-2 bg-slate-800 text-slate-300 font-bold rounded-xl">
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl shadow-lg">
                  Confirm Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
