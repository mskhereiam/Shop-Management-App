export type Role = 'ADMIN' | 'MANAGER';

export interface UserAuth {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  role: Role;
}

export interface UserRoleInfo {
  role: Role;
  name: string;
  email: string;
  avatar: string;
}

export interface Category {
  id: string;
  name: string;
  parentId?: string; // Optional parent category ID for subcategories
  description?: string;
  itemCount?: number;
}

export interface Brand {
  id: string;
  name: string;
  description?: string;
  itemCount?: number;
}

export interface Unit {
  id: string;
  name: string; // e.g. Pcs, Kg, Box, Liter
  shortName: string;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  barcode: string;
  categoryId: string;
  subCategoryId?: string;
  brandId: string;
  unitId: string;
  purchasePrice: number;
  salePrice: number;
  currentStock: number;
  minStock: number;
  image?: string;
  description?: string;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export interface StockMovement {
  id: string;
  productId: string;
  productName: string;
  type: 'IN' | 'OUT' | 'ADJUSTMENT' | 'DAMAGE' | 'RETURN';
  quantity: number;
  referenceNo: string; // e.g. INV-1001 or PO-2001
  note?: string;
  date: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  notes?: string;
  totalSpent: number;
  dueAmount: number;
  createdAt: string;
}

export interface CustomerLedgerEntry {
  id: string;
  customerId: string;
  customerName?: string;
  date: string;
  type: 'SALE' | 'PAYMENT' | 'RETURN' | 'OPENING';
  referenceNo: string;
  debit: number; // Increases customer due (e.g. Sale on credit)
  credit: number; // Decreases customer due (e.g. Payment received)
  balance: number; // Running due balance
  description: string;
}

export interface Supplier {
  id: string;
  name: string;
  phone: string;
  email?: string;
  companyName?: string;
  address?: string;
  dueAmount: number; // Amount we owe to supplier
  createdAt: string;
}

export interface SupplierLedgerEntry {
  id: string;
  supplierId: string;
  supplierName?: string;
  date: string;
  type: 'PURCHASE' | 'PAYMENT' | 'RETURN' | 'OPENING';
  referenceNo: string;
  credit: number; // Increases supplier payable (e.g. Purchase on credit)
  debit: number; // Decreases supplier payable (e.g. Payment to supplier)
  balance: number; // Running payable balance
  description: string;
}

export type PaymentMethod = 'Cash' | 'Bank' | 'Mobile Banking' | 'Card';

export interface SaleItem {
  productId: string;
  productName: string;
  barcode: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface SaleInvoice {
  id: string;
  invoiceNumber: string;
  date: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  items: SaleItem[];
  subtotal: number;
  discount: number;
  taxAmount: number;
  taxRate: number;
  shipping: number;
  grandTotal: number;
  paidAmount: number;
  dueAmount: number;
  paymentMethod: PaymentMethod;
  paymentStatus: 'PAID' | 'PARTIAL' | 'DUE';
  notes?: string;
  soldBy: string;
}

export interface PurchaseItem {
  productId: string;
  productName: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
}

export interface PurchaseInvoice {
  id: string;
  poNumber: string;
  date: string;
  supplierId: string;
  supplierName: string;
  items: PurchaseItem[];
  subtotal: number;
  taxAmount: number;
  discount: number;
  grandTotal: number;
  paidAmount: number;
  dueAmount: number;
  status: 'RECEIVED' | 'PENDING' | 'CANCELLED';
  paymentMethod: PaymentMethod;
}

export interface ExpenseCategory {
  id: string;
  name: string;
}

export interface Expense {
  id: string;
  categoryId: string;
  categoryName: string;
  title: string;
  amount: number;
  date: string;
  paymentMethod: PaymentMethod;
  receiptImage?: string;
  notes?: string;
  createdBy: string;
}

export interface IncomeCategory {
  id: string;
  name: string;
}

export interface Income {
  id: string;
  categoryId: string;
  categoryName: string;
  title: string;
  amount: number;
  date: string;
  paymentMethod: PaymentMethod;
  notes?: string;
  createdBy: string;
}

export interface GeneralLedgerEntry {
  id: string;
  date: string;
  accountType: 'CASH' | 'BANK' | 'EXPENSE' | 'INCOME' | 'CUSTOMER' | 'SUPPLIER';
  title: string;
  referenceNo: string;
  debit: number;
  credit: number;
  paymentMethod?: PaymentMethod;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'LOW_STOCK' | 'DUE_PAYMENT' | 'SUMMARY' | 'INFO';
  timestamp: string;
  read: boolean;
}

export interface ShopSettings {
  storeName?: string;
  companyName: string;
  phone: string;
  email: string;
  address: string;
  taxNumber?: string;
  currencySymbol: string;
  currencyCode: string;
  defaultTaxRate: number;
  invoiceFooterMessage: string;
  invoiceLogoUrl?: string;
  timezone: string;
}
