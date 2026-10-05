import React, { useState } from 'react';
import {
  Truck,
  Plus,
  CheckCircle2,
  XCircle,
  Clock,
  ShieldCheck,
  User,
  AlertCircle,
  Building2,
  Calendar
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Category, Unit, Purchase } from '../../types';
import { formatCurrency, CATEGORY_UNITS } from '../../utils/helpers';

interface PurchasesViewProps {
  initialProductName?: string;
  initialProductId?: string;
}

export const PurchasesView: React.FC<PurchasesViewProps> = ({
  initialProductName = '',
  initialProductId = '',
}) => {
  const {
    products,
    purchases,
    recordPurchase,
    approvePurchase,
    rejectPurchase,
    currentRole,
    currentUserName
  } = useApp();

  // Form State
  const [productName, setProductName] = useState<string>(initialProductName);
  const [selectedProductId, setSelectedProductId] = useState<string>(initialProductId);
  const [category, setCategory] = useState<Category>('Cereals');
  const [unit, setUnit] = useState<Unit>('kg');
  const [quantity, setQuantity] = useState<string>('50');
  const [buyingPrice, setBuyingPrice] = useState<string>('120');
  const [vendorName, setVendorName] = useState<string>('');
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // Status Filter
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  // When picking an existing product, auto-fill its category and unit
  const handleProductSelect = (name: string) => {
    setProductName(name);
    const found = products.find(p => p.name.toLowerCase() === name.toLowerCase());
    if (found) {
      setSelectedProductId(found.id);
      setCategory(found.category);
      setUnit(found.unit);
      setBuyingPrice(found.buyingPrice.toString());
    } else {
      setSelectedProductId('');
    }
  };

  const handleCategoryChange = (cat: Category) => {
    setCategory(cat);
    setUnit(CATEGORY_UNITS[cat]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    if (!productName.trim()) {
      setFormError('Please enter a product name.');
      return;
    }

    const qtyNum = parseFloat(quantity);
    if (isNaN(qtyNum) || qtyNum <= 0) {
      setFormError('Please enter a valid quantity purchased.');
      return;
    }

    const priceNum = parseFloat(buyingPrice);
    if (isNaN(priceNum) || priceNum <= 0) {
      setFormError('Please enter a valid buying price per unit.');
      return;
    }

    if (!vendorName.trim()) {
      setFormError('Please enter the vendor / supplier name.');
      return;
    }

    recordPurchase({
      productName: productName.trim(),
      productId: selectedProductId || undefined,
      category,
      unit,
      quantity: qtyNum,
      buyingPricePerUnit: priceNum,
      vendorName: vendorName.trim(),
    });

    if (currentRole === 'admin') {
      setFormSuccess(
        `Success! Recorded and automatically credited ${qtyNum} ${unit} of "${productName}" to inventory.`
      );
    } else {
      setFormSuccess(
        `Purchase order submitted! Sent to Admin for approval. Stock will reflect once approved.`
      );
    }

    // Reset form fields
    setProductName('');
    setSelectedProductId('');
    setVendorName('');
    setQuantity('50');
  };

  const pendingPurchases = purchases.filter(p => p.status === 'pending');

  const filteredPurchases = purchases.filter(p => {
    if (statusFilter !== 'all' && p.status !== statusFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-stone-900 border border-stone-800 p-5 rounded-2xl">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center space-x-2">
            <Truck className="w-5 h-5 text-amber-500" />
            <span>Stock Purchases &amp; Inward Delivery</span>
          </h2>
          <p className="text-xs text-stone-400 mt-0.5">
            Log incoming stock batches with supplier, buying price, quantities and approval status
          </p>
        </div>

        {pendingPurchases.length > 0 && currentRole === 'admin' && (
          <div className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-semibold">
            <Clock className="w-4 h-4 text-amber-400" />
            <span>{pendingPurchases.length} Purchase(s) waiting for your approval!</span>
          </div>
        )}
      </div>

      {/* Admin Action Notice Banner for Cashiers */}
      {currentRole === 'cashier' && (
        <div className="bg-amber-950/40 border border-amber-500/40 rounded-xl p-3.5 text-xs text-amber-300 flex items-start space-x-2.5">
          <Clock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Cashier Stock Entry Notice:</p>
            <p className="text-amber-200/80">
              Purchases entered by cashiers require Admin verification before inventory is incremented.
              Your submissions appear below with "Pending Approval" status.
            </p>
          </div>
        </div>
      )}

      {/* Main Grid: Left = Add Purchase Form, Right = Pending Approvals / History */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Input Form (5 cols) */}
        <div className="lg:col-span-5">
          <div className="bg-stone-900 border border-stone-800 rounded-2xl p-5 shadow-lg">
            <h3 className="text-sm font-bold uppercase tracking-wider text-amber-400 mb-4 flex items-center space-x-2">
              <Plus className="w-4 h-4" />
              <span>Record Incoming Stock Batch</span>
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Product Name */}
              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-1">
                  Product Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  list="inventory-products-list"
                  value={productName}
                  onChange={e => handleProductSelect(e.target.value)}
                  placeholder="e.g. Pishori Mwea Rice Grade 1"
                  className="w-full bg-stone-950 border border-stone-700 focus:border-amber-500 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-stone-400 focus:outline-none"
                />
                <datalist id="inventory-products-list">
                  {products.map(p => (
                    <option key={p.id} value={p.name} />
                  ))}
                </datalist>
                <p className="text-[10px] text-stone-400 mt-1">
                  Choose from existing catalog or type a new product name
                </p>
              </div>

              {/* Category & Unit */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-300 mb-1">
                    Category <span className="text-red-400">*</span>
                  </label>
                  <select
                    value={category}
                    onChange={e => handleCategoryChange(e.target.value as Category)}
                    className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="Cereals">Cereals (kg)</option>
                    <option value="Rice">Rice (kg)</option>
                    <option value="Salad">Salad (liters)</option>
                    <option value="Flour">Flour (kg)</option>
                    <option value="Spices">Spices (grams)</option>
                    <option value="Hardware">Hardware (items)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-300 mb-1">
                    Unit of Measure
                  </label>
                  <input
                    type="text"
                    readOnly
                    value={unit}
                    className="w-full bg-stone-800 border border-stone-700 rounded-xl px-3 py-2 text-xs font-mono font-semibold text-stone-300 uppercase cursor-not-allowed"
                  />
                </div>
              </div>

              {/* Quantity Purchased & Buying Price */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-300 mb-1">
                    Quantity ({unit}) <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="number"
                    step={unit === 'items' ? '1' : '0.1'}
                    min="0.1"
                    value={quantity}
                    onChange={e => setQuantity(e.target.value)}
                    placeholder="50"
                    className="w-full bg-stone-950 border border-stone-700 focus:border-amber-500 rounded-xl px-3 py-2 text-xs text-white font-mono font-bold focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-300 mb-1">
                    Buying Price per {unit} (Ksh) <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={buyingPrice}
                    onChange={e => setBuyingPrice(e.target.value)}
                    placeholder="120"
                    className="w-full bg-stone-950 border border-stone-700 focus:border-amber-500 rounded-xl px-3 py-2 text-xs text-white font-mono font-bold focus:outline-none"
                  />
                </div>
              </div>

              {/* Computed Total Cost Card */}
              <div className="bg-stone-950 border border-stone-800 rounded-xl p-3 flex items-center justify-between">
                <span className="text-xs text-stone-400">Total Purchase Cost:</span>
                <span className="text-base font-extrabold font-mono text-amber-400">
                  Ksh {((parseFloat(quantity) || 0) * (parseFloat(buyingPrice) || 0)).toLocaleString()}
                </span>
              </div>

              {/* Vendor / Supplier Name */}
              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-1">
                  Vendor / Supplier Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={vendorName}
                  onChange={e => setVendorName(e.target.value)}
                  placeholder="e.g. Mwea Rice Millers, Narok Farmers Co-op, Kapa Oil..."
                  className="w-full bg-stone-950 border border-stone-700 focus:border-amber-500 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-stone-400 focus:outline-none"
                />
              </div>

              {/* Notifications */}
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

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-extrabold text-xs transition shadow-lg shadow-amber-500/20 flex items-center justify-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>
                  {currentRole === 'admin' ? 'Add & Restock Inventory Directly' : 'Submit for Admin Approval'}
                </span>
              </button>
            </form>
          </div>
        </div>

        {/* Right: Purchase Orders & Admin Approval Queue (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Pending Approval Section for Admin */}
          {currentRole === 'admin' && pendingPurchases.length > 0 && (
            <div className="bg-amber-950/30 border-2 border-amber-500/40 rounded-2xl p-5 shadow-xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-amber-400 font-bold text-sm">
                  <Clock className="w-4 h-4" />
                  <span>Pending Admin Approvals ({pendingPurchases.length})</span>
                </div>
                <span className="text-[11px] text-amber-300/80">
                  Approving immediately updates live inventory!
                </span>
              </div>

              <div className="space-y-2">
                {pendingPurchases.map(purch => (
                  <div
                    key={purch.id}
                    className="bg-stone-950 border border-amber-500/30 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-white text-sm">{purch.productName}</span>
                        <span className="text-xs px-2 py-0.5 rounded bg-stone-800 text-amber-400 font-mono">
                          +{purch.quantity} {purch.unit}
                        </span>
                      </div>
                      <p className="text-xs text-stone-400 mt-1">
                        Vendor: <strong className="text-stone-300">{purch.vendorName}</strong> • Rate: Ksh {purch.buyingPricePerUnit}/{purch.unit}
                      </p>
                      <p className="text-[11px] text-stone-400 mt-0.5">
                        Submitted by: {purch.addedBy} on {new Date(purch.timestamp).toLocaleString()}
                      </p>
                      <p className="text-xs font-mono font-bold text-emerald-400 mt-1">
                        Total Cost: Ksh {purch.totalCost.toLocaleString()}
                      </p>
                    </div>

                    <div className="flex items-center space-x-2 shrink-0">
                      <button
                        onClick={() => approvePurchase(purch.id)}
                        className="py-1.5 px-3 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-bold text-xs transition flex items-center space-x-1 shadow-md shadow-emerald-500/20"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Approve &amp; Add Stock</span>
                      </button>
                      <button
                        onClick={() => rejectPurchase(purch.id)}
                        className="py-1.5 px-2.5 rounded-lg bg-stone-800 hover:bg-red-500 hover:text-white text-stone-400 font-bold text-xs transition"
                        title="Reject purchase"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* All Purchases Log Table */}
          <div className="bg-stone-900 border border-stone-800 rounded-2xl overflow-hidden shadow-lg">
            <div className="p-4 border-b border-stone-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-white">
                Purchase Order Log ({filteredPurchases.length})
              </h4>

              {/* Status Filter */}
              <div className="flex items-center space-x-1 bg-stone-950 p-1 rounded-xl text-xs">
                {(['all', 'approved', 'pending', 'rejected'] as const).map(st => (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    className={`px-2.5 py-1 rounded-lg text-xs capitalize transition ${
                      statusFilter === st
                        ? 'bg-amber-500 text-stone-950 font-bold'
                        : 'text-stone-400 hover:text-stone-200'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {filteredPurchases.length === 0 ? (
              <div className="py-12 text-center text-stone-400">
                <Truck className="w-10 h-10 mx-auto text-stone-400/80 stroke-1 mb-2" />
                <p className="text-xs">No purchase orders found</p>
              </div>
            ) : (
              <div className="overflow-x-auto max-h-96 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-stone-950 border-b border-stone-800 text-stone-400 uppercase tracking-wider sticky top-0">
                    <tr>
                      <th className="py-3 px-4">Date &amp; Time</th>
                      <th className="py-3 px-4">Product</th>
                      <th className="py-3 px-4">Qty</th>
                      <th className="py-3 px-4">Rate</th>
                      <th className="py-3 px-4">Vendor</th>
                      <th className="py-3 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-800">
                    {filteredPurchases.map(p => (
                      <tr key={p.id} className="hover:bg-stone-800/40 transition">
                        <td className="py-3 px-4 text-stone-300 whitespace-nowrap">
                          {p.date}
                          <br />
                          <span className="text-[10px] text-stone-400">
                            {new Date(p.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <p className="font-semibold text-white">{p.productName}</p>
                          <span className="text-[10px] text-amber-400">{p.category}</span>
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-white whitespace-nowrap">
                          {p.quantity} {p.unit}
                        </td>
                        <td className="py-3 px-4 font-mono text-stone-300 whitespace-nowrap">
                          Ksh {p.buyingPricePerUnit}
                        </td>
                        <td className="py-3 px-4 text-stone-300">
                          {p.vendorName}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          {p.status === 'approved' && (
                            <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-emerald-950 border border-emerald-700/60 text-emerald-400 text-[10px] font-bold">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Approved</span>
                            </span>
                          )}
                          {p.status === 'pending' && (
                            <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-amber-950 border border-amber-700/60 text-amber-400 text-[10px] font-bold">
                              <Clock className="w-3 h-3" />
                              <span>Pending Admin</span>
                            </span>
                          )}
                          {p.status === 'rejected' && (
                            <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-red-950 border border-red-700/60 text-red-400 text-[10px] font-bold">
                              <XCircle className="w-3 h-3" />
                              <span>Rejected</span>
                            </span>
                          )}
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
