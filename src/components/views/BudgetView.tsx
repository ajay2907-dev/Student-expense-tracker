import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ReferenceLine,
} from 'recharts';
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
  Calendar,
  TrendingUp,
  Sparkles,
  Zap,
  ArrowUpRight,
  Info,
  CalendarClock,
  PieChart as PieIcon,
  Check
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
  theme?: 'dark' | 'light';
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
  theme = 'dark',
}) => {
  const isLight = theme === 'light';
  const currency = user.currency || '₹';
  const currentMonthStr = new Date().toISOString().substring(0, 7); // YYYY-MM
  const todayStr = new Date().toISOString().split('T')[0];

  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthStr);

  const budgetObj = budgets.find((b) => b.month === selectedMonth);
  const currentBudgetAmount = budgetObj ? budgetObj.amount : 15000;

  const [inputBudget, setInputBudget] = useState<string>(currentBudgetAmount.toString());
  const [loading, setLoading] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Predictive Forecasting State
  const [forecastingEnabled, setForecastingEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem('student_predictive_forecasting');
    return saved !== null ? saved === 'true' : true;
  });
  const [forecastHorizon, setForecastHorizon] = useState<3 | 6 | 12>(6);
  const [spendScenario, setSpendScenario] = useState<'lean' | 'baseline' | 'conservative'>('baseline');

  const toggleForecasting = () => {
    setForecastingEnabled((prev) => {
      const next = !prev;
      localStorage.setItem('student_predictive_forecasting', String(next));
      return next;
    });
  };

  // Convert each recurring frequency to a normalized monthly burden
  const getNormalizedMonthlyAmount = (rec: RecurringExpense): number => {
    if (rec.frequency === 'daily') return rec.amount * 30.42;
    if (rec.frequency === 'weekly') return rec.amount * 4.333;
    return rec.amount;
  };

  const totalMonthlyRecurring = Math.round(
    recurringExpenses.reduce((sum, rec) => sum + getNormalizedMonthlyAmount(rec), 0)
  );

  // Group recurring count by frequency
  const dailyRecCount = recurringExpenses.filter((r) => r.frequency === 'daily').length;
  const weeklyRecCount = recurringExpenses.filter((r) => r.frequency === 'weekly').length;
  const monthlyRecCount = recurringExpenses.filter((r) => r.frequency === 'monthly').length;

  // Discretionary baseline calculation from past months
  const pastMonths = Array.from(
    new Set(expenses.map((e) => e.date.substring(0, 7)))
  ).filter((m) => m <= currentMonthStr).sort().reverse().slice(0, 3);

  let pastMonthlyAvgTotal = 0;
  if (pastMonths.length > 0) {
    const pastSum = expenses
      .filter((e) => pastMonths.includes(e.date.substring(0, 7)))
      .reduce((s, e) => s + e.amount, 0);
    pastMonthlyAvgTotal = pastSum / pastMonths.length;
  } else {
    pastMonthlyAvgTotal = currentBudgetAmount * 0.75;
  }

  // Baseline discretionary = total average minus fixed recurring
  const rawDiscretionary = Math.max(0, pastMonthlyAvgTotal - totalMonthlyRecurring);
  const baselineDiscretionary = rawDiscretionary > 0 ? rawDiscretionary : Math.round(currentBudgetAmount * 0.45);

  const scenarioMultiplier = spendScenario === 'lean' ? 0.85 : spendScenario === 'conservative' ? 1.15 : 1.0;
  const projectedDiscretionary = Math.round(baselineDiscretionary * scenarioMultiplier);
  const projectedMonthlyTotal = totalMonthlyRecurring + projectedDiscretionary;
  const projectedMonthlySurplus = currentBudgetAmount - projectedMonthlyTotal;
  const recurringBurdenPct = currentBudgetAmount > 0 ? (totalMonthlyRecurring / currentBudgetAmount) * 100 : 0;
  const totalProjectedPct = currentBudgetAmount > 0 ? (projectedMonthlyTotal / currentBudgetAmount) * 100 : 0;

  // Multi-Month Forecast Data for Recharts
  const currentDate = new Date();
  const futureMonthsData = [];
  for (let i = 1; i <= forecastHorizon; i++) {
    const d = new Date(currentDate.getFullYear(), currentDate.getMonth() + i, 1);
    const monthKey = d.toISOString().substring(0, 7);
    const monthLabel = d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    
    // Check if user set a specific budget for that future month
    const existingBudget = budgets.find((b) => b.month === monthKey);
    const monthBudget = existingBudget ? existingBudget.amount : currentBudgetAmount;

    const recurringVal = totalMonthlyRecurring;
    const discretionaryVal = projectedDiscretionary;
    const totalVal = recurringVal + discretionaryVal;
    const surplusVal = monthBudget - totalVal;

    futureMonthsData.push({
      monthKey,
      monthLabel,
      recurring: recurringVal,
      discretionary: discretionaryVal,
      total: totalVal,
      budget: monthBudget,
      surplus: surplusVal,
      isDeficit: surplusVal < 0,
    });
  }

  // Group recurring items by category
  const recurringByCategory: Record<string, { total: number; items: RecurringExpense[] }> = {};
  recurringExpenses.forEach((rec) => {
    const amt = getNormalizedMonthlyAmount(rec);
    if (!recurringByCategory[rec.category]) {
      recurringByCategory[rec.category] = { total: 0, items: [] };
    }
    recurringByCategory[rec.category].total += amt;
    recurringByCategory[rec.category].items.push(rec);
  });

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

      {/* Predictive Spending Forecast Section */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-white/10 space-y-6">
        {/* Header & Toggle */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#d0bcff] to-[#adc6ff] flex items-center justify-center text-[#3c0091] font-bold shrink-0 shadow-sm">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold text-lg text-white light:text-slate-900">Predictive Spending Forecast</h3>
                <span className="px-2 py-0.5 text-[10px] font-extrabold rounded-full bg-[#d0bcff]/20 text-[#d0bcff] light:bg-purple-100 light:text-purple-800 border border-[#d0bcff]/30 light:border-purple-200 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Recurring Obligations Extrapolator
                </span>
              </div>
              <p className="text-xs text-[#cbc3d7] light:text-slate-500">
                Projects future monthly outflows by compounding recurring expenses and discretionary baseline habits.
              </p>
            </div>
          </div>

          {/* Toggle Switch */}
          <div className="flex items-center gap-3 self-end sm:self-center">
            <span className="text-xs font-semibold text-[#cbc3d7] light:text-slate-600">
              Forecasting <strong className={forecastingEnabled ? 'text-emerald-400 light:text-emerald-700' : 'text-slate-400'}>{forecastingEnabled ? 'ON' : 'OFF'}</strong>
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={forecastingEnabled}
              onClick={toggleForecasting}
              className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors cursor-pointer focus:outline-none ${
                forecastingEnabled ? 'bg-[#d0bcff] light:bg-[#7c3aed]' : 'bg-white/15 light:bg-slate-300'
              }`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white light:bg-white transition-transform duration-200 shadow-md ${
                  forecastingEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Content Animated Display */}
        <AnimatePresence mode="wait">
          {!forecastingEnabled ? (
            <motion.div
              key="forecast-disabled"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="p-6 rounded-2xl bg-white/5 light:bg-slate-50 border border-white/5 light:border-slate-200 text-center space-y-3"
            >
              <div className="w-12 h-12 mx-auto rounded-2xl bg-white/10 light:bg-slate-200 flex items-center justify-center text-[#cbc3d7] light:text-slate-600">
                <CalendarClock className="w-6 h-6" />
              </div>
              <h4 className="text-base font-bold text-white light:text-slate-900">
                Predictive Forecasting is Currently Disabled
              </h4>
              <p className="text-xs text-[#cbc3d7] light:text-slate-600 max-w-lg mx-auto leading-relaxed">
                Enable predictive forecasting to extrapolate your {recurringExpenses.length} recurring expenses (daily, weekly, and monthly) across upcoming months, simulate discretionary scenarios, and inspect whether your base monthly budget can safely sustain future commitments.
              </p>
              <button
                type="button"
                onClick={toggleForecasting}
                className="mt-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#d0bcff] to-[#ffb0cd] text-[#3c0091] font-bold text-xs shadow-md hover:shadow-lg transition-all cursor-pointer inline-flex items-center gap-2 active:scale-95"
              >
                <TrendingUp className="w-4 h-4" />
                <span>Turn On Predictive Forecasting</span>
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="forecast-enabled"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
              className="space-y-6"
            >
              {/* Summary Metric Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 rounded-2xl bg-white/5 light:bg-slate-100 border border-white/5 light:border-slate-200 space-y-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#cbc3d7] light:text-slate-500 block">
                    Committed Recurring
                  </span>
                  <div className="text-xl font-extrabold text-[#d0bcff] light:text-purple-700">
                    {formatCurrency(totalMonthlyRecurring, currency)}
                    <span className="text-xs font-normal text-[#cbc3d7] light:text-slate-500"> / mo</span>
                  </div>
                  <p className="text-[11px] text-[#cbc3d7] light:text-slate-600">
                    {recurringExpenses.length} item{recurringExpenses.length === 1 ? '' : 's'} ({dailyRecCount}d, {weeklyRecCount}w, {monthlyRecCount}m)
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-white/5 light:bg-slate-100 border border-white/5 light:border-slate-200 space-y-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#cbc3d7] light:text-slate-500 block">
                    Est. Discretionary
                  </span>
                  <div className="text-xl font-extrabold text-[#adc6ff] light:text-blue-700">
                    {formatCurrency(projectedDiscretionary, currency)}
                    <span className="text-xs font-normal text-[#cbc3d7] light:text-slate-500"> / mo</span>
                  </div>
                  <p className="text-[11px] text-[#cbc3d7] light:text-slate-600 capitalize">
                    {spendScenario} spending model
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-white/5 light:bg-slate-100 border border-white/5 light:border-slate-200 space-y-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#cbc3d7] light:text-slate-500 block">
                    Projected Total Outflow
                  </span>
                  <div className="text-xl font-extrabold text-white light:text-slate-900">
                    {formatCurrency(projectedMonthlyTotal, currency)}
                    <span className="text-xs font-normal text-[#cbc3d7] light:text-slate-500"> / mo</span>
                  </div>
                  <p className="text-[11px] text-[#cbc3d7] light:text-slate-600">
                    {totalProjectedPct.toFixed(1)}% of base budget ({formatCurrency(currentBudgetAmount, currency)})
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-white/5 light:bg-slate-100 border border-white/5 light:border-slate-200 space-y-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#cbc3d7] light:text-slate-500 block">
                    Projected Net Margin
                  </span>
                  <div className={`text-xl font-extrabold ${projectedMonthlySurplus >= 0 ? 'text-emerald-400 light:text-emerald-600' : 'text-rose-400 light:text-rose-600'}`}>
                    {projectedMonthlySurplus >= 0 ? '+' : ''}{formatCurrency(projectedMonthlySurplus, currency)}
                    <span className="text-xs font-normal text-[#cbc3d7] light:text-slate-500"> / mo</span>
                  </div>
                  <div className="flex items-center gap-1.5 pt-0.5">
                    <span className={`inline-block w-2 h-2 rounded-full ${projectedMonthlySurplus >= 0 ? 'bg-emerald-400' : 'bg-rose-500'}`} />
                    <span className="text-[10px] font-extrabold uppercase tracking-wide text-[#cbc3d7] light:text-slate-600">
                      {projectedMonthlySurplus >= 0 ? 'Budget Surplus' : 'Projected Deficit'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Scenario & Horizon Controls Bar */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-white/5 light:bg-slate-100 border border-white/5 light:border-slate-200">
                {/* Horizon Selector */}
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-[#cbc3d7] light:text-slate-600 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" /> Horizon:
                  </span>
                  <div className="flex items-center gap-1 bg-black/20 light:bg-slate-200 p-1 rounded-xl">
                    {([3, 6, 12] as const).map((h) => (
                      <button
                        key={h}
                        type="button"
                        onClick={() => setForecastHorizon(h)}
                        className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                          forecastHorizon === h
                            ? 'bg-[#d0bcff] text-[#3c0091] shadow-sm'
                            : 'text-[#cbc3d7] light:text-slate-700 hover:text-white'
                        }`}
                      >
                        {h} Months
                      </button>
                    ))}
                  </div>
                </div>

                {/* Scenario Selector */}
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-[#cbc3d7] light:text-slate-600 flex items-center gap-1">
                    <Sliders className="w-3.5 h-3.5" /> Habit Scenario:
                  </span>
                  <div className="flex items-center gap-1 bg-black/20 light:bg-slate-200 p-1 rounded-xl">
                    {(
                      [
                        { id: 'lean', label: 'Lean (-15%)' },
                        { id: 'baseline', label: 'Baseline' },
                        { id: 'conservative', label: 'Safety (+15%)' },
                      ] as const
                    ).map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => setSpendScenario(s.id)}
                        className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                          spendScenario === s.id
                            ? 'bg-[#d0bcff] text-[#3c0091] shadow-sm'
                            : 'text-[#cbc3d7] light:text-slate-700 hover:text-white'
                        }`}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Multi-Month Projected Spend Bar Chart */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#cbc3d7] light:text-slate-600 flex items-center gap-1.5">
                    <span>Projected Monthly Spend Timeline vs Budget</span>
                  </h4>
                  <span className="text-[11px] text-[#cbc3d7] light:text-slate-500">
                    Dashed line = Monthly Budget Limit ({formatCurrency(currentBudgetAmount, currency)})
                  </span>
                </div>

                <div className="w-full h-64 bg-black/10 light:bg-slate-50 rounded-2xl p-3 border border-white/5 light:border-slate-200">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={futureMonthsData}
                      margin={{ top: 20, right: 15, left: -10, bottom: 5 }}
                    >
                      <XAxis
                        dataKey="monthLabel"
                        stroke={isLight ? '#64748b' : '#cbc3d7'}
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        stroke={isLight ? '#64748b' : '#cbc3d7'}
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(v) => (v >= 1000 ? `${v / 1000}k` : v)}
                      />
                      <Tooltip
                        content={({ active, payload, label }) => {
                          if (!active || !payload || !payload.length) return null;
                          const data = payload[0]?.payload;
                          if (!data) return null;
                          return (
                            <div className="p-3 rounded-xl bg-slate-900/95 light:bg-white text-white light:text-slate-900 border border-white/20 light:border-slate-200 shadow-xl text-xs space-y-1.5 min-w-44">
                              <p className="font-bold text-sm border-b border-white/10 light:border-slate-200 pb-1">
                                {label} Forecast
                              </p>
                              <div className="flex justify-between items-center text-[#d0bcff] light:text-purple-700">
                                <span>Fixed Recurring:</span>
                                <span className="font-bold">{formatCurrency(data.recurring, currency)}</span>
                              </div>
                              <div className="flex justify-between items-center text-[#adc6ff] light:text-blue-700">
                                <span>Est. Discretionary:</span>
                                <span className="font-bold">{formatCurrency(data.discretionary, currency)}</span>
                              </div>
                              <div className="flex justify-between items-center font-extrabold border-t border-white/10 light:border-slate-200 pt-1">
                                <span>Total Projected:</span>
                                <span>{formatCurrency(data.total, currency)}</span>
                              </div>
                              <div className="flex justify-between items-center text-[11px] text-[#cbc3d7] light:text-slate-500">
                                <span>Budget Limit:</span>
                                <span>{formatCurrency(data.budget, currency)}</span>
                              </div>
                              <div
                                className={`text-[11px] font-bold pt-0.5 ${
                                  data.surplus >= 0 ? 'text-emerald-400 light:text-emerald-600' : 'text-rose-400 light:text-rose-600'
                                }`}
                              >
                                {data.surplus >= 0
                                  ? `+${formatCurrency(data.surplus, currency)} Buffer`
                                  : `${formatCurrency(Math.abs(data.surplus), currency)} Over Budget`}
                              </div>
                            </div>
                          );
                        }}
                      />
                      <Legend
                        wrapperStyle={{ paddingTop: 8, fontSize: '11px' }}
                      />
                      <ReferenceLine
                        y={currentBudgetAmount}
                        stroke="#ffb0cd"
                        strokeDasharray="4 4"
                        strokeWidth={2}
                        label={{
                          value: `Limit (${currency}${currentBudgetAmount})`,
                          position: 'top',
                          fill: isLight ? '#be185d' : '#ffb0cd',
                          fontSize: 10,
                          fontWeight: 'bold',
                        }}
                      />
                      <Bar
                        dataKey="recurring"
                        name="Committed Recurring"
                        stackId="spend"
                        fill={isLight ? '#7c3aed' : '#d0bcff'}
                        radius={[0, 0, 4, 4]}
                      />
                      <Bar
                        dataKey="discretionary"
                        name="Est. Discretionary"
                        stackId="spend"
                        fill={isLight ? '#3b82f6' : '#adc6ff'}
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Two Column Section: Recurring Burden by Category + Predictive Insights */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                {/* Left Column: Recurring Breakdown */}
                <div className="p-4 rounded-2xl bg-white/5 light:bg-slate-100 border border-white/5 light:border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <h5 className="font-bold text-sm text-white light:text-slate-900 flex items-center gap-2">
                      <PieIcon className="w-4 h-4 text-[#d0bcff] light:text-purple-700" />
                      Recurring Burden by Category
                    </h5>
                    <span className="text-[11px] font-extrabold text-[#d0bcff] light:text-purple-700">
                      {recurringBurdenPct.toFixed(0)}% of Budget
                    </span>
                  </div>

                  {recurringExpenses.length === 0 ? (
                    <div className="text-center py-5 space-y-2">
                      <p className="text-xs text-[#cbc3d7] light:text-slate-500">
                        No recurring expenses added yet.
                      </p>
                      <p className="text-[11px] text-[#cbc3d7] light:text-slate-500">
                        Add subscriptions, tuition fees, or meal plans below to populate predictive commitments.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {Object.entries(recurringByCategory).map(([cat, info]) => {
                        const catShareOfBudget = currentBudgetAmount > 0 ? (info.total / currentBudgetAmount) * 100 : 0;
                        return (
                          <div key={cat} className="space-y-1">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-semibold text-white light:text-slate-900">{cat}</span>
                              <span className="text-[#cbc3d7] light:text-slate-600 font-bold">
                                {formatCurrency(Math.round(info.total), currency)} / mo ({catShareOfBudget.toFixed(0)}%)
                              </span>
                            </div>
                            <div className="w-full h-1.5 bg-white/10 light:bg-slate-200 rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full bg-gradient-to-r from-[#d0bcff] to-[#adc6ff]"
                                style={{ width: `${Math.min(100, catShareOfBudget)}%` }}
                              />
                            </div>
                            <div className="text-[10px] text-[#cbc3d7] light:text-slate-500 flex items-center gap-1.5 flex-wrap">
                              {info.items.map((item) => (
                                <span
                                  key={item.recurring_id}
                                  className="px-1.5 py-0.5 rounded bg-white/5 light:bg-slate-200 text-white/80 light:text-slate-700"
                                >
                                  {item.name} ({formatCurrency(item.amount, currency)}/{item.frequency === 'daily' ? 'd' : item.frequency === 'weekly' ? 'w' : 'm'})
                                </span>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Right Column: Predictive Advisory & Insights */}
                <div className="p-4 rounded-2xl bg-white/5 light:bg-slate-100 border border-white/5 light:border-slate-200 space-y-3 flex flex-col justify-between">
                  <div>
                    <h5 className="font-bold text-sm text-white light:text-slate-900 flex items-center gap-2">
                      <Zap className="w-4 h-4 text-amber-400" />
                      Forecast Insights & Feasibility
                    </h5>

                    <div className="space-y-2.5 mt-3">
                      {recurringBurdenPct >= 100 ? (
                        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-start gap-2.5">
                          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                          <div>
                            <strong className="block font-bold">Deficit Warning: Fixed Overhang</strong>
                            Your recurring commitments alone ({formatCurrency(totalMonthlyRecurring, currency)}) exceed your entire monthly budget ({formatCurrency(currentBudgetAmount, currency)}). Consider reviewing active subscriptions below.
                          </div>
                        </div>
                      ) : projectedMonthlySurplus < 0 ? (
                        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs flex items-start gap-2.5">
                          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                          <div>
                            <strong className="block font-bold">Projected Budget Shortfall</strong>
                            Under the {spendScenario} scenario, estimated monthly spend ({formatCurrency(projectedMonthlyTotal, currency)}) exceeds your budget by {formatCurrency(Math.abs(projectedMonthlySurplus), currency)}.
                          </div>
                        </div>
                      ) : (
                        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-start gap-2.5">
                          <Check className="w-4 h-4 shrink-0 mt-0.5" />
                          <div>
                            <strong className="block font-bold">Budget Feasibility Confirmed</strong>
                            Your recurring obligations tie up {recurringBurdenPct.toFixed(0)}% of your budget, leaving a healthy discretionary buffer of {formatCurrency(currentBudgetAmount - totalMonthlyRecurring, currency)} each month.
                          </div>
                        </div>
                      )}

                      <div className="p-3 rounded-xl bg-white/5 light:bg-slate-200/60 border border-white/5 light:border-slate-300 text-xs text-[#cbc3d7] light:text-slate-700 space-y-1.5">
                        <div className="flex items-center gap-1.5 font-bold text-white light:text-slate-900">
                          <Sparkles className="w-3.5 h-3.5 text-[#d0bcff] light:text-purple-700" />
                          <span>{forecastHorizon}-Month Cumulative Outlook:</span>
                        </div>
                        <p className="leading-relaxed">
                          Over the next {forecastHorizon} months, fixed recurring commitments will total approximately{' '}
                          <strong className="text-white light:text-slate-900">
                            {formatCurrency(totalMonthlyRecurring * forecastHorizon, currency)}
                          </strong>
                          . Total projected spending across all categories is estimated at{' '}
                          <strong className="text-white light:text-slate-900">
                            {formatCurrency(projectedMonthlyTotal * forecastHorizon, currency)}
                          </strong>
                          {projectedMonthlySurplus >= 0 ? (
                            <>
                              , building an estimated cumulative reserve of{' '}
                              <strong className="text-emerald-400 light:text-emerald-700">
                                {formatCurrency(projectedMonthlySurplus * forecastHorizon, currency)}
                              </strong>
                              .
                            </>
                          ) : (
                            <>
                              , requiring an additional budget buffer of{' '}
                              <strong className="text-rose-400 light:text-rose-700">
                                {formatCurrency(Math.abs(projectedMonthlySurplus) * forecastHorizon, currency)}
                              </strong>
                              .
                            </>
                          )}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-white/5 light:border-slate-200 flex items-center justify-between text-[11px] text-[#cbc3d7] light:text-slate-500">
                    <span>Recurring updates reflect instantly</span>
                    <span className="font-semibold text-[#d0bcff] light:text-purple-700">Live Model</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
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
