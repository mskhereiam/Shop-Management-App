import React, { useState } from 'react';
import {
  Users,
  Plus,
  Search,
  Phone,
  Mail,
  MapPin,
  FileText,
  DollarSign,
  BookOpen,
  X,
  CheckCircle
} from 'lucide-react';
import { Customer, CustomerLedgerEntry, ShopSettings, PaymentMethod } from '../types';

interface CustomersViewProps {
  customers: Customer[];
  customerLedger: CustomerLedgerEntry[];
  settings: ShopSettings;
  onSaveCustomer: (c: Customer) => void;
  onReceiveCustomerPayment: (customerId: string, amount: number, method: PaymentMethod, note: string) => void;
}

export const CustomersView: React.FC<CustomersViewProps> = ({
  customers,
  customerLedger,
  settings,
  onSaveCustomer,
  onReceiveCustomerPayment
}) => {
  const currency = settings.currencySymbol || '৳';

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomerForLedger, setSelectedCustomerForLedger] = useState<Customer | null>(null);

  // Modal State for New Customer
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [custName, setCustName] = useState('');
  const [custPhone, setCustPhone] = useState('');
  const [custEmail, setCustEmail] = useState('');
  const [custAddress, setCustAddress] = useState('');

  // Payment Collector Modal State
  const [payModalCustomer, setPayModalCustomer] = useState<Customer | null>(null);
  const [payAmount, setPayAmount] = useState<number>(0);
  const [payMethod, setPayMethod] = useState<PaymentMethod>('Cash');
  const [payNote, setPayNote] = useState('');

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.includes(searchQuery) ||
      (c.email && c.email.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleCreateCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!custName.trim() || !custPhone.trim()) {
      alert('Name and Phone number are required.');
      return;
    }
    const newCust: Customer = {
      id: `cust-${Date.now()}`,
      name: custName.trim(),
      phone: custPhone.trim(),
      email: custEmail.trim() || undefined,
      address: custAddress.trim() || undefined,
      totalSpent: 0,
      dueAmount: 0,
      createdAt: new Date().toISOString().split('T')[0]
    };
    onSaveCustomer(newCust);
    setIsCustomerModalOpen(false);
    setCustName('');
    setCustPhone('');
    setCustEmail('');
    setCustAddress('');
  };

  const handleCollectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!payModalCustomer || payAmount <= 0) return;
    onReceiveCustomerPayment(payModalCustomer.id, payAmount, payMethod, payNote || 'Customer Due Collection');
    setPayModalCustomer(null);
    setPayAmount(0);
    setPayNote('');
  };

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-xl">
        <div>
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-400" />
            Customer Directory & Ledger Statements
          </h2>
          <p className="text-xs text-slate-400">Manage customer accounts, purchase history, and collect due payments</p>
        </div>
        <button
          onClick={() => setIsCustomerModalOpen(true)}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs rounded-xl shadow-lg flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Add New Customer
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
            placeholder="Search customer by name, phone, or email..."
            className="w-full bg-slate-950 text-slate-200 text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-700/80 focus:outline-none"
          />
        </div>
      </div>

      {/* Customer Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCustomers.map((c) => (
          <div
            key={c.id}
            className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-4 shadow-xl flex flex-col justify-between space-y-3"
          >
            <div>
              <div className="flex items-center justify-between">
                <h3 className="font-extrabold text-sm text-slate-100">{c.name}</h3>
                {c.dueAmount > 0 ? (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                    Due: {currency}{c.dueAmount.toFixed(2)}
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Clear Balance
                  </span>
                )}
              </div>

              <div className="mt-2 space-y-1 text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-indigo-400" />
                  <span>{c.phone}</span>
                </div>
                {c.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-slate-500" />
                    <span>{c.email}</span>
                  </div>
                )}
                {c.address && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-500" />
                    <span className="truncate">{c.address}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
              <div>
                <span className="text-[10px] text-slate-500 uppercase block font-semibold">Total Spent</span>
                <span className="font-extrabold text-emerald-400">{currency}{c.totalSpent.toFixed(2)}</span>
              </div>
              <div className="flex items-center gap-2">
                {c.dueAmount > 0 && (
                  <button
                    onClick={() => {
                      setPayModalCustomer(c);
                      setPayAmount(c.dueAmount);
                    }}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs shadow"
                  >
                    Receive Due
                  </button>
                )}
                <button
                  onClick={() => setSelectedCustomerForLedger(c)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs border border-slate-700"
                >
                  Ledger Statement
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* CREATE NEW CUSTOMER MODAL */}
      {isCustomerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl p-6">
            <div className="flex justify-between items-center pb-3 border-b border-slate-800 mb-4">
              <h3 className="text-base font-bold text-slate-100">Add New Customer</h3>
              <button onClick={() => setIsCustomerModalOpen(false)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCustomer} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 font-bold mb-1">Customer Name *</label>
                <input
                  type="text"
                  required
                  value={custName}
                  onChange={(e) => setCustName(e.target.value)}
                  placeholder="e.g. Robert Ford"
                  className="w-full bg-slate-950 text-slate-100 p-2.5 rounded-xl border border-slate-700"
                />
              </div>
              <div>
                <label className="block text-slate-400 font-bold mb-1">Phone Number *</label>
                <input
                  type="text"
                  required
                  value={custPhone}
                  onChange={(e) => setCustPhone(e.target.value)}
                  placeholder="+1 555-0102"
                  className="w-full bg-slate-950 text-slate-100 p-2.5 rounded-xl border border-slate-700"
                />
              </div>
              <div>
                <label className="block text-slate-400 font-bold mb-1">Email Address</label>
                <input
                  type="email"
                  value={custEmail}
                  onChange={(e) => setCustEmail(e.target.value)}
                  placeholder="robert@example.com"
                  className="w-full bg-slate-950 text-slate-100 p-2.5 rounded-xl border border-slate-700"
                />
              </div>
              <div>
                <label className="block text-slate-400 font-bold mb-1">Address</label>
                <input
                  type="text"
                  value={custAddress}
                  onChange={(e) => setCustAddress(e.target.value)}
                  placeholder="101 Commercial Street"
                  className="w-full bg-slate-950 text-slate-100 p-2.5 rounded-xl border border-slate-700"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCustomerModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-lg">
                  Save Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RECEIVE DUE PAYMENT MODAL */}
      {payModalCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl p-6">
            <div className="flex justify-between items-center pb-3 border-b border-slate-800 mb-4">
              <h3 className="text-base font-bold text-slate-100">Receive Customer Due Payment</h3>
              <button onClick={() => setPayModalCustomer(null)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCollectSubmit} className="space-y-3 text-xs">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <div className="font-bold text-slate-200">{payModalCustomer.name}</div>
                <div className="text-[10px] text-rose-400 font-bold mt-0.5">Current Outstanding Due: {currency}{payModalCustomer.dueAmount.toFixed(2)}</div>
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">Payment Amount Received ({currency})</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={payAmount || ''}
                  onChange={(e) => setPayAmount(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-950 text-emerald-400 font-bold p-2.5 rounded-xl border border-slate-700 text-sm"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">Payment Method</label>
                <select
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value as PaymentMethod)}
                  className="w-full bg-slate-950 text-slate-100 p-2.5 rounded-xl border border-slate-700"
                >
                  <option value="Cash">Cash</option>
                  <option value="Bank">Bank Wire</option>
                  <option value="Mobile Banking">Mobile Banking</option>
                  <option value="Card">Card</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">Note / Reference</label>
                <input
                  type="text"
                  value={payNote}
                  onChange={(e) => setPayNote(e.target.value)}
                  placeholder="Receipt # or Transaction Ref"
                  className="w-full bg-slate-950 text-slate-100 p-2.5 rounded-xl border border-slate-700"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setPayModalCustomer(null)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg">
                  Record Receipt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CUSTOMER LEDGER STATEMENT DRAWER */}
      {selectedCustomerForLedger && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg bg-slate-900 border-l border-slate-800 h-full p-6 overflow-y-auto space-y-4 custom-scrollbar">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-sm font-bold text-slate-100">Customer Ledger Statement</h3>
                <p className="text-xs text-indigo-400 font-bold">{selectedCustomerForLedger.name}</p>
              </div>
              <button onClick={() => setSelectedCustomerForLedger(null)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              {customerLedger
                .filter((cl) => cl.customerId === selectedCustomerForLedger.id)
                .map((cl) => (
                  <div key={cl.id} className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/50 text-xs space-y-1">
                    <div className="flex justify-between font-bold text-slate-200">
                      <span>{cl.type} ({cl.referenceNo})</span>
                      <span className="text-slate-400">{cl.date}</span>
                    </div>
                    <p className="text-[10px] text-slate-400">{cl.description}</p>
                    <div className="flex justify-between pt-1 font-mono text-[11px] border-t border-slate-800">
                      <span className="text-rose-400">Debit: +{currency}{cl.debit.toFixed(2)}</span>
                      <span className="text-emerald-400">Credit: -{currency}{cl.credit.toFixed(2)}</span>
                      <span className="text-slate-200 font-bold">Due Balance: {currency}{cl.balance.toFixed(2)}</span>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
