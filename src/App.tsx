import React, { useState, useEffect } from 'react';
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
  CustomerLedgerEntry,
  SupplierLedgerEntry,
  StockMovement,
  ShopSettings,
  PaymentMethod,
  Role,
  NotificationItem,
  UserAuth
} from './types';
import { initialProducts, initialCategories, initialBrands, initialUnits, initialCustomers, initialSuppliers, initialSalesInvoices, initialPurchases, initialExpenses, initialIncomes, initialExpenseCategories, initialIncomeCategories, initialSettings } from './data/initialData';
import { 
  subscribeToCollection, 
  subscribeToSettings, 
  saveCollectionToFirestore, 
  saveSettingsToFirestore,
  saveDocumentToFirestore,
  deleteDocumentFromFirestore
} from './data/firestoreStore';
import { auth } from './firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';

import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { GlobalSearchModal } from './components/GlobalSearchModal';
import { InvoiceModal } from './components/InvoiceModal';
import { LoginScreen } from './components/LoginScreen';

import { DashboardView } from './components/DashboardView';
import { POSView } from './components/POSView';
import { SalesDirectoryView } from './components/SalesDirectoryView';
import { ProductsView } from './components/ProductsView';
import { PurchasesView } from './components/PurchasesView';
import { CustomersView } from './components/CustomersView';
import { SuppliersView } from './components/SuppliersView';
import { InventoryView } from './components/InventoryView';
import { AccountingView } from './components/AccountingView';
import { ExpenseIncomeView } from './components/ExpenseIncomeView';
import { ReportsView } from './components/ReportsView';
import { SettingsView } from './components/SettingsView';

