import React from 'react';
import { X, Printer, CheckCircle2, ShoppingBag } from 'lucide-react';
import { Sale } from '../../types';
import { formatCurrencyDetailed } from '../../utils/helpers';

interface ReceiptModalProps {
  sale: Sale | null;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ sale, onClose }) => {
  if (!sale) return null;

  const handlePrint = () => {
    window.print();
  };

  const formattedDate = new Date(sale.timestamp).toLocaleString('en-KE', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-sm bg-stone-900 border border-stone-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-4 border-b border-stone-800 flex items-center justify-between bg-stone-950">
          <div className="flex items-center space-x-2 text-emerald-400">
            <CheckCircle2 className="w-5 h-5" />
            <span className="font-semibold text-sm">Sale Completed</span>
          </div>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-white p-1 rounded-lg hover:bg-stone-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Printable Receipt Paper */}
        <div className="p-4 overflow-y-auto flex-1">
          <div
            id="printable-receipt"
            className="bg-white text-stone-900 font-mono text-xs p-6 rounded-xl shadow-inner border border-stone-200"
          >
            <div className="text-center pb-4 border-b border-dashed border-stone-400">
              <div className="inline-block p-1 bg-amber-100 rounded-full mb-1">
                <ShoppingBag className="w-5 h-5 text-amber-800 mx-auto" />
              </div>
              <h2 className="font-bold text-base tracking-wider uppercase">NEEMA CEREALS</h2>
              <p className="text-[10px] text-stone-600">Fresh Grains, Rice, Salad &amp; Spices</p>
              <p className="text-[10px] text-stone-600">Tel: +254 700 123 456 / Nairobi</p>
              <div className="mt-2 text-[10px] text-stone-500">
                <span>Receipt: #{sale.receiptNo}</span>
                <br />
                <span>{formattedDate}</span>
              </div>
            </div>

            {/* Line Items */}
            <div className="py-3 border-b border-dashed border-stone-400 space-y-2">
              <div className="flex justify-between font-bold text-stone-700 text-[11px] pb-1 border-b border-stone-200">
                <span>Item</span>
                <span>Qty x Rate</span>
                <span>Total</span>
              </div>
              {sale.items.map((item, idx) => (
                <div key={idx} className="flex justify-between items-start text-[11px]">
                  <div className="flex-1 pr-2">
                    <p className="font-medium text-stone-900 leading-tight">{item.name}</p>
                    <p className="text-[10px] text-stone-500">
                      {item.quantity} {item.unit} @ Ksh {item.pricePerUnit}
                    </p>
                  </div>
                  <span className="font-semibold text-stone-900">
                    Ksh {item.total.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>

            {/* Total Calculation */}
            <div className="py-3 border-b border-dashed border-stone-400 space-y-1">
              <div className="flex justify-between text-stone-600">
                <span>Subtotal:</span>
                <span>Ksh {sale.subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between font-bold text-sm text-stone-950 pt-1">
                <span>TOTAL AMOUNT:</span>
                <span>Ksh {sale.subtotal.toLocaleString()}</span>
              </div>
            </div>

            {/* Payment Details */}
            <div className="py-3 border-b border-dashed border-stone-400 space-y-1 text-[11px]">
              <div className="flex justify-between">
                <span>Payment Mode:</span>
                <span className="font-bold uppercase text-stone-900">
                  {sale.paymentMode === 'mpesa' ? 'M-PESA' : 'CASH'}
                </span>
              </div>
              {sale.mpesaRef && (
                <div className="flex justify-between">
                  <span>M-Pesa Ref:</span>
                  <span className="font-bold text-stone-900">{sale.mpesaRef}</span>
                </div>
              )}
              <div className="flex justify-between text-stone-500 text-[10px]">
                <span>Cashier:</span>
                <span>{sale.cashierName}</span>
              </div>
            </div>

            {/* Footer */}
            <div className="pt-4 text-center text-[10px] text-stone-500 space-y-1">
              <p className="font-semibold">Asante kwa Kazi Yako!</p>
              <p>Thank you for shopping at Neema Cereals.</p>
              <p>Goods once sold in good order are not returnable.</p>
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="p-4 border-t border-stone-800 bg-stone-950 flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 px-4 rounded-xl border border-stone-700 hover:bg-stone-800 text-stone-300 font-medium text-xs transition"
          >
            Close
          </button>
          <button
            onClick={handlePrint}
            className="flex-1 py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs transition flex items-center justify-center space-x-1.5 shadow-lg shadow-amber-500/20"
          >
            <Printer className="w-4 h-4" />
            <span>Print Receipt</span>
          </button>
        </div>
      </div>
    </div>
  );
};
