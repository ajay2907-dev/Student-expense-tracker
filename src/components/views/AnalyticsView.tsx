import React, { useState } from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  LineChart,
  Line,
  CartesianGrid
} from 'recharts';
import { Sparkles, TrendingUp, DollarSign, Lightbulb, Calendar, CreditCard } from 'lucide-react';
import { User, Expense, DateRangePreset } from '../../types';
import { formatCurrency } from '../../lib/api';
import { filterExpensesByPreset } from '../../lib/dateUtils';

interface AnalyticsViewProps {
  user: User;
  expenses: Expense[];
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ user, expenses }) => {
  const currency = user.currency || '₹';

  // Date Range Preset Filter
  const [preset, setPreset] = useState<DateRangePreset>('all');
  const [customStart, setCustomStart] = useState<string>('');
  const [customEnd, setCustomEnd] = useState<string>('');

  const filteredExpenses = filterExpensesByPreset(expenses, preset, customStart, customEnd);

  // Category Pie Data
  const categoryTotals: Record<string, number> = {};
  filteredExpenses.forEach((e) => {
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

  const pieData = Object.entries(categoryTotals).map(([name, value]) => ({
    name,
    value,
    color: categoryColors[name] || '#d0bcff',
  }));

  // Monthly Bar Data
  const monthlyTotals: Record<string, number> = {};
  filteredExpenses.forEach((e) => {
    const month = e.date.substring(0, 7); // YYYY-MM
    monthlyTotals[month] = (monthlyTotals[month] || 0) + e.amount;
  });

  const monthlyData = Object.entries(monthlyTotals)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, amount]) => ({
      month,
      amount,
    }));

  // Daily Line Data
  const dailyTotals: Record<string, number> = {};
  filteredExpenses.forEach((e) => {
    dailyTotals[e.date] = (dailyTotals[e.date] || 0) + e.amount;
  });

  const dailyData = Object.entries(dailyTotals)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-14)
    .map(([date, amount]) => ({
      date: date.substring(5), // MM-DD
      amount,
    }));

  // Payment Method Summary & Chart
  const paymentTotals: Record<string, number> = {};
  filteredExpenses.forEach((e) => {
    const method = e.payment_method || 'UPI';
    paymentTotals[method] = (paymentTotals[method] || 0) + e.amount;
  });

  const paymentData = Object.entries(paymentTotals).map(([channel, amount]) => ({
    channel,
    amount,
  }));

  // AI Spending Insights Generation
  const totalSpent = filteredExpenses.reduce((s, e) => s + e.amount, 0);
  const highestCategoryEntry = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0];
  const highestPaymentEntry = Object.entries(paymentTotals).sort((a, b) => b[1] - a[1])[0];

  const insights: string[] = [];
  if (filteredExpenses.length > 0) {
    insights.push(`💡 Total expenditure for selected period: ${formatCurrency(totalSpent, currency)} across ${filteredExpenses.length} transactions.`);
    if (highestCategoryEntry) {
      const pct = Math.round((highestCategoryEntry[1] / totalSpent) * 100);
      insights.push(`🍔 Highest Spending Category: ${highestCategoryEntry[0]} (${formatCurrency(highestCategoryEntry[1], currency)} - ${pct}% of total).`);
    }
    const avgExpense = totalSpent / filteredExpenses.length;
    insights.push(`📊 Your average cost per transaction is ${formatCurrency(avgExpense, currency)}.`);
    if (highestPaymentEntry) {
      insights.push(`💳 Primary payment method used: ${highestPaymentEntry[0]} (${formatCurrency(highestPaymentEntry[1], currency)}).`);
    }
  }

  const presetsList: { id: DateRangePreset; label: string }[] = [
    { id: 'all', label: 'All Time' },
    { id: 'today', label: 'Today' },
    { id: 'yesterday', label: 'Yesterday' },
    { id: 'this_week', label: 'This Week' },
    { id: 'last_week', label: 'Last Week' },
    { id: 'this_month', label: 'This Month' },
    { id: 'last_month', label: 'Last Month' },
    { id: 'this_year', label: 'This Year' },
    { id: 'custom', label: 'Custom' },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white light:text-slate-900">Financial Analytics & Insights</h2>
          <p className="text-sm text-[#cbc3d7] light:text-slate-500">
            Analyze spending distributions, payment channels, and monthly trends.
          </p>
        </div>
      </div>

      {/* Date Range Presets Bar */}
      <div className="glass-panel rounded-2xl p-4 flex flex-wrap items-center gap-2 border border-white/10">
        <span className="text-xs font-bold text-[#cbc3d7] flex items-center gap-1 mr-2">
          <Calendar className="w-4 h-4 text-[#d0bcff]" /> Timeframe:
        </span>
        {presetsList.map((p) => (
          <button
            key={p.id}
            onClick={() => setPreset(p.id)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              preset === p.id
                ? 'bg-[#d0bcff] text-[#3c0091] shadow-md font-bold'
                : 'bg-white/5 light:bg-slate-100 text-[#cbc3d7] light:text-slate-700 hover:bg-white/10'
            }`}
          >
            {p.label}
          </button>
        ))}

        {preset === 'custom' && (
          <div className="flex items-center gap-2 mt-2 sm:mt-0 ml-auto">
            <input
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="bg-black/20 border border-white/10 rounded-xl px-2.5 py-1 text-xs text-white"
            />
            <span className="text-xs text-[#cbc3d7]">to</span>
            <input
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="bg-black/20 border border-white/10 rounded-xl px-2.5 py-1 text-xs text-white"
            />
          </div>
        )}
      </div>

      {filteredExpenses.length === 0 ? (
        <div className="glass-panel rounded-3xl p-12 text-center text-[#cbc3d7] space-y-3">
          <p className="text-base font-medium">No expense records found for the selected timeframe.</p>
          <p className="text-xs">Try selecting a different date range preset!</p>
        </div>
      ) : (
        <>
          {/* Payment Method Summary Row */}
          <div className="glass-panel rounded-3xl p-6 border border-white/10 space-y-4">
            <h3 className="font-bold text-base text-white light:text-slate-900 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-amber-400" /> Payment Method Summary
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {['UPI', 'Cash', 'Credit Card', 'Debit Card', 'Bank Transfer'].map((method) => {
                const amt = paymentTotals[method] || 0;
                const pct = totalSpent > 0 ? Math.round((amt / totalSpent) * 100) : 0;
                return (
                  <div key={method} className="p-3.5 rounded-2xl bg-white/5 border border-white/5">
                    <span className="text-[11px] font-semibold text-[#cbc3d7] block">{method}</span>
                    <span className="text-base font-extrabold text-white light:text-slate-900 block mt-1">
                      {formatCurrency(amt, currency)}
                    </span>
                    <span className="text-[10px] text-[#d0bcff] font-medium">{pct}% of total</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 1. Category Distribution Donut */}
            <div className="glass-panel rounded-3xl p-6 border border-white/10 flex flex-col justify-between">
              <h3 className="font-bold text-base text-white light:text-slate-900 mb-4 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#d0bcff]" /> Category Spending Distribution
              </h3>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={65}
                      outerRadius={95}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} stroke="transparent" />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(val: number) => [formatCurrency(val, currency), 'Spent']}
                      contentStyle={{ backgroundColor: '#171f33', borderRadius: '12px', border: 'none', color: '#fff' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* 2. Monthly Spending Bar Chart */}
            <div className="glass-panel rounded-3xl p-6 border border-white/10 flex flex-col justify-between">
              <h3 className="font-bold text-base text-white light:text-slate-900 mb-4 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#ffb0cd]" /> Monthly Spending Comparison
              </h3>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="month" stroke="#cbc3d7" fontSize={11} />
                    <YAxis stroke="#cbc3d7" fontSize={11} />
                    <Tooltip
                      formatter={(val: number) => [formatCurrency(val, currency), 'Spent']}
                      contentStyle={{ backgroundColor: '#171f33', borderRadius: '12px', border: 'none', color: '#fff' }}
                    />
                    <Bar dataKey="amount" fill="#d0bcff" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* 3. Daily Spending Line Chart */}
            <div className="glass-panel rounded-3xl p-6 border border-white/10 flex flex-col justify-between">
              <h3 className="font-bold text-base text-white light:text-slate-900 mb-4 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#adc6ff]" /> Daily Spending Trend
              </h3>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={dailyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="date" stroke="#cbc3d7" fontSize={11} />
                    <YAxis stroke="#cbc3d7" fontSize={11} />
                    <Tooltip
                      formatter={(val: number) => [formatCurrency(val, currency), 'Spent']}
                      contentStyle={{ backgroundColor: '#171f33', borderRadius: '12px', border: 'none', color: '#fff' }}
                    />
                    <Line type="monotone" dataKey="amount" stroke="#ffb0cd" strokeWidth={3} dot={{ fill: '#ffb0cd', r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* 4. Payment Method Bar Chart */}
            <div className="glass-panel rounded-3xl p-6 border border-white/10 flex flex-col justify-between">
              <h3 className="font-bold text-base text-white light:text-slate-900 mb-4 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400" /> Payment Channel Breakdown
              </h3>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={paymentData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis type="number" stroke="#cbc3d7" fontSize={11} />
                    <YAxis dataKey="channel" type="category" stroke="#cbc3d7" fontSize={11} width={90} />
                    <Tooltip
                      formatter={(val: number) => [formatCurrency(val, currency), 'Total']}
                      contentStyle={{ backgroundColor: '#171f33', borderRadius: '12px', border: 'none', color: '#fff' }}
                    />
                    <Bar dataKey="amount" fill="#adc6ff" radius={[0, 8, 8, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* AI Insights Card */}
          <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-white/10 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#d0bcff] to-[#ffb0cd] flex items-center justify-center text-[#3c0091]">
                <Sparkles className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-lg text-white light:text-slate-900">Automated Financial Insights</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {insights.map((text, idx) => (
                <div key={idx} className="p-4 rounded-2xl bg-white/5 border border-white/5 flex items-start gap-3">
                  <Lightbulb className="w-5 h-5 text-amber-300 shrink-0 mt-0.5" />
                  <p className="text-xs text-white light:text-slate-800 leading-relaxed">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
