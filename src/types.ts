export interface User {
  user_id: string;
  name: string;
  email: string;
  created_at: string;
  currency: string;
  default_category: string;
  theme: 'dark' | 'light';
  budget_rollover_enabled?: boolean;
}

export interface Expense {
  expense_id: string;
  user_id: string;
  amount: number;
  category: string;
  date: string;
  description: string;
  payment_method: string;
  created_at: string;
}

export interface CategoryLimit {
  limit_id: string;
  user_id: string;
  category: string;
  limit_amount: number;
  created_at: string;
}

export interface RecurringExpense {
  recurring_id: string;
  user_id: string;
  name: string;
  amount: number;
  category: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  start_date: string;
  payment_method: string;
  created_at: string;
}

export interface Budget {
  budget_id: string;
  user_id: string;
  month: string; // YYYY-MM
  amount: number;
  created_at: string;
}

export interface SavingsGoal {
  goal_id: string;
  user_id: string;
  goal_name: string;
  target_amount: number;
  saved_amount: number;
  target_date: string;
  created_at: string;
}

export interface Notification {
  notification_id: string;
  user_id: string;
  message: string;
  type: 'warning' | 'alert' | 'info' | 'success';
  is_read: boolean;
  created_at: string;
}

export type DateRangePreset =
  | 'all'
  | 'today'
  | 'yesterday'
  | 'this_week'
  | 'last_week'
  | 'this_month'
  | 'last_month'
  | 'this_year'
  | 'custom';

export type ActiveTab =
  | 'dashboard'
  | 'add_expense'
  | 'expense_history'
  | 'analytics'
  | 'budget'
  | 'savings_goals'
  | 'comparison'
  | 'reports'
  | 'notifications'
  | 'profile'
  | 'settings';
