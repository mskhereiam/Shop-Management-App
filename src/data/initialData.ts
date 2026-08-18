import {
  Category,
  Brand,
  Unit,
  Product,
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
  NotificationItem
} from '../types';

export const initialCategories: Category[] = [
  { id: 'cat-1', name: 'Electronics & Accessories', description: 'Smartphones, audio, and tech gear' },
  { id: 'cat-2', name: 'Groceries & Beverages', description: 'Daily essential packaged groceries' },
  { id: 'cat-3', name: 'Home Appliances', description: 'Kitchen and household electrical items' },
  { id: 'cat-4', name: 'Personal Care & Beauty', description: 'Skincare, haircare, and hygiene products' }
];

export const initialBrands: Brand[] = [
  { id: 'br-1', name: 'Aura Tech' },
  { id: 'br-2', name: 'Nestle Pure' },
  { id: 'br-3', name: 'Logitech' },
  { id: 'br-4', name: 'Samsung' },
  { id: 'br-5', name: 'General Organics' }
];

export const initialUnits: Unit[] = [
  { id: 'u-1', name: 'Pieces', shortName: 'Pcs' },
  { id: 'u-2', name: 'Kilograms', shortName: 'Kg' },
  { id: 'u-3', name: 'Packets', shortName: 'Pkt' },
  { id: 'u-4', name: 'Boxes', shortName: 'Box' }
];

export const initialProducts: Product[] = [
  {
    id: 'prod-101',
    name: 'Wireless Ergonomic Bluetooth Mouse',
    sku: 'LOG-M720-BLK',
    barcode: '890123456701',
    categoryId: 'cat-1',
    brandId: 'br-3',
    unitId: 'u-1',
    purchasePrice: 22.00,
    salePrice: 35.00,
    currentStock: 48,
    minStock: 10,
    image: 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=400&auto=format&fit=crop&q=80',
    description: 'Multi-device Bluetooth mouse with hyper-fast scroll wheel.',
    status: 'active',
    createdAt: '2026-06-01',
    updatedAt: '2026-07-20'
  },
  {
    id: 'prod-102',
    name: 'Active Noise Cancelling Earbuds Pro',
    sku: 'AUR-ANC-200',
    barcode: '890123456702',
    categoryId: 'cat-1',
    brandId: 'br-1',
    unitId: 'u-1',
    purchasePrice: 45.00,
    salePrice: 79.99,
    currentStock: 6, // Low stock!
    minStock: 12,
    image: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=400&auto=format&fit=crop&q=80',
    description: 'High-fidelity audio with active noise cancellation and transparency mode.',
    status: 'active',
    createdAt: '2026-06-05',
    updatedAt: '2026-07-22'
  },
  {
    id: 'prod-103',
    name: 'Organic Whole Grain Coffee Beans 1kg',
    sku: 'ORG-CF-1KG',
    barcode: '890123456703',
    categoryId: 'cat-2',
    brandId: 'br-5',
    unitId: 'u-2',
    purchasePrice: 12.50,
    salePrice: 22.00,
    currentStock: 35,
    minStock: 8,
    image: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=400&auto=format&fit=crop&q=80',
    description: 'Medium roast dark cocoa aromatic coffee beans.',
    status: 'active',
    createdAt: '2026-06-10',
    updatedAt: '2026-07-23'
  },
  {
    id: 'prod-104',
    name: 'Compact Electric Milk Frother & Heater',
    sku: 'KIT-FRT-99',
    barcode: '890123456704',
    categoryId: 'cat-3',
    brandId: 'br-1',
    unitId: 'u-1',
    purchasePrice: 18.00,
    salePrice: 32.50,
    currentStock: 2, // Low stock!
    minStock: 5,
    image: 'https://images.unsplash.com/photo-1517256064527-09c73fc73e38?w=400&auto=format&fit=crop&q=80',
    description: 'Stainless steel instant hot and cold milk frother.',
    status: 'active',
    createdAt: '2026-06-15',
    updatedAt: '2026-07-24'
  },
  {
    id: 'prod-105',
    name: '4K Ultra HD Monitor 27-inch',
    sku: 'SAM-4K-27',
    barcode: '890123456705',
    categoryId: 'cat-1',
    brandId: 'br-4',
    unitId: 'u-1',
    purchasePrice: 210.00,
    salePrice: 319.00,
    currentStock: 14,
    minStock: 4,
    image: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=400&auto=format&fit=crop&q=80',
    description: 'HDR10 color accurate IPS panel with USB-C power delivery.',
    status: 'active',
    createdAt: '2026-06-20',
    updatedAt: '2026-07-24'
  },
  {
    id: 'prod-106',
    name: 'Hydrating Botanical Face Serum 50ml',
    sku: 'BEA-SER-50',
    barcode: '890123456706',
    categoryId: 'cat-4',
    brandId: 'br-5',
    unitId: 'u-1',
    purchasePrice: 8.50,
    salePrice: 18.99,
    currentStock: 0, // Out of stock!
    minStock: 10,
    image: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=400&auto=format&fit=crop&q=80',
    description: 'Hyaluronic acid and vitamin C glow boosting face serum.',
    status: 'active',
    createdAt: '2026-06-22',
    updatedAt: '2026-07-24'
  }
];

