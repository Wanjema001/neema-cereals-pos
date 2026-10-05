import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import {
  Product,
  Sale,
  Purchase,
  Expense,
  DailyRegisterClose,
  AuditLog,
  UserRole,
  PaymentMode,
  CartItem,
  Category,
  Unit,
  LowStockAlert,
  UserAccount,
  ReportEmailDispatch
} from '../types';
import {
  INITIAL_USERS,
  INITIAL_PRODUCTS,
  INITIAL_SALES,
  INITIAL_PURCHASES,
  INITIAL_EXPENSES,
  INITIAL_DAILY_CLOSES,
  INITIAL_AUDIT_LOGS
} from '../data/initialData';

interface AppContextType {
  // Auth & User Accounts
  users: UserAccount[];
  currentUser: UserAccount | null;
  currentRole: UserRole;
  currentUserName: string;
  isSuperAdmin: boolean;
  login: (username: string, password: string) => { success: boolean; error?: string };
  logout: () => void;
  createUserAccount: (data: {
    name: string;
    username: string;
    email?: string;
    role: UserRole;
    password: string;
    phone?: string;
  }) => { success: boolean; error?: string };
  updateUserAccount: (id: string, updates: Partial<UserAccount>) => void;
  deleteUserAccount: (id: string) => { success: boolean; error?: string };

  // Data
  products: Product[];
  sales: Sale[];
  purchases: Purchase[];
  expenses: Expense[];
  dailyCloses: DailyRegisterClose[];
  auditLogs: AuditLog[];
  reportDispatches: ReportEmailDispatch[];

  // Email Reports
  sendMonthlyReportToAdmins: () => {
    success: boolean;
    recipientEmails: string[];
    summary: string;
    mailtoUrl: string;
  };

  // Stock & Inventory
  lowStockProducts: Product[];
  activeAlertModal: LowStockAlert | null;
  dismissAlertModal: () => void;
  addProduct: (product: Omit<Product, 'id'>) => Product;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  adjustStock: (productId: string, newStock: number, reason: string) => void;

  // Sales
  recordSale: (data: {
    items: CartItem[];
    paymentMode: PaymentMode;
    mpesaRef?: string;
    notes?: string;
  }) => { success: boolean; sale?: Sale; error?: string };
  lastCompletedSale: Sale | null;
  setLastCompletedSale: (sale: Sale | null) => void;

  // Purchases
  recordPurchase: (data: {
    productName: string;
    productId?: string;
    category: Category;
    unit: Unit;
    quantity: number;
    buyingPricePerUnit: number;
    vendorName: string;
  }) => Purchase;
  approvePurchase: (id: string) => void;
  rejectPurchase: (id: string) => void;

  // Expenses
  recordExpense: (data: {
    description: string;
    category: Expense['category'];
    amount: number;
    receiptNumber?: string;
  }) => Expense;

  // Daily Register & EOD Calculation
  openingCashToday: number;
  setOpeningCashToday: (amount: number) => void;
  calculateEndOfDay: (dateStr?: string) => {
    date: string;
    totalSales: number;
    cashSales: number;
    mpesaSales: number;
    totalExpenses: number;
    openingCash: number;
    cashAtHand: number;
    salesCount: number;
    expenseCount: number;
  };
  commitDailyClose: (data: {
    date?: string;
    nextDayOpeningCash: number;
    notes?: string;
  }) => DailyRegisterClose;

