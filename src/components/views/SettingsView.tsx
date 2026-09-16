import React, { useState } from 'react';
import {
  Settings,
  RefreshCw,
  Moon,
  Sun,
  Database,
  ShieldAlert,
  CheckCircle2,
  Trash2,
  Coins,
  ArrowRightLeft,
  Check,
  TrendingUp,
  Sparkles
} from 'lucide-react';
import { User } from '../../types';
import { ConfirmModal } from '../ConfirmModal';
import { useCurrency } from '../../context/CurrencyContext';

interface SettingsViewProps {
  user: User;
  theme: 'dark' | 'light';
  toggleTheme: () => void;
  onSeedDemoData: () => Promise<void>;
  onClearData: () => Promise<void>;
  onDeleteAccount?: () => Promise<void>;
  onUpdateUserSettings?: (settings: Partial<User>) => Promise<void>;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  user,
  theme,
  toggleTheme,
  onSeedDemoData,
  onClearData,
  onDeleteAccount,
  onUpdateUserSettings,
}) => {
  const {
    preferredCurrencyCode,
    preferredCurrencySymbol,
    currencyInfo,
    availableCurrencies,
    setCurrency,
    refreshRates,
    rate,
    inrPerUnit,
    baseCurrency,
    format,
    formatRaw,
    convert,
    convertToBase,
    isLoading: isLoadingRates,
    lastUpdated,
    rateSource,
  } = useCurrency();

  const [loadingSeed, setLoadingSeed] = useState(false);
  const [loadingClear, setLoadingClear] = useState(false);
  const [loadingDeleteAcc, setLoadingDeleteAcc] = useState(false);
  const [updatingCurrency, setUpdatingCurrency] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showDeleteAccConfirm, setShowDeleteAccConfirm] = useState(false);

  // Interactive quick calculator state
  const [testAmountInr, setTestAmountInr] = useState<string>('1000');

  const handleCurrencySelect = async (code: string) => {
    try {
      setUpdatingCurrency(true);
      await setCurrency(code);
      if (onUpdateUserSettings) {
        await onUpdateUserSettings({ currency: code });
      }
      const selected = availableCurrencies.find((c) => c.code === code);
      setMsg(`Display currency updated to ${selected?.flag} ${code} (${selected?.symbol}). Financial figures converted.`);
      setTimeout(() => setMsg(null), 4000);
    } catch (err: any) {
      alert(err.message || 'Failed to update preferred currency');
    } finally {
      setUpdatingCurrency(false);
    }
  };

  const handleRefreshExchangeRates = async () => {
    try {
      await refreshRates();
      setMsg('Exchange rates refreshed successfully!');
      setTimeout(() => setMsg(null), 4000);
    } catch (err: any) {
      alert('Failed to refresh rates: ' + err.message);
    }
  };

  const handleSeed = async () => {
    try {
      setLoadingSeed(true);
      await onSeedDemoData();
      setMsg('Demo transaction dataset loaded successfully!');
      setTimeout(() => setMsg(null), 4000);
    } catch (err: any) {
      alert(err.message || 'Failed to load demo data');
    } finally {
      setLoadingSeed(false);
    }
  };

  const handleConfirmClear = async () => {
    setShowClearConfirm(false);
    try {
      setLoadingClear(true);
      await onClearData();
      setMsg('All expense records cleared.');
      setTimeout(() => setMsg(null), 4000);
    } catch (err: any) {
      alert(err.message || 'Failed to clear data');
    } finally {
      setLoadingClear(false);
    }
  };

  const handleConfirmDeleteAccount = async () => {
    setShowDeleteAccConfirm(false);
    if (!onDeleteAccount) return;
    try {
      setLoadingDeleteAcc(true);
      await onDeleteAccount();
    } catch (err: any) {
      alert(err.message || 'Failed to delete account');
      setLoadingDeleteAcc(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 max-w-2xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold text-white light:text-slate-900">Application Settings</h2>
        <p className="text-sm text-[#cbc3d7] light:text-slate-500">
          Configure preferred currency, exchange rates, visual mode, and manage personal data.
        </p>
      </div>

      {msg && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{msg}</span>
        </div>
      )}

      {/* Currency Picker & Exchange Rate Service Card */}
      <div className="glass-panel rounded-3xl p-6 sm:p-7 border border-white/10 space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#d0bcff] to-[#adc6ff] flex items-center justify-center text-[#3c0091] font-bold shrink-0 shadow-sm">
              <Coins className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold text-base text-white light:text-slate-900">Preferred Display Currency</h3>
                <span className="px-2 py-0.5 text-[10px] font-extrabold rounded-full bg-[#d0bcff]/20 text-[#d0bcff] light:bg-purple-100 light:text-purple-800 border border-[#d0bcff]/30 light:border-purple-200 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Live Exchange Rate Service
                </span>
              </div>
              <p className="text-xs text-[#cbc3d7] light:text-slate-500">
                All financial summaries, graphs, budgets, and savings goals convert automatically.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleRefreshExchangeRates}
            disabled={isLoadingRates}
            className="px-3 py-1.5 rounded-xl bg-white/10 light:bg-slate-200 hover:bg-white/20 text-[#cbc3d7] light:text-slate-700 font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer self-end sm:self-auto"
            title="Refresh latest exchange rates"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoadingRates ? 'animate-spin text-[#d0bcff]' : ''}`} />
            <span>{isLoadingRates ? 'Syncing...' : 'Sync Rates'}</span>
          </button>
        </div>

        {/* Current Active Currency Banner */}
        <div className="p-4 rounded-2xl bg-white/5 light:bg-slate-100 border border-white/5 light:border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{currencyInfo.flag}</span>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-white light:text-slate-900 text-sm">
                  {currencyInfo.name} ({currencyInfo.code})
                </span>
                <span className="px-2 py-0.5 rounded-md bg-[#d0bcff]/20 text-[#d0bcff] light:bg-purple-100 light:text-purple-800 font-bold text-xs">
                  Symbol: {currencyInfo.symbol}
                </span>
              </div>
              <p className="text-xs text-[#cbc3d7] light:text-slate-500 mt-0.5">
                {preferredCurrencyCode === 'INR' ? (
                  <span>Primary base currency (1 INR = 1.0000 INR)</span>
                ) : (
                  <span>
                    1 {preferredCurrencyCode} ≈ <strong className="text-white light:text-slate-800">₹{inrPerUnit.toFixed(2)}</strong> INR &bull; 1 INR = {rate.toFixed(5)} {preferredCurrencyCode}
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="text-left sm:text-right">
            <span className="text-[10px] uppercase font-bold text-[#cbc3d7] light:text-slate-500 block">Rate Engine Status</span>
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400 light:text-emerald-700">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              {rateSource === 'live' ? 'Live Rates Active' : 'Cached Bank Rates'}
            </span>
          </div>
        </div>

        {/* Currency Grid Selection */}
        <div className="space-y-2">
          <label className="block text-xs font-bold uppercase text-[#cbc3d7] light:text-slate-600">
            Select Preferred Currency ({availableCurrencies.length} Available)
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
            {availableCurrencies.map((c) => {
              const isSelected = c.code === preferredCurrencyCode;
              return (
                <button
                  key={c.code}
                  type="button"
                  onClick={() => handleCurrencySelect(c.code)}
                  disabled={updatingCurrency}
                  className={`p-3 rounded-2xl text-left transition-all cursor-pointer relative border ${
                    isSelected
                      ? 'bg-[#d0bcff]/15 light:bg-purple-100/70 border-[#d0bcff] light:border-purple-400 shadow-md ring-1 ring-[#d0bcff]'
                      : 'bg-white/5 light:bg-slate-100/80 hover:bg-white/10 light:hover:bg-slate-200/80 border-white/5 light:border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xl">{c.flag}</span>
                    {isSelected && (
                      <span className="w-4 h-4 rounded-full bg-[#d0bcff] light:bg-purple-600 text-[#3c0091] light:text-white flex items-center justify-center text-[10px] font-bold">
                        <Check className="w-2.5 h-2.5" />
                      </span>
                    )}
                  </div>
                  <div className="mt-1.5 font-bold text-xs text-white light:text-slate-900 flex items-center justify-between">
                    <span>{c.code}</span>
                    <span className="text-[#d0bcff] light:text-purple-700 font-extrabold">{c.symbol}</span>
                  </div>
                  <div className="text-[10px] text-[#cbc3d7] light:text-slate-500 truncate mt-0.5">
                    {c.name}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Live Interactive Conversion Preview */}
        <div className="p-4 rounded-2xl bg-black/15 light:bg-slate-50 border border-white/5 light:border-slate-200 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-[#cbc3d7] light:text-slate-600 flex items-center gap-1.5">
              <ArrowRightLeft className="w-3.5 h-3.5 text-[#d0bcff] light:text-purple-700" />
              Live Rate Conversion Preview
            </span>
            <span className="text-[11px] text-[#cbc3d7] light:text-slate-500">
              Synced: {lastUpdated}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
            <div className="p-2.5 rounded-xl bg-white/5 light:bg-white border border-white/5 light:border-slate-200 space-y-0.5">
              <span className="text-[10px] text-[#cbc3d7] light:text-slate-500">Daily Lunch (₹250)</span>
              <div className="font-bold text-white light:text-slate-900">
                {format(250)}
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-white/5 light:bg-white border border-white/5 light:border-slate-200 space-y-0.5">
              <span className="text-[10px] text-[#cbc3d7] light:text-slate-500">Books & Supplies (₹2,500)</span>
              <div className="font-bold text-white light:text-slate-900">
                {format(2500)}
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-white/5 light:bg-white border border-white/5 light:border-slate-200 space-y-0.5">
              <span className="text-[10px] text-[#cbc3d7] light:text-slate-500">Monthly Budget (₹15,000)</span>
              <div className="font-bold text-[#d0bcff] light:text-purple-700">
                {format(15000)}
              </div>
            </div>
          </div>

          {/* Custom quick test input */}
          <div className="flex items-center gap-2 pt-1">
            <span className="text-xs text-[#cbc3d7] light:text-slate-500 shrink-0">Custom Test:</span>
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#cbc3d7] light:text-slate-400">₹</span>
              <input
                type="number"
                min="1"
                value={testAmountInr}
                onChange={(e) => setTestAmountInr(e.target.value)}
                placeholder="Enter INR amount..."
                className="w-full bg-white/5 light:bg-white border border-white/10 light:border-slate-300 rounded-xl pl-7 pr-3 py-1.5 text-xs text-white light:text-slate-900 font-bold focus:outline-none focus:border-[#d0bcff]"
              />
            </div>
            <div className="px-3 py-1.5 rounded-xl bg-[#d0bcff]/20 light:bg-purple-100 text-[#d0bcff] light:text-purple-800 font-extrabold text-xs shrink-0 border border-[#d0bcff]/30 light:border-purple-200">
              = {format(Number(testAmountInr) || 0)}
            </div>
          </div>
        </div>
      </div>

      {/* Theme Toggle Card */}
      <div className="glass-panel rounded-3xl p-6 border border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-white/10 light:bg-purple-100 flex items-center justify-center text-[#d0bcff] light:text-purple-700">
            {theme === 'dark' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5 text-amber-500" />}
          </div>
          <div>
            <h3 className="font-bold text-sm text-white light:text-slate-900">Visual Display Mode</h3>
            <p className="text-xs text-[#cbc3d7] light:text-slate-500">
              Current mode: <strong className="text-white light:text-slate-900 capitalize">{theme}</strong>
            </p>
          </div>
        </div>

        <button
          onClick={toggleTheme}
          className="px-4 py-2 rounded-xl bg-white/10 light:bg-slate-100 hover:bg-white/20 light:hover:bg-slate-200 border border-white/5 light:border-slate-300 text-white light:text-slate-900 font-bold text-xs transition-colors cursor-pointer"
        >
          Switch to {theme === 'dark' ? 'Light' : 'Dark'} Mode
        </button>
      </div>

      {/* Demo Data Seeder */}
      <div className="glass-panel rounded-3xl p-6 border border-white/10 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 light:bg-indigo-100 flex items-center justify-center text-indigo-400 light:text-indigo-600">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-white light:text-slate-900">Load Sample Data</h3>
            <p className="text-xs text-[#cbc3d7] light:text-slate-500">
              Populate realistic sample expenses (food, transport, shopping, subscriptions) for testing.
            </p>
          </div>
        </div>

        <button
          onClick={handleSeed}
          disabled={loadingSeed}
          className="w-full py-3 rounded-2xl bg-gradient-to-r from-[#d0bcff] to-[#ffb0cd] text-[#3c0091] font-bold text-xs flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all cursor-pointer"
        >
          <RefreshCw className={`w-4 h-4 ${loadingSeed ? 'animate-spin' : ''}`} />
          <span>{loadingSeed ? 'Seeding Dataset...' : 'Load Sample Expenses'}</span>
        </button>
      </div>

      {/* Danger Zone */}
      <div className="glass-panel rounded-3xl p-6 border border-rose-500/20 space-y-4 bg-rose-500/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-rose-500/20 light:bg-rose-100 flex items-center justify-center text-rose-400 light:text-rose-600">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-rose-400 light:text-rose-600">Danger Zone</h3>
            <p className="text-xs text-[#cbc3d7] light:text-slate-600">
              Clear recorded transactions or delete your account permanently.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <button
            onClick={() => setShowClearConfirm(true)}
            disabled={loadingClear}
            className="w-full py-3 rounded-2xl bg-rose-500/20 light:bg-rose-100 hover:bg-rose-500/30 text-rose-300 light:text-rose-700 border border-rose-500/30 light:border-rose-300 font-bold text-xs transition-colors cursor-pointer"
          >
            {loadingClear ? 'Clearing...' : 'Clear Expense Records'}
          </button>

          {onDeleteAccount && (
            <button
              onClick={() => setShowDeleteAccConfirm(true)}
              disabled={loadingDeleteAcc}
              className="w-full py-3 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition-colors shadow-md cursor-pointer"
            >
              {loadingDeleteAcc ? 'Deleting Account...' : 'Delete Account'}
            </button>
          )}
        </div>
      </div>

      {/* Confirm Modals */}
      <ConfirmModal
        isOpen={showClearConfirm}
        title="Clear All Expenses"
        message="Are you sure you want to delete all recorded expenses associated with your account? This action cannot be undone."
        confirmLabel="Clear Data"
        onConfirm={handleConfirmClear}
        onCancel={() => setShowClearConfirm(false)}
      />

      <ConfirmModal
        isOpen={showDeleteAccConfirm}
        title="Delete Account Permanently"
        message="Are you sure you want to delete your entire account along with all budgets, goals, limits, and expense history? This action is IRREVERSIBLE."
        confirmLabel="Permanently Delete Account"
        onConfirm={handleConfirmDeleteAccount}
        onCancel={() => setShowDeleteAccConfirm(false)}
      />
    </div>
  );
};

