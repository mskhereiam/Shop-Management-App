import React, { useState } from 'react';
import { BarChart3, Download, Printer, Calendar, TrendingUp, TrendingDown, DollarSign, Package, PieChart, ShieldCheck } from 'lucide-react';
import * as XLSX from 'xlsx';
import { SaleInvoice, Product, Customer, Supplier, ShopSettings, Expense, Income, PurchaseInvoice } from '../types';

interface ReportsViewProps {
  sales: SaleInvoice[];
  products: Product[];
  customers: Customer[];
  suppliers: Supplier[];
  expenses?: Expense[];
  incomes?: Income[];
  purchases?: PurchaseInvoice[];
  settings: ShopSettings;
}

type TimePeriod = 'daily' | 'weekly' | 'monthly' | 'yearly' | 'lifetime';

const ENGLISH_MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export const ReportsView: React.FC<ReportsViewProps> = ({
  sales,
  products,
  customers,
  suppliers,
  expenses = [],
  incomes = [],
  purchases = [],
  settings
}) => {
  const currency = settings.currencySymbol || '৳';

  const [activePeriod, setActivePeriod] = useState<TimePeriod>('monthly');
  const [selectedEnglishMonth, setSelectedEnglishMonth] = useState<number | 'all'>(new Date().getMonth());
  const [selectedEnglishYear, setSelectedEnglishYear] = useState<number>(new Date().getFullYear());

  // Helper for English Month & Period Filtering
  const isDateInPeriod = (dateStr: string, period: TimePeriod) => {
    if (period === 'lifetime') return true;
    if (!dateStr) return false;

    const d = new Date(dateStr);
    const now = new Date();
    if (isNaN(d.getTime())) return false;

    if (period === 'daily') {
      return (
        d.getDate() === now.getDate() &&
        d.getMonth() === now.getMonth() &&
        d.getFullYear() === now.getFullYear()
      );
    }

    if (period === 'weekly') {
      const diffTime = Math.abs(now.getTime() - d.getTime());
      const diffDays = diffTime / (1000 * 60 * 60 * 24);
      return diffDays <= 7;
    }

    if (period === 'monthly') {
      if (selectedEnglishMonth === 'all') {
        return d.getFullYear() === selectedEnglishYear;
      }
      return d.getMonth() === selectedEnglishMonth && d.getFullYear() === selectedEnglishYear;
    }

    if (period === 'yearly') {
      return d.getFullYear() === selectedEnglishYear;
    }

    return true;
  };

  const calculateMetricsForPeriod = (period: TimePeriod) => {
    const periodSales = sales.filter((s) => isDateInPeriod(s.date, period));
    const periodIncomes = incomes.filter((i) => isDateInPeriod(i.date, period));
    const periodExpenses = expenses.filter((e) => isDateInPeriod(e.date, period));
    const periodPurchases = purchases.filter((p) => isDateInPeriod(p.date, period));

    const salesIncome = periodSales.reduce((a, s) => a + s.grandTotal, 0);
    const miscIncome = periodIncomes.reduce((a, i) => a + i.amount, 0);
    const totalIncome = salesIncome + miscIncome;

    const shopExpenses = periodExpenses.reduce((a, e) => a + e.amount, 0);
    const purchaseCost = periodPurchases.reduce((a, p) => a + p.grandTotal, 0);
    const totalExpense = shopExpenses + purchaseCost;

    const netProfit = totalIncome - totalExpense;

    return {
      salesCount: periodSales.length,
      salesIncome,
      miscIncome,
      totalIncome,
      shopExpenses,
      purchaseCost,
      totalExpense,
      netProfit
    };
  };

  const currentMetrics = calculateMetricsForPeriod(activePeriod);

  // Periods Data for Summary Table
  const periodsList: { id: TimePeriod; label: string; enLabel: string }[] = [
    { id: 'daily', label: 'Daily', enLabel: 'Today' },
    { id: 'weekly', label: 'Weekly', enLabel: 'Last 7 Days' },
    { id: 'monthly', label: 'Monthly', enLabel: 'This Month' },
    { id: 'yearly', label: 'Yearly', enLabel: 'This Year' },
    { id: 'lifetime', label: 'Lifetime', enLabel: 'All Time' }
  ];

  // Excel Exporters
  const exportComprehensiveXLSX = (periodOnly: boolean = true) => {
    const periodObj = periodsList.find((p) => p.id === activePeriod);
    const periodLabel = periodOnly ? (periodObj?.label || activePeriod) : 'Lifetime (All Time)';

    const periodSales = periodOnly ? sales.filter((s) => isDateInPeriod(s.date, activePeriod)) : sales;
    const periodPurchases = periodOnly ? purchases.filter((p) => isDateInPeriod(p.date, activePeriod)) : purchases;
    const periodIncomes = periodOnly ? incomes.filter((i) => isDateInPeriod(i.date, activePeriod)) : incomes;
    const periodExpenses = periodOnly ? expenses.filter((e) => isDateInPeriod(e.date, activePeriod)) : expenses;

    const m = periodOnly ? currentMetrics : calculateMetricsForPeriod('lifetime');

    const workbook = XLSX.utils.book_new();

    // 1. Profit & Financial Summary Sheet
    const summaryData = [
      { 'Report Metric': 'Time Period', 'Value / Amount': periodLabel },
      { 'Report Metric': 'Sales Revenue', 'Value / Amount': m.salesIncome },
      { 'Report Metric': 'Other Income', 'Value / Amount': m.miscIncome },
      { 'Report Metric': 'TOTAL INCOME', 'Value / Amount': m.totalIncome },
      { 'Report Metric': 'Purchase Cost', 'Value / Amount': m.purchaseCost },
      { 'Report Metric': 'Operating Expense', 'Value / Amount': m.shopExpenses },
      { 'Report Metric': 'TOTAL EXPENSE', 'Value / Amount': m.totalExpense },
      { 'Report Metric': 'NET PROFIT/LOSS', 'Value / Amount': m.netProfit },
      {
        'Report Metric': 'Profit Margin %',
        'Value / Amount': m.totalIncome > 0 ? `${((m.netProfit / m.totalIncome) * 100).toFixed(2)}%` : '0%'
      }
    ];

    const summaryWS = XLSX.utils.json_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, summaryWS, 'Financial & Profit Summary');

    // 2. Comparative Periods Breakdown Sheet
    const comparisonData = periodsList.map((p) => {
      const pMet = calculateMetricsForPeriod(p.id);
      return {
        'Period': p.label,
        'Sales Revenue': pMet.salesIncome,
        'Misc Income': pMet.miscIncome,
        'Total Income': pMet.totalIncome,
        'Shop Expense': pMet.shopExpenses,
        'Purchase Cost': pMet.purchaseCost,
        'Total Expense': pMet.totalExpense,
        'Net Profit/Loss': pMet.netProfit
      };
    });
    const comparisonWS = XLSX.utils.json_to_sheet(comparisonData);
    XLSX.utils.book_append_sheet(workbook, comparisonWS, 'Periods Comparison');

    // 3. Sales Breakdown Sheet
    const salesData = periodSales.map((s) => ({
      'Invoice #': s.invoiceNumber,
      'Date': new Date(s.date).toLocaleString(),
      'Customer': s.customerName,
      'Subtotal': s.subtotal,
      'Discount': s.discount,
      'Tax': s.taxAmount,
      'Grand Total': s.grandTotal,
      'Paid Amount': s.paidAmount,
      'Due Amount': s.dueAmount,
      'Payment Method': s.paymentMethod,
      'Status': s.paymentStatus
    }));
    const salesWS = XLSX.utils.json_to_sheet(salesData.length > 0 ? salesData : [{ 'Info': 'No sales records found in this period' }]);
    XLSX.utils.book_append_sheet(workbook, salesWS, 'Sales');

    // 4. Purchases Breakdown Sheet
    const purchasesData = periodPurchases.map((p) => ({
      'PO / Invoice #': p.invoiceNumber,
      'Date': new Date(p.date).toLocaleString(),
      'Supplier': p.supplierName,
      'Subtotal': p.subtotal,
      'Tax': p.taxAmount,
      'Grand Total': p.grandTotal,
      'Paid Amount': p.paidAmount,
      'Due Amount': p.dueAmount,
      'Status': p.status
    }));
    const purchasesWS = XLSX.utils.json_to_sheet(purchasesData.length > 0 ? purchasesData : [{ 'Info': 'No purchase records found in this period' }]);
    XLSX.utils.book_append_sheet(workbook, purchasesWS, 'Purchases');

    // 5. Other Income Sheet
    const incomesData = periodIncomes.map((i) => ({
      'Title / Source': i.title,
      'Category': i.category || 'N/A',
      'Date': new Date(i.date).toLocaleDateString(),
      'Amount': i.amount,
      'Payment Method': i.paymentMethod,
      'Reference / Notes': i.reference || i.description || ''
    }));
    const incomesWS = XLSX.utils.json_to_sheet(incomesData.length > 0 ? incomesData : [{ 'Info': 'No other income records found in this period' }]);
    XLSX.utils.book_append_sheet(workbook, incomesWS, 'Other Income');

    // 6. Shop Expenses Sheet
    const expensesData = periodExpenses.map((e) => ({
      'Title': e.title,
      'Category': e.category,
      'Date': new Date(e.date).toLocaleDateString(),
      'Amount': e.amount,
      'Payment Method': e.paymentMethod,
      'Description / Notes': e.description || ''
    }));
    const expensesWS = XLSX.utils.json_to_sheet(expensesData.length > 0 ? expensesData : [{ 'Info': 'No expense records found in this period' }]);
    XLSX.utils.book_append_sheet(workbook, expensesWS, 'Expenses');

    const filePeriodTag = periodOnly ? activePeriod : 'All_Time';
    XLSX.writeFile(workbook, `Income_Expense_Report_${filePeriodTag}_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const exportSalesReportXLSX = () => {
    const data = sales.map((s) => ({
      'Invoice #': s.invoiceNumber,
      Date: new Date(s.date).toLocaleDateString(),
      'Customer Name': s.customerName,
      'Subtotal': s.subtotal,
      'Discount': s.discount,
      'Tax': s.taxAmount,
      'Grand Total': s.grandTotal,
      'Paid': s.paidAmount,
      'Due': s.dueAmount,
      'Payment Method': s.paymentMethod,
      'Status': s.paymentStatus
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sales Report');
    XLSX.writeFile(workbook, `Sales_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const exportFinancialSummaryXLSX = () => {
    exportComprehensiveXLSX(true);
  };

  const exportInventoryXLSX = () => {
    const data = products.map((p) => ({
      'Product Name': p.name,
      SKU: p.sku,
      Barcode: p.barcode,
      'Cost Price': p.purchasePrice,
      'Sale Price': p.salePrice,
      'Current Stock': p.currentStock,
      'Asset Value': p.currentStock * p.purchasePrice
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Stock Valuation');
    XLSX.writeFile(workbook, `Inventory_Valuation_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const totalSalesVal = sales.reduce((a, s) => a + s.grandTotal, 0);
  const totalStockAssetVal = products.reduce((a, p) => a + p.currentStock * p.purchasePrice, 0);
  const totalCustomerDues = customers.reduce((a, c) => a + c.dueAmount, 0);
  const totalSupplierPayables = suppliers.reduce((a, s) => a + s.dueAmount, 0);

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl">
        <div>
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-indigo-400" />
            Income & Expense Analytics
          </h2>
          <p className="text-xs text-slate-400 mt-1">Daily, weekly, monthly, yearly, and lifetime income & expense analysis</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => exportComprehensiveXLSX(true)}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow flex items-center gap-1.5 transition-all"
            title="Export full income, sales, purchases, and expenses report for selected time period"
          >
            <Download className="w-3.5 h-3.5" /> Period XLSX
          </button>
          <button
            onClick={() => exportComprehensiveXLSX(false)}
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow flex items-center gap-1.5 transition-all"
            title="Export all-time complete master report with all sheets"
          >
            <Download className="w-3.5 h-3.5" /> Master XLSX
          </button>
          <button
            onClick={exportInventoryXLSX}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl border border-slate-700 flex items-center gap-1.5 transition-all"
          >
            <Download className="w-3.5 h-3.5" /> Stock Valuation XLSX
          </button>
        </div>
      </div>

      {/* Time Period & English Month Filter Bar */}
      <div className="bg-slate-900 border border-slate-800 p-3 rounded-2xl shadow-lg flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {periodsList.map((p) => {
            const isActive = activePeriod === p.id;
            return (
              <button
                key={p.id}
                onClick={() => setActivePeriod(p.id)}
                className={`px-3.5 py-2 rounded-xl font-bold text-xs transition-all flex items-center gap-2 ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                    : 'bg-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>{p.label}</span>
              </button>
            );
          })}
        </div>

        {/* English Month & Year Selectors */}
        <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-xl border border-slate-800">
          <span className="text-[10px] text-slate-400 font-bold px-2 uppercase">English Month:</span>
          <select
            value={selectedEnglishMonth}
            onChange={(e) => {
              const val = e.target.value;
              setSelectedEnglishMonth(val === 'all' ? 'all' : parseInt(val));
              setActivePeriod('monthly');
            }}
            className="bg-slate-900 text-slate-100 text-xs font-bold px-2.5 py-1.5 rounded-lg border border-slate-700 focus:outline-none focus:border-indigo-500"
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
              setActivePeriod('monthly');
            }}
            className="bg-slate-900 text-slate-100 text-xs font-bold px-2.5 py-1.5 rounded-lg border border-slate-700 focus:outline-none focus:border-indigo-500"
          >
            {[2024, 2025, 2026, 2027, 2028].map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Selected Period Income & Expense KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Income Card */}
        <div className="p-5 bg-gradient-to-br from-slate-900 to-emerald-950/30 border border-emerald-500/30 rounded-2xl shadow-xl relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wide flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4" /> Total Income
              </span>
              <p className="text-[10px] text-slate-400 mt-0.5">
                {periodsList.find((p) => p.id === activePeriod)?.label}
              </p>
            </div>
            <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-400">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-300 mt-3">
            {currency}{currentMetrics.totalIncome.toFixed(2)}
          </div>
          <div className="mt-3 pt-3 border-t border-emerald-500/20 text-[11px] text-slate-300 space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-400">Sales Revenue:</span>
              <span className="font-bold text-slate-200">{currency}{currentMetrics.salesIncome.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Misc Revenue:</span>
              <span className="font-bold text-slate-200">{currency}{currentMetrics.miscIncome.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Total Expense Card */}
        <div className="p-5 bg-gradient-to-br from-slate-900 to-rose-950/30 border border-rose-500/30 rounded-2xl shadow-xl relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-xs font-bold text-rose-400 uppercase tracking-wide flex items-center gap-1.5">
                <TrendingDown className="w-4 h-4" /> Total Expense
              </span>
              <p className="text-[10px] text-slate-400 mt-0.5">
                {periodsList.find((p) => p.id === activePeriod)?.label}
              </p>
            </div>
            <div className="p-2 bg-rose-500/10 rounded-xl text-rose-400">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-rose-300 mt-3">
            {currency}{currentMetrics.totalExpense.toFixed(2)}
          </div>
          <div className="mt-3 pt-3 border-t border-rose-500/20 text-[11px] text-slate-300 space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-400">Shop Expenses:</span>
              <span className="font-bold text-slate-200">{currency}{currentMetrics.shopExpenses.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Purchase Cost:</span>
              <span className="font-bold text-slate-200">{currency}{currentMetrics.purchaseCost.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Net Profit / Loss Card */}
        <div className={`p-5 bg-gradient-to-br ${
          currentMetrics.netProfit >= 0
            ? 'from-slate-900 to-indigo-950/40 border-indigo-500/30'
            : 'from-slate-900 to-amber-950/40 border-amber-500/30'
        } border rounded-2xl shadow-xl relative overflow-hidden`}>
          <div className="flex justify-between items-start">
            <div>
              <span className={`text-xs font-bold uppercase tracking-wide flex items-center gap-1.5 ${
                currentMetrics.netProfit >= 0 ? 'text-indigo-400' : 'text-amber-400'
              }`}>
                <PieChart className="w-4 h-4" /> Net Profit / Loss
              </span>
              <p className="text-[10px] text-slate-400 mt-0.5">
                {periodsList.find((p) => p.id === activePeriod)?.label}
              </p>
            </div>
            <div className={`p-2 rounded-xl ${
              currentMetrics.netProfit >= 0 ? 'bg-indigo-500/10 text-indigo-400' : 'bg-amber-500/10 text-amber-400'
            }`}>
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className={`text-2xl font-black mt-3 ${
            currentMetrics.netProfit >= 0 ? 'text-indigo-300' : 'text-amber-400'
          }`}>
            {currency}{currentMetrics.netProfit.toFixed(2)}
          </div>
          <div className="mt-3 pt-3 border-t border-slate-800 text-[11px] text-slate-300 space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-400">Profit Margin:</span>
              <span className="font-bold text-slate-200">
                {currentMetrics.totalIncome > 0
                  ? `${((currentMetrics.netProfit / currentMetrics.totalIncome) * 100).toFixed(1)}%`
                  : '0.0%'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Total Sales Invoices:</span>
              <span className="font-bold text-slate-200">{currentMetrics.salesCount} Invoices</span>
            </div>
          </div>
        </div>
      </div>

      {/* Side-By-Side Comparison Matrix Table across All 5 Periods */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex justify-between items-center border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-indigo-400" />
              Daily, Weekly, Monthly, Yearly & Lifetime Summary
            </h3>
            <p className="text-xs text-slate-400">Detailed breakdown of total income, expense, and net profit across all timeframes</p>
          </div>
          <button onClick={() => window.print()} className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl flex items-center gap-1.5">
            <Printer className="w-3.5 h-3.5" /> Print Summary
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-950 text-slate-400 font-bold border-b border-slate-800 uppercase">
                <th className="p-3">Period</th>
                <th className="p-3 text-right">Sales Revenue</th>
                <th className="p-3 text-right">Misc Revenue</th>
                <th className="p-3 text-right text-emerald-400 font-black">Total Income</th>
                <th className="p-3 text-right">Shop Expense</th>
                <th className="p-3 text-right">Purchase Cost</th>
                <th className="p-3 text-right text-rose-400 font-black">Total Expense</th>
                <th className="p-3 text-right text-indigo-300 font-black">Net Profit / Loss</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-200">
              {periodsList.map((p) => {
                const m = calculateMetricsForPeriod(p.id);
                const isSelected = activePeriod === p.id;
                return (
                  <tr
                    key={p.id}
                    onClick={() => setActivePeriod(p.id)}
                    className={`cursor-pointer transition-colors ${
                      isSelected ? 'bg-indigo-950/40 border-l-4 border-l-indigo-500' : 'hover:bg-slate-800/40'
                    }`}
                  >
                    <td className="p-3 font-bold text-slate-100 flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${isSelected ? 'bg-indigo-400' : 'bg-slate-600'}`} />
                      {p.label}
                    </td>
                    <td className="p-3 text-right text-slate-300">{currency}{m.salesIncome.toFixed(2)}</td>
                    <td className="p-3 text-right text-slate-300">{currency}{m.miscIncome.toFixed(2)}</td>
                    <td className="p-3 text-right font-black text-emerald-400">{currency}{m.totalIncome.toFixed(2)}</td>
                    <td className="p-3 text-right text-slate-300">{currency}{m.shopExpenses.toFixed(2)}</td>
                    <td className="p-3 text-right text-slate-300">{currency}{m.purchaseCost.toFixed(2)}</td>
                    <td className="p-3 text-right font-black text-rose-400">{currency}{m.totalExpense.toFixed(2)}</td>
                    <td className={`p-3 text-right font-black ${m.netProfit >= 0 ? 'text-emerald-300' : 'text-amber-400'}`}>
                      {currency}{m.netProfit.toFixed(2)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* English Calendar Real-Time Month-by-Month Database Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-400" />
              English Calendar Real-Time Month Breakdown ({selectedEnglishYear})
            </h3>
            <p className="text-xs text-slate-400">Monthly real-time database ledger calculation from January to December</p>
          </div>
          <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2.5 py-1 rounded-lg">
            Live Database Sync Active
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-950 text-slate-400 font-bold border-b border-slate-800 uppercase">
                <th className="p-3">English Month</th>
                <th className="p-3 text-right">Sales Revenue</th>
                <th className="p-3 text-right">Misc Revenue</th>
                <th className="p-3 text-right text-emerald-400 font-black">Total Income</th>
                <th className="p-3 text-right">Shop Expense</th>
                <th className="p-3 text-right">Purchase Cost</th>
                <th className="p-3 text-right text-rose-400 font-black">Total Expense</th>
                <th className="p-3 text-right text-indigo-300 font-black">Net Profit / Loss</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-200">
              {ENGLISH_MONTHS.map((monthName, monthIndex) => {
                const mSales = sales.filter((s) => {
                  const d = new Date(s.date);
                  return d.getMonth() === monthIndex && d.getFullYear() === selectedEnglishYear;
                });
                const mIncomes = incomes.filter((i) => {
                  const d = new Date(i.date);
                  return d.getMonth() === monthIndex && d.getFullYear() === selectedEnglishYear;
                });
                const mExpenses = expenses.filter((e) => {
                  const d = new Date(e.date);
                  return d.getMonth() === monthIndex && d.getFullYear() === selectedEnglishYear;
                });
                const mPurchases = purchases.filter((p) => {
                  const d = new Date(p.date);
                  return d.getMonth() === monthIndex && d.getFullYear() === selectedEnglishYear;
                });

                const salesIncome = mSales.reduce((a, s) => a + s.grandTotal, 0);
                const miscIncome = mIncomes.reduce((a, i) => a + i.amount, 0);
                const totalInc = salesIncome + miscIncome;
                const shopExp = mExpenses.reduce((a, e) => a + e.amount, 0);
                const purCost = mPurchases.reduce((a, p) => a + p.grandTotal, 0);
                const totalExp = shopExp + purCost;
                const netProf = totalInc - totalExp;

                const isCurrentMonth = new Date().getMonth() === monthIndex && new Date().getFullYear() === selectedEnglishYear;
                const isSelected = selectedEnglishMonth === monthIndex;

                return (
                  <tr
                    key={monthName}
                    onClick={() => {
                      setSelectedEnglishMonth(monthIndex);
                      setActivePeriod('monthly');
                    }}
                    className={`cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-indigo-950/50 border-l-4 border-l-indigo-500 font-bold'
                        : isCurrentMonth
                        ? 'bg-slate-800/40 font-semibold'
                        : 'hover:bg-slate-800/30'
                    }`}
                  >
                    <td className="p-3 font-bold text-slate-100 flex items-center gap-2">
                      <span>{monthName}</span>
                      {isCurrentMonth && (
                        <span className="text-[9px] bg-emerald-500/20 text-emerald-400 font-bold px-1.5 py-0.5 rounded">
                          Current
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-right text-slate-300 font-mono">{currency}{salesIncome.toFixed(2)}</td>
                    <td className="p-3 text-right text-slate-300 font-mono">{currency}{miscIncome.toFixed(2)}</td>
                    <td className="p-3 text-right font-black text-emerald-400 font-mono">{currency}{totalInc.toFixed(2)}</td>
                    <td className="p-3 text-right text-slate-300 font-mono">{currency}{shopExp.toFixed(2)}</td>
                    <td className="p-3 text-right text-slate-300 font-mono">{currency}{purCost.toFixed(2)}</td>
                    <td className="p-3 text-right font-black text-rose-400 font-mono">{currency}{totalExp.toFixed(2)}</td>
                    <td className={`p-3 text-right font-black font-mono ${netProf >= 0 ? 'text-emerald-300' : 'text-amber-400'}`}>
                      {currency}{netProf.toFixed(2)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* General Business Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl">
          <span className="text-[10px] text-slate-400 uppercase font-bold">Total Sales Revenue (All Time)</span>
          <div className="text-xl font-black text-emerald-400 mt-1">{currency}{totalSalesVal.toFixed(2)}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">{sales.length} Invoices Processed</div>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl">
          <span className="text-[10px] text-slate-400 uppercase font-bold">Inventory Asset Value</span>
          <div className="text-xl font-black text-indigo-400 mt-1">{currency}{totalStockAssetVal.toFixed(2)}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">{products.length} Active Catalog Items</div>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl">
          <span className="text-[10px] text-slate-400 uppercase font-bold">Customer Accounts Receivable</span>
          <div className="text-xl font-black text-amber-400 mt-1">{currency}{totalCustomerDues.toFixed(2)}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Outstanding Customer Dues</div>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl">
          <span className="text-[10px] text-slate-400 uppercase font-bold">Supplier Payables</span>
          <div className="text-xl font-black text-rose-400 mt-1">{currency}{totalSupplierPayables.toFixed(2)}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Vendor Bills Owed</div>
        </div>
      </div>

      {/* Printable Report Preview Container */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex justify-between items-center border-b border-slate-800 pb-4">
          <h3 className="text-sm font-bold text-slate-100">Recent Sales Audit Log</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-950 text-slate-400 font-bold border-b border-slate-800 uppercase">
                <th className="p-3">Invoice #</th>
                <th className="p-3">Date</th>
                <th className="p-3">Customer</th>
                <th className="p-3 text-right">Grand Total</th>
                <th className="p-3 text-right">Paid</th>
                <th className="p-3 text-right">Due</th>
                <th className="p-3 text-center">Payment Method</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-200 font-mono">
              {sales.map((s) => (
                <tr key={s.id}>
                  <td className="p-3 font-bold text-indigo-400">{s.invoiceNumber}</td>
                  <td className="p-3 text-slate-400">{new Date(s.date).toLocaleDateString()}</td>
                  <td className="p-3 font-sans font-bold text-slate-200">{s.customerName}</td>
                  <td className="p-3 text-right font-black text-slate-100">{currency}{s.grandTotal.toFixed(2)}</td>
                  <td className="p-3 text-right text-emerald-400 font-bold">{currency}{s.paidAmount.toFixed(2)}</td>
                  <td className="p-3 text-right text-rose-400 font-bold">{currency}{s.dueAmount.toFixed(2)}</td>
                  <td className="p-3 text-center font-sans font-semibold text-slate-300">{s.paymentMethod}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

