import { Product, Sale, Purchase, Expense, DailyRegisterClose, AuditLog, UserAccount } from '../types';

// Super Admin account - Wanjema
export const INITIAL_USERS: UserAccount[] = [
  {
    id: 'user-super-admin',
    name: 'Wanjema',
    username: 'wanjema',
    email: 'mutongawanjema001@gmail.com',
    role: 'admin',
    password: 'wanjema123',
    phone: '+254 700 000000',
    isSuperAdmin: true,
    createdAt: new Date().toISOString(),
    status: 'active',
  }
];

// Production deployment ready - completely empty initial business datasets
export const INITIAL_PRODUCTS: Product[] = [];

export const INITIAL_SALES: Sale[] = [];

export const INITIAL_PURCHASES: Purchase[] = [];

export const INITIAL_EXPENSES: Expense[] = [];

export const INITIAL_DAILY_CLOSES: DailyRegisterClose[] = [];

export const INITIAL_AUDIT_LOGS: AuditLog[] = [];
