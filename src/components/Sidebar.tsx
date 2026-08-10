import React from 'react';
import {
  LayoutDashboard,
  PlusCircle,
  ReceiptText,
  BarChart3,
  Wallet,
  Target,
  FileSpreadsheet,
  Bell,
  User,
  Settings,
  LogOut,
  TrendingUp
} from 'lucide-react';
import { ActiveTab, User as UserType } from '../types';

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onOpenQuickAdd: () => void;
  user: UserType | null;
  onLogout: () => void;
  unreadCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  onOpenQuickAdd,
  user,
  onLogout,
  unreadCount,
}) => {
  const navItems: { id: ActiveTab; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
    { id: 'add_expense', label: 'Add Expense', icon: <PlusCircle className="w-5 h-5" /> },
    { id: 'expense_history', label: 'Transactions', icon: <ReceiptText className="w-5 h-5" /> },
    { id: 'analytics', label: 'Analytics', icon: <BarChart3 className="w-5 h-5" /> },
    { id: 'budget', label: 'Budgets', icon: <Wallet className="w-5 h-5" /> },
    { id: 'savings_goals', label: 'Savings Goals', icon: <Target className="w-5 h-5" /> },
    { id: 'comparison', label: 'Comparison', icon: <TrendingUp className="w-5 h-5" /> },
    { id: 'reports', label: 'Reports', icon: <FileSpreadsheet className="w-5 h-5" /> },
    { id: 'notifications', label: 'Notifications', icon: <Bell className="w-5 h-5" />, badge: unreadCount },
    { id: 'profile', label: 'Profile', icon: <User className="w-5 h-5" /> },
    { id: 'settings', label: 'Settings', icon: <Settings className="w-5 h-5" /> },
  ];

  return (
    <aside className="hidden lg:flex h-screen w-64 fixed left-0 top-0 bg-[#0b1326]/60 dark:bg-[#0b1326]/60 light:bg-white/70 backdrop-blur-[20px] border-r border-white/10 light:border-slate-200/80 shadow-[0_0_20px_rgba(208,188,255,0.08)] flex-col py-6 z-40 transition-all duration-300">
      {/* Brand Header */}
      <div className="px-6 mb-6 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#d0bcff] to-[#ffb0cd] flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(208,188,255,0.4)]">
          <Wallet className="w-5 h-5 text-[#3c0091]" />
        </div>
        <div>
          <h1 className="font-bold text-xl text-[#d0bcff] light:text-[#6d3bd7] tracking-tight">ExpenseFlow</h1>
          <p className="text-xs text-[#cbc3d7] light:text-slate-500 font-medium">Student Edition</p>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 ${
                isActive
                  ? 'bg-white/10 dark:bg-white/10 light:bg-purple-100/80 text-[#d0bcff] light:text-[#6d3bd7] font-semibold border-r-2 border-[#d0bcff] light:border-[#6d3bd7] shadow-[0_2px_10px_rgba(208,188,255,0.15)]'
                  : 'text-[#cbc3d7] light:text-slate-600 hover:bg-white/5 light:hover:bg-slate-100 hover:text-white light:hover:text-slate-900'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className={isActive ? 'text-[#d0bcff] light:text-[#6d3bd7]' : 'text-[#cbc3d7] light:text-slate-400'}>
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </div>
              {item.badge && item.badge > 0 ? (
                <span className="bg-[#ffb0cd] text-[#640039] text-xs font-bold px-2 py-0.5 rounded-full">
                  {item.badge}
                </span>
              ) : null}
            </button>
          );
        })}
      </nav>

      {/* Quick Add & User Section */}
      <div className="px-4 mt-auto space-y-3 pt-3 border-t border-white/10 light:border-slate-200/80">
        <button
          onClick={onOpenQuickAdd}
          className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#d0bcff] to-[#ffb0cd] text-[#3c0091] font-bold text-sm shadow-[0_0_15px_rgba(208,188,255,0.35)] hover:shadow-[0_0_25px_rgba(208,188,255,0.55)] transition-all duration-300 flex items-center justify-center gap-2 active:scale-95"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Quick Add Expense</span>
        </button>

        {user && (
          <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-white/5 light:bg-slate-100/80 border border-white/5 light:border-slate-200">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 text-white font-bold text-xs flex items-center justify-center shrink-0">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-white light:text-slate-800 truncate">{user.name}</p>
                <p className="text-[10px] text-[#cbc3d7] light:text-slate-500 truncate">{user.email}</p>
              </div>
            </div>
            <button
              onClick={onLogout}
              title="Logout"
              className="p-1.5 text-[#cbc3d7] hover:text-[#ffb4ab] hover:bg-white/10 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
};
