export type Category = 'Cereals' | 'Rice' | 'Salad' | 'Flour' | 'Spices' | 'Hardware';

export type Unit = 'kg' | 'liters' | 'grams' | 'items';

export type UserRole = 'admin' | 'cashier';

export type PaymentMode = 'cash' | 'mpesa';

export interface UserAccount {
  id: string;
  name: string;
  username: string;
  email?: string;
  role: UserRole;
  password: string;
  phone?: string;
  isSuperAdmin?: boolean;
  createdAt: string;
  status: 'active' | 'suspended';
}

export interface ReportEmailDispatch {
  id: string;
  sentAt: string;
  recipientEmails: string[];
  reportMonth: string;
  totalRevenue: number;
  netProfit: number;
  status: 'sent' | 'scheduled';
}

export interface Product {
  id: string;
  name: string;
  category: Category;
  unit: Unit;
  currentStock: number;
  minStockThreshold: number; // e.g. 5 for kg/liters/items, 500 for grams
  buyingPrice: number; // Ksh per unit
  sellingPrice: number; // Ksh per unit
  barcode?: string;
  description?: string;
  lastRestocked?: string;
}

export interface CartItem {
  productId: string;
  name: string;
  category: Category;
  unit: Unit;
  quantity: number;
  pricePerUnit: number;
  total: number;
}

export interface Sale {
  id: string;
  receiptNo: string;
  timestamp: string; // ISO
  date: string; // YYYY-MM-DD
  items: CartItem[];
  subtotal: number;
  paymentMode: PaymentMode;
  mpesaRef?: string;
  cashierName: string;
  cashierRole: UserRole;
  notes?: string;
}

export interface Purchase {
  id: string;
  productName: string;
  productId?: string;
  category: Category;
  unit: Unit;
  quantity: number;
  buyingPricePerUnit: number;
  totalCost: number;
  vendorName: string;
  timestamp: string;
  date: string; // YYYY-MM-DD
  addedBy: string;
  role: UserRole;
  status: 'approved' | 'pending' | 'rejected';
  approvedAt?: string;
  approvedBy?: string;
}

export interface Expense {
  id: string;
  description: string;
  category: 'Packaging & Sacks' | 'Transport & Delivery' | 'Shop Utilities' | 'Staff Lunch & Petty' | 'Cleaning Supplies' | 'Maintenance' | 'Other';
  amount: number;
  timestamp: string;
  date: string; // YYYY-MM-DD
  loggedBy: string;
  role: UserRole;
  receiptNumber?: string;
}

export interface DailyRegisterClose {
  id: string;
  date: string; // YYYY-MM-DD
  timestamp: string;
  closedBy: string;
  totalSales: number;
  cashSales: number;
  mpesaSales: number;
  totalExpenses: number;
  openingCash: number;
  cashAtHand: number; // openingCash + cashSales - totalExpenses
  nextDayOpeningCash: number;
  depositAmount: number; // cashAtHand - nextDayOpeningCash
  notes?: string;
}

export interface AuditLog {
  id: string;
  action: string;
  details: string;
  category: 'sale' | 'purchase' | 'inventory' | 'expense' | 'register' | 'auth';
  actor: string;
  role: UserRole;
  timestamp: string;
}

export interface LowStockAlert {
  id: string;
  productId: string;
  productName: string;
  currentStock: number;
  unit: Unit;
  minThreshold: number;
  triggeredAt: string;
}
