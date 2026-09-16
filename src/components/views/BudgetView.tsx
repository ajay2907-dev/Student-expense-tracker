import React, { useState } from 'react';
import {
  Wallet,
  AlertTriangle,
  CheckCircle2,
  Save,
  Plus,
  Trash2,
  RefreshCw,
  Sliders,
  Layers,
  ArrowRight,
  ShieldAlert,
  Calendar
} from 'lucide-react';
import { User, Budget, Expense, CategoryLimit, RecurringExpense } from '../../types';
import { formatCurrency } from '../../lib/api';

interface BudgetViewProps {
  user: User;
  budgets: Budget[];
  categoryLimits: CategoryLimit[];
  recurringExpenses: RecurringExpense[];
  expenses: Expense[];
  onSaveBudget: (month: string, amount: number) => Promise<void>;
  onSaveCategoryLimit: (category: string, limitAmount: number) => Promise<void>;
  onDeleteCategoryLimit: (limitId: string) => Promise<void>;
  onAddRecurringExpense: (recurring: Partial<RecurringExpense>) => Promise<void>;
  onDeleteRecurringExpense: (recurringId: string) => Promise<void>;
  onUpdateUserSettings: (settings: Partial<User>) => Promise<void>;
}

export const BudgetView: React.FC<BudgetViewProps> = ({
  user,
  budgets,
  categoryLimits,
  recurringExpenses,
  expenses,
  onSaveBudget,
  onSaveCategoryLimit,
  onDeleteCategoryLimit,
  onAddRecurringExpense,
  onDeleteRecurringExpense,
  onUpdateUserSettings,
}) => {
  const currency = user.currency || '₹';
  const currentMonthStr = new Date().toISOString().substring(0, 7); // YYYY-MM
  const todayStr = new Date().toISOString().split('T')[0];

  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthStr);

  const budgetObj = budgets.find((b) => b.month === selectedMonth);
  const currentBudgetAmount = budgetObj ? budgetObj.amount : 15000;

  const [inputBudget, setInputBudget] = useState<string>(currentBudgetAmount.toString());
  const [loading, setLoading] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Category Limit Form State
  const [limitCat, setLimitCat] = useState<string>('Food');
  const [limitAmt, setLimitAmt] = useState<string>('');
  const [savingLimit, setSavingLimit] = useState<boolean>(false);

  // Recurring Expense Form State
  const [recName, setRecName] = useState<string>('');
  const [recAmount, setRecAmount] = useState<string>('');
  const [recCat, setRecCat] = useState<string>('Food');
  const [recFreq, setRecFreq] = useState<'daily' | 'weekly' | 'monthly'>('monthly');
  const [recStartDate, setRecStartDate] = useState<string>(todayStr);
  const [recPayment, setRecPayment] = useState<string>('UPI');
  const [addingRec, setAddingRec] = useState<boolean>(false);

  // Month expense calculation & Rollover
  let rolloverAmount = 0;
  if (user.budget_rollover_enabled) {
    const prevMonthDate = new Date();
    prevMonthDate.setMonth(prevMonthDate.getMonth() - 1);
    const prevMonthStr = prevMonthDate.toISOString().substring(0, 7);
    const prevBudgetObj = budgets.find((b) => b.month === prevMonthStr);
    if (prevBudgetObj) {
      const prevExpenses = expenses.filter((e) => e.date.startsWith(prevMonthStr));
      const prevSpent = prevExpenses.reduce((sum, e) => sum + e.amount, 0);
      rolloverAmount = Math.max(0, prevBudgetObj.amount - prevSpent);
    }
  }

  const effectiveBudget = currentBudgetAmount + rolloverAmount;
  const monthExpenses = expenses.filter((e) => e.date.startsWith(selectedMonth));
  const totalSpent = monthExpenses.reduce((sum, e) => sum + e.amount, 0);
  const remaining = effectiveBudget - totalSpent;
  const usagePct = effectiveBudget > 0 ? (totalSpent / effectiveBudget) * 100 : 0;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(inputBudget);
    if (isNaN(amt) || amt <= 0) return;

    try {
      setLoading(true);
      await onSaveBudget(selectedMonth, amt);
      setSuccessMsg(`Updated ${selectedMonth} budget limit to ${formatCurrency(amt, currency)}!`);
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      alert(err.message || 'Failed to save budget');
    } finally {
      setLoading(false);
    }
  };

  const handleAddCategoryLimit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(limitAmt);
    if (isNaN(amt) || amt <= 0) return;

    setSavingLimit(true);
    try {
      await onSaveCategoryLimit(limitCat, amt);
      setLimitAmt('');
    } catch (err: any) {
      alert(err.message || 'Failed to save category limit');
    } finally {
      setSavingLimit(false);
    }
  };

  const handleAddRecurring = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(recAmount);
    if (!recName.trim() || isNaN(amt) || amt <= 0) return;

    setAddingRec(true);
    try {
      await onAddRecurringExpense({
        user_id: user.user_id,
        name: recName.trim(),
        amount: amt,
        category: recCat,
        frequency: recFreq,
        start_date: recStartDate,
        payment_method: recPayment,
      });
      setRecName('');
      setRecAmount('');
    } catch (err: any) {
      alert(err.message || 'Failed to add recurring expense');
    } finally {
      setAddingRec(false);
    }
  };

  const toggleRollover = async () => {
    try {
      await onUpdateUserSettings({
        budget_rollover_enabled: !user.budget_rollover_enabled,
      });
    } catch (err) {
      console.error('Failed to toggle rollover:', err);
    }
  };

  // Status Badge Logic
  const getBadgeStatus = () => {
    if (usagePct > 100) {
      return {
        label: '🚨 Exceeded Limit',
        color: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
        bar: 'bg-rose-500',
        advice: 'Alert: You have spent more than your total allocated monthly budget!',
      };
    }
    if (usagePct >= 80) {
      return {
        label: '⚠️ Warning Level',
        color: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
        bar: 'bg-amber-500',
        advice: 'Be careful! You have used over 80% of your allocated monthly budget.',
      };
    }
    if (usagePct >= 50) {
      return {
        label: '🟡 Moderate Spending',
        color: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
        bar: 'bg-yellow-400',
        advice: 'You have consumed over half your budget for this month.',
      };
    }
    return {
      label: '🟢 Safe Zone',
      color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
      bar: 'bg-emerald-400',
      advice: 'Great job! Your spending is well within planned parameters.',
    };
  };

  const status = getBadgeStatus();

  return (
    <div className="space-y-8 animate-in fade-in duration-300 max-w-5xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold text-white light:text-slate-900">Budget Management</h2>
        <p className="text-sm text-[#cbc3d7] light:text-slate-500">
          Configure monthly budgets, category spending limits, rollover options, and automated recurring expenses.
        </p>
      </div>

      {/* Main Budget Card */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-white/10 space-y-6">
        {/* Month Picker, Rollover & Badge */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
          <div className="flex items-center gap-4 flex-wrap">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#cbc3d7] mb-1">
                Select Budget Month
              </label>
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => {
                  setSelectedMonth(e.target.value);
                  const b = budgets.find((item) => item.month === e.target.value);
                  setInputBudget(b ? b.amount.toString() : '15000');
                }}
                className="bg-black/20 light:bg-slate-100 border border-white/10 light:border-slate-300 rounded-xl px-4 py-2 text-white light:text-slate-900 font-bold text-sm focus:outline-none"
              />
            </div>

            {/* Rollover Toggle */}
            <div className="flex items-center gap-2 pt-4 sm:pt-0">
              <button
                type="button"
                onClick={toggleRollover}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                  user.budget_rollover_enabled ? 'bg-[#d0bcff]' : 'bg-white/10 light:bg-slate-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-slate-900 transition-transform ${
                    user.budget_rollover_enabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
              <span className="text-xs font-semibold text-[#cbc3d7] light:text-slate-600">
                Budget Rollover {user.budget_rollover_enabled ? '(Enabled)' : '(Disabled)'}
              </span>
            </div>
          </div>

          <span className={`px-4 py-1.5 rounded-full text-xs font-extrabold border ${status.color}`}>
            {status.label}
          </span>
        </div>

        {/* Numerical Metrics */}
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center sm:text-left">
            <div className="p-4 rounded-2xl bg-white/5 light:bg-slate-100 border border-white/5 light:border-slate-200">
              <span className="text-xs text-[#cbc3d7] light:text-slate-600 font-bold block mb-1">Total Effective Budget</span>
              <span className="text-xl font-extrabold text-white light:text-slate-900">
                {formatCurrency(effectiveBudget, currency)}
              </span>
              {rolloverAmount > 0 && (
                <span className="text-[11px] text-emerald-400 light:text-emerald-600 block mt-0.5 font-semibold">
                  Includes {formatCurrency(rolloverAmount, currency)} Rollover
                </span>
              )}
            </div>

            <div className="p-4 rounded-2xl bg-white/5 light:bg-slate-100 border border-white/5 light:border-slate-200">
              <span className="text-xs text-[#cbc3d7] light:text-slate-600 font-bold block mb-1">Total Spent ({selectedMonth})</span>
              <span className="text-xl font-extrabold text-[#ffb0cd] light:text-pink-600">
                {formatCurrency(totalSpent, currency)}
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-white/5 light:bg-slate-100 border border-white/5 light:border-slate-200">
              <span className="text-xs text-[#cbc3d7] light:text-slate-600 font-bold block mb-1">Remaining Balance</span>
              <span className={`text-xl font-extrabold ${remaining >= 0 ? 'text-emerald-400 light:text-emerald-600' : 'text-rose-400 light:text-rose-600'}`}>
                {formatCurrency(remaining, currency)}
              </span>
            </div>
          </div>

          {/* Progress gauge */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-[#cbc3d7] light:text-slate-600">
              <span>Budget Usage Progress</span>
              <span>{usagePct.toFixed(1)}%</span>
            </div>
            <div className="w-full h-4 bg-white/10 light:bg-slate-200 rounded-full overflow-hidden p-0.5 border border-white/5 light:border-slate-300">
              <div
                className={`h-full rounded-full transition-all duration-500 ${status.bar}`}
                style={{ width: `${Math.min(100, usagePct)}%` }}
              />
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white/5 light:bg-slate-100 border border-white/5 light:border-slate-200 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 light:text-amber-500 shrink-0" />
            <p className="text-xs text-[#cbc3d7] light:text-slate-600 font-medium leading-relaxed">{status.advice}</p>
          </div>
        </div>

        {/* Update Budget Form */}
        <form onSubmit={handleSave} className="pt-6 border-t border-white/10 space-y-4">
          <h3 className="font-bold text-sm text-white light:text-slate-900">Configure Base Monthly Budget Limit</h3>

          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 light:text-emerald-700 light:bg-emerald-50 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>{successMsg}</span>
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="relative w-full sm:flex-1">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-sm text-[#d0bcff] light:text-purple-700">
                {currency}
              </span>
              <input
                type="number"
                min="1000"
                step="500"
                value={inputBudget}
                onChange={(e) => setInputBudget(e.target.value)}
                placeholder="15000"
                className="w-full bg-black/20 light:bg-slate-100 border border-white/10 light:border-slate-300 rounded-2xl pl-9 pr-4 py-3 text-white light:text-slate-900 font-bold text-sm focus:outline-none focus:border-[#d0bcff]"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-gradient-to-r from-[#d0bcff] to-[#ffb0cd] text-[#3c0091] font-bold text-sm flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{loading ? 'Saving...' : 'Save Budget Limit'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Category Spending Limits Section */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-white/10 space-y-6">
        <div>
          <h3 className="font-bold text-lg text-white light:text-slate-900 flex items-center gap-2">
            <Sliders className="w-5 h-5 text-[#d0bcff] light:text-purple-700" />
            Category Spending Limits
          </h3>
          <p className="text-xs text-[#cbc3d7] light:text-slate-500">
            Set optional limits per category with threshold alerts.
          </p>
        </div>

        {/* Form to Set Category Limit */}
        <form onSubmit={handleAddCategoryLimit} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-semibold text-[#cbc3d7] light:text-slate-600 mb-1">Category</label>
            <select
              value={limitCat}
              onChange={(e) => setLimitCat(e.target.value)}
              className="w-full bg-black/20 light:bg-slate-100 border border-white/10 light:border-slate-300 rounded-xl px-3 py-2 text-xs text-white light:text-slate-900 outline-none focus:border-[#d0bcff]"
            >
              {['Food', 'Transportation', 'Education', 'Shopping', 'Entertainment', 'Personal', 'Mobile/Internet', 'Other'].map((cat) => (
                <option key={cat} value={cat} className="bg-[#171f33] text-white">
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#cbc3d7] light:text-slate-600 mb-1">Monthly Limit ({currency})</label>
            <input
              type="number"
              step="any"
              required
              value={limitAmt}
              onChange={(e) => setLimitAmt(e.target.value)}
              placeholder="e.g. 2000"
              className="w-full bg-black/20 light:bg-slate-100 border border-white/10 light:border-slate-300 rounded-xl px-3.5 py-2 text-xs text-white light:text-slate-900 outline-none focus:border-[#d0bcff]"
            />
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              disabled={savingLimit}
              className="w-full py-2.5 rounded-xl bg-[#d0bcff] text-[#3c0091] font-bold text-xs hover:bg-[#bca3f5] transition-colors cursor-pointer"
            >
              {savingLimit ? 'Saving...' : '+ Set Category Limit'}
            </button>
          </div>
        </form>

        {/* Existing Category Limits List */}
        <div className="space-y-3 pt-4 border-t border-white/10">
          {categoryLimits.length === 0 ? (
            <p className="text-xs text-[#cbc3d7] light:text-slate-500 text-center py-4">No category limits defined yet.</p>
          ) : (
            categoryLimits.map((cl) => {
              const catExpenses = monthExpenses.filter(
                (e) => e.category.toLowerCase() === cl.category.toLowerCase()
              );
              const catSpent = catExpenses.reduce((sum, e) => sum + e.amount, 0);
              const catPct = (catSpent / cl.limit_amount) * 100;

              let barColor = 'bg-emerald-400';
              if (catPct >= 100) barColor = 'bg-rose-500';
              else if (catPct >= 80) barColor = 'bg-amber-400';

              return (
                <div key={cl.limit_id} className="p-4 rounded-2xl bg-white/5 light:bg-slate-100 border border-white/5 light:border-slate-200 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-white light:text-slate-900">{cl.category}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-[#cbc3d7] light:text-slate-600">
                        {formatCurrency(catSpent, currency)} / {formatCurrency(cl.limit_amount, currency)} ({catPct.toFixed(0)}%)
                      </span>
                      <button
                        onClick={() => onDeleteCategoryLimit(cl.limit_id)}
                        className="p-1 rounded-lg hover:bg-rose-500/20 text-rose-400 transition-colors cursor-pointer"
                        title="Delete limit"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="w-full h-2 bg-white/10 light:bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${barColor}`}
                      style={{ width: `${Math.min(100, catPct)}%` }}
                    />
                  </div>

                  {catPct >= 100 && (
                    <p className="text-[11px] text-rose-400 font-semibold flex items-center gap-1">
                      <ShieldAlert className="w-3 h-3" /> Exceeded limit for {cl.category}!
                    </p>
                  )}
                  {catPct >= 80 && catPct < 100 && (
                    <p className="text-[11px] text-amber-400 font-semibold flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" /> Approaching limit (over 80%) for {cl.category}.
                    </p>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Recurring Expenses Section */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-white/10 space-y-6">
        <div>
          <h3 className="font-bold text-lg text-white light:text-slate-900 flex items-center gap-2">
            <RefreshCw className="w-5 h-5 text-[#ffb0cd] light:text-pink-600" />
            Recurring Expenses
          </h3>
          <p className="text-xs text-[#cbc3d7] light:text-slate-500">
            Automatically log repeated expenses (Daily, Weekly, Monthly) on schedule.
          </p>
        </div>

        {/* Form to Add Recurring Expense */}
        <form onSubmit={handleAddRecurring} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#cbc3d7] light:text-slate-600 mb-1">Expense Name</label>
              <input
                type="text"
                required
                value={recName}
                onChange={(e) => setRecName(e.target.value)}
                placeholder="e.g. Wifi Subscription"
                className="w-full bg-black/20 light:bg-slate-100 border border-white/10 light:border-slate-300 rounded-xl px-3 py-2 text-xs text-white light:text-slate-900 outline-none focus:border-[#d0bcff]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#cbc3d7] light:text-slate-600 mb-1">Amount ({currency})</label>
              <input
                type="number"
                step="any"
                required
                value={recAmount}
                onChange={(e) => setRecAmount(e.target.value)}
                placeholder="e.g. 499"
                className="w-full bg-black/20 light:bg-slate-100 border border-white/10 light:border-slate-300 rounded-xl px-3 py-2 text-xs text-white light:text-slate-900 outline-none focus:border-[#d0bcff]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#cbc3d7] light:text-slate-600 mb-1">Category</label>
              <select
                value={recCat}
                onChange={(e) => setRecCat(e.target.value)}
                className="w-full bg-black/20 light:bg-slate-100 border border-white/10 light:border-slate-300 rounded-xl px-3 py-2 text-xs text-white light:text-slate-900 outline-none focus:border-[#d0bcff]"
              >
                {['Food', 'Transportation', 'Education', 'Shopping', 'Entertainment', 'Personal', 'Mobile/Internet', 'Other'].map((cat) => (
                  <option key={cat} value={cat} className="bg-[#171f33] text-white">
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#cbc3d7] light:text-slate-600 mb-1">Frequency</label>
              <select
                value={recFreq}
                onChange={(e) => setRecFreq(e.target.value as any)}
                className="w-full bg-black/20 light:bg-slate-100 border border-white/10 light:border-slate-300 rounded-xl px-3 py-2 text-xs text-white light:text-slate-900 outline-none focus:border-[#d0bcff]"
              >
                <option value="daily" className="bg-[#171f33] text-white">Daily</option>
                <option value="weekly" className="bg-[#171f33] text-white">Weekly</option>
                <option value="monthly" className="bg-[#171f33] text-white">Monthly</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#cbc3d7] light:text-slate-600 mb-1">Start Date</label>
              <input
                type="date"
                required
                value={recStartDate}
                onChange={(e) => setRecStartDate(e.target.value)}
                className="w-full bg-black/20 light:bg-slate-100 border border-white/10 light:border-slate-300 rounded-xl px-3 py-2 text-xs text-white light:text-slate-900 outline-none focus:border-[#d0bcff]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#cbc3d7] light:text-slate-600 mb-1">Payment Method</label>
              <select
                value={recPayment}
                onChange={(e) => setRecPayment(e.target.value)}
                className="w-full bg-black/20 light:bg-slate-100 border border-white/10 light:border-slate-300 rounded-xl px-3 py-2 text-xs text-white light:text-slate-900 outline-none focus:border-[#d0bcff]"
              >
                {['UPI', 'Cash', 'Credit Card', 'Debit Card', 'Bank Transfer', 'Other'].map((pm) => (
                  <option key={pm} value={pm} className="bg-[#171f33] text-white">
                    {pm}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={addingRec}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#d0bcff] to-[#ffb0cd] text-[#3c0091] font-bold text-xs hover:opacity-90 transition-opacity cursor-pointer"
          >
            {addingRec ? 'Adding...' : '+ Add Recurring Expense'}
          </button>
        </form>

        {/* Existing Recurring Expenses List */}
        <div className="space-y-3 pt-4 border-t border-white/10">
          {recurringExpenses.length === 0 ? (
            <p className="text-xs text-[#cbc3d7] light:text-slate-500 text-center py-4">No recurring expenses configured.</p>
          ) : (
            recurringExpenses.map((rec) => (
              <div
                key={rec.recurring_id}
                className="p-4 rounded-2xl bg-white/5 light:bg-slate-100 border border-white/5 light:border-slate-200 flex items-center justify-between"
              >
                <div>
                  <h4 className="font-bold text-sm text-white light:text-slate-900">{rec.name}</h4>
                  <p className="text-xs text-[#cbc3d7] light:text-slate-600">
                    {rec.category} • <span className="capitalize font-semibold text-[#d0bcff] light:text-purple-700">{rec.frequency}</span> • Started {rec.start_date}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-extrabold text-sm text-white light:text-slate-900">
                    {formatCurrency(rec.amount, currency)}
                  </span>
                  <button
                    onClick={() => onDeleteRecurringExpense(rec.recurring_id)}
                    className="p-1.5 rounded-xl hover:bg-rose-500/20 text-rose-400 transition-colors cursor-pointer"
                    title="Delete recurring expense"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
