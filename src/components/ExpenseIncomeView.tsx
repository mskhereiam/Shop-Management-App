import React, { useState } from 'react';
import { Receipt, Plus, TrendingDown, TrendingUp, X } from 'lucide-react';
import { Expense, Income, ExpenseCategory, IncomeCategory, ShopSettings, PaymentMethod } from '../types';

interface ExpenseIncomeViewProps {
  expenses: Expense[];
  incomes: Income[];
  expenseCats: ExpenseCategory[];
  incomeCats: IncomeCategory[];
  settings: ShopSettings;
  onAddExpense: (e: Expense) => void;
  onAddIncome: (i: Income) => void;
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
  initialType = 'expense'
}) => {
  const currency = settings.currencySymbol || '৳';

  const [activeTab, setActiveTab] = useState<'expense' | 'income'>(initialType);

  React.useEffect(() => {
    setActiveTab(initialType);
  }, [initialType]);

  // Modal State for Expense
  const [isExpModalOpen, setIsExpModalOpen] = useState(false);
  const [expTitle, setExpTitle] = useState('');
  const [expAmount, setExpAmount] = useState<number>(0);
  const [expCustomCategory, setExpCustomCategory] = useState('');
  const [expMethod, setExpMethod] = useState<PaymentMethod>('Cash');
  const [expNotes, setExpNotes] = useState('');

  // Modal State for Income
  const [isIncModalOpen, setIsIncModalOpen] = useState(false);
  const [incTitle, setIncTitle] = useState('');
  const [incAmount, setIncAmount] = useState<number>(0);
  const [incCustomCategory, setIncCustomCategory] = useState('');
  const [incMethod, setIncMethod] = useState<PaymentMethod>('Bank');

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
      date: new Date().toISOString().split('T')[0],
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
      date: new Date().toISOString().split('T')[0],
      paymentMethod: incMethod,
      createdBy: 'Admin Cashier'
    };
    onAddIncome(newInc);
    setIsIncModalOpen(false);
    setIncTitle('');
    setIncCustomCategory('');
    setIncAmount(0);
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

  const filteredExpenses = expenses.filter((e) => filterByPeriod(e.date));
  const filteredIncomes = incomes.filter((i) => filterByPeriod(i.date));

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
            Other Expenses ({expenses.length})
          </button>
          <button
            onClick={() => setActiveTab('income')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'income' ? 'bg-emerald-600 text-white shadow-md' : 'bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            Other Income ({incomes.length})
          </button>
        </div>

        {/* Time Period Pills & English Month Selectors */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex flex-wrap items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
            {[
              { id: 'daily', label: 'Daily' },
              { id: 'weekly', label: 'Weekly' },
              { id: 'monthly', label: 'Monthly' },
              { id: 'yearly', label: 'Yearly' },
              { id: 'lifetime', label: 'Lifetime' }
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
            <span className="text-[10px] text-slate-400 font-bold px-1 uppercase">Month:</span>
            <select
              value={selectedEnglishMonth}
              onChange={(e) => {
                const val = e.target.value;
                setSelectedEnglishMonth(val === 'all' ? 'all' : parseInt(val));
                setSelectedPeriod('monthly');
              }}
              className="bg-slate-900 text-slate-100 text-xs font-bold px-2 py-1 rounded-lg border border-slate-700 focus:outline-none focus:border-indigo-500"
            >
              <option value="all">All Months</option>
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
            className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl shadow-lg flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Record New Expense
          </button>
        ) : (
          <button
            onClick={() => setIsIncModalOpen(true)}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Record Misc Income
          </button>
        )}
      </div>

      {/* Summary KPI Banner for Selected Period */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl">
          <div className="flex justify-between items-center text-slate-400 text-xs font-bold">
            <span>Total Expense</span>
            <TrendingDown className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-xl font-black text-rose-400 mt-2">
            {currency}{totalFilteredExpense.toFixed(2)}
          </div>
          <div className="text-[10px] text-slate-500 mt-1">
            {filteredExpenses.length} Records ({selectedPeriod})
          </div>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl">
          <div className="flex justify-between items-center text-slate-400 text-xs font-bold">
            <span>Total Misc Income</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl font-black text-emerald-400 mt-2">
            {currency}{totalFilteredIncome.toFixed(2)}
          </div>
          <div className="text-[10px] text-slate-500 mt-1">
            {filteredIncomes.length} Records ({selectedPeriod})
          </div>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl">
          <div className="flex justify-between items-center text-slate-400 text-xs font-bold">
            <span>Net Difference</span>
            <Receipt className="w-4 h-4 text-indigo-400" />
          </div>
          <div className={`text-xl font-black mt-2 ${
            totalFilteredIncome - totalFilteredExpense >= 0 ? 'text-emerald-400' : 'text-amber-400'
          }`}>
            {currency}{(totalFilteredIncome - totalFilteredExpense).toFixed(2)}
          </div>
          <div className="text-[10px] text-slate-500 mt-1">
            Income minus Expense ({selectedPeriod})
          </div>
        </div>
      </div>

      {activeTab === 'expense' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-950 text-slate-400 font-bold border-b border-slate-800 uppercase">
                <th className="p-3.5">Expense Title</th>
                <th className="p-3.5">Category</th>
                <th className="p-3.5">Date</th>
                <th className="p-3.5">Method</th>
                <th className="p-3.5 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-200">
              {expenses.map((e) => (
                <tr key={e.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="p-3.5 font-bold text-slate-100">{e.title}</td>
                  <td className="p-3.5">
                    <span className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-300 font-bold text-[10px]">
                      {e.categoryName}
                    </span>
                  </td>
                  <td className="p-3.5 text-slate-400">{e.date}</td>
                  <td className="p-3.5 text-slate-300 font-semibold">{e.paymentMethod}</td>
                  <td className="p-3.5 text-right font-black text-rose-400">-{currency}{e.amount.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'income' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-950 text-slate-400 font-bold border-b border-slate-800 uppercase">
                <th className="p-3.5">Income Description</th>
                <th className="p-3.5">Category</th>
                <th className="p-3.5">Date</th>
                <th className="p-3.5">Method</th>
                <th className="p-3.5 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-200">
              {incomes.map((i) => (
                <tr key={i.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="p-3.5 font-bold text-slate-100">{i.title}</td>
                  <td className="p-3.5">
                    <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 font-bold text-[10px]">
                      {i.categoryName}
                    </span>
                  </td>
                  <td className="p-3.5 text-slate-400">{i.date}</td>
                  <td className="p-3.5 text-slate-300 font-semibold">{i.paymentMethod}</td>
                  <td className="p-3.5 text-right font-black text-emerald-400">+{currency}{i.amount.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* EXPENSE MODAL */}
      {isExpModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl p-6">
            <h3 className="text-base font-bold text-slate-100 mb-4">Record Shop Expense</h3>
            <form onSubmit={handleExpenseSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 font-bold mb-1">Expense Title *</label>
                <input
                  type="text"
                  required
                  value={expTitle}
                  onChange={(e) => setExpTitle(e.target.value)}
                  placeholder="e.g. Electricity Bill July"
                  className="w-full bg-slate-950 text-slate-100 p-2.5 rounded-xl border border-slate-700"
                />
              </div>
              <div>
                <label className="block text-slate-400 font-bold mb-1">Category</label>
                <input
                  type="text"
                  value={expCustomCategory}
                  onChange={(e) => setExpCustomCategory(e.target.value)}
                  placeholder="e.g. Utility, Shop Rent, Snacks, Transport, Salary..."
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
              <div>
                <label className="block text-slate-400 font-bold mb-1">Amount ({currency}) *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={expAmount || ''}
                  onChange={(e) => setExpAmount(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-950 text-rose-400 font-bold text-sm p-2.5 rounded-xl border border-slate-700"
                />
              </div>
              <div>
                <label className="block text-slate-400 font-bold mb-1">Payment Method</label>
                <select
                  value={expMethod}
                  onChange={(e) => setExpMethod(e.target.value as PaymentMethod)}
                  className="w-full bg-slate-950 text-slate-100 p-2.5 rounded-xl border border-slate-700"
                >
                  <option value="Cash">Cash</option>
                  <option value="Bank">Bank Wire</option>
                  <option value="Card">Corporate Card</option>
                </select>
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button type="button" onClick={() => setIsExpModalOpen(false)} className="px-4 py-2 bg-slate-800 text-slate-300 font-bold rounded-xl">
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl shadow-lg">
                  Record Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* INCOME MODAL */}
      {isIncModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl p-6">
            <h3 className="text-base font-bold text-slate-100 mb-4">Record Miscellaneous Revenue</h3>
            <form onSubmit={handleIncomeSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 font-bold mb-1">Income Title *</label>
                <input
                  type="text"
                  required
                  value={incTitle}
                  onChange={(e) => setIncTitle(e.target.value)}
                  placeholder="e.g. Recycling Box Scrap Sale"
                  className="w-full bg-slate-950 text-slate-100 p-2.5 rounded-xl border border-slate-700"
                />
              </div>
              <div>
                <label className="block text-slate-400 font-bold mb-1">Category</label>
                <input
                  type="text"
                  value={incCustomCategory}
                  onChange={(e) => setIncCustomCategory(e.target.value)}
                  placeholder="e.g. Scrap Sale, Delivery Fee, Commission, Rebate..."
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
              <div>
                <label className="block text-slate-400 font-bold mb-1">Amount ({currency}) *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={incAmount || ''}
                  onChange={(e) => setIncAmount(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-950 text-emerald-400 font-bold text-sm p-2.5 rounded-xl border border-slate-700"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button type="button" onClick={() => setIsIncModalOpen(false)} className="px-4 py-2 bg-slate-800 text-slate-300 font-bold rounded-xl">
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg">
                  Record Income
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
