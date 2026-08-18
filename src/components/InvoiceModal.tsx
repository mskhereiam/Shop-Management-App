import React from 'react';
import { X, Printer, CheckCircle, Phone, Mail, MapPin, QrCode } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { SaleInvoice, ShopSettings } from '../types';

interface InvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: SaleInvoice | null;
  settings: ShopSettings;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({
  isOpen,
  onClose,
  invoice,
  settings
}) => {
  if (!isOpen || !invoice) return null;

  const handlePrint = () => {
    window.print();
  };

  const currency = settings.currencySymbol || '৳';

  const qrData = JSON.stringify({
    invoiceNumber: invoice.invoiceNumber,
    date: new Date(invoice.date).toISOString().split('T')[0],
    customer: invoice.customerName,
    grandTotal: `${currency}${invoice.grandTotal.toFixed(2)}`,
    status: invoice.paymentStatus,
    company: settings.companyName || 'One Studio Codes'
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in">
      {/* Print CSS Styles specifically injected for A4 Paper */}
      <style>{`
        @media print {
          /* Hide all non-printable elements */
          body * {
            visibility: hidden !important;
          }
          .no-print, .no-print * {
            display: none !important;
          }
          
          /* Show only printable invoice */
          #printable-invoice, #printable-invoice * {
            visibility: visible !important;
          }
          
          #printable-invoice {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            margin: 0 !important;
            background: #ffffff !important;
            color: #000000 !important;
            box-shadow: none !important;
            border: none !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            width: 100% !important;
            max-width: 100% !important;
            padding: 10mm !important;
            font-family: system-ui, -apple-system, sans-serif !important;
          }

          @page {
            size: A4 portrait;
            margin: 10mm;
          }
        }
      `}</style>

      <div className="w-full max-w-3xl bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header Bar */}
        <div className="px-4 sm:px-6 py-3.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between gap-2 no-print">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-400" />
            <span className="text-sm font-bold text-slate-100 hidden sm:inline">Sale Invoice (A4)</span>
            <span className="text-xs bg-emerald-950 text-emerald-300 border border-emerald-800/60 font-bold px-2.5 py-0.5 rounded-full">
              {invoice.invoiceNumber}
            </span>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg transition-all"
            >
              <Printer className="w-4 h-4" /> Print A4 Invoice
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-100 bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Invoice Preview Container */}
        <div className="p-4 sm:p-6 overflow-y-auto bg-slate-950 flex justify-center custom-scrollbar">
          {/* STANDARD A4 PRINTABLE SHEET */}
          <div
            id="printable-invoice"
            className="w-full bg-white text-slate-900 rounded-2xl p-6 sm:p-8 shadow-xl"
          >
            {/* Shop Header */}
            <div className="flex flex-col sm:flex-row justify-between border-b-2 border-slate-200 pb-6 gap-4">
              <div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">{settings.companyName || 'ShopMind AI'}</h2>
                <p className="text-xs text-slate-600 mt-1 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" /> {settings.address}
                </p>
                <p className="text-xs text-slate-600 flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-slate-400" /> {settings.phone} | <Mail className="w-3.5 h-3.5 text-slate-400" /> {settings.email}
                </p>
                {settings.taxNumber && (
                  <p className="text-[11px] font-semibold text-slate-500 mt-1">Tax Reg #: {settings.taxNumber}</p>
                )}
              </div>
              <div className="text-left sm:text-right flex flex-col sm:items-end">
                <div className="text-xl font-black text-slate-800">{invoice.invoiceNumber}</div>
                <div className="text-xs text-slate-500 font-medium mt-0.5">
                  Date: {new Date(invoice.date).toLocaleString()}
                </div>
                <div className="text-xs text-slate-500 font-medium">
                  Cashier: {invoice.soldBy || 'Admin'}
                </div>
              </div>
            </div>

            {/* Customer Info Box */}
            <div className="my-6 p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row justify-between text-xs gap-3">
              <div>
                <span className="font-bold text-slate-500 uppercase tracking-wider block mb-1">Billed To:</span>
                <span className="font-extrabold text-sm text-slate-900 block">{invoice.customerName}</span>
                <span className="text-slate-600 block mt-0.5">Phone: {invoice.customerPhone}</span>
              </div>
              <div className="text-left sm:text-right">
                <span className="font-bold text-slate-500 uppercase tracking-wider block mb-1">Payment Details:</span>
                <span className="font-bold text-slate-800 block">Method: {invoice.paymentMethod}</span>
                <span className={`inline-block font-black px-2 py-0.5 rounded text-[10px] mt-1 ${
                  invoice.paymentStatus === 'PAID' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                }`}>
                  Status: {invoice.paymentStatus}
                </span>
              </div>
            </div>

            {/* Line Items Table */}
            <div className="overflow-x-auto my-6">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b-2 border-slate-300 bg-slate-100 text-slate-700 font-bold uppercase tracking-wider">
                    <th className="py-2.5 px-3">#</th>
                    <th className="py-2.5 px-3">Item Description</th>
                    <th className="py-2.5 px-3 text-center">Qty</th>
                    <th className="py-2.5 px-3 text-right">Unit Price</th>
                    <th className="py-2.5 px-3 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {invoice.items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 text-slate-500 font-medium">{idx + 1}</td>
                      <td className="py-2.5 px-3 font-semibold text-slate-900">{item.productName}</td>
                      <td className="py-2.5 px-3 text-center font-bold text-slate-700">{item.quantity}</td>
                      <td className="py-2.5 px-3 text-right font-medium text-slate-700">{currency}{item.unitPrice.toFixed(2)}</td>
                      <td className="py-2.5 px-3 text-right font-extrabold text-slate-900">{currency}{item.totalPrice.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals Summary */}
            <div className="flex flex-col sm:flex-row justify-between items-start pt-4 border-t-2 border-slate-200 gap-6">
              <div className="max-w-xs text-xs text-slate-600 space-y-3">
                <div>
                  <span className="font-bold text-slate-800 block mb-1">Notes / Terms:</span>
                  <p className="italic bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                    {settings.invoiceFooterMessage || 'Thank you for your business! Items can be returned within 14 days with original receipt.'}
                  </p>
                </div>

                <div className="flex items-center gap-3 p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="p-1.5 bg-white rounded-lg border border-slate-300 shadow-sm shrink-0">
                    <QRCodeSVG value={qrData} size={64} level="M" />
                  </div>
                  <div>
                    <span className="font-bold text-slate-900 text-[11px] flex items-center gap-1">
                      <QrCode className="w-3.5 h-3.5 text-indigo-600" /> Quick Scan Verification
                    </span>
                    <span className="text-[10px] text-slate-500 block mt-0.5">
                      Scan with any camera to instantly check receipt authenticity, invoice number, and payment status.
                    </span>
                  </div>
                </div>
              </div>

              <div className="w-full sm:w-64 space-y-1.5 text-xs text-slate-700 font-semibold">
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span>Subtotal:</span>
                  <span>{currency}{invoice.subtotal.toFixed(2)}</span>
                </div>
                {invoice.discount > 0 && (
                  <div className="flex justify-between py-1 text-rose-600 border-b border-slate-100">
                    <span>Discount:</span>
                    <span>-{currency}{invoice.discount.toFixed(2)}</span>
                  </div>
                )}
                {invoice.taxAmount > 0 && (
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span>Tax / VAT ({invoice.taxRate}%):</span>
                    <span>+{currency}{invoice.taxAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between py-2 text-base font-black text-slate-900 border-t-2 border-slate-900">
                  <span>Grand Total:</span>
                  <span>{currency}{invoice.grandTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between py-1 text-emerald-700">
                  <span>Paid Amount:</span>
                  <span>{currency}{invoice.paidAmount.toFixed(2)}</span>
                </div>
                {invoice.dueAmount > 0 && (
                  <div className="flex justify-between py-1 text-rose-700 font-bold bg-rose-50 p-1.5 rounded">
                    <span>Due Balance:</span>
                    <span>{currency}{invoice.dueAmount.toFixed(2)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Barcode / Footer */}
            <div className="mt-8 pt-6 border-t border-slate-200 flex flex-col items-center justify-center text-center">
              <div className="font-mono text-xs font-bold tracking-widest text-slate-800 bg-slate-100 px-4 py-1.5 rounded-md border border-slate-300">
                ||| |||| || ||||| ||| |||| {invoice.invoiceNumber}
              </div>
              <p className="text-[10px] text-slate-400 mt-2">Powered by ShopMind AI POS System</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};


