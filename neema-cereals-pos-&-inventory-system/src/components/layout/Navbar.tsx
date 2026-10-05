import React from 'react';
import {
  Wheat,
  ShieldCheck,
  UserCheck,
  AlertTriangle,
  Smartphone,
  Coins,
  LogOut,
  Crown,
  Menu,
  X
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatCurrency } from '../../utils/helpers';

interface NavbarProps {
  onToggleMobileMenu: () => void;
  isMobileMenuOpen: boolean;
  onOpenLowStock: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onToggleMobileMenu,
  isMobileMenuOpen,
  onOpenLowStock,
}) => {
  const {
    currentUser,
    currentRole,
    currentUserName,
    isSuperAdmin,
    logout,
    lowStockProducts,
    openingCashToday,
    setOpeningCashToday
  } = useApp();

  const handleEditOpeningCash = () => {
    const input = window.prompt(
      'Enter Opening Cash in Cashbox for Today (Ksh):',
      openingCashToday.toString()
    );
    if (input !== null) {
      const parsed = parseFloat(input);
      if (!isNaN(parsed) && parsed >= 0) {
        setOpeningCashToday(parsed);
      }
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-stone-900/95 backdrop-blur-md border-b border-stone-800 px-4 py-2.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
        {/* Left: Brand Logo & Title */}
        <div className="flex items-center space-x-3">
          <button
            onClick={onToggleMobileMenu}
            className="md:hidden p-2 rounded-xl bg-stone-800 text-stone-300 hover:text-white hover:bg-stone-700 transition"
            aria-label="Toggle navigation"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center shadow-lg shadow-amber-600/20 text-stone-950 font-black">
              <Wheat className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="font-extrabold text-sm md:text-base tracking-tight text-white leading-none">
                  NEEMA CEREALS
                </h1>
                <span className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 uppercase">
                  POS
                </span>
              </div>
              <p className="text-[10px] text-stone-400 hidden xs:block">
                Cereals • Rice • Salad • Flour • Spices • Hardware
              </p>
            </div>
          </div>
        </div>

        {/* Center: Remote / Mobile Sync Indicator */}
        <div className="hidden lg:flex items-center space-x-2 bg-stone-800/60 border border-stone-700/60 px-3 py-1 rounded-full text-xs text-stone-300">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <Smartphone className="w-3.5 h-3.5 text-stone-400" />
          <span>Live Remote Sync</span>
        </div>

        {/* Right Actions: Cash Float, Low Stock Alert, User Profile & Log Out */}
        <div className="flex items-center space-x-2 sm:space-x-2.5">
          {/* Opening Cash Float */}
          <button
            onClick={handleEditOpeningCash}
            title="Click to adjust Opening Cash Float for today"
            className="hidden sm:flex items-center space-x-1.5 bg-stone-800/80 hover:bg-stone-800 border border-stone-700/80 px-2.5 py-1.5 rounded-xl text-xs transition"
          >
            <Coins className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-stone-400">Float:</span>
            <span className="font-bold text-amber-400">{formatCurrency(openingCashToday)}</span>
          </button>

          {/* Low Stock Indicator Alert Bell */}
          <button
            onClick={onOpenLowStock}
            className={`relative p-2 rounded-xl transition flex items-center space-x-1.5 ${
              lowStockProducts.length > 0
                ? 'bg-red-500/15 border border-red-500/40 text-red-400 hover:bg-red-500/25'
                : 'bg-stone-800 text-stone-400 hover:text-stone-200 border border-stone-700/50'
            }`}
            title={`${lowStockProducts.length} items below minimum threshold (< 5kg/liters/items)`}
          >
            <AlertTriangle className={`w-4 h-4 ${lowStockProducts.length > 0 ? 'text-red-400 animate-pulse' : ''}`} />
            {lowStockProducts.length > 0 && (
              <span className="text-xs font-bold font-mono px-1">
                {lowStockProducts.length}
              </span>
            )}
          </button>

          {/* Authenticated User Badge */}
          <div className="hidden sm:flex items-center space-x-2 bg-stone-800/90 border border-stone-700/80 px-2.5 py-1.5 rounded-xl text-xs">
            {isSuperAdmin ? (
              <Crown className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            ) : currentRole === 'admin' ? (
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            ) : (
              <UserCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            )}
            <div className="leading-tight">
              <span className="font-bold text-white block truncate max-w-[120px]">
                {currentUserName || 'User'}
              </span>
              <span className="text-[10px] text-amber-400 font-semibold block capitalize">
                {isSuperAdmin ? 'Super Admin' : currentRole}
              </span>
            </div>
          </div>

          {/* Log Out Button */}
          <button
            onClick={logout}
            className="p-2 sm:px-3 sm:py-1.5 rounded-xl bg-stone-800 hover:bg-red-600/80 text-stone-300 hover:text-white border border-stone-700/80 text-xs font-semibold flex items-center space-x-1.5 transition"
            title="Log Out of POS System"
          >
            <LogOut className="w-3.5 h-3.5 text-red-400" />
            <span className="hidden sm:inline">Log Out</span>
          </button>
        </div>
      </div>
    </header>
  );
};