export const initialCustomers: Customer[] = [
  {
    id: 'cust-1',
    name: 'Walk-in Customer',
    phone: '0000000000',
    email: 'walkin@shopmind.ai',
    address: 'Counter Direct',
    notes: 'Default cash walk-in customer profile',
    totalSpent: 1250.00,
    dueAmount: 0.00,
    createdAt: '2026-01-01'
  },
  {
    id: 'cust-2',
    name: 'Eleanor Vance',
    phone: '+1 555-0192',
    email: 'eleanor.vance@example.com',
    address: '742 Evergreen Terrace, Sector 4',
    notes: 'VIP customer, prefers wholesale discount on bulk electronics.',
    totalSpent: 840.00,
    dueAmount: 45.00,
    createdAt: '2026-06-12'
  },
  {
    id: 'cust-3',
    name: 'Liam Chen Tech Solutions',
    phone: '+1 555-0381',
    email: 'contact@chentech.com',
    address: '102 Innovation Way, Suite B',
    notes: 'Corporate client with monthly billing cycle.',
    totalSpent: 2150.00,
    dueAmount: 319.00,
    createdAt: '2026-06-18'
  }
];

export const initialSuppliers: Supplier[] = [
  {
    id: 'sup-1',
    name: 'Aura Global Electronics Ltd',
    phone: '+1 800-555-8822',
    email: 'orders@auraglobal.com',
    companyName: 'Aura Global Inc.',
    address: '88 Tech Boulevard, Silicon District',
    dueAmount: 420.00,
    createdAt: '2026-05-10'
  },
  {
    id: 'sup-2',
    name: 'Horizon Wholesale Foods & Essentials',
    phone: '+1 800-555-3344',
    email: 'sales@horizonfoods.com',
    companyName: 'Horizon Distro Corp',
    address: '400 Logistics Way, Central Market',
    dueAmount: 0.00,
    createdAt: '2026-05-15'
  }
];

export const initialSalesInvoices: SaleInvoice[] = [
  {
    id: 'inv-1001',
    invoiceNumber: 'INV-2026-001',
    date: '2026-07-24T14:30:00Z',
    customerId: 'cust-2',
    customerName: 'Eleanor Vance',
    customerPhone: '+1 555-0192',
    items: [
      {
        productId: 'prod-101',
        productName: 'Wireless Ergonomic Bluetooth Mouse',
        barcode: '890123456701',
        quantity: 2,
        unitPrice: 35.00,
        totalPrice: 70.00
      },
      {
        productId: 'prod-103',
        productName: 'Organic Whole Grain Coffee Beans 1kg',
        barcode: '890123456703',
        quantity: 1,
        unitPrice: 22.00,
        totalPrice: 22.00
      }
    ],
    subtotal: 92.00,
    discount: 5.00,
    taxRate: 5,
    taxAmount: 4.35,
    shipping: 0,
    grandTotal: 91.35,
    paidAmount: 91.35,
    dueAmount: 0.00,
    paymentMethod: 'Card',
    paymentStatus: 'PAID',
    soldBy: 'Admin User'
  },
  {
    id: 'inv-1002',
    invoiceNumber: 'INV-2026-002',
    date: '2026-07-24T16:15:00Z',
    customerId: 'cust-3',
    customerName: 'Liam Chen Tech Solutions',
    customerPhone: '+1 555-0381',
    items: [
      {
        productId: 'prod-105',
        productName: '4K Ultra HD Monitor 27-inch',
        barcode: '890123456705',
        quantity: 1,
        unitPrice: 319.00,
        totalPrice: 319.00
      }
    ],
    subtotal: 319.00,
    discount: 0,
    taxRate: 0,
    taxAmount: 0,
    shipping: 0,
    grandTotal: 319.00,
    paidAmount: 0.00,
    dueAmount: 319.00,
    paymentMethod: 'Bank',
    paymentStatus: 'DUE',
    notes: 'Invoice sent for corporate Net-30 payment',
    soldBy: 'Store Manager'
  }
];

