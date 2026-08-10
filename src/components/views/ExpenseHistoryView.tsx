import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  ArrowUpDown,
  Edit2,
  Trash2,
  Calendar,
  X,
  CreditCard,
  Download,
  Receipt
} from 'lucide-react';
import { User, Expense, DateRangePreset } from '../../types';
import { formatCurrency } from '../../lib/api';
import { filterExpensesByPreset } from '../../lib/dateUtils';
import { ConfirmModal } from '../ConfirmModal';

interface ExpenseHistoryViewProps {
  user: User;
  expenses: Expense[];
  onUpdateExpense: (expenseId: string, updated: Partial<Expense>) => Promise<void>;
  onDeleteExpense: (expenseId: string) => Promise<void>;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
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

export const ExpenseHistoryView: React.FC<ExpenseHistoryViewProps> = ({
  user,
  expenses,
  onUpdateExpense,
  onDeleteExpense,
  searchQuery,
  setSearchQuery,
}) => {
  const currency = user.currency || '₹';

  // Filter & Sort States
  const [preset, setPreset] = useState<DateRangePreset>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedPayment, setSelectedPayment] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc'>('date-desc');
  const [customStart, setCustomStart] = useState<string>('');
  const [customEnd, setCustomEnd] = useState<string>('');

  // Modals
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Date Presets
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

  // Search by Description, Category, Payment Method, AND Amount
  const filteredExpenses = useMemo(() => {
    const timeFiltered = filterExpensesByPreset(expenses, preset, customStart, customEnd);

    return timeFiltered
      .filter((e) => {
        const query = searchQuery.trim().toLowerCase();
        let matchesSearch = true;
        if (query) {
          const matchDesc = (e.description || '').toLowerCase().includes(query);
          const matchCat = (e.category || '').toLowerCase().includes(query);
          const matchPay = (e.payment_method || '').toLowerCase().includes(query);
          const matchAmt = String(e.amount).includes(query);
          matchesSearch = matchDesc || matchCat || matchPay || matchAmt;
        }

        const matchesCat = selectedCategory === 'All' || e.category === selectedCategory;
        const matchesPay = selectedPayment === 'All' || e.payment_method === selectedPayment;

        return matchesSearch && matchesCat && matchesPay;
      })
      .sort((a, b) => {
        if (sortBy === 'date-desc') return new Date(b.date).getTime() - new Date(a.date).getTime();
        if (sortBy === 'date-asc') return new Date(a.date).getTime() - new Date(a.date).getTime();
        if (sortBy === 'amount-desc') return b.amount - a.amount;
        if (sortBy === 'amount-asc') return a.amount - b.amount;
        return 0;
      });
  }, [expenses, preset, customStart, customEnd, searchQuery, selectedCategory, selectedPayment, sortBy]);

