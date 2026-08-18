import React from 'react';
import {
  TrendingUp,
  ShoppingBag,
  DollarSign,
  Receipt,
  ArrowUpRight,
  ArrowDownRight,
  AlertTriangle,
  PackageX,
  CreditCard,
  Building2,
  Wallet,
  Sparkles,
  Users,
  ChevronRight
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  Legend,
  CartesianGrid
} from 'recharts';
import {
  Product,
  SaleInvoice,
  PurchaseInvoice,
  Expense,
  Income,
  Customer,
  ShopSettings
} from '../types';

interface DashboardViewProps {
  products: Product[];
  sales: SaleInvoice[];
  purchases: PurchaseInvoice[];
  expenses: Expense[];
  incomes: Income[];
  customers: Customer[];
  settings: ShopSettings;
  onNavigate: (view: string) => void;
  onQuickPO: (p: Product) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  products,
  sales,
  purchases,
  expenses,
  incomes,
  customers,
  settings,
  onNavigate,
  onQuickPO
}) => {
  const currency = settings.currencySymbol || '৳';

  // Calculations
  const todayStr = new Date().toISOString().split('T')[0];

  const todaySales = sales
    .filter((s) => s.date.startsWith(todayStr))
    .reduce((acc, s) => acc + s.grandTotal, 0);

  const todayPurchases = purchases
    .filter((p) => p.date.startsWith(todayStr))
    .reduce((acc, p) => acc + p.grandTotal, 0);

  const todayExpenses = expenses
    .filter((e) => e.date.startsWith(todayStr))
    .reduce((acc, e) => acc + e.amount, 0);

  const todayIncomes = incomes
    .filter((i) => i.date.startsWith(todayStr))
    .reduce((acc, i) => acc + i.amount, 0);

  // Estimate today profit = today sales - estimated cost + today income - today expense
  const todayProfit = todaySales * 0.35 + todayIncomes - todayExpenses;

  const monthlySales = sales.reduce((acc, s) => acc + s.grandTotal, 0);
  const monthlyPurchases = purchases.reduce((acc, p) => acc + p.grandTotal, 0);

  const receivables = customers.reduce((acc, c) => acc + c.dueAmount, 0);
  const payables = purchases.reduce((acc, p) => acc + p.dueAmount, 0);

  const stockValue = products.reduce((acc, p) => acc + p.currentStock * p.purchasePrice, 0);

  const lowStockProducts = products.filter(
    (p) => p.currentStock > 0 && p.currentStock <= p.minStock
  );
  const outOfStockProducts = products.filter((p) => p.currentStock === 0);

  // Mock cash & bank balance
  const cashBalance = 14850.00 + todaySales * 0.6 - todayExpenses * 0.4;
  const bankBalance = 32400.00 + todaySales * 0.4 - todayExpenses * 0.6;

  // Real-time English Month Database Chart Data
  const ENGLISH_MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const currentYear = new Date().getFullYear();

  const monthlyDatabaseTrend = ENGLISH_MONTHS_SHORT.map((mName, mIdx) => {
    const mSales = sales
      .filter((s) => {
        const d = new Date(s.date);
        return d.getMonth() === mIdx && d.getFullYear() === currentYear;
      })
      .reduce((a, s) => a + s.grandTotal, 0);

    const mPurchases = purchases
      .filter((p) => {
        const d = new Date(p.date);
        return d.getMonth() === mIdx && d.getFullYear() === currentYear;
      })
      .reduce((a, p) => a + p.grandTotal, 0);

    const mExpenses = expenses
      .filter((e) => {
        const d = new Date(e.date);
        return d.getMonth() === mIdx && d.getFullYear() === currentYear;
      })
      .reduce((a, e) => a + e.amount, 0);

    return {
      month: mName,
      sales: mSales,
      purchase: mPurchases,
      expense: mExpenses
    };
  });

  const financialComparisonData = [
    { category: 'Gross Sales', amount: monthlySales },
    { category: 'Purchases', amount: monthlyPurchases },
    { category: 'Incomes', amount: incomes.reduce((a, i) => a + i.amount, 0) },
    { category: 'Expenses', amount: expenses.reduce((a, e) => a + e.amount, 0) }
  ];

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Primary KPI Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 shadow-lg relative overflow-hidden group hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Today's Sales</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-lg md:text-xl font-black text-slate-100 mt-2">
            {currency}{todaySales.toFixed(2)}
          </div>
          <div className="text-[10px] text-emerald-400 font-semibold mt-1 flex items-center gap-1">
            <ArrowUpRight className="w-3 h-3" /> Live POS stream
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 shadow-lg relative overflow-hidden group hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Today's Purchase</span>
            <ShoppingBag className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-lg md:text-xl font-black text-slate-100 mt-2">
            {currency}{todayPurchases.toFixed(2)}
          </div>
          <div className="text-[10px] text-slate-400 font-medium mt-1">Supplier Invoices</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 shadow-lg relative overflow-hidden group hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Today's Net Profit</span>
            <DollarSign className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-lg md:text-xl font-black text-emerald-400 mt-2">
            {currency}{todayProfit.toFixed(2)}
          </div>
          <div className="text-[10px] text-emerald-400 font-semibold mt-1">Estimated ~35% Margin</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 shadow-lg relative overflow-hidden group hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Today's Expense</span>
            <Receipt className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-lg md:text-xl font-black text-slate-100 mt-2">
            {currency}{todayExpenses.toFixed(2)}
          </div>
          <div className="text-[10px] text-rose-400 font-medium mt-1">Logged expenses</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 shadow-lg relative overflow-hidden group hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Today's Income</span>
            <TrendingUp className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-lg md:text-xl font-black text-slate-100 mt-2">
            {currency}{todayIncomes.toFixed(2)}
          </div>
          <div className="text-[10px] text-amber-400 font-medium mt-1">Misc revenue</div>
        </div>
      </div>

      {/* Secondary Inventory Summary Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="bg-slate-900/80 border border-slate-800/80 rounded-xl p-3 text-xs">
          <span className="text-slate-400 block font-medium">Stock Asset Value</span>
          <span className="text-base font-bold text-slate-200 block mt-1">{currency}{stockValue.toFixed(2)}</span>
        </div>
        <div className="bg-slate-900/80 border border-slate-800/80 rounded-xl p-3 text-xs flex items-center justify-between">
          <div>
            <span className="text-slate-400 block font-medium">Low / Out Stock</span>
            <span className="text-base font-bold text-rose-400 block mt-1">
              {lowStockProducts.length} / {outOfStockProducts.length}
            </span>
          </div>
          <AlertTriangle className="w-4 h-4 text-amber-400" />
        </div>
      </div>

      {/* Visual Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales vs Purchase Trend Area Chart */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-100">English Month Real-Time Revenue & Purchase Trend ({currentYear})</h2>
              <p className="text-xs text-slate-400">Comparing POS Sales vs Supplier Purchase Invoices across English Months</p>
            </div>
            <button
              onClick={() => onNavigate('reports')}
              className="text-xs text-indigo-400 font-semibold hover:underline flex items-center gap-1"
            >
              Full Analytics <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyDatabaseTrend}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorPurchase" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#f8fafc' }}
                />
                <Area type="monotone" dataKey="sales" name="Sales" stroke="#10b981" fillOpacity={1} fill="url(#colorSales)" />
                <Area type="monotone" dataKey="purchase" name="Purchases" stroke="#6366f1" fillOpacity={1} fill="url(#colorPurchase)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Financial Flow Bar Chart */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-100">Financial Stream Overview</h2>
            <p className="text-xs text-slate-400 mb-4">Gross Revenue, Outflows & Operations</p>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={financialComparisonData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} />
                  <XAxis dataKey="category" stroke="#94a3b8" fontSize={10} />
                  <YAxis stroke="#94a3b8" fontSize={10} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#f8fafc' }}
                  />
                  <Bar dataKey="amount" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Top Products & Live Feeds Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Selling Products */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              Top Selling Products
            </h2>
            <button
              onClick={() => onNavigate('products')}
              className="text-xs text-indigo-400 font-semibold hover:underline"
            >
              Catalog →
            </button>
          </div>
          <div className="space-y-2.5">
            {products.slice(0, 4).map((p) => (
              <div
                key={p.id}
                className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/40 flex items-center justify-between hover:border-slate-600 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <img src={p.image} alt={p.name} className="w-10 h-10 rounded-lg object-cover shrink-0" />
                  <div>
                    <div className="text-xs font-bold text-slate-200">{p.name}</div>
                    <div className="text-[10px] text-slate-400 font-mono">SKU: {p.sku} | Barcode: {p.barcode}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-bold text-emerald-400">{currency}{p.salePrice.toFixed(2)}</div>
                  <div className={`text-[10px] font-bold ${p.currentStock <= p.minStock ? 'text-rose-400' : 'text-slate-400'}`}>
                    Stock: {p.currentStock}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Latest Sales Activity Feed */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Receipt className="w-4 h-4 text-indigo-400" />
              Latest Sales Invoices
            </h2>
            <button
              onClick={() => onNavigate('sales-directory')}
              className="text-xs text-indigo-400 font-semibold hover:underline"
            >
              View All Sales →
            </button>
          </div>
          <div className="space-y-2.5">
            {sales.slice(0, 4).map((s) => (
              <div
                key={s.id}
                className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/40 flex items-center justify-between hover:border-slate-600 transition-colors"
              >
                <div>
                  <div className="text-xs font-bold text-slate-200">{s.invoiceNumber}</div>
                  <div className="text-[10px] text-slate-400">Customer: {s.customerName} ({s.paymentMethod})</div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-bold text-emerald-400">{currency}{s.grandTotal.toFixed(2)}</div>
                  <div className={`text-[10px] font-bold ${s.paymentStatus === 'PAID' ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {s.paymentStatus}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
