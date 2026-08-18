import React, { useState } from 'react';
import {
  FileText,
  Search,
  Filter,
  Eye,
  Printer,
  Download,
  DollarSign,
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  CreditCard,
  User,
  ShoppingBag,
  TrendingUp,
  Receipt,
  Plus
} from 'lucide-react';
import { SaleInvoice, ShopSettings, PaymentMethod, Customer } from '../types';
import { ConfirmDialog } from './ConfirmDialog';

interface SalesDirectoryViewProps {
  sales: SaleInvoice[];
  settings: ShopSettings;
  onViewInvoice: (invoice: SaleInvoice) => void;
  onReceiveDuePayment?: (invoiceId: string, amount: number, paymentMethod: PaymentMethod) => void;
  onDeleteInvoice?: (invoiceId: string) => void;
  onNavigateToPOS: () => void;
}

export const SalesDirectoryView: React.FC<SalesDirectoryViewProps> = ({
  sales,
  settings,
  onViewInvoice,
  onReceiveDuePayment,
  onDeleteInvoice,
  onNavigateToPOS
}) => {
  const currency = settings.currencySymbol || '৳';

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PAID' | 'PARTIAL' | 'DUE'>('ALL');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>('ALL');
  const [dateFilter, setDateFilter] = useState<'ALL' | 'TODAY' | 'THIS_MONTH'>('ALL');

  // Due Payment Modal state
  const [selectedInvoiceForDue, setSelectedInvoiceForDue] = useState<SaleInvoice | null>(null);
  const [duePayAmount, setDuePayAmount] = useState<string>('');
  const [duePayMethod, setDuePayMethod] = useState<PaymentMethod>('Cash');

  // Delete Invoice state
  const [deletingInvoice, setDeletingInvoice] = useState<SaleInvoice | null>(null);

  // Filter logic
  const todayStr = new Date().toISOString().split('T')[0];
  const currentMonthStr = todayStr.substring(0, 7);

  const filteredSales = sales.filter((inv) => {
    // Search filter
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      inv.invoiceNumber.toLowerCase().includes(q) ||
      inv.customerName.toLowerCase().includes(q) ||
      inv.customerPhone.includes(q) ||
      (inv.soldBy && inv.soldBy.toLowerCase().includes(q));

    // Status filter
    const matchesStatus = statusFilter === 'ALL' || inv.paymentStatus === statusFilter;

    // Payment method filter
    const matchesMethod = paymentMethodFilter === 'ALL' || inv.paymentMethod === paymentMethodFilter;

    // Date filter
    const invDateStr = inv.date.split('T')[0];
    let matchesDate = true;
    if (dateFilter === 'TODAY') {
      matchesDate = invDateStr === todayStr;
    } else if (dateFilter === 'THIS_MONTH') {
      matchesDate = invDateStr.startsWith(currentMonthStr);
    }

    return matchesSearch && matchesStatus && matchesMethod && matchesDate;
  });

  // Calculate summary metrics
  const totalSalesCount = filteredSales.length;
  const totalGrandTotal = filteredSales.reduce((sum, inv) => sum + inv.grandTotal, 0);
  const totalPaidAmount = filteredSales.reduce((sum, inv) => sum + inv.paidAmount, 0);
  const totalDueAmount = filteredSales.reduce((sum, inv) => sum + inv.dueAmount, 0);

  // Handle Due Payment Submission
  const handleCollectDue = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoiceForDue) return;

    const payVal = parseFloat(duePayAmount);
    if (isNaN(payVal) || payVal <= 0) {
      alert('Please enter a valid payment amount.');
      return;
    }

    if (payVal > selectedInvoiceForDue.dueAmount) {
      alert(`Payment amount cannot exceed the due amount (${currency}${selectedInvoiceForDue.dueAmount.toFixed(2)}).`);
      return;
    }

    if (onReceiveDuePayment) {
      onReceiveDuePayment(selectedInvoiceForDue.id, payVal, duePayMethod);
    }

    setSelectedInvoiceForDue(null);
    setDuePayAmount('');
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = ['Invoice No', 'Date', 'Customer Name', 'Phone', 'Items Count', 'Subtotal', 'Discount', 'VAT/Tax', 'Grand Total', 'Paid', 'Due', 'Payment Method', 'Status'];
    const rows = filteredSales.map((inv) => [
      inv.invoiceNumber,
      new Date(inv.date).toLocaleDateString('en-US'),
      `"${inv.customerName}"`,
      `"${inv.customerPhone}"`,
      inv.items.length,
      inv.subtotal,
      inv.discount,
      inv.taxAmount,
      inv.grandTotal,
      inv.paidAmount,
      inv.dueAmount,
      inv.paymentMethod,
      inv.paymentStatus
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Sales_Directory_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Banner & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-indigo-600/20 text-indigo-400 rounded-xl border border-indigo-500/30">
              <Receipt className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-100">Sales Directory</h1>
              <p className="text-xs text-slate-400">All sales invoices, memos, status filtering, and due collection tracking</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs rounded-xl transition-all flex items-center gap-2 shadow"
          >
            <Download className="w-4 h-4 text-emerald-400" /> Export CSV
          </button>
          <button
            onClick={onNavigateToPOS}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> New Sale (POS)
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg flex items-center justify-between">
          <div>
            <span className="text-[11px] text-slate-400 font-medium block">Total Invoices</span>
            <span className="text-xl font-black text-slate-100 font-mono mt-0.5 block">{totalSalesCount} Orders</span>
          </div>
          <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/20">
            <FileText className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg flex items-center justify-between">
          <div>
            <span className="text-[11px] text-slate-400 font-medium block">Total Sales Volume</span>
            <span className="text-xl font-black text-emerald-400 font-mono mt-0.5 block">
              {currency}{totalGrandTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg flex items-center justify-between">
          <div>
            <span className="text-[11px] text-slate-400 font-medium block">Collected Cash</span>
            <span className="text-xl font-black text-blue-400 font-mono mt-0.5 block">
              {currency}{totalPaidAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className="p-3 bg-blue-500/10 text-blue-400 rounded-xl border border-blue-500/20">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg flex items-center justify-between">
          <div>
            <span className="text-[11px] text-slate-400 font-medium block">Outstanding Due</span>
            <span className="text-xl font-black text-rose-400 font-mono mt-0.5 block">
              {currency}{totalDueAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className="p-3 bg-rose-500/10 text-rose-400 rounded-xl border border-rose-500/20">
            <AlertCircle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filters & Search Control Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search Box */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Invoice #, Customer Name, or Phone..."
              className="w-full bg-slate-950 text-slate-100 text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-700/80 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Payment Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="bg-slate-950 text-slate-200 text-xs font-semibold p-2 rounded-xl border border-slate-700/80 focus:outline-none"
          >
            <option value="ALL">All Payment Statuses</option>
            <option value="PAID">Paid</option>
            <option value="PARTIAL">Partial</option>
            <option value="DUE">Due</option>
          </select>

          {/* Payment Method Filter */}
          <select
            value={paymentMethodFilter}
            onChange={(e) => setPaymentMethodFilter(e.target.value)}
            className="bg-slate-950 text-slate-200 text-xs font-semibold p-2 rounded-xl border border-slate-700/80 focus:outline-none"
          >
            <option value="ALL">All Payment Methods</option>
            <option value="Cash">Cash</option>
            <option value="Bank">Bank Transfer</option>
            <option value="Mobile Banking">Mobile Banking</option>
            <option value="Card">Card</option>
          </select>

          {/* Date Filter */}
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value as any)}
            className="bg-slate-950 text-slate-200 text-xs font-semibold p-2 rounded-xl border border-slate-700/80 focus:outline-none"
          >
            <option value="ALL">All Time</option>
            <option value="TODAY">Today's Sales</option>
            <option value="THIS_MONTH">This Month's Sales</option>
          </select>
        </div>
      </div>

      {/* Sales Directory Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h2 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
            <Receipt className="w-4 h-4 text-indigo-400" /> Sales Invoice List ({filteredSales.length})
          </h2>
          {searchQuery && (
            <span className="text-xs text-slate-400">
              Found: <strong className="text-indigo-400">{filteredSales.length}</strong> invoices
            </span>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider font-bold border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Invoice #</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Items</th>
                <th className="py-3 px-4 text-right">Grand Total</th>
                <th className="py-3 px-4 text-right">Paid</th>
                <th className="py-3 px-4 text-right">Due</th>
                <th className="py-3 px-4 text-center">Payment Method</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filteredSales.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-500 text-xs">
                    No sales records found.
                  </td>
                </tr>
              ) : (
                filteredSales.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-indigo-400">
                      {inv.invoiceNumber}
                    </td>
                    <td className="py-3 px-4 text-slate-400 whitespace-nowrap">
                      {new Date(inv.date).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-100">{inv.customerName}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{inv.customerPhone}</div>
                    </td>
                    <td className="py-3 px-4 max-w-xs">
                      <div className="text-slate-300 font-medium truncate">
                        {inv.items.map((it) => `${it.productName} (${it.quantity})`).join(', ')}
                      </div>
                      <div className="text-[10px] text-slate-500">{inv.items.length} Items</div>
                    </td>
                    <td className="py-3 px-4 text-right font-bold font-mono text-slate-100">
                      {currency}{inv.grandTotal.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-right font-bold font-mono text-emerald-400">
                      {currency}{inv.paidAmount.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-right font-bold font-mono text-rose-400">
                      {inv.dueAmount > 0 ? `${currency}${inv.dueAmount.toFixed(2)}` : `${currency}0.00`}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700 text-[10px] font-semibold">
                        {inv.paymentMethod}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      {inv.paymentStatus === 'PAID' ? (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                          PAID
                        </span>
                      ) : inv.paymentStatus === 'PARTIAL' ? (
                        <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 text-[10px] font-bold">
                          PARTIAL
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/30 text-[10px] font-bold">
                          DUE
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => onViewInvoice(inv)}
                          className="p-1.5 bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white rounded-lg transition-colors"
                          title="View & Print Invoice"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {inv.dueAmount > 0 && onReceiveDuePayment && (
                          <button
                            onClick={() => {
                              setSelectedInvoiceForDue(inv);
                              setDuePayAmount(inv.dueAmount.toString());
                            }}
                            className="px-2 py-1 bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-slate-950 font-bold text-[10px] rounded-lg transition-colors flex items-center gap-1"
                            title="Collect Due Payment"
                          >
                            <DollarSign className="w-3 h-3" /> Collect Due
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

      {/* Due Payment Modal */}
      {selectedInvoiceForDue && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-slate-100 text-sm">Receive Due Payment</h3>
              </div>
              <button
                onClick={() => setSelectedInvoiceForDue(null)}
                className="text-slate-400 hover:text-white text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Invoice Number:</span>
                <span className="font-bold text-indigo-400 font-mono">{selectedInvoiceForDue.invoiceNumber}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Customer:</span>
                <span className="font-bold text-slate-200">{selectedInvoiceForDue.customerName}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Current Due:</span>
                <span className="font-bold text-rose-400 font-mono">{currency}{selectedInvoiceForDue.dueAmount.toFixed(2)}</span>
              </div>
            </div>

            <form onSubmit={handleCollectDue} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 font-bold mb-1">Payment Amount ({currency}):</label>
                <input
                  type="number"
                  step="any"
                  max={selectedInvoiceForDue.dueAmount}
                  value={duePayAmount}
                  onChange={(e) => setDuePayAmount(e.target.value)}
                  className="w-full bg-slate-950 text-emerald-400 font-bold p-2.5 rounded-xl border border-slate-700 text-sm focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">Payment Method:</label>
                <select
                  value={duePayMethod}
                  onChange={(e) => setDuePayMethod(e.target.value as PaymentMethod)}
                  className="w-full bg-slate-950 text-slate-200 p-2.5 rounded-xl border border-slate-700 font-semibold focus:outline-none"
                >
                  <option value="Cash">Cash</option>
                  <option value="Bank">Bank Transfer</option>
                  <option value="Mobile Banking">Mobile Banking</option>
                  <option value="Card">Card</option>
                </select>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedInvoiceForDue(null)}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-600/30"
                >
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
