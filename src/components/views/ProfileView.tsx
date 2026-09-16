import React, { useState } from 'react';
import { User as UserIcon, Mail, DollarSign, Tag, Save, CheckCircle2 } from 'lucide-react';
import { User } from '../../types';

interface ProfileViewProps {
  user: User;
  onUpdateUserSettings: (settings: Partial<User>) => Promise<void>;
}

export const ProfileView: React.FC<ProfileViewProps> = ({ user, onUpdateUserSettings }) => {
  const [name, setName] = useState<string>(user.name);
  const [email, setEmail] = useState<string>(user.email);
  const [currency, setCurrency] = useState<string>(user.currency || '₹');
  const [defaultCategory, setDefaultCategory] = useState<string>(user.default_category || 'Food');
  const [loading, setLoading] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      await onUpdateUserSettings({
        name,
        email,
        currency,
        default_category: defaultCategory,
      });
      setSuccessMsg('Profile updated successfully!');
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      alert(err.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 max-w-2xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold text-white light:text-slate-900">User Profile</h2>
        <p className="text-sm text-[#cbc3d7] light:text-slate-500">
          Manage your account profile, email credentials, and preference defaults.
        </p>
      </div>

      <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-white/10 space-y-6">
        {/* Avatar header */}
        <div className="flex items-center gap-4 pb-6 border-b border-white/10 light:border-slate-200">
          <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-[#d0bcff] to-[#ffb0cd] text-[#3c0091] font-extrabold text-2xl flex items-center justify-center shadow-lg">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h3 className="font-bold text-lg text-white light:text-slate-900">{user.name}</h3>
            <p className="text-xs text-[#cbc3d7] light:text-slate-500">{user.email}</p>
            <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 light:bg-emerald-50 text-emerald-400 light:text-emerald-700 text-[10px] font-bold border border-emerald-500/20 light:border-emerald-200">
              Active Account
            </span>
          </div>
        </div>

        {successMsg && (
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase text-[#cbc3d7] light:text-slate-600 mb-1">Full Name</label>
            <div className="relative">
              <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#cbc3d7] light:text-slate-500" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-black/20 light:bg-slate-100 border border-white/10 light:border-slate-300 rounded-2xl pl-11 pr-4 py-3 text-white light:text-slate-900 font-medium text-sm focus:outline-none focus:border-[#d0bcff]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-[#cbc3d7] light:text-slate-600 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#cbc3d7] light:text-slate-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-black/20 light:bg-slate-100 border border-white/10 light:border-slate-300 rounded-2xl pl-11 pr-4 py-3 text-white light:text-slate-900 font-medium text-sm focus:outline-none focus:border-[#d0bcff]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase text-[#cbc3d7] light:text-slate-600 mb-1">Currency Symbol</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full bg-[#171f33] light:bg-slate-100 border border-white/10 light:border-slate-300 rounded-2xl px-4 py-3 text-white light:text-slate-900 font-bold text-sm focus:outline-none focus:border-[#d0bcff]"
              >
                <option value="₹">₹ - Indian Rupee (INR)</option>
                <option value="$">$ - US Dollar (USD)</option>
                <option value="€">€ - Euro (EUR)</option>
                <option value="£">£ - British Pound (GBP)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-[#cbc3d7] light:text-slate-600 mb-1">Default Expense Category</label>
              <select
                value={defaultCategory}
                onChange={(e) => setDefaultCategory(e.target.value)}
                className="w-full bg-[#171f33] light:bg-slate-100 border border-white/10 light:border-slate-300 rounded-2xl px-4 py-3 text-white light:text-slate-900 font-semibold text-sm focus:outline-none focus:border-[#d0bcff]"
              >
                <option value="Food">Food</option>
                <option value="Transportation">Transportation</option>
                <option value="Education">Education</option>
                <option value="Shopping">Shopping</option>
                <option value="Entertainment">Entertainment</option>
                <option value="Personal">Personal</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#d0bcff] to-[#ffb0cd] text-[#3c0091] font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 pt-3 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{loading ? 'Updating...' : 'Save Profile Changes'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};
