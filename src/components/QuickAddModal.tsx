import React, { useState } from 'react';
import { X, PlusCircle, Calendar, Tag, CreditCard, FileText } from 'lucide-react';
import { User, Expense } from '../types';

interface QuickAddModalProps {
  user: User;
  onClose: () => void;
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

export const QuickAddModal: React.FC<QuickAddModalProps> = ({ user, onClose, onAddExpense }) => {
  const currency = user.currency || '₹';

  const [amount, setAmount] = useState<string>('120');
  const [category, setCategory] = useState<string>(user.default_category || 'Food');
  const [date, setDate] = useState<string>(new Date().toISOString().substring(0, 10));
  const [description, setDescription] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<string>('UPI');
  const [loading, setLoading] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmt = parseFloat(amount);
    if (isNaN(numAmt) || numAmt <= 0) return;

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
      onClose();
    } catch (err: any) {
      alert(err.message || 'Failed to add expense');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in">
      <div className="glass-panel light:bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full border border-white/10 shadow-2xl space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <PlusCircle className="w-5 h-5 text-[#d0bcff]" />
            <h3 className="text-lg font-bold text-white light:text-slate-900">Quick Add Expense</h3>
          </div>
          <button onClick={onClose} className="p-1 text-[#cbc3d7] hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase text-[#cbc3d7] mb-1">
              Amount ({currency}) *
            </label>
            <input
              type="number"
              step="0.01"
              min="1"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="120.00"
              className="w-full bg-black/20 light:bg-slate-100 border border-white/10 rounded-2xl px-4 py-3 text-white light:text-slate-900 font-bold text-lg focus:outline-none focus:border-[#d0bcff]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase text-[#cbc3d7] mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-[#171f33] light:bg-slate-100 border border-white/10 rounded-2xl px-3 py-2.5 text-white light:text-slate-900 text-xs font-semibold focus:outline-none focus:border-[#d0bcff]"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-[#cbc3d7] mb-1">Payment Channel</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full bg-[#171f33] light:bg-slate-100 border border-white/10 rounded-2xl px-3 py-2.5 text-white light:text-slate-900 text-xs font-semibold focus:outline-none focus:border-[#d0bcff]"
              >
                {PAYMENT_METHODS.map((pm) => (
                  <option key={pm} value={pm}>
                    {pm}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-[#cbc3d7] mb-1">Description</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Canteen snack"
              className="w-full bg-black/20 light:bg-slate-100 border border-white/10 rounded-2xl px-4 py-2.5 text-white light:text-slate-900 text-xs focus:outline-none focus:border-[#d0bcff]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-[#cbc3d7] mb-1">Date</label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-black/20 light:bg-slate-100 border border-white/10 rounded-2xl px-3 py-2.5 text-white light:text-slate-900 text-xs focus:outline-none focus:border-[#d0bcff]"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-[#cbc3d7] hover:bg-white/10 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#d0bcff] to-[#ffb0cd] text-[#3c0091] font-bold text-xs shadow-md"
            >
              {loading ? 'Saving...' : 'Add Expense'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