export const initialPurchases: PurchaseInvoice[] = [
  {
    id: 'po-2001',
    poNumber: 'PO-2026-001',
    date: '2026-07-20T10:00:00Z',
    supplierId: 'sup-1',
    supplierName: 'Aura Global Electronics Ltd',
    items: [
      {
        productId: 'prod-101',
        productName: 'Wireless Ergonomic Bluetooth Mouse',
        quantity: 20,
        unitCost: 22.00,
        totalCost: 440.00
      }
    ],
    subtotal: 440.00,
    taxAmount: 0,
    discount: 20.00,
    grandTotal: 420.00,
    paidAmount: 0.00,
    dueAmount: 420.00,
    status: 'RECEIVED',
    paymentMethod: 'Bank'
  }
];

export const initialExpenseCategories: ExpenseCategory[] = [
  { id: 'exp-cat-1', name: 'Utilities & Power' },
  { id: 'exp-cat-2', name: 'Store Rent' },
  { id: 'exp-cat-3', name: 'Staff Salary & Bonus' },
  { id: 'exp-cat-4', name: 'Packaging & Supplies' },
  { id: 'exp-cat-5', name: 'Marketing & Ad Spend' }
];

export const initialExpenses: Expense[] = [
  {
    id: 'exp-1',
    categoryId: 'exp-cat-1',
    categoryName: 'Utilities & Power',
    title: 'Electricity & Internet Bill July',
    amount: 145.00,
    date: '2026-07-22',
    paymentMethod: 'Bank',
    notes: 'Paid via commercial bank auto-pay',
    createdBy: 'Admin User'
  },
  {
    id: 'exp-2',
    categoryId: 'exp-cat-4',
    categoryName: 'Packaging & Supplies',
    title: 'Custom Eco Bag Printing (500 units)',
    amount: 85.00,
    date: '2026-07-23',
    paymentMethod: 'Cash',
    notes: 'Receipt attached in store drawer',
    createdBy: 'Store Manager'
  }
];

export const initialIncomeCategories: IncomeCategory[] = [
  { id: 'inc-cat-1', name: 'Recycling & Scrap Sale' },
  { id: 'inc-cat-2', name: 'Equipment Lease Income' },
  { id: 'inc-cat-3', name: 'Vendor Rebate / Cashback' }
];

export const initialIncomes: Income[] = [
  {
    id: 'inc-1',
    categoryId: 'inc-cat-3',
    categoryName: 'Vendor Rebate / Cashback',
    title: 'Logitech Q2 Bulk Sales Cash Rebate',
    amount: 120.00,
    date: '2026-07-15',
    paymentMethod: 'Bank',
    notes: 'Direct wire deposit',
    createdBy: 'Admin User'
  }
];

export const initialSettings: ShopSettings = {
  companyName: 'One Studio Codes',
  phone: '+880 1700-000000',
  email: 'contact@onestudiocodes.com',
  address: 'Commercial Hub, Dhaka, Bangladesh',
  taxNumber: 'TAX-99881122-BD',
  currencySymbol: '৳',
  currencyCode: 'BDT',
  defaultTaxRate: 5,
  invoiceFooterMessage: 'Thank you for shopping with One Studio Codes! Retain this receipt for returns within 14 days.',
  timezone: 'UTC+6 (BST)',
  invoiceLogoUrl: ''
};

export const initialNotifications: NotificationItem[] = [
  {
    id: 'notif-1',
    title: 'Low Stock Alert',
    message: 'Active Noise Cancelling Earbuds Pro has only 6 units remaining (Min: 12).',
    type: 'LOW_STOCK',
    timestamp: '2026-07-24T10:00:00Z',
    read: false
  },
  {
    id: 'notif-2',
    title: 'Supplier Payment Due',
    message: 'Payment of ৳420.00 due to Aura Global Electronics Ltd.',
    type: 'DUE_PAYMENT',
    timestamp: '2026-07-23T15:00:00Z',
    read: false
  }
];
