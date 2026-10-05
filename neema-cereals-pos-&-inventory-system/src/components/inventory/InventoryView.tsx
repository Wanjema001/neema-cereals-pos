import React, { useState, useMemo } from 'react';
import {
  Boxes,
  AlertTriangle,
  Plus,
  Search,
  SlidersHorizontal,
  ArrowUpDown,
  Truck,
  Edit2,
  Trash2,
  CheckCircle,
  PackageX,
  X
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Product, Category, Unit } from '../../types';
import { formatCurrency, formatStockDisplay, CATEGORY_UNITS, CATEGORY_COLORS } from '../../utils/helpers';

interface InventoryViewProps {
  onGoToPurchasesForRestock: (productName: string, productId: string) => void;
  onTriggerAlertModal: (product: Product) => void;
}

export const InventoryView: React.FC<InventoryViewProps> = ({
  onGoToPurchasesForRestock,
  onTriggerAlertModal,
}) => {
  const {
    products,
    addProduct,
    updateProduct,
    deleteProduct,
    adjustStock,
    currentRole
  } = useApp();

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [stockStatusFilter, setStockStatusFilter] = useState<'all' | 'low_only'>('all');

  // Add Product Modal
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [newProductName, setNewProductName] = useState<string>('');
  const [newCategory, setNewCategory] = useState<Category>('Cereals');
  const [newUnit, setNewUnit] = useState<Unit>('kg');
  const [newCurrentStock, setNewCurrentStock] = useState<string>('50');
  const [newThreshold, setNewThreshold] = useState<string>('5');
  const [newBuyingPrice, setNewBuyingPrice] = useState<string>('120');
  const [newSellingPrice, setNewSellingPrice] = useState<string>('160');

  // Quick Stock Adjustment Modal
  const [adjustingProduct, setAdjustingProduct] = useState<Product | null>(null);
  const [adjustmentValue, setAdjustmentValue] = useState<string>('');
  const [adjustmentReason, setAdjustmentReason] = useState<string>('Physical count reconciliation');

  // Handle Category Select in Add Modal
  const handleNewCategoryChange = (cat: Category) => {
    setNewCategory(cat);
    const u = CATEGORY_UNITS[cat];
    setNewUnit(u);
    setNewThreshold(u === 'grams' ? '500' : '5');
  };

  const handleCreateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProductName.trim()) return;

    addProduct({
      name: newProductName.trim(),
      category: newCategory,
      unit: newUnit,
      currentStock: parseFloat(newCurrentStock) || 0,
      minStockThreshold: parseFloat(newThreshold) || (newUnit === 'grams' ? 500 : 5),
      buyingPrice: parseFloat(newBuyingPrice) || 0,
      sellingPrice: parseFloat(newSellingPrice) || 0,
      lastRestocked: new Date().toISOString().split('T')[0],
    });

    // Reset & Close
    setNewProductName('');
    setShowAddModal(false);
  };

  const handleSaveStockAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustingProduct) return;
    const newStock = parseFloat(adjustmentValue);
    if (isNaN(newStock) || newStock < 0) return;

    adjustStock(adjustingProduct.id, newStock, adjustmentReason);
    setAdjustingProduct(null);
  };

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      // Category filter
      if (selectedCategory !== 'all' && p.category !== selectedCategory) {
        return false;
      }
      // Low stock only
      if (stockStatusFilter === 'low_only' && p.currentStock > p.minStockThreshold) {
        return false;
      }
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          p.name.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          p.barcode?.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [products, selectedCategory, stockStatusFilter, searchQuery]);

  // Low stock calculation (< 5kg/liters/items, < 500g)
  const lowStockList = useMemo(() => {
    return products.filter(p => p.currentStock <= p.minStockThreshold);
  }, [products]);

  // Overall Inventory Value
  const totalValuation = useMemo(() => {
    const cost = products.reduce((sum, p) => sum + p.currentStock * p.buyingPrice, 0);
    const retail = products.reduce((sum, p) => sum + p.currentStock * p.sellingPrice, 0);
    return { cost, retail, profitPotential: retail - cost };
  }, [products]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-stone-900 border border-stone-800 p-5 rounded-2xl">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center space-x-2">
            <Boxes className="w-5 h-5 text-amber-500" />
            <span>Real-Time Inventory Stock</span>
          </h2>
          <p className="text-xs text-stone-400 mt-0.5">
            Automatic real-time deduction on sales, addition on purchases, and critical &lt; 5kg alert alerts
          </p>
        </div>

        {currentRole === 'admin' && (
          <button
            onClick={() => setShowAddModal(true)}
            className="py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs transition shadow-lg shadow-amber-500/20 flex items-center justify-center space-x-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Product</span>
          </button>
        )}
      </div>

      {/* Critical Stock Alert Banner when ANY product has < 5kg */}
      {lowStockList.length > 0 && (
        <div className="bg-red-950/60 border-2 border-red-500/80 rounded-2xl p-4 shadow-xl shadow-red-950/40">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-red-600 rounded-xl text-white animate-pulse">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-extrabold text-sm text-red-200 uppercase tracking-wide">
                  Critical Stock Warning: {lowStockList.length} Item(s) Below Threshold (&lt; 5 {lowStockList[0]?.unit})
                </h4>
                <p className="text-xs text-stone-300">
                  Products in red require immediate replenishment from suppliers. Click "Fill Product" to restock.
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setStockStatusFilter(stockStatusFilter === 'low_only' ? 'all' : 'low_only')}
                className="py-1.5 px-3 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold text-xs transition shadow"
              >
                {stockStatusFilter === 'low_only' ? 'Show All Products' : 'Filter Critical Only'}
              </button>
            </div>
          </div>

          {/* Quick chips of low stock items */}
          <div className="mt-3 flex flex-wrap gap-2 pt-2 border-t border-red-900/60">
            {lowStockList.map(item => (
              <button
                key={item.id}
                onClick={() => onTriggerAlertModal(item)}
                className="text-xs px-2.5 py-1 rounded-lg bg-red-900/50 hover:bg-red-900 border border-red-600/70 text-red-200 flex items-center space-x-2 transition"
              >
                <span>Fill <strong>{item.name}</strong></span>
                <span className="font-mono font-bold text-white bg-red-800 px-1.5 py-0.5 rounded text-[10px]">
                  {item.currentStock} {item.unit} left
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* KPI Cards: Inventory Valuation */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4">
          <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Total Products</span>
          <p className="text-2xl font-black font-mono text-white mt-1">{products.length}</p>
          <p className="text-[11px] text-stone-400 mt-1">Across 6 categories</p>
        </div>

        <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4">
          <span className="text-[10px] font-bold uppercase tracking-wider text-red-400 flex items-center space-x-1">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Low Stock (&lt; 5kg)</span>
          </span>
          <p className="text-2xl font-black font-mono text-red-400 mt-1">{lowStockList.length}</p>
          <p className="text-[11px] text-red-300 mt-1">Needs replenishment</p>
        </div>

        <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4">
          <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Inventory Cost</span>
          <p className="text-2xl font-black font-mono text-stone-300 mt-1">
            {formatCurrency(totalValuation.cost)}
          </p>
          <p className="text-[11px] text-stone-400 mt-1">Capital in stock</p>
        </div>

        <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Retail Value</span>
          <p className="text-2xl font-black font-mono text-emerald-400 mt-1">
            {formatCurrency(totalValuation.retail)}
          </p>
          <p className="text-[11px] text-emerald-300/80 mt-1">
            Potential margin: {formatCurrency(totalValuation.profitPotential)}
          </p>
        </div>
      </div>

      {/* Filter Row: Category Tabs & Search Bar */}
      <div className="bg-stone-900 border border-stone-800 rounded-2xl p-3.5 flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search product, category, barcode..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-stone-950 border border-stone-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-stone-400 focus:outline-none focus:border-amber-500"
          />
        </div>

        {/* Category Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
          {['all', 'Cereals', 'Rice', 'Salad', 'Flour', 'Spices', 'Hardware'].map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-xl text-xs font-semibold capitalize whitespace-nowrap transition ${
                selectedCategory === cat
                  ? 'bg-amber-500 text-stone-950 font-bold'
                  : 'bg-stone-950 text-stone-300 hover:text-white border border-stone-800'
              }`}
            >
              {cat === 'all' ? 'All' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Real-time Inventory Table (Rows turn RED when < 5kg/liters/items) */}
      <div className="bg-stone-900 border border-stone-800 rounded-2xl overflow-hidden shadow-xl">
        {filteredProducts.length === 0 ? (
          <div className="py-16 text-center text-stone-400 space-y-3 px-4">
            <Boxes className="w-12 h-12 mx-auto text-stone-600 stroke-1" />
            <div>
              <p className="text-sm font-semibold text-white">No Products in Inventory</p>
              <p className="text-xs text-stone-400 max-w-sm mx-auto mt-1">
                {products.length === 0
                  ? "Your catalog is clean and ready for deployment. Click '+ Add New Product' above to start tracking stock for Cereals, Rice, Salad, Flour, Spices, or Hardware."
                  : "No products matched your search or category filter."}
              </p>
            </div>
            {currentRole === 'admin' && products.length === 0 && (
              <button
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs shadow-md transition"
              >
                <Plus className="w-4 h-4" />
                <span>Add Your First Product</span>
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-950 border-b border-stone-800 text-stone-400 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3.5 px-4">Product Name</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Current Stock</th>
                  <th className="py-3.5 px-4">Min Limit</th>
                  <th className="py-3.5 px-4">Buying Price</th>
                  <th className="py-3.5 px-4">Selling Price</th>
                  <th className="py-3.5 px-4">Stock Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-800">
                {filteredProducts.map(product => {
                  const isCriticalLow = product.currentStock <= product.minStockThreshold;

                  return (
                    <tr
                      key={product.id}
                      className={`transition ${
                        isCriticalLow
                          ? 'bg-red-950/40 hover:bg-red-950/60 border-l-4 border-l-red-500 text-red-200'
                          : 'hover:bg-stone-800/40 text-stone-300'
                      }`}
                    >
                      {/* Name */}
                      <td className="py-3.5 px-4 font-semibold">
                        <div className="flex items-center space-x-2">
                          {isCriticalLow && (
                            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 animate-bounce" />
                          )}
                          <div>
                            <p className={`font-bold ${isCriticalLow ? 'text-white' : 'text-white'}`}>
                              {product.name}
                            </p>
                            {product.barcode && (
                              <span className="text-[10px] text-stone-400 font-mono">
                                SKU: {product.barcode}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold border bg-stone-800 text-stone-300 border-stone-700">
                          {product.category} ({product.unit})
                        </span>
                      </td>

                      {/* Current Stock */}
                      <td className="py-3.5 px-4 font-mono font-bold text-sm whitespace-nowrap">
                        <span className={isCriticalLow ? 'text-red-400 font-extrabold' : 'text-white'}>
                          {formatStockDisplay(product.currentStock, product.unit)}
                        </span>
                      </td>

                      {/* Min Limit */}
                      <td className="py-3.5 px-4 font-mono text-stone-400 whitespace-nowrap">
                        {product.minStockThreshold} {product.unit}
                      </td>

                      {/* Buying Price */}
                      <td className="py-3.5 px-4 font-mono text-stone-300 whitespace-nowrap">
                        Ksh {product.buyingPrice}/{product.unit}
                      </td>

                      {/* Selling Price */}
                      <td className="py-3.5 px-4 font-mono font-bold text-amber-400 whitespace-nowrap">
                        Ksh {product.sellingPrice}/{product.unit}
                      </td>

                      {/* Stock Status Badge */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {isCriticalLow ? (
                          <button
                            onClick={() => onTriggerAlertModal(product)}
                            className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-red-600 hover:bg-red-500 text-white font-bold text-[11px] shadow-sm animate-pulse"
                            title="Click to view alert popup"
                          >
                            <AlertTriangle className="w-3 h-3" />
                            <span>FILL PRODUCT!</span>
                          </button>
                        ) : (
                          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-emerald-950 border border-emerald-700/60 text-emerald-400 text-[10px] font-bold">
                            <CheckCircle className="w-3 h-3" />
                            <span>Adequate</span>
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center space-x-1.5">
                          {/* Quick Restock Action Button */}
                          <button
                            onClick={() => onGoToPurchasesForRestock(product.name, product.id)}
                            className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-[11px] flex items-center space-x-1 transition shadow-sm"
                            title="Restock this product"
                          >
                            <Truck className="w-3.5 h-3.5" />
                            <span>Restock</span>
                          </button>

                          {/* Adjust Stock Button */}
                          {currentRole === 'admin' && (
                            <button
                              onClick={() => {
                                setAdjustingProduct(product);
                                setAdjustmentValue(product.currentStock.toString());
                              }}
                              className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white transition"
                              title="Adjust Stock Manually"
                            >
                              <SlidersHorizontal className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Delete Button (Admin only) */}
                          {currentRole === 'admin' && (
                            <button
                              onClick={() => {
                                if (window.confirm(`Are you sure you want to delete ${product.name}?`)) {
                                  deleteProduct(product.id);
                                }
                              }}
                              className="p-1.5 rounded-lg bg-stone-800 hover:bg-red-600 hover:text-white text-stone-400 transition"
                              title="Delete Product"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
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

      {/* Modal: Add New Product */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-stone-900 border border-stone-800 rounded-2xl shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-stone-800 flex items-center justify-between bg-stone-950">
              <h3 className="font-bold text-sm text-white flex items-center space-x-2">
                <Plus className="w-4 h-4 text-amber-500" />
                <span>Add New Product to Neema Cereals</span>
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-stone-400 hover:text-white p-1 rounded-lg hover:bg-stone-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProduct} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-1">
                  Product Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newProductName}
                  onChange={e => setNewProductName(e.target.value)}
                  placeholder="e.g. Mwea Pishori Brown Rice"
                  className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-300 mb-1">Category</label>
                  <select
                    value={newCategory}
                    onChange={e => handleNewCategoryChange(e.target.value as Category)}
                    className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
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
                  <label className="block text-xs font-semibold text-stone-300 mb-1">Unit of Measure</label>
                  <input
                    type="text"
                    readOnly
                    value={newUnit}
                    className="w-full bg-stone-800 border border-stone-700 rounded-xl px-3 py-2 text-xs font-mono font-bold text-stone-300 uppercase cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-300 mb-1">
                    Initial Stock ({newUnit})
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={newCurrentStock}
                    onChange={e => setNewCurrentStock(e.target.value)}
                    className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-xs text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-300 mb-1">
                    Low Stock Alert Limit ({newUnit})
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={newThreshold}
                    onChange={e => setNewThreshold(e.target.value)}
                    className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-xs text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-300 mb-1">
                    Buying Price / {newUnit} (Ksh)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={newBuyingPrice}
                    onChange={e => setNewBuyingPrice(e.target.value)}
                    className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-xs text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-300 mb-1">
                    Selling Price / {newUnit} (Ksh)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={newSellingPrice}
                    onChange={e => setNewSellingPrice(e.target.value)}
                    className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-xs text-white font-mono font-bold text-amber-400"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-stone-700 text-stone-300 font-semibold text-xs hover:bg-stone-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs shadow-lg shadow-amber-500/20"
                >
                  Create Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Quick Stock Adjustment */}
      {adjustingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-sm bg-stone-900 border border-stone-800 rounded-2xl shadow-2xl p-5 space-y-4">
            <h4 className="font-bold text-sm text-white">
              Adjust Stock: {adjustingProduct.name}
            </h4>
            <p className="text-xs text-stone-400">
              Current registered stock: {adjustingProduct.currentStock} {adjustingProduct.unit}
            </p>

            <form onSubmit={handleSaveStockAdjustment} className="space-y-3">
              <div>
                <label className="block text-xs text-stone-300 mb-1 font-semibold">
                  New Actual Count ({adjustingProduct.unit})
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={adjustmentValue}
                  onChange={e => setAdjustmentValue(e.target.value)}
                  className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-sm text-white font-mono font-bold focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs text-stone-300 mb-1 font-semibold">Reason</label>
                <input
                  type="text"
                  value={adjustmentReason}
                  onChange={e => setAdjustmentReason(e.target.value)}
                  className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAdjustingProduct(null)}
                  className="flex-1 py-2 rounded-xl border border-stone-700 text-stone-300 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs"
                >
                  Save Count
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
