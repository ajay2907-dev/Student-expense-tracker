import { User, Expense, Budget, CategoryLimit, RecurringExpense, SavingsGoal, Notification } from '../types';

const API_BASE = '/api';

export async function registerUser(name: string, email: string, password: string): Promise<{ user: User }> {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Registration failed');
  return data;
}

export async function loginUser(email: string, password: string): Promise<{ user: User }> {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Login failed');
  return data;
}

export async function fetchUserData(userId: string): Promise<{
  user: User;
  expenses: Expense[];
  budgets: Budget[];
  category_limits: CategoryLimit[];
  recurring_expenses: RecurringExpense[];
  savings_goals: SavingsGoal[];
  notifications: Notification[];
  categoryLimits: CategoryLimit[];
  recurringExpenses: RecurringExpense[];
  savingsGoals: SavingsGoal[];
}> {
  const res = await fetch(`${API_BASE}/user/${userId}/data`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to fetch user data');
  const categoryLimits = data.category_limits || [];
  const recurringExpenses = data.recurring_expenses || [];
  const savingsGoals = data.savings_goals || [];
  return {
    user: data.user,
    expenses: data.expenses || [],
    budgets: data.budgets || [],
    category_limits: categoryLimits,
    recurring_expenses: recurringExpenses,
    savings_goals: savingsGoals,
    notifications: data.notifications || [],
    categoryLimits,
    recurringExpenses,
    savingsGoals,
  };
}

export async function addExpenseApi(expense: Partial<Expense>): Promise<Expense> {
  const res = await fetch(`${API_BASE}/expenses`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(expense),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to add expense');
  return data.expense;
}

export async function updateExpenseApi(expenseId: string, expense: Partial<Expense>): Promise<Expense> {
  const res = await fetch(`${API_BASE}/expenses/${expenseId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(expense),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to update expense');
  return data.expense;
}

export async function deleteExpenseApi(expenseId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/expenses/${expenseId}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete expense');
}

export async function saveBudgetApi(userId: string, month: string, amount: number): Promise<Budget> {
  const res = await fetch(`${API_BASE}/budgets`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: userId, month, amount }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error('Failed to save budget');
  return data.budget;
}

export async function saveCategoryLimitApi(userId: string, category: string, limit_amount: number): Promise<CategoryLimit[]> {
  const res = await fetch(`${API_BASE}/category-limits`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: userId, category, limit_amount }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to save category limit');
  return data.category_limits;
}

export async function deleteCategoryLimitApi(limitId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/category-limits/${limitId}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete category limit');
}

export async function addRecurringExpenseApi(recurring: Partial<RecurringExpense>): Promise<RecurringExpense> {
  const res = await fetch(`${API_BASE}/recurring-expenses`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(recurring),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to add recurring expense');
  return data.recurring;
}

export async function updateRecurringExpenseApi(recurringId: string, recurring: Partial<RecurringExpense>): Promise<RecurringExpense> {
  const res = await fetch(`${API_BASE}/recurring-expenses/${recurringId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(recurring),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to update recurring expense');
  return data.recurring;
}

export async function deleteRecurringExpenseApi(recurringId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/recurring-expenses/${recurringId}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete recurring expense');
}

export async function addSavingsGoalApi(goal: Partial<SavingsGoal>): Promise<SavingsGoal> {
  const res = await fetch(`${API_BASE}/savings-goals`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(goal),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to add savings goal');
  return data.goal;
}

export async function updateSavingsGoalApi(goalId: string, goal: Partial<SavingsGoal>): Promise<SavingsGoal> {
  const res = await fetch(`${API_BASE}/savings-goals/${goalId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(goal),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to update savings goal');
  return data.goal;
}

export async function deleteSavingsGoalApi(goalId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/savings-goals/${goalId}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete savings goal');
}

export async function markNotificationReadApi(userId: string, notificationId?: string): Promise<void> {
  await fetch(`${API_BASE}/notifications/read`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: userId, notification_id: notificationId }),
  });
}

export async function updateUserSettingsApi(userId: string, settings: Partial<User> & { new_password?: string }): Promise<User> {
  const res = await fetch(`${API_BASE}/user/${userId}/settings`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(settings),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to update settings');
  return data.user;
}

export async function loadDemoDataApi(userId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/user/${userId}/demo-data`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to load demo data');
}

export async function resetUserDataApi(userId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/user/${userId}/reset`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to reset user data');
}

export async function deleteUserAccountApi(userId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/user/${userId}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete account');
}

export interface CategorySuggestionResponse {
  category: string;
  confidence: number;
  reason: string;
  source: 'gemini' | 'rule_fallback';
}

export interface FinancialHealthInsightResponse {
  status: 'Healthy' | 'Good' | 'Caution' | 'Critical';
  score: number;
  title: string;
  summary: string;
  keyObservations: string[];
  recommendations: string[];
  source: 'gemini' | 'rule_fallback';
  generatedAt: string;
}

export interface SpendingPatternAnalysisInput {
  currency: string;
  month: string;
  totalSpent: number;
  monthlyBudget: number;
  remainingBudget: number;
  budgetUtilizationPct: number;
  daysPassedInMonth: number;
  daysInMonth: number;
  dailyRunRate: number;
  projectedMonthEndSpent: number;
  categoryBreakdown: Array<{ category: string; amount: number; percentage: number }>;
  topCategory: { category: string; amount: number; percentage: number } | null;
  previousMonthSpent?: number;
  transactionCount: number;
}

export async function suggestCategoryApi(text: string, merchant?: string): Promise<CategorySuggestionResponse> {
  const res = await fetch(`${API_BASE}/ai/suggest-category`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, merchant }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to get category suggestion');
  return data;
}

export async function fetchFinancialHealthInsightApi(input: SpendingPatternAnalysisInput): Promise<FinancialHealthInsightResponse> {
  const res = await fetch(`${API_BASE}/ai/financial-health-insight`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to analyze financial health');
  return data;
}

// Convenient unified API object
export const api = {
  register: registerUser,
  login: loginUser,
  getUserData: fetchUserData,
  fetchUserData: fetchUserData,
  suggestCategory: suggestCategoryApi,
  getFinancialHealthInsight: fetchFinancialHealthInsightApi,
  getExpenses: async (userId: string) => {
    const data = await fetchUserData(userId);
    return data.expenses;
  },
  getBudgets: async (userId: string) => {
    const data = await fetchUserData(userId);
    return data.budgets;
  },
  getCategoryLimits: async (userId: string) => {
    const data = await fetchUserData(userId);
    return data.category_limits;
  },
  getRecurringExpenses: async (userId: string) => {
    const data = await fetchUserData(userId);
    return data.recurring_expenses;
  },
  getSavingsGoals: async (userId: string) => {
    const data = await fetchUserData(userId);
    return data.savings_goals;
  },
  getNotifications: async (userId: string) => {
    const data = await fetchUserData(userId);
    return data.notifications;
  },
  addExpense: addExpenseApi,
  updateExpense: updateExpenseApi,
  deleteExpense: deleteExpenseApi,
  saveBudget: saveBudgetApi,
  saveCategoryLimit: saveCategoryLimitApi,
  saveCategoryLimitApi: saveCategoryLimitApi,
  deleteCategoryLimit: deleteCategoryLimitApi,
  deleteCategoryLimitApi: deleteCategoryLimitApi,
  addRecurringExpense: addRecurringExpenseApi,
  addRecurringExpenseApi: addRecurringExpenseApi,
  updateRecurringExpense: updateRecurringExpenseApi,
  deleteRecurringExpense: deleteRecurringExpenseApi,
  deleteRecurringExpenseApi: deleteRecurringExpenseApi,
  addSavingsGoal: addSavingsGoalApi,
  updateSavingsGoal: updateSavingsGoalApi,
  deleteSavingsGoal: deleteSavingsGoalApi,
  markNotificationsRead: markNotificationReadApi,
  updateUserSettings: updateUserSettingsApi,
  seedDemoData: loadDemoDataApi,
  clearAllExpenses: resetUserDataApi,
  deleteAccount: deleteUserAccountApi,
  deleteAccountApi: deleteUserAccountApi,
};

// Format Currency Utility
export function formatCurrency(amount: number, symbol: string = '₹'): string {
  const formatted = Math.abs(amount).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${amount < 0 ? '-' : ''}${symbol}${formatted}`;
}