  // Export CSV
  const handleExportCSV = () => {
    if (filteredExpenses.length === 0) return;
    const headers = ['Expense ID', 'Date', 'Description', 'Category', 'Payment Method', 'Amount'];
    const rows = filteredExpenses.map((e) => [
      e.expense_id,
      e.date,
      `"${(e.description || '').replace(/"/g, '""')}"`,
      e.category,
      e.payment_method,
      e.amount,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Expense_History_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSaveEdit = async () => {
    if (!editingExpense) return;
    try {
      await onUpdateExpense(editingExpense.expense_id, {
        amount: Number(editingExpense.amount),
        category: editingExpense.category,
        date: editingExpense.date,
        description: editingExpense.description,
        payment_method: editingExpense.payment_method,
      });
      setEditingExpense(null);
    } catch (err: any) {
      alert(err.message || 'Failed to update expense');
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingId) return;
    try {
      await onDeleteExpense(deletingId);
      setDeletingId(null);
    } catch (err: any) {
      alert(err.message || 'Failed to delete expense');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white light:text-slate-900">Expense History</h2>
          <p className="text-sm text-[#cbc3d7] light:text-slate-500">
            View, search, filter, edit, or remove your recorded transactions.
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          disabled={filteredExpenses.length === 0}
          className="px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs flex items-center gap-2 border border-white/10 transition-colors disabled:opacity-40 self-start sm:self-auto"
        >
          <Download className="w-4 h-4 text-[#d0bcff]" />
          <span>Export CSV</span>
        </button>
      </div>

      {/* Date Range Presets */}
      <div className="glass-panel rounded-2xl p-4 flex flex-wrap items-center gap-2 border border-white/10">
        <span className="text-xs font-bold text-[#cbc3d7] flex items-center gap-1 mr-2">
          <Calendar className="w-4 h-4 text-[#d0bcff]" /> Quick Timeframe:
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

      {/* Search & Filter Controls */}
      <div className="glass-panel rounded-3xl p-5 space-y-4 border border-white/10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search by Description, Category, Payment Method, Amount */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#cbc3d7]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search description, category, method, or amount..."
              className="w-full bg-black/20 light:bg-slate-100 border border-white/10 light:border-slate-300 rounded-xl pl-10 pr-3 py-2.5 text-xs font-medium text-white light:text-slate-900 focus:outline-none focus:border-[#d0bcff]"
            />
          </div>

          {/* Category Filter */}
          <div className="relative">
            <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#cbc3d7]" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full bg-[#171f33] light:bg-slate-100 border border-white/10 light:border-slate-300 rounded-xl pl-10 pr-3 py-2.5 text-xs font-semibold text-white light:text-slate-900 focus:outline-none focus:border-[#d0bcff]"
            >
              <option value="All">All Categories</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c} className="bg-[#171f33] text-white">
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Payment Method Filter */}
          <div className="relative">
            <CreditCard className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#cbc3d7]" />
            <select
              value={selectedPayment}
              onChange={(e) => setSelectedPayment(e.target.value)}
              className="w-full bg-[#171f33] light:bg-slate-100 border border-white/10 light:border-slate-300 rounded-xl pl-10 pr-3 py-2.5 text-xs font-semibold text-white light:text-slate-900 focus:outline-none focus:border-[#d0bcff]"
            >
              <option value="All">All Payment Channels</option>
              {PAYMENT_METHODS.map((pm) => (
                <option key={pm} value={pm} className="bg-[#171f33] text-white">
                  {pm}
                </option>
              ))}
            </select>
          </div>

          {/* Sorting */}
          <div className="relative">
            <ArrowUpDown className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#cbc3d7]" />
            <select
              value={sortBy}
              onChange={(e: any) => setSortBy(e.target.value)}
              className="w-full bg-[#171f33] light:bg-slate-100 border border-white/10 light:border-slate-300 rounded-xl pl-10 pr-3 py-2.5 text-xs font-semibold text-white light:text-slate-900 focus:outline-none focus:border-[#d0bcff]"
            >
              <option value="date-desc" className="bg-[#171f33] text-white">
                Newest Date First
              </option>
              <option value="date-asc" className="bg-[#171f33] text-white">
                Oldest Date First
              </option>
              <option value="amount-desc" className="bg-[#171f33] text-white">
                Highest Amount
              </option>
              <option value="amount-asc" className="bg-[#171f33] text-white">
                Lowest Amount
              </option>
            </select>
          </div>
        </div>

        {(preset !== 'all' || selectedCategory !== 'All' || selectedPayment !== 'All' || searchQuery) && (
          <div className="flex justify-end pt-2 border-t border-white/5">
            <button
              onClick={() => {
                setPreset('all');
                setSelectedCategory('All');
                setSelectedPayment('All');
                setSearchQuery('');
                setCustomStart('');
                setCustomEnd('');
              }}
              className="text-xs text-[#d0bcff] hover:underline font-bold"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>

      {/* Table Container */}
      <div className="glass-panel rounded-3xl overflow-hidden border border-white/10">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/5 light:bg-slate-100 text-[#cbc3d7] light:text-slate-600 text-xs font-bold uppercase tracking-wider border-b border-white/10 light:border-slate-200">
                <th className="p-4 pl-6">Date</th>
                <th className="p-4">Description</th>
                <th className="p-4">Category</th>
                <th className="p-4">Payment Method</th>
                <th className="p-4 text-right">Amount</th>
                <th className="p-4 pr-6 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 light:divide-slate-200 text-sm">
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-[#cbc3d7] light:text-slate-500 text-sm">
                    No matching expense records found.
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((exp) => (
                  <tr key={exp.expense_id} className="hover:bg-white/5 light:hover:bg-slate-50 transition-colors">
                    <td className="p-4 pl-6 font-semibold text-white light:text-slate-800 whitespace-nowrap">
                      {exp.date}
                    </td>
                    <td className="p-4 font-medium text-white light:text-slate-900">
                      {exp.description || exp.category}
                    </td>
                    <td className="p-4">
                      <span className="px-2.5 py-1 rounded-full bg-white/10 light:bg-purple-100 text-xs font-bold text-[#d0bcff] light:text-purple-700">
                        {exp.category}
                      </span>
                    </td>
                    <td className="p-4 text-xs font-medium text-[#cbc3d7] light:text-slate-600">
                      {exp.payment_method}
                    </td>
                    <td className="p-4 text-right font-bold text-white light:text-slate-900 whitespace-nowrap">
                      -{formatCurrency(exp.amount, currency)}
                    </td>
                    <td className="p-4 pr-6 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => setEditingExpense(exp)}
                          title="Edit"
                          className="p-1.5 text-[#d0bcff] hover:bg-white/10 rounded-lg transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeletingId(exp.expense_id)}
                          title="Delete"
                          className="p-1.5 text-rose-400 hover:bg-white/10 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      {editingExpense && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in">
          <div className="glass-panel light:bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full border border-white/10 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="text-lg font-bold text-white light:text-slate-900">Edit Expense</h3>
              <button onClick={() => setEditingExpense(null)} className="p-1 text-[#cbc3d7] hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-[#cbc3d7] mb-1">Amount ({currency})</label>
                <input
                  type="number"
                  step="0.01"
                  value={editingExpense.amount}
                  onChange={(e) => setEditingExpense({ ...editingExpense, amount: Number(e.target.value) })}
                  className="w-full bg-black/20 light:bg-slate-100 border border-white/10 rounded-xl px-4 py-2.5 text-white font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-[#cbc3d7] mb-1">Category</label>
                <select
                  value={editingExpense.category}
                  onChange={(e) => setEditingExpense({ ...editingExpense, category: e.target.value })}
                  className="w-full bg-[#171f33] light:bg-slate-100 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-[#cbc3d7] mb-1">Description</label>
                <input
                  type="text"
                  value={editingExpense.description}
                  onChange={(e) => setEditingExpense({ ...editingExpense, description: e.target.value })}
                  className="w-full bg-black/20 light:bg-slate-100 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-[#cbc3d7] mb-1">Date</label>
                  <input
                    type="date"
                    value={editingExpense.date}
                    onChange={(e) => setEditingExpense({ ...editingExpense, date: e.target.value })}
                    className="w-full bg-black/20 light:bg-slate-100 border border-white/10 rounded-xl px-3 py-2 text-white text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-[#cbc3d7] mb-1">Payment Method</label>
                  <select
                    value={editingExpense.payment_method}
                    onChange={(e) => setEditingExpense({ ...editingExpense, payment_method: e.target.value })}
                    className="w-full bg-[#171f33] light:bg-slate-100 border border-white/10 rounded-xl px-3 py-2 text-white text-xs"
                  >
                    {PAYMENT_METHODS.map((pm) => (
                      <option key={pm} value={pm}>
                        {pm}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3">
              <button
                onClick={() => setEditingExpense(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-[#cbc3d7] hover:bg-white/10"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#d0bcff] to-[#ffb0cd] text-[#3c0091] font-bold text-xs shadow-md"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(deletingId)}
        title="Delete Expense"
        message="Are you sure you want to delete this expense transaction permanently? This action cannot be undone."
        confirmLabel="Delete Expense"
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeletingId(null)}
      />
    </div>
  );
};
