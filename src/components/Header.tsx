import React, { useState } from 'react';
import { Search, Bell, HelpCircle, Sun, Moon, Menu, CheckCheck, Wallet } from 'lucide-react';
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
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
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
  mobileOpen,
  setMobileOpen,
}) => {
  const [showNotifMenu, setShowNotifMenu] = useState(false);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <header className="fixed top-0 right-0 left-0 lg:left-64 h-16 sm:h-20 bg-[#0b1326]/80 dark:bg-[#0b1326]/80 light:bg-white/90 backdrop-blur-[20px] border-b border-white/10 light:border-slate-200 shadow-sm flex items-center justify-between px-3 sm:px-8 z-30 transition-all duration-300">
      {/* Mobile Brand / Menu Toggle & Search */}
      <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0 mr-2">
        {/* Mobile Hamburger Button */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="lg:hidden p-2 text-[#dae2fd] light:text-slate-700 hover:bg-white/10 rounded-xl shrink-0"
          title="Open Navigation Menu"
        >
          <Menu className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>

        {/* Mobile Brand Logo */}
        <div
          onClick={() => setActiveTab('dashboard')}
          className="lg:hidden flex items-center gap-1.5 cursor-pointer shrink-0"
        >
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#d0bcff] to-[#ffb0cd] flex items-center justify-center shrink-0">
            <Wallet className="w-4 h-4 text-[#3c0091]" />
          </div>
          <span className="font-bold text-sm text-[#d0bcff] light:text-[#6d3bd7] hidden xs:inline tracking-tight">
            ExpenseFlow
          </span>
        </div>

        {/* Search Bar */}
        <div className="flex items-center gap-2 bg-white/5 light:bg-slate-100 border border-white/10 light:border-slate-200 rounded-xl px-2.5 sm:px-3 py-1.5 sm:py-2 w-full max-w-[160px] sm:max-w-xs md:max-w-md text-xs sm:text-sm">
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
            placeholder="Search..."
            className="bg-transparent border-none outline-none text-white light:text-slate-800 placeholder-[#cbc3d7]/60 light:placeholder-slate-400 w-full text-xs sm:text-sm truncate"
          />
        </div>
      </div>

      {/* Right Action Controls */}
      <div className="flex items-center gap-1.5 sm:gap-4 shrink-0">
        {/* Light/Dark Mode Switcher */}
        <button
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          className="p-2 sm:p-2.5 rounded-xl bg-white/5 light:bg-slate-100 border border-white/10 light:border-slate-200 text-[#dae2fd] light:text-slate-700 hover:text-[#d0bcff] hover:bg-white/10 transition-all duration-200"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4 sm:w-5 sm:h-5 text-amber-300" /> : <Moon className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600" />}
        </button>

        {/* Notification Bell */}
        <div className="relative">
          <button
            onClick={() => setShowNotifMenu(!showNotifMenu)}
            className="p-2 sm:p-2.5 rounded-xl bg-white/5 light:bg-slate-100 border border-white/10 light:border-slate-200 text-[#dae2fd] light:text-slate-700 hover:text-[#d0bcff] hover:bg-white/10 transition-all duration-200 relative"
            title="Notifications"
          >
            <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 bg-[#ffb0cd] text-[#640039] font-bold text-[9px] sm:text-[10px] rounded-full flex items-center justify-center animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown Modal */}
          {showNotifMenu && (
            <div className="absolute right-0 mt-3 w-72 sm:w-96 glass-panel light:bg-white/95 rounded-2xl p-4 shadow-2xl border border-white/10 light:border-slate-200 z-50 animate-in fade-in slide-in-from-top-2">
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

        {/* Help / Settings Button */}
        <button
          onClick={() => setActiveTab('settings')}
          className="hidden sm:flex p-2.5 rounded-xl bg-white/5 light:bg-slate-100 border border-white/10 light:border-slate-200 text-[#dae2fd] light:text-slate-700 hover:text-[#d0bcff] hover:bg-white/10 transition-all duration-200"
          title="Settings"
        >
          <HelpCircle className="w-5 h-5" />
        </button>

        {/* User Avatar */}
        {user && (
          <button
            onClick={() => setActiveTab('profile')}
            className="flex items-center gap-2 p-1 pl-1.5 sm:pl-2 pr-2.5 sm:pr-3 rounded-full bg-white/5 light:bg-slate-100 border border-white/10 light:border-slate-200 hover:border-[#d0bcff] transition-all duration-200"
            title="Profile"
          >
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-tr from-[#d0bcff] to-[#ffb0cd] text-[#3c0091] font-bold text-xs flex items-center justify-center shrink-0">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <span className="hidden sm:inline text-xs font-semibold text-white light:text-slate-800 max-w-[90px] truncate">
              {user.name}
            </span>
          </button>
        )}
      </div>
    </header>
  );
};
