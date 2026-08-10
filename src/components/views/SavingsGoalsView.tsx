import React, { useState } from 'react';
import { Target, Plus, CheckCircle2, Trash2, PiggyBank } from 'lucide-react';
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
      await onUpdateSavingsGoal(depositingGoal.goal_id, {
        saved_amount: newTotalSaved,
      });
      setDepositingGoal(null);
      setDepositAdd('500');
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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white light:text-slate-900">Savings Goals</h2>
          <p className="text-sm text-[#cbc3d7] light:text-slate-500">
            Set target milestones for laptops, emergency funds, or gadgets.
          </p>
        </div>

        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-[#d0bcff] to-[#ffb0cd] text-[#3c0091] font-bold text-sm flex items-center gap-2 shadow-md hover:shadow-lg transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>{showCreateForm ? 'Close Form' : 'New Goal'}</span>
        </button>
      </div>

      {/* Create New Goal Modal/Panel */}
      {showCreateForm && (
        <form onSubmit={handleCreateGoal} className="glass-panel rounded-3xl p-6 border border-white/10 space-y-4">
          <h3 className="font-bold text-base text-white">Create New Savings Milestone</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase text-[#cbc3d7] mb-1">Goal Name *</label>
              <input
                type="text"
                required
                value={goalName}
                onChange={(e) => setGoalName(e.target.value)}
                placeholder="e.g. Emergency Fund"
                className="w-full bg-black/20 border border-white/10 rounded-2xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#d0bcff]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-[#cbc3d7] mb-1">Target Amount ({currency}) *</label>
              <input
                type="number"
                min="500"
                required
                value={targetAmount}
                onChange={(e) => setTargetAmount(e.target.value)}
                className="w-full bg-black/20 border border-white/10 rounded-2xl px-4 py-2.5 text-white font-bold text-sm focus:outline-none focus:border-[#d0bcff]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-[#cbc3d7] mb-1">Initial Saved Amount ({currency})</label>
              <input
                type="number"
                min="0"
                value={savedAmount}
                onChange={(e) => setSavedAmount(e.target.value)}
                className="w-full bg-black/20 border border-white/10 rounded-2xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#d0bcff]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-[#cbc3d7] mb-1">Target Date</label>
              <input
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="w-full bg-black/20 border border-white/10 rounded-2xl px-4 py-2.5 text-white text-xs focus:outline-none focus:border-[#d0bcff]"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-2xl bg-[#d0bcff] text-[#3c0091] font-bold text-sm shadow-md"
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
            const pct = goal.target_amount > 0 ? Math.min(100, Math.round((goal.saved_amount / goal.target_amount) * 100)) : 0;
            const remainingNeeded = Math.max(0, goal.target_amount - goal.saved_amount);

            return (
              <div key={goal.goal_id} className="glass-panel glass-panel-hover rounded-3xl p-6 border border-white/10 space-y-4 relative flex flex-col justify-between">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#adc6ff] to-[#d0bcff] flex items-center justify-center text-[#3c0091] font-bold">
                      <Target className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-base text-white light:text-slate-900">{goal.goal_name}</h3>
                      <p className="text-xs text-[#cbc3d7] light:text-slate-500">
                        Target Date: {goal.target_date || 'N/A'}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => setDeletingGoalId(goal.goal_id)}
                    className="p-1.5 text-rose-400 hover:bg-white/10 rounded-lg transition-colors"
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
                    <span className="text-[#adc6ff]">{pct}% Completed</span>
                  </div>

                  <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden p-0.5">
                    <div
                      className="h-full bg-gradient-to-r from-[#adc6ff] to-[#d0bcff] rounded-full shadow-[0_0_10px_rgba(173,198,255,0.5)]"
                      style={{ width: `${pct}%` }}
                    />
                  </div>

                  <p className="text-xs text-[#cbc3d7] light:text-slate-500 text-right">
                    Remaining needed: <strong className="text-white">{formatCurrency(remainingNeeded, currency)}</strong>
                  </p>
                </div>

                {/* Deposit Funds Button */}
                <button
                  onClick={() => setDepositingGoal(goal)}
                  className="w-full py-2.5 rounded-xl bg-white/10 light:bg-purple-100 hover:bg-white/20 text-[#d0bcff] light:text-purple-700 font-bold text-xs transition-colors flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Deposit Funds to Goal</span>
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* Deposit Funds Modal */}
      {depositingGoal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in">
          <form onSubmit={handleDepositSubmit} className="glass-panel rounded-3xl p-6 max-w-sm w-full border border-white/10 space-y-4">
            <h3 className="text-lg font-bold text-white">Deposit to {depositingGoal.goal_name}</h3>
            <p className="text-xs text-[#cbc3d7]">
              Current saved: {formatCurrency(depositingGoal.saved_amount, currency)}
            </p>

            <div>
              <label className="block text-xs font-bold uppercase text-[#cbc3d7] mb-1">
                Deposit Amount ({currency})
              </label>
              <input
                type="number"
                min="1"
                required
                value={depositAdd}
                onChange={(e) => setDepositAdd(e.target.value)}
                className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2.5 text-white font-bold text-sm"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDepositingGoal(null)}
                className="px-4 py-2 text-xs font-bold text-[#cbc3d7]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2.5 rounded-xl bg-[#d0bcff] text-[#3c0091] font-bold text-xs"
              >
                Confirm Deposit
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
