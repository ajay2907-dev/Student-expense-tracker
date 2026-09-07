import React, { useState, useEffect, useRef } from 'react';
import { X, PlusCircle, Calendar, Tag, CreditCard, FileText, Sparkles, Loader2, Check } from 'lucide-react';
import { User, Expense } from '../types';
import { api, CategorySuggestionResponse } from '../lib/api';

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

  // AI Suggestion State
  const [isSuggesting, setIsSuggesting] = useState<boolean>(false);
  const [aiSuggestion, setAiSuggestion] = useState<CategorySuggestionResponse | null>(null);
  const [userManuallySelectedCategory, setUserManuallySelectedCategory] = useState<boolean>(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const fetchCategorySuggestion = async (textToAnalyze: string, isManual = false) => {
    const trimmed = textToAnalyze.trim();
    if (trimmed.length < 3) {
      setAiSuggestion(null);
      return;
    }

    try {
      setIsSuggesting(true);
      const res = await api.suggestCategory(trimmed);
      setAiSuggestion(res);

      if (!userManuallySelectedCategory || isManual) {
        setCategory(res.category);
        setUserManuallySelectedCategory(false);
      }
    } catch (err) {
      console.warn('AI suggestion error in quick add:', err);
    } finally {
      setIsSuggesting(false);
    }
  };

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    const trimmed = description.trim();
    if (trimmed.length >= 3) {
      debounceRef.current = setTimeout(() => {
        fetchCategorySuggestion(trimmed, false);
      }, 500);
    } else {
      setAiSuggestion(null);
    }

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [description]);

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
          {/* Merchant / Description */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold uppercase text-[#cbc3d7]">
                Merchant / Description *
              </label>
              <div className="flex items-center gap-1 text-[11px] text-[#d0bcff] font-semibold">
                <Sparkles className="w-3 h-3" />
                <span>AI Auto-Category</span>
              </div>
            </div>
            <div className="relative">
              <input
                type="text"
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Starbucks, Uber ride, Amazon book"
                className="w-full bg-black/20 light:bg-slate-100 border border-white/10 rounded-2xl px-4 py-2.5 pr-20 text-white light:text-slate-900 text-xs font-medium focus:outline-none focus:border-[#d0bcff]"
              />
              <button
                type="button"
                onClick={() => fetchCategorySuggestion(description, true)}
                disabled={isSuggesting || description.trim().length < 2}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-xl bg-[#d0bcff]/20 text-[#d0bcff] hover:bg-[#d0bcff]/30 text-[10px] font-bold flex items-center gap-1 transition-all disabled:opacity-40"
              >
                {isSuggesting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                <span>Suggest</span>
              </button>
            </div>

            {/* Live AI Suggestion Banner */}
            {aiSuggestion && (
              <div className="mt-2 p-2.5 rounded-xl bg-[#d0bcff]/15 border border-[#d0bcff]/30 flex items-center justify-between text-xs animate-in fade-in">
                <div className="flex items-center gap-1.5 overflow-hidden">
                  <Sparkles className="w-3.5 h-3.5 text-[#d0bcff] shrink-0" />
                  <span className="text-white text-[11px] truncate">
                    AI Suggestion: <strong className="text-[#d0bcff]">{aiSuggestion.category}</strong>
                  </span>
                </div>
                {category === aiSuggestion.category ? (
                  <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1 shrink-0">
                    <Check className="w-3 h-3" /> Applied
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setCategory(aiSuggestion.category);
                      setUserManuallySelectedCategory(false);
                    }}
                    className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-[#d0bcff] text-[#3c0091] shrink-0"
                  >
                    Apply
                  </button>
                )}
              </div>
            )}
          </div>

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
              className="w-full bg-black/20 light:bg-slate-100 border border-white/10 rounded-2xl px-4 py-2.5 text-white light:text-slate-900 font-bold text-base focus:outline-none focus:border-[#d0bcff]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase text-[#cbc3d7] mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => {
                  setCategory(e.target.value);
                  setUserManuallySelectedCategory(true);
                }}
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
            <label className="block text-xs font-bold uppercase text-[#cbc3d7] mb-1">Date</label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-black/20 light:bg-slate-100 border border-white/10 rounded-2xl px-3 py-2 text-white light:text-slate-900 text-xs focus:outline-none focus:border-[#d0bcff]"
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
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#d0bcff] to-[#ffb0cd] text-[#3c0091] font-bold text-xs shadow-md hover:shadow-lg transition-all"
            >
              {loading ? 'Saving...' : 'Add Expense'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
