import React, { useState } from 'react';
import { PlusCircle, Calendar, Tag, CreditCard, FileText, CheckCircle2 } from 'lucide-react';
import { User, Expense } from '../../types';

interface AddExpenseViewProps {
  user: User;
  onAddExpense: (expense: Partial<Expense>) => Promise<void>;
}

const CATEGORIES = [
  'Food',
  'Transportation',
  'Education',
  'Shopping',
  'Entertainment',
  'Personal',
  'Mobile/Internet',
  'Other',
];

const PAYMENT_METHODS = ['UPI', 'Cash', 'Debit Card', 'Credit Card', 'Bank Transfer'];

export const AddExpenseView: React.FC<AddExpenseViewProps> = ({ user, onAddExpense }) => {
  const currency = user.currency || '₹';

  const [amount, setAmount] = useState<string>('150');
  const [category, setCategory] = useState<string>(user.default_category || 'Food');
  const [date, setDate] = useState<string>(new Date().toISOString().substring(0, 10));
  const [description, setDescription] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<string>('UPI');
  const [loading, setLoading] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg(null);
    setErrorMsg(null);

    const numAmt = parseFloat(amount);
    if (isNaN(numAmt) || numAmt <= 0) {
      setErrorMsg('Please enter a valid amount greater than zero.');
      return;
    }

    try {
      setLoading(true);
      await onAddExpense({
        user_id: user.user_id,
        amount: numAmt,
        category,
        date,
        description: description.trim() || category,
        payment_method: paymentMethod,
      });

      setSuccessMsg(`Successfully recorded ${currency}${numAmt.toLocaleString('en-IN')} under ${category}!`);
      setDescription('');
      setAmount('150');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save expense');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in duration-300">
      <div>
        <h2 className="text-2xl font-bold text-white light:text-slate-900">Record New Expense</h2>
        <p className="text-sm text-[#cbc3d7] light:text-slate-500">
          Enter expense details to update your budget tracker and analytics.
        </p>
      </div>

      <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-white/10">
        {successMsg && (
          <div className="mb-6 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Amount */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#cbc3d7] light:text-slate-600 mb-2">
              Amount ({currency}) *
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-lg text-[#d0bcff]">
                {currency}
              </span>
              <input
                type="number"
                step="0.01"
                min="1"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="150.00"
                className="w-full bg-black/20 light:bg-slate-100 border border-white/10 light:border-slate-300 rounded-2xl pl-10 pr-4 py-3.5 text-white light:text-slate-900 font-bold text-lg focus:outline-none focus:border-[#d0bcff] transition-colors"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Category */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#cbc3d7] light:text-slate-600 mb-2">
                Category *
              </label>
              <div className="relative">
                <Tag className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#cbc3d7]" />
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-[#171f33] light:bg-slate-100 border border-white/10 light:border-slate-300 rounded-2xl pl-11 pr-4 py-3.5 text-white light:text-slate-900 text-sm font-semibold focus:outline-none focus:border-[#d0bcff]"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat} className="bg-[#171f33] text-white">
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Payment Method */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#cbc3d7] light:text-slate-600 mb-2">
                Payment Method *
              </label>
              <div className="relative">
                <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#cbc3d7]" />
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full bg-[#171f33] light:bg-slate-100 border border-white/10 light:border-slate-300 rounded-2xl pl-11 pr-4 py-3.5 text-white light:text-slate-900 text-sm font-semibold focus:outline-none focus:border-[#d0bcff]"
                >
                  {PAYMENT_METHODS.map((pm) => (
                    <option key={pm} value={pm} className="bg-[#171f33] text-white">
                      {pm}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Date */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#cbc3d7] light:text-slate-600 mb-2">
                Date *
              </label>
              <div className="relative">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#cbc3d7]" />
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-black/20 light:bg-slate-100 border border-white/10 light:border-slate-300 rounded-2xl pl-11 pr-4 py-3.5 text-white light:text-slate-900 text-sm font-semibold focus:outline-none focus:border-[#d0bcff]"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#cbc3d7] light:text-slate-600 mb-2">
                Description / Notes
              </label>
              <div className="relative">
                <FileText className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#cbc3d7]" />
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Lunch at college mess"
                  className="w-full bg-black/20 light:bg-slate-100 border border-white/10 light:border-slate-300 rounded-2xl pl-11 pr-4 py-3.5 text-white light:text-slate-900 text-sm font-medium focus:outline-none focus:border-[#d0bcff]"
                />
              </div>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#d0bcff] to-[#ffb0cd] text-[#3c0091] font-bold text-base shadow-[0_0_20px_rgba(208,188,255,0.4)] hover:shadow-[0_0_30px_rgba(208,188,255,0.6)] transition-all duration-300 flex items-center justify-center gap-2 pt-3"
          >
            <PlusCircle className="w-5 h-5" />
            <span>{loading ? 'Saving...' : 'Add Expense Now'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};
