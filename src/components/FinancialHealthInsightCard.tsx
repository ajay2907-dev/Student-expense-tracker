import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  ShieldCheck,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Activity,
  Lightbulb,
  Compass,
  ArrowUpRight,
} from 'lucide-react';
import { User } from '../types';
import { api, FinancialHealthInsightResponse, SpendingPatternAnalysisInput } from '../lib/api';
import { formatCurrency } from '../lib/api';

interface FinancialHealthInsightCardProps {
  user: User;
  currency: string;
  currentMonthStr: string;
  currentMonthSpent: number;
  effectiveBudget: number;
  remainingBudget: number;
  budgetUtilizationPct: number;
  daysPassedInMonth: number;
  daysInMonth: number;
  dailyRunRate: number;
  projectedMonthEndSpent: number;
  categoryBreakdown: Array<{ category: string; amount: number; percentage: number }>;
  topCategory: { category: string; amount: number; percentage: number } | null;
  previousMonthSpent: number;
  transactionCount: number;
}

export const FinancialHealthInsightCard: React.FC<FinancialHealthInsightCardProps> = ({
  user,
  currency,
  currentMonthStr,
  currentMonthSpent,
  effectiveBudget,
  remainingBudget,
  budgetUtilizationPct,
  daysPassedInMonth,
  daysInMonth,
  dailyRunRate,
  projectedMonthEndSpent,
  categoryBreakdown,
  topCategory,
  previousMonthSpent,
  transactionCount,
}) => {
  const [insight, setInsight] = useState<FinancialHealthInsightResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const lastAnalyzedKeyRef = useRef<string>('');

  const cacheKey = `health_insight_${user.user_id}_${currentMonthStr}_${transactionCount}_${Math.round(currentMonthSpent)}`;

  const fetchInsight = useCallback(
    async (forceRefresh = false) => {
      // Check in-memory cache to prevent duplicate fetches
      if (!forceRefresh && lastAnalyzedKeyRef.current === cacheKey && insight) {
        return;
      }

      // Check session storage
      if (!forceRefresh) {
        try {
          const cached = sessionStorage.getItem(cacheKey);
          if (cached) {
            const parsed = JSON.parse(cached);
            setInsight(parsed);
            lastAnalyzedKeyRef.current = cacheKey;
            return;
          }
        } catch {
          // ignore cache read failure
        }
      }

      setLoading(true);
      setError(null);

      const input: SpendingPatternAnalysisInput = {
        currency,
        month: currentMonthStr,
        totalSpent: currentMonthSpent,
        monthlyBudget: effectiveBudget,
        remainingBudget,
        budgetUtilizationPct,
        daysPassedInMonth,
        daysInMonth,
        dailyRunRate,
        projectedMonthEndSpent,
        categoryBreakdown,
        topCategory,
        previousMonthSpent,
        transactionCount,
      };

      try {
        const data = await api.getFinancialHealthInsight(input);
        setInsight(data);
        lastAnalyzedKeyRef.current = cacheKey;
        try {
          sessionStorage.setItem(cacheKey, JSON.stringify(data));
        } catch {
          // ignore cache write failure
        }
      } catch (err: any) {
        console.warn('Failed to fetch financial health insight:', err);
        setError(err.message || 'Unable to analyze spending patterns');
      } finally {
        setLoading(false);
      }
    },
    [
      cacheKey,
      insight,
      currency,
      currentMonthStr,
      currentMonthSpent,
      effectiveBudget,
      remainingBudget,
      budgetUtilizationPct,
      daysPassedInMonth,
      daysInMonth,
      dailyRunRate,
      projectedMonthEndSpent,
      categoryBreakdown,
      topCategory,
      previousMonthSpent,
      transactionCount,
      user.user_id,
    ]
  );

  useEffect(() => {
    fetchInsight(false);
  }, [fetchInsight]);

  // Status Styling Configuration
  const getStatusConfig = (status?: string) => {
    switch (status) {
      case 'Healthy':
        return {
          badgeBg: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400 light:text-emerald-700 light:bg-emerald-50 light:border-emerald-200',
          scoreColor: 'text-emerald-400 light:text-emerald-600',
          barColor: 'bg-emerald-400 light:bg-emerald-500',
          icon: ShieldCheck,
          label: 'Healthy Pace',
        };
      case 'Good':
        return {
          badgeBg: 'bg-cyan-500/15 border-cyan-500/30 text-cyan-400 light:text-cyan-700 light:bg-cyan-50 light:border-cyan-200',
          scoreColor: 'text-cyan-400 light:text-cyan-600',
          barColor: 'bg-cyan-400 light:bg-cyan-500',
          icon: CheckCircle2,
          label: 'Good Trajectory',
        };
      case 'Caution':
        return {
          badgeBg: 'bg-amber-500/15 border-amber-500/30 text-amber-400 light:text-amber-700 light:bg-amber-50 light:border-amber-200',
          scoreColor: 'text-amber-400 light:text-amber-600',
          barColor: 'bg-amber-400 light:bg-amber-500',
          icon: AlertTriangle,
          label: 'Caution / Elevated Burn',
        };
      case 'Critical':
        return {
          badgeBg: 'bg-rose-500/15 border-rose-500/30 text-rose-400 light:text-rose-700 light:bg-rose-50 light:border-rose-200',
          scoreColor: 'text-rose-400 light:text-rose-600',
          barColor: 'bg-rose-400 light:bg-rose-500',
          icon: AlertCircle,
          label: 'Over Budget Alert',
        };
      default:
        return {
          badgeBg: 'bg-[#d0bcff]/15 border-[#d0bcff]/30 text-[#d0bcff] light:text-purple-700 light:bg-purple-50 light:border-purple-200',
          scoreColor: 'text-[#d0bcff] light:text-purple-700',
          barColor: 'bg-[#d0bcff] light:bg-purple-500',
          icon: Activity,
          label: 'Analyzing',
        };
    }
  };

  const statusConfig = getStatusConfig(insight?.status);
  const StatusIcon = statusConfig.icon;

  const monthProgressPct = Math.min(
    100,
    Math.round((daysPassedInMonth / Math.max(1, daysInMonth)) * 100)
  );

  return (
    <div className="glass-panel rounded-3xl p-6 sm:p-7 border border-white/10 relative overflow-hidden bg-gradient-to-br from-white/[0.04] via-[#d0bcff]/[0.03] to-transparent shadow-xl animate-in fade-in duration-300">
      {/* Background Accent Ambient Glow */}
      <div className="absolute -right-24 -top-24 w-72 h-72 bg-[#d0bcff]/10 rounded-full blur-3xl pointer-events-none" />

      {/* Card Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#d0bcff]/30 to-[#ffb0cd]/20 flex items-center justify-center text-[#d0bcff] shadow-inner shrink-0">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-lg text-white light:text-slate-900 tracking-tight">
                Financial Health Insight
              </h3>
              {insight?.source === 'gemini' && (
                <span className="px-2 py-0.5 rounded-full bg-[#d0bcff]/20 text-[#d0bcff] text-[10px] font-extrabold uppercase tracking-wide border border-[#d0bcff]/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#d0bcff] animate-ping" />
                  Gemini AI
                </span>
              )}
            </div>
            <p className="text-xs text-[#cbc3d7] light:text-slate-500">
              Monthly spending pattern analysis & student budget pacing
            </p>
          </div>
        </div>

        {/* Action button & health badge */}
        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          {insight && (
            <div
              className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 ${statusConfig.badgeBg}`}
            >
              <StatusIcon className="w-3.5 h-3.5" />
              <span>{insight.status}</span>
            </div>
          )}

          <button
            type="button"
            onClick={() => fetchInsight(true)}
            disabled={loading}
            className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-[#dae2fd] light:text-slate-700 hover:text-white transition-all flex items-center gap-1.5 disabled:opacity-50"
            title="Re-analyze spending with Gemini AI"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#d0bcff]' : ''}`} />
            <span className="hidden sm:inline">{loading ? 'Analyzing...' : 'Re-analyze'}</span>
          </button>
        </div>
      </div>

      {/* Content States */}
      <AnimatePresence mode="wait">
        {loading && !insight && (
          <motion.div
            key="insight-loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="py-10 text-center space-y-3 animate-pulse"
          >
            <div className="w-12 h-12 rounded-2xl bg-[#d0bcff]/20 mx-auto flex items-center justify-center text-[#d0bcff]">
              <RefreshCw className="w-6 h-6 animate-spin" />
            </div>
            <p className="text-sm font-semibold text-white light:text-slate-800">
              Gemini AI is analyzing your monthly spending patterns...
            </p>
            <p className="text-xs text-[#cbc3d7]">
              Evaluating daily run-rate, category distributions, and month-end projections
            </p>
          </motion.div>
        )}

        {/* Error State */}
        {error && !insight && (
          <motion.div
            key="insight-error"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="py-6 text-center space-y-2"
          >
            <p className="text-sm text-rose-400">{error}</p>
            <button
              onClick={() => fetchInsight(true)}
              className="text-xs font-bold text-[#d0bcff] underline"
            >
              Try again
            </button>
          </motion.div>
        )}

        {/* Main Insight Content */}
        {insight && (
          <motion.div
            key="insight-content"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="pt-5 space-y-5"
          >
          {/* Top Section: Health Score & Executive Summary */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
            {/* Health Score Gauge Container */}
            <div className="md:col-span-4 p-4 rounded-2xl bg-white/5 light:bg-slate-100 border border-white/5 flex flex-col justify-between space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#cbc3d7] light:text-slate-500">
                  Financial Health Score
                </span>
                <span className={`text-xs font-extrabold ${statusConfig.scoreColor}`}>
                  {insight.status}
                </span>
              </div>

              <div className="flex items-baseline gap-2">
                <span className={`text-4xl font-black ${statusConfig.scoreColor}`}>
                  {insight.score}
                </span>
                <span className="text-sm font-bold text-[#cbc3d7]">/ 100</span>
              </div>

              {/* Score Bar */}
              <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${statusConfig.barColor}`}
                  style={{ width: `${Math.min(100, Math.max(5, insight.score))}%` }}
                />
              </div>

              <div className="flex justify-between text-[10px] text-[#cbc3d7] light:text-slate-500 font-medium">
                <span>Budget Spent: {budgetUtilizationPct.toFixed(1)}%</span>
                <span>Month: {monthProgressPct}%</span>
              </div>
            </div>

            {/* Executive Summary */}
            <div className="md:col-span-8 space-y-2">
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#d0bcff]">
                <Activity className="w-3.5 h-3.5" />
                <span>{insight.title}</span>
              </div>
              <p className="text-sm text-white light:text-slate-900 leading-relaxed font-medium">
                {insight.summary}
              </p>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#cbc3d7] light:text-slate-500 pt-1">
                <span>
                  Daily Burn Rate:{' '}
                  <strong className="text-white light:text-slate-800">
                    {formatCurrency(dailyRunRate, currency)}/day
                  </strong>
                </span>
                <span>•</span>
                <span>
                  Projected Month-End:{' '}
                  <strong className="text-white light:text-slate-800">
                    {formatCurrency(projectedMonthEndSpent, currency)}
                  </strong>
                </span>
              </div>
            </div>
          </div>

          {/* Dual Intelligence Columns: Pattern Observations & Actionable Recommendations */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            {/* Key Spending Observations */}
            <div className="p-4 rounded-2xl bg-white/5 light:bg-slate-100 border border-white/5 space-y-2.5">
              <div className="flex items-center gap-2 text-xs font-bold text-[#dae2fd] light:text-slate-800 uppercase tracking-wider">
                <Compass className="w-3.5 h-3.5 text-[#d0bcff]" />
                <span>Key Pattern Observations</span>
              </div>
              <div className="space-y-2 text-xs text-[#cbc3d7] light:text-slate-600">
                {insight.keyObservations && insight.keyObservations.length > 0 ? (
                  insight.keyObservations.map((obs, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#d0bcff] mt-1.5 shrink-0" />
                      <span className="leading-relaxed">{obs}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-[11px]">Consistent outflow pace across recorded categories.</p>
                )}
              </div>
            </div>

            {/* Practical Student Recommendations */}
            <div className="p-4 rounded-2xl bg-white/5 light:bg-slate-100 border border-white/5 space-y-2.5">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-300 light:text-amber-600 uppercase tracking-wider">
                <Lightbulb className="w-3.5 h-3.5 text-amber-300" />
                <span>Student Action Tips</span>
              </div>
              <div className="space-y-2 text-xs text-[#cbc3d7] light:text-slate-600">
                {insight.recommendations && insight.recommendations.length > 0 ? (
                  insight.recommendations.map((rec, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <ArrowUpRight className="w-3.5 h-3.5 text-amber-300 shrink-0 mt-0.5" />
                      <span className="leading-relaxed">{rec}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-[11px]">Maintain current daily spending ceiling to preserve savings.</p>
                )}
              </div>
            </div>
          </div>

          {/* Footer Metadata & Micro Stats Strip */}
          <div className="pt-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-[11px] text-[#cbc3d7]/80 light:text-slate-400 border-t border-white/5">
            <div className="flex flex-wrap items-center gap-2">
              <span>
                Analyzed {transactionCount} expenses for{' '}
                <strong className="text-white light:text-slate-700">{currentMonthStr}</strong>
              </span>
              {topCategory && (
                <>
                  <span>•</span>
                  <span>
                    Highest: {topCategory.category} ({topCategory.percentage.toFixed(0)}%)
                  </span>
                </>
              )}
            </div>
            <div className="text-[10px] text-[#cbc3d7]/60">
              {insight.source === 'gemini' ? 'Gemini 3.8 Flash analysis' : 'Rule-based analysis'} •{' '}
              {new Date(insight.generatedAt || Date.now()).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </div>
          </div>
        </motion.div>
      )}
      </AnimatePresence>
    </div>
  );
};
