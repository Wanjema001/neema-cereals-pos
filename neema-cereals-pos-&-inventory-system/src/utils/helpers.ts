import { Category, Unit } from '../types';

export const formatCurrency = (amount: number): string => {
  return `Ksh ${Math.round(amount).toLocaleString('en-KE')}`;
};

export const formatCurrencyDetailed = (amount: number): string => {
  return `Ksh ${amount.toLocaleString('en-KE', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
};

export const CATEGORY_UNITS: Record<Category, Unit> = {
  Cereals: 'kg',
  Rice: 'kg',
  Salad: 'liters',
  Flour: 'kg',
  Spices: 'grams',
  Hardware: 'items',
};

export const CATEGORY_COLORS: Record<Category, { bg: string; text: string; border: string }> = {
  Cereals: { bg: 'bg-amber-950/40', text: 'text-amber-400', border: 'border-amber-700/50' },
  Rice: { bg: 'bg-emerald-950/40', text: 'text-emerald-400', border: 'border-emerald-700/50' },
  Salad: { bg: 'bg-yellow-950/40', text: 'text-yellow-400', border: 'border-yellow-700/50' },
  Flour: { bg: 'bg-orange-950/40', text: 'text-orange-400', border: 'border-orange-700/50' },
  Spices: { bg: 'bg-rose-950/40', text: 'text-rose-400', border: 'border-rose-700/50' },
  Hardware: { bg: 'bg-cyan-950/40', text: 'text-cyan-400', border: 'border-cyan-700/50' },
};

export const formatStockDisplay = (stock: number, unit: Unit): string => {
  if (unit === 'grams') {
    if (stock >= 1000) {
      return `${(stock / 1000).toFixed(2)} kg (${stock}g)`;
    }
    return `${stock} g`;
  }
  return `${stock} ${unit}`;
};

export const isProductLowStock = (stock: number, unit: Unit, threshold: number): boolean => {
  return stock <= threshold;
};