export default function App() {
  const [userAuth, setUserAuth] = useState<UserAuth | null>(() => {
    try {
      const saved = localStorage.getItem('shop_user_auth');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn('Auth parse error:', e);
    }
    return null;
  });

  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [activeRole, setActiveRole] = useState<Role>(userAuth?.role || 'ADMIN');
  const [collapsed, setCollapsed] = useState<boolean>(false);
  const [darkMode, setDarkMode] = useState<boolean>(true);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState<boolean>(false);

  // Cleanup any legacy local storage business data caches
  useEffect(() => {
    try {
      const keysToRemove = Object.keys(localStorage).filter((k) => k.startsWith('shopmind_'));
      keysToRemove.forEach((k) => localStorage.removeItem(k));
    } catch {}
  }, []);

  // Monitor Google / Firebase Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user && user.email) {
        const authObj: UserAuth = {
          uid: user.uid,
          email: user.email.toLowerCase(),
          displayName: user.displayName || `${user.email.split('@')[0]}'s Store`,
          photoURL: user.photoURL || undefined,
          role: userAuth?.role || 'ADMIN'
        };
        setUserAuth(authObj);
        setActiveRole(authObj.role);
        localStorage.setItem('shop_user_auth', JSON.stringify(authObj));
      }
    });
    return () => unsubscribe();
  }, []);

  const handleLoginSuccess = (authObj: UserAuth) => {
    setUserAuth(authObj);
    setActiveRole(authObj.role);
    localStorage.setItem('shop_user_auth', JSON.stringify(authObj));
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (e) {
      console.warn('Sign out notice:', e);
    }
    setUserAuth(null);
    localStorage.removeItem('shop_user_auth');
  };

  const currentTenantId = userAuth?.uid;

  // Pure Cloud State Initialization (Firestore real-time subscription populates live data)
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [brands, setBrands] = useState<Brand[]>(initialBrands);
  const [units, setUnits] = useState<Unit[]>(initialUnits);
  const [customers, setCustomers] = useState<Customer[]>(initialCustomers);
  const [suppliers, setSuppliers] = useState<Supplier[]>(initialSuppliers);
  const [sales, setSales] = useState<SaleInvoice[]>(initialSalesInvoices);
  const [purchases, setPurchases] = useState<PurchaseInvoice[]>(initialPurchases);
  const [expenses, setExpenses] = useState<Expense[]>(initialExpenses);
  const [incomes, setIncomes] = useState<Income[]>(initialIncomes);
  const [expenseCats, setExpenseCats] = useState<ExpenseCategory[]>(initialExpenseCategories);
  const [incomeCats, setIncomeCats] = useState<IncomeCategory[]>(initialIncomeCategories);
  const [customerLedger, setCustomerLedger] = useState<CustomerLedgerEntry[]>([]);
  const [supplierLedger, setSupplierLedger] = useState<SupplierLedgerEntry[]>([]);
  const [stockMovements, setStockMovements] = useState<StockMovement[]>([]);
  const [settings, setSettings] = useState<ShopSettings>(() => ({
    ...initialSettings,
    storeName: userAuth?.displayName || 'Smart Shop',
    companyName: userAuth?.displayName || 'Smart Shop',
    currencySymbol: '৳',
    currencyCode: 'BDT'
  }));

  // Dynamic Low Stock Notifications
  const notifications: NotificationItem[] = products
    .filter((p) => p.currentStock <= p.minStock)
    .map((p) => ({
      id: `notif-${p.id}`,
      title: 'Low Stock Alert',
      message: `${p.name} has only ${p.currentStock} ${p.unitId || 'pcs'} left!`,
      type: 'LOW_STOCK',
      timestamp: 'Just now',
      read: false
    }));

  // Invoice Modal State
  const [activeInvoice, setActiveInvoice] = useState<SaleInvoice | null>(null);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState<boolean>(false);

  // Real-time Firestore Subscriptions per User/Tenant
  useEffect(() => {
    if (!currentTenantId) return;

    const userInitialSettings: ShopSettings = {
      ...initialSettings,
      storeName: userAuth?.displayName || 'Smart Shop',
      companyName: userAuth?.displayName || 'Smart Shop',
      email: userAuth?.email || 'shop@example.com',
      currencySymbol: '৳',
      currencyCode: 'BDT'
    };

    const unsubProducts = subscribeToCollection('products', initialProducts, setProducts, currentTenantId);
    const unsubCategories = subscribeToCollection('categories', initialCategories, setCategories, currentTenantId);
    const unsubBrands = subscribeToCollection('brands', initialBrands, setBrands, currentTenantId);
    const unsubUnits = subscribeToCollection('units', initialUnits, setUnits, currentTenantId);
    const unsubCustomers = subscribeToCollection('customers', initialCustomers, setCustomers, currentTenantId);
    const unsubSuppliers = subscribeToCollection('suppliers', initialSuppliers, setSuppliers, currentTenantId);
    const unsubSales = subscribeToCollection('sales', initialSalesInvoices, setSales, currentTenantId);
    const unsubPurchases = subscribeToCollection('purchases', initialPurchases, setPurchases, currentTenantId);
    const unsubExpenses = subscribeToCollection('expenses', initialExpenses, setExpenses, currentTenantId);
    const unsubIncomes = subscribeToCollection('incomes', initialIncomes, setIncomes, currentTenantId);
    const unsubExpCats = subscribeToCollection('expenseCats', initialExpenseCategories, setExpenseCats, currentTenantId);
    const unsubIncCats = subscribeToCollection('incomeCats', initialIncomeCategories, setIncomeCats, currentTenantId);
    const unsubCustLedger = subscribeToCollection('customerLedger', [], setCustomerLedger, currentTenantId);
    const unsubSupLedger = subscribeToCollection('supplierLedger', [], setSupplierLedger, currentTenantId);
    const unsubStockMov = subscribeToCollection('stockMovements', [], setStockMovements, currentTenantId);
    const unsubSettings = subscribeToSettings(userInitialSettings, setSettings, currentTenantId);

    return () => {
      unsubProducts();
      unsubCategories();
      unsubBrands();
      unsubUnits();
      unsubCustomers();
      unsubSuppliers();
      unsubSales();
      unsubPurchases();
      unsubExpenses();
      unsubIncomes();
      unsubExpCats();
      unsubIncCats();
      unsubCustLedger();
      unsubSupLedger();
      unsubStockMov();
      unsubSettings();
    };
  }, [currentTenantId]);

  // Auto Persist to Cloud Database (Firestore + RTDB + Supabase) per Tenant
  useEffect(() => { 
    if (currentTenantId) saveCollectionToFirestore('products', products, currentTenantId);
  }, [products, currentTenantId]);

  useEffect(() => { 
    if (currentTenantId) saveCollectionToFirestore('categories', categories, currentTenantId);
  }, [categories, currentTenantId]);

  useEffect(() => { 
    if (currentTenantId) saveCollectionToFirestore('brands', brands, currentTenantId);
  }, [brands, currentTenantId]);

  useEffect(() => { 
    if (currentTenantId) saveCollectionToFirestore('units', units, currentTenantId);
  }, [units, currentTenantId]);

  useEffect(() => { 
    if (currentTenantId) saveCollectionToFirestore('customers', customers, currentTenantId);
  }, [customers, currentTenantId]);

  useEffect(() => { 
    if (currentTenantId) saveCollectionToFirestore('suppliers', suppliers, currentTenantId);
  }, [suppliers, currentTenantId]);

  useEffect(() => { 
    if (currentTenantId) saveCollectionToFirestore('sales', sales, currentTenantId);
  }, [sales, currentTenantId]);

  useEffect(() => { 
    if (currentTenantId) saveCollectionToFirestore('purchases', purchases, currentTenantId);
  }, [purchases, currentTenantId]);

  useEffect(() => { 
    if (currentTenantId) saveCollectionToFirestore('expenses', expenses, currentTenantId);
  }, [expenses, currentTenantId]);

  useEffect(() => { 
    if (currentTenantId) saveCollectionToFirestore('incomes', incomes, currentTenantId);
  }, [incomes, currentTenantId]);

  useEffect(() => { 
    if (currentTenantId) saveCollectionToFirestore('customerLedger', customerLedger, currentTenantId);
  }, [customerLedger, currentTenantId]);

  useEffect(() => { 
    if (currentTenantId) saveCollectionToFirestore('supplierLedger', supplierLedger, currentTenantId);
  }, [supplierLedger, currentTenantId]);

  useEffect(() => { 
    if (currentTenantId) saveCollectionToFirestore('stockMovements', stockMovements, currentTenantId);
  }, [stockMovements, currentTenantId]);

  useEffect(() => { 
    if (currentTenantId) saveSettingsToFirestore(settings, currentTenantId);
  }, [settings, currentTenantId]);

  // Complete Sale Handlers
  const handleCompleteSale = (newInvoice: SaleInvoice, newCust?: Customer) => {
    // 1. If new customer auto created
    if (newCust) {
      setCustomers((prev) => [newCust, ...prev]);
      saveDocumentToFirestore('customers', newCust, currentTenantId);
    }

    // 2. Add Invoice
    setSales((prev) => [newInvoice, ...prev]);
    saveDocumentToFirestore('sales', newInvoice, currentTenantId);

    // 3. Update Product Stock Levels
    setProducts((prev) =>
      prev.map((p) => {
        const item = newInvoice.items.find((it) => it.productId === p.id);
        if (item) {
          const updatedStock = Math.max(0, p.currentStock - item.quantity);
          const updatedP = { ...p, currentStock: updatedStock };
          saveDocumentToFirestore('products', updatedP, currentTenantId);
          return updatedP;
        }
        return p;
      })
    );

    // 4. Log Stock Movements
    const newMovements: StockMovement[] = newInvoice.items.map((item) => ({
      id: `sm-${Date.now()}-${Math.random()}`,
      productId: item.productId,
      productName: item.productName,
      type: 'OUT',
      quantity: item.quantity,
      date: new Date().toISOString().split('T')[0],
      referenceNo: newInvoice.invoiceNumber,
      note: `Sale to ${newInvoice.customerName}`
    }));
    setStockMovements((prev) => [...newMovements, ...prev]);
    newMovements.forEach((m) => saveDocumentToFirestore('stockMovements', m, currentTenantId));

    // 5. Update Customer Total Spent & Due Amount
    setCustomers((prev) =>
      prev.map((c) => {
        if (c.id === newInvoice.customerId) {
          const updatedC = {
            ...c,
            totalSpent: c.totalSpent + newInvoice.grandTotal,
            dueAmount: c.dueAmount + newInvoice.dueAmount
          };
          saveDocumentToFirestore('customers', updatedC, currentTenantId);
          return updatedC;
        }
        return c;
      })
    );

    // 6. Record Customer Ledger
    const ledgerEntry: CustomerLedgerEntry = {
      id: `cl-${Date.now()}`,
      customerId: newInvoice.customerId,
      customerName: newInvoice.customerName,
      date: new Date().toISOString().split('T')[0],
      type: 'SALE',
      referenceNo: newInvoice.invoiceNumber,
      debit: newInvoice.grandTotal,
      credit: newInvoice.paidAmount,
      balance: newInvoice.dueAmount,
      description: `Sale Invoice #${newInvoice.invoiceNumber}`
    };
    setCustomerLedger((prev) => [ledgerEntry, ...prev]);
    saveDocumentToFirestore('customerLedger', ledgerEntry, currentTenantId);

    // 7. Pop Printable Invoice Modal
    setActiveInvoice(newInvoice);
    setIsInvoiceModalOpen(true);
  };

  // Product Save & Auto Purchase handler
  const handleSaveProductAndAutoPurchase = (p: Product) => {
    const existingProduct = products.find((x) => x.id === p.id);
    const isNew = !existingProduct;

    // Calculate stock added
    const oldStock = existingProduct ? existingProduct.currentStock : 0;
    const stockAdded = isNew ? p.currentStock : p.currentStock - oldStock;

    // Save/update product
    setProducts((prev) =>
      prev.some((x) => x.id === p.id) ? prev.map((x) => (x.id === p.id ? p : x)) : [p, ...prev]
    );
    saveDocumentToFirestore('products', p, currentTenantId);

    // Auto-Purchase creation if stock was added or initialized
    if (stockAdded > 0) {
      const unitCost = p.purchasePrice || 0;
      const totalCost = stockAdded * unitCost;
      const defaultSupplier = suppliers[0] || { id: 'sup-1', name: 'Aura Global Electronics Ltd.' };

      const autoPO: PurchaseInvoice = {
        id: `po-${Date.now()}`,
        poNumber: `PO-${Math.floor(10000 + Math.random() * 90000)}`,
        date: new Date().toISOString().split('T')[0],
        supplierId: defaultSupplier.id,
        supplierName: defaultSupplier.name,
        items: [
          {
            productId: p.id,
            productName: p.name,
            quantity: stockAdded,
            unitCost: unitCost,
            totalCost: totalCost
          }
        ],
        subtotal: totalCost,
        taxAmount: 0,
        discount: 0,
        grandTotal: totalCost,
        paidAmount: totalCost,
        dueAmount: 0,
        status: 'RECEIVED',
        paymentMethod: 'Cash'
      };

      // Record Auto Purchase
      setPurchases((prev) => [autoPO, ...prev]);
      saveDocumentToFirestore('purchases', autoPO, currentTenantId);

      // Record Stock Movement
      const sm: StockMovement = {
        id: `sm-${Date.now()}`,
        productId: p.id,
        productName: p.name,
        type: 'IN',
        quantity: stockAdded,
        date: new Date().toISOString().split('T')[0],
        referenceNo: autoPO.poNumber,
        note: `Auto Purchase logged on ${isNew ? 'New Product Creation' : 'Stock Addition'}`
      };
      setStockMovements((prev) => [sm, ...prev]);
      saveDocumentToFirestore('stockMovements', sm, currentTenantId);
    }
  };

  // Restock PO Handlers
  const handleSavePurchase = (newPO: PurchaseInvoice) => {
    setPurchases((prev) => [newPO, ...prev]);
    saveDocumentToFirestore('purchases', newPO, currentTenantId);

    // Update product stock
    setProducts((prev) =>
      prev.map((p) => {
        const item = newPO.items.find((it) => it.productId === p.id);
        if (item) {
          const updatedP = { ...p, currentStock: p.currentStock + item.quantity };
          saveDocumentToFirestore('products', updatedP, currentTenantId);
          return updatedP;
        }
        return p;
      })
    );

    // Update supplier due
    setSuppliers((prev) =>
      prev.map((s) => {
        if (s.id === newPO.supplierId) {
          const updatedS = { ...s, dueAmount: s.dueAmount + newPO.dueAmount };
          saveDocumentToFirestore('suppliers', updatedS, currentTenantId);
          return updatedS;
        }
        return s;
      })
    );

    // Log Stock Movement
    const movements: StockMovement[] = newPO.items.map((it) => ({
      id: `sm-${Date.now()}-${Math.random()}`,
      productId: it.productId,
      productName: it.productName,
      type: 'IN',
      quantity: it.quantity,
      date: new Date().toISOString().split('T')[0],
      referenceNo: newPO.poNumber,
      note: `PO from ${newPO.supplierName}`
    }));
    setStockMovements((prev) => [...movements, ...prev]);
    movements.forEach((m) => saveDocumentToFirestore('stockMovements', m, currentTenantId));

    // Record Supplier Ledger
    const supLedgerEntry: SupplierLedgerEntry = {
      id: `sl-${Date.now()}`,
      supplierId: newPO.supplierId,
      supplierName: newPO.supplierName,
      date: new Date().toISOString().split('T')[0],
      type: 'PURCHASE',
      referenceNo: newPO.poNumber,
      debit: newPO.paidAmount,
      credit: newPO.grandTotal,
      balance: newPO.dueAmount,
      description: `Purchase Order #${newPO.poNumber}`
    };
    setSupplierLedger((prev) => [supLedgerEntry, ...prev]);
    saveDocumentToFirestore('supplierLedger', supLedgerEntry, currentTenantId);
  };

  // Customer Due Payment
  const handleReceiveCustomerPayment = (customerId: string, amount: number, method: PaymentMethod, note: string) => {
    const cust = customers.find((c) => c.id === customerId);
    if (!cust) return;

    const newDue = Math.max(0, cust.dueAmount - amount);
    setCustomers((prev) =>
      prev.map((c) => (c.id === customerId ? { ...c, dueAmount: newDue } : c))
    );
    saveDocumentToFirestore('customers', { ...cust, dueAmount: newDue }, currentTenantId);

    const ledgerEntry: CustomerLedgerEntry = {
      id: `cl-${Date.now()}`,
      customerId,
      customerName: cust.name,
      date: new Date().toISOString().split('T')[0],
      type: 'PAYMENT',
      referenceNo: `REC-${Math.floor(1000 + Math.random() * 9000)}`,
      debit: 0,
      credit: amount,
      balance: newDue,
      description: `${note} (${method})`
    };
    setCustomerLedger((prev) => [ledgerEntry, ...prev]);
    saveDocumentToFirestore('customerLedger', ledgerEntry, currentTenantId);
  };

  // Receive Sale Due Payment from Sales Directory
  const handleReceiveSaleDuePayment = (invoiceId: string, amount: number, method: PaymentMethod) => {
    let targetCustId = '';
    let targetCustName = '';

    setSales((prev) =>
      prev.map((inv) => {
        if (inv.id === invoiceId) {
          targetCustId = inv.customerId;
          targetCustName = inv.customerName;
          const newPaid = inv.paidAmount + amount;
          const newDue = Math.max(0, inv.grandTotal - newPaid);
          const newStatus = newDue <= 0 ? 'PAID' : 'PARTIAL';
          const updatedInv = {
            ...inv,
            paidAmount: newPaid,
            dueAmount: newDue,
            paymentStatus: newStatus as any
          };
          saveDocumentToFirestore('sales', updatedInv, currentTenantId);
          return updatedInv;
        }
        return inv;
      })
    );

    if (targetCustId) {
      const cust = customers.find((c) => c.id === targetCustId);
      const newDue = cust ? Math.max(0, cust.dueAmount - amount) : 0;
      setCustomers((prev) =>
        prev.map((c) => (c.id === targetCustId ? { ...c, dueAmount: newDue } : c))
      );
      if (cust) saveDocumentToFirestore('customers', { ...cust, dueAmount: newDue }, currentTenantId);

      const ledgerEntry: CustomerLedgerEntry = {
        id: `cl-${Date.now()}`,
        customerId: targetCustId,
        customerName: targetCustName,
        date: new Date().toISOString().split('T')[0],
        type: 'PAYMENT',
        referenceNo: `DUE-PAY-${Math.floor(1000 + Math.random() * 9000)}`,
        debit: 0,
        credit: amount,
        balance: 0,
        description: `Due payment received for Invoice (${method})`
      };
      setCustomerLedger((prev) => [ledgerEntry, ...prev]);
      saveDocumentToFirestore('customerLedger', ledgerEntry, currentTenantId);
    }
  };

  const handleDeleteInvoice = (invoiceId: string) => {
    setSales((prev) => prev.filter((inv) => inv.id !== invoiceId));
    deleteDocumentFromFirestore('sales', invoiceId, currentTenantId);
  };

  const handleUpdateInvoice = (updatedInvoice: SaleInvoice) => {
    setSales((prev) =>
      prev.map((inv) => (inv.id === updatedInvoice.id ? updatedInvoice : inv))
    );
    saveDocumentToFirestore('sales', updatedInvoice, currentTenantId);
  };

  const handleUpdatePurchase = (updatedPO: PurchaseInvoice) => {
    setPurchases((prev) =>
      prev.map((po) => (po.id === updatedPO.id ? updatedPO : po))
    );
    saveDocumentToFirestore('purchases', updatedPO, currentTenantId);
  };

  const handleDeletePurchase = (poId: string) => {
    setPurchases((prev) => prev.filter((po) => po.id !== poId));
    deleteDocumentFromFirestore('purchases', poId, currentTenantId);
  };

  const handleUpdateExpense = (updatedExp: Expense) => {
    setExpenses((prev) =>
      prev.map((e) => (e.id === updatedExp.id ? updatedExp : e))
    );
    saveDocumentToFirestore('expenses', updatedExp, currentTenantId);
  };

  const handleDeleteExpense = (expId: string) => {
    setExpenses((prev) => prev.filter((e) => e.id !== expId));
    deleteDocumentFromFirestore('expenses', expId, currentTenantId);
  };

  const handleUpdateIncome = (updatedInc: Income) => {
    setIncomes((prev) =>
      prev.map((i) => (i.id === updatedInc.id ? updatedInc : i))
    );
    saveDocumentToFirestore('incomes', updatedInc, currentTenantId);
  };

  const handleDeleteIncome = (incId: string) => {
    setIncomes((prev) => prev.filter((i) => i.id !== incId));
    deleteDocumentFromFirestore('incomes', incId, currentTenantId);
  };

  // Supplier Payment
  const handlePaySupplier = (supplierId: string, amount: number, method: PaymentMethod, note: string) => {
    const supp = suppliers.find((s) => s.id === supplierId);
    if (!supp) return;

    const newDue = Math.max(0, supp.dueAmount - amount);
    setSuppliers((prev) =>
      prev.map((s) => (s.id === supplierId ? { ...s, dueAmount: newDue } : s))
    );
    saveDocumentToFirestore('suppliers', { ...supp, dueAmount: newDue }, currentTenantId);

    const supLedgerEntry: SupplierLedgerEntry = {
      id: `sl-${Date.now()}`,
      supplierId,
      supplierName: supp.name,
      date: new Date().toISOString().split('T')[0],
      type: 'PAYMENT',
      referenceNo: `PAY-${Math.floor(1000 + Math.random() * 9000)}`,
      debit: amount,
      credit: 0,
      balance: newDue,
      description: `${note || 'Supplier Payment'} (${method})`
    };
    setSupplierLedger((prev) => [supLedgerEntry, ...prev]);
    saveDocumentToFirestore('supplierLedger', supLedgerEntry, currentTenantId);
  };

  // Inventory Stock Adjustment
  const handleAdjustStock = (
    productId: string,
    quantity: number,
    type: 'ADJUSTMENT' | 'DAMAGE' | 'RETURN',
    note: string
  ) => {
    const prod = products.find((p) => p.id === productId);
    if (!prod) return;

    const stockDelta = type === 'DAMAGE' ? -quantity : quantity;
    const newStock = Math.max(0, prod.currentStock + stockDelta);
    const updatedProd = { ...prod, currentStock: newStock };

    setProducts((prev) => prev.map((p) => (p.id === productId ? updatedProd : p)));
    saveDocumentToFirestore('products', updatedProd, currentTenantId);

    const sm: StockMovement = {
      id: `sm-${Date.now()}`,
      productId,
      productName: prod.name,
      type: type === 'DAMAGE' ? 'OUT' : 'IN',
      quantity,
      date: new Date().toISOString().split('T')[0],
      referenceNo: `AUDIT-${Math.floor(1000 + Math.random() * 9000)}`,
      note: `${type}: ${note}`
    };
    setStockMovements((prev) => [sm, ...prev]);
    saveDocumentToFirestore('stockMovements', sm, currentTenantId);
  };

  // Full System Restore
  const handleRestoreBackupJSON = (backup: any) => {
    if (backup.products) {
      setProducts(backup.products);
      saveCollectionToFirestore('products', backup.products, currentTenantId);
    }
    if (backup.categories) {
      setCategories(backup.categories);
      saveCollectionToFirestore('categories', backup.categories, currentTenantId);
    }
    if (backup.customers) {
      setCustomers(backup.customers);
      saveCollectionToFirestore('customers', backup.customers, currentTenantId);
    }
    if (backup.suppliers) {
      setSuppliers(backup.suppliers);
      saveCollectionToFirestore('suppliers', backup.suppliers, currentTenantId);
    }
    if (backup.sales) {
      setSales(backup.sales);
      saveCollectionToFirestore('sales', backup.sales, currentTenantId);
    }
    if (backup.purchases) {
      setPurchases(backup.purchases);
      saveCollectionToFirestore('purchases', backup.purchases, currentTenantId);
    }
    if (backup.settings) {
      setSettings(backup.settings);
      saveSettingsToFirestore(backup.settings, currentTenantId);
    }
  };

  // Check authentication guard: require any valid logged in user session
  if (!userAuth) {
    return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className={`min-h-screen bg-slate-950 text-slate-100 flex font-sans antialiased selection:bg-indigo-500 selection:text-white ${darkMode ? 'dark' : ''}`}>
      {/* Sidebar Navigation */}
      <Sidebar
        currentView={activeTab}
        setCurrentView={setActiveTab}
        activeRole={activeRole}
        companyName={settings.storeName || settings.companyName || 'Retail Hub'}
        collapsed={collapsed}
        setCollapsed={setCollapsed}
      />

      {/* Main App Content Area */}
      <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${collapsed ? 'ml-20' : 'ml-64'}`}>
        <Header
          currentView={activeTab}
          setCurrentView={setActiveTab}
          activeRole={activeRole}
          setActiveRole={setActiveRole}
          onOpenSearch={() => setIsSearchModalOpen(true)}
          notifications={notifications}
          darkMode={darkMode}
          setDarkMode={setDarkMode}
          userEmail={userAuth.email}
          userName={userAuth.displayName}
          userPhoto={userAuth.photoURL}
          onLogout={handleLogout}
          onQuickAction={(action) => {
            if (action === 'sale') setActiveTab('pos');
            if (action === 'product') setActiveTab('products');
            if (action === 'expense') setActiveTab('expenses');
          }}
        />

        <main className="flex-1 overflow-y-auto custom-scrollbar">
          {activeTab === 'dashboard' && (
            <DashboardView
              products={products}
              sales={sales}
              purchases={purchases}
              expenses={expenses}
              incomes={incomes}
              customers={customers}
              settings={settings}
              onNavigate={(view) => setActiveTab(view)}
              onQuickPO={() => setActiveTab('products')}
            />
          )}

          {activeTab === 'pos' && (
            <POSView
              products={products}
              categories={categories}
              customers={customers}
              settings={settings}
              onCompleteSale={handleCompleteSale}
            />
          )}

          {(activeTab === 'sales-directory' || activeTab === 'sales' || activeTab === 'sales-list') && (
            <SalesDirectoryView
              sales={sales}
              settings={settings}
              products={products}
              customers={customers}
              onViewInvoice={(inv) => {
                setActiveInvoice(inv);
                setIsInvoiceModalOpen(true);
              }}
              onReceiveDuePayment={handleReceiveSaleDuePayment}
              onDeleteInvoice={handleDeleteInvoice}
              onUpdateInvoice={handleUpdateInvoice}
              onNavigateToPOS={() => setActiveTab('pos')}
            />
          )}

          {activeTab === 'products' && (
            <ProductsView
              products={products}
              categories={categories}
              brands={brands}
              units={units}
              stockMovements={stockMovements}
              settings={settings}
              tenantId={currentTenantId}
              onSaveProduct={handleSaveProductAndAutoPurchase}
              onDeleteProduct={(id) => {
                setProducts((prev) => prev.filter((p) => p.id !== id));
                deleteDocumentFromFirestore('products', id, currentTenantId);
              }}
              onAddCategory={(c) => {
                setCategories((prev) => [...prev, c]);
                saveDocumentToFirestore('categories', c, currentTenantId);
              }}
              onDeleteCategory={(id) => {
                setCategories((prev) => prev.filter((c) => c.id !== id));
                deleteDocumentFromFirestore('categories', id, currentTenantId);
              }}
              onAddBrand={(b) => {
                setBrands((prev) => [...prev, b]);
                saveDocumentToFirestore('brands', b, currentTenantId);
              }}
              onDeleteBrand={(id) => {
                setBrands((prev) => prev.filter((b) => b.id !== id));
                deleteDocumentFromFirestore('brands', id, currentTenantId);
              }}
              onAddUnit={(u) => {
                setUnits((prev) => [...prev, u]);
                saveDocumentToFirestore('units', u, currentTenantId);
              }}
              onDeleteUnit={(id) => {
                setUnits((prev) => prev.filter((u) => u.id !== id));
                deleteDocumentFromFirestore('units', id, currentTenantId);
              }}
            />
          )}

          {activeTab === 'purchases' && (
            <PurchasesView
              purchases={purchases}
              suppliers={suppliers}
              products={products}
              settings={settings}
              onSavePurchase={handleSavePurchase}
              onUpdatePurchase={handleUpdatePurchase}
              onDeletePurchase={handleDeletePurchase}
            />
          )}

          {activeTab === 'customers' && (
            <CustomersView
              customers={customers}
              customerLedger={customerLedger}
              settings={settings}
              onSaveCustomer={(c) => {
                setCustomers((prev) => {
                  const exists = prev.some((item) => item.id === c.id);
                  if (exists) {
                    return prev.map((item) => (item.id === c.id ? c : item));
                  }
                  return [c, ...prev];
                });
                saveDocumentToFirestore('customers', c, currentTenantId);
              }}
              onDeleteCustomer={(id) => {
                setCustomers((prev) => prev.filter((c) => c.id !== id));
                deleteDocumentFromFirestore('customers', id, currentTenantId);
              }}
              onReceiveCustomerPayment={handleReceiveCustomerPayment}
            />
          )}

          {activeTab === 'suppliers' && (
            <SuppliersView
              suppliers={suppliers}
              supplierLedger={supplierLedger}
              settings={settings}
              onSaveSupplier={(s) => {
                setSuppliers((prev) => {
                  const exists = prev.some((item) => item.id === s.id);
                  if (exists) {
                    return prev.map((item) => (item.id === s.id ? s : item));
                  }
                  return [s, ...prev];
                });
                saveDocumentToFirestore('suppliers', s, currentTenantId);
              }}
              onDeleteSupplier={(id) => {
                setSuppliers((prev) => prev.filter((s) => s.id !== id));
                deleteDocumentFromFirestore('suppliers', id, currentTenantId);
              }}
              onPaySupplier={handlePaySupplier}
            />
          )}

          {activeTab === 'inventory' && (
            <InventoryView
              products={products}
              stockMovements={stockMovements}
              settings={settings}
              onAdjustStock={handleAdjustStock}
              onQuickPO={() => setActiveTab('products')}
            />
          )}

          {activeTab === 'accounting' && (
            <AccountingView
              customerLedger={customerLedger}
              supplierLedger={supplierLedger}
              sales={sales}
              purchases={purchases}
              expenses={expenses}
              incomes={incomes}
              settings={settings}
            />
          )}

          {(activeTab === 'expenses' || activeTab === 'incomes' || activeTab === 'expense-income' || activeTab === 'expenses-income') && (
            <ExpenseIncomeView
              expenses={expenses}
              incomes={incomes}
              expenseCats={expenseCats}
              incomeCats={incomeCats}
              settings={settings}
              onAddExpense={(e) => {
                setExpenses((prev) => [e, ...prev]);
                saveDocumentToFirestore('expenses', e, currentTenantId);
              }}
              onAddIncome={(i) => {
                setIncomes((prev) => [i, ...prev]);
                saveDocumentToFirestore('incomes', i, currentTenantId);
              }}
              onUpdateExpense={handleUpdateExpense}
              onDeleteExpense={handleDeleteExpense}
              onUpdateIncome={handleUpdateIncome}
              onDeleteIncome={handleDeleteIncome}
              initialType="expense"
            />
          )}

          {activeTab === 'reports' && (
            <ReportsView
              sales={sales}
              products={products}
              customers={customers}
              suppliers={suppliers}
              expenses={expenses}
              incomes={incomes}
              purchases={purchases}
              settings={settings}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsView
              settings={settings}
              tenantId={currentTenantId}
              onSaveSettings={(s) => {
                setSettings(s);
                saveSettingsToFirestore(s, currentTenantId);
              }}
              onRestoreBackupJSON={handleRestoreBackupJSON}
              fullDataBackup={{
                products,
                categories,
                brands,
                units,
                customers,
                suppliers,
                sales,
                purchases,
                expenses,
                incomes,
                settings
              }}
            />
          )}
        </main>
      </div>

      {/* Global Search Modal */}
      <GlobalSearchModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
        products={products}
        customers={customers}
        suppliers={suppliers}
        sales={sales}
        settings={settings}
        onSelectResult={(type, item) => {
          setIsSearchModalOpen(false);
          if (type === 'product') setActiveTab('products');
          if (type === 'customer') setActiveTab('customers');
          if (type === 'supplier') setActiveTab('suppliers');
          if (type === 'invoice') {
            setActiveInvoice(item);
            setIsInvoiceModalOpen(true);
          }
        }}
      />

      {/* Printable Invoice Modal */}
      <InvoiceModal
        isOpen={isInvoiceModalOpen}
        onClose={() => setIsInvoiceModalOpen(false)}
        invoice={activeInvoice}
        settings={settings}
      />
    </div>
  );
}
