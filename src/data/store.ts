import {
  Product,
  Category,
  Brand,
  Unit,
  Customer,
  Supplier,
  SaleInvoice,
  PurchaseInvoice,
  Expense,
  Income,
  ExpenseCategory,
  IncomeCategory,
  ShopSettings,
  StockMovement,
  CustomerLedgerEntry,
  SupplierLedgerEntry,
  NotificationItem,
  GeneralLedgerEntry,
  Role
} from '../types';

import {
  initialProducts,
  initialCategories,
  initialBrands,
  initialUnits,
  initialCustomers,
  initialSuppliers,
  initialSalesInvoices,
  initialPurchases,
  initialExpenseCategories,
  initialExpenses,
  initialIncomeCategories,
  initialIncomes,
  initialSettings,
  initialNotifications
} from './initialData';

const STORAGE_KEYS = {
  PRODUCTS: 'shopmind_products_v1',
  CATEGORIES: 'shopmind_categories_v1',
  BRANDS: 'shopmind_brands_v1',
  UNITS: 'shopmind_units_v1',
  CUSTOMERS: 'shopmind_customers_v1',
  SUPPLIERS: 'shopmind_suppliers_v1',
  SALES: 'shopmind_sales_v1',
  PURCHASES: 'shopmind_purchases_v1',
  EXPENSES: 'shopmind_expenses_v1',
  EXPENSE_CATS: 'shopmind_exp_cats_v1',
  INCOMES: 'shopmind_incomes_v1',
  INCOME_CATS: 'shopmind_inc_cats_v1',
  STOCK_MOVEMENTS: 'shopmind_stock_movements_v1',
  CUSTOMER_LEDGER: 'shopmind_customer_ledger_v1',
  SUPPLIER_LEDGER: 'shopmind_supplier_ledger_v1',
  SETTINGS: 'shopmind_settings_v1',
  NOTIFICATIONS: 'shopmind_notifications_v1',
  ROLE: 'shopmind_active_role_v1'
};

function getStorage<T>(key: string, defaultValue: T, tenantId?: string): T {
  try {
    const finalKey = tenantId ? `${key}_${tenantId}` : key;
    const item = localStorage.getItem(finalKey);
    return item ? JSON.parse(item) : defaultValue;
  } catch (e) {
    console.error(`Failed reading ${key} from storage`, e);
    return defaultValue;
  }
}

function setStorage<T>(key: string, value: T, tenantId?: string): void {
  try {
    const finalKey = tenantId ? `${key}_${tenantId}` : key;
    localStorage.setItem(finalKey, JSON.stringify(value));
  } catch (e) {
    console.error(`Failed setting ${key} in storage`, e);
  }
}

export function loadStore<T>(key: string, defaultValue: T, tenantId?: string): T {
  return getStorage(key, defaultValue, tenantId);
}

export function saveStore<T>(key: string, value: T, tenantId?: string): void {
  setStorage(key, value, tenantId);
}

export const getStoredProducts = (): Product[] => getStorage(STORAGE_KEYS.PRODUCTS, initialProducts);
export const setStoredProducts = (val: Product[]) => setStorage(STORAGE_KEYS.PRODUCTS, val);

export const getStoredCategories = (): Category[] => getStorage(STORAGE_KEYS.CATEGORIES, initialCategories);
export const setStoredCategories = (val: Category[]) => setStorage(STORAGE_KEYS.CATEGORIES, val);

export const getStoredBrands = (): Brand[] => getStorage(STORAGE_KEYS.BRANDS, initialBrands);
export const setStoredBrands = (val: Brand[]) => setStorage(STORAGE_KEYS.BRANDS, val);

export const getStoredUnits = (): Unit[] => getStorage(STORAGE_KEYS.UNITS, initialUnits);
export const setStoredUnits = (val: Unit[]) => setStorage(STORAGE_KEYS.UNITS, val);

export const getStoredCustomers = (): Customer[] => getStorage(STORAGE_KEYS.CUSTOMERS, initialCustomers);
export const setStoredCustomers = (val: Customer[]) => setStorage(STORAGE_KEYS.CUSTOMERS, val);

export const getStoredSuppliers = (): Supplier[] => getStorage(STORAGE_KEYS.SUPPLIERS, initialSuppliers);
export const setStoredSuppliers = (val: Supplier[]) => setStorage(STORAGE_KEYS.SUPPLIERS, val);

export const getStoredSales = (): SaleInvoice[] => getStorage(STORAGE_KEYS.SALES, initialSalesInvoices);
export const setStoredSales = (val: SaleInvoice[]) => setStorage(STORAGE_KEYS.SALES, val);

export const getStoredPurchases = (): PurchaseInvoice[] => getStorage(STORAGE_KEYS.PURCHASES, initialPurchases);
export const setStoredPurchases = (val: PurchaseInvoice[]) => setStorage(STORAGE_KEYS.PURCHASES, val);

export const getStoredExpenses = (): Expense[] => getStorage(STORAGE_KEYS.EXPENSES, initialExpenses);
export const setStoredExpenses = (val: Expense[]) => setStorage(STORAGE_KEYS.EXPENSES, val);

