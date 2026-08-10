import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';

import { DashboardView } from './components/views/DashboardView';
import { AddExpenseView } from './components/views/AddExpenseView';
import { ExpenseHistoryView } from './components/views/ExpenseHistoryView';
import { AnalyticsView } from './components/views/AnalyticsView';
import { BudgetView } from './components/views/BudgetView';
import { SavingsGoalsView } from './components/views/SavingsGoalsView';
import { ComparisonView } from './components/views/ComparisonView';
import { ReportsView } from './components/views/ReportsView';
import { NotificationsView } from './components/views/NotificationsView';
import { ProfileView } from './components/views/ProfileView';
import { SettingsView } from './components/views/SettingsView';

import { QuickAddModal } from './components/QuickAddModal';
import { AuthModal } from './components/AuthModal';

import { api } from './lib/api';
import { User, Expense, Budget, SavingsGoal, Notification, ActiveTab, CategoryLimit, RecurringExpense } from './types';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [categoryLimits, setCategoryLimits] = useState<CategoryLimit[]>([]);
  const [recurringExpenses, setRecurringExpenses] = useState<RecurringExpense[]>([]);

  const [loading, setLoading] = useState<boolean>(true);
  const [showQuickAdd, setShowQuickAdd] = useState<boolean>(false);
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);

  // Initialize theme class on body
  useEffect(() => {
    if (theme === 'light') {
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Load initial app data
  const loadAppData = async (currentUser: User) => {
    setLoading(true);
    try {
      const fullData = await api.fetchUserData(currentUser.user_id);

      setExpenses(fullData.expenses || []);
      setBudgets(fullData.budgets || []);
      setSavingsGoals(fullData.savingsGoals || []);
      setNotifications(fullData.notifications || []);
      setCategoryLimits(fullData.categoryLimits || []);
      setRecurringExpenses(fullData.recurringExpenses || []);
      if (fullData.user) {
        setUser(fullData.user);
        localStorage.setItem('student_tracker_user', JSON.stringify(fullData.user));
      }
    } catch (err: any) {
      console.error('Error loading app data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Check auth session or initialize default user
  useEffect(() => {
    const initUser = async () => {
      try {
        const storedUser = localStorage.getItem('student_tracker_user');
        if (storedUser) {
          try {
            const parsed = JSON.parse(storedUser);
            setUser(parsed);
            await loadAppData(parsed);
            return;
          } catch (e) {
            console.warn('Stored session invalid or outdated, clearing local session.');
            localStorage.removeItem('student_tracker_user');
          }
        }

        // Default seed demo user
        try {
          const demoUserRes = await api.login('alex.student@university.edu', 'password123');
          setUser(demoUserRes.user);
          localStorage.setItem('student_tracker_user', JSON.stringify(demoUserRes.user));
          await loadAppData(demoUserRes.user);
        } catch (loginErr) {
          console.warn('Demo login failed, attempting auto-registration fallback...', loginErr);
          const regRes = await api.register('Alex Johnson', 'alex.student@university.edu', 'password123');
          setUser(regRes.user);
          localStorage.setItem('student_tracker_user', JSON.stringify(regRes.user));
          await loadAppData(regRes.user);
        }
      } catch (err) {
        console.error('Failed to initialize user session:', err);
        setLoading(false);
      }
    };

    initUser();
  }, []);

  // Handlers for Data Mutations
  const handleAddExpense = async (newExpense: Partial<Expense>) => {
    if (!user) return;
    const added = await api.addExpense(newExpense);
    setExpenses((prev) => [added, ...prev]);

    // Refresh notifications & budgets
    const [notifData, budData] = await Promise.all([
      api.getNotifications(user.user_id),
      api.getBudgets(user.user_id),
    ]);
    setNotifications(notifData || []);
    setBudgets(budData || []);
  };

  const handleUpdateExpense = async (expenseId: string, updated: Partial<Expense>) => {
    if (!user) return;
    const res = await api.updateExpense(expenseId, updated);
    setExpenses((prev) => prev.map((e) => (e.expense_id === expenseId ? res : e)));
  };

  const handleDeleteExpense = async (expenseId: string) => {
    await api.deleteExpense(expenseId);
    setExpenses((prev) => prev.filter((e) => e.expense_id !== expenseId));
  };

  const handleSaveBudget = async (month: string, amount: number) => {
    if (!user) return;
    const saved = await api.saveBudget(user.user_id, month, amount);
    setBudgets((prev) => {
      const idx = prev.findIndex((b) => b.month === month);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = saved;
        return copy;
      }
      return [...prev, saved];
    });
  };

  const handleSaveCategoryLimit = async (category: string, limitAmount: number) => {
    if (!user) return;
    const limit = await api.saveCategoryLimitApi(user.user_id, category, limitAmount);
    setCategoryLimits((prev) => {
      const idx = prev.findIndex((cl) => cl.category.toLowerCase() === category.toLowerCase());
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = limit;
        return copy;
      }
      return [...prev, limit];
    });
  };

  const handleDeleteCategoryLimit = async (limitId: string) => {
    await api.deleteCategoryLimitApi(limitId);
    setCategoryLimits((prev) => prev.filter((cl) => cl.limit_id !== limitId));
  };

  const handleAddRecurringExpense = async (recurring: Partial<RecurringExpense>) => {
    if (!user) return;
    const added = await api.addRecurringExpenseApi(recurring);
    setRecurringExpenses((prev) => [added, ...prev]);
  };

  const handleDeleteRecurringExpense = async (recurringId: string) => {
    await api.deleteRecurringExpenseApi(recurringId);
    setRecurringExpenses((prev) => prev.filter((r) => r.recurring_id !== recurringId));
  };

  const handleAddSavingsGoal = async (goal: Partial<SavingsGoal>) => {
    if (!user) return;
    const added = await api.addSavingsGoal(goal);
    setSavingsGoals((prev) => [...prev, added]);
  };

  const handleUpdateSavingsGoal = async (goalId: string, updated: Partial<SavingsGoal>) => {
    const res = await api.updateSavingsGoal(goalId, updated);
    setSavingsGoals((prev) => prev.map((g) => (g.goal_id === goalId ? res : g)));
  };

  const handleDeleteSavingsGoal = async (goalId: string) => {
    await api.deleteSavingsGoal(goalId);
    setSavingsGoals((prev) => prev.filter((g) => g.goal_id !== goalId));
  };

  const handleMarkNotificationsRead = async () => {
    if (!user) return;
    await api.markNotificationsRead(user.user_id);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  };

  const handleUpdateUserSettings = async (settings: Partial<User>) => {
    if (!user) return;
    const updatedUser = await api.updateUserSettings(user.user_id, settings);
    setUser(updatedUser);
    localStorage.setItem('student_tracker_user', JSON.stringify(updatedUser));
  };

  const handleSeedDemoData = async () => {
    if (!user) return;
    await api.seedDemoData(user.user_id);
    await loadAppData(user);
  };

  const handleClearData = async () => {
    if (!user) return;
    await api.clearAllExpenses(user.user_id);
    setExpenses([]);
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    await api.deleteAccountApi(user.user_id);
    localStorage.removeItem('student_tracker_user');
    setUser(null);
    setExpenses([]);
    setBudgets([]);
    setSavingsGoals([]);
    setNotifications([]);
    setCategoryLimits([]);
    setRecurringExpenses([]);
    setShowAuthModal(true);
  };

  return (
    <div className={`min-h-screen ${theme === 'light' ? 'light bg-slate-50 text-slate-900' : 'dark bg-[#0b1326] text-white'} selection:bg-[#d0bcff] selection:text-[#3c0091] relative overflow-x-hidden font-sans`}>
      {/* Background Animated Blobs */}
      <div className="fixed top-10 left-10 w-96 h-96 bg-[#d0bcff]/15 rounded-full blur-[100px] pointer-events-none animate-pulse" />
      <div className="fixed bottom-10 right-10 w-96 h-96 bg-[#ffb0cd]/15 rounded-full blur-[100px] pointer-events-none animate-pulse" style={{ animationDelay: '2s' }} />

      {/* Persistent Left Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenQuickAdd={() => setShowQuickAdd(true)}
      />

      {/* Top Header Navigation */}
      <Header
        user={user}
        notifications={notifications}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        theme={theme}
        toggleTheme={toggleTheme}
        onMarkNotificationsRead={handleMarkNotificationsRead}
      />

      {/* Main View Area */}
      <main className="lg:ml-64 pt-24 pb-16 px-4 sm:px-8 max-w-7xl mx-auto relative z-10 transition-all duration-300">
        {loading ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
            <div className="w-12 h-12 rounded-full border-4 border-[#d0bcff] border-t-transparent animate-spin" />
            <p className="text-sm font-semibold text-[#cbc3d7] light:text-slate-600">
              Loading financial workspace...
            </p>
          </div>
        ) : !user ? (
          <div className="text-center py-20 space-y-4">
            <p className="text-lg font-bold">Please log in to view your expense tracker.</p>
            <button
              onClick={() => setShowAuthModal(true)}
              className="px-6 py-3 rounded-2xl bg-[#d0bcff] text-[#3c0091] font-bold text-sm"
            >
              Open Login Screen
            </button>
          </div>
        ) : (
          <>
            {activeTab === 'dashboard' && (
              <DashboardView
                user={user}
                expenses={expenses}
                budgets={budgets}
                savingsGoals={savingsGoals}
                setActiveTab={setActiveTab}
                onOpenQuickAdd={() => setShowQuickAdd(true)}
              />
            )}

            {activeTab === 'add_expense' && (
              <AddExpenseView user={user} onAddExpense={handleAddExpense} />
            )}

            {activeTab === 'expense_history' && (
              <ExpenseHistoryView
                user={user}
                expenses={expenses}
                onUpdateExpense={handleUpdateExpense}
                onDeleteExpense={handleDeleteExpense}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
              />
            )}

            {activeTab === 'analytics' && <AnalyticsView user={user} expenses={expenses} />}

            {activeTab === 'budget' && (
              <BudgetView
                user={user}
                budgets={budgets}
                categoryLimits={categoryLimits}
                recurringExpenses={recurringExpenses}
                expenses={expenses}
                onSaveBudget={handleSaveBudget}
                onSaveCategoryLimit={handleSaveCategoryLimit}
                onDeleteCategoryLimit={handleDeleteCategoryLimit}
                onAddRecurringExpense={handleAddRecurringExpense}
                onDeleteRecurringExpense={handleDeleteRecurringExpense}
                onUpdateUserSettings={handleUpdateUserSettings}
              />
            )}

            {activeTab === 'savings_goals' && (
              <SavingsGoalsView
                user={user}
                savingsGoals={savingsGoals}
                onAddSavingsGoal={handleAddSavingsGoal}
                onUpdateSavingsGoal={handleUpdateSavingsGoal}
                onDeleteSavingsGoal={handleDeleteSavingsGoal}
              />
            )}

            {activeTab === 'comparison' && <ComparisonView user={user} expenses={expenses} />}

            {activeTab === 'reports' && (
              <ReportsView user={user} expenses={expenses} budgets={budgets} />
            )}

            {activeTab === 'notifications' && (
              <NotificationsView
                notifications={notifications}
                onMarkAllRead={handleMarkNotificationsRead}
              />
            )}

            {activeTab === 'profile' && (
              <ProfileView user={user} onUpdateUserSettings={handleUpdateUserSettings} />
            )}

            {activeTab === 'settings' && (
              <SettingsView
                user={user}
                theme={theme}
                toggleTheme={toggleTheme}
                onSeedDemoData={handleSeedDemoData}
                onClearData={handleClearData}
                onDeleteAccount={handleDeleteAccount}
              />
            )}
          </>
        )}
      </main>

      {/* Quick Add Modal */}
      {showQuickAdd && user && (
        <QuickAddModal
          user={user}
          onClose={() => setShowQuickAdd(false)}
          onAddExpense={handleAddExpense}
        />
      )}

      {/* Auth Modal */}
      {showAuthModal && (
        <AuthModal
          onSuccess={(loggedUser) => {
            setUser(loggedUser);
            localStorage.setItem('student_tracker_user', JSON.stringify(loggedUser));
            setShowAuthModal(false);
            loadAppData(loggedUser);
          }}
        />
      )}
    </div>
  );
}
