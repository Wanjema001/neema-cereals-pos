import React, { useState } from 'react';
import {
  Wheat,
  Lock,
  User,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  ShieldCheck
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const LoginPage: React.FC = () => {
  const { login } = useApp();

  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!username.trim()) {
      setError('Please enter your username.');
      return;
    }

    if (!password.trim()) {
      setError('Please enter your password or PIN.');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      const res = login(username, password);
      if (!res.success) {
        setError(res.error || 'Login failed. Please check credentials.');
        setLoading(false);
      }
    }, 200);
  };

  return (
    <div className="min-h-screen bg-stone-950 flex flex-col justify-center items-center p-4 selection:bg-amber-500 selection:text-stone-950 relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-amber-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-700 items-center justify-center shadow-xl shadow-amber-600/25 text-stone-950">
            <Wheat className="w-9 h-9" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              NEEMA CEREALS
            </h1>
            <p className="text-xs text-amber-400 font-semibold tracking-wide uppercase mt-0.5">
              POS &amp; Inventory Management System
            </p>
            <p className="text-xs text-stone-400 mt-1">
              Sign in with your authorized staff credentials
            </p>
          </div>
        </div>

        {/* Login Card */}
        <div className="bg-stone-900 border border-stone-800 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black/80 space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-stone-800 text-xs">
            <span className="font-bold uppercase tracking-wider text-stone-300">
              Staff Portal Sign In
            </span>
            <span className="inline-flex items-center space-x-1.5 px-2 py-0.5 rounded-full bg-emerald-950 border border-emerald-800 text-emerald-400 text-[10px] font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>System Online</span>
            </span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username Input */}
            <div>
              <label className="block text-xs font-semibold text-stone-300 mb-1.5">
                Username / Staff ID
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  required
                  autoFocus
                  autoCapitalize="none"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="Enter username"
                  className="w-full bg-stone-950 border border-stone-700 focus:border-amber-500 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-amber-500 transition"
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label className="block text-xs font-semibold text-stone-300 mb-1.5">
                Password / Security PIN
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter password or PIN"
                  className="w-full bg-stone-950 border border-stone-700 focus:border-amber-500 rounded-xl pl-10 pr-10 py-2.5 text-sm text-white placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-amber-500 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-stone-400 hover:text-stone-200 p-0.5 rounded transition"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Error Notification */}
            {error && (
              <div className="p-3 rounded-xl bg-red-950/70 border border-red-500/50 text-red-300 text-xs flex items-center space-x-2 animate-in fade-in duration-150">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                <span>{error}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-extrabold text-sm transition shadow-lg shadow-amber-500/25 flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {loading ? (
                <span>Signing in...</span>
              ) : (
                <>
                  <span>Sign In to Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Discreet Help Note - No username or password revealed */}
          <div className="pt-2 border-t border-stone-800 text-center">
            <p className="text-xs text-stone-400">
              Forgot password or PIN?{' '}
              <span className="text-amber-400 font-medium">
                Contact Super Admin Wanjema for a reset
              </span>
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-[11px] text-stone-400">
          Neema Cereals Store POS • Remote Mobile Ready • Nairobi
        </p>
      </div>
    </div>
  );
};
