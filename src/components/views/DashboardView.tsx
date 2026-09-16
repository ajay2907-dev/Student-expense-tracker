import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  TrendingUp,
  Wallet,
  Calendar,
  Laptop,
  Coffee,
  BookOpen,
  ShoppingBag,
  ArrowRight,
  Plus,
  PieChart as PieIcon,
  CreditCard,
  Smartphone,
  Bus,
  Film,
  Zap,
  Lightbulb,
  DollarSign,
  Receipt,
  Layers,
  BarChart2,
  AlertCircle,
  TrendingDown
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis
} from 'recharts';
import { User, Expense, Budget, SavingsGoal, ActiveTab } from '../../types';
import { formatCurrency } from '../../lib/api';
import { getWeeklyDaysData } from '../../lib/dateUtils';
import { FinancialHealthInsightCard } from '../FinancialHealthInsightCard';

interface DashboardViewProps {
  user: User;
  expenses: Expense[];
  budgets: Budget[];
  savingsGoals: SavingsGoal[];
  setActiveTab: (tab: ActiveTab) => void;
  onOpenQuickAdd: () => void;
  onAddExpense?: (expense: Partial<Expense>) => Promise<void> | void;
  theme?: 'dark' | 'light';
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  user,
  expenses,
  budgets,
  savingsGoals,
  setActiveTab,
  onOpenQuickAdd,
  onAddExpense,
  theme = 'dark',
}) => {
  const isLight = theme === 'light';
  const currency = user.currency || '₹';
  const todayStr = new Date().toISOString().split('T')[0];

  // Quick Add Form State
  const [quickAmount, setQuickAmount] = useState<string>('');
  const [quickCategory, setQuickCategory] = useState<string>(user.default_category || 'Food');
  const [quickDesc, setQuickDesc] = useState<string>('');
  const [quickDate, setQuickDate] = useState<string>(todayStr);
  const [quickPayment, setQuickPayment] = useState<string>('UPI');
  const [isAdding, setIsAdding] = useState<boolean>(false);

  const handleQuickAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickAmount || Number(quickAmount) <= 0) return;

    setIsAdding(true);
    try {
      if (onAddExpense) {
        await onAddExpense({
          user_id: user.user_id,
          amount: Number(quickAmount),
          category: quickCategory,
          description: quickDesc.trim() || quickCategory,
          date: quickDate,
          payment_method: quickPayment,
        });
      }
      setQuickAmount('');
      setQuickDesc('');
      setQuickDate(todayStr);
    } catch (err) {
      console.error('Quick add failed:', err);
    } finally {
      setIsAdding(false);
    }
  };

  // 1. Monthly Metrics & Budget Rollover calculation
  const currentMonthStr = todayStr.substring(0, 7);
  const currentBudgetObj = budgets.find((b) => b.month === currentMonthStr);
  let baseBudget = currentBudgetObj ? currentBudgetObj.amount : 15000;

  // Calculate rollover if enabled
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

  const effectiveBudget = baseBudget + rolloverAmount;
  const currentMonthExpenses = expenses.filter((e) => e.date.startsWith(currentMonthStr));
  const currentMonthSpent = currentMonthExpenses.reduce((sum, e) => sum + e.amount, 0);
  const remainingBudget = effectiveBudget - currentMonthSpent;

  // 2. Today's Summary
  const todayExpenses = expenses.filter((e) => e.date === todayStr);
  const todaySpent = todayExpenses.reduce((sum, e) => sum + e.amount, 0);
  const todayCount = todayExpenses.length;

  // 3. Weekly Summary & Interactive Touch Selection
  const { weekData, totalWeekly, dailyAvg } = getWeeklyDaysData(expenses, currency);

  const [selectedWeeklyDayIndex, setSelectedWeeklyDayIndex] = useState<number>(() => {
    const todayIdx = weekData.findIndex((d) => d.isToday);
    return todayIdx !== -1 ? todayIdx : 0;
  });

  const selectedWeeklyDay = weekData[selectedWeeklyDayIndex] || weekData[0];

  // 4. Category breakdown
  const categoryTotals: Record<string, number> = {};
  expenses.forEach((e) => {
    categoryTotals[e.category] = (categoryTotals[e.category] || 0) + e.amount;
  });

  const categoryColors: Record<string, string> = {
    Food: '#ffb0cd',
    Transportation: '#4d8eff',
    Education: '#a078ff',
    Shopping: '#ffb4ab',
    Entertainment: '#adc6ff',
    Personal: '#d0bcff',
    'Mobile/Internet': '#ffd9e4',
    Other: '#cbc3d7',
  };

  const pieData = Object.entries(categoryTotals)
    .sort((a, b) => b[1] - a[1])
    .map(([name, value]) => ({
      name,
      value,
      color: categoryColors[name] || '#d0bcff',
    }));

  // Top 3 Categories
  const topCategories = pieData.slice(0, 3);

  // 5. Largest Expense
  let largestExpenseItem: Expense | null = null;
  if (expenses.length > 0) {
    largestExpenseItem = [...expenses].sort((a, b) => b.amount - a.amount)[0];
  }

  // 6. Overall Stats
  const totalMoneySpentAllTime = expenses.reduce((sum, e) => sum + e.amount, 0);
  const totalExpensesCount = expenses.length;
  const averageExpenseAmount = totalExpensesCount > 0 ? Math.round(totalMoneySpentAllTime / totalExpensesCount) : 0;

  // Previous Month Spent
  const prevMonthDate = new Date();
  prevMonthDate.setMonth(prevMonthDate.getMonth() - 1);
  const prevMonthStr = prevMonthDate.toISOString().substring(0, 7);
  const prevMonthExpenses = expenses.filter((e) => e.date.startsWith(prevMonthStr));
  const prevMonthSpent = prevMonthExpenses.reduce((sum, e) => sum + e.amount, 0);

  // Current Month Category Breakdown & Pacing for Financial Health Insight
  const currentMonthCategoryTotals: Record<string, number> = {};
  currentMonthExpenses.forEach((e) => {
    currentMonthCategoryTotals[e.category] = (currentMonthCategoryTotals[e.category] || 0) + e.amount;
  });

  const currentMonthCategoryBreakdown = Object.entries(currentMonthCategoryTotals)
    .sort((a, b) => b[1] - a[1])
    .map(([name, val]) => ({
      category: name,
      amount: val,
      percentage: currentMonthSpent > 0 ? (val / currentMonthSpent) * 100 : 0,
    }));

  const topMonthlyCategory =
    currentMonthCategoryBreakdown.length > 0 ? currentMonthCategoryBreakdown[0] : null;

  const now = new Date();
  const daysPassedInMonth = Math.max(1, now.getDate());
  const year = now.getFullYear();
  const monthIndex = now.getMonth();
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const dailyRunRate = Math.round(currentMonthSpent / daysPassedInMonth);
  const projectedMonthEndSpent = Math.round(dailyRunRate * daysInMonth);
  const budgetUtilizationPct = effectiveBudget > 0 ? (currentMonthSpent / effectiveBudget) * 100 : 0;

  // Most used category name
  const mostUsedCategory = pieData.length > 0 ? pieData[0].name : 'N/A';

  // 7. Smart Spending Insights Generator
  const generateInsights = () => {
    if (expenses.length === 0) return [];
    const list: string[] = [];

    // Highest category insight
    if (topCategories.length > 0) {
      list.push(`💡 ${topCategories[0].name} is your highest spending category overall (${formatCurrency(topCategories[0].value, currency)}).`);
    }

    // Month-over-month comparison
    if (prevMonthSpent > 0 && currentMonthSpent > 0) {
      const pctDiff = Math.round(((currentMonthSpent - prevMonthSpent) / prevMonthSpent) * 100);
      if (pctDiff > 0) {
        list.push(`💡 Your spending increased by ${pctDiff}% compared with last month (${formatCurrency(prevMonthSpent, currency)}).`);
      } else if (pctDiff < 0) {
        list.push(`💡 Great job! Your spending decreased by ${Math.abs(pctDiff)}% compared with last month.`);
      }
    }

    // Weekend vs Weekday analysis
    let weekendSpent = 0;
    let weekdaySpent = 0;
    expenses.forEach((e) => {
      const d = new Date(e.date + 'T00:00:00');
      const day = d.getDay();
      if (day === 0 || day === 6) {
        weekendSpent += e.amount;
      } else {
        weekdaySpent += e.amount;
      }
    });

    if (weekendSpent > 0 && weekdaySpent > 0) {
      if (weekendSpent > weekdaySpent) {
        list.push(`💡 You spend more on weekends (${formatCurrency(weekendSpent, currency)}) than weekdays.`);
      } else {
        list.push(`💡 Most of your expenses occur during weekdays (${formatCurrency(weekdaySpent, currency)}).`);
      }
    }

    // Budget proximity
    if (effectiveBudget > 0) {
      const budgetPct = (currentMonthSpent / effectiveBudget) * 100;
      if (budgetPct >= 80 && budgetPct < 100) {
        list.push(`💡 You are close to reaching your monthly budget (${budgetPct.toFixed(1)}% used).`);
      } else if (budgetPct >= 100) {
        list.push(`🚨 You have exceeded your monthly budget for ${currentMonthStr}!`);
      } else {
        list.push(`💡 You are currently within your monthly budget (${formatCurrency(remainingBudget, currency)} remaining).`);
      }
    }

    // Daily average insight
    const now = new Date();
    const dayNum = Math.max(1, now.getDate());
    const currentMonthDailyAvg = Math.round(currentMonthSpent / dayNum);
    list.push(`💡 Your average daily spending this month is ${formatCurrency(currentMonthDailyAvg, currency)}.`);

    return list;
  };

  const insights = generateInsights();

  // Category Icon Helper
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Food':
        return <Coffee className="w-5 h-5 text-amber-400" />;
      case 'Education':
        return <BookOpen className="w-5 h-5 text-indigo-400" />;
      case 'Transportation':
        return <Bus className="w-5 h-5 text-blue-400" />;
      case 'Shopping':
        return <ShoppingBag className="w-5 h-5 text-pink-400" />;
      case 'Entertainment':
        return <Film className="w-5 h-5 text-purple-400" />;
      case 'Mobile/Internet':
        return <Smartphone className="w-5 h-5 text-cyan-400" />;
      default:
        return <CreditCard className="w-5 h-5 text-emerald-400" />;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 glass-panel rounded-3xl p-6 bg-gradient-to-r from-[#d0bcff]/15 via-transparent to-[#ffb0cd]/15 border border-white/10">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white light:text-slate-900 tracking-tight">
            Welcome back, {user.name}! 👋
          </h1>
          <p className="text-xs sm:text-sm text-[#cbc3d7] light:text-slate-500 font-medium mt-1">
            Here's a real-time overview of your financial workspace.
          </p>
        </div>
        <button
          onClick={onOpenQuickAdd}
          className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-[#d0bcff] to-[#ffb0cd] text-[#3c0091] font-bold text-sm shadow-[0_0_15px_rgba(208,188,255,0.35)] hover:scale-105 transition-all flex items-center gap-2 active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Quick Add Expense</span>
        </button>
      </div>

      {/* Top 4 Summary Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Spent Current Month */}
        <motion.div
          whileHover={{ y: -3 }}
          whileTap={{ scale: 0.98 }}
          transition={{ type: 'spring', stiffness: 450, damping: 25 }}
          onClick={() => setActiveTab('analytics')}
          className="glass-panel glass-panel-hover rounded-2xl p-5 cursor-pointer group flex flex-col justify-between"
        >
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-bold text-[#cbc3d7] light:text-slate-500 uppercase tracking-wider">
              Total Spent (This Month)
            </span>
            <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-[#d0bcff] flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-extrabold text-white light:text-slate-900">
              {formatCurrency(currentMonthSpent, currency)}
            </h3>
            <p className="text-[11px] text-[#cbc3d7] light:text-slate-500 mt-1">
              {currentMonthExpenses.length} transactions in {currentMonthStr}
            </p>
          </div>
        </motion.div>

        {/* Budget & Remaining */}
        <motion.div
          whileHover={{ y: -3 }}
          whileTap={{ scale: 0.98 }}
          transition={{ type: 'spring', stiffness: 450, damping: 25 }}
          onClick={() => setActiveTab('budget')}
          className="glass-panel glass-panel-hover rounded-2xl p-5 cursor-pointer group flex flex-col justify-between"
        >
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-bold text-[#cbc3d7] light:text-slate-500 uppercase tracking-wider">
              Monthly Budget
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-extrabold text-white light:text-slate-900">
              {formatCurrency(remainingBudget, currency)}{' '}
              <span className="text-xs font-normal text-[#cbc3d7]">left</span>
            </h3>
            <div className="flex items-center justify-between text-[11px] text-[#cbc3d7] light:text-slate-500 mt-1">
              <span>Budget: {formatCurrency(effectiveBudget, currency)}</span>
              {rolloverAmount > 0 && (
                <span className="text-emerald-400 font-semibold">+₹{rolloverAmount} Rollover</span>
              )}
            </div>
          </div>
        </motion.div>

        {/* Today's Spending */}
        <motion.div
          whileHover={{ y: -3 }}
          transition={{ type: 'spring', stiffness: 450, damping: 25 }}
          className="glass-panel rounded-2xl p-5 flex flex-col justify-between"
        >
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-bold text-[#cbc3d7] light:text-slate-500 uppercase tracking-wider">
              Today's Spending
            </span>
            <div className="w-8 h-8 rounded-xl bg-[#ffb0cd]/20 text-[#ffb0cd] flex items-center justify-center">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-extrabold text-white light:text-slate-900">
              {formatCurrency(todaySpent, currency)}
            </h3>
            <p className="text-[11px] text-[#cbc3d7] light:text-slate-500 mt-1">
              Number of expenses today: <strong className="text-white light:text-slate-800">{todayCount}</strong>
            </p>
          </div>
        </motion.div>

        {/* Weekly Spending */}
        <motion.div
          whileHover={{ y: -3 }}
          transition={{ type: 'spring', stiffness: 450, damping: 25 }}
          className="glass-panel rounded-2xl p-5 flex flex-col justify-between"
        >
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-bold text-[#cbc3d7] light:text-slate-500 uppercase tracking-wider">
              This Week
            </span>
            <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
              <BarChart2 className="w-4 h-4" />
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-extrabold text-white light:text-slate-900">
              {formatCurrency(totalWeekly, currency)}
            </h3>
            <p className="text-[11px] text-[#cbc3d7] light:text-slate-500 mt-1">
              Daily Average: <strong className="text-white light:text-slate-800">{formatCurrency(dailyAvg, currency)}</strong>
            </p>
          </div>
        </motion.div>
      </div>

      {/* AI Financial Health Insight Card */}
      <FinancialHealthInsightCard
        user={user}
        currency={currency}
        currentMonthStr={currentMonthStr}
        currentMonthSpent={currentMonthSpent}
        effectiveBudget={effectiveBudget}
        remainingBudget={remainingBudget}
        budgetUtilizationPct={budgetUtilizationPct}
        daysPassedInMonth={daysPassedInMonth}
        daysInMonth={daysInMonth}
        dailyRunRate={dailyRunRate}
        projectedMonthEndSpent={projectedMonthEndSpent}
        categoryBreakdown={currentMonthCategoryBreakdown}
        topCategory={topMonthlyCategory}
        previousMonthSpent={prevMonthSpent}
        transactionCount={currentMonthExpenses.length}
      />

      {/* Grid Row 2: Charts (Spending Trend & Category Breakdown) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly Spending Bar Chart */}
        <div className="lg:col-span-2 glass-panel rounded-3xl p-5 sm:p-6 flex flex-col justify-between space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="font-bold text-lg text-white light:text-slate-900">Weekly Spending Summary</h3>
              <p className="text-xs text-[#cbc3d7] light:text-slate-500">Interactive touch breakdown across the current week</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-white/10 light:bg-purple-100 text-white light:text-purple-800">
                This Week: {formatCurrency(totalWeekly, currency)}
              </span>
            </div>
          </div>

          {/* Interactive Touch Day Selector Tabs */}
          <div className="pt-1 pb-1">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-semibold text-[#cbc3d7] light:text-slate-500">
                Tap day to view transactions & insights:
              </span>
              <span className="text-[11px] text-[#d0bcff] light:text-purple-700 font-bold">
                Daily Avg: {formatCurrency(dailyAvg, currency)}
              </span>
            </div>
            <div className="grid grid-cols-7 gap-1 sm:gap-2">
              {weekData.map((d, idx) => {
                const isSelected = idx === selectedWeeklyDayIndex;
                return (
                  <button
                    key={d.day}
                    type="button"
                    onClick={() => setSelectedWeeklyDayIndex(idx)}
                    className={`relative min-h-[50px] py-1.5 px-1 rounded-2xl flex flex-col items-center justify-center transition-all duration-200 select-none active:scale-95 touch-manipulation cursor-pointer ${
                      isSelected
                        ? 'bg-gradient-to-tr from-[#d0bcff] to-[#ffb0cd] text-[#3c0091] font-bold shadow-lg shadow-[#d0bcff]/25 ring-2 ring-[#d0bcff] light:ring-purple-600 scale-[1.03]'
                        : d.isToday
                        ? 'bg-white/10 light:bg-purple-50 text-white light:text-purple-900 border border-[#d0bcff]/50 light:border-purple-300 font-semibold'
                        : 'bg-white/5 light:bg-slate-100 hover:bg-white/10 light:hover:bg-slate-200 text-[#dae2fd] light:text-slate-700 border border-white/5 light:border-slate-200'
                    }`}
                  >
                    <span className="text-xs tracking-tight font-bold">{d.day}</span>
                    <span className="text-[10px] opacity-80">
                      {d.formattedDate ? d.formattedDate.split(' ')[1] : ''}
                    </span>
                    <div className="flex items-center gap-1 mt-0.5">
                      {d.amount > 0 ? (
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            isSelected ? 'bg-[#3c0091]' : 'bg-emerald-400 light:bg-emerald-600'
                          }`}
                        />
                      ) : (
                        <span className="w-1.5 h-1.5 opacity-0" />
                      )}
                    </div>
                    {d.isToday && !isSelected && (
                      <span className="absolute -top-1.5 px-1.5 py-0.2 bg-[#d0bcff] text-[#3c0091] text-[8px] font-black rounded-full shadow-xs">
                        TODAY
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Touch-Interactive Bar Chart */}
          <div className="w-full h-52 pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={weekData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                onClick={(state) => {
                  if (state && typeof state.activeTooltipIndex === 'number') {
                    setSelectedWeeklyDayIndex(state.activeTooltipIndex);
                  }
                }}
              >
                <XAxis
                  dataKey="day"
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
                  cursor={{ fill: isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.06)', radius: 8 }}
                  formatter={(val: number) => [formatCurrency(val, currency), 'Spent']}
                  contentStyle={{
                    backgroundColor: isLight ? '#ffffff' : '#171f33',
                    borderColor: isLight ? '#e2e8f0' : 'rgba(255,255,255,0.1)',
                    borderRadius: '12px',
                    color: isLight ? '#0f172a' : '#fff',
                    boxShadow: isLight ? '0 10px 25px rgba(0,0,0,0.08)' : '0 10px 25px rgba(0,0,0,0.5)',
                  }}
                />
                <Bar
                  dataKey="amount"
                  radius={[8, 8, 2, 2]}
                  className="cursor-pointer"
                >
                  {weekData.map((entry, index) => {
                    const isSelected = index === selectedWeeklyDayIndex;
                    let fill = isLight ? '#6366f1' : '#4d8eff';
                    if (isSelected) {
                      fill = isLight ? '#7c3aed' : '#d0bcff';
                    } else if (entry.isToday) {
                      fill = isLight ? '#8b5cf6' : '#a078ff';
                    }
                    const opacity = entry.amount > 0 ? (isSelected ? 1 : 0.8) : (isSelected ? 0.4 : 0.2);
                    return (
                      <Cell
                        key={`bar-${index}`}
                        fill={fill}
                        opacity={opacity}
                        stroke={isSelected ? (isLight ? '#5b21b6' : '#ffffff') : 'transparent'}
                        strokeWidth={isSelected ? 2 : 0}
                        className="transition-all duration-200 cursor-pointer"
                      />
                    );
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Interactive Selected Day Details Panel */}
          {selectedWeeklyDay && (
            <motion.div
              key={selectedWeeklyDay.dateStr}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.18 }}
              className="p-3.5 sm:p-4 rounded-2xl bg-white/5 light:bg-slate-50 border border-white/10 light:border-slate-200 space-y-2.5"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-white/10 light:border-slate-200">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-white light:text-slate-900">
                    {selectedWeeklyDay.fullDay}, {selectedWeeklyDay.formattedDate}
                  </span>
                  {selectedWeeklyDay.isToday && (
                    <span className="px-2 py-0.5 text-[10px] font-extrabold rounded-full bg-[#d0bcff]/20 text-[#d0bcff] light:bg-purple-100 light:text-purple-700">
                      Today
                    </span>
                  )}
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-base font-extrabold text-white light:text-slate-900">
                    {formatCurrency(selectedWeeklyDay.amount, currency)}
                  </span>
                  {totalWeekly > 0 && selectedWeeklyDay.amount > 0 && (
                    <span className="text-[11px] text-[#cbc3d7] light:text-slate-500 font-medium">
                      ({Math.round((selectedWeeklyDay.amount / totalWeekly) * 100)}% of week)
                    </span>
                  )}
                </div>
              </div>

              {/* Spending Comparison */}
              <div className="flex items-center justify-between text-xs text-[#cbc3d7] light:text-slate-600">
                <span>
                  {selectedWeeklyDay.amount === 0 ? (
                    <span className="text-slate-400 light:text-slate-500 font-medium">No expenses logged for this day</span>
                  ) : selectedWeeklyDay.amount > dailyAvg ? (
                    <span className="text-amber-400 light:text-amber-600 font-semibold">
                      ▲ {formatCurrency(selectedWeeklyDay.amount - dailyAvg, currency)} above daily average
                    </span>
                  ) : (
                    <span className="text-emerald-400 light:text-emerald-600 font-semibold">
                      ▼ {formatCurrency(dailyAvg - selectedWeeklyDay.amount, currency)} below daily average
                    </span>
                  )}
                </span>
                <span className="text-[11px] font-medium">
                  {selectedWeeklyDay.expenses.length} expense{selectedWeeklyDay.expenses.length === 1 ? '' : 's'}
                </span>
              </div>

              {/* Day transactions preview or quick add */}
              {selectedWeeklyDay.expenses.length > 0 ? (
                <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                  {selectedWeeklyDay.expenses.map((exp) => (
                    <div
                      key={exp.expense_id}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 light:bg-white border border-white/5 light:border-slate-200 text-xs shadow-xs"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span className="px-2 py-0.5 text-[10px] font-bold rounded-lg bg-white/10 light:bg-slate-100 text-[#dae2fd] light:text-slate-700 shrink-0">
                          {exp.category}
                        </span>
                        <span className="text-white light:text-slate-800 font-medium truncate">
                          {exp.description || exp.category}
                        </span>
                        <span className="text-[10px] text-[#cbc3d7] light:text-slate-400 shrink-0">
                          ({exp.payment_method})
                        </span>
                      </div>
                      <span className="font-extrabold text-white light:text-slate-900 shrink-0 ml-2">
                        {formatCurrency(exp.amount, currency)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="pt-1 flex items-center justify-between">
                  <p className="text-xs text-[#cbc3d7] light:text-slate-500">
                    Zero spending day. Great savings!
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setQuickDate(selectedWeeklyDay.dateStr);
                      onOpenQuickAdd();
                    }}
                    className="px-3.5 py-1.5 rounded-xl bg-white/10 light:bg-slate-200 hover:bg-white/20 text-xs font-bold text-white light:text-slate-800 transition-colors flex items-center gap-1.5 active:scale-95 touch-manipulation cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Log for {selectedWeeklyDay.day}</span>
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </div>

        {/* Category Breakdown Donut */}
        <div className="glass-panel rounded-3xl p-6 flex flex-col justify-between space-y-4">
          <h3 className="font-bold text-lg text-white light:text-slate-900">Category Breakdown</h3>

          {pieData.length > 0 ? (
            <div className="relative w-full h-48 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="transparent" />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val: number) => [formatCurrency(val, currency), 'Spent']}
                    contentStyle={{
                      backgroundColor: isLight ? '#ffffff' : '#171f33',
                      borderColor: isLight ? '#e2e8f0' : 'rgba(255,255,255,0.1)',
                      borderRadius: '12px',
                      color: isLight ? '#0f172a' : '#fff',
                      boxShadow: isLight ? '0 10px 25px rgba(0,0,0,0.08)' : '0 10px 25px rgba(0,0,0,0.5)',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute text-center pointer-events-none">
                <span className="text-[10px] uppercase font-bold text-[#cbc3d7] light:text-slate-500 block">Total</span>
                <span className="text-base font-extrabold text-white light:text-slate-900">{formatCurrency(totalMoneySpentAllTime, currency)}</span>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-xs text-[#cbc3d7] light:text-slate-500">No expenses recorded yet.</div>
          )}

          <div className="space-y-1.5 pt-2 border-t border-white/10 light:border-slate-200">
            {pieData.slice(0, 3).map((cat) => {
              const pct = totalMoneySpentAllTime > 0 ? Math.round((cat.value / totalMoneySpentAllTime) * 100) : 0;
              return (
                <div key={cat.name} className="flex items-center justify-between text-xs font-medium">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
                    <span className="text-white light:text-slate-700">{cat.name}</span>
                  </div>
                  <span className="text-[#cbc3d7] light:text-slate-500 font-semibold">{formatCurrency(cat.value, currency)} ({pct}%)</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Grid Row 3: Quick Add Expense Inline Form & Top Categories / Largest Expense */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Add Expense Form */}
        <div className="glass-panel rounded-3xl p-6 space-y-4 border border-[#d0bcff]/30 shadow-[0_0_20px_rgba(208,188,255,0.08)]">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-lg text-white light:text-slate-900 flex items-center gap-2">
              <Zap className="w-5 h-5 text-[#d0bcff]" />
              Quick Add Expense
            </h3>
            <span className="text-[11px] text-[#cbc3d7] font-semibold">Fast Input</span>
          </div>

          <form onSubmit={handleQuickAddSubmit} className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-[#cbc3d7] light:text-slate-600 mb-1 block">
                Amount ({currency})
              </label>
              <input
                type="number"
                step="any"
                required
                value={quickAmount}
                onChange={(e) => setQuickAmount(e.target.value)}
                placeholder="e.g. 250"
                className="w-full bg-white/5 light:bg-slate-100 border border-white/10 light:border-slate-200 rounded-xl px-3.5 py-2 text-sm text-white light:text-slate-900 outline-none focus:border-[#d0bcff]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-[#cbc3d7] light:text-slate-600 mb-1 block">
                  Category
                </label>
                <select
                  value={quickCategory}
                  onChange={(e) => setQuickCategory(e.target.value)}
                  className="w-full bg-white/5 light:bg-slate-100 border border-white/10 light:border-slate-200 rounded-xl px-3 py-2 text-xs text-white light:text-slate-900 outline-none focus:border-[#d0bcff]"
                >
                  {['Food', 'Transportation', 'Education', 'Shopping', 'Entertainment', 'Personal', 'Mobile/Internet', 'Other'].map((cat) => (
                    <option key={cat} value={cat} className="bg-[#171f33] text-white">
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#cbc3d7] light:text-slate-600 mb-1 block">
                  Date
                </label>
                <input
                  type="date"
                  required
                  value={quickDate}
                  onChange={(e) => setQuickDate(e.target.value)}
                  className="w-full bg-white/5 light:bg-slate-100 border border-white/10 light:border-slate-200 rounded-xl px-2.5 py-2 text-xs text-white light:text-slate-900 outline-none focus:border-[#d0bcff]"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-[#cbc3d7] light:text-slate-600 mb-1 block">
                Description
              </label>
              <input
                type="text"
                value={quickDesc}
                onChange={(e) => setQuickDesc(e.target.value)}
                placeholder="e.g. Lunch with friends"
                className="w-full bg-white/5 light:bg-slate-100 border border-white/10 light:border-slate-200 rounded-xl px-3.5 py-2 text-xs text-white light:text-slate-900 outline-none focus:border-[#d0bcff]"
              />
            </div>

            <button
              type="submit"
              disabled={isAdding}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#d0bcff] to-[#ffb0cd] text-[#3c0091] font-bold text-sm hover:opacity-90 transition-opacity active:scale-98 disabled:opacity-50 mt-1"
            >
              {isAdding ? 'Adding...' : '[ + Add Expense ]'}
            </button>
          </form>
        </div>

        {/* Top Spending Categories Card */}
        <div className="glass-panel rounded-3xl p-6 flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-lg text-white light:text-slate-900">Top Spending Categories</h3>
            <span className="text-xs font-semibold text-[#cbc3d7]">Ranked</span>
          </div>

          <div className="space-y-3 flex-1 flex flex-col justify-center">
            {topCategories.length === 0 ? (
              <p className="text-xs text-[#cbc3d7] text-center py-6">No spending categories recorded yet.</p>
            ) : (
              topCategories.map((cat, idx) => (
                <div
                  key={cat.name}
                  className="p-3.5 rounded-2xl bg-white/5 light:bg-slate-100 border border-white/5 light:border-slate-200 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-[#d0bcff]/20 text-[#d0bcff] font-bold text-xs flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <div>
                      <h4 className="font-bold text-sm text-white light:text-slate-800">{cat.name}</h4>
                      <p className="text-[10px] text-[#cbc3d7]">Category Total</p>
                    </div>
                  </div>
                  <span className="font-extrabold text-sm text-[#d0bcff]">
                    {formatCurrency(cat.value, currency)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Largest Expense Card */}
        <div className="glass-panel rounded-3xl p-6 flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-lg text-white light:text-slate-900">Largest Expense</h3>
            <span className="text-xs font-semibold text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20">
              Peak
            </span>
          </div>

          {largestExpenseItem ? (
            <div className="p-5 rounded-2xl bg-white/5 light:bg-slate-100 border border-white/10 flex flex-col justify-center space-y-3 my-auto">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                  {getCategoryIcon(largestExpenseItem.category)}
                </div>
                <div>
                  <p className="text-3xl font-extrabold text-white light:text-slate-900">
                    {formatCurrency(largestExpenseItem.amount, currency)}
                  </p>
                  <p className="text-xs font-bold text-[#d0bcff]">{largestExpenseItem.category}</p>
                </div>
              </div>
              <div className="pt-2 border-t border-white/10 text-xs text-[#cbc3d7] space-y-0.5">
                <p className="font-medium text-white light:text-slate-800 truncate">
                  Description: {largestExpenseItem.description || 'N/A'}
                </p>
                <p>Date: {largestExpenseItem.date} • Method: {largestExpenseItem.payment_method}</p>
              </div>
            </div>
          ) : (
            <p className="text-xs text-[#cbc3d7] text-center py-10">No expenses recorded yet.</p>
          )}
        </div>
      </div>

      {/* Grid Row 4: Smart Spending Insights & Financial Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Smart Spending Insights Card */}
        <div className="glass-panel rounded-3xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-lg text-white light:text-slate-900 flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-amber-300 animate-pulse" />
              Smart Spending Insights
            </h3>
            <span className="text-xs font-semibold text-[#d0bcff]">AI Analytics</span>
          </div>

          <div className="space-y-2.5">
            {insights.length === 0 ? (
              <p className="text-xs text-[#cbc3d7] py-6 text-center">
                Add more expenses to generate smart spending insights.
              </p>
            ) : (
              insights.map((insight, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-2xl bg-white/5 light:bg-slate-100 border border-white/5 light:border-slate-200 text-xs font-medium text-white light:text-slate-800 leading-relaxed flex items-start gap-2.5"
                >
                  <span className="mt-0.5">{insight}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Financial Summary Card */}
        <div className="glass-panel rounded-3xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-lg text-white light:text-slate-900 flex items-center gap-2">
              <Receipt className="w-5 h-5 text-[#d0bcff]" />
              Financial Summary
            </h3>
            <span className="text-xs font-semibold text-[#cbc3d7]">Overview</span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-2xl bg-white/5 light:bg-slate-100 border border-white/5">
              <p className="text-[#cbc3d7] font-medium">Total Money Spent</p>
              <p className="font-extrabold text-sm text-white light:text-slate-900 mt-1">
                {formatCurrency(totalMoneySpentAllTime, currency)}
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-white/5 light:bg-slate-100 border border-white/5">
              <p className="text-[#cbc3d7] font-medium">Total Expenses</p>
              <p className="font-extrabold text-sm text-white light:text-slate-900 mt-1">
                {totalExpensesCount}
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-white/5 light:bg-slate-100 border border-white/5">
              <p className="text-[#cbc3d7] font-medium">Average Expense</p>
              <p className="font-extrabold text-sm text-white light:text-slate-900 mt-1">
                {formatCurrency(averageExpenseAmount, currency)}
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-white/5 light:bg-slate-100 border border-white/5">
              <p className="text-[#cbc3d7] font-medium">Most Used Category</p>
              <p className="font-extrabold text-sm text-[#d0bcff] mt-1 truncate">
                {mostUsedCategory}
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-white/5 light:bg-slate-100 border border-white/5">
              <p className="text-[#cbc3d7] font-medium">Current Month</p>
              <p className="font-extrabold text-sm text-white light:text-slate-900 mt-1">
                {formatCurrency(currentMonthSpent, currency)}
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-white/5 light:bg-slate-100 border border-white/5">
              <p className="text-[#cbc3d7] font-medium">Previous Month</p>
              <p className="font-extrabold text-sm text-white light:text-slate-900 mt-1">
                {formatCurrency(prevMonthSpent, currency)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Grid Row 5: Recent Expenses Table */}
      <div className="glass-panel rounded-3xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-lg text-white light:text-slate-900">Recent Transactions</h3>
          <button
            onClick={() => setActiveTab('expense_history')}
            className="text-xs font-bold text-[#d0bcff] light:text-purple-600 hover:underline flex items-center gap-1"
          >
            View Expense History <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {expenses.length === 0 ? (
          <div className="text-center py-12 space-y-3">
            <Coffee className="w-12 h-12 text-[#cbc3d7]/40 mx-auto" />
            <p className="text-sm font-semibold text-white light:text-slate-800">📊 No expense data yet.</p>
            <p className="text-xs text-[#cbc3d7]">Add your first expense to start tracking your spending.</p>
            <button
              onClick={onOpenQuickAdd}
              className="px-5 py-2.5 rounded-2xl bg-[#d0bcff] text-[#3c0091] font-bold text-xs"
            >
              + Add First Expense
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/10 light:border-slate-200 text-[#cbc3d7] uppercase tracking-wider font-bold">
                  <th className="pb-3 px-2">Category</th>
                  <th className="pb-3 px-2">Description</th>
                  <th className="pb-3 px-2">Date</th>
                  <th className="pb-3 px-2">Payment</th>
                  <th className="pb-3 px-2 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 light:divide-slate-100">
                {expenses.slice(0, 6).map((exp) => (
                  <tr key={exp.expense_id} className="hover:bg-white/5 transition-colors">
                    <td className="py-3 px-2 font-semibold text-white light:text-slate-800 flex items-center gap-2">
                      <span className="p-1.5 rounded-lg bg-white/10">{getCategoryIcon(exp.category)}</span>
                      {exp.category}
                    </td>
                    <td className="py-3 px-2 text-white light:text-slate-800 max-w-[200px] truncate">
                      {exp.description || exp.category}
                    </td>
                    <td className="py-3 px-2 text-[#cbc3d7]">{exp.date}</td>
                    <td className="py-3 px-2 text-[#cbc3d7]">
                      <span className="px-2 py-0.5 rounded-md bg-white/10 text-[10px] font-semibold">
                        {exp.payment_method}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-right font-bold text-white light:text-slate-900">
                      -{formatCurrency(exp.amount, currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
