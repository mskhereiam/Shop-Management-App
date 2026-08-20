import React, { useState } from 'react';
import {
  FileText,
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
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
  Plus,
  X,
  PlusCircle,
  Save
} from 'lucide-react';
import { SaleInvoice, ShopSettings, PaymentMethod, Customer, Product, SaleItem } from '../types';
import { ConfirmDialog } from './ConfirmDialog';

interface SalesDirectoryViewProps {
  sales: SaleInvoice[];
  settings: ShopSettings;
  products?: Product[];
  customers?: Customer[];
  onViewInvoice: (invoice: SaleInvoice) => void;
  onReceiveDuePayment?: (invoiceId: string, amount: number, paymentMethod: PaymentMethod) => void;
  onDeleteInvoice?: (invoiceId: string) => void;
  onUpdateInvoice?: (invoice: SaleInvoice) => void;
  onNavigateToPOS: () => void;
}

export const SalesDirectoryView: React.FC<SalesDirectoryViewProps> = ({
  sales,
  settings,
  products = [],
  customers = [],
  onViewInvoice,
  onReceiveDuePayment,
  onDeleteInvoice,
  onUpdateInvoice,
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

  // Edit Invoice Modal state
  const [editingInvoice, setEditingInvoice] = useState<SaleInvoice | null>(null);
  const [editCustomerName, setEditCustomerName] = useState('');
  const [editCustomerPhone, setEditCustomerPhone] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editItems, setEditItems] = useState<SaleItem[]>([]);
  const [editDiscount, setEditDiscount] = useState<number>(0);
  const [editTaxRate, setEditTaxRate] = useState<number>(0);
  const [editShipping, setEditShipping] = useState<number>(0);
  const [editPaidAmount, setEditPaidAmount] = useState<number>(0);
  const [editPaymentMethod, setEditPaymentMethod] = useState<PaymentMethod>('Cash');
  const [editNotes, setEditNotes] = useState('');
  const [selectedAddProductId, setSelectedAddProductId] = useState('');

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
      alert('সঠিক পেমেন্ট পরিমাণ লিখুন।');
      return;
    }

    if (payVal > selectedInvoiceForDue.dueAmount) {
      alert(`পেমেন্ট পরিমাণ বর্তমান বকেয়া (${currency}${selectedInvoiceForDue.dueAmount.toFixed(2)}) এর চেয়ে বেশি হতে পারে না।`);
      return;
    }

    if (onReceiveDuePayment) {
      onReceiveDuePayment(selectedInvoiceForDue.id, payVal, duePayMethod);
    }

    setSelectedInvoiceForDue(null);
    setDuePayAmount('');
  };

  // Open Edit Modal
  const handleOpenEdit = (inv: SaleInvoice) => {
    setEditingInvoice(inv);
    setEditCustomerName(inv.customerName);
    setEditCustomerPhone(inv.customerPhone);
    setEditDate(inv.date.split('T')[0]);
    setEditItems([...inv.items]);
    setEditDiscount(inv.discount || 0);
    setEditTaxRate(inv.taxRate || 0);
    setEditShipping(inv.shipping || 0);
    setEditPaidAmount(inv.paidAmount || 0);
    setEditPaymentMethod(inv.paymentMethod || 'Cash');
    setEditNotes(inv.notes || '');
    if (products.length > 0) {
      setSelectedAddProductId(products[0].id);
    }
  };

  // Edit item quantity/price
  const handleUpdateItemQuantity = (index: number, qty: number) => {
    if (qty <= 0) return;
    setEditItems((prev) => {
      const copy = [...prev];
      copy[index] = {
        ...copy[index],
        quantity: qty,
        totalPrice: qty * copy[index].unitPrice
      };
      return copy;
    });
  };

  const handleUpdateItemPrice = (index: number, price: number) => {
    if (price < 0) return;
    setEditItems((prev) => {
      const copy = [...prev];
      copy[index] = {
        ...copy[index],
        unitPrice: price,
        totalPrice: copy[index].quantity * price
      };
      return copy;
    });
  };

  const handleRemoveItem = (index: number) => {
    setEditItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddItemToInvoice = () => {
    const prod = products.find((p) => p.id === selectedAddProductId);
    if (!prod) return;

    const existingIndex = editItems.findIndex((it) => it.productId === prod.id);
    if (existingIndex >= 0) {
      handleUpdateItemQuantity(existingIndex, editItems[existingIndex].quantity + 1);
    } else {
      setEditItems((prev) => [
        ...prev,
        {
          productId: prod.id,
          productName: prod.name,
          barcode: prod.barcode || '',
          quantity: 1,
          unitPrice: prod.salePrice || 0,
          totalPrice: prod.salePrice || 0
        }
      ]);
    }
  };

  // Calculations for Edit Modal
  const editSubtotal = editItems.reduce((acc, it) => acc + it.totalPrice, 0);
  const editTaxAmount = (editSubtotal * editTaxRate) / 100;
  const editGrandTotal = Math.max(0, editSubtotal - editDiscount + editTaxAmount + editShipping);
  const editDueAmount = Math.max(0, editGrandTotal - editPaidAmount);
  const editPaymentStatus: 'PAID' | 'PARTIAL' | 'DUE' =
    editDueAmount === 0 ? 'PAID' : editPaidAmount > 0 ? 'PARTIAL' : 'DUE';

  const handleSaveEditedInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingInvoice) return;
    if (editItems.length === 0) {
      alert('ইনভয়েসে কমপক্ষে একটি পণ্য যোগ করুন।');
      return;
    }

    const updatedInvoice: SaleInvoice = {
      ...editingInvoice,
      customerName: editCustomerName.trim() || 'General Customer',
      customerPhone: editCustomerPhone.trim(),
      date: new Date(editDate || editingInvoice.date).toISOString(),
      items: editItems,
      subtotal: editSubtotal,
      discount: editDiscount,
      taxRate: editTaxRate,
      taxAmount: editTaxAmount,
      shipping: editShipping,
      grandTotal: editGrandTotal,
      paidAmount: editPaidAmount,
      dueAmount: editDueAmount,
      paymentMethod: editPaymentMethod,
      paymentStatus: editPaymentStatus,
      notes: editNotes
    };

    if (onUpdateInvoice) {
      onUpdateInvoice(updatedInvoice);
    }
    setEditingInvoice(null);
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
              <h1 className="text-lg font-bold text-slate-100">বিক্রয় ও সেলস রেজিস্ট্রি (Sales Directory)</h1>
              <p className="text-xs text-slate-400">সকল বিক্রয় ইনভয়েস দেখা, এডিট ও মডিফাই করা, বাকি আদায় এবং ফিল্টারিং ব্যবস্থা</p>
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
            <Plus className="w-4 h-4" /> নতুন বিক্রয় (POS)
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg flex items-center justify-between">
          <div>
            <span className="text-[11px] text-slate-400 font-medium block">মোট ইনভয়েস</span>
            <span className="text-xl font-black text-slate-100 font-mono mt-0.5 block">{totalSalesCount} টি</span>
          </div>
          <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/20">
            <FileText className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg flex items-center justify-between">
          <div>
            <span className="text-[11px] text-slate-400 font-medium block">মোট বিক্রয় ভলিউম</span>
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
            <span className="text-[11px] text-slate-400 font-medium block">সংগৃহীত ক্যাশ</span>
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
            <span className="text-[11px] text-slate-400 font-medium block">বকেয়া / বাকি</span>
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
              placeholder="ইনভয়েস #, কাস্টমার নাম, বা ফোন..."
              className="w-full bg-slate-950 text-slate-100 text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-700/80 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Payment Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="bg-slate-950 text-slate-200 text-xs font-semibold p-2 rounded-xl border border-slate-700/80 focus:outline-none"
          >
            <option value="ALL">সকল পেমেন্ট স্ট্যাটাস</option>
            <option value="PAID">পরিশোধিত (Paid)</option>
            <option value="PARTIAL">আংশিক (Partial)</option>
            <option value="DUE">বকেয়া (Due)</option>
          </select>

          {/* Payment Method Filter */}
          <select
            value={paymentMethodFilter}
            onChange={(e) => setPaymentMethodFilter(e.target.value)}
            className="bg-slate-950 text-slate-200 text-xs font-semibold p-2 rounded-xl border border-slate-700/80 focus:outline-none"
          >
            <option value="ALL">সকল পেমেন্ট মাধ্যম</option>
            <option value="Cash">ক্যাশ (Cash)</option>
            <option value="Bank">ব্যাংক (Bank)</option>
            <option value="Mobile Banking">মোবাইল ব্যাংকিং (bKash/Nagad)</option>
            <option value="Card">কার্ড (Card)</option>
          </select>

          {/* Date Filter */}
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value as any)}
            className="bg-slate-950 text-slate-200 text-xs font-semibold p-2 rounded-xl border border-slate-700/80 focus:outline-none"
          >
            <option value="ALL">সকল সময় (All Time)</option>
            <option value="TODAY">আজকের বিক্রয় (Today)</option>
            <option value="THIS_MONTH">চলতি মাস (This Month)</option>
          </select>
        </div>
      </div>

      {/* Sales Directory Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h2 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
            <Receipt className="w-4 h-4 text-indigo-400" /> সেলস ইনভয়েস তালিকা ({filteredSales.length})
          </h2>
          {searchQuery && (
            <span className="text-xs text-slate-400">
              ফলাফল: <strong className="text-indigo-400">{filteredSales.length}</strong> টি ইনভয়েস
            </span>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider font-bold border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">ইনভয়েস #</th>
                <th className="py-3 px-4">তারিখ</th>
                <th className="py-3 px-4">কাস্টমার</th>
                <th className="py-3 px-4">পণ্যসমূহ</th>
                <th className="py-3 px-4 text-right">মোট বিল</th>
                <th className="py-3 px-4 text-right">জমা</th>
                <th className="py-3 px-4 text-right">বাকি</th>
                <th className="py-3 px-4 text-center">মাধ্যম</th>
                <th className="py-3 px-4 text-center">স্ট্যাটাস</th>
                <th className="py-3 px-4 text-right">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filteredSales.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-500 text-xs">
                    কোনো বিক্রয় রেকর্ড পাওয়া যায়নি।
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
                      <div className="text-[10px] text-slate-400 font-mono">{inv.customerPhone || 'N/A'}</div>
                    </td>
                    <td className="py-3 px-4 max-w-xs">
                      <div className="text-slate-300 font-medium truncate">
                        {inv.items.map((it) => `${it.productName} (${it.quantity})`).join(', ')}
                      </div>
                      <div className="text-[10px] text-slate-500">{inv.items.length} টি পণ্য</div>
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
                        {/* View Invoice */}
                        <button
                          onClick={() => onViewInvoice(inv)}
                          className="p-1.5 bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white rounded-lg transition-colors"
                          title="ইনভয়েস দেখুন ও প্রিন্ট করুন"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        {/* Edit Invoice */}
                        {onUpdateInvoice && (
                          <button
                            onClick={() => handleOpenEdit(inv)}
                            className="p-1.5 bg-blue-600/20 hover:bg-blue-600 text-blue-300 hover:text-white rounded-lg transition-colors"
                            title="ইনভয়েস এডিট করুন"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {/* Due Collection */}
                        {inv.dueAmount > 0 && onReceiveDuePayment && (
                          <button
                            onClick={() => {
                              setSelectedInvoiceForDue(inv);
                              setDuePayAmount(inv.dueAmount.toString());
                            }}
                            className="px-2 py-1 bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-slate-950 font-bold text-[10px] rounded-lg transition-colors flex items-center gap-1"
                            title="বাকি আদায় করুন"
                          >
                            <DollarSign className="w-3 h-3" /> বাকি আদায়
                          </button>
                        )}

                        {/* Delete Invoice */}
                        {onDeleteInvoice && (
                          <button
                            onClick={() => setDeletingInvoice(inv)}
                            className="p-1.5 bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white rounded-lg transition-colors"
                            title="ইনভয়েস মুছুন"
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

      {/* Due Payment Modal */}
      {selectedInvoiceForDue && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-slate-100 text-sm">বাকি টাকা আদায় (Receive Due Payment)</h3>
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
                <span>ইনভয়েস নম্বর:</span>
                <span className="font-bold text-indigo-400 font-mono">{selectedInvoiceForDue.invoiceNumber}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>কাস্টমার:</span>
                <span className="font-bold text-slate-200">{selectedInvoiceForDue.customerName}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>বর্তমান বকেয়া:</span>
                <span className="font-bold text-rose-400 font-mono">{currency}{selectedInvoiceForDue.dueAmount.toFixed(2)}</span>
              </div>
            </div>

            <form onSubmit={handleCollectDue} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 font-bold mb-1">পেমেন্ট পরিমাণ ({currency}):</label>
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
                <label className="block text-slate-400 font-bold mb-1">পেমেন্ট মাধ্যম:</label>
                <select
                  value={duePayMethod}
                  onChange={(e) => setDuePayMethod(e.target.value as PaymentMethod)}
                  className="w-full bg-slate-950 text-slate-200 p-2.5 rounded-xl border border-slate-700 font-semibold focus:outline-none"
                >
                  <option value="Cash">ক্যাশ (Cash)</option>
                  <option value="Bank">ব্যাংক ট্রান্সফার (Bank)</option>
                  <option value="Mobile Banking">মোবাইল ব্যাংকিং (bKash/Nagad)</option>
                  <option value="Card">কার্ড (Card)</option>
                </select>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedInvoiceForDue(null)}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-600/30"
                >
                  পেমেন্ট গ্রহণ করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Invoice Modal */}
      {editingInvoice && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-3xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto custom-scrollbar animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
                  <Edit className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-100 text-sm">বিক্রয় ইনভয়েস এডিট করুন</h3>
                  <p className="text-[11px] text-slate-400">ইনভয়েস #{editingInvoice.invoiceNumber} এর পণ্য, মূল্য ও পেমেন্ট আপডেট</p>
                </div>
              </div>
              <button
                onClick={() => setEditingInvoice(null)}
                className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEditedInvoice} className="space-y-4 text-xs">
              {/* Customer & Date Info */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-950 p-3.5 rounded-2xl border border-slate-800">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">কাস্টমার নাম</label>
                  <input
                    type="text"
                    value={editCustomerName}
                    onChange={(e) => setEditCustomerName(e.target.value)}
                    className="w-full bg-slate-900 text-slate-100 p-2 rounded-xl border border-slate-700 focus:outline-none focus:border-indigo-500 font-semibold"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-bold mb-1">কাস্টমার ফোন</label>
                  <input
                    type="text"
                    value={editCustomerPhone}
                    onChange={(e) => setEditCustomerPhone(e.target.value)}
                    className="w-full bg-slate-900 text-slate-100 p-2 rounded-xl border border-slate-700 focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-bold mb-1">তারিখ</label>
                  <input
                    type="date"
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                    className="w-full bg-slate-900 text-slate-100 p-2 rounded-xl border border-slate-700 focus:outline-none focus:border-indigo-500 font-mono"
                    required
                  />
                </div>
              </div>

              {/* Items Section */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-slate-300 font-bold flex items-center gap-1.5">
                    <ShoppingBag className="w-3.5 h-3.5 text-indigo-400" />
                    ইনভয়েসের পণ্য তালিকা ({editItems.length})
                  </label>

                  {/* Add Product Dropdown */}
                  {products.length > 0 && (
                    <div className="flex items-center gap-2">
                      <select
                        value={selectedAddProductId}
                        onChange={(e) => setSelectedAddProductId(e.target.value)}
                        className="bg-slate-950 text-slate-200 text-xs p-1.5 rounded-xl border border-slate-700 focus:outline-none"
                      >
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} ({currency}{p.salePrice})
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={handleAddItemToInvoice}
                        className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[11px] rounded-xl flex items-center gap-1 shadow"
                      >
                        <Plus className="w-3 h-3" /> পণ্য যোগ করুন
                      </button>
                    </div>
                  )}
                </div>

                {/* Items Table */}
                <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-slate-900 text-slate-400 uppercase text-[10px] font-bold border-b border-slate-800">
                      <tr>
                        <th className="p-2.5">পণ্য</th>
                        <th className="p-2.5 text-center w-28">পরিমাণ</th>
                        <th className="p-2.5 text-right w-28">একক মূল্য ({currency})</th>
                        <th className="p-2.5 text-right w-28">মোট ({currency})</th>
                        <th className="p-2.5 text-center w-12">মুছুন</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {editItems.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-900/40">
                          <td className="p-2.5 font-bold text-slate-200">{item.productName}</td>
                          <td className="p-2.5 text-center">
                            <input
                              type="number"
                              min="1"
                              step="any"
                              value={item.quantity}
                              onChange={(e) => handleUpdateItemQuantity(idx, parseFloat(e.target.value) || 1)}
                              className="w-20 bg-slate-900 text-center font-bold text-slate-100 p-1 rounded-lg border border-slate-700"
                            />
                          </td>
                          <td className="p-2.5 text-right">
                            <input
                              type="number"
                              min="0"
                              step="any"
                              value={item.unitPrice}
                              onChange={(e) => handleUpdateItemPrice(idx, parseFloat(e.target.value) || 0)}
                              className="w-24 bg-slate-900 text-right font-bold text-slate-100 p-1 rounded-lg border border-slate-700"
                            />
                          </td>
                          <td className="p-2.5 text-right font-bold font-mono text-emerald-400">
                            {currency}{item.totalPrice.toFixed(2)}
                          </td>
                          <td className="p-2.5 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(idx)}
                              className="p-1 text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 rounded"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Financial Calculations */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-950 p-4 rounded-2xl border border-slate-800">
                <div className="space-y-2.5">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-slate-400 font-bold mb-1">ডিসকাউন্ট ({currency})</label>
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={editDiscount}
                        onChange={(e) => setEditDiscount(parseFloat(e.target.value) || 0)}
                        className="w-full bg-slate-900 text-slate-100 p-2 rounded-xl border border-slate-700 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 font-bold mb-1">ভ্যাট / ট্যাক্স (%)</label>
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={editTaxRate}
                        onChange={(e) => setEditTaxRate(parseFloat(e.target.value) || 0)}
                        className="w-full bg-slate-900 text-slate-100 p-2 rounded-xl border border-slate-700 font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-slate-400 font-bold mb-1">ডেলিভারি / শিপিং ({currency})</label>
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={editShipping}
                        onChange={(e) => setEditShipping(parseFloat(e.target.value) || 0)}
                        className="w-full bg-slate-900 text-slate-100 p-2 rounded-xl border border-slate-700 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 font-bold mb-1">পেমেন্ট মাধ্যম</label>
                      <select
                        value={editPaymentMethod}
                        onChange={(e) => setEditPaymentMethod(e.target.value as PaymentMethod)}
                        className="w-full bg-slate-900 text-slate-100 p-2 rounded-xl border border-slate-700 font-semibold"
                      >
                        <option value="Cash">ক্যাশ (Cash)</option>
                        <option value="Bank">ব্যাংক (Bank)</option>
                        <option value="Mobile Banking">মোবাইল ব্যাংকিং</option>
                        <option value="Card">কার্ড (Card)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-400 font-bold mb-1">নোট / মন্তব্য</label>
                    <input
                      type="text"
                      value={editNotes}
                      onChange={(e) => setEditNotes(e.target.value)}
                      placeholder="অর্ডার বা ইনভয়েস সংক্রান্ত বিশেষ নোট..."
                      className="w-full bg-slate-900 text-slate-100 p-2 rounded-xl border border-slate-700"
                    />
                  </div>
                </div>

                {/* Summary Box */}
                <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 flex flex-col justify-between space-y-2">
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-slate-400">
                      <span>সাবটোটাল:</span>
                      <span className="font-mono text-slate-200">{currency}{editSubtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>ডিসকাউন্ট:</span>
                      <span className="font-mono text-rose-400">-{currency}{editDiscount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>ট্যাক্স ({editTaxRate}%):</span>
                      <span className="font-mono text-slate-200">+{currency}{editTaxAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>শিপিং:</span>
                      <span className="font-mono text-slate-200">+{currency}{editShipping.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-slate-100 font-bold border-t border-slate-800 pt-1.5 text-sm">
                      <span>সর্বমোট বিল (Grand Total):</span>
                      <span className="font-mono text-indigo-400">{currency}{editGrandTotal.toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-slate-300 font-bold">পরিশোধিত টাকা (Paid Amount):</label>
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={editPaidAmount}
                        onChange={(e) => setEditPaidAmount(parseFloat(e.target.value) || 0)}
                        className="w-32 bg-slate-950 text-right text-emerald-400 font-mono font-bold p-1.5 rounded-lg border border-slate-700"
                      />
                    </div>
                    <div className="flex justify-between items-center text-xs font-bold">
                      <span className="text-slate-400">বকেয়া / বাকি (Due):</span>
                      <span className="text-rose-400 font-mono text-sm">{currency}{editDueAmount.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingInvoice(null)}
                  className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold rounded-xl shadow-lg shadow-blue-600/30 flex items-center gap-2"
                >
                  <Save className="w-4 h-4" /> পরিবর্তন সংরক্ষণ করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deletingInvoice}
        title="বিক্রয় ইনভয়েস মুছে ফেলতে নিশ্চিত?"
        message={`আপনি কি ইনভয়েস #${deletingInvoice?.invoiceNumber} (${currency}${deletingInvoice?.grandTotal.toFixed(2)}) নিশ্চিতভাবে মুছে ফেলতে চান? এটি স্টক ও অ্যাকাউন্টিং রিভার্স করবে।`}
        confirmLabel="হ্যাঁ, মুছুন"
        cancelLabel="না, বাতিল"
        variant="danger"
        onConfirm={() => {
          if (deletingInvoice && onDeleteInvoice) {
            onDeleteInvoice(deletingInvoice.id);
          }
          setDeletingInvoice(null);
        }}
        onCancel={() => setDeletingInvoice(null)}
      />
    </div>
  );
};
