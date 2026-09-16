import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  LayoutDashboard,
  PlusCircle,
  ReceiptText,
  BarChart3,
  Wallet,
  Target,
  FileSpreadsheet,
  Bell,
  User as UserIcon,
  Settings,
  LogOut,
  TrendingUp,
  X,
  Menu,
  ChevronRight
} from 'lucide-react';
import { ActiveTab, User as UserType } from '../types';

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onOpenQuickAdd: () => void;
  user: UserType | null;
  onLogout: () => void;
  unreadCount: number;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  onOpenQuickAdd,
  user,
  onLogout,
  unreadCount,
  mobileOpen,
  setMobileOpen,
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
    { id: 'profile', label: 'Profile', icon: <UserIcon className="w-5 h-5" /> },
    { id: 'settings', label: 'Settings', icon: <Settings className="w-5 h-5" /> },
  ];

  const handleSelectTab = (tabId: ActiveTab) => {
    setActiveTab(tabId);
    setMobileOpen(false);
  };

  return (
    <>
      {/* ======================================= */}
      {/* 1. DESKTOP SIDEBAR (Visible on lg+)     */}
      {/* ======================================= */}
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
                onClick={() => handleSelectTab(item.id)}
                className={`relative w-full flex items-center justify-between px-4 py-2.5 rounded-xl font-medium text-sm transition-colors duration-150 active:scale-[0.98] ${
                  isActive
                    ? 'text-[#d0bcff] light:text-[#6d3bd7] font-semibold'
                    : 'text-[#cbc3d7] light:text-slate-600 hover:bg-white/5 light:hover:bg-slate-100 hover:text-white light:hover:text-slate-900'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="sidebarActivePill"
                    className="absolute inset-0 rounded-xl bg-white/10 dark:bg-white/10 light:bg-purple-100/90 border-r-2 border-[#d0bcff] light:border-[#6d3bd7] shadow-[0_2px_12px_rgba(208,188,255,0.18)]"
                    transition={{ type: 'spring', stiffness: 480, damping: 35 }}
                  />
                )}
                <div className="relative z-10 flex items-center gap-3">
                  <span className={isActive ? 'text-[#d0bcff] light:text-[#6d3bd7]' : 'text-[#cbc3d7] light:text-slate-400'}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </div>
                {item.badge && item.badge > 0 ? (
                  <span className="relative z-10 bg-[#ffb0cd] text-[#640039] text-xs font-bold px-2 py-0.5 rounded-full">
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
            onClick={() => {
              onOpenQuickAdd();
            }}
            className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#d0bcff] to-[#ffb0cd] text-[#3c0091] font-bold text-sm shadow-[0_0_15px_rgba(208,188,255,0.35)] hover:shadow-[0_0_25px_rgba(208,188,255,0.55)] transition-all duration-300 flex items-center justify-center gap-2 active:scale-95"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Quick Add Expense</span>
          </button>

          {user && (
            <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-white/5 light:bg-slate-100/80 border border-white/5 light:border-slate-200">
              <div
                onClick={() => handleSelectTab('profile')}
                className="flex items-center gap-2 min-w-0 cursor-pointer hover:opacity-80 transition-opacity"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#d0bcff] to-[#ffb0cd] text-[#3c0091] font-bold text-xs flex items-center justify-center shrink-0">
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

      {/* ======================================= */}
      {/* 2. MOBILE OVERLAY DRAWER (Slide-over)   */}
      {/* ======================================= */}
      <AnimatePresence>
        {mobileOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            {/* Backdrop Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 bg-black/75 backdrop-blur-md"
            />

            {/* Drawer Panel */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 360 }}
              className="relative w-80 max-w-[85vw] h-full bg-[#0b1326] dark:bg-[#0b1326] light:bg-white border-r border-white/10 light:border-slate-200 p-5 flex flex-col justify-between overflow-y-auto shadow-2xl z-50"
            >
              {/* Header with Close */}
              <div className="flex items-center justify-between pb-4 border-b border-white/10 light:border-slate-200 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#d0bcff] to-[#ffb0cd] flex items-center justify-center shrink-0">
                    <Wallet className="w-5 h-5 text-[#3c0091]" />
                  </div>
                  <div>
                    <h2 className="font-bold text-lg text-[#d0bcff] light:text-[#6d3bd7]">ExpenseFlow</h2>
                    <p className="text-[10px] text-[#cbc3d7] light:text-slate-500 font-medium">Student Edition</p>
                  </div>
                </div>

                <button
                  onClick={() => setMobileOpen(false)}
                  className="p-2 text-[#cbc3d7] light:text-slate-600 hover:text-white light:hover:text-slate-900 rounded-xl hover:bg-white/10 light:hover:bg-slate-100 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Quick Add Expense CTA */}
              <div className="mb-4">
                <button
                  onClick={() => {
                    setMobileOpen(false);
                    onOpenQuickAdd();
                  }}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#d0bcff] to-[#ffb0cd] text-[#3c0091] font-bold text-sm shadow-md flex items-center justify-center gap-2 active:scale-95 transition-all"
                >
                  <PlusCircle className="w-5 h-5" />
                  <span>Quick Add Expense</span>
                </button>
              </div>

              {/* Full List of Nav Items */}
              <div className="flex-1 space-y-1 overflow-y-auto pr-1">
                <p className="text-[11px] uppercase tracking-wider text-[#cbc3d7] light:text-slate-400 font-bold px-3 mb-2">
                  All Navigation & Features
                </p>

                {navItems.map((item) => {
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleSelectTab(item.id)}
                      className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl font-medium text-sm transition-all duration-150 active:scale-[0.98] ${
                        isActive
                          ? 'bg-[#d0bcff]/20 dark:bg-[#d0bcff]/20 light:bg-purple-100 text-[#d0bcff] light:text-[#6d3bd7] font-bold shadow-sm'
                          : 'text-[#cbc3d7] light:text-slate-700 hover:bg-white/5 light:hover:bg-slate-100'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className={isActive ? 'text-[#d0bcff] light:text-[#6d3bd7]' : 'text-[#cbc3d7] light:text-slate-400'}>
                          {item.icon}
                        </span>
                        <span>{item.label}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        {item.badge && item.badge > 0 ? (
                          <span className="bg-[#ffb0cd] text-[#640039] text-xs font-bold px-2 py-0.5 rounded-full">
                            {item.badge}
                          </span>
                        ) : null}
                        <ChevronRight className="w-4 h-4 opacity-40" />
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Footer User Info */}
              {user && (
                <div className="pt-4 mt-4 border-t border-white/10 light:border-slate-200">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 light:bg-slate-100 border border-white/10 light:border-slate-200">
                    <div
                      onClick={() => handleSelectTab('profile')}
                      className="flex items-center gap-2.5 min-w-0 cursor-pointer hover:opacity-80 transition-opacity"
                    >
                      <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#d0bcff] to-[#ffb0cd] text-[#3c0091] font-bold text-sm flex items-center justify-center shrink-0">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-white light:text-slate-800 truncate">{user.name}</p>
                        <p className="text-[10px] text-[#cbc3d7] light:text-slate-500 truncate">{user.email}</p>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setMobileOpen(false);
                        onLogout();
                      }}
                      title="Logout"
                      className="p-2 text-rose-400 hover:bg-rose-500/20 rounded-lg transition-colors active:scale-90"
                    >
                      <LogOut className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ======================================= */}
      {/* 3. MOBILE BOTTOM NAVIGATION BAR        */}
      {/* ======================================= */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0b1326]/90 dark:bg-[#0b1326]/90 light:bg-white/95 backdrop-blur-xl border-t border-white/10 light:border-slate-200 px-2 py-2 flex items-center justify-around shadow-2xl">
        {/* Dashboard */}
        <button
          onClick={() => handleSelectTab('dashboard')}
          className={`flex flex-col items-center gap-1 text-[10px] font-medium transition-all duration-150 active:scale-95 ${
            activeTab === 'dashboard'
              ? 'text-[#d0bcff] light:text-[#6d3bd7] font-bold scale-105'
              : 'text-[#cbc3d7] light:text-slate-500'
          }`}
        >
          <LayoutDashboard className="w-5 h-5" />
          <span>Dashboard</span>
        </button>

        {/* Transactions */}
        <button
          onClick={() => handleSelectTab('expense_history')}
          className={`flex flex-col items-center gap-1 text-[10px] font-medium transition-all duration-150 active:scale-95 ${
            activeTab === 'expense_history'
              ? 'text-[#d0bcff] light:text-[#6d3bd7] font-bold scale-105'
              : 'text-[#cbc3d7] light:text-slate-500'
          }`}
        >
          <ReceiptText className="w-5 h-5" />
          <span>History</span>
        </button>

        {/* Floating Quick Add Button */}
        <button
          onClick={onOpenQuickAdd}
          className="w-12 h-12 -mt-5 rounded-full bg-gradient-to-r from-[#d0bcff] to-[#ffb0cd] text-[#3c0091] shadow-[0_4px_15px_rgba(208,188,255,0.4)] flex items-center justify-center font-bold active:scale-90 hover:scale-105 transition-transform"
          title="Quick Add Expense"
        >
          <PlusCircle className="w-6 h-6" />
        </button>

        {/* Budgets */}
        <button
          onClick={() => handleSelectTab('budget')}
          className={`flex flex-col items-center gap-1 text-[10px] font-medium transition-all duration-150 active:scale-95 ${
            activeTab === 'budget'
              ? 'text-[#d0bcff] light:text-[#6d3bd7] font-bold scale-105'
              : 'text-[#cbc3d7] light:text-slate-500'
          }`}
        >
          <Wallet className="w-5 h-5" />
          <span>Budgets</span>
        </button>

        {/* More Menu Drawer Button */}
        <button
          onClick={() => setMobileOpen(true)}
          className={`flex flex-col items-center gap-1 text-[10px] font-medium transition-all duration-150 active:scale-95 relative ${
            mobileOpen || ['savings_goals', 'comparison', 'reports', 'notifications', 'profile', 'settings', 'analytics', 'add_expense'].includes(activeTab)
              ? 'text-[#d0bcff] light:text-[#6d3bd7] font-bold scale-105'
              : 'text-[#cbc3d7] light:text-slate-500'
          }`}
        >
          <Menu className="w-5 h-5" />
          <span>More</span>
          {unreadCount > 0 && (
            <span className="absolute -top-1 right-1 w-2 h-2 rounded-full bg-[#ffb0cd] animate-pulse" />
          )}
        </button>
      </nav>
    </>
  );
};
