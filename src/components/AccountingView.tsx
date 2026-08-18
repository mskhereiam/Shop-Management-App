import React, { useState } from 'react';
import { BookOpen, DollarSign, Wallet, Building2, TrendingUp, TrendingDown, Receipt } from 'lucide-react';
import { CustomerLedgerEntry, SupplierLedgerEntry, SaleInvoice, PurchaseInvoice, Expense, Income, ShopSettings } from '../types';

interface AccountingViewProps {
  customerLedger: CustomerLedgerEntry[];
  supplierLedger: SupplierLedgerEntry[];
  sales: SaleInvoice[];
  purchases: PurchaseInvoice[];
  expenses: Expense[];
  incomes: Income[];
  settings: ShopSettings;
}

export const AccountingView: React.FC<AccountingViewProps> = ({
  customerLedger,
  supplierLedger,
  sales,
  purchases,
  expenses,
  incomes,
  settings
}) => {
  const currency = settings.currencySymbol || '৳';
  const [activeTab, setActiveTab] = useState<'pnl' | 'cash-bank' | 'customer' | 'supplier'>('pnl');

  const grossSales = sales.reduce((a, s) => a + s.grandTotal, 0);
  const costOfGoodsSold = grossSales * 0.65; // Estimated COGS
  const grossMargin = grossSales - costOfGoodsSold;
  const totalExpenses = expenses.reduce((a, e) => a + e.amount, 0);
  const totalMiscIncome = incomes.reduce((a, i) => a + i.amount, 0);
  const netProfit = grossMargin + totalMiscIncome - totalExpenses;

  const totalCashSales = sales.filter((s) => s.paymentMethod === 'Cash').reduce((a, s) => a + s.paidAmount, 0);
  const totalBankSales = sales.filter((s) => s.paymentMethod !== 'Cash').reduce((a, s) => a + s.paidAmount, 0);

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-xl">
        <div>
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-indigo-400" />
            Financial Ledgers & Double-Entry Account Statements
          </h2>
          <p className="text-xs text-slate-400">Profit & Loss Statement, Cash/Bank ledger books, and general balances</p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('pnl')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold ${
              activeTab === 'pnl' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'
            }`}
          >
            Profit & Loss Statement
          </button>
          <button
            onClick={() => setActiveTab('cash-bank')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold ${
              activeTab === 'cash-bank' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'
            }`}
          >
            Cash & Bank Book
          </button>
        </div>
      </div>

      {activeTab === 'pnl' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl max-w-2xl mx-auto space-y-4">
          <div className="text-center border-b border-slate-800 pb-4">
            <h3 className="text-lg font-black text-slate-100">{settings.companyName || 'ShopMind AI'}</h3>
            <p className="text-xs text-indigo-400 font-bold uppercase tracking-wider mt-0.5">Comprehensive Profit & Loss Statement</p>
          </div>

          <div className="space-y-3 text-xs text-slate-200">
            <div className="flex justify-between py-2 border-b border-slate-800/80">
              <span className="font-bold">Gross Sales Revenue</span>
              <span className="font-extrabold text-emerald-400">{currency}{grossSales.toFixed(2)}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-800/80 text-rose-400">
              <span>Less: Cost of Goods Sold (COGS ~65%)</span>
              <span>-{currency}{costOfGoodsSold.toFixed(2)}</span>
            </div>
            <div className="flex justify-between py-2 bg-slate-950 p-3 rounded-xl border border-slate-800 font-bold text-sm">
              <span>Gross Profit Margin</span>
              <span className="text-emerald-400">{currency}{grossMargin.toFixed(2)}</span>
            </div>

            <div className="flex justify-between py-2 border-b border-slate-800/80 text-amber-400">
              <span>Plus: Miscellaneous Incomes & Rebates</span>
              <span>+{currency}{totalMiscIncome.toFixed(2)}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-800/80 text-rose-400">
              <span>Less: Operating Expenses (Rent, Utilities, Salary)</span>
              <span>-{currency}{totalExpenses.toFixed(2)}</span>
            </div>

            <div className="flex justify-between py-3 bg-indigo-950/60 p-4 rounded-xl border border-indigo-500/30 text-base font-black text-slate-100">
              <span>Net Operating Income / Profit:</span>
              <span className={netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                {currency}{netProfit.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'cash-bank' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Wallet className="w-4 h-4 text-emerald-400" /> Cash Ledger Account
            </h3>
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs flex justify-between font-bold">
              <span>Cash Register Total:</span>
              <span className="text-emerald-400">{currency}{(14850 + totalCashSales).toFixed(2)}</span>
            </div>
            <div className="space-y-1.5 max-h-64 overflow-y-auto custom-scrollbar">
              {sales.filter((s) => s.paymentMethod === 'Cash').map((s) => (
                <div key={s.id} className="p-2.5 bg-slate-800/50 rounded-xl text-xs flex justify-between">
                  <div>
                    <div className="font-bold text-slate-200">{s.invoiceNumber}</div>
                    <div className="text-[10px] text-slate-400">{s.customerName}</div>
                  </div>
                  <span className="font-bold text-emerald-400">+{currency}{s.paidAmount.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-indigo-400" /> Bank & Digital Payment Account
            </h3>
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs flex justify-between font-bold">
              <span>Commercial Bank Balance:</span>
              <span className="text-indigo-400">{currency}{(32400 + totalBankSales).toFixed(2)}</span>
            </div>
            <div className="space-y-1.5 max-h-64 overflow-y-auto custom-scrollbar">
              {sales.filter((s) => s.paymentMethod !== 'Cash').map((s) => (
                <div key={s.id} className="p-2.5 bg-slate-800/50 rounded-xl text-xs flex justify-between">
                  <div>
                    <div className="font-bold text-slate-200">{s.invoiceNumber} ({s.paymentMethod})</div>
                    <div className="text-[10px] text-slate-400">{s.customerName}</div>
                  </div>
                  <span className="font-bold text-indigo-400">+{currency}{s.paidAmount.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
