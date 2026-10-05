import React from 'react';
import { AlertTriangle, Package, X, ArrowRight } from 'lucide-react';
import { LowStockAlert } from '../../types';

interface LowStockModalProps {
  alert: LowStockAlert | null;
  onClose: () => void;
  onRestockNow: (productName: string, productId: string) => void;
}

export const LowStockBannerModal: React.FC<LowStockModalProps> = ({
  alert,
  onClose,
  onRestockNow,
}) => {
  if (!alert) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-stone-900 border-2 border-red-500 rounded-2xl shadow-2xl overflow-hidden shadow-red-950/50">
        {/* Top Warning Stripe */}
        <div className="bg-red-600 px-6 py-4 flex items-center justify-between text-white">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-red-700/80 rounded-full animate-bounce">
              <AlertTriangle className="w-6 h-6 text-yellow-300" />
            </div>
            <div>
              <h3 className="font-bold text-lg tracking-wide uppercase">Critical Stock Alert</h3>
              <p className="text-xs text-red-100">Threshold warning trigger</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-red-200 hover:text-white p-1 rounded-lg hover:bg-red-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4">
          <div className="bg-red-950/50 border border-red-500/40 rounded-xl p-4 text-center">
            <p className="text-xs uppercase tracking-wider text-red-400 font-semibold mb-1">
              Action Required
            </p>
            <h4 className="text-2xl font-extrabold text-white">
              Fill product {alert.productName}
            </h4>
            <div className="mt-3 inline-flex items-center space-x-2 bg-red-900/60 px-3 py-1.5 rounded-lg border border-red-700 text-sm">
              <span className="text-stone-300">Remaining stock:</span>
              <span className="font-mono font-bold text-red-300 text-base">
                {alert.currentStock} {alert.unit}
              </span>
              <span className="text-stone-400 text-xs">
                (Min limit: {alert.minThreshold} {alert.unit})
              </span>
            </div>
          </div>

          <p className="text-sm text-stone-300 text-center">
            The stock level has dropped below the critical minimum limit of{' '}
            <span className="font-semibold text-white">
              {alert.minThreshold} {alert.unit}
            </span>
            . Please order new supply from vendor immediately to avoid stockout.
          </p>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              onClick={onClose}
              className="w-full py-2.5 px-4 rounded-xl border border-stone-700 hover:bg-stone-800 text-stone-300 font-medium text-sm transition"
            >
              Acknowledge
            </button>
            <button
              onClick={() => {
                onRestockNow(alert.productName, alert.productId);
                onClose();
              }}
              className="w-full py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-500 text-white font-semibold text-sm transition shadow-lg shadow-red-900/30 flex items-center justify-center space-x-1.5"
            >
              <span>Restock Now</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
