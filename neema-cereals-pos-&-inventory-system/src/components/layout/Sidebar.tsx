import React from 'react';
import {
  ShoppingCart,
  Calendar,
  Truck,
  Boxes,
  BarChart3,
  Receipt,
  History,
  Shield,
  User,
  Users,
  Crown,
  ArrowRightLeft
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export type NavTab =
  | 'sales'
  | 'sales_records'
  | 'purchases'
  | 'inventory'
  | 'reports'
  | 'expenses'
  | 'history'
  | 'staff_accounts';

interface SidebarProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  isMobileMenuOpen,
  setIsMobileMenuOpen,
}) => {
  const { currentRole, currentUserName, isSuperAdmin, lowStockProducts, purchases, currentUser } = useApp();

  const pendingPurchasesCount = purchases.filter(p => p.status === 'pending').length;

  const adminNavItems = [
    {
      id: 'sales' as NavTab,
      label: 'Sales (POS)',
      icon: ShoppingCart,
      description: 'Record counter sales & EOD calculate',
    },
    {
      id: 'sales_records' as NavTab,
      label: 'Sales Record',
      icon: Calendar,
      description: 'Calendar filter of past days sales',
    },
    {
      id: 'purchases' as NavTab,
      label: 'Purchases',
      icon: Truck,
      description: 'Stock entry & approvals',
      badge: pendingPurchasesCount > 0 ? `${pendingPurchasesCount} pending` : undefined,
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    },
    {
      id: 'inventory' as NavTab,
      label: 'Inventory',
      icon: Boxes,
      description: 'Real-time stock & <5kg alert',
      badge: lowStockProducts.length > 0 ? `${lowStockProducts.length} low` : undefined,
      badgeColor: 'bg-red-500/20 text-red-300 border-red-500/40',
    },
    {
      id: 'reports' as NavTab,
      label: 'Reports',
      icon: BarChart3,
      description: 'Best/least selling, sales graph & deposits',
    },
    {
      id: 'expenses' as NavTab,
      label: 'Expenses',
      icon: Receipt,
      description: 'Daily petty cash charges',
    },
    {
      id: 'history' as NavTab,
      label: 'History',
      icon: History,
      description: 'Full activity & audit logs',
    },
    {
      id: 'staff_accounts' as NavTab,
      label: 'Staff Accounts',
      icon: Users,
      description: 'Super Admin user management',
    },
  ];

  const cashierNavItems = [
    {
      id: 'sales' as NavTab,
      label: 'Sales (POS)',
      icon: ShoppingCart,
      description: 'Input sales with auto-fill & EOD calculate',
    },
    {
      id: 'expenses' as NavTab,
      label: 'Expenses',
      icon: Receipt,
      description: 'Log petty charges',
    },
    {
      id: 'purchases' as NavTab,
      label: 'Purchases',
      icon: Truck,
      description: 'Submit stock (awaits Admin approval)',
      badge: pendingPurchasesCount > 0 ? `${pendingPurchasesCount} pending` : undefined,
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    },
  ];

  const navItems = currentRole === 'admin' ? adminNavItems : cashierNavItems;

  const handleSelectTab = (tab: NavTab) => {
    setActiveTab(tab);
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      {/* Mobile Drawer Overlay */}
      {isMobileMenuOpen && (
        <div
          onClick={() => setIsMobileMenuOpen(false)}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
        />
      )}

      {/* Main Sidebar Container (Desktop Sidebar + Mobile Drawer) */}
      <aside
        className={`fixed md:sticky top-14 left-0 z-40 h-[calc(100vh-3.5rem)] w-64 bg-stone-900 border-r border-stone-800 flex flex-col justify-between transition-transform duration-200 ease-in-out md:translate-x-0 ${
          isMobileMenuOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="p-3 space-y-4 overflow-y-auto flex-1">
          {/* User Profile Pill */}
          <div className="bg-stone-800/80 border border-stone-700/60 rounded-xl p-3 flex items-center space-x-3">
            <div
              className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold ${
                isSuperAdmin
                  ? 'bg-amber-500 text-stone-950'
                  : currentRole === 'admin'
                  ? 'bg-amber-600 text-white'
                  : 'bg-emerald-600 text-white'
              }`}
            >
              {isSuperAdmin ? (
                <Crown className="w-5 h-5 text-stone-950" />
              ) : currentRole === 'admin' ? (
                <Shield className="w-5 h-5" />
              ) : (
                <User className="w-5 h-5" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-white truncate">
                {currentUserName || 'User'}
              </p>
              <div className="flex items-center space-x-1.5 mt-0.5">
                <span
                  className={`w-2 h-2 rounded-full ${
                    isSuperAdmin || currentRole === 'admin' ? 'bg-amber-400' : 'bg-emerald-400'
                  }`}
                />
                <span className="text-[10px] text-stone-400 uppercase tracking-wide font-medium">
                  {isSuperAdmin ? 'Super Admin Wanjema' : currentRole === 'admin' ? 'Store Manager' : 'Front Cashier'}
                </span>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            <p className="px-3 text-[10px] uppercase font-bold tracking-wider text-stone-400 mb-2">
              {currentRole === 'admin' ? 'Admin Navigation' : 'Cashier Navigation'}
            </p>
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleSelectTab(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left text-xs font-medium transition ${
                    isActive
                      ? 'bg-amber-500 text-stone-950 font-bold shadow-md shadow-amber-500/20'
                      : 'text-stone-300 hover:text-white hover:bg-stone-800/80'
                  }`}
                >
                  <div className="flex items-center space-x-2.5 truncate">
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-stone-950' : 'text-stone-400'}`} />
                    <span className="truncate">{item.label}</span>
                  </div>
                  {item.badge && (
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-full border font-semibold shrink-0 ${
                        isActive
                          ? 'bg-stone-900 text-white border-stone-800'
                          : item.badgeColor
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer info in sidebar */}
        <div className="p-3 border-t border-stone-800/80 text-[11px] text-stone-400 bg-stone-950/40">
          <div className="flex items-center justify-between">
            <span>Store: <strong className="text-stone-300">Nairobi Branch</strong></span>
            <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded">
              ONLINE
            </span>
          </div>
          <p className="mt-1 text-[10px] text-stone-400">Neema Cereals POS v2.6</p>
        </div>
      </aside>

      {/* Mobile Bottom Quick-Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-stone-900/95 backdrop-blur-md border-t border-stone-800 py-1.5 px-2 flex justify-around items-center">
        {navItems.slice(0, 4).map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleSelectTab(item.id)}
              className={`flex flex-col items-center py-1 px-2 rounded-lg text-[10px] transition ${
                isActive ? 'text-amber-400 font-bold' : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <div className="relative">
                <Icon className="w-4 h-4" />
                {item.badge && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-red-500" />
                )}
              </div>
              <span className="mt-0.5 leading-none">{item.label.split(' ')[0]}</span>
            </button>
          );
        })}
        {navItems.length > 4 && (
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="flex flex-col items-center py-1 px-2 rounded-lg text-[10px] text-stone-400 hover:text-stone-200"
          >
            <ArrowRightLeft className="w-4 h-4" />
            <span className="mt-0.5 leading-none">More</span>
          </button>
        )}
      </nav>
    </>
  );
};