  // Reset
  resetToDefaultData: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const LOCAL_STORAGE_PREFIX = 'neema_pos_auth_v3_';

// One-time purge of any previous test keys from localStorage
if (typeof window !== 'undefined') {
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && (k.startsWith('neema_cereals_') || (k.startsWith('neema_pos_') && !k.startsWith(LOCAL_STORAGE_PREFIX)))) {
        keysToRemove.push(k);
      }
    }
    keysToRemove.forEach(k => localStorage.removeItem(k));
  } catch {
    // Ignore storage errors in restricted contexts
  }
}

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const loadLocal = <T,>(key: string, fallback: T): T => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_PREFIX + key);
      return stored ? JSON.parse(stored) : fallback;
    } catch {
      return fallback;
    }
  };

  // User Accounts State (Super Admin Wanjema default)
  const [users, setUsers] = useState<UserAccount[]>(() => {
    const loaded = loadLocal<UserAccount[]>('users', INITIAL_USERS);
    const hasWanjema = loaded.some(u => u.username === 'wanjema');
    if (!hasWanjema) {
      return [...INITIAL_USERS, ...loaded];
    }
    return loaded;
  });

  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() =>
    loadLocal<UserAccount | null>('current_user', null)
  );

  const currentRole: UserRole = currentUser ? currentUser.role : 'cashier';
  const currentUserName: string = currentUser ? currentUser.name : '';
  const isSuperAdmin: boolean = Boolean(
    currentUser?.isSuperAdmin || currentUser?.username.toLowerCase() === 'wanjema'
  );

  const [products, setProducts] = useState<Product[]>(() =>
    loadLocal<Product[]>('products', INITIAL_PRODUCTS)
  );
  const [sales, setSales] = useState<Sale[]>(() =>
    loadLocal<Sale[]>('sales', INITIAL_SALES)
  );
  const [purchases, setPurchases] = useState<Purchase[]>(() =>
    loadLocal<Purchase[]>('purchases', INITIAL_PURCHASES)
  );
  const [expenses, setExpenses] = useState<Expense[]>(() =>
    loadLocal<Expense[]>('expenses', INITIAL_EXPENSES)
  );
  const [dailyCloses, setDailyCloses] = useState<DailyRegisterClose[]>(() =>
    loadLocal<DailyRegisterClose[]>('daily_closes', INITIAL_DAILY_CLOSES)
  );
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() =>
    loadLocal<AuditLog[]>('audit_logs', INITIAL_AUDIT_LOGS)
  );
  const [reportDispatches, setReportDispatches] = useState<ReportEmailDispatch[]>(() =>
    loadLocal<ReportEmailDispatch[]>('report_dispatches', [])
  );

  const [openingCashToday, setOpeningCashTodayState] = useState<number>(() =>
    loadLocal<number>('opening_cash_today', 0)
  );

  const [lastCompletedSale, setLastCompletedSale] = useState<Sale | null>(null);
  const [activeAlertModal, setActiveAlertModal] = useState<LowStockAlert | null>(null);

  // Sync state to localStorage
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_PREFIX + 'users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_PREFIX + 'current_user', JSON.stringify(currentUser));
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_PREFIX + 'products', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_PREFIX + 'sales', JSON.stringify(sales));
  }, [sales]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_PREFIX + 'purchases', JSON.stringify(purchases));
  }, [purchases]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_PREFIX + 'expenses', JSON.stringify(expenses));
  }, [expenses]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_PREFIX + 'daily_closes', JSON.stringify(dailyCloses));
  }, [dailyCloses]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_PREFIX + 'audit_logs', JSON.stringify(auditLogs));
  }, [auditLogs]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_PREFIX + 'report_dispatches', JSON.stringify(reportDispatches));
  }, [reportDispatches]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_PREFIX + 'opening_cash_today', JSON.stringify(openingCashToday));
  }, [openingCashToday]);

  const setOpeningCashToday = (amount: number) => {
    setOpeningCashTodayState(amount);
  };

  // Add audit log helper
  const addAuditLog = useCallback(
    (action: string, details: string, category: AuditLog['category']) => {
      const newLog: AuditLog = {
        id: 'log-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
        action,
        details,
        category,
        actor: currentUserName || 'System',
        role: currentRole,
        timestamp: new Date().toISOString()
      };
      setAuditLogs(prev => [newLog, ...prev]);
    },
    [currentUserName, currentRole]
  );

  // AUTHENTICATION: LOGIN
  const login = useCallback(
    (usernameInput: string, passwordInput: string) => {
      const cleanUser = usernameInput.trim().toLowerCase();
      const cleanPass = passwordInput.trim();

      const foundUser = users.find(u => u.username.toLowerCase() === cleanUser);
      if (!foundUser) {
        return {
          success: false,
          error: 'Account not found. Please verify username or contact Super Admin Wanjema.'
        };
      }

      if (foundUser.status === 'suspended') {
        return {
          success: false,
          error: 'This account has been deactivated. Please contact Super Admin Wanjema.'
        };
      }

      if (foundUser.password !== cleanPass) {
        return {
          success: false,
          error: 'Incorrect password or PIN. Please try again.'
        };
      }

      setCurrentUser(foundUser);
      addAuditLog('User Login', `${foundUser.name} logged into ${foundUser.role.toUpperCase()} dashboard`, 'auth');
      return { success: true };
    },
    [users, addAuditLog]
  );

  // AUTHENTICATION: LOGOUT
  const logout = useCallback(() => {
    if (currentUser) {
      addAuditLog('User Logout', `${currentUser.name} signed out`, 'auth');
    }
    setCurrentUser(null);
  }, [currentUser, addAuditLog]);

  // SUPER ADMIN: CREATE STAFF ACCOUNT
  const createUserAccount = useCallback(
    (data: {
      name: string;
      username: string;
      email?: string;
      role: UserRole;
      password: string;
      phone?: string;
    }) => {
      if (!isSuperAdmin && currentRole !== 'admin') {
        return { success: false, error: 'Unauthorized: Only Super Admin Wanjema can create staff accounts.' };
      }

      const cleanUser = data.username.trim().toLowerCase();
      if (!cleanUser) {
        return { success: false, error: 'Username is required.' };
      }

      const exists = users.some(u => u.username.toLowerCase() === cleanUser);
      if (exists) {
        return { success: false, error: `Username "${cleanUser}" is already taken. Please choose another.` };
      }

      if (!data.password.trim()) {
        return { success: false, error: 'Password or PIN is required.' };
      }

      const newUser: UserAccount = {
        id: 'usr-' + Date.now(),
        name: data.name.trim(),
        username: cleanUser,
        email: data.email?.trim() || undefined,
        role: data.role,
        password: data.password.trim(),
        phone: data.phone?.trim(),
        isSuperAdmin: false,
        createdAt: new Date().toISOString(),
        status: 'active'
      };

      setUsers(prev => [...prev, newUser]);
      addAuditLog(
        'Staff Account Created',
        `Super Admin Wanjema created ${data.role} account for ${data.name} (@${cleanUser})`,
        'auth'
      );

      return { success: true };
    },
    [isSuperAdmin, currentRole, users, addAuditLog]
  );

  // UPDATE STAFF ACCOUNT (Including password reset for any user by Super Admin Wanjema)
  const updateUserAccount = useCallback(
    (id: string, updates: Partial<UserAccount>) => {
      setUsers(prev =>
        prev.map(u => {
          if (u.id !== id) return u;
          // Protect Super Admin role from accidental change
          if (u.isSuperAdmin && updates.role && updates.role !== 'admin') {
            return u;
          }
          return { ...u, ...updates };
        })
      );
      addAuditLog('Account Updated', `Updated account/credentials for user ID ${id}`, 'auth');
    },
    [addAuditLog]
  );

  // DELETE / DEACTIVATE STAFF ACCOUNT
  const deleteUserAccount = useCallback(
    (id: string) => {
      const target = users.find(u => u.id === id);
      if (!target) return { success: false, error: 'User not found' };
      if (target.isSuperAdmin || target.username.toLowerCase() === 'wanjema') {
        return { success: false, error: 'Super Admin Wanjema account cannot be deleted.' };
      }

      setUsers(prev => prev.filter(u => u.id !== id));
      addAuditLog('Account Removed', `Super Admin removed staff account for ${target.name}`, 'auth');
      return { success: true };
    },
    [users, addAuditLog]
  );

  // MONTHLY REPORT EMAIL DISPATCH TO ALL REGISTERED ADMINS
  const sendMonthlyReportToAdmins = useCallback(() => {
    // Collect all admin emails
    const adminAccounts = users.filter(u => u.role === 'admin' && u.email?.trim());
    const recipientEmails = adminAccounts.map(u => u.email!.trim());

    if (recipientEmails.length === 0) {
      recipientEmails.push('mutongawanjema001@gmail.com');
    }

    const now = new Date();
    const currentMonthStr = now.toLocaleString('en-KE', { month: 'long', year: 'numeric' });
    const currentMonthKey = now.toISOString().slice(0, 7); // YYYY-MM

    const monthSales = sales.filter(s => s.date.startsWith(currentMonthKey));
    const totalRevenue = monthSales.reduce((acc, s) => acc + s.subtotal, 0);

    let totalCogs = 0;
    monthSales.forEach(s => {
      s.items.forEach(it => {
        const prod = products.find(p => p.id === it.productId);
        const costPerUnit = prod ? prod.buyingPrice : it.pricePerUnit * 0.75;
        totalCogs += it.quantity * costPerUnit;
      });
    });

    const monthExpenses = expenses.filter(e => e.date.startsWith(currentMonthKey));
    const totalExpenses = monthExpenses.reduce((acc, e) => acc + e.amount, 0);
    const netProfit = totalRevenue - totalCogs - totalExpenses;

    const cashSales = monthSales.filter(s => s.paymentMode === 'cash').reduce((acc, s) => acc + s.subtotal, 0);
    const mpesaSales = monthSales.filter(s => s.paymentMode === 'mpesa').reduce((acc, s) => acc + s.subtotal, 0);

    const monthCloses = dailyCloses.filter(c => c.date.startsWith(currentMonthKey));
    const totalDeposits = monthCloses.reduce((acc, c) => acc + c.depositAmount, 0);

    const summary = `NEEMA CEREALS - MONTHLY EXECUTIVE FINANCIAL REPORT
==================================================
Period: ${currentMonthStr}
Generated At: ${now.toLocaleString('en-KE')}
Store: Nairobi Branch
Super Admin: Wanjema
==================================================

EXECUTIVE FINANCIAL SUMMARY:
--------------------------------------------------
* Total Gross Sales: Ksh ${totalRevenue.toLocaleString()}
* Cost of Goods Sold (COGS): Ksh ${totalCogs.toLocaleString()}
* Petty Expenses Incurred: Ksh ${totalExpenses.toLocaleString()}
--------------------------------------------------
* NET BUSINESS PROFIT: Ksh ${netProfit.toLocaleString()}
--------------------------------------------------

PAYMENT CHANNEL DISTRIBUTION:
* M-Pesa Total: Ksh ${mpesaSales.toLocaleString()}
* Cash Total: Ksh ${cashSales.toLocaleString()}
* Total Transactions Recorded: ${monthSales.length} orders

DAILY BANK DEPOSITS:
* Total Bank Deposits Reconciled: Ksh ${totalDeposits.toLocaleString()}
* Register Closures Logged: ${monthCloses.length} days

==================================================
CONFIDENTIAL - AUTOMATED REPORT DISPATCH TO REGISTERED ADMINS:
Recipients: ${recipientEmails.join(', ')}
`;

    const dispatchRecord: ReportEmailDispatch = {
      id: 'disp-' + Date.now(),
      sentAt: now.toISOString(),
      recipientEmails,
      reportMonth: currentMonthStr,
      totalRevenue,
      netProfit,
      status: 'sent'
    };

    setReportDispatches(prev => [dispatchRecord, ...prev]);

    addAuditLog(
      'Monthly Report Emailed',
      `Sent ${currentMonthStr} executive financial report to all admins (${recipientEmails.join(', ')})`,
      'register'
    );

    const subject = encodeURIComponent(`Neema Cereals - Executive Monthly Report (${currentMonthStr})`);
    const body = encodeURIComponent(summary.trim());
    const mailtoUrl = `mailto:${recipientEmails.join(',')}?subject=${subject}&body=${body}`;

    return {
      success: true,
      recipientEmails,
      summary,
      mailtoUrl
    };
  }, [users, sales, products, expenses, dailyCloses, addAuditLog]);

  // Low stock products calculation
  const lowStockProducts = useMemo(() => {
    return products.filter(p => p.currentStock <= p.minStockThreshold);
  }, [products]);

  const dismissAlertModal = () => {
    setActiveAlertModal(null);
  };

  const playAlertSound = useCallback(() => {
    try {
      const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.3);
    } catch {
      // Audio not permitted without user gesture
    }
  }, []);

  // 1. RECORD SALE
  const recordSale = useCallback(
    (data: {
      items: CartItem[];
      paymentMode: PaymentMode;
      mpesaRef?: string;
      notes?: string;
    }) => {
      if (!data.items || data.items.length === 0) {
        return { success: false, error: 'Cart is empty' };
      }

      for (const item of data.items) {
        const prod = products.find(p => p.id === item.productId);
        if (prod && prod.currentStock < item.quantity) {
          return {
            success: false,
            error: `Insufficient stock for ${prod.name}. Available: ${prod.currentStock} ${prod.unit}, Requested: ${item.quantity} ${prod.unit}`
          };
        }
      }

      const now = new Date();
      const dateStr = now.toISOString().split('T')[0];
      const receiptNo = `NC-${now.getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
      const subtotal = data.items.reduce((sum, it) => sum + it.total, 0);

      const newSale: Sale = {
        id: 'sale-' + Date.now(),
        receiptNo,
        timestamp: now.toISOString(),
        date: dateStr,
        items: data.items,
        subtotal,
        paymentMode: data.paymentMode,
        mpesaRef: data.paymentMode === 'mpesa' ? data.mpesaRef || `MP${Date.now().toString().slice(-6)}` : undefined,
        cashierName: currentUserName || 'Cashier',
        cashierRole: currentRole,
        notes: data.notes
      };

      let triggeredLowStock: LowStockAlert | null = null;

      setProducts(prevProducts => {
        return prevProducts.map(prod => {
          const cartItem = data.items.find(it => it.productId === prod.id);
          if (!cartItem) return prod;

          const updatedStock = Math.max(0, Number((prod.currentStock - cartItem.quantity).toFixed(2)));

          if (updatedStock <= prod.minStockThreshold && prod.currentStock > prod.minStockThreshold) {
            triggeredLowStock = {
              id: 'alert-' + Date.now(),
              productId: prod.id,
              productName: prod.name,
              currentStock: updatedStock,
              unit: prod.unit,
              minThreshold: prod.minStockThreshold,
              triggeredAt: new Date().toLocaleTimeString()
            };
          }

          return {
            ...prod,
            currentStock: updatedStock
          };
        });
      });

      setSales(prev => [newSale, ...prev]);
      setLastCompletedSale(newSale);

      const itemSummary = data.items.map(i => `${i.name} (${i.quantity}${i.unit})`).join(', ');
      addAuditLog(
        'Sale Recorded',
        `Receipt ${receiptNo} for Ksh ${subtotal.toLocaleString()} (${data.paymentMode.toUpperCase()}) - ${itemSummary}`,
        'sale'
      );

      if (triggeredLowStock) {
        setActiveAlertModal(triggeredLowStock);
        playAlertSound();
      }

      return { success: true, sale: newSale };
    },
    [products, currentUserName, currentRole, addAuditLog, playAlertSound]
  );

  // 2. RECORD PURCHASE
  const recordPurchase = useCallback(
    (data: {
      productName: string;
      productId?: string;
      category: Category;
      unit: Unit;
      quantity: number;
      buyingPricePerUnit: number;
      vendorName: string;
    }) => {
      const now = new Date();
      const dateStr = now.toISOString().split('T')[0];
      const isApprovedImmediately = currentRole === 'admin';
      const totalCost = Number((data.quantity * data.buyingPricePerUnit).toFixed(2));

      const matchedProduct =
        (data.productId ? products.find(p => p.id === data.productId) : null) ||
        products.find(p => p.name.toLowerCase() === data.productName.trim().toLowerCase());

      const newPurchase: Purchase = {
        id: 'purch-' + Date.now(),
        productName: matchedProduct ? matchedProduct.name : data.productName.trim(),
        productId: matchedProduct?.id,
        category: data.category,
        unit: data.unit,
        quantity: data.quantity,
        buyingPricePerUnit: data.buyingPricePerUnit,
        totalCost,
        vendorName: data.vendorName.trim(),
        timestamp: now.toISOString(),
        date: dateStr,
        addedBy: currentUserName || 'Staff',
        role: currentRole,
        status: isApprovedImmediately ? 'approved' : 'pending',
        approvedAt: isApprovedImmediately ? now.toISOString() : undefined,
        approvedBy: isApprovedImmediately ? currentUserName : undefined
      };

      setPurchases(prev => [newPurchase, ...prev]);

      if (isApprovedImmediately) {
        if (matchedProduct) {
          setProducts(prev =>
            prev.map(p =>
              p.id === matchedProduct.id
                ? {
                    ...p,
                    currentStock: Number((p.currentStock + data.quantity).toFixed(2)),
                    buyingPrice: data.buyingPricePerUnit,
                    lastRestocked: dateStr
                  }
                : p
            )
          );
        } else {
          const newProd: Product = {
            id: 'prod-' + Date.now(),
            name: data.productName.trim(),
            category: data.category,
            unit: data.unit,
            currentStock: data.quantity,
            minStockThreshold: data.unit === 'grams' ? 500 : 5,
            buyingPrice: data.buyingPricePerUnit,
            sellingPrice: Number((data.buyingPricePerUnit * 1.3).toFixed(2)),
            lastRestocked: dateStr
          };
          setProducts(prev => [...prev, newProd]);
        }

        addAuditLog(
          'Purchase Added & Approved',
          `Restocked ${data.quantity} ${data.unit} of ${newPurchase.productName} at Ksh ${data.buyingPricePerUnit}/${data.unit} from ${data.vendorName}`,
          'purchase'
        );
      } else {
        addAuditLog(
          'Purchase Submitted (Pending Approval)',
          `Cashier ${currentUserName} submitted purchase of ${data.quantity} ${data.unit} ${newPurchase.productName} awaiting admin approval`,
          'purchase'
        );
      }

      return newPurchase;
    },
    [currentRole, currentUserName, products, addAuditLog]
  );

  // 3. APPROVE PURCHASE (Admin only)
  const approvePurchase = useCallback(
    (purchaseId: string) => {
      const targetPurchase = purchases.find(p => p.id === purchaseId);
      if (!targetPurchase || targetPurchase.status === 'approved') return;

      const now = new Date();
      setPurchases(prev =>
        prev.map(p =>
          p.id === purchaseId
            ? {
                ...p,
                status: 'approved',
                approvedAt: now.toISOString(),
                approvedBy: currentUserName
              }
            : p
        )
      );

      setProducts(prev => {
        const existing =
          (targetPurchase.productId ? prev.find(p => p.id === targetPurchase.productId) : null) ||
          prev.find(p => p.name.toLowerCase() === targetPurchase.productName.toLowerCase());

        if (existing) {
          return prev.map(p =>
            p.id === existing.id
              ? {
                  ...p,
                  currentStock: Number((p.currentStock + targetPurchase.quantity).toFixed(2)),
                  buyingPrice: targetPurchase.buyingPricePerUnit,
                  lastRestocked: now.toISOString().split('T')[0]
                }
              : p
          );
        } else {
          const newProd: Product = {
            id: 'prod-' + Date.now(),
            name: targetPurchase.productName,
            category: targetPurchase.category,
            unit: targetPurchase.unit,
            currentStock: targetPurchase.quantity,
            minStockThreshold: targetPurchase.unit === 'grams' ? 500 : 5,
            buyingPrice: targetPurchase.buyingPricePerUnit,
            sellingPrice: Number((targetPurchase.buyingPricePerUnit * 1.3).toFixed(2)),
            lastRestocked: now.toISOString().split('T')[0]
          };
          return [...prev, newProd];
        }
      });

      addAuditLog(
        'Purchase Approved',
        `Approved stock entry for ${targetPurchase.quantity} ${targetPurchase.unit} of ${targetPurchase.productName} by ${currentUserName}`,
        'purchase'
      );
    },
    [purchases, currentUserName, addAuditLog]
  );

  // 4. REJECT PURCHASE (Admin only)
  const rejectPurchase = useCallback(
    (purchaseId: string) => {
      const target = purchases.find(p => p.id === purchaseId);
      if (!target) return;

      setPurchases(prev =>
        prev.map(p => (p.id === purchaseId ? { ...p, status: 'rejected' } : p))
      );

      addAuditLog(
        'Purchase Rejected',
        `Admin rejected purchase order #${purchaseId.slice(-6)} for ${target.productName}`,
        'purchase'
      );
    },
    [purchases, addAuditLog]
  );

  // 5. RECORD EXPENSE
  const recordExpense = useCallback(
    (data: {
      description: string;
      category: Expense['category'];
      amount: number;
      receiptNumber?: string;
    }) => {
      const now = new Date();
      const dateStr = now.toISOString().split('T')[0];

      const newExpense: Expense = {
        id: 'exp-' + Date.now(),
        description: data.description.trim(),
        category: data.category,
        amount: Number(data.amount),
        timestamp: now.toISOString(),
        date: dateStr,
        loggedBy: currentUserName || 'Staff',
        role: currentRole,
        receiptNumber: data.receiptNumber?.trim()
      };

      setExpenses(prev => [newExpense, ...prev]);

      addAuditLog(
        'Expense Recorded',
        `Ksh ${data.amount.toLocaleString()} for ${data.description} (${data.category})`,
        'expense'
      );

      return newExpense;
    },
    [currentUserName, currentRole, addAuditLog]
  );

  // 6. CALCULATE END OF DAY
  const calculateEndOfDay = useCallback(
    (targetDate?: string) => {
      const dateToUse = targetDate || new Date().toISOString().split('T')[0];

      const daySales = sales.filter(s => s.date === dateToUse);
      const totalSales = daySales.reduce((acc, s) => acc + s.subtotal, 0);

      const mpesaSales = daySales
        .filter(s => s.paymentMode === 'mpesa')
        .reduce((acc, s) => acc + s.subtotal, 0);

      const cashSales = daySales
        .filter(s => s.paymentMode === 'cash')
        .reduce((acc, s) => acc + s.subtotal, 0);

      const dayExpenses = expenses.filter(e => e.date === dateToUse);
      const totalExpenses = dayExpenses.reduce((acc, e) => acc + e.amount, 0);

      const cashRemainingAfterExpenses = cashSales - totalExpenses;
      const cashAtHand = openingCashToday + cashRemainingAfterExpenses;

      return {
        date: dateToUse,
        totalSales,
        cashSales,
        mpesaSales,
        totalExpenses,
        openingCash: openingCashToday,
        cashAtHand,
        salesCount: daySales.length,
        expenseCount: dayExpenses.length
      };
    },
    [sales, expenses, openingCashToday]
  );

  // 7. COMMIT DAILY CLOSE & DEPOSIT
  const commitDailyClose = useCallback(
    (data: { date?: string; nextDayOpeningCash: number; notes?: string }) => {
      const dateToUse = data.date || new Date().toISOString().split('T')[0];
      const calc = calculateEndOfDay(dateToUse);

      const depositAmount = calc.cashAtHand - data.nextDayOpeningCash;

      const newClose: DailyRegisterClose = {
        id: 'close-' + Date.now(),
        date: dateToUse,
        timestamp: new Date().toISOString(),
        closedBy: currentUserName || 'Store Staff',
        totalSales: calc.totalSales,
        cashSales: calc.cashSales,
        mpesaSales: calc.mpesaSales,
        totalExpenses: calc.totalExpenses,
        openingCash: calc.openingCash,
        cashAtHand: calc.cashAtHand,
        nextDayOpeningCash: data.nextDayOpeningCash,
        depositAmount,
        notes: data.notes
      };

      setDailyCloses(prev => {
        const filtered = prev.filter(c => c.date !== dateToUse);
        return [newClose, ...filtered];
      });

      setOpeningCashTodayState(data.nextDayOpeningCash);

      addAuditLog(
        'Daily Register Closed',
        `Closed register for ${dateToUse}. Total Sales: Ksh ${calc.totalSales.toLocaleString()}. Bank Deposit: Ksh ${depositAmount.toLocaleString()}`,
        'register'
      );

      return newClose;
    },
    [calculateEndOfDay, currentUserName, addAuditLog]
  );

  // PRODUCT CRUD
  const addProduct = useCallback(
    (product: Omit<Product, 'id'>) => {
      const newProd: Product = {
        ...product,
        id: 'prod-' + Date.now()
      };
      setProducts(prev => [newProd, ...prev]);
      addAuditLog(
        'Product Added',
        `Added new product ${newProd.name} (${newProd.category}, ${newProd.unit}) at Ksh ${newProd.sellingPrice}/${newProd.unit}`,
        'inventory'
      );
      return newProd;
    },
    [addAuditLog]
  );

  const updateProduct = useCallback(
    (id: string, updates: Partial<Product>) => {
      setProducts(prev =>
        prev.map(p => (p.id === id ? { ...p, ...updates } : p))
      );
      addAuditLog('Product Updated', `Updated product details for ID ${id}`, 'inventory');
    },
    [addAuditLog]
  );

  const deleteProduct = useCallback(
    (id: string) => {
      const prod = products.find(p => p.id === id);
      setProducts(prev => prev.filter(p => p.id !== id));
      if (prod) {
        addAuditLog('Product Deleted', `Deleted product ${prod.name} from catalog`, 'inventory');
      }
    },
    [products, addAuditLog]
  );

  const adjustStock = useCallback(
    (productId: string, newStock: number, reason: string) => {
      setProducts(prev =>
        prev.map(p => (p.id === productId ? { ...p, currentStock: newStock } : p))
      );
      const prod = products.find(p => p.id === productId);
      addAuditLog(
        'Stock Adjusted Manually',
        `Stock for ${prod?.name || productId} adjusted to ${newStock} (${reason})`,
        'inventory'
      );
    },
    [products, addAuditLog]
  );

  const resetToDefaultData = useCallback(() => {
    setProducts(INITIAL_PRODUCTS);
    setSales(INITIAL_SALES);
    setPurchases(INITIAL_PURCHASES);
    setExpenses(INITIAL_EXPENSES);
    setDailyCloses(INITIAL_DAILY_CLOSES);
    setAuditLogs(INITIAL_AUDIT_LOGS);
    setOpeningCashTodayState(0);
    setUsers(INITIAL_USERS);
    setCurrentUser(null);
    localStorage.clear();
  }, []);

  return (
    <AppContext.Provider
      value={{
        users,
        currentUser,
        currentRole,
        currentUserName,
        isSuperAdmin,
        login,
        logout,
        createUserAccount,
        updateUserAccount,
        deleteUserAccount,
        products,
        sales,
        purchases,
        expenses,
        dailyCloses,
        auditLogs,
        reportDispatches,
        sendMonthlyReportToAdmins,
        lowStockProducts,
        activeAlertModal,
        dismissAlertModal,
        addProduct,
        updateProduct,
        deleteProduct,
        adjustStock,
        recordSale,
        lastCompletedSale,
        setLastCompletedSale,
        recordPurchase,
        approvePurchase,
        rejectPurchase,
        recordExpense,
        openingCashToday,
        setOpeningCashToday,
        calculateEndOfDay,
        commitDailyClose,
        resetToDefaultData
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
