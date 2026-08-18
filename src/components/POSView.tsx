import React, { useState } from 'react';
import {
  Search,
  ScanBarcode,
  Plus,
  Minus,
  Trash2,
  UserPlus,
  CreditCard,
  Wallet,
  Building2,
  Smartphone,
  CheckCircle2,
  DollarSign,
  Tag,
  Percent,
  Sparkles,
  ShoppingBag,
  UserCheck,
  Github
} from 'lucide-react';
import {
  Product,
  Category,
  Customer,
  SaleInvoice,
  SaleItem,
  PaymentMethod,
  ShopSettings
} from '../types';
import { isGitHubImageURL } from '../utils/githubImage';

interface POSViewProps {
  products: Product[];
  categories: Category[];
  customers: Customer[];
  settings: ShopSettings;
  onCompleteSale: (invoice: SaleInvoice, newCustomerCreated?: Customer) => void;
}

export const POSView: React.FC<POSViewProps> = ({
  products,
  categories,
  customers,
  settings,
  onCompleteSale
}) => {
  const currency = settings.currencySymbol || '৳';

  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [barcodeInput, setBarcodeInput] = useState<string>('');

  // Cart state
  const [cartItems, setCartItems] = useState<SaleItem[]>([]);

  // Customer state
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('cust-1'); // Walk-in Customer
  const [newCustomerName, setNewCustomerName] = useState<string>('');
  const [newCustomerPhone, setNewCustomerPhone] = useState<string>('');
  const [isAddingNewCust, setIsAddingNewCust] = useState<boolean>(false);

  // Discount & Tax & Shipping state
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [taxRate, setTaxRate] = useState<number>(settings.defaultTaxRate ?? 0);
  const [shippingCost, setShippingCost] = useState<number>(0);

  // Payment state
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Cash');
  const [paidAmount, setPaidAmount] = useState<string>('');

  // Confirmation modal state
  const [showConfirmSaleModal, setShowConfirmSaleModal] = useState<boolean>(false);

  // Barcode Handler
  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcodeInput.trim()) return;
    const found = products.find(
      (p) => p.barcode === barcodeInput.trim() || p.sku.toLowerCase() === barcodeInput.trim().toLowerCase()
    );
    if (found) {
      addToCart(found);
      setBarcodeInput('');
    } else {
      alert(`No product found with Barcode/SKU: ${barcodeInput}`);
    }
  };

  const addToCart = (product: Product) => {
    if (product.currentStock <= 0) {
      alert(`"${product.name}" is currently OUT OF STOCK!`);
      return;
    }

    const price = product.salePrice;

    setCartItems((prev) => {
      const existing = prev.find((item) => item.productId === product.id);
      if (existing) {
        if (existing.quantity + 1 > product.currentStock) {
          alert(`Cannot add more than available stock (${product.currentStock}).`);
          return prev;
        }
        return prev.map((item) =>
          item.productId === product.id
            ? { ...item, quantity: item.quantity + 1, totalPrice: (item.quantity + 1) * item.unitPrice }
            : item
        );
      }
      return [
        ...prev,
        {
          productId: product.id,
          productName: product.name,
          barcode: product.barcode,
          quantity: 1,
          unitPrice: price,
          totalPrice: price
        }
      ];
    });
  };

  const updateQuantity = (productId: string, delta: number) => {
    const product = products.find((p) => p.id === productId);
    setCartItems((prev) =>
      prev
        .map((item) => {
          if (item.productId === productId) {
            const newQty = item.quantity + delta;
            if (newQty <= 0) return null;
            if (product && newQty > product.currentStock) {
              alert(`Maximum available stock is ${product.currentStock}.`);
              return item;
            }
            return {
              ...item,
              quantity: newQty,
              totalPrice: newQty * item.unitPrice
            };
          }
          return item;
        })
        .filter(Boolean) as SaleItem[]
    );
  };

  const removeFromCart = (productId: string) => {
    setCartItems((prev) => prev.filter((item) => item.productId !== productId));
  };

  // Calculations
  const subtotal = cartItems.reduce((acc, item) => acc + item.totalPrice, 0);
  const taxAmount = (subtotal - discountAmount) * (taxRate / 100);
  const grandTotal = Math.max(0, subtotal - discountAmount + taxAmount + shippingCost);
  const paidVal = paidAmount === '' ? grandTotal : parseFloat(paidAmount) || 0;
  const dueVal = Math.max(0, grandTotal - paidVal);

  const handleCheckoutClick = () => {
    if (cartItems.length === 0) {
      alert('কার্ট খালি! সেল সম্পন্ন করতে অন্তত একটি প্রোডাক্ট যোগ করুন।');
      return;
    }

    if (isAddingNewCust && (!newCustomerName.trim() || !newCustomerPhone.trim())) {
      alert('নতুন কাস্টমারের নাম এবং ফোন নম্বর লিখুন।');
      return;
    }

    setShowConfirmSaleModal(true);
  };

  const handleConfirmSale = () => {
    let customerObj: Customer | undefined;
    let newCust: Customer | undefined;

    if (isAddingNewCust) {
      newCust = {
        id: `cust-${Date.now()}`,
        name: newCustomerName.trim(),
        phone: newCustomerPhone.trim(),
        email: `${newCustomerName.toLowerCase().replace(/\s+/g, '')}@customer.local`,
        notes: 'Automatically created from POS Checkout',
        totalSpent: grandTotal,
        dueAmount: dueVal,
        createdAt: new Date().toISOString().split('T')[0]
      };
      customerObj = newCust;
    } else {
      customerObj = customers.find((c) => c.id === selectedCustomerId);
      if (!customerObj) {
        customerObj = customers[0]; // Walk-in fallback
      }
    }

    const autoInvoiceNum = `INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const newInvoice: SaleInvoice = {
      id: `inv-${Date.now()}`,
      invoiceNumber: autoInvoiceNum,
      date: new Date().toISOString(),
      customerId: customerObj.id,
      customerName: customerObj.name,
      customerPhone: customerObj.phone,
      items: cartItems,
      subtotal,
      discount: discountAmount,
      taxRate,
      taxAmount,
      shipping: shippingCost,
      grandTotal,
      paidAmount: paidVal,
      dueAmount: dueVal,
      paymentMethod,
      paymentStatus: dueVal <= 0 ? 'PAID' : paidVal > 0 ? 'PARTIAL' : 'DUE',
      soldBy: 'Admin Cashier'
    };

    onCompleteSale(newInvoice, newCust);

    // Reset local state
    setCartItems([]);
    setDiscountAmount(0);
    setPaidAmount('');
    setIsAddingNewCust(false);
    setNewCustomerName('');
    setNewCustomerPhone('');
    setShowConfirmSaleModal(false);
  };

  const filteredProducts = products.filter((p) => {
    const matchesCat =
      selectedCategory === 'ALL' ||
      p.categoryId === selectedCategory ||
      p.subCategoryId === selectedCategory ||
      categories.filter((sc) => sc.parentId === selectedCategory).some((sc) => sc.id === p.subCategoryId || sc.id === p.categoryId);
    const q = searchQuery.toLowerCase().trim();
    const matchesQuery =
      !q ||
      p.name.toLowerCase().includes(q) ||
      p.barcode.includes(q) ||
      p.sku.toLowerCase().includes(q);
    return matchesCat && matchesQuery;
  });

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Left Column: Product Selection Grid */}
      <div className="lg:col-span-7 space-y-4">
        {/* Barcode & Search Controls */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3">
          <form onSubmit={handleBarcodeSubmit} className="flex gap-2">
            <div className="relative flex-1">
              <ScanBarcode className="absolute left-3 top-2.5 w-4 h-4 text-emerald-400" />
              <input
                type="text"
                value={barcodeInput}
                onChange={(e) => setBarcodeInput(e.target.value)}
                placeholder="Scan barcode or type SKU (e.g. 890123456701)..."
                className="w-full bg-slate-950 text-slate-100 text-xs font-mono pl-9 pr-3 py-2.5 rounded-xl border border-slate-700 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-md transition-all shrink-0"
            >
              Scan Barcode
            </button>
          </form>

          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search product title..."
              className="w-full bg-slate-800/80 text-slate-200 text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-700/60 focus:outline-none"
            />
          </div>

          {/* Category Filter Pills */}
          <div className="flex gap-2 overflow-x-auto pb-1 custom-scrollbar">
            <button
              onClick={() => setSelectedCategory('ALL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-colors ${
                selectedCategory === 'ALL'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              All Items
            </button>
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedCategory(c.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-colors ${
                  selectedCategory === c.id
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>

        {/* Product Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[62vh] overflow-y-auto p-1 custom-scrollbar">
          {filteredProducts.map((p) => (
            <div
              key={p.id}
              className="bg-slate-900 border border-slate-800 hover:border-indigo-500/50 rounded-2xl p-3 shadow-lg flex flex-col justify-between transition-all group relative overflow-hidden"
            >
              <div>
                <div className="relative h-28 rounded-xl overflow-hidden bg-slate-950 mb-2">
                  {p.image ? (
                    <img
                      src={p.image}
                      alt={p.name}
                      onError={(e) => {
                        e.currentTarget.src = 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=400&auto=format&fit=crop&q=80';
                      }}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs font-bold text-slate-500">
                      No Image
                    </div>
                  )}
                  {isGitHubImageURL(p.image) && (
                    <span
                      title="GitHub Repository Image"
                      className="absolute top-2 left-2 bg-slate-950/90 text-indigo-300 px-1.5 py-0.5 rounded-md text-[9px] font-bold border border-indigo-800/80 flex items-center gap-1 shadow-md"
                    >
                      <Github className="w-2.5 h-2.5 text-indigo-400" /> GitHub
                    </span>
                  )}
                  <span className={`absolute top-2 right-2 px-2 py-0.5 rounded-md text-[10px] font-extrabold ${
                    p.currentStock <= 0 ? 'bg-rose-500 text-white' : p.currentStock <= p.minStock ? 'bg-amber-500 text-slate-950' : 'bg-slate-900/80 text-emerald-400'
                  }`}>
                    Stock: {p.currentStock}
                  </span>
                </div>
                <h3 className="text-xs font-bold text-slate-100 line-clamp-2">{p.name}</h3>
                <div className="text-[10px] font-mono text-slate-400 mt-0.5">{p.barcode}</div>
              </div>

              <div className="mt-3 pt-2 border-t border-slate-800 flex items-center justify-between gap-1">
                <div>
                  <div className="text-xs font-black text-emerald-400">{currency}{p.salePrice.toFixed(2)}</div>
                </div>
                <button
                  onClick={() => addToCart(p)}
                  disabled={p.currentStock <= 0}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-bold text-xs rounded-lg shadow flex items-center gap-1"
                  title="Add to Cart"
                >
                  <Plus className="w-3 h-3" /> Add to Cart
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right Column: Active Cart & Invoice Checkout Panel */}
      <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-2xl flex flex-col justify-between space-y-4">
        {/* Customer Selector / Auto Customer Creator */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <UserCheck className="w-4 h-4 text-indigo-400" /> Customer Account
            </span>
            <button
              onClick={() => setIsAddingNewCust(!isAddingNewCust)}
              className="text-xs font-semibold text-emerald-400 hover:underline flex items-center gap-1"
            >
              {isAddingNewCust ? 'Select Existing' : '+ Auto New Customer'}
            </button>
          </div>

          {isAddingNewCust ? (
            <div className="p-3 bg-slate-950 border border-emerald-500/30 rounded-xl space-y-2 animate-in fade-in">
              <span className="text-[10px] text-emerald-400 font-bold block uppercase">First-time Customer Auto-Creation</span>
              <input
                type="text"
                placeholder="Full Name (e.g. Sarah Connor)"
                value={newCustomerName}
                onChange={(e) => setNewCustomerName(e.target.value)}
                className="w-full bg-slate-900 text-xs text-slate-100 p-2 rounded-lg border border-slate-700 focus:outline-none"
              />
              <input
                type="text"
                placeholder="Phone Number (e.g. +1 555-0992)"
                value={newCustomerPhone}
                onChange={(e) => setNewCustomerPhone(e.target.value)}
                className="w-full bg-slate-900 text-xs text-slate-100 p-2 rounded-lg border border-slate-700 focus:outline-none"
              />
            </div>
          ) : (
            <select
              value={selectedCustomerId}
              onChange={(e) => setSelectedCustomerId(e.target.value)}
              className="w-full bg-slate-950 text-xs font-semibold text-slate-200 p-2.5 rounded-xl border border-slate-700 focus:outline-none"
            >
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.phone}) {c.dueAmount > 0 ? `| Due: ${currency}${c.dueAmount}` : ''}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Cart Item List */}
        <div className="flex-1 max-h-60 overflow-y-auto space-y-2 border-y border-slate-800 py-3 custom-scrollbar">
          {cartItems.length === 0 ? (
            <div className="text-center py-10 text-xs text-slate-500">
              Cart is empty. Scan barcodes or click items on the left to build invoice.
            </div>
          ) : (
            cartItems.map((item) => (
              <div
                key={item.productId}
                className="p-2.5 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between text-xs"
              >
                <div className="flex-1 min-w-0 pr-2">
                  <div className="font-bold text-slate-200 truncate">{item.productName}</div>
                  <div className="text-[10px] text-slate-400 flex items-center gap-2">
                    <span>Unit Price: <strong className="text-slate-200 font-mono">{currency}{item.unitPrice.toFixed(2)}</strong></span>
                  </div>
                </div>

                {/* Quantity Controls */}
                <div className="flex items-center gap-1 bg-slate-900 border border-slate-700 rounded-lg p-0.5">
                  <button
                    onClick={() => updateQuantity(item.productId, -1)}
                    className="p-1 text-slate-400 hover:text-white"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="px-2 font-bold text-slate-100">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.productId, 1)}
                    className="p-1 text-slate-400 hover:text-white"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>

                <div className="text-right pl-3">
                  <div className="text-[9px] text-slate-400 font-medium">Total Amount</div>
                  <div className="font-bold text-emerald-400 font-mono">{currency}{item.totalPrice.toFixed(2)}</div>
                  <button
                    onClick={() => removeFromCart(item.productId)}
                    className="text-rose-400 hover:text-rose-300 text-[10px] font-semibold"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Calculation Summary & Payment Options */}
        <div className="space-y-2.5 text-xs text-slate-300 font-medium">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-slate-400 block mb-0.5 font-bold">Discount Amount ({currency}):</label>
              <input
                type="number"
                min="0"
                value={discountAmount || ''}
                onChange={(e) => setDiscountAmount(parseFloat(e.target.value) || 0)}
                placeholder="0.00"
                className="w-full bg-slate-950 text-slate-100 text-xs p-1.5 rounded-lg border border-slate-700 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 block mb-0.5 font-bold">VAT / Tax (%):</label>
              <input
                type="number"
                min="0"
                value={taxRate || ''}
                onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                placeholder="0"
                className="w-full bg-slate-950 text-slate-100 text-xs p-1.5 rounded-lg border border-slate-700 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Detailed Price Summary Breakdown */}
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2 text-xs">
            <div className="flex justify-between items-center text-slate-400">
              <span>Subtotal:</span>
              <span className="font-bold font-mono text-slate-200">{currency}{subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center text-slate-400">
              <span>Discount Amount:</span>
              <span className="font-bold font-mono text-rose-400">-{currency}{discountAmount.toFixed(2)}</span>
            </div>
            {taxAmount > 0 && (
              <div className="flex justify-between items-center text-slate-400">
                <span>VAT / Tax:</span>
                <span className="font-bold font-mono text-slate-300">+{currency}{taxAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between items-center pt-2 border-t border-slate-800 text-sm font-black text-slate-100">
              <span className="text-emerald-400">Total Amount:</span>
              <span className="text-emerald-400 font-mono text-base">{currency}{grandTotal.toFixed(2)}</span>
            </div>
          </div>

          {/* Payment Method Tabs */}
          <div>
            <label className="text-[10px] text-slate-400 block mb-1 font-bold">Payment Method:</label>
            <div className="grid grid-cols-4 gap-1.5">
              {(['Cash', 'Bank', 'Mobile Banking', 'Card'] as PaymentMethod[]).map((pm) => (
                <button
                  key={pm}
                  onClick={() => setPaymentMethod(pm)}
                  className={`py-1.5 px-1 rounded-xl text-[11px] font-bold border transition-colors ${
                    paymentMethod === pm
                      ? 'bg-indigo-600 text-white border-indigo-500'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                  }`}
                >
                  {pm}
                </button>
              ))}
            </div>
          </div>

          {/* Paid vs Due Input */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <div>
              <label className="text-[10px] text-slate-400 block mb-0.5">Paid Amount ({currency}):</label>
              <input
                type="number"
                placeholder={grandTotal.toFixed(2)}
                value={paidAmount}
                onChange={(e) => setPaidAmount(e.target.value)}
                className="w-full bg-slate-950 text-emerald-400 font-bold text-xs p-1.5 rounded-lg border border-slate-700"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 block mb-0.5">Due Amount ({currency}):</label>
              <div className="w-full bg-slate-950 text-amber-400 font-bold text-xs p-1.5 rounded-lg border border-slate-800">
                {currency}{dueVal.toFixed(2)}
              </div>
            </div>
          </div>
        </div>

        {/* Checkout Button */}
        <button
          onClick={handleCheckoutClick}
          disabled={cartItems.length === 0}
          className="w-full py-3 bg-gradient-to-r from-emerald-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 disabled:opacity-40 text-white font-extrabold text-sm rounded-xl shadow-xl shadow-emerald-600/20 transition-all flex items-center justify-center gap-2"
        >
          <CheckCircle2 className="w-5 h-5" />
          Complete Sale & Generate Invoice
        </button>
      </div>

      {/* CONFIRM SALE MODAL DIALOG */}
      {showConfirmSaleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-emerald-400 border-b border-slate-800 pb-3">
              <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                <ShoppingBag className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-100">বিক্রয় নিশ্চিতকরণ (Confirm Sale)</h3>
                <p className="text-xs text-slate-400">মেমো জেনারেট করার পূর্বে নিশ্চিত করুন</p>
              </div>
            </div>

            <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 text-xs space-y-2">
              <div className="flex justify-between text-slate-300">
                <span className="text-slate-400">কাস্টমার:</span>
                <span className="font-bold text-slate-100">
                  {isAddingNewCust ? newCustomerName : (customers.find(c => c.id === selectedCustomerId)?.name || 'Walk-in Customer')}
                </span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span className="text-slate-400">মোট আইটেম:</span>
                <span className="font-bold text-indigo-400">
                  {cartItems.reduce((sum, item) => sum + item.quantity, 0)} টি ({cartItems.length} টি প্রোডাক্ট)
                </span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span className="text-slate-400">পেমেন্ট মেথড:</span>
                <span className="font-bold text-emerald-400">{paymentMethod}</span>
              </div>
              <div className="border-t border-slate-800 pt-2 flex justify-between items-center text-slate-200">
                <span className="text-slate-400">সর্বমোট (Total):</span>
                <span className="font-extrabold text-sm text-emerald-400 font-mono">{currency}{grandTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span className="text-slate-400">জমা (Paid):</span>
                <span className="font-bold text-slate-100 font-mono">{currency}{paidVal.toFixed(2)}</span>
              </div>
              {dueVal > 0 && (
                <div className="flex justify-between text-rose-400 font-bold">
                  <span>বাকি (Due):</span>
                  <span className="font-mono">{currency}{dueVal.toFixed(2)}</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmSaleModal(false)}
                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition-colors"
              >
                না, ফিরে যান
              </button>
              <button
                type="button"
                onClick={handleConfirmSale}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" /> হ্যাঁ, বিক্রয় সম্পন্ন করুন
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
