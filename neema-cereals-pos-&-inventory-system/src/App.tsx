/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { LoginPage } from './components/auth/LoginPage';
import { Navbar } from './components/layout/Navbar';
import { Sidebar, NavTab } from './components/layout/Sidebar';
import { SalesTerminal } from './components/sales/SalesTerminal';
import { SalesRecordsView } from './components/sales-records/SalesRecordsView';
import { PurchasesView } from './components/purchases/PurchasesView';
import { InventoryView } from './components/inventory/InventoryView';
import { ReportsView } from './components/reports/ReportsView';
import { ExpensesView } from './components/expenses/ExpensesView';
import { HistoryView } from './components/history/HistoryView';
import { StaffAccountsView } from './components/admin/StaffAccountsView';
import { LowStockBannerModal } from './components/common/LowStockBannerModal';
import { ReceiptModal } from './components/common/ReceiptModal';
import { Sale, Product, LowStockAlert } from './types';

const MainAppContent: React.FC = () => {
  const {
    currentUser,
    currentRole,
    activeAlertModal,
    dismissAlertModal,
    lastCompletedSale,
    setLastCompletedSale,
    lowStockProducts
  } = useApp();

  const [activeTab, setActiveTab] = useState<NavTab>('sales');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

  // Receipt Modal State
  const [receiptModalSale, setReceiptModalSale] = useState<Sale | null>(null);

  // Pre-fill restock state when navigating from alert to purchases
  const [restockPreFill, setRestockPreFill] = useState<{ name: string; id: string } | null>(null);

  // Manual low stock trigger modal
  const [manualAlertItem, setManualAlertItem] = useState<LowStockAlert | null>(null);

  // Enforce role-based tab restriction
  useEffect(() => {
    if (currentRole === 'cashier') {
      const allowedCashierTabs: NavTab[] = ['sales', 'expenses', 'purchases'];
      if (!allowedCashierTabs.includes(activeTab)) {
        setActiveTab('sales');
      }
    }
  }, [currentRole, activeTab]);

  // If not logged in, render the Login Screen
  if (!currentUser) {
    return <LoginPage />;
  }

  // Handle restock trigger
  const handleRestockNow = (productName: string, productId: string) => {
    setRestockPreFill({ name: productName, id: productId });
    setActiveTab('purchases');
  };

  const handleManualTriggerAlert = (prod: Product) => {
    setManualAlertItem({
      id: 'manual-' + Date.now(),
      productId: prod.id,
      productName: prod.name,
      currentStock: prod.currentStock,
      unit: prod.unit,
      minThreshold: prod.minStockThreshold,
      triggeredAt: new Date().toLocaleTimeString(),
    });
  };

  const currentAlertToShow = activeAlertModal || manualAlertItem;

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col font-sans">
      {/* Top Navbar */}
      <Navbar
        onToggleMobileMenu={() => setIsMobileMenuOpen(prev => !prev)}
        isMobileMenuOpen={isMobileMenuOpen}
        onOpenLowStock={() => {
          if (lowStockProducts.length > 0) {
            handleManualTriggerAlert(lowStockProducts[0]);
          } else {
            setActiveTab('inventory');
          }
        }}
      />

      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        {/* Sidebar Navigation */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          isMobileMenuOpen={isMobileMenuOpen}
          setIsMobileMenuOpen={setIsMobileMenuOpen}
        />

        {/* Main Content Area */}
        <main className="flex-1 p-3 sm:p-6 lg:p-8 min-w-0">
          {activeTab === 'sales' && (
            <SalesTerminal
              onOpenReceipt={() => {
                if (lastCompletedSale) {
                  setReceiptModalSale(lastCompletedSale);
                }
              }}
            />
          )}

          {activeTab === 'sales_records' && currentRole === 'admin' && (
            <SalesRecordsView
              onSelectSaleForReceipt={sale => setReceiptModalSale(sale)}
            />
          )}

          {activeTab === 'purchases' && (
            <PurchasesView
              initialProductName={restockPreFill?.name || ''}
              initialProductId={restockPreFill?.id || ''}
            />
          )}

          {activeTab === 'inventory' && currentRole === 'admin' && (
            <InventoryView
              onGoToPurchasesForRestock={handleRestockNow}
              onTriggerAlertModal={handleManualTriggerAlert}
            />
          )}

          {activeTab === 'reports' && currentRole === 'admin' && (
            <ReportsView />
          )}

          {activeTab === 'expenses' && (
            <ExpensesView />
          )}

          {activeTab === 'history' && currentRole === 'admin' && (
            <HistoryView />
          )}

          {activeTab === 'staff_accounts' && currentRole === 'admin' && (
            <StaffAccountsView />
          )}
        </main>
      </div>

      {/* Critical Stock Alert Pop-Up Modal */}
      <LowStockBannerModal
        alert={currentAlertToShow}
        onClose={() => {
          dismissAlertModal();
          setManualAlertItem(null);
        }}
        onRestockNow={handleRestockNow}
      />

      {/* Printable Receipt Modal */}
      <ReceiptModal
        sale={receiptModalSale}
        onClose={() => {
          setReceiptModalSale(null);
          setLastCompletedSale(null);
        }}
      />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainAppContent />
    </AppProvider>
  );
}
