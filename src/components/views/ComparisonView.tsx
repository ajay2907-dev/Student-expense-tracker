import React, { useState } from 'react';
import { TrendingUp, TrendingDown, ArrowRightLeft, AlertCircle } from 'lucide-react';
import { User, Expense } from '../../types';
import { formatCurrency } from '../../lib/api';

interface ComparisonViewProps {
  user: User;
  expenses: Expense[];
}

export const ComparisonView: React.FC<ComparisonViewProps> = ({ user, expenses }) => {
  const currency = user.currency || '₹';

  const now = new Date();
  const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  
  const prevDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevMonthStr = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;

  const [monthA, setMonthA] = useState<string>(currentMonthStr);
  const [monthB, setMonthB] = useState<string>(prevMonthStr);

  const expensesA = expenses.filter((e) => e.date.startsWith(monthA));
  const expensesB = expenses.filter((e) => e.date.startsWith(monthB));

  const totalA = expensesA.reduce((sum, e) => sum + e.amount, 0);
  const totalB = expensesB.reduce((sum, e) => sum + e.amount, 0);

  const diff = totalA - totalB;
  const pctChange = totalB > 0 ? ((totalA - totalB) / totalB) * 100 : totalA > 0 ? 100 : 0;

  // Category comparisons
  const categories = Array.from(new Set(expenses.map((e) => e.category)));

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div>
        <h2 className="text-2xl font-bold text-white light:text-slate-900">Month-over-Month Comparison</h2>
        <p className="text-sm text-[#cbc3d7] light:text-slate-500">
          Compare spending shifts between any two selected billing periods.
        </p>
      </div>

      {/* Month Selectors */}
      <div className="glass-panel rounded-3xl p-6 border border-white/10 flex flex-col sm:flex-row items-center justify-around gap-6">
        <div className="w-full sm:w-auto text-center sm:text-left">
          <label className="block text-xs font-bold uppercase text-[#cbc3d7] mb-1">Period A (Target)</label>
          <input
            type="month"
            value={monthA}
            onChange={(e) => setMonthA(e.target.value)}
            className="bg-black/20 light:bg-slate-100 border border-white/10 rounded-xl px-4 py-2 text-white light:text-slate-900 font-bold text-sm focus:outline-none"
          />
        </div>

        <div className="p-3 rounded-full bg-white/5 text-[#d0bcff]">
          <ArrowRightLeft className="w-5 h-5" />
        </div>

        <div className="w-full sm:w-auto text-center sm:text-left">
          <label className="block text-xs font-bold uppercase text-[#cbc3d7] mb-1">Period B (Baseline)</label>
          <input
            type="month"
            value={monthB}
            onChange={(e) => setMonthB(e.target.value)}
            className="bg-black/20 light:bg-slate-100 border border-white/10 rounded-xl px-4 py-2 text-white light:text-slate-900 font-bold text-sm focus:outline-none"
          />
        </div>
      </div>

      {/* Overview Metric Banner */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-white/10 grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
        <div className="p-4 rounded-2xl bg-white/5">
          <span className="text-xs text-[#cbc3d7] font-bold block mb-1">{monthA} Spending</span>
          <span className="text-2xl font-extrabold text-white">{formatCurrency(totalA, currency)}</span>
          <p className="text-[10px] text-[#cbc3d7] mt-1">{expensesA.length} transactions</p>
        </div>

        <div className="p-4 rounded-2xl bg-white/5">
          <span className="text-xs text-[#cbc3d7] font-bold block mb-1">{monthB} Spending</span>
          <span className="text-2xl font-extrabold text-white">{formatCurrency(totalB, currency)}</span>
          <p className="text-[10px] text-[#cbc3d7] mt-1">{expensesB.length} transactions</p>
        </div>

        <div className="p-4 rounded-2xl bg-white/5 flex flex-col items-center justify-center">
          <span className="text-xs text-[#cbc3d7] font-bold block mb-1">Shift Variance</span>
          <div className="flex items-center gap-2">
            {diff > 0 ? (
              <TrendingUp className="w-6 h-6 text-rose-400" />
            ) : (
              <TrendingDown className="w-6 h-6 text-emerald-400" />
            )}
            <span className={`text-2xl font-extrabold ${diff > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
              {pctChange > 0 ? '+' : ''}{pctChange.toFixed(1)}%
            </span>
          </div>
          <span className="text-xs text-[#cbc3d7] mt-1 font-medium">
            ({diff > 0 ? '+' : ''}{formatCurrency(diff, currency)})
          </span>
        </div>
      </div>

      {/* Category Breakdown Table */}
      <div className="glass-panel rounded-3xl p-6 border border-white/10 space-y-4">
        <h3 className="font-bold text-lg text-white light:text-slate-900">Category Shift Breakdown</h3>

        {categories.length === 0 ? (
          <p className="text-xs text-[#cbc3d7] text-center py-6">No category data recorded for comparison.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-white/5 text-[#cbc3d7] uppercase font-bold border-b border-white/10">
                  <th className="p-3 pl-4">Category</th>
                  <th className="p-3 text-right">{monthA}</th>
                  <th className="p-3 text-right">{monthB}</th>
                  <th className="p-3 text-right pr-4">Difference</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {categories.map((cat) => {
                  const amtA = expensesA.filter((e) => e.category === cat).reduce((s, e) => s + e.amount, 0);
                  const amtB = expensesB.filter((e) => e.category === cat).reduce((s, e) => s + e.amount, 0);
                  const catDiff = amtA - amtB;

                  if (amtA === 0 && amtB === 0) return null;

                  return (
                    <tr key={cat} className="hover:bg-white/5 text-white">
                      <td className="p-3 pl-4 font-semibold">{cat}</td>
                      <td className="p-3 text-right font-medium">{formatCurrency(amtA, currency)}</td>
                      <td className="p-3 text-right font-medium">{formatCurrency(amtB, currency)}</td>
                      <td className={`p-3 text-right pr-4 font-bold ${catDiff > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                        {catDiff > 0 ? '+' : ''}{formatCurrency(catDiff, currency)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
