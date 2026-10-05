import React, { useState, useMemo } from 'react';
import {
  Calendar,
  Search,
  Filter,
  Printer,
  ChevronDown,
  DollarSign,
  Smartphone,
  Tag,
  Clock,
  User,
  ShoppingBag,
  Download
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Sale, PaymentMode, Category } from '../../types';
import { formatCurrency, CATEGORY_COLORS } from '../../utils/helpers';

interface SalesRecordsViewProps {
  onSelectSaleForReceipt: (sale: Sale) => void;
}

export const SalesRecordsView: React.FC<SalesRecordsViewProps> = ({
  onSelectSaleForReceipt,
}) => {
  const { sales } = useApp();

  const todayStr = new Date().toISOString().split('T')[0];

  // Filters
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [filterMode, setFilterMode] = useState<'single_day' | 'all'>('single_day');
  const [paymentFilter, setPaymentFilter] = useState<'all' | PaymentMode>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Quick Date Selectors
  const setQuickDate = (daysAgo: number) => {
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    setSelectedDate(d.toISOString().split('T')[0]);
    setFilterMode('single_day');
  };

  // Filtered sales
  const filteredSales = useMemo(() => {
    return sales.filter(sale => {
      // Date filter
      if (filterMode === 'single_day' && sale.date !== selectedDate) {
        return false;
      }

      // Payment filter
      if (paymentFilter !== 'all' && sale.paymentMode !== paymentFilter) {
        return false;
      }

      // Category filter
      if (categoryFilter !== 'all') {
        const hasCategory = sale.items.some(item => item.category === categoryFilter);
        if (!hasCategory) return false;
      }

      // Search query (receiptNo, cashier, product name)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesReceipt = sale.receiptNo.toLowerCase().includes(q);
        const matchesCashier = sale.cashierName.toLowerCase().includes(q);
        const matchesProduct = sale.items.some(it => it.name.toLowerCase().includes(q));
        const matchesMpesa = sale.mpesaRef?.toLowerCase().includes(q);
        if (!matchesReceipt && !matchesCashier && !matchesProduct && !matchesMpesa) {
          return false;
        }
      }

      return true;
    });
  }, [sales, selectedDate, filterMode, paymentFilter, categoryFilter, searchQuery]);

  // Aggregate statistics for the filtered selection
  const stats = useMemo(() => {
    const totalAmount = filteredSales.reduce((sum, s) => sum + s.subtotal, 0);
    const cashTotal = filteredSales
      .filter(s => s.paymentMode === 'cash')
      .reduce((sum, s) => sum + s.subtotal, 0);
    const mpesaTotal = filteredSales
      .filter(s => s.paymentMode === 'mpesa')
      .reduce((sum, s) => sum + s.subtotal, 0);
    const itemsCount = filteredSales.reduce(
      (sum, s) => sum + s.items.reduce((iSum, it) => iSum + it.quantity, 0),
      0
    );

    return {
      totalAmount,
      cashTotal,
      mpesaTotal,
      transactionCount: filteredSales.length,
      itemsCount: Number(itemsCount.toFixed(1)),
    };
  }, [filteredSales]);

  // Export to CSV
  const handleExportCSV = () => {
    const headers = ['Receipt No', 'Date', 'Time', 'Cashier', 'Payment Mode', 'M-Pesa Ref', 'Items', 'Total (Ksh)'];
    const rows = filteredSales.map(s => [
      s.receiptNo,
      s.date,
      new Date(s.timestamp).toLocaleTimeString(),
      s.cashierName,
      s.paymentMode.toUpperCase(),
      s.mpesaRef || '',
      s.items.map(it => `${it.name} (${it.quantity}${it.unit})`).join('; '),
      s.subtotal,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map(e => e.map(val => `"${val}"`).join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Neema_Cereals_Sales_${selectedDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-stone-900 border border-stone-800 p-5 rounded-2xl">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center space-x-2">
            <Calendar className="w-5 h-5 text-amber-500" />
            <span>Sales Records by Date</span>
          </h2>
          <p className="text-xs text-stone-400 mt-0.5">
            Historical sales tracking with calendar filtering, item breakdowns and re-prints
          </p>
        </div>

        {/* Calendar Picker & Quick Filter Presets */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Quick Buttons */}
          <div className="flex items-center bg-stone-800 p-1 rounded-xl text-xs">
            <button
              onClick={() => setQuickDate(0)}
              className={`px-3 py-1.5 rounded-lg transition font-medium ${
                selectedDate === todayStr && filterMode === 'single_day'
                  ? 'bg-amber-500 text-stone-950 font-bold'
                  : 'text-stone-300 hover:text-white'
              }`}
            >
              Today
            </button>
            <button
              onClick={() => setQuickDate(1)}
              className="px-3 py-1.5 rounded-lg text-stone-300 hover:text-white transition font-medium"
            >
              Yesterday
            </button>
            <button
              onClick={() => setFilterMode('all')}
              className={`px-3 py-1.5 rounded-lg transition font-medium ${
                filterMode === 'all'
                  ? 'bg-amber-500 text-stone-950 font-bold'
                  : 'text-stone-300 hover:text-white'
              }`}
            >
              All Time
            </button>
          </div>

          {/* Interactive Date Picker Input */}
          <div className="flex items-center space-x-2 bg-stone-950 border border-stone-700 rounded-xl px-3 py-1.5">
            <Calendar className="w-4 h-4 text-amber-400" />
            <input
              type="date"
              value={selectedDate}
              onChange={e => {
                setSelectedDate(e.target.value);
                setFilterMode('single_day');
              }}
              className="bg-transparent text-xs text-white font-mono focus:outline-none"
            />
          </div>

          {/* Export Button */}
          <button
            onClick={handleExportCSV}
            className="p-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white border border-stone-700 text-xs flex items-center space-x-1.5 transition"
            title="Download CSV"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Export</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards for Selected Date */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Sales */}
        <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4">
          <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
            {filterMode === 'single_day' ? `Sales on ${selectedDate}` : 'Total Sales (All Time)'}
          </span>
          <p className="text-2xl font-black font-mono text-white mt-1">
            {formatCurrency(stats.totalAmount)}
          </p>
          <p className="text-[11px] text-stone-400 mt-1">
            {stats.transactionCount} transactions recorded
          </p>
        </div>

        {/* Cash Sales */}
        <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4">
          <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 flex items-center space-x-1">
            <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
            <span>Cash Sales</span>
          </span>
          <p className="text-2xl font-black font-mono text-emerald-400 mt-1">
            {formatCurrency(stats.cashTotal)}
          </p>
          <p className="text-[11px] text-stone-400 mt-1">
            {stats.totalAmount > 0 ? `${Math.round((stats.cashTotal / stats.totalAmount) * 100)}% of total` : '0%'}
          </p>
        </div>

        {/* M-Pesa Sales */}
        <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4">
          <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 flex items-center space-x-1">
            <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
            <span>M-Pesa Sales</span>
          </span>
          <p className="text-2xl font-black font-mono text-emerald-400 mt-1">
            {formatCurrency(stats.mpesaTotal)}
          </p>
          <p className="text-[11px] text-stone-400 mt-1">
            {stats.totalAmount > 0 ? `${Math.round((stats.mpesaTotal / stats.totalAmount) * 100)}% of total` : '0%'}
          </p>
        </div>

        {/* Quantity Units Sold */}
        <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4">
          <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 flex items-center space-x-1">
            <ShoppingBag className="w-3.5 h-3.5 text-amber-400" />
            <span>Volume Sold</span>
          </span>
          <p className="text-2xl font-black font-mono text-amber-400 mt-1">
            {stats.itemsCount.toLocaleString()}
          </p>
          <p className="text-[11px] text-stone-400 mt-1">
            Units (kg, L, g, pcs)
          </p>
        </div>
      </div>

      {/* Filter Row: Search & Dropdown Filters */}
      <div className="bg-stone-900 border border-stone-800 rounded-2xl p-3.5 flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search receipt, cashier, product..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-stone-950 border border-stone-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-stone-400 focus:outline-none focus:border-amber-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {/* Payment filter */}
          <div className="flex items-center space-x-1 bg-stone-950 border border-stone-700 rounded-xl p-1 text-xs">
            <button
              onClick={() => setPaymentFilter('all')}
              className={`px-2 py-1 rounded-lg text-xs font-medium transition ${
                paymentFilter === 'all' ? 'bg-amber-500 text-stone-950 font-bold' : 'text-stone-300'
              }`}
            >
              All Pay
            </button>
            <button
              onClick={() => setPaymentFilter('cash')}
              className={`px-2 py-1 rounded-lg text-xs font-medium transition ${
                paymentFilter === 'cash' ? 'bg-amber-500 text-stone-950 font-bold' : 'text-stone-300'
              }`}
            >
              Cash
            </button>
            <button
              onClick={() => setPaymentFilter('mpesa')}
              className={`px-2 py-1 rounded-lg text-xs font-medium transition ${
                paymentFilter === 'mpesa' ? 'bg-amber-500 text-stone-950 font-bold' : 'text-stone-300'
              }`}
            >
              M-Pesa
            </button>
          </div>

          {/* Category filter */}
          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className="bg-stone-950 border border-stone-700 rounded-xl px-2.5 py-1.5 text-xs text-stone-300 focus:outline-none"
          >
            <option value="all">All Categories</option>
            <option value="Cereals">Cereals</option>
            <option value="Rice">Rice</option>
            <option value="Salad">Salad</option>
            <option value="Flour">Flour</option>
            <option value="Spices">Spices</option>
            <option value="Hardware">Hardware</option>
          </select>
        </div>
      </div>

      {/* Sales Transactions List Table */}
      <div className="bg-stone-900 border border-stone-800 rounded-2xl overflow-hidden shadow-lg">
        {filteredSales.length === 0 ? (
          <div className="py-16 text-center text-stone-400 space-y-2">
            <Calendar className="w-12 h-12 mx-auto text-stone-400/80 stroke-1" />
            <p className="text-sm font-semibold text-stone-300">
              No sales records found for {filterMode === 'single_day' ? selectedDate : 'selected filters'}
            </p>
            <p className="text-xs text-stone-400">
              Try selecting a different date from the calendar or resetting your filters.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-950 border-b border-stone-800 text-stone-400 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3.5 px-4">Receipt #</th>
                  <th className="py-3.5 px-4">Date &amp; Time</th>
                  <th className="py-3.5 px-4">Cashier</th>
                  <th className="py-3.5 px-4">Items Breakdown</th>
                  <th className="py-3.5 px-4">Payment</th>
                  <th className="py-3.5 px-4 text-right">Amount</th>
                  <th className="py-3.5 px-4 text-center">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-800">
                {filteredSales.map(sale => {
                  const timeStr = new Date(sale.timestamp).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  });

                  return (
                    <tr key={sale.id} className="hover:bg-stone-800/40 transition">
                      <td className="py-3 px-4 font-mono font-bold text-amber-400 whitespace-nowrap">
                        #{sale.receiptNo}
                      </td>
                      <td className="py-3 px-4 text-stone-300 whitespace-nowrap">
                        <div className="flex items-center space-x-1">
                          <Clock className="w-3 h-3 text-stone-400" />
                          <span>{sale.date}</span>
                          <span className="text-stone-400 text-[10px]">({timeStr})</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-stone-300 whitespace-nowrap">
                        <div className="flex items-center space-x-1">
                          <User className="w-3 h-3 text-stone-400" />
                          <span>{sale.cashierName}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 max-w-xs">
                        <div className="space-y-1">
                          {sale.items.map((it, idx) => (
                            <div key={idx} className="flex items-center space-x-1 text-[11px] text-stone-300">
                              <span className="font-semibold text-white truncate">{it.name}:</span>
                              <span className="text-stone-400">
                                {it.quantity} {it.unit} @ Ksh {it.pricePerUnit}
                              </span>
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        {sale.paymentMode === 'mpesa' ? (
                          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-emerald-950 border border-emerald-700/60 text-emerald-400 text-[11px] font-bold">
                            <Smartphone className="w-3 h-3" />
                            <span>M-PESA {sale.mpesaRef ? `(${sale.mpesaRef})` : ''}</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-stone-800 border border-stone-700 text-stone-300 text-[11px] font-bold">
                            <DollarSign className="w-3 h-3 text-amber-400" />
                            <span>CASH</span>
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-white text-sm whitespace-nowrap">
                        {formatCurrency(sale.subtotal)}
                      </td>
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <button
                          onClick={() => onSelectSaleForReceipt(sale)}
                          className="p-1.5 rounded-lg bg-stone-800 hover:bg-amber-500 hover:text-stone-950 text-stone-300 transition"
                          title="Print Receipt"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
