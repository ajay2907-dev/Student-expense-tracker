import React, { useState, useEffect, useRef } from 'react';
import {
  PlusCircle,
  Calendar,
  Tag,
  CreditCard,
  FileText,
  CheckCircle2,
  Sparkles,
  Loader2,
  Check,
  Zap,
} from 'lucide-react';
import { User, Expense } from '../../types';
import { api, CategorySuggestionResponse } from '../../lib/api';

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

const QUICK_MERCHANT_EXAMPLES = [
  { label: '☕ Starbucks Cafe', text: 'Starbucks Coffee' },
  { label: '🚕 Uber to Campus', text: 'Uber ride to college campus' },
  { label: '📚 Amazon Textbook', text: 'Algorithms & Data Structures Textbook' },
  { label: '🎬 Netflix Subscription', text: 'Netflix Standard Monthly' },
  { label: '🍔 Swiggy Mess Delivery', text: 'Swiggy Dinner Canteen delivery' },
  { label: '📱 Jio 5G Recharge', text: 'Jio Mobile 5G Monthly Plan' },
];

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

  // AI Category Suggestion State
  const [isSuggesting, setIsSuggesting] = useState<boolean>(false);
  const [aiSuggestion, setAiSuggestion] = useState<CategorySuggestionResponse | null>(null);
  const [userManuallySelectedCategory, setUserManuallySelectedCategory] = useState<boolean>(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Request category suggestion from server-side Gemini API
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

      // If user hasn't deliberately clicked a manual override (or if this is an explicit trigger),
      // auto-select the suggested category!
      if (!userManuallySelectedCategory || isManual) {
        setCategory(res.category);
        setUserManuallySelectedCategory(false);
      }
    } catch (err) {
      console.warn('AI category suggestion error:', err);
    } finally {
      setIsSuggesting(false);
    }
  };

  // Debounced auto-suggestion when user types merchant or description
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    const trimmed = description.trim();
    if (trimmed.length >= 3) {
      debounceTimerRef.current = setTimeout(() => {
        fetchCategorySuggestion(trimmed, false);
      }, 500);
    } else {
      setAiSuggestion(null);
    }

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [description]);

  const handleApplySuggestion = (cat: string) => {
    setCategory(cat);
    setUserManuallySelectedCategory(false);
  };

  const handleSelectCategoryManual = (cat: string) => {
    setCategory(cat);
    setUserManuallySelectedCategory(true);
  };

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
      setAiSuggestion(null);
      setUserManuallySelectedCategory(false);
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
          Enter merchant or transaction details. Gemini AI automatically suggests and assigns the category.
        </p>
      </div>

      <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-white/10 shadow-xl">
        {successMsg && (
          <div className="mb-6 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm flex items-center gap-3 animate-in fade-in">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm animate-in fade-in">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Merchant / Description Input with AI Suggestion Button */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold uppercase tracking-wider text-[#cbc3d7] light:text-slate-600">
                Merchant / Description *
              </label>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-[#d0bcff]">
                <Sparkles className="w-3.5 h-3.5" />
                <span>AI Auto-Categorization</span>
              </div>
            </div>

            <div className="relative">
              <FileText className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#cbc3d7]" />
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Starbucks, Uber to college, Amazon CS book, Netflix"
                required
                className="w-full bg-black/20 light:bg-slate-100 border border-white/10 light:border-slate-300 rounded-2xl pl-11 pr-28 py-3.5 text-white light:text-slate-900 text-sm font-medium focus:outline-none focus:border-[#d0bcff] transition-all"
              />
              <button
                type="button"
                onClick={() => fetchCategorySuggestion(description, true)}
                disabled={isSuggesting || description.trim().length < 2}
                className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-xl bg-[#d0bcff]/20 hover:bg-[#d0bcff]/30 text-[#d0bcff] text-xs font-bold flex items-center gap-1.5 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                title="Ask Gemini AI to suggest category"
              >
                {isSuggesting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Analyzing...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Suggest</span>
                  </>
                )}
              </button>
            </div>

            {/* Quick Test Chips */}
            <div className="pt-1">
              <span className="text-[11px] text-[#cbc3d7]/80 light:text-slate-400 mr-2">Try examples:</span>
              <div className="inline-flex flex-wrap gap-1.5 mt-1">
                {QUICK_MERCHANT_EXAMPLES.map((ex) => (
                  <button
                    key={ex.text}
                    type="button"
                    onClick={() => {
                      setDescription(ex.text);
                      fetchCategorySuggestion(ex.text, true);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 text-[11px] text-[#dae2fd] light:text-slate-700 hover:text-white transition-colors"
                  >
                    {ex.label}
                  </button>
                ))}
              </div>
            </div>

            {/* AI Suggestion Feedback Pill */}
            {isSuggesting && (
              <div className="p-3 rounded-2xl bg-[#d0bcff]/10 border border-[#d0bcff]/20 text-[#d0bcff] text-xs flex items-center gap-2.5 animate-pulse">
                <Loader2 className="w-4 h-4 animate-spin shrink-0 text-[#d0bcff]" />
                <span>Gemini is analyzing the merchant and transaction details...</span>
              </div>
            )}

            {!isSuggesting && aiSuggestion && (
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-[#d0bcff]/15 to-[#ffb0cd]/10 border border-[#d0bcff]/30 flex flex-wrap items-center justify-between gap-2 animate-in fade-in slide-in-from-top-1">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-xl bg-[#d0bcff]/25 flex items-center justify-center text-[#d0bcff] shrink-0">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white light:text-slate-900">
                        Suggested: <span className="text-[#d0bcff] font-extrabold">{aiSuggestion.category}</span>
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/10 text-[#cbc3d7] font-medium">
                        {Math.round(aiSuggestion.confidence * 100)}% match
                      </span>
                      {aiSuggestion.source === 'gemini' && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#d0bcff]/20 text-[#d0bcff] font-bold">
                          Gemini AI
                        </span>
                      )}
                    </div>
                    {aiSuggestion.reason && (
                      <p className="text-[11px] text-[#cbc3d7] light:text-slate-600 mt-0.5">
                        {aiSuggestion.reason}
                      </p>
                    )}
                  </div>
                </div>

                {category === aiSuggestion.category ? (
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 rounded-xl">
                    <Check className="w-3.5 h-3.5" />
                    Applied
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleApplySuggestion(aiSuggestion.category)}
                    className="px-3 py-1 rounded-xl bg-[#d0bcff] hover:bg-[#d0bcff]/90 text-[#3c0091] text-xs font-bold transition-all shadow-sm flex items-center gap-1"
                  >
                    <Zap className="w-3 h-3" />
                    Apply {aiSuggestion.category}
                  </button>
                )}
              </div>
            )}
          </div>

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

          {/* Category Selection with Interactive Pill Chips */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold uppercase tracking-wider text-[#cbc3d7] light:text-slate-600">
                Category *
              </label>
              {category && (
                <span className="text-xs text-[#d0bcff] font-semibold">
                  Selected: <strong>{category}</strong>
                </span>
              )}
            </div>

            <div className="relative">
              <Tag className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#cbc3d7]" />
              <select
                value={category}
                onChange={(e) => handleSelectCategoryManual(e.target.value)}
                className="w-full bg-[#171f33] light:bg-slate-100 border border-white/10 light:border-slate-300 rounded-2xl pl-11 pr-4 py-3.5 text-white light:text-slate-900 text-sm font-semibold focus:outline-none focus:border-[#d0bcff]"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat} className="bg-[#171f33] text-white">
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Visual Category Pills */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {CATEGORIES.map((cat) => {
                const isSelected = category === cat;
                const isSuggested = aiSuggestion?.category === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => handleSelectCategoryManual(cat)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-[#d0bcff] text-[#3c0091] shadow-md scale-105 font-bold'
                        : isSuggested
                        ? 'bg-[#d0bcff]/20 text-[#d0bcff] border border-[#d0bcff]/40 hover:bg-[#d0bcff]/30'
                        : 'bg-white/5 text-[#dae2fd] light:text-slate-700 hover:bg-white/10 border border-white/5'
                    }`}
                  >
                    {isSuggested && !isSelected && <Sparkles className="w-3 h-3 text-[#d0bcff]" />}
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
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
          </div>

          {/* Submit Button */}
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