export const getStoredExpenseCats = (): ExpenseCategory[] => getStorage(STORAGE_KEYS.EXPENSE_CATS, initialExpenseCategories);
export const setStoredExpenseCats = (val: ExpenseCategory[]) => setStorage(STORAGE_KEYS.EXPENSE_CATS, val);

export const getStoredIncomes = (): Income[] => getStorage(STORAGE_KEYS.INCOMES, initialIncomes);
export const setStoredIncomes = (val: Income[]) => setStorage(STORAGE_KEYS.INCOMES, val);

export const getStoredIncomeCats = (): IncomeCategory[] => getStorage(STORAGE_KEYS.INCOME_CATS, initialIncomeCategories);
export const setStoredIncomeCats = (val: IncomeCategory[]) => setStorage(STORAGE_KEYS.INCOME_CATS, val);

export const getStoredSettings = (): ShopSettings => {
  const saved = getStorage(STORAGE_KEYS.SETTINGS, initialSettings);
  if (saved && saved.currencySymbol === '$') {
    saved.currencySymbol = '৳';
    if (saved.currencyCode === 'USD') saved.currencyCode = 'BDT';
    setStorage(STORAGE_KEYS.SETTINGS, saved);
  }
  return saved;
};
export const setStoredSettings = (val: ShopSettings) => setStorage(STORAGE_KEYS.SETTINGS, val);

export const getStoredNotifications = (): NotificationItem[] => getStorage(STORAGE_KEYS.NOTIFICATIONS, initialNotifications);
export const setStoredNotifications = (val: NotificationItem[]) => setStorage(STORAGE_KEYS.NOTIFICATIONS, val);

export const getStoredRole = (): Role => getStorage(STORAGE_KEYS.ROLE, 'ADMIN');
export const setStoredRole = (val: Role) => setStorage(STORAGE_KEYS.ROLE, val);

export const getStoredStockMovements = (): StockMovement[] => getStorage(STORAGE_KEYS.STOCK_MOVEMENTS, [
  {
    id: 'sm-1',
    productId: 'prod-101',
    productName: 'Wireless Ergonomic Bluetooth Mouse',
    type: 'IN',
    quantity: 20,
    referenceNo: 'PO-2026-001',
    note: 'Initial restock',
    date: '2026-07-20'
  },
  {
    id: 'sm-2',
    productId: 'prod-101',
    productName: 'Wireless Ergonomic Bluetooth Mouse',
    type: 'OUT',
    quantity: 2,
    referenceNo: 'INV-2026-001',
    note: 'POS Checkout',
    date: '2026-07-24'
  }
]);

export const setStoredStockMovements = (val: StockMovement[]) => setStorage(STORAGE_KEYS.STOCK_MOVEMENTS, val);

export const getStoredCustomerLedger = (): CustomerLedgerEntry[] => getStorage(STORAGE_KEYS.CUSTOMER_LEDGER, [
  {
    id: 'cl-1',
    customerId: 'cust-2',
    date: '2026-07-24',
    type: 'SALE',
    referenceNo: 'INV-2026-001',
    debit: 91.35,
    credit: 91.35,
    balance: 0.00,
    description: 'Sale Invoice INV-2026-001 (Fully paid via Card)'
  },
  {
    id: 'cl-2',
    customerId: 'cust-3',
    date: '2026-07-24',
    type: 'SALE',
    referenceNo: 'INV-2026-002',
    debit: 319.00,
    credit: 0.00,
    balance: 319.00,
    description: 'Sale Invoice INV-2026-002 (Due Net-30)'
  }
]);

export const setStoredCustomerLedger = (val: CustomerLedgerEntry[]) => setStorage(STORAGE_KEYS.CUSTOMER_LEDGER, val);

export const getStoredSupplierLedger = (): SupplierLedgerEntry[] => getStorage(STORAGE_KEYS.SUPPLIER_LEDGER, [
  {
    id: 'sl-1',
    supplierId: 'sup-1',
    date: '2026-07-20',
    type: 'PURCHASE',
    referenceNo: 'PO-2026-001',
    credit: 420.00,
    debit: 0.00,
    balance: 420.00,
    description: 'Purchase Invoice PO-2026-001 (Due)'
  }
]);

export const setStoredSupplierLedger = (val: SupplierLedgerEntry[]) => setStorage(STORAGE_KEYS.SUPPLIER_LEDGER, val);

export function resetToDefaults() {
  setStoredProducts(initialProducts);
  setStoredCategories(initialCategories);
  setStoredBrands(initialBrands);
  setStoredUnits(initialUnits);
  setStoredCustomers(initialCustomers);
  setStoredSuppliers(initialSuppliers);
  setStoredSales(initialSalesInvoices);
  setStoredPurchases(initialPurchases);
  setStoredExpenses(initialExpenses);
  setStoredExpenseCats(initialExpenseCategories);
  setStoredIncomes(initialIncomes);
  setStoredIncomeCats(initialIncomeCategories);
  setStoredSettings(initialSettings);
  setStoredNotifications(initialNotifications);
  setStoredRole('ADMIN');
}
