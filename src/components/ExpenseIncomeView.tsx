import React, { useState } from 'react';
import {
  Receipt,
  Plus,
  TrendingDown,
  TrendingUp,
  X,
  Edit,
  Trash2,
  Calendar,
  Save,
  Search,
  CheckCircle2
} from 'lucide-react';
import { Expense, Income, ExpenseCategory, IncomeCategory, ShopSettings, PaymentMethod } from '../types';
import { ConfirmDialog } from './ConfirmDialog';

interface ExpenseIncomeViewProps {
  expenses: Expense[];
  incomes: Income[];
  expenseCats: ExpenseCategory[];
  incomeCats: IncomeCategory[];
  settings: ShopSettings;
  onAddExpense: (e: Expense) => void;
  onAddIncome: (i: Income) => void;
  onUpdateExpense?: (e: Expense) => void;
  onDeleteExpense?: (id: string) => void;
  onUpdateIncome?: (i: Income) => void;
  onDeleteIncome?: (id: string) => void;
  initialType?: 'expense' | 'income';
}

export const ExpenseIncomeView: React.FC<ExpenseIncomeViewProps> = ({
  expenses,
  incomes,
  expenseCats,
  incomeCats,
  settings,
  onAddExpense,
  onAddIncome,
  onUpdateExpense,
  onDeleteExpense,
  onUpdateIncome,
  onDeleteIncome,
  initialType = 'expense'
}) => {
  const currency = settings.currencySymbol || '৳';

  const [activeTab, setActiveTab] = useState<'expense' | 'income'>(initialType);
  const [searchQuery, setSearchQuery] = useState('');

  React.useEffect(() => {
    setActiveTab(initialType);
  }, [initialType]);

  // Modal State for New Expense
  const [isExpModalOpen, setIsExpModalOpen] = useState(false);
  const [expTitle, setExpTitle] = useState('');
  const [expAmount, setExpAmount] = useState<number>(0);
  const [expCustomCategory, setExpCustomCategory] = useState('');
  const [expMethod, setExpMethod] = useState<PaymentMethod>('Cash');
  const [expNotes, setExpNotes] = useState('');
  const [expDate, setExpDate] = useState(new Date().toISOString().split('T')[0]);

  // Modal State for New Income
  const [isIncModalOpen, setIsIncModalOpen] = useState(false);
  const [incTitle, setIncTitle] = useState('');
  const [incAmount, setIncAmount] = useState<number>(0);
  const [incCustomCategory, setIncCustomCategory] = useState('');
  const [incMethod, setIncMethod] = useState<PaymentMethod>('Bank');
  const [incDate, setIncDate] = useState(new Date().toISOString().split('T')[0]);

  // Edit Expense State
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [editExpTitle, setEditExpTitle] = useState('');
  const [editExpCategory, setEditExpCategory] = useState('');
  const [editExpAmount, setEditExpAmount] = useState<number>(0);
  const [editExpMethod, setEditExpMethod] = useState<PaymentMethod>('Cash');
  const [editExpDate, setEditExpDate] = useState('');
  const [editExpNotes, setEditExpNotes] = useState('');

  // Edit Income State
  const [editingIncome, setEditingIncome] = useState<Income | null>(null);
  const [editIncTitle, setEditIncTitle] = useState('');
  const [editIncCategory, setEditIncCategory] = useState('');
  const [editIncAmount, setEditIncAmount] = useState<number>(0);
  const [editIncMethod, setEditIncMethod] = useState<PaymentMethod>('Bank');
  const [editIncDate, setEditIncDate] = useState('');

  // Delete State
  const [deletingExpense, setDeletingExpense] = useState<Expense | null>(null);
  const [deletingIncome, setDeletingIncome] = useState<Income | null>(null);

  const handleExpenseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!expTitle.trim() || expAmount <= 0) return;
    const catName = expCustomCategory.trim() || 'General Expense';
    const newExp: Expense = {
      id: `exp-${Date.now()}`,
      categoryId: `cat-${catName.toLowerCase().replace(/\s+/g, '-')}`,
      categoryName: catName,
      title: expTitle.trim(),
      amount: expAmount,
      date: expDate || new Date().toISOString().split('T')[0],
      paymentMethod: expMethod,
      notes: expNotes,
      createdBy: 'Admin Cashier'
    };
    onAddExpense(newExp);
    setIsExpModalOpen(false);
    setExpTitle('');
    setExpCustomCategory('');
    setExpAmount(0);
    setExpNotes('');
    setExpDate(new Date().toISOString().split('T')[0]);
  };

  const handleIncomeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!incTitle.trim() || incAmount <= 0) return;
    const catName = incCustomCategory.trim() || 'Misc Revenue';
    const newInc: Income = {
      id: `inc-${Date.now()}`,
      categoryId: `cat-${catName.toLowerCase().replace(/\s+/g, '-')}`,
      categoryName: catName,
      title: incTitle.trim(),
      amount: incAmount,
      date: incDate || new Date().toISOString().split('T')[0],
      paymentMethod: incMethod,
      createdBy: 'Admin Cashier'
    };
    onAddIncome(newInc);
    setIsIncModalOpen(false);
    setIncTitle('');
    setIncCustomCategory('');
    setIncAmount(0);
    setIncDate(new Date().toISOString().split('T')[0]);
  };

  // Open Edit Expense
  const handleOpenEditExpense = (e: Expense) => {
    setEditingExpense(e);
    setEditExpTitle(e.title);
    setEditExpCategory(e.categoryName);
    setEditExpAmount(e.amount);
    setEditExpMethod(e.paymentMethod);
    setEditExpDate(e.date);
    setEditExpNotes(e.notes || '');
  };

  const handleSaveEditExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingExpense || !editExpTitle.trim() || editExpAmount <= 0) return;

    const catName = editExpCategory.trim() || 'General Expense';
    const updated: Expense = {
      ...editingExpense,
      title: editExpTitle.trim(),
      categoryName: catName,
      categoryId: `cat-${catName.toLowerCase().replace(/\s+/g, '-')}`,
      amount: editExpAmount,
      date: editExpDate,
      paymentMethod: editExpMethod,
      notes: editExpNotes
    };

    if (onUpdateExpense) {
      onUpdateExpense(updated);
    }
    setEditingExpense(null);
  };

  // Open Edit Income
  const handleOpenEditIncome = (i: Income) => {
    setEditingIncome(i);
    setEditIncTitle(i.title);
    setEditIncCategory(i.categoryName);
    setEditIncAmount(i.amount);
    setEditIncMethod(i.paymentMethod);
    setEditIncDate(i.date);
  };

  const handleSaveEditIncome = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingIncome || !editIncTitle.trim() || editIncAmount <= 0) return;

    const catName = editIncCategory.trim() || 'Misc Revenue';
    const updated: Income = {
      ...editingIncome,
      title: editIncTitle.trim(),
      categoryName: catName,
      categoryId: `cat-${catName.toLowerCase().replace(/\s+/g, '-')}`,
      amount: editIncAmount,
      date: editIncDate,
      paymentMethod: editIncMethod
    };

    if (onUpdateIncome) {
      onUpdateIncome(updated);
    }
    setEditingIncome(null);
  };

  const ENGLISH_MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const [selectedPeriod, setSelectedPeriod] = useState<'daily' | 'weekly' | 'monthly' | 'yearly' | 'lifetime'>('monthly');
  const [selectedEnglishMonth, setSelectedEnglishMonth] = useState<number | 'all'>(new Date().getMonth());
  const [selectedEnglishYear, setSelectedEnglishYear] = useState<number>(new Date().getFullYear());

  const filterByPeriod = (dateStr: string) => {
    if (selectedPeriod === 'lifetime') return true;
    if (!dateStr) return false;

    const d = new Date(dateStr);
    const now = new Date();
    if (isNaN(d.getTime())) return false;

    if (selectedPeriod === 'daily') {
      return (
        d.getDate() === now.getDate() &&
        d.getMonth() === now.getMonth() &&
        d.getFullYear() === now.getFullYear()
      );
    }

    if (selectedPeriod === 'weekly') {
      const diffTime = Math.abs(now.getTime() - d.getTime());
      const diffDays = diffTime / (1000 * 60 * 60 * 24);
      return diffDays <= 7;
    }

    if (selectedPeriod === 'monthly') {
      if (selectedEnglishMonth === 'all') {
        return d.getFullYear() === selectedEnglishYear;
      }
      return d.getMonth() === selectedEnglishMonth && d.getFullYear() === selectedEnglishYear;
    }

    if (selectedPeriod === 'yearly') {
      return d.getFullYear() === selectedEnglishYear;
    }

    return true;
  };

  const q = searchQuery.toLowerCase().trim();

  const filteredExpenses = expenses
    .filter((e) => filterByPeriod(e.date))
    .filter((e) => !q || e.title.toLowerCase().includes(q) || e.categoryName.toLowerCase().includes(q));

  const filteredIncomes = incomes
    .filter((i) => filterByPeriod(i.date))
    .filter((i) => !q || i.title.toLowerCase().includes(q) || i.categoryName.toLowerCase().includes(q));

  const totalFilteredExpense = filteredExpenses.reduce((a, e) => a + e.amount, 0);
  const totalFilteredIncome = filteredIncomes.reduce((a, i) => a + i.amount, 0);

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Header & Period Selector */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-xl">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setActiveTab('expense')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'expense' ? 'bg-rose-600 text-white shadow-md' : 'bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            দোকানের যাবতীয় খরচ / ব্যয় ({expenses.length})
          </button>
          <button
            onClick={() => setActiveTab('income')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'income' ? 'bg-emerald-600 text-white shadow-md' : 'bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            অন্যান্য আয় / রেভিনিউ ({incomes.length})
          </button>
        </div>

        {/* Time Period Pills & English Month Selectors */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex flex-wrap items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
            {[
              { id: 'daily', label: 'দৈনিক' },
              { id: 'weekly', label: 'সাপ্তাহিক' },
              { id: 'monthly', label: 'মাসিক' },
              { id: 'yearly', label: 'বাৎসরিক' },
              { id: 'lifetime', label: 'সব সময়' }
            ].map((p) => (
              <button
                key={p.id}
                onClick={() => setSelectedPeriod(p.id as any)}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  selectedPeriod === p.id
                    ? 'bg-indigo-600 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-400 font-bold px-1 uppercase">মাস:</span>
            <select
              value={selectedEnglishMonth}
              onChange={(e) => {
                const val = e.target.value;
                setSelectedEnglishMonth(val === 'all' ? 'all' : parseInt(val));
                setSelectedPeriod('monthly');
              }}
              className="bg-slate-900 text-slate-100 text-xs font-bold px-2 py-1 rounded-lg border border-slate-700 focus:outline-none focus:border-indigo-500"
            >
              <option value="all">সকল মাস</option>
              {ENGLISH_MONTHS.map((m, idx) => (
                <option key={m} value={idx}>{m}</option>
              ))}
            </select>

            <select
              value={selectedEnglishYear}
              onChange={(e) => {
                setSelectedEnglishYear(parseInt(e.target.value));
                setSelectedPeriod('monthly');
              }}
              className="bg-slate-900 text-slate-100 text-xs font-bold px-2 py-1 rounded-lg border border-slate-700 focus:outline-none focus:border-indigo-500"
            >
              {[2024, 2025, 2026, 2027, 2028].map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>

        {activeTab === 'expense' ? (
          <button
            onClick={() => setIsExpModalOpen(true)}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl shadow-lg flex items-center gap-2 self-stretch sm:self-auto justify-center"
          >
            <Plus className="w-4 h-4" /> নতুন খরচ যোগ করুন
          </button>
        ) : (
          <button
            onClick={() => setIsIncModalOpen(true)}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg flex items-center gap-2 self-stretch sm:self-auto justify-center"
          >
            <Plus className="w-4 h-4" /> নতুন আয় যোগ করুন
          </button>
        )}
      </div>

      {/* Summary KPI Banner for Selected Period */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl">
          <div className="flex justify-between items-center text-slate-400 text-xs font-bold">
            <span>মোট খরচ (Total Expense)</span>
            <TrendingDown className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-xl font-black text-rose-400 mt-2 font-mono">
            {currency}{totalFilteredExpense.toFixed(2)}
          </div>
          <div className="text-[10px] text-slate-500 mt-1">
            {filteredExpenses.length} টি রেকর্ড ({selectedPeriod})
          </div>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl">
          <div className="flex justify-between items-center text-slate-400 text-xs font-bold">
            <span>মোট বিবিধ আয় (Misc Income)</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl font-black text-emerald-400 mt-2 font-mono">
            {currency}{totalFilteredIncome.toFixed(2)}
          </div>
          <div className="text-[10px] text-slate-500 mt-1">
            {filteredIncomes.length} টি রেকর্ড ({selectedPeriod})
          </div>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl">
          <div className="flex justify-between items-center text-slate-400 text-xs font-bold">
            <span>নেট পার্থক্য (Net Balance)</span>
            <Receipt className="w-4 h-4 text-indigo-400" />
          </div>
          <div className={`text-xl font-black mt-2 font-mono ${
            totalFilteredIncome - totalFilteredExpense >= 0 ? 'text-emerald-400' : 'text-amber-400'
          }`}>
            {currency}{(totalFilteredIncome - totalFilteredExpense).toFixed(2)}
          </div>
          <div className="text-[10px] text-slate-500 mt-1">
            আয় মাইনাস ব্যয় ({selectedPeriod})
          </div>
        </div>
      </div>

      {/* Search Input */}
      <div className="bg-slate-900 border border-slate-800 p-3 rounded-2xl">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={activeTab === 'expense' ? "খরচের বিবরণ বা ক্যাটাগরি দিয়ে খুঁজুন..." : "আয়ের বিবরণ বা ক্যাটাগরি দিয়ে খুঁজুন..."}
            className="w-full bg-slate-950 text-slate-100 text-xs pl-9 pr-4 py-2 rounded-xl border border-slate-700 focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Expenses Table */}
      {activeTab === 'expense' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-950 text-slate-400 font-bold border-b border-slate-800 uppercase tracking-wider">
                <th className="p-3.5">খরচের বিবরণ</th>
                <th className="p-3.5">ক্যাটাগরি</th>
                <th className="p-3.5">তারিখ</th>
                <th className="p-3.5">মাধ্যম</th>
                <th className="p-3.5 text-right">পরিমাণ</th>
                <th className="p-3.5 text-right">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-200">
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">
                    কোনো খরচের রেকর্ড পাওয়া যায়নি।
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((e) => (
                  <tr key={e.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-3.5">
                      <div className="font-bold text-slate-100">{e.title}</div>
                      {e.notes && <div className="text-[10px] text-slate-400">{e.notes}</div>}
                    </td>
                    <td className="p-3.5">
                      <span className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-300 font-bold text-[10px] border border-rose-500/20">
                        {e.categoryName}
                      </span>
                    </td>
                    <td className="p-3.5 text-slate-400 font-mono">{e.date}</td>
                    <td className="p-3.5 text-slate-300 font-semibold">{e.paymentMethod}</td>
                    <td className="p-3.5 text-right font-black text-rose-400 font-mono">-{currency}{e.amount.toFixed(2)}</td>
                    <td className="p-3.5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        {onUpdateExpense && (
                          <button
                            onClick={() => handleOpenEditExpense(e)}
                            className="p-1.5 bg-blue-600/20 hover:bg-blue-600 text-blue-300 hover:text-white rounded-lg transition-colors"
                            title="খরচ এডিট করুন"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {onDeleteExpense && (
                          <button
                            onClick={() => setDeletingExpense(e)}
                            className="p-1.5 bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white rounded-lg transition-colors"
                            title="খরচ মুছুন"
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
      )}

      {/* Incomes Table */}
      {activeTab === 'income' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-950 text-slate-400 font-bold border-b border-slate-800 uppercase tracking-wider">
                <th className="p-3.5">আয়ের বিবরণ</th>
                <th className="p-3.5">ক্যাটাগরি</th>
                <th className="p-3.5">তারিখ</th>
                <th className="p-3.5">মাধ্যম</th>
                <th className="p-3.5 text-right">পরিমাণ</th>
                <th className="p-3.5 text-right">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-200">
              {filteredIncomes.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">
                    কোনো আয়ের রেকর্ড পাওয়া যায়নি।
                  </td>
                </tr>
              ) : (
                filteredIncomes.map((i) => (
                  <tr key={i.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-3.5 font-bold text-slate-100">{i.title}</td>
                    <td className="p-3.5">
                      <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 font-bold text-[10px] border border-emerald-500/20">
                        {i.categoryName}
                      </span>
                    </td>
                    <td className="p-3.5 text-slate-400 font-mono">{i.date}</td>
                    <td className="p-3.5 text-slate-300 font-semibold">{i.paymentMethod}</td>
                    <td className="p-3.5 text-right font-black text-emerald-400 font-mono">+{currency}{i.amount.toFixed(2)}</td>
                    <td className="p-3.5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        {onUpdateIncome && (
                          <button
                            onClick={() => handleOpenEditIncome(i)}
                            className="p-1.5 bg-blue-600/20 hover:bg-blue-600 text-blue-300 hover:text-white rounded-lg transition-colors"
                            title="আয় এডিট করুন"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {onDeleteIncome && (
                          <button
                            onClick={() => setDeletingIncome(i)}
                            className="p-1.5 bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white rounded-lg transition-colors"
                            title="আয় মুছুন"
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
      )}

      {/* NEW EXPENSE MODAL */}
      {isExpModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl p-6">
            <h3 className="text-base font-bold text-slate-100 mb-4">নতুন দোকান খরচ রেকর্ড করুন</h3>
            <form onSubmit={handleExpenseSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 font-bold mb-1">খরচের নাম / বিবরণ *</label>
                <input
                  type="text"
                  required
                  value={expTitle}
                  onChange={(e) => setExpTitle(e.target.value)}
                  placeholder="যেমন: দোকান ভাড়া, কারেন্ট বিল, নাস্তা"
                  className="w-full bg-slate-950 text-slate-100 p-2.5 rounded-xl border border-slate-700"
                />
              </div>
              <div>
                <label className="block text-slate-400 font-bold mb-1">ক্যাটাগরি</label>
                <input
                  type="text"
                  value={expCustomCategory}
                  onChange={(e) => setExpCustomCategory(e.target.value)}
                  placeholder="যেমন: Utility, Shop Rent, Snacks, Salary..."
                  list="expense-category-suggestions"
                  className="w-full bg-slate-950 text-slate-100 p-2.5 rounded-xl border border-slate-700 focus:border-rose-500 focus:outline-none"
                />
                <datalist id="expense-category-suggestions">
                  {expenseCats.map((c) => (
                    <option key={c.id} value={c.name} />
                  ))}
                  <option value="Electricity Bill" />
                  <option value="Shop Rent" />
                  <option value="Staff Salary" />
                  <option value="Tea & Snacks" />
                  <option value="Transport & Freight" />
                  <option value="Maintenance & Repair" />
                  <option value="Internet & Mobile" />
                </datalist>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">পরিমাণ ({currency}) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={expAmount || ''}
                    onChange={(e) => setExpAmount(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-950 text-rose-400 font-bold text-sm p-2.5 rounded-xl border border-slate-700 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-bold mb-1">তারিখ</label>
                  <input
                    type="date"
                    value={expDate}
                    onChange={(e) => setExpDate(e.target.value)}
                    className="w-full bg-slate-950 text-slate-100 p-2.5 rounded-xl border border-slate-700 font-mono"
                  />
                </div>
              </div>
              <div>
                <label className="block text-slate-400 font-bold mb-1">পেমেন্ট মাধ্যম</label>
                <select
                  value={expMethod}
                  onChange={(e) => setExpMethod(e.target.value as PaymentMethod)}
                  className="w-full bg-slate-950 text-slate-100 p-2.5 rounded-xl border border-slate-700 font-semibold"
                >
                  <option value="Cash">ক্যাশ (Cash)</option>
                  <option value="Bank">ব্যাংক (Bank Wire)</option>
                  <option value="Mobile Banking">মোবাইল ব্যাংকিং (bKash/Nagad)</option>
                  <option value="Card">কার্ড (Card)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">নোট / মন্তব্য</label>
                <input
                  type="text"
                  value={expNotes}
                  onChange={(e) => setExpNotes(e.target.value)}
                  placeholder="অতিরিক্ত কোনো বিবরণ..."
                  className="w-full bg-slate-950 text-slate-100 p-2.5 rounded-xl border border-slate-700"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button type="button" onClick={() => setIsExpModalOpen(false)} className="px-4 py-2 bg-slate-800 text-slate-300 font-bold rounded-xl">
                  বাতিল
                </button>
                <button type="submit" className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl shadow-lg">
                  খরচ সংরক্ষণ করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT EXPENSE MODAL */}
      {editingExpense && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Edit className="w-4 h-4 text-blue-400" /> খরচ এডিট করুন
              </h3>
              <button onClick={() => setEditingExpense(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleSaveEditExpense} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 font-bold mb-1">খরচের নাম / বিবরণ *</label>
                <input
                  type="text"
                  required
                  value={editExpTitle}
                  onChange={(e) => setEditExpTitle(e.target.value)}
                  className="w-full bg-slate-950 text-slate-100 p-2.5 rounded-xl border border-slate-700 font-semibold"
                />
              </div>
              <div>
                <label className="block text-slate-400 font-bold mb-1">ক্যাটাগরি</label>
                <input
                  type="text"
                  value={editExpCategory}
                  onChange={(e) => setEditExpCategory(e.target.value)}
                  list="expense-category-suggestions"
                  className="w-full bg-slate-950 text-slate-100 p-2.5 rounded-xl border border-slate-700"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">পরিমাণ ({currency}) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={editExpAmount}
                    onChange={(e) => setEditExpAmount(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-950 text-rose-400 font-bold text-sm p-2.5 rounded-xl border border-slate-700 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-bold mb-1">তারিখ</label>
                  <input
                    type="date"
                    value={editExpDate}
                    onChange={(e) => setEditExpDate(e.target.value)}
                    className="w-full bg-slate-950 text-slate-100 p-2.5 rounded-xl border border-slate-700 font-mono"
                  />
                </div>
              </div>
              <div>
                <label className="block text-slate-400 font-bold mb-1">পেমেন্ট মাধ্যম</label>
                <select
                  value={editExpMethod}
                  onChange={(e) => setEditExpMethod(e.target.value as PaymentMethod)}
                  className="w-full bg-slate-950 text-slate-100 p-2.5 rounded-xl border border-slate-700 font-semibold"
                >
                  <option value="Cash">ক্যাশ (Cash)</option>
                  <option value="Bank">ব্যাংক (Bank Wire)</option>
                  <option value="Mobile Banking">মোবাইল ব্যাংকিং</option>
                  <option value="Card">কার্ড (Card)</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-400 font-bold mb-1">মন্তব্য</label>
                <input
                  type="text"
                  value={editExpNotes}
                  onChange={(e) => setEditExpNotes(e.target.value)}
                  className="w-full bg-slate-950 text-slate-100 p-2.5 rounded-xl border border-slate-700"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button type="button" onClick={() => setEditingExpense(null)} className="px-4 py-2 bg-slate-800 text-slate-300 font-bold rounded-xl">
                  বাতিল
                </button>
                <button type="submit" className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg flex items-center gap-1.5">
                  <Save className="w-4 h-4" /> আপডেট সংরক্ষণ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* NEW INCOME MODAL */}
      {isIncModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl p-6">
            <h3 className="text-base font-bold text-slate-100 mb-4">অন্যান্য বিবিধ আয় যোগ করুন</h3>
            <form onSubmit={handleIncomeSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 font-bold mb-1">আয়ের নাম / বিবরণ *</label>
                <input
                  type="text"
                  required
                  value={incTitle}
                  onChange={(e) => setIncTitle(e.target.value)}
                  placeholder="যেমন: কার্টুন স্ক্র্যাপ বিক্রি, ডেলিভারি ফি"
                  className="w-full bg-slate-950 text-slate-100 p-2.5 rounded-xl border border-slate-700"
                />
              </div>
              <div>
                <label className="block text-slate-400 font-bold mb-1">ক্যাটাগরি</label>
                <input
                  type="text"
                  value={incCustomCategory}
                  onChange={(e) => setIncCustomCategory(e.target.value)}
                  placeholder="যেমন: Scrap Sale, Rebate, Commission..."
                  list="income-category-suggestions"
                  className="w-full bg-slate-950 text-slate-100 p-2.5 rounded-xl border border-slate-700 focus:border-emerald-500 focus:outline-none"
                />
                <datalist id="income-category-suggestions">
                  {incomeCats.map((c) => (
                    <option key={c.id} value={c.name} />
                  ))}
                  <option value="Scrap Sale" />
                  <option value="Rebate & Discount" />
                  <option value="Commission Income" />
                  <option value="Delivery Fee Revenue" />
                  <option value="Bank Interest" />
                  <option value="Other Misc Revenue" />
                </datalist>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">পরিমাণ ({currency}) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={incAmount || ''}
                    onChange={(e) => setIncAmount(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-950 text-emerald-400 font-bold text-sm p-2.5 rounded-xl border border-slate-700 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-bold mb-1">তারিখ</label>
                  <input
                    type="date"
                    value={incDate}
                    onChange={(e) => setIncDate(e.target.value)}
                    className="w-full bg-slate-950 text-slate-100 p-2.5 rounded-xl border border-slate-700 font-mono"
                  />
                </div>
              </div>
              <div>
                <label className="block text-slate-400 font-bold mb-1">পেমেন্ট মাধ্যম</label>
                <select
                  value={incMethod}
                  onChange={(e) => setIncMethod(e.target.value as PaymentMethod)}
                  className="w-full bg-slate-950 text-slate-100 p-2.5 rounded-xl border border-slate-700 font-semibold"
                >
                  <option value="Cash">ক্যাশ (Cash)</option>
                  <option value="Bank">ব্যাংক (Bank)</option>
                  <option value="Mobile Banking">মোবাইল ব্যাংকিং</option>
                  <option value="Card">কার্ড (Card)</option>
                </select>
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button type="button" onClick={() => setIsIncModalOpen(false)} className="px-4 py-2 bg-slate-800 text-slate-300 font-bold rounded-xl">
                  বাতিল
                </button>
                <button type="submit" className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg">
                  আয় সংরক্ষণ করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT INCOME MODAL */}
      {editingIncome && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Edit className="w-4 h-4 text-blue-400" /> আয় এডিট করুন
              </h3>
              <button onClick={() => setEditingIncome(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleSaveEditIncome} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 font-bold mb-1">আয়ের নাম / বিবরণ *</label>
                <input
                  type="text"
                  required
                  value={editIncTitle}
                  onChange={(e) => setEditIncTitle(e.target.value)}
                  className="w-full bg-slate-950 text-slate-100 p-2.5 rounded-xl border border-slate-700 font-semibold"
                />
              </div>
              <div>
                <label className="block text-slate-400 font-bold mb-1">ক্যাটাগরি</label>
                <input
                  type="text"
                  value={editIncCategory}
                  onChange={(e) => setEditIncCategory(e.target.value)}
                  list="income-category-suggestions"
                  className="w-full bg-slate-950 text-slate-100 p-2.5 rounded-xl border border-slate-700"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">পরিমাণ ({currency}) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={editIncAmount}
                    onChange={(e) => setEditIncAmount(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-950 text-emerald-400 font-bold text-sm p-2.5 rounded-xl border border-slate-700 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-bold mb-1">তারিখ</label>
                  <input
                    type="date"
                    value={editIncDate}
                    onChange={(e) => setEditIncDate(e.target.value)}
                    className="w-full bg-slate-950 text-slate-100 p-2.5 rounded-xl border border-slate-700 font-mono"
                  />
                </div>
              </div>
              <div>
                <label className="block text-slate-400 font-bold mb-1">পেমেন্ট মাধ্যম</label>
                <select
                  value={editIncMethod}
                  onChange={(e) => setEditIncMethod(e.target.value as PaymentMethod)}
                  className="w-full bg-slate-950 text-slate-100 p-2.5 rounded-xl border border-slate-700 font-semibold"
                >
                  <option value="Cash">ক্যাশ (Cash)</option>
                  <option value="Bank">ব্যাংক (Bank)</option>
                  <option value="Mobile Banking">মোবাইল ব্যাংকিং</option>
                  <option value="Card">কার্ড (Card)</option>
                </select>
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button type="button" onClick={() => setEditingIncome(null)} className="px-4 py-2 bg-slate-800 text-slate-300 font-bold rounded-xl">
                  বাতিল
                </button>
                <button type="submit" className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg flex items-center gap-1.5">
                  <Save className="w-4 h-4" /> আপডেট সংরক্ষণ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Expense Dialog */}
      <ConfirmDialog
        isOpen={!!deletingExpense}
        title="খরচের রেকর্ড মুছে ফেলতে চান?"
        message={`আপনি কি "${deletingExpense?.title}" (${currency}${deletingExpense?.amount.toFixed(2)}) নিশ্চিতভাবে মুছে ফেলতে চান?`}
        confirmLabel="হ্যাঁ, মুছুন"
        cancelLabel="না, বাতিল"
        variant="danger"
        onConfirm={() => {
          if (deletingExpense && onDeleteExpense) {
            onDeleteExpense(deletingExpense.id);
          }
          setDeletingExpense(null);
        }}
        onCancel={() => setDeletingExpense(null)}
      />

      {/* Delete Income Dialog */}
      <ConfirmDialog
        isOpen={!!deletingIncome}
        title="আয়ের রেকর্ড মুছে ফেলতে চান?"
        message={`আপনি কি "${deletingIncome?.title}" (${currency}${deletingIncome?.amount.toFixed(2)}) নিশ্চিতভাবে মুছে ফেলতে চান?`}
        confirmLabel="হ্যাঁ, মুছুন"
        cancelLabel="না, বাতিল"
        variant="danger"
        onConfirm={() => {
          if (deletingIncome && onDeleteIncome) {
            onDeleteIncome(deletingIncome.id);
          }
          setDeletingIncome(null);
        }}
        onCancel={() => setDeletingIncome(null)}
      />
    </div>
  );
};
