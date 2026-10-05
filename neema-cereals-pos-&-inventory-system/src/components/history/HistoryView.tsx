import React, { useState, useMemo } from 'react';
import {
  History as HistoryIcon,
  Search,
  Filter,
  Shield,
  User,
  ShoppingCart,
  Truck,
  Boxes,
  Receipt,
  Coins,
  Clock,
  Download
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { AuditLog } from '../../types';

export const HistoryView: React.FC = () => {
  const { auditLogs } = useApp();

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'cashier'>('all');

  const filteredLogs = useMemo(() => {
    return auditLogs.filter(log => {
      if (categoryFilter !== 'all' && log.category !== categoryFilter) return false;
      if (roleFilter !== 'all' && log.role !== roleFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          log.action.toLowerCase().includes(q) ||
          log.details.toLowerCase().includes(q) ||
          log.actor.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [auditLogs, categoryFilter, roleFilter, searchQuery]);

  const getCategoryIcon = (category: AuditLog['category']) => {
    switch (category) {
      case 'sale':
        return <ShoppingCart className="w-4 h-4 text-emerald-400" />;
      case 'purchase':
        return <Truck className="w-4 h-4 text-amber-400" />;
      case 'inventory':
        return <Boxes className="w-4 h-4 text-cyan-400" />;
      case 'expense':
        return <Receipt className="w-4 h-4 text-red-400" />;
      case 'register':
        return <Coins className="w-4 h-4 text-yellow-400" />;
      default:
        return <HistoryIcon className="w-4 h-4 text-stone-400" />;
    }
  };

  const handleExportLogs = () => {
    const headers = ['Timestamp', 'Actor', 'Role', 'Category', 'Action', 'Details'];
    const rows = filteredLogs.map(l => [
      l.timestamp,
      l.actor,
      l.role,
      l.category,
      l.action,
      l.details.replace(/"/g, '""'),
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map(e => e.map(val => `"${val}"`).join(','))].join('\n');

    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    link.setAttribute('download', `Neema_Cereals_Audit_Log.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-stone-900 border border-stone-800 p-5 rounded-2xl">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center space-x-2">
            <HistoryIcon className="w-5 h-5 text-amber-500" />
            <span>Store Activity History &amp; Audit Logs</span>
          </h2>
          <p className="text-xs text-stone-400 mt-0.5">
            Complete real-time timeline of all operations performed across Admin and Cashier dashboards
          </p>
        </div>

        <button
          onClick={handleExportLogs}
          className="py-2 px-3.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white border border-stone-700 text-xs flex items-center space-x-1.5 transition self-start sm:self-auto"
        >
          <Download className="w-4 h-4" />
          <span>Export Audit Log</span>
        </button>
      </div>

      {/* Filter Row */}
      <div className="bg-stone-900 border border-stone-800 rounded-2xl p-3.5 flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search activity, details, actor..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-stone-950 border border-stone-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-stone-400 focus:outline-none focus:border-amber-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className="bg-stone-950 border border-stone-700 rounded-xl px-2.5 py-1.5 text-xs text-stone-300 focus:outline-none"
          >
            <option value="all">All Event Categories</option>
            <option value="sale">Sales</option>
            <option value="purchase">Purchases</option>
            <option value="inventory">Inventory Adjustments</option>
            <option value="expense">Expenses</option>
            <option value="register">Register Operations</option>
          </select>

          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value as 'all' | 'admin' | 'cashier')}
            className="bg-stone-950 border border-stone-700 rounded-xl px-2.5 py-1.5 text-xs text-stone-300 focus:outline-none"
          >
            <option value="all">All Roles</option>
            <option value="admin">Admin Actions Only</option>
            <option value="cashier">Cashier Actions Only</option>
          </select>
        </div>
      </div>

      {/* Audit Log Timeline Table */}
      <div className="bg-stone-900 border border-stone-800 rounded-2xl overflow-hidden shadow-lg">
        {filteredLogs.length === 0 ? (
          <div className="py-16 text-center text-stone-400 space-y-2">
            <HistoryIcon className="w-12 h-12 mx-auto text-stone-400/80 stroke-1" />
            <p className="text-sm font-semibold text-stone-300">No activity logs recorded</p>
          </div>
        ) : (
          <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-950 border-b border-stone-800 text-stone-400 uppercase tracking-wider sticky top-0">
                <tr>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Event Category</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Activity Details</th>
                  <th className="py-3 px-4">Actor &amp; Role</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-800">
                {filteredLogs.map(log => {
                  const d = new Date(log.timestamp);
                  const timeFormatted = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                  const dateFormatted = d.toISOString().split('T')[0];

                  return (
                    <tr key={log.id} className="hover:bg-stone-800/40 transition">
                      <td className="py-3 px-4 text-stone-300 whitespace-nowrap">
                        <div className="flex items-center space-x-1">
                          <Clock className="w-3 h-3 text-stone-400" />
                          <span>{dateFormatted}</span>
                          <span className="text-[10px] text-stone-400">({timeFormatted})</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center space-x-1.5 capitalize font-semibold text-stone-300">
                          {getCategoryIcon(log.category)}
                          <span>{log.category}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-bold text-white whitespace-nowrap">
                        {log.action}
                      </td>
                      <td className="py-3 px-4 text-stone-300 max-w-md">
                        {log.details}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center space-x-1.5">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              log.role === 'admin' ? 'bg-amber-400' : 'bg-emerald-400'
                            }`}
                          />
                          <span className="font-medium text-white">{log.actor}</span>
                          <span className="text-[10px] text-stone-400 uppercase">
                            ({log.role})
                          </span>
                        </div>
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
