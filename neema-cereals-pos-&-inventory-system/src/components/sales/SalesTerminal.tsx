import React, { useState, useMemo } from 'react';
import {
  ShoppingCart,
  Plus,
  Trash2,
  DollarSign,
  Smartphone,
  Calculator,
  Coins,
  CheckCircle,
  AlertCircle,
  Building,
  ArrowRight,
  TrendingDown,
  Printer,
  Sparkles
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useApp } from '../../context/AppContext';
import { Category, Unit, PaymentMode, CartItem, Product } from '../../types';
import { formatCurrency, CATEGORY_COLORS } from '../../utils/helpers';

interface SalesTerminalProps {
  onOpenReceipt: () => void;
}

export const SalesTerminal: React.FC<SalesTerminalProps> = ({ onOpenReceipt }) => {
  const {
    products,
    recordSale,
    openingCashToday,
    calculateEndOfDay,
    commitDailyClose,
    dailyCloses
  } = useApp();

  // Current item inputs
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [productSearch, setProductSearch] = useState<string>('');
  const [category, setCategory] = useState<Category>('Cereals');
  const [unit, setUnit] = useState<Unit>('kg');
  const [pricePerUnit, setPricePerUnit] = useState<number>(0);
  const [quantity, setQuantity] = useState<string>('1');
  const [availableStock, setAvailableStock] = useState<number>(0);

  // Cart & Checkout
  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('cash');
  const [mpesaRef, setMpesaRef] = useState<string>('');
  const [saleNotes, setSaleNotes] = useState<string>('');
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  // End of Day Calculation State
  const [showEodCalculation, setShowEodCalculation] = useState<boolean>(false);
  const [eodResults, setEodResults] = useState<ReturnType<typeof calculateEndOfDay> | null>(null);
  const [nextDayFloatInput, setNextDayFloatInput] = useState<string>(openingCashToday.toString());
  const [eodSuccessMessage, setEodSuccessMessage] = useState<string | null>(null);

  // Filter products by category or query for quick search
  const filteredProducts = useMemo(() => {
    if (!productSearch) return products;
    return products.filter(p =>
      p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.category.toLowerCase().includes(productSearch.toLowerCase())
    );
  }, [products, productSearch]);

  // Handle Product Selection & AUTO-FILL!
  // Requirement: "For ease of use, i want just to input the name of the product, and the price per kg and category of the product to auto-fill."
  const handleSelectProduct = (prod: Product) => {
    setSelectedProductId(prod.id);
    setProductSearch(prod.name);
    setCategory(prod.category);
    setUnit(prod.unit);
    setPricePerUnit(prod.sellingPrice);
    setAvailableStock(prod.currentStock);
    setCheckoutError(null);
  };

  const handleProductInputChange = (value: string) => {
    setProductSearch(value);
    // Check if typed name matches an existing product
    const exactMatch = products.find(p => p.name.toLowerCase() === value.trim().toLowerCase());
    if (exactMatch) {
      setSelectedProductId(exactMatch.id);
      setCategory(exactMatch.category);
      setUnit(exactMatch.unit);
      setPricePerUnit(exactMatch.sellingPrice);
      setAvailableStock(exactMatch.currentStock);
    } else {
      setSelectedProductId('');
    }
  };

  // Add Item to Current Cart
  const handleAddToCart = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setCheckoutError(null);

    const qtyNum = parseFloat(quantity);
    if (isNaN(qtyNum) || qtyNum <= 0) {
      setCheckoutError('Please enter a valid quantity greater than 0.');
      return;
    }

    if (!productSearch.trim()) {
      setCheckoutError('Please enter or select a product.');
      return;
    }

    // Verify product exists in catalog
    const targetProduct = products.find(p => p.id === selectedProductId) ||
      products.find(p => p.name.toLowerCase() === productSearch.trim().toLowerCase());

    if (!targetProduct) {
      setCheckoutError('Product not found in inventory. Please select an existing item or add it to inventory.');
      return;
    }

    // Check available stock including what's already in the cart
    const alreadyInCart = cart.find(item => item.productId === targetProduct.id);
    const totalRequested = (alreadyInCart ? alreadyInCart.quantity : 0) + qtyNum;

    if (totalRequested > targetProduct.currentStock) {
      setCheckoutError(
        `Insufficient stock! Only ${targetProduct.currentStock} ${targetProduct.unit} available for ${targetProduct.name}.`
      );
      return;
    }

    const itemTotal = Number((qtyNum * pricePerUnit).toFixed(2));

    if (alreadyInCart) {
      setCart(prev =>
        prev.map(it =>
          it.productId === targetProduct.id
            ? {
                ...it,
                quantity: Number((it.quantity + qtyNum).toFixed(2)),
                total: Number((it.total + itemTotal).toFixed(2))
              }
            : it
        )
      );
    } else {
      const newItem: CartItem = {
        productId: targetProduct.id,
        name: targetProduct.name,
        category: targetProduct.category,
        unit: targetProduct.unit,
        quantity: qtyNum,
        pricePerUnit,
        total: itemTotal,
      };
      setCart(prev => [...prev, newItem]);
    }

    // Reset inputs for next item
    setProductSearch('');
    setSelectedProductId('');
    setQuantity('1');
    setPricePerUnit(0);
    setAvailableStock(0);
  };

  const handleRemoveFromCart = (productId: string) => {
    setCart(prev => prev.filter(it => it.productId !== productId));
  };

  const cartSubtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.total, 0);
  }, [cart]);

  // Complete Sale
  const handleCompleteSale = () => {
    if (cart.length === 0) {
      setCheckoutError('Cannot complete sale with an empty cart.');
      return;
    }

    if (paymentMode === 'mpesa' && !mpesaRef.trim()) {
      // Optional M-Pesa reference or generate one
      setMpesaRef(`MP${Date.now().toString().slice(-6)}`);
    }

    const result = recordSale({
      items: cart,
      paymentMode,
      mpesaRef: paymentMode === 'mpesa' ? (mpesaRef.trim() || `MP${Date.now().toString().slice(-6)}`) : undefined,
      notes: saleNotes.trim() || undefined,
    });

    if (result.success) {
      // Trigger festive celebration confetti
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.7 },
        });
      } catch {
        // Safe fallback
      }

      // Open receipt modal
      onOpenReceipt();

      // Reset cart
      setCart([]);
      setMpesaRef('');
      setSaleNotes('');
      setCheckoutError(null);
    } else {
      setCheckoutError(result.error || 'Failed to complete sale.');
    }
  };

  // Run End-of-Day Calculation
  // Exact user logic:
  // 1. Calculate Total sales
  // 2. Subtract M-Pesa sales
  // 3. Subtract today's expenses
  // 4. Add opening cash -> Cash at Hand
  // 5. Deposit = Cash at Hand - Next Day Opening Cash
  const handleTriggerEodCalculation = () => {
    const calc = calculateEndOfDay();
    setEodResults(calc);
    setShowEodCalculation(true);
    setEodSuccessMessage(null);
  };

  const handleCommitDailyClose = () => {
    if (!eodResults) return;

    const nextFloat = parseFloat(nextDayFloatInput);
    if (isNaN(nextFloat) || nextFloat < 0) {
      alert('Please enter a valid float amount for next day opening cash.');
      return;
    }

    commitDailyClose({
      nextDayOpeningCash: nextFloat,
      notes: `End of day close reconciled by register cashier.`,
    });

    setEodSuccessMessage(
      `Daily Register closed! Deposit of Ksh ${(eodResults.cashAtHand - nextFloat).toLocaleString()} recorded to Reports.`
    );
  };

  const todayStr = new Date().toISOString().split('T')[0];
  const isAlreadyClosedToday = dailyCloses.some(c => c.date === todayStr);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Top Banner / Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-stone-900 border border-stone-800 p-4 rounded-2xl">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center space-x-2">
            <ShoppingCart className="w-5 h-5 text-amber-500" />
            <span>Counter Sales Point (POS)</span>
          </h2>
          <p className="text-xs text-stone-400 mt-0.5">
            Quick auto-fill product lookup, instant stock verification, cash / M-Pesa checkout
          </p>
        </div>
        <div className="flex items-center space-x-2 text-xs">
          <span className="px-2.5 py-1 rounded-lg bg-stone-800 border border-stone-700 text-stone-300">
            Today Float: <strong className="text-amber-400">{formatCurrency(openingCashToday)}</strong>
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-emerald-950/60 border border-emerald-800 text-emerald-400 font-semibold">
            {todayStr}
          </span>
        </div>
      </div>

      {/* Main Grid: Left = Product Input & Quick Selection; Right = Active Cart & Checkout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Product Input Form & Autofill (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-stone-900 border border-stone-800 rounded-2xl p-5 shadow-lg">
            <h3 className="text-sm font-bold uppercase tracking-wider text-amber-400 mb-4 flex items-center justify-between">
              <span>1. Enter Customer Purchase</span>
              <span className="text-[11px] text-stone-400 normal-case font-normal">
                Type name to auto-fill category &amp; price
              </span>
            </h3>

            {products.length === 0 && (
              <div className="bg-amber-950/40 border border-amber-500/40 rounded-xl p-3.5 text-xs text-amber-300 flex items-start space-x-2.5 mb-4">
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Fresh System Ready for Deployment:</p>
                  <p className="text-amber-200/80">
                    No products in inventory yet. Go to the <strong>Inventory</strong> tab to add products, or record incoming deliveries in the <strong>Purchases</strong> tab.
                  </p>
                </div>
              </div>
            )}

            <form onSubmit={handleAddToCart} className="space-y-4">
              {/* Product Name Input with Auto-complete */}
              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-1.5">
                  Product Name <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={productSearch}
                    onChange={e => handleProductInputChange(e.target.value)}
                    placeholder="e.g. Pishori Rice, Yellow Beans, Salad Oil, Pilau Masala..."
                    className="w-full bg-stone-950 border border-stone-700 focus:border-amber-500 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                  {availableStock > 0 && (
                    <span className="absolute right-3 top-2.5 text-[11px] font-mono px-2 py-0.5 rounded bg-stone-800 text-stone-300 border border-stone-700">
                      In Stock: <strong className={availableStock <= 5 ? 'text-red-400' : 'text-emerald-400'}>{availableStock} {unit}</strong>
                    </span>
                  )}
                </div>

                {/* Quick Auto-Complete Suggestions Dropdown */}
                {productSearch && !selectedProductId && filteredProducts.length > 0 && (
                  <div className="mt-1 bg-stone-950 border border-stone-700 rounded-xl max-h-48 overflow-y-auto divide-y divide-stone-800 shadow-2xl z-20 relative">
                    {filteredProducts.slice(0, 6).map(prod => (
                      <button
                        key={prod.id}
                        type="button"
                        onClick={() => handleSelectProduct(prod)}
                        className="w-full text-left px-3.5 py-2.5 hover:bg-stone-800/80 flex items-center justify-between text-xs transition"
                      >
                        <div>
                          <p className="font-semibold text-white">{prod.name}</p>
                          <p className="text-[10px] text-stone-400">
                            Category: <span className="text-amber-400">{prod.category}</span> ({prod.unit})
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-amber-400 font-mono">
                            Ksh {prod.sellingPrice}/{prod.unit}
                          </p>
                          <p className={`text-[10px] ${prod.currentStock <= 5 ? 'text-red-400 font-bold' : 'text-stone-400'}`}>
                            {prod.currentStock} {prod.unit} left
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* 3-Col Auto-Filled Details: Category, Unit, Price per unit */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Category (Auto-filled) */}
                <div>
                  <label className="block text-xs font-semibold text-stone-300 mb-1">
                    Category (Auto)
                  </label>
                  <input
                    type="text"
                    readOnly
                    value={category}
                    className="w-full bg-stone-800/80 border border-stone-700 rounded-xl px-3 py-2 text-xs font-semibold text-amber-400 cursor-not-allowed"
                  />
                </div>

                {/* Unit of Measurement */}
                <div>
                  <label className="block text-xs font-semibold text-stone-300 mb-1">
                    Unit (Auto)
                  </label>
                  <input
                    type="text"
                    readOnly
                    value={unit}
                    className="w-full bg-stone-800/80 border border-stone-700 rounded-xl px-3 py-2 text-xs font-mono font-semibold text-stone-300 cursor-not-allowed uppercase"
                  />
                </div>

                {/* Price per unit (Auto-filled) */}
                <div>
                  <label className="block text-xs font-semibold text-stone-300 mb-1">
                    Price per {unit} (Ksh)
                  </label>
                  <input
                    type="number"
                    value={pricePerUnit || ''}
                    onChange={e => setPricePerUnit(parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                    className="w-full bg-stone-950 border border-stone-700 focus:border-amber-500 rounded-xl px-3 py-2 text-xs text-white font-mono font-bold focus:outline-none"
                  />
                </div>
              </div>

              {/* Quantity Input & Computed Line Total */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end pt-1">
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
                    placeholder="e.g. 2"
                    className="w-full bg-stone-950 border border-stone-700 focus:border-amber-500 rounded-xl px-3.5 py-2.5 text-sm text-white font-bold font-mono focus:outline-none"
                  />
                </div>

                <div className="bg-stone-950 border border-stone-800 rounded-xl p-2.5 flex items-center justify-between">
                  <span className="text-xs text-stone-400">Line Total:</span>
                  <span className="text-base font-extrabold font-mono text-emerald-400">
                    Ksh {(parseFloat(quantity || '0') * (pricePerUnit || 0)).toLocaleString()}
                  </span>
                </div>
              </div>

              {checkoutError && (
                <div className="p-3 rounded-xl bg-red-950/60 border border-red-500/50 text-red-300 text-xs flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                  <span>{checkoutError}</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-extrabold text-sm transition shadow-lg shadow-amber-500/20 flex items-center justify-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Add Item to Sale</span>
              </button>
            </form>
          </div>

          {/* Quick Selection Category Badges */}
          {products.length > 0 && (
            <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4">
              <p className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-2.5">
                Quick Pick Frequent Items:
              </p>
              <div className="flex flex-wrap gap-1.5">
                {products.slice(0, 8).map(prod => (
                  <button
                    key={prod.id}
                    onClick={() => handleSelectProduct(prod)}
                    className={`text-xs px-2.5 py-1.5 rounded-lg border transition flex items-center space-x-1.5 ${
                      selectedProductId === prod.id
                        ? 'bg-amber-500 text-stone-950 border-amber-400 font-bold'
                        : 'bg-stone-800/80 hover:bg-stone-800 text-stone-300 border-stone-700/60'
                    }`}
                  >
                    <span>{prod.name}</span>
                    <span className="text-[10px] font-mono opacity-80">
                      Ksh {prod.sellingPrice}/{prod.unit}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Active Sale Cart & Payment Mode (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-stone-900 border border-stone-800 rounded-2xl p-5 shadow-lg flex flex-col h-full justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-stone-800 mb-3">
                <div className="flex items-center space-x-2">
                  <ShoppingCart className="w-4 h-4 text-amber-500" />
                  <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                    Current Sale Cart
                  </h3>
                </div>
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-stone-800 text-amber-400 border border-stone-700">
                  {cart.length} {cart.length === 1 ? 'item' : 'items'}
                </span>
              </div>

              {/* Cart Items List */}
              {cart.length === 0 ? (
                <div className="py-12 text-center text-stone-400 space-y-2">
                  <ShoppingCart className="w-10 h-10 mx-auto text-stone-400/80 stroke-1" />
                  <p className="text-xs font-medium">Cart is empty</p>
                  <p className="text-[11px] text-stone-400">
                    Search or select a cereal product on the left to start sale.
                  </p>
                </div>
              ) : (
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {cart.map(item => (
                    <div
                      key={item.productId}
                      className="bg-stone-950 border border-stone-800 rounded-xl p-2.5 flex items-center justify-between text-xs"
                    >
                      <div className="min-w-0 flex-1 pr-2">
                        <p className="font-semibold text-white truncate">{item.name}</p>
                        <p className="text-[11px] text-stone-400">
                          {item.quantity} {item.unit} x Ksh {item.pricePerUnit}
                        </p>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className="font-bold font-mono text-emerald-400 text-sm">
                          Ksh {item.total.toLocaleString()}
                        </span>
                        <button
                          onClick={() => handleRemoveFromCart(item.productId)}
                          className="text-stone-400 hover:text-red-400 p-1 rounded-lg hover:bg-stone-800 transition"
                          title="Remove item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Cart Summary & Payment Mode */}
            <div className="pt-4 border-t border-stone-800 space-y-4">
              {/* Subtotal */}
              <div className="bg-stone-950 border border-stone-800/80 rounded-xl p-3 flex items-center justify-between">
                <span className="text-xs text-stone-400 uppercase tracking-wide">Total Amount:</span>
                <span className="text-2xl font-black font-mono text-white">
                  Ksh {cartSubtotal.toLocaleString()}
                </span>
              </div>

              {/* Payment Mode (Cash or M-Pesa) */}
              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-1.5">
                  Select Mode of Payment <span className="text-red-400">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMode('cash')}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center space-x-2 transition ${
                      paymentMode === 'cash'
                        ? 'bg-emerald-500 text-stone-950 border-emerald-400 shadow-md shadow-emerald-500/20'
                        : 'bg-stone-950 text-stone-300 border-stone-800 hover:bg-stone-800'
                    }`}
                  >
                    <DollarSign className="w-4 h-4" />
                    <span>CASH</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMode('mpesa')}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center space-x-2 transition ${
                      paymentMode === 'mpesa'
                        ? 'bg-emerald-500 text-stone-950 border-emerald-400 shadow-md shadow-emerald-500/20'
                        : 'bg-stone-950 text-stone-300 border-stone-800 hover:bg-stone-800'
                    }`}
                  >
                    <Smartphone className="w-4 h-4" />
                    <span>M-PESA</span>
                  </button>
                </div>

                {/* M-Pesa Reference Input */}
                {paymentMode === 'mpesa' && (
                  <div className="mt-2.5 animate-in fade-in duration-150">
                    <label className="block text-[11px] text-stone-400 mb-1">
                      M-Pesa Confirmation Code (Optional)
                    </label>
                    <input
                      type="text"
                      value={mpesaRef}
                      onChange={e => setMpesaRef(e.target.value.toUpperCase())}
                      placeholder="e.g. QJD4819MPE"
                      className="w-full bg-stone-950 border border-stone-700 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs font-mono uppercase text-emerald-400 focus:outline-none"
                    />
                  </div>
                )}
              </div>

              {/* Checkout Button */}
              <button
                type="button"
                onClick={handleCompleteSale}
                disabled={cart.length === 0}
                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-stone-950 font-extrabold text-sm transition shadow-lg shadow-emerald-600/25 flex items-center justify-center space-x-2"
              >
                <CheckCircle className="w-5 h-5" />
                <span>Complete Sale (Ksh {cartSubtotal.toLocaleString()})</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* END OF DAY CALCULATION CARD (EXACT USER REQUIREMENT SPECIFIED IN PROMPT) */}
      {/* ========================================================================= */}
      <div className="bg-stone-900 border-2 border-amber-500/40 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-stone-800">
          <div>
            <div className="inline-flex items-center space-x-2 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold mb-1">
              <Calculator className="w-3.5 h-3.5" />
              <span>End of Business Day Reconciliation</span>
            </div>
            <h3 className="text-lg font-extrabold text-white">
              Daily Register Close &amp; Deposit Calculation
            </h3>
            <p className="text-xs text-stone-400">
              Subtract M-Pesa &amp; expenses, add opening cash float, and compute daily bank deposit
            </p>
          </div>

          <button
            type="button"
            onClick={handleTriggerEodCalculation}
            className="py-2.5 px-5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-xs transition shadow-lg shadow-amber-500/25 flex items-center justify-center space-x-2 shrink-0"
          >
            <Calculator className="w-4 h-4" />
            <span>Calculate Today's Sales</span>
          </button>
        </div>

        {/* Calculation Result Panel */}
        {showEodCalculation && eodResults && (
          <div className="mt-6 space-y-6 animate-in fade-in duration-200">
            {/* Step-by-Step Breakdown Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              {/* Step 1: Total Sales */}
              <div className="bg-stone-950 border border-stone-800 rounded-2xl p-4">
                <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                  Step 1: Total Sales
                </span>
                <p className="text-2xl font-black font-mono text-white mt-1">
                  Ksh {eodResults.totalSales.toLocaleString()}
                </p>
                <p className="text-[11px] text-stone-400 mt-1">
                  {eodResults.salesCount} customer sales today
                </p>
              </div>

              {/* Step 2: Less M-Pesa */}
              <div className="bg-stone-950 border border-stone-800 rounded-2xl p-4">
                <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 flex items-center space-x-1">
                  <span>Step 2: Less M-Pesa</span>
                  <Smartphone className="w-3 h-3 text-emerald-400" />
                </span>
                <p className="text-2xl font-black font-mono text-emerald-400 mt-1">
                  - Ksh {eodResults.mpesaSales.toLocaleString()}
                </p>
                <p className="text-[11px] text-stone-400 mt-1">
                  Leaves Cash Sales: <strong className="text-white">Ksh {eodResults.cashSales.toLocaleString()}</strong>
                </p>
              </div>

              {/* Step 3: Less Petty Expenses */}
              <div className="bg-stone-950 border border-stone-800 rounded-2xl p-4">
                <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 flex items-center space-x-1">
                  <span>Step 3: Less Expenses</span>
                  <TrendingDown className="w-3 h-3 text-red-400" />
                </span>
                <p className="text-2xl font-black font-mono text-red-400 mt-1">
                  - Ksh {eodResults.totalExpenses.toLocaleString()}
                </p>
                <p className="text-[11px] text-stone-400 mt-1">
                  {eodResults.expenseCount} petty cash charges
                </p>
              </div>

              {/* Step 4: Add Opening Cash */}
              <div className="bg-stone-950 border border-stone-800 rounded-2xl p-4">
                <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 flex items-center space-x-1">
                  <span>Step 4: Add Opening Float</span>
                  <Coins className="w-3 h-3 text-amber-400" />
                </span>
                <p className="text-2xl font-black font-mono text-amber-400 mt-1">
                  + Ksh {eodResults.openingCash.toLocaleString()}
                </p>
                <p className="text-[11px] text-stone-400 mt-1">
                  Cash left in drawer at morning
                </p>
              </div>
            </div>

            {/* Reconciliation Equation Highlight */}
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="space-y-1">
                <p className="text-xs uppercase font-bold text-amber-400 tracking-wider">
                  Reconciliation Summary Formula
                </p>
                <p className="text-xs font-mono text-stone-300">
                  (Opening Float <strong className="text-amber-300">Ksh {eodResults.openingCash.toLocaleString()}</strong> +
                  Cash Sales <strong className="text-white">Ksh {eodResults.cashSales.toLocaleString()}</strong>) -
                  Expenses <strong className="text-red-400">Ksh {eodResults.totalExpenses.toLocaleString()}</strong>
                </p>
              </div>
              <div className="text-left lg:text-right">
                <span className="text-xs text-stone-400">Total Cash You Should Have At Hand:</span>
                <p className="text-3xl font-black font-mono text-amber-400">
                  Ksh {eodResults.cashAtHand.toLocaleString()}
                </p>
              </div>
            </div>

            {/* Deposit & Next Day Opening Float Input */}
            <div className="bg-stone-950 border border-stone-800 rounded-2xl p-5 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                <div>
                  <label className="block text-xs font-semibold text-stone-200 mb-1">
                    Opening Cash to Keep in Drawer for Tomorrow (Float)
                  </label>
                  <p className="text-[11px] text-stone-400 mb-2">
                    Input the amount of cash that will remain in the cashbox for tomorrow's opening.
                  </p>
                  <div className="relative">
                    <span className="absolute left-3.5 top-2.5 text-stone-400 font-bold text-xs">
                      Ksh
                    </span>
                    <input
                      type="number"
                      value={nextDayFloatInput}
                      onChange={e => setNextDayFloatInput(e.target.value)}
                      placeholder="e.g. 5000"
                      className="w-full bg-stone-900 border border-stone-700 focus:border-amber-500 rounded-xl pl-12 pr-4 py-2.5 text-sm text-white font-mono font-bold focus:outline-none"
                    />
                  </div>
                </div>

                {/* Amount to Deposit Result */}
                <div className="bg-stone-900 border border-stone-800 rounded-xl p-4 flex flex-col justify-center">
                  <span className="text-xs font-bold text-stone-400 uppercase tracking-wider flex items-center space-x-1.5">
                    <Building className="w-4 h-4 text-emerald-400" />
                    <span>Calculated Amount to Deposit / Bank:</span>
                  </span>
                  <p className="text-2xl sm:text-3xl font-black font-mono text-emerald-400 mt-1">
                    Ksh {(eodResults.cashAtHand - (parseFloat(nextDayFloatInput) || 0)).toLocaleString()}
                  </p>
                  <p className="text-[11px] text-stone-400 mt-0.5">
                    This deposit figure is recorded into the Reports section.
                  </p>
                </div>
              </div>

              {/* Success / Confirmation notification */}
              {eodSuccessMessage && (
                <div className="p-3.5 rounded-xl bg-emerald-950/70 border border-emerald-500/50 text-emerald-300 text-xs flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
                  <span className="font-medium">{eodSuccessMessage}</span>
                </div>
              )}

              {/* Commit Button */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                <span className="text-xs text-stone-400">
                  {isAlreadyClosedToday ? (
                    <span className="text-amber-400 font-semibold">
                      Notice: Register has already been closed once today. Committing will update today's record.
                    </span>
                  ) : (
                    'Ready to close register for today?'
                  )}
                </span>
                <button
                  type="button"
                  onClick={handleCommitDailyClose}
                  className="w-full sm:w-auto py-2.5 px-6 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-black text-xs transition shadow-lg shadow-emerald-500/20 flex items-center justify-center space-x-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>Commit Register Close &amp; Record Deposit</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
