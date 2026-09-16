import React, { useState } from 'react';
import { Settings, RefreshCw, Moon, Sun, Database, ShieldAlert, CheckCircle2, Trash2 } from 'lucide-react';
import { User } from '../../types';
import { ConfirmModal } from '../ConfirmModal';

interface SettingsViewProps {
  user: User;
  theme: 'dark' | 'light';
  toggleTheme: () => void;
  onSeedDemoData: () => Promise<void>;
  onClearData: () => Promise<void>;
  onDeleteAccount?: () => Promise<void>;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  user,
  theme,
  toggleTheme,
  onSeedDemoData,
  onClearData,
  onDeleteAccount,
}) => {
  const [loadingSeed, setLoadingSeed] = useState(false);
  const [loadingClear, setLoadingClear] = useState(false);
  const [loadingDeleteAcc, setLoadingDeleteAcc] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showDeleteAccConfirm, setShowDeleteAccConfirm] = useState(false);

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
          Configure app behavior, toggle appearance themes, or manage your data state.
        </p>
      </div>

      {msg && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{msg}</span>
        </div>
      )}

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
