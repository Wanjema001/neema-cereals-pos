import React, { useState, useMemo } from 'react';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Award,
  AlertCircle,
  Building,
  Calendar,
  Layers,
  ShoppingBag,
  Clock,
  Printer,
  ChevronRight,
  Mail,
  Send,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
  X
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatCurrency, CATEGORY_COLORS } from '../../utils/helpers';
import { Category } from '../../types';

export const ReportsView: React.FC = () => {
  const {
    sales,
    expenses,
    dailyCloses,
    products,
    users,
    sendMonthlyReportToAdmins,
    reportDispatches
  } = useApp();

  // Timeframe selector
  const [timeframe, setTimeframe] = useState<'30days' | 'all'>('30days');

  // Email Dispatch Modal State
  const [emailModalData, setEmailModalData] = useState<{
    recipientEmails: string[];
    summary: string;
    mailtoUrl: string;
  } | null>(null);
  const [isSending, setIsSending] = useState<boolean>(false);
  const [sendSuccessToast, setSendSuccessToast] = useState<string | null>(null);

  // Registered Admin accounts
  const adminUsers = useMemo(() => {
    return users.filter(u => u.role === 'admin');
  }, [users]);

  // Compute Product Sales Statistics
  const productStats = useMemo(() => {
    const map = new Map<
      string,
      {
        id: string;
        name: string;
        category: Category;
        unit: string;
        quantitySold: number;
        revenue: number;
        cost: number;
        profit: number;
      }
    >();

    // Initialize all catalog products with 0
    products.forEach(p => {
      map.set(p.id, {
        id: p.id,
        name: p.name,
        category: p.category,
        unit: p.unit,
        quantitySold: 0,
        revenue: 0,
        cost: 0,
        profit: 0,
      });
    });

    // Accumulate from sales
    sales.forEach(sale => {
      sale.items.forEach(item => {
        let entry = map.get(item.productId);
        if (!entry) {
          entry = {
            id: item.productId,
            name: item.name,
            category: item.category,
            unit: item.unit,
            quantitySold: 0,
            revenue: 0,
            cost: 0,
            profit: 0,
          };
          map.set(item.productId, entry);
        }
        const prodInCatalog = products.find(p => p.id === item.productId);
        const unitCost = prodInCatalog ? prodInCatalog.buyingPrice : item.pricePerUnit * 0.75;
        const lineCost = item.quantity * unitCost;

        entry.quantitySold += item.quantity;
        entry.revenue += item.total;
        entry.cost += lineCost;
        entry.profit += item.total - lineCost;
      });
    });

    const list = Array.from(map.values());
    const bestSelling = [...list].sort((a, b) => b.revenue - a.revenue);
    const barelyGetsSold = [...list].sort((a, b) => a.quantitySold - b.quantitySold);

    return { bestSelling, barelyGetsSold };
  }, [products, sales]);

  // Overall Financials
  const financials = useMemo(() => {
    const totalRevenue = sales.reduce((sum, s) => sum + s.subtotal, 0);

    let totalCostOfGoods = 0;
    sales.forEach(sale => {
      sale.items.forEach(item => {
        const prod = products.find(p => p.id === item.productId);
        const unitCost = prod ? prod.buyingPrice : item.pricePerUnit * 0.75;
        totalCostOfGoods += item.quantity * unitCost;
      });
    });

    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    const netProfit = totalRevenue - totalCostOfGoods - totalExpenses;
    const totalDeposits = dailyCloses.reduce((sum, d) => sum + d.depositAmount, 0);

    return {
      totalRevenue,
      totalCostOfGoods,
      totalExpenses,
      netProfit,
      totalDeposits,
      marginPercent: totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : '0',
    };
  }, [sales, products, expenses, dailyCloses]);

  // Category Breakdown
  const categoryBreakdown = useMemo(() => {
    const catMap: Record<Category, number> = {
      Cereals: 0,
      Rice: 0,
      Salad: 0,
      Flour: 0,
      Spices: 0,
      Hardware: 0,
    };

    sales.forEach(sale => {
      sale.items.forEach(it => {
        if (catMap[it.category] !== undefined) {
          catMap[it.category] += it.total;
        }
      });
    });

    const total = Object.values(catMap).reduce((a, b) => a + b, 0) || 1;
    return Object.entries(catMap).map(([cat, amount]) => ({
      category: cat as Category,
      amount,
      percentage: Math.round((amount / total) * 100),
    }));
  }, [sales]);

  // Timeline points for the line graph
  const timelineData = useMemo(() => {
    const dayMap = new Map<string, { date: string; total: number; cash: number; mpesa: number }>();

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const str = d.toISOString().split('T')[0];
      dayMap.set(str, { date: str, total: 0, cash: 0, mpesa: 0 });
    }

    sales.forEach(s => {
      const entry = dayMap.get(s.date);
      if (entry) {
        entry.total += s.subtotal;
        if (s.paymentMode === 'cash') entry.cash += s.subtotal;
        else entry.mpesa += s.subtotal;
      }
    });

    return Array.from(dayMap.values());
  }, [sales]);

  const maxSaleDay = Math.max(...timelineData.map(d => d.total), 5000);
  const chartHeight = 160;
  const chartWidth = 500;
  const padding = 20;

  const points = timelineData.map((d, idx) => {
    const x = padding + (idx / (timelineData.length - 1 || 1)) * (chartWidth - padding * 2);
    const y = chartHeight - padding - (d.total / maxSaleDay) * (chartHeight - padding * 2);
    return { x, y, ...d };
  });

  const polylinePoints = points.map(p => `${p.x},${p.y}`).join(' ');
  const areaPoints = `${points[0]?.x || 0},${chartHeight - padding} ${polylinePoints} ${
    points[points.length - 1]?.x || 0
  },${chartHeight - padding}`;

  const topProduct = productStats.bestSelling[0];
  const leastProduct = productStats.barelyGetsSold[0];

  // Dispatch Monthly Report to All Registered Admins
  const handleSendMonthlyReport = () => {
    setIsSending(true);
    setTimeout(() => {
      const result = sendMonthlyReportToAdmins();
      setIsSending(false);
      setEmailModalData({
        recipientEmails: result.recipientEmails,
        summary: result.summary,
        mailtoUrl: result.mailtoUrl
      });
      setSendSuccessToast(
        `Monthly report dispatched to all registered admin emails: ${result.recipientEmails.join(', ')}`
      );
    }, 400);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-stone-900 border border-stone-800 p-5 rounded-2xl">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center space-x-2">
            <BarChart3 className="w-5 h-5 text-amber-500" />
            <span>Executive Business Reports &amp; Analytics</span>
          </h2>
          <p className="text-xs text-stone-400 mt-0.5">
            Best &amp; least selling products, monthly net profit, revenue line graph &amp; daily deposits
          </p>
        </div>

        <div className="flex items-center space-x-2 self-start sm:self-auto">
          {/* Send Email to Admins Button */}
          <button
            onClick={handleSendMonthlyReport}
            disabled={isSending}
            className="py-2 px-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs flex items-center space-x-1.5 transition shadow-lg shadow-amber-500/20 disabled:opacity-50"
            title="Dispatch monthly financial report to all registered admins"
          >
            <Mail className="w-4 h-4" />
            <span>{isSending ? 'Sending...' : 'Email Report to Admins'}</span>
          </button>

          <button
            onClick={() => window.print()}
            className="py-2 px-3.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white border border-stone-700 text-xs flex items-center space-x-1.5 transition"
          >
            <Printer className="w-4 h-4" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Success Notification Banner */}
      {sendSuccessToast && (
        <div className="p-3.5 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-xs flex items-center justify-between animate-in fade-in duration-150">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>{sendSuccessToast}</span>
          </div>
          <button
            onClick={() => setSendSuccessToast(null)}
            className="text-stone-400 hover:text-white p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 4 Financial KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4">
          <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
            Total Gross Sales
          </span>
          <p className="text-2xl font-black font-mono text-white mt-1">
            {formatCurrency(financials.totalRevenue)}
          </p>
          <p className="text-[11px] text-emerald-400 mt-1 flex items-center space-x-1">
            <TrendingUp className="w-3 h-3" />
            <span>{sales.length} customer receipts</span>
          </p>
        </div>

        <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4">
          <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
            Cost of Goods (COGS)
          </span>
          <p className="text-2xl font-black font-mono text-stone-300 mt-1">
            {formatCurrency(financials.totalCostOfGoods)}
          </p>
          <p className="text-[11px] text-stone-400 mt-1">Wholesale stock value</p>
        </div>

        <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4">
          <span className="text-[10px] font-bold uppercase tracking-wider text-red-400">
            Petty Expenses Incurred
          </span>
          <p className="text-2xl font-black font-mono text-red-400 mt-1">
            {formatCurrency(financials.totalExpenses)}
          </p>
          <p className="text-[11px] text-stone-400 mt-1">{expenses.length} petty cash logs</p>
        </div>

        <div className="bg-stone-900 border border-amber-500/40 rounded-2xl p-4 shadow-lg shadow-amber-500/5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
            Net Business Profit
          </span>
          <p className="text-2xl font-black font-mono text-amber-400 mt-1">
            {formatCurrency(financials.netProfit)}
          </p>
          <p className="text-[11px] text-amber-300 mt-1">
            Margin: <strong>{financials.marginPercent}%</strong> after expenses
          </p>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* ADMIN MONTHLY EMAIL REPORTS AUTOMATION CARD                               */}
      {/* ========================================================================= */}
      <div className="bg-stone-900 border-2 border-amber-500/40 rounded-2xl p-5 shadow-xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-800">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-amber-500/10 rounded-xl text-amber-400 border border-amber-500/30">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-white uppercase tracking-wide">
                Admin Monthly Email Report Delivery
              </h3>
              <p className="text-xs text-stone-400">
                Automatically delivers comprehensive financial reports to all registered administrators
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-emerald-950 border border-emerald-800 text-emerald-400 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Email Service Active</span>
            </span>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
          {/* Left: Admin Recipients List */}
          <div className="md:col-span-8 space-y-2">
            <p className="text-xs font-bold uppercase tracking-wider text-stone-400">
              Registered Admin Email Recipients ({adminUsers.length}):
            </p>
            <div className="flex flex-wrap gap-2">
              {adminUsers.map(admin => (
                <div
                  key={admin.id}
                  className="bg-stone-950 border border-stone-800 rounded-xl px-3 py-1.5 flex items-center space-x-2 text-xs"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span className="font-semibold text-white">{admin.name}</span>
                  <span className="text-[11px] text-emerald-400 font-mono">
                    {admin.email || 'mutongawanjema001@gmail.com'}
                  </span>
                </div>
              ))}
            </div>
            <p className="text-[11px] text-stone-400 pt-1">
              Includes gross sales, cost of goods, net profits, channel breakdowns (Cash vs M-Pesa), and bank deposits.
            </p>
          </div>

          {/* Right: Instant Trigger Button */}
          <div className="md:col-span-4 flex flex-col justify-center sm:items-end">
            <button
              onClick={handleSendMonthlyReport}
              disabled={isSending}
              className="w-full sm:w-auto py-2.5 px-5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-black text-xs transition shadow-lg shadow-amber-500/25 flex items-center justify-center space-x-2"
            >
              <Send className="w-4 h-4" />
              <span>{isSending ? 'Sending Report...' : 'Send Monthly Report Now'}</span>
            </button>
            {reportDispatches.length > 0 && (
              <p className="text-[10px] text-stone-400 mt-1.5 sm:text-right">
                Last sent: {new Date(reportDispatches[0].sentAt).toLocaleDateString()} at{' '}
                {new Date(reportDispatches[0].sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* 2 Focus Cards: Best Selling Product & Barely Gets Sold Product */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* BEST SELLING PRODUCT */}
        <div className="bg-stone-900 border-2 border-emerald-500/40 rounded-2xl p-5 shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between pb-3 border-b border-stone-800">
            <div className="flex items-center space-x-2 text-emerald-400">
              <Award className="w-5 h-5" />
              <h3 className="font-extrabold text-sm uppercase tracking-wide">
                Best Selling Product
              </h3>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase">
              Top Performer
            </span>
          </div>

          {topProduct && sales.length > 0 && topProduct.quantitySold > 0 ? (
            <div className="mt-4 space-y-3">
              <div>
                <h4 className="text-xl font-black text-white">{topProduct.name}</h4>
                <p className="text-xs text-stone-400">
                  Category: <span className="text-amber-400 font-semibold">{topProduct.category}</span>
                </p>
              </div>

              <div className="grid grid-cols-3 gap-2 bg-stone-950 p-3 rounded-xl border border-stone-800 font-mono text-center">
                <div>
                  <span className="text-[10px] text-stone-400 block uppercase">Volume Sold</span>
                  <span className="text-base font-black text-emerald-400">
                    {topProduct.quantitySold} {topProduct.unit}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-stone-400 block uppercase">Revenue</span>
                  <span className="text-base font-black text-white">
                    {formatCurrency(topProduct.revenue)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-stone-400 block uppercase">Profit</span>
                  <span className="text-base font-black text-amber-400">
                    {formatCurrency(topProduct.profit)}
                  </span>
                </div>
              </div>

              <div className="pt-2 text-xs text-stone-400">
                Runner ups:{' '}
                {productStats.bestSelling.slice(1, 4).map((p, idx) => (
                  <span key={p.id} className="text-stone-300 font-semibold">
                    {idx > 0 && ', '}
                    {p.name} ({p.quantitySold} {p.unit})
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-stone-400 space-y-1">
              <Award className="w-8 h-8 mx-auto text-stone-600 stroke-1 mb-1" />
              <p className="text-xs font-semibold text-stone-300">No Sales Recorded Yet</p>
              <p className="text-[11px] text-stone-500">Your top-selling cereal will appear here as soon as transactions occur.</p>
            </div>
          )}
        </div>

        {/* BARELY GETS SOLD PRODUCT (Dead Stock Warning) */}
        <div className="bg-stone-900 border-2 border-stone-700/80 rounded-2xl p-5 shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between pb-3 border-b border-stone-800">
            <div className="flex items-center space-x-2 text-stone-300">
              <AlertCircle className="w-5 h-5 text-amber-400" />
              <h3 className="font-extrabold text-sm uppercase tracking-wide">
                Product That Barely Gets Sold
              </h3>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-stone-800 text-stone-400 border border-stone-700 uppercase">
              Slow Moving
            </span>
          </div>

          {leastProduct && sales.length > 0 && products.length > 0 ? (
            <div className="mt-4 space-y-3">
              <div>
                <h4 className="text-xl font-black text-white">{leastProduct.name}</h4>
                <p className="text-xs text-stone-400">
                  Category: <span className="text-amber-400 font-semibold">{leastProduct.category}</span>
                </p>
              </div>

              <div className="grid grid-cols-3 gap-2 bg-stone-950 p-3 rounded-xl border border-stone-800 font-mono text-center">
                <div>
                  <span className="text-[10px] text-stone-400 block uppercase">Volume Sold</span>
                  <span className="text-base font-black text-stone-400">
                    {leastProduct.quantitySold} {leastProduct.unit}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-stone-400 block uppercase">Revenue</span>
                  <span className="text-base font-black text-stone-300">
                    {formatCurrency(leastProduct.revenue)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-stone-400 block uppercase">Status</span>
                  <span className="text-xs font-bold text-amber-400 block mt-1">
                    {leastProduct.quantitySold === 0 ? 'Zero Sales' : 'Very Slow'}
                  </span>
                </div>
              </div>

              <div className="bg-amber-950/20 border border-amber-500/20 rounded-xl p-2.5 text-xs text-amber-300/90">
                💡 <span className="font-semibold">Retail Recommendation:</span> Consider running a promotional discount or reducing purchase order quantities for this item to free up working capital.
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-stone-400 space-y-1">
              <AlertCircle className="w-8 h-8 mx-auto text-stone-600 stroke-1 mb-1" />
              <p className="text-xs font-semibold text-stone-300">No Sales History Yet</p>
              <p className="text-[11px] text-stone-500">Products with zero or slow movement will be analyzed here once customer sales occur.</p>
            </div>
          )}
        </div>
      </div>

      {/* SALES LINE GRAPH OVER TIME */}
      <div className="bg-stone-900 border border-stone-800 rounded-2xl p-5 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-stone-800">
          <div>
            <h3 className="font-bold text-sm text-white flex items-center space-x-2">
              <TrendingUp className="w-4 h-4 text-amber-500" />
              <span>Total Sales Trend Line Graph (Daily &amp; Weekly Revenue)</span>
            </h3>
            <p className="text-xs text-stone-400">
              Interactive revenue trajectory showing sales velocity across past days
            </p>
          </div>
          <div className="text-xs font-mono font-bold text-amber-400">
            Peak Day: {formatCurrency(sales.length > 0 ? maxSaleDay : 0)}
          </div>
        </div>

        {/* SVG Line Chart or Clean Empty State */}
        {sales.length === 0 ? (
          <div className="py-12 text-center text-stone-400 space-y-2">
            <TrendingUp className="w-10 h-10 mx-auto text-stone-600 stroke-1" />
            <p className="text-xs font-semibold text-stone-300">Ready to Plot Sales Trends</p>
            <p className="text-[11px] text-stone-500">Once customer sales are recorded, a real-time revenue trajectory will be graphed across days.</p>
          </div>
        ) : (
          <div className="w-full overflow-x-auto">
            <div className="min-w-[500px]">
              <svg
                viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                className="w-full h-44 overflow-visible"
              >
                <defs>
                  <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Horizontal Grid lines */}
                {[0.25, 0.5, 0.75, 1].map((pct, i) => {
                  const y = chartHeight - padding - pct * (chartHeight - padding * 2);
                  return (
                    <g key={i}>
                      <line
                        x1={padding}
                        y1={y}
                        x2={chartWidth - padding}
                        y2={y}
                        stroke="rgba(255,255,255,0.07)"
                        strokeDasharray="4 4"
                      />
                      <text
                        x={chartWidth - padding + 5}
                        y={y + 3}
                        fill="#78716c"
                        fontSize="8"
                        fontFamily="monospace"
                      >
                        {Math.round((maxSaleDay * pct) / 1000)}k
                      </text>
                    </g>
                  );
                })}

                {/* Gradient Area Fill */}
                <polygon points={areaPoints} fill="url(#salesGrad)" />

                {/* Main Trend Line */}
                <polyline
                  fill="none"
                  stroke="#f59e0b"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points={polylinePoints}
                />

                {/* Data Dots with Tooltip info */}
                {points.map((p, idx) => (
                  <g key={idx} className="group cursor-pointer">
                    <circle
                      cx={p.x}
                      cy={p.y}
                      r="4"
                      fill="#1c1917"
                      stroke="#f59e0b"
                      strokeWidth="2"
                      className="transition hover:r-6"
                    />
                    <text
                      x={p.x}
                      y={p.y - 10}
                      textAnchor="middle"
                      fill="#ffffff"
                      fontSize="9"
                      fontWeight="bold"
                      fontFamily="monospace"
                    >
                      Ksh {p.total.toLocaleString()}
                    </text>
                    <text
                      x={p.x}
                      y={chartHeight - 4}
                      textAnchor="middle"
                      fill="#a8a29e"
                      fontSize="8"
                    >
                      {p.date.slice(5)}
                    </text>
                  </g>
                ))}
              </svg>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* DAILY DEPOSIT RECORDS SECTION                                             */}
      {/* ========================================================================= */}
      <div className="bg-stone-900 border-2 border-emerald-500/40 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-5 border-b border-stone-800 bg-stone-950/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center space-x-2 text-emerald-400">
              <Building className="w-5 h-5" />
              <h3 className="font-extrabold text-sm uppercase tracking-wide">
                Daily Bank Deposit Records
              </h3>
            </div>
            <p className="text-xs text-stone-400 mt-0.5">
              Accumulated daily deposits recorded automatically from end-of-day register closures
            </p>
          </div>

          <div className="bg-emerald-950/70 border border-emerald-500/40 px-3.5 py-1.5 rounded-xl text-right">
            <span className="text-[10px] text-emerald-300 font-semibold uppercase block">
              Total Deposits Banked
            </span>
            <span className="text-lg font-black font-mono text-emerald-400">
              {formatCurrency(financials.totalDeposits)}
            </span>
          </div>
        </div>

        {dailyCloses.length === 0 ? (
          <div className="py-12 text-center text-stone-400 space-y-2">
            <Building className="w-10 h-10 mx-auto text-stone-400/80 stroke-1" />
            <p className="text-xs font-semibold">No daily deposits recorded yet</p>
            <p className="text-[11px] text-stone-400">
              Complete an End-of-Day calculation in the Sales tab to log your first daily deposit.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-950 border-b border-stone-800 text-stone-400 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-4">Date Closed</th>
                  <th className="py-3 px-4">Closed By</th>
                  <th className="py-3 px-4 text-right">Total Sales</th>
                  <th className="py-3 px-4 text-right">M-Pesa</th>
                  <th className="py-3 px-4 text-right">Expenses</th>
                  <th className="py-3 px-4 text-right">Float (Opening)</th>
                  <th className="py-3 px-4 text-right">Cash At Hand</th>
                  <th className="py-3 px-4 text-right">Next Float Kept</th>
                  <th className="py-3 px-4 text-right font-black text-emerald-400">Deposit Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-800 font-mono">
                {dailyCloses.map(c => (
                  <tr key={c.id} className="hover:bg-stone-800/40 transition">
                    <td className="py-3 px-4 font-bold text-white whitespace-nowrap">
                      {c.date}
                    </td>
                    <td className="py-3 px-4 font-sans text-stone-300 whitespace-nowrap">
                      {c.closedBy}
                    </td>
                    <td className="py-3 px-4 text-right text-stone-200">
                      Ksh {c.totalSales.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right text-emerald-400">
                      - Ksh {c.mpesaSales.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right text-red-400">
                      - Ksh {c.totalExpenses.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right text-amber-400">
                      + Ksh {c.openingCash.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-amber-300">
                      Ksh {c.cashAtHand.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right text-stone-400">
                      Ksh {c.nextDayOpeningCash.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right font-black text-sm text-emerald-400 whitespace-nowrap">
                      {formatCurrency(c.depositAmount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Category Sales Breakdown Progress */}
      <div className="bg-stone-900 border border-stone-800 rounded-2xl p-5 shadow-lg">
        <h3 className="font-bold text-sm text-white mb-3 flex items-center space-x-2">
          <Layers className="w-4 h-4 text-amber-500" />
          <span>Category Revenue Share</span>
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {categoryBreakdown.map(cat => (
            <div
              key={cat.category}
              className="bg-stone-950 border border-stone-800 p-3 rounded-xl space-y-1.5"
            >
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-white">{cat.category}</span>
                <span className="font-mono text-amber-400 font-bold">
                  {formatCurrency(cat.amount)} ({cat.percentage}%)
                </span>
              </div>
              <div className="w-full bg-stone-800 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-amber-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.max(cat.percentage, 2)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* EMAIL REPORT DISPATCH PREVIEW MODAL */}
      {emailModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-stone-900 border-2 border-amber-500/50 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 bg-stone-950 border-b border-stone-800 flex items-center justify-between">
              <div className="flex items-center space-x-2 text-amber-400">
                <Mail className="w-5 h-5" />
                <span className="font-bold text-sm">Monthly Report Email Dispatched</span>
              </div>
              <button
                onClick={() => setEmailModalData(null)}
                className="text-stone-400 hover:text-white p-1 rounded-lg hover:bg-stone-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto flex-1">
              <div className="bg-emerald-950/60 border border-emerald-500/40 rounded-xl p-3 text-xs text-emerald-300 flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Report successfully compiled and dispatched to all registered admins!</span>
              </div>

              <div>
                <p className="text-xs font-semibold text-stone-300 mb-1">
                  Recipient Admin Emails:
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {emailModalData.recipientEmails.map((em, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-lg bg-stone-950 border border-stone-700 text-amber-300 font-mono text-xs font-semibold"
                    >
                      {em}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-stone-300 mb-1">
                  Dispatched Email Content Preview:
                </p>
                <pre className="bg-stone-950 border border-stone-800 rounded-xl p-3.5 text-[11px] font-mono text-stone-300 whitespace-pre-wrap leading-relaxed max-h-64 overflow-y-auto">
                  {emailModalData.summary}
                </pre>
              </div>
            </div>

            <div className="p-4 bg-stone-950 border-t border-stone-800 flex gap-2">
              <button
                onClick={() => setEmailModalData(null)}
                className="flex-1 py-2.5 rounded-xl border border-stone-700 text-stone-300 font-medium text-xs hover:bg-stone-800"
              >
                Done
              </button>
              <a
                href={emailModalData.mailtoUrl}
                target="_blank"
                rel="noreferrer"
                className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs flex items-center justify-center space-x-1.5 shadow-lg shadow-amber-500/20"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Open in Mail App</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
