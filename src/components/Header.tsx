import React, { useState } from 'react';
import { Search, Bell, HelpCircle, Sun, Moon, Menu, X, CheckCheck } from 'lucide-react';
import { User, Notification, ActiveTab } from '../types';

interface HeaderProps {
  user: User | null;
  notifications: Notification[];
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  theme: 'dark' | 'light';
  toggleTheme: () => void;
  onMarkNotificationsRead: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  notifications,
  activeTab,
  setActiveTab,
  searchQuery,
  setSearchQuery,
  theme,
  toggleTheme,
  onMarkNotificationsRead,
}) => {
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <header className="fixed top-0 right-0 left-0 lg:left-64 h-20 bg-[#0b1326]/60 dark:bg-[#0b1326]/60 light:bg-white/80 backdrop-blur-[20px] border-b border-white/10 light:border-slate-200 shadow-sm flex items-center justify-between px-4 sm:px-8 z-30 transition-all duration-300">
      {/* Mobile Toggle & Search */}
      <div className="flex items-center gap-3 flex-1 max-w-md">
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="lg:hidden p-2 text-[#dae2fd] light:text-slate-700 hover:bg-white/10 rounded-lg"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>

        <div className="flex items-center gap-2 bg-white/5 light:bg-slate-100 border border-white/10 light:border-slate-200 rounded-xl px-3 py-2 w-full text-sm">
          <Search className="w-4 h-4 text-[#cbc3d7] light:text-slate-400 shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              if (activeTab !== 'expense_history' && e.target.value.trim() !== '') {
                setActiveTab('expense_history');
              }
            }}
            placeholder="Search transactions, categories..."
            className="bg-transparent border-none outline-none text-white light:text-slate-800 placeholder-[#cbc3d7]/60 light:placeholder-slate-400 w-full text-sm"
          />
        </div>
      </div>

      {/* Right Action Icons */}
      <div className="flex items-center gap-3 sm:gap-5">
        {/* Light/Dark Mode Switcher */}
        <button
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          className="p-2.5 rounded-xl bg-white/5 light:bg-slate-100 border border-white/10 light:border-slate-200 text-[#dae2fd] light:text-slate-700 hover:text-[#d0bcff] hover:bg-white/10 transition-all duration-200"
        >
          {theme === 'dark' ? <Sun className="w-5 h-5 text-amber-300" /> : <Moon className="w-5 h-5 text-indigo-600" />}
        </button>

        {/* Notification Bell */}
        <div className="relative">
          <button
            onClick={() => setShowNotifMenu(!showNotifMenu)}
            className="p-2.5 rounded-xl bg-white/5 light:bg-slate-100 border border-white/10 light:border-slate-200 text-[#dae2fd] light:text-slate-700 hover:text-[#d0bcff] hover:bg-white/10 transition-all duration-200 relative"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#ffb0cd] text-[#640039] font-bold text-[10px] rounded-full flex items-center justify-center animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown Modal */}
          {showNotifMenu && (
            <div className="absolute right-0 mt-3 w-80 sm:w-96 glass-panel light:bg-white/95 rounded-2xl p-4 shadow-2xl border border-white/10 light:border-slate-200 z-50 animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center justify-between pb-3 border-b border-white/10 light:border-slate-200">
                <h3 className="font-bold text-sm text-white light:text-slate-800">Notifications</h3>
                {unreadCount > 0 && (
                  <button
                    onClick={() => {
                      onMarkNotificationsRead();
                      setShowNotifMenu(false);
                    }}
                    className="text-xs text-[#d0bcff] light:text-purple-600 hover:underline flex items-center gap-1 font-medium"
                  >
                    <CheckCheck className="w-3.5 h-3.5" /> Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-72 overflow-y-auto space-y-2 mt-3">
                {notifications.length === 0 ? (
                  <p className="text-xs text-[#cbc3d7] light:text-slate-500 text-center py-6">No notifications yet.</p>
                ) : (
                  notifications.slice(0, 5).map((n) => (
                    <div
                      key={n.notification_id}
                      className={`p-3 rounded-xl border text-xs transition-colors ${
                        !n.is_read
                          ? 'bg-white/10 light:bg-purple-50 border-[#d0bcff]/40 light:border-purple-200'
                          : 'bg-white/5 light:bg-slate-50 border-white/5 light:border-slate-100'
                      }`}
                    >
                      <p className="text-white light:text-slate-800 font-medium leading-relaxed">{n.message}</p>
                      <span className="text-[10px] text-[#cbc3d7] light:text-slate-400 mt-1 block">
                        {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))
                )}
              </div>

              <button
                onClick={() => {
                  setActiveTab('notifications');
                  setShowNotifMenu(false);
                }}
                className="w-full text-center text-xs text-[#d0bcff] light:text-purple-600 font-semibold pt-3 mt-2 border-t border-white/10 light:border-slate-200 hover:underline block"
              >
                View All Notifications →
              </button>
            </div>
          )}
        </div>

        {/* Help Button */}
        <button
          onClick={() => setActiveTab('settings')}
          className="hidden sm:flex p-2.5 rounded-xl bg-white/5 light:bg-slate-100 border border-white/10 light:border-slate-200 text-[#dae2fd] light:text-slate-700 hover:text-[#d0bcff] hover:bg-white/10 transition-all duration-200"
        >
          <HelpCircle className="w-5 h-5" />
        </button>

        {/* User Avatar */}
        {user && (
          <button
            onClick={() => setActiveTab('profile')}
            className="flex items-center gap-2 p-1 pl-2 pr-3 rounded-full bg-white/5 light:bg-slate-100 border border-white/10 light:border-slate-200 hover:border-[#d0bcff] transition-all duration-200"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#d0bcff] to-[#ffb0cd] text-[#3c0091] font-bold text-xs flex items-center justify-center shrink-0">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <span className="hidden sm:inline text-xs font-semibold text-white light:text-slate-800 max-w-[100px] truncate">
              {user.name}
            </span>
          </button>
        )}
      </div>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed top-20 left-0 right-0 bottom-0 bg-[#0b1326]/95 light:bg-white/95 backdrop-blur-2xl p-6 z-50 flex flex-col gap-3 overflow-y-auto">
          <p className="text-xs uppercase tracking-wider text-[#cbc3d7] font-bold mb-1">Navigation</p>
          {[
            { id: 'dashboard', label: 'Dashboard' },
            { id: 'add_expense', label: 'Add Expense' },
            { id: 'expense_history', label: 'Transactions' },
            { id: 'analytics', label: 'Analytics' },
            { id: 'budget', label: 'Budgets' },
            { id: 'savings_goals', label: 'Savings Goals' },
            { id: 'comparison', label: 'Comparison' },
            { id: 'reports', label: 'Reports' },
            { id: 'notifications', label: 'Notifications' },
            { id: 'profile', label: 'Profile' },
            { id: 'settings', label: 'Settings' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as ActiveTab);
                setMobileMenuOpen(false);
              }}
              className={`text-left py-3 px-4 rounded-xl text-base font-semibold transition-colors ${
                activeTab === tab.id
                  ? 'bg-[#d0bcff] light:bg-purple-600 text-[#3c0091] light:text-white'
                  : 'text-white light:text-slate-800 hover:bg-white/10'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}
    </header>
  );
};
