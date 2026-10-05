import React, { useState, useMemo } from 'react';
import {
  Receipt,
  Plus,
  TrendingDown,
  Calendar,
  Search,
  CheckCircle2,
  AlertCircle,
  Tag,
  User,
  Clock
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Expense } from '../../types';
import { formatCurrency } from '../../utils/helpers';

export const ExpensesView: React.FC = () => {
  const { expenses, recordExpense, currentRole, currentUserName } = useApp();

  const todayStr = new Date().toISOString().split('T')[0];

  // Form State
  const [description, setDescription] = useState<string>('');
  const [category, setCategory] = useState<Expense['category']>('Packaging & Sacks');
  const [amount, setAmount] = useState<string>('');
  const [receiptNumber, setReceiptNumber] = useState<string>('');
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [filterDate, setFilterDate] = useState<string>('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    if (!description.trim()) {
      setFormError('Please enter an expense description.');
      return;
    }

    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) {
      setFormError('Please enter a valid expense amount greater than 0.');
      return;
    }

    recordExpense({
      description: description.trim(),
      category,
      amount: amt,
      receiptNumber: receiptNumber.trim() || undefined,
    });

    setFormSuccess(`Recorded expense of Ksh ${amt.toLocaleString()} for "${description}".`);
    setDescription('');
    setAmount('');
    setReceiptNumber('');
  };

  // KPIs
  const todayTotal = useMemo(() => {
    return expenses
      .filter(e => e.date === todayStr)
      .reduce((sum, e) => sum + e.amount, 0);
  }, [expenses, todayStr]);

  const allTimeTotal = useMemo(() => {
    return expenses.reduce((sum, e) => sum + e.amount, 0);
  }, [expenses]);

  // Filtered list
  const filteredExpenses = useMemo(() => {
    return expenses.filter(e => {
      if (selectedCategory !== 'all' && e.category !== selectedCategory) return false;
      if (filterDate && e.date !== filterDate) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          e.description.toLowerCase().includes(q) ||
          e.loggedBy.toLowerCase().includes(q) ||
          e.receiptNumber?.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [expenses, selectedCategory, filterDate, searchQuery]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-stone-900 border border-stone-800 p-5 rounded-2xl">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center space-x-2">
            <Receipt className="w-5 h-5 text-amber-500" />
            <span>Petty Cash &amp; Shop Expenses</span>
          </h2>
          <p className="text-xs text-stone-400 mt-0.5">
            Record daily petty charges, packaging, transport, and utilities (auto-deducted at EOD calculation)
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="bg-stone-950 border border-stone-800 px-3.5 py-1.5 rounded-xl text-right">
            <span className="text-[10px] text-stone-400 uppercase font-semibold block">
              Today's Expenses
            </span>
            <span className="text-base font-black font-mono text-red-400">
              {formatCurrency(todayTotal)}
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid: Form Left, Log Table Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Log Expense Form (5 cols) */}
        <div className="lg:col-span-5">
          <div className="bg-stone-900 border border-stone-800 rounded-2xl p-5 shadow-lg">
            <h3 className="text-sm font-bold uppercase tracking-wider text-amber-400 mb-4 flex items-center space-x-2">
              <Plus className="w-4 h-4" />
              <span>Record New Petty Expense</span>
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-1">
                  Expense Description <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="e.g. Rice offloading labor, 50kg packing bags, staff tea..."
                  className="w-full bg-stone-950 border border-stone-700 focus:border-amber-500 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-stone-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-1">
                  Expense Category <span className="text-red-400">*</span>
                </label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value as Expense['category'])}
                  className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="Packaging & Sacks">Packaging &amp; Sacks</option>
                  <option value="Transport & Delivery">Transport &amp; Delivery</option>
                  <option value="Shop Utilities">Shop Utilities (Electricity/Water)</option>
                  <option value="Staff Lunch & Petty">Staff Lunch &amp; Petty</option>
                  <option value="Cleaning Supplies">Cleaning Supplies</option>
                  <option value="Maintenance">Maintenance &amp; Repairs</option>
                  <option value="Other">Other Miscellaneous</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-1">
                  Amount Spent (Ksh) <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-stone-400 font-bold text-xs">
                    Ksh
                  </span>
                  <input
                    type="number"
                    step="1"
                    min="1"
                    required
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    placeholder="e.g. 450"
                    className="w-full bg-stone-950 border border-stone-700 focus:border-amber-500 rounded-xl pl-12 pr-4 py-2.5 text-sm text-white font-mono font-bold focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-1">
                  Receipt / Voucher # (Optional)
                </label>
                <input
                  type="text"
                  value={receiptNumber}
                  onChange={e => setReceiptNumber(e.target.value)}
                  placeholder="e.g. VCH-0041"
                  className="w-full bg-stone-950 border border-stone-700 focus:border-amber-500 rounded-xl px-3.5 py-2 text-xs text-white font-mono focus:outline-none"
                />
              </div>

              {formError && (
                <div className="p-3 rounded-xl bg-red-950/60 border border-red-500/50 text-red-300 text-xs flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {formSuccess && (
                <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/50 text-emerald-300 text-xs flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{formSuccess}</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-extrabold text-xs transition shadow-lg shadow-red-900/30 flex items-center justify-center space-x-2"
              >
                <TrendingDown className="w-4 h-4" />
                <span>Log Petty Expense</span>
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Historical Expenses List (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Filter Bar */}
          <div className="bg-stone-900 border border-stone-800 rounded-2xl p-3.5 flex flex-col sm:flex-row gap-2.5 items-center justify-between">
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search description, cashier..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-stone-950 border border-stone-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-stone-400 focus:outline-none"
              />
            </div>

            <div className="flex items-center space-x-2 w-full sm:w-auto">
              <input
                type="date"
                value={filterDate}
                onChange={e => setFilterDate(e.target.value)}
                className="bg-stone-950 border border-stone-700 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none"
              />
              {filterDate && (
                <button
                  onClick={() => setFilterDate('')}
                  className="text-xs text-stone-400 hover:text-white px-2 py-1"
                >
                  Clear Date
                </button>
              )}
            </div>
          </div>

          {/* Expenses Table */}
          <div className="bg-stone-900 border border-stone-800 rounded-2xl overflow-hidden shadow-lg">
            {filteredExpenses.length === 0 ? (
              <div className="py-12 text-center text-stone-400">
                <Receipt className="w-10 h-10 mx-auto text-stone-400/80 stroke-1 mb-2" />
                <p className="text-xs">No expenses found matching filter criteria</p>
              </div>
            ) : (
              <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-stone-950 border-b border-stone-800 text-stone-400 uppercase tracking-wider sticky top-0">
                    <tr>
                      <th className="py-3 px-4">Date &amp; Time</th>
                      <th className="py-3 px-4">Description</th>
                      <th className="py-3 px-4">Category</th>
                      <th className="py-3 px-4">Logged By</th>
                      <th className="py-3 px-4 text-right">Amount (Ksh)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-800">
                    {filteredExpenses.map(exp => (
                      <tr key={exp.id} className="hover:bg-stone-800/40 transition">
                        <td className="py-3 px-4 text-stone-300 whitespace-nowrap">
                          {exp.date}
                          <br />
                          <span className="text-[10px] text-stone-400">
                            {new Date(exp.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-semibold text-white">
                          <p>{exp.description}</p>
                          {exp.receiptNumber && (
                            <span className="text-[10px] text-stone-400 font-mono">
                              Ref: {exp.receiptNumber}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-stone-800 text-stone-300 border border-stone-700">
                            {exp.category}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-stone-300 whitespace-nowrap">
                          {exp.loggedBy}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-red-400 whitespace-nowrap text-sm">
                          - {formatCurrency(exp.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
