import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { Target, Plus, CheckCircle2, Trash2, PiggyBank, Sparkles, PartyPopper } from 'lucide-react';
import { User, SavingsGoal } from '../../types';
import { formatCurrency } from '../../lib/api';
import { ConfirmModal } from '../ConfirmModal';

interface SavingsGoalsViewProps {
  user: User;
  savingsGoals: SavingsGoal[];
  onAddSavingsGoal: (goal: Partial<SavingsGoal>) => Promise<void>;
  onUpdateSavingsGoal: (goalId: string, updated: Partial<SavingsGoal>) => Promise<void>;
  onDeleteSavingsGoal: (goalId: string) => Promise<void>;
}

export const SavingsGoalsView: React.FC<SavingsGoalsViewProps> = ({
  user,
  savingsGoals,
  onAddSavingsGoal,
  onUpdateSavingsGoal,
  onDeleteSavingsGoal,
}) => {
  const currency = user.currency || '₹';

  // New goal form states
  const [goalName, setGoalName] = useState<string>('');
  const [targetAmount, setTargetAmount] = useState<string>('10000');
  const [savedAmount, setSavedAmount] = useState<string>('1000');
  const [targetDate, setTargetDate] = useState<string>('2026-12-31');
  const [showCreateForm, setShowCreateForm] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  // Deposit modal state
  const [depositingGoal, setDepositingGoal] = useState<SavingsGoal | null>(null);
  const [depositAdd, setDepositAdd] = useState<string>('500');

  // Delete modal state
  const [deletingGoalId, setDeletingGoalId] = useState<string | null>(null);

  // Celebration state for reaching or exceeding 100% target
  const [celebrationGoal, setCelebrationGoal] = useState<{ name: string; timestamp: number } | null>(null);

  const triggerConfettiCelebration = (goalTitle: string) => {
    setCelebrationGoal({
      name: goalTitle,
      timestamp: Date.now(),
    });

    // Multi-burst festive confetti effect
    // 1. Center burst
    confetti({
      particleCount: 90,
      spread: 75,
      origin: { y: 0.6 },
      colors: ['#d0bcff', '#ffb0cd', '#adc6ff', '#10b981', '#f59e0b', '#8b5cf6'],
      disableForReducedMotion: true,
    });

    // 2. Dual side cannons
    setTimeout(() => {
      confetti({
        particleCount: 60,
        angle: 60,
        spread: 60,
        origin: { x: 0.08, y: 0.7 },
        colors: ['#d0bcff', '#ffb0cd', '#10b981', '#ffd700'],
        disableForReducedMotion: true,
      });
      confetti({
        particleCount: 60,
        angle: 120,
        spread: 60,
        origin: { x: 0.92, y: 0.7 },
        colors: ['#adc6ff', '#f59e0b', '#8b5cf6', '#00e5ff'],
        disableForReducedMotion: true,
      });
    }, 220);

    // 3. Shower cascade
    setTimeout(() => {
      confetti({
        particleCount: 65,
        spread: 110,
        origin: { y: 0.45 },
        shapes: ['circle', 'square'],
        colors: ['#ffd700', '#ff69b4', '#00e5ff', '#7c3aed', '#10b981'],
        scalar: 1.15,
        disableForReducedMotion: true,
      });
    }, 450);

    // Auto-dismiss celebration announcement banner after 7 seconds
    setTimeout(() => {
      setCelebrationGoal((prev) => (prev?.name === goalTitle ? null : prev));
    }, 7000);
  };

  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    const tAmt = parseFloat(targetAmount);
    const sAmt = parseFloat(savedAmount);

    if (!goalName.trim() || isNaN(tAmt) || tAmt <= 0) return;

    try {
      setLoading(true);
      await onAddSavingsGoal({
        user_id: user.user_id,
        goal_name: goalName.trim(),
        target_amount: tAmt,
        saved_amount: isNaN(sAmt) ? 0 : sAmt,
        target_date: targetDate,
      });

      if (sAmt >= tAmt) {
        triggerConfettiCelebration(goalName.trim());
      }

      setGoalName('');
      setTargetAmount('10000');
      setSavedAmount('1000');
      setShowCreateForm(false);
    } catch (err: any) {
      alert(err.message || 'Failed to create savings goal');
    } finally {
      setLoading(false);
    }
  };

  const handleDepositSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!depositingGoal) return;

    const addVal = parseFloat(depositAdd);
    if (isNaN(addVal) || addVal <= 0) return;

    try {
      setLoading(true);
      const newTotalSaved = depositingGoal.saved_amount + addVal;
      const reachesTarget = newTotalSaved >= depositingGoal.target_amount;

      await onUpdateSavingsGoal(depositingGoal.goal_id, {
        saved_amount: newTotalSaved,
      });

      const currentGoalName = depositingGoal.goal_name;
      setDepositingGoal(null);
      setDepositAdd('500');

      if (reachesTarget) {
        triggerConfettiCelebration(currentGoalName);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to deposit funds');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingGoalId) return;
    try {
      await onDeleteSavingsGoal(deletingGoalId);
      setDeletingGoalId(null);
    } catch (err: any) {
      alert(err.message || 'Failed to delete goal');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Milestone Celebration Banner */}
      <AnimatePresence>
        {celebrationGoal && (
          <motion.div
            initial={{ opacity: 0, y: -16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -16, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 450, damping: 28 }}
            className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-[#d0bcff]/25 via-emerald-500/20 to-[#ffb0cd]/25 border border-[#d0bcff]/50 light:border-purple-300 shadow-[0_0_25px_rgba(208,188,255,0.25)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-400 to-[#d0bcff] text-[#3c0091] flex items-center justify-center font-black text-xl shadow-md shrink-0">
                🎉
              </div>
              <div>
                <h4 className="font-extrabold text-base sm:text-lg text-white light:text-slate-900 flex items-center gap-2">
                  <span>Savings Target Reached!</span>
                  <Sparkles className="w-4 h-4 text-amber-300 fill-amber-300" />
                </h4>
                <p className="text-xs text-[#cbc3d7] light:text-slate-600 font-medium">
                  Congratulations! You've achieved 100% of your target for <strong className="text-white light:text-purple-900">{celebrationGoal.name}</strong>.
                </p>
              </div>
            </div>
            <button
              onClick={() => triggerConfettiCelebration(celebrationGoal.name)}
              className="px-4 py-2 rounded-xl bg-white/20 light:bg-purple-100 hover:bg-white/30 light:hover:bg-purple-200 text-white light:text-purple-800 text-xs font-bold shrink-0 transition-colors cursor-pointer flex items-center gap-1.5 active:scale-95"
            >
              <PartyPopper className="w-4 h-4" />
              <span>Celebrate Again! 🎉</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white light:text-slate-900">Savings Goals</h2>
          <p className="text-sm text-[#cbc3d7] light:text-slate-500">
            Set target milestones for laptops, emergency funds, or gadgets.
          </p>
        </div>

        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-[#d0bcff] to-[#ffb0cd] text-[#3c0091] font-bold text-sm flex items-center gap-2 shadow-md hover:shadow-lg transition-all cursor-pointer active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>{showCreateForm ? 'Close Form' : 'New Goal'}</span>
        </button>
      </div>

      {/* Create New Goal Modal/Panel */}
      {showCreateForm && (
        <form onSubmit={handleCreateGoal} className="glass-panel rounded-3xl p-6 border border-white/10 space-y-4">
          <h3 className="font-bold text-base text-white light:text-slate-900">Create New Savings Milestone</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase text-[#cbc3d7] light:text-slate-600 mb-1">Goal Name *</label>
              <input
                type="text"
                required
                value={goalName}
                onChange={(e) => setGoalName(e.target.value)}
                placeholder="e.g. Emergency Fund"
                className="w-full bg-black/20 light:bg-slate-100 border border-white/10 light:border-slate-300 rounded-2xl px-4 py-2.5 text-white light:text-slate-900 text-sm focus:outline-none focus:border-[#d0bcff]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-[#cbc3d7] light:text-slate-600 mb-1">Target Amount ({currency}) *</label>
              <input
                type="number"
                min="500"
                required
                value={targetAmount}
                onChange={(e) => setTargetAmount(e.target.value)}
                className="w-full bg-black/20 light:bg-slate-100 border border-white/10 light:border-slate-300 rounded-2xl px-4 py-2.5 text-white light:text-slate-900 font-bold text-sm focus:outline-none focus:border-[#d0bcff]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-[#cbc3d7] light:text-slate-600 mb-1">Initial Saved Amount ({currency})</label>
              <input
                type="number"
                min="0"
                value={savedAmount}
                onChange={(e) => setSavedAmount(e.target.value)}
                className="w-full bg-black/20 light:bg-slate-100 border border-white/10 light:border-slate-300 rounded-2xl px-4 py-2.5 text-white light:text-slate-900 text-sm focus:outline-none focus:border-[#d0bcff]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-[#cbc3d7] light:text-slate-600 mb-1">Target Date</label>
              <input
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="w-full bg-black/20 light:bg-slate-100 border border-white/10 light:border-slate-300 rounded-2xl px-4 py-2.5 text-white light:text-slate-900 text-xs focus:outline-none focus:border-[#d0bcff]"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-2xl bg-[#d0bcff] text-[#3c0091] font-bold text-sm shadow-md cursor-pointer hover:opacity-90 transition-opacity active:scale-98"
          >
            {loading ? 'Creating...' : 'Save Savings Goal'}
          </button>
        </form>
      )}

      {/* Goal Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {savingsGoals.length === 0 ? (
          <div className="col-span-full glass-panel rounded-3xl p-12 text-center text-[#cbc3d7] space-y-3">
            <PiggyBank className="w-12 h-12 text-[#cbc3d7]/40 mx-auto" />
            <p className="text-base font-medium">No savings goals created yet.</p>
            <p className="text-xs">Create your first goal above to start tracking progress!</p>
          </div>
        ) : (
          savingsGoals.map((goal) => {
            const pct = goal.target_amount > 0 ? Math.round((goal.saved_amount / goal.target_amount) * 100) : 0;
            const isCompleted = pct >= 100;
            const remainingNeeded = Math.max(0, goal.target_amount - goal.saved_amount);

            return (
              <div
                key={goal.goal_id}
                className={`glass-panel glass-panel-hover rounded-3xl p-6 border space-y-4 relative flex flex-col justify-between transition-all duration-300 ${
                  isCompleted
                    ? 'border-emerald-500/40 light:border-emerald-300 bg-emerald-950/10 light:bg-emerald-50/50 shadow-[0_4px_25px_rgba(16,185,129,0.12)]'
                    : 'border-white/10'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold shrink-0 ${
                        isCompleted
                          ? 'bg-gradient-to-tr from-emerald-400 to-[#d0bcff] text-[#3c0091] shadow-[0_0_15px_rgba(16,185,129,0.35)]'
                          : 'bg-gradient-to-tr from-[#adc6ff] to-[#d0bcff] text-[#3c0091]'
                      }`}
                    >
                      {isCompleted ? <CheckCircle2 className="w-6 h-6" /> : <Target className="w-6 h-6" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-base text-white light:text-slate-900">{goal.goal_name}</h3>
                        {isCompleted && (
                          <span className="px-2 py-0.5 text-[10px] font-black rounded-full bg-emerald-500/20 text-emerald-400 light:bg-emerald-100 light:text-emerald-700 flex items-center gap-1">
                            <Sparkles className="w-3 h-3" /> 100% ACHIEVED
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#cbc3d7] light:text-slate-500">
                        Target Date: {goal.target_date || 'N/A'}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => setDeletingGoalId(goal.goal_id)}
                    className="p-1.5 text-rose-400 hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                    title="Delete Goal"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Progress Bar & Amounts */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-white light:text-slate-800">
                    <span>
                      {formatCurrency(goal.saved_amount, currency)} / {formatCurrency(goal.target_amount, currency)}
                    </span>
                    <span className={isCompleted ? 'text-emerald-400 light:text-emerald-700 font-extrabold' : 'text-[#adc6ff] light:text-purple-700 font-bold'}>
                      {pct}% Completed
                    </span>
                  </div>

                  <div className="w-full h-3 bg-white/10 light:bg-slate-200 rounded-full overflow-hidden p-0.5">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isCompleted
                          ? 'bg-gradient-to-r from-emerald-400 to-[#d0bcff] shadow-[0_0_12px_rgba(16,185,129,0.5)]'
                          : 'bg-gradient-to-r from-[#adc6ff] to-[#d0bcff] shadow-[0_0_10px_rgba(173,198,255,0.5)]'
                      }`}
                      style={{ width: `${Math.min(100, pct)}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-xs text-[#cbc3d7] light:text-slate-500">
                    {isCompleted ? (
                      <span className="text-emerald-400 light:text-emerald-600 font-bold flex items-center gap-1">
                        🎉 Milestone reached! {goal.saved_amount > goal.target_amount && `(+${formatCurrency(goal.saved_amount - goal.target_amount, currency)} bonus)`}
                      </span>
                    ) : (
                      <span>
                        Remaining needed: <strong className="text-white light:text-slate-900">{formatCurrency(remainingNeeded, currency)}</strong>
                      </span>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2 pt-1">
                  {isCompleted ? (
                    <>
                      <button
                        onClick={() => triggerConfettiCelebration(goal.goal_name)}
                        className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500/20 to-[#d0bcff]/20 hover:from-emerald-500/30 hover:to-[#d0bcff]/30 text-emerald-300 light:text-emerald-700 font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 border border-emerald-500/30 light:border-emerald-200 shadow-sm"
                      >
                        <PartyPopper className="w-4 h-4 text-emerald-400" />
                        <span>Replay Celebration 🎉</span>
                      </button>
                      <button
                        onClick={() => setDepositingGoal(goal)}
                        className="px-3.5 py-2.5 rounded-xl bg-white/10 light:bg-slate-100 hover:bg-white/20 light:hover:bg-slate-200 text-[#d0bcff] light:text-slate-700 font-bold text-xs transition-colors cursor-pointer flex items-center gap-1"
                        title="Add More Funds"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add More</span>
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => setDepositingGoal(goal)}
                      className="w-full py-2.5 rounded-xl bg-white/10 light:bg-purple-100 hover:bg-white/20 light:hover:bg-purple-200 text-[#d0bcff] light:text-purple-700 font-bold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Deposit Funds to Goal</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Deposit Funds Modal */}
      {depositingGoal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in">
          <form onSubmit={handleDepositSubmit} className="glass-panel light:bg-white rounded-3xl p-6 max-w-sm w-full border border-white/10 space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-white light:text-slate-900">Deposit to {depositingGoal.goal_name}</h3>
            <div className="p-3 rounded-2xl bg-white/5 light:bg-slate-50 border border-white/5 light:border-slate-200 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-[#cbc3d7] light:text-slate-500">Currently Saved:</span>
                <span className="font-bold text-white light:text-slate-900">{formatCurrency(depositingGoal.saved_amount, currency)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#cbc3d7] light:text-slate-500">Target Goal:</span>
                <span className="font-bold text-white light:text-slate-900">{formatCurrency(depositingGoal.target_amount, currency)}</span>
              </div>
              {depositingGoal.target_amount > depositingGoal.saved_amount && (
                <div className="flex justify-between text-emerald-400 light:text-emerald-600 font-semibold pt-1 border-t border-white/5 light:border-slate-200">
                  <span>To reach 100%:</span>
                  <span>{formatCurrency(depositingGoal.target_amount - depositingGoal.saved_amount, currency)}</span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-[#cbc3d7] light:text-slate-600 mb-1">
                Deposit Amount ({currency})
              </label>
              <input
                type="number"
                min="1"
                required
                value={depositAdd}
                onChange={(e) => setDepositAdd(e.target.value)}
                className="w-full bg-black/20 light:bg-slate-100 border border-white/10 light:border-slate-300 rounded-xl px-4 py-2.5 text-white light:text-slate-900 font-bold text-sm"
              />
            </div>

            {/* Quick Presets */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#cbc3d7] light:text-slate-400">Quick Amounts</span>
              <div className="flex flex-wrap gap-1.5">
                {[100, 500, 1000, 2000].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setDepositAdd(amt.toString())}
                    className="px-2.5 py-1 rounded-lg bg-white/10 light:bg-slate-100 hover:bg-white/20 light:hover:bg-slate-200 text-xs font-semibold text-white light:text-slate-800 transition-colors cursor-pointer"
                  >
                    +{currency}{amt}
                  </button>
                ))}
                {depositingGoal.target_amount > depositingGoal.saved_amount && (
                  <button
                    type="button"
                    onClick={() => setDepositAdd((depositingGoal.target_amount - depositingGoal.saved_amount).toString())}
                    className="px-2.5 py-1 rounded-lg bg-emerald-500/20 light:bg-emerald-100 text-emerald-300 light:text-emerald-800 hover:bg-emerald-500/30 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>Complete 100% ({currency}{depositingGoal.target_amount - depositingGoal.saved_amount})</span>
                  </button>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDepositingGoal(null)}
                className="px-4 py-2 text-xs font-bold text-[#cbc3d7] light:text-slate-600 hover:text-white light:hover:text-slate-900 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#d0bcff] to-[#ffb0cd] text-[#3c0091] font-bold text-xs cursor-pointer hover:shadow-md transition-all active:scale-95"
              >
                {loading ? 'Processing...' : 'Confirm Deposit'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(deletingGoalId)}
        title="Delete Savings Goal"
        message="Are you sure you want to delete this savings goal? Any saved progress record will be removed."
        confirmLabel="Delete Goal"
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeletingGoalId(null)}
      />
    </div>
  );
};
