import express from "express";
import path from "path";
import fs from "fs";
import bcrypt from "bcryptjs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

const app = express();
const PORT = 3000;

app.use(express.json());

// Ensure database folder exists
const dbDir = path.join(process.cwd(), "database");
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbFilePath = path.join(dbDir, "expenses.json");

interface User {
  user_id: string;
  name: string;
  email: string;
  password_hash: string;
  created_at: string;
  currency: string;
  default_category: string;
  theme: "dark" | "light";
  budget_rollover_enabled?: boolean;
}

interface Expense {
  expense_id: string;
  user_id: string;
  amount: number;
  category: string;
  date: string;
  description: string;
  payment_method: string;
  created_at: string;
}

interface CategoryLimit {
  limit_id: string;
  user_id: string;
  category: string;
  limit_amount: number;
  created_at: string;
}

interface RecurringExpense {
  recurring_id: string;
  user_id: string;
  name: string;
  amount: number;
  category: string;
  frequency: "daily" | "weekly" | "monthly";
  start_date: string;
  payment_method: string;
  created_at: string;
}

interface Budget {
  budget_id: string;
  user_id: string;
  month: string; // YYYY-MM
  amount: number;
  created_at: string;
}

interface SavingsGoal {
  goal_id: string;
  user_id: string;
  goal_name: string;
  target_amount: number;
  saved_amount: number;
  target_date: string;
  created_at: string;
}

interface Notification {
  notification_id: string;
  user_id: string;
  message: string;
  type: "warning" | "alert" | "info" | "success";
  is_read: boolean;
  created_at: string;
}

interface DatabaseSchema {
  users: User[];
  expenses: Expense[];
  budgets: Budget[];
  category_limits: CategoryLimit[];
  recurring_expenses: RecurringExpense[];
  savings_goals: SavingsGoal[];
  notifications: Notification[];
}

function loadDB(): DatabaseSchema {
  const defaultDB: DatabaseSchema = {
    users: [],
    expenses: [],
    budgets: [],
    category_limits: [],
    recurring_expenses: [],
    savings_goals: [],
    notifications: [],
  };

  if (!fs.existsSync(dbFilePath)) {
    fs.writeFileSync(dbFilePath, JSON.stringify(defaultDB, null, 2));
    return defaultDB;
  }

  try {
    const raw = fs.readFileSync(dbFilePath, "utf-8");
    const parsed = JSON.parse(raw);
    return {
      users: Array.isArray(parsed.users) ? parsed.users : [],
      expenses: Array.isArray(parsed.expenses) ? parsed.expenses : [],
      budgets: Array.isArray(parsed.budgets) ? parsed.budgets : [],
      category_limits: Array.isArray(parsed.category_limits) ? parsed.category_limits : [],
      recurring_expenses: Array.isArray(parsed.recurring_expenses) ? parsed.recurring_expenses : [],
      savings_goals: Array.isArray(parsed.savings_goals) ? parsed.savings_goals : [],
      notifications: Array.isArray(parsed.notifications) ? parsed.notifications : [],
    };
  } catch (e) {
    console.error("Error reading database:", e);
    return defaultDB;
  }
}

function saveDB(db: DatabaseSchema) {
  try {
    fs.writeFileSync(dbFilePath, JSON.stringify(db, null, 2));
  } catch (e) {
    console.error("Error saving database:", e);
  }
}

// Demo data generator helper
function generateDemoDataForUser(userId: string) {
  const db = loadDB();

  // Remove existing user data
  db.expenses = db.expenses.filter((e) => e.user_id !== userId);
  db.budgets = db.budgets.filter((b) => b.user_id !== userId);
  db.category_limits = db.category_limits.filter((c) => c.user_id !== userId);
  db.recurring_expenses = db.recurring_expenses.filter((r) => r.user_id !== userId);
  db.savings_goals = db.savings_goals.filter((g) => g.user_id !== userId);
  db.notifications = db.notifications.filter((n) => n.user_id !== userId);

  const now = new Date();
  const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  
  const prevMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevMonthStr = `${prevMonthDate.getFullYear()}-${String(prevMonthDate.getMonth() + 1).padStart(2, "0")}`;

  // Monthly Budgets
  db.budgets.push({
    budget_id: "b_" + Date.now() + "_1",
    user_id: userId,
    month: currentMonthStr,
    amount: 15000, // ₹15,000
    created_at: new Date().toISOString(),
  });

  db.budgets.push({
    budget_id: "b_" + Date.now() + "_2",
    user_id: userId,
    month: prevMonthStr,
    amount: 15000,
    created_at: new Date().toISOString(),
  });

  // Category Limits
  db.category_limits.push(
    {
      limit_id: "cl_" + Date.now() + "_1",
      user_id: userId,
      category: "Food",
      limit_amount: 5000,
      created_at: new Date().toISOString(),
    },
    {
      limit_id: "cl_" + Date.now() + "_2",
      user_id: userId,
      category: "Education",
      limit_amount: 3000,
      created_at: new Date().toISOString(),
    },
    {
      limit_id: "cl_" + Date.now() + "_3",
      user_id: userId,
      category: "Entertainment",
      limit_amount: 2000,
      created_at: new Date().toISOString(),
    }
  );

  // Recurring Expenses
  db.recurring_expenses.push(
    {
      recurring_id: "rec_" + Date.now() + "_1",
      user_id: userId,
      name: "Campus Hostel Rent",
      amount: 4500,
      category: "Personal",
      frequency: "monthly",
      start_date: `${currentMonthStr}-01`,
      payment_method: "Bank Transfer",
      created_at: new Date().toISOString(),
    },
    {
      recurring_id: "rec_" + Date.now() + "_2",
      user_id: userId,
      name: "Mobile Internet Recharge",
      amount: 299,
      category: "Mobile/Internet",
      frequency: "monthly",
      start_date: `${currentMonthStr}-05`,
      payment_method: "UPI",
      created_at: new Date().toISOString(),
    }
  );

  // Sample expenses
  const sampleExpenses = [
    { amount: 180, category: "Food", desc: "Lunch at Mess", pay: "UPI", offsetDays: 0 },
    { amount: 45, category: "Food", desc: "Evening Tea & Snacks", pay: "Cash", offsetDays: 0 },
    { amount: 850, category: "Education", desc: "Computer Science Textbook", pay: "Debit Card", offsetDays: 1 },
    { amount: 120, category: "Transportation", desc: "Bus Pass Renewal", pay: "UPI", offsetDays: 2 },
    { amount: 4500, category: "Personal", desc: "Campus Hostel Monthly Rent", pay: "Bank Transfer", offsetDays: 3 },
    { amount: 299, category: "Mobile/Internet", desc: "Monthly Mobile Data Plan", pay: "UPI", offsetDays: 4 },
    { amount: 350, category: "Entertainment", desc: "Movie Night with Friends", pay: "Credit Card", offsetDays: 5 },
    { amount: 1200, category: "Shopping", desc: "New Sneakers", pay: "Credit Card", offsetDays: 6 },
    { amount: 250, category: "Food", desc: "Weekend Pizza Delivery", pay: "UPI", offsetDays: 7 },
    { amount: 150, category: "Education", desc: "Lab Notebook & Stationery", pay: "Cash", offsetDays: 8 },
    { amount: 60, category: "Transportation", desc: "Auto Rickshaw Fare", pay: "Cash", offsetDays: 9 },
    { amount: 500, category: "Personal", desc: "Haircut & Grooming", pay: "UPI", offsetDays: 10 },
    // Previous month expenses for comparison
    { amount: 220, category: "Food", desc: "Dinner at Campus Cafe", pay: "UPI", offsetDays: 32 },
    { amount: 4500, category: "Personal", desc: "Hostel Fee", pay: "Bank Transfer", offsetDays: 35 },
    { amount: 1500, category: "Education", desc: "Reference Books", pay: "Debit Card", offsetDays: 38 },
    { amount: 600, category: "Entertainment", desc: "Concert Ticket", pay: "UPI", offsetDays: 40 },
  ];

  sampleExpenses.forEach((item, idx) => {
    const expDate = new Date();
    expDate.setDate(expDate.getDate() - item.offsetDays);
    const dateStr = expDate.toISOString().split("T")[0];

    db.expenses.push({
      expense_id: `e_${Date.now()}_${idx}`,
      user_id: userId,
      amount: item.amount,
      category: item.category,
      date: dateStr,
      description: item.desc,
      payment_method: item.pay,
      created_at: expDate.toISOString(),
    });
  });

  // Savings Goals
  db.savings_goals.push({
    goal_id: "g_" + Date.now() + "_1",
    user_id: userId,
    goal_name: "New Laptop for Coding",
    target_amount: 50000,
    saved_amount: 32500,
    target_date: "2026-11-30",
    created_at: new Date().toISOString(),
  });

  db.savings_goals.push({
    goal_id: "g_" + Date.now() + "_2",
    user_id: userId,
    goal_name: "College Trip Fund",
    target_amount: 8000,
    saved_amount: 5200,
    target_date: "2026-09-15",
    created_at: new Date().toISOString(),
  });

  // Notifications
  db.notifications.push({
    notification_id: "n_" + Date.now() + "_1",
    user_id: userId,
    message: "Welcome to Student Expense Tracker! Demo data loaded successfully.",
    type: "success",
    is_read: false,
    created_at: new Date().toISOString(),
  });

  db.notifications.push({
    notification_id: "n_" + Date.now() + "_2",
    user_id: userId,
    message: "You have used 57% of your ₹15,000 monthly budget. Keep it up!",
    type: "info",
    is_read: false,
    created_at: new Date().toISOString(),
  });

  db.notifications.push({
    notification_id: "n_" + Date.now() + "_3",
    user_id: userId,
    message: "Savings Goal 'New Laptop for Coding' reached 65% progress!",
    type: "success",
    is_read: false,
    created_at: new Date().toISOString(),
  });

  saveDB(db);
}

function ensureDemoUserExists(): User {
  const db = loadDB();
  const demoEmail = "alex.student@university.edu";
  let demoUser = db.users.find((u) => u.email.toLowerCase() === demoEmail.toLowerCase());

  if (!demoUser) {
    const salt = bcrypt.genSaltSync(10);
    const password_hash = bcrypt.hashSync("password123", salt);
    const userId = "user_demo_alex";

    demoUser = {
      user_id: userId,
      name: "Alex Johnson",
      email: demoEmail.toLowerCase(),
      password_hash,
      created_at: new Date().toISOString(),
      currency: "₹",
      default_category: "Food",
      theme: "dark",
      budget_rollover_enabled: true,
    };

    db.users.push(demoUser);
    saveDB(db);
    generateDemoDataForUser(userId);
    console.log("Demo user initialized: alex.student@university.edu");
    return demoUser;
  } else {
    // Ensure password123 is valid
    const isPasswordValid = bcrypt.compareSync("password123", demoUser.password_hash);
    if (!isPasswordValid) {
      demoUser.password_hash = bcrypt.hashSync("password123", bcrypt.genSaltSync(10));
      saveDB(db);
    }
    return demoUser;
  }
}

// API Routes

// Register
app.post("/api/auth/register", async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: "All fields are required" });
  }

  const db = loadDB();
  const existing = db.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    return res.status(400).json({ error: "An account with this email already exists" });
  }

  const salt = await bcrypt.genSalt(10);
  const password_hash = await bcrypt.hash(password, salt);
  const userId = "user_" + Date.now();

  const newUser: User = {
    user_id: userId,
    name,
    email: email.toLowerCase(),
    password_hash,
    created_at: new Date().toISOString(),
    currency: "₹",
    default_category: "Food",
    theme: "dark",
    budget_rollover_enabled: true,
  };

  db.users.push(newUser);
  saveDB(db);

  // Automatically generate demo data for easy student testing
  generateDemoDataForUser(userId);

  const { password_hash: _, ...safeUser } = newUser;
  res.json({ user: safeUser });
});

// Login
app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  let db = loadDB();
  let user = db.users.find((u) => u.email.toLowerCase() === email.toLowerCase());

  if (!user && email.toLowerCase() === "alex.student@university.edu") {
    ensureDemoUserExists();
    db = loadDB();
    user = db.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  }

  if (!user) {
    return res.status(401).json({ error: "Invalid email or password" });
  }

  const isMatch = await bcrypt.compare(password, user.password_hash);
  if (!isMatch) {
    return res.status(401).json({ error: "Invalid email or password" });
  }

  const { password_hash: _, ...safeUser } = user;
  res.json({ user: safeUser });
});

// Get User Profile & Full App Data
app.get("/api/user/:userId/data", (req, res) => {
  const { userId } = req.params;
  let db = loadDB();

  let user = db.users.find((u) => u.user_id === userId);
  if (!user && (userId === "user_demo_alex" || db.users.length === 0)) {
    ensureDemoUserExists();
    db = loadDB();
    user = db.users.find((u) => u.user_id === userId) || db.users.find((u) => u.user_id === "user_demo_alex");
  }

  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  const userExpenses = db.expenses.filter((e) => e.user_id === user.user_id);
  const userBudgets = db.budgets.filter((b) => b.user_id === user.user_id);
  const userCategoryLimits = db.category_limits.filter((c) => c.user_id === user.user_id);
  const userRecurringExpenses = db.recurring_expenses.filter((r) => r.user_id === user.user_id);
  const userGoals = db.savings_goals.filter((g) => g.user_id === user.user_id);
  const userNotifications = db.notifications.filter((n) => n.user_id === user.user_id);

  const { password_hash: _, ...safeUser } = user;

  res.json({
    user: safeUser,
    expenses: userExpenses,
    budgets: userBudgets,
    category_limits: userCategoryLimits,
    recurring_expenses: userRecurringExpenses,
    savings_goals: userGoals,
    notifications: userNotifications,
  });
});

// Add Expense
app.post("/api/expenses", (req, res) => {
  const { user_id, amount, category, date, description, payment_method } = req.body;

  if (!user_id || !amount || amount <= 0 || !category || !date) {
    return res.status(400).json({ error: "Invalid expense fields. Amount must be > 0." });
  }

  const db = loadDB();
  const newExpense: Expense = {
    expense_id: "exp_" + Date.now(),
    user_id,
    amount: Number(amount),
    category,
    date,
    description: description || "",
    payment_method: payment_method || "UPI",
    created_at: new Date().toISOString(),
  };

  db.expenses.unshift(newExpense);

  // Check budget warnings
  const monthStr = date.substring(0, 7); // YYYY-MM
  const budget = db.budgets.find((b) => b.user_id === user_id && b.month === monthStr);
  
  if (budget) {
    const monthExpenses = db.expenses.filter((e) => e.user_id === user_id && e.date.startsWith(monthStr));
    const totalSpent = monthExpenses.reduce((sum, e) => sum + e.amount, 0);
    const usagePercent = (totalSpent / budget.amount) * 100;

    if (usagePercent >= 100) {
      db.notifications.unshift({
        notification_id: "notif_" + Date.now(),
        user_id,
        message: `🚨 ALERT: You have exceeded your ${monthStr} budget of ₹${budget.amount.toLocaleString()}! Current total spent: ₹${totalSpent.toLocaleString()}.`,
        type: "alert",
        is_read: false,
        created_at: new Date().toISOString(),
      });
    } else if (usagePercent >= 80) {
      db.notifications.unshift({
        notification_id: "notif_" + Date.now(),
        user_id,
        message: `⚠️ WARNING: You have used ${usagePercent.toFixed(1)}% of your monthly budget (₹${totalSpent.toLocaleString()} / ₹${budget.amount.toLocaleString()}).`,
        type: "warning",
        is_read: false,
        created_at: new Date().toISOString(),
      });
    }
  }

  saveDB(db);
  res.json({ expense: newExpense });
});

// Update Expense
app.put("/api/expenses/:expenseId", (req, res) => {
  const { expenseId } = req.params;
  const { amount, category, date, description, payment_method } = req.body;

  const db = loadDB();
  const index = db.expenses.findIndex((e) => e.expense_id === expenseId);
  if (index === -1) {
    return res.status(404).json({ error: "Expense not found" });
  }

  db.expenses[index] = {
    ...db.expenses[index],
    amount: Number(amount),
    category,
    date,
    description,
    payment_method,
  };

  saveDB(db);
  res.json({ expense: db.expenses[index] });
});

// Delete Expense
app.delete("/api/expenses/:expenseId", (req, res) => {
  const { expenseId } = req.params;
  const db = loadDB();
  db.expenses = db.expenses.filter((e) => e.expense_id !== expenseId);
  saveDB(db);
  res.json({ success: true });
});

// Save / Update Budget
app.post("/api/budgets", (req, res) => {
  const { user_id, month, amount } = req.body;
  if (!user_id || !month || !amount || amount <= 0) {
    return res.status(400).json({ error: "Valid user_id, month, and amount (> 0) required." });
  }

  const db = loadDB();
  const existingIdx = db.budgets.findIndex((b) => b.user_id === user_id && b.month === month);
  let savedBudget: Budget;

  if (existingIdx !== -1) {
    db.budgets[existingIdx].amount = Number(amount);
    savedBudget = db.budgets[existingIdx];
  } else {
    savedBudget = {
      budget_id: "b_" + Date.now(),
      user_id,
      month,
      amount: Number(amount),
      created_at: new Date().toISOString(),
    };
    db.budgets.push(savedBudget);
  }

  saveDB(db);
  res.json({ success: true, budget: savedBudget });
});

// Category Limits CRUD
app.post("/api/category-limits", (req, res) => {
  const { user_id, category, limit_amount } = req.body;
  if (!user_id || !category || !limit_amount || limit_amount <= 0) {
    return res.status(400).json({ error: "Valid category and positive limit amount required." });
  }

  const db = loadDB();
  const existingIdx = db.category_limits.findIndex((c) => c.user_id === user_id && c.category === category);
  
  if (existingIdx !== -1) {
    db.category_limits[existingIdx].limit_amount = Number(limit_amount);
  } else {
    db.category_limits.push({
      limit_id: "cl_" + Date.now(),
      user_id,
      category,
      limit_amount: Number(limit_amount),
      created_at: new Date().toISOString(),
    });
  }

  saveDB(db);
  const userLimits = db.category_limits.filter((c) => c.user_id === user_id);
  res.json({ success: true, category_limits: userLimits });
});

app.delete("/api/category-limits/:limitId", (req, res) => {
  const { limitId } = req.params;
  const db = loadDB();
  db.category_limits = db.category_limits.filter((c) => c.limit_id !== limitId);
  saveDB(db);
  res.json({ success: true });
});

// Recurring Expenses CRUD
app.post("/api/recurring-expenses", (req, res) => {
  const { user_id, name, amount, category, frequency, start_date, payment_method } = req.body;
  if (!user_id || !name || !amount || amount <= 0 || !category) {
    return res.status(400).json({ error: "Name, category, and positive amount required." });
  }

  const db = loadDB();
  const newRec: RecurringExpense = {
    recurring_id: "rec_" + Date.now(),
    user_id,
    name,
    amount: Number(amount),
    category,
    frequency: frequency || "monthly",
    start_date: start_date || new Date().toISOString().split("T")[0],
    payment_method: payment_method || "UPI",
    created_at: new Date().toISOString(),
  };

  db.recurring_expenses.push(newRec);
  saveDB(db);
  res.json({ success: true, recurring: newRec });
});

app.put("/api/recurring-expenses/:recurringId", (req, res) => {
  const { recurringId } = req.params;
  const { name, amount, category, frequency, start_date, payment_method } = req.body;

  const db = loadDB();
  const idx = db.recurring_expenses.findIndex((r) => r.recurring_id === recurringId);
  if (idx === -1) {
    return res.status(404).json({ error: "Recurring expense not found" });
  }

  db.recurring_expenses[idx] = {
    ...db.recurring_expenses[idx],
    name: name ?? db.recurring_expenses[idx].name,
    amount: amount !== undefined ? Number(amount) : db.recurring_expenses[idx].amount,
    category: category ?? db.recurring_expenses[idx].category,
    frequency: frequency ?? db.recurring_expenses[idx].frequency,
    start_date: start_date ?? db.recurring_expenses[idx].start_date,
    payment_method: payment_method ?? db.recurring_expenses[idx].payment_method,
  };

  saveDB(db);
  res.json({ success: true, recurring: db.recurring_expenses[idx] });
});

app.delete("/api/recurring-expenses/:recurringId", (req, res) => {
  const { recurringId } = req.params;
  const db = loadDB();
  db.recurring_expenses = db.recurring_expenses.filter((r) => r.recurring_id !== recurringId);
  saveDB(db);
  res.json({ success: true });
});

// Savings Goals CRUD
app.post("/api/savings-goals", (req, res) => {
  const { user_id, goal_name, target_amount, saved_amount, target_date } = req.body;
  if (!user_id || !goal_name || !target_amount || target_amount <= 0) {
    return res.status(400).json({ error: "Goal name and positive target amount required." });
  }

  const db = loadDB();
  const newGoal: SavingsGoal = {
    goal_id: "goal_" + Date.now(),
    user_id,
    goal_name,
    target_amount: Number(target_amount),
    saved_amount: Number(saved_amount || 0),
    target_date: target_date || "",
    created_at: new Date().toISOString(),
  };

  db.savings_goals.push(newGoal);
  saveDB(db);
  res.json({ goal: newGoal });
});

app.put("/api/savings-goals/:goalId", (req, res) => {
  const { goalId } = req.params;
  const { goal_name, target_amount, saved_amount, target_date } = req.body;

  const db = loadDB();
  const idx = db.savings_goals.findIndex((g) => g.goal_id === goalId);
  if (idx === -1) {
    return res.status(404).json({ error: "Goal not found" });
  }

  db.savings_goals[idx] = {
    ...db.savings_goals[idx],
    goal_name,
    target_amount: Number(target_amount),
    saved_amount: Number(saved_amount),
    target_date,
  };

  saveDB(db);
  res.json({ goal: db.savings_goals[idx] });
});

app.delete("/api/savings-goals/:goalId", (req, res) => {
  const { goalId } = req.params;
  const db = loadDB();
  db.savings_goals = db.savings_goals.filter((g) => g.goal_id !== goalId);
  saveDB(db);
  res.json({ success: true });
});

// Read Notification / Mark All Read
app.put("/api/notifications/read", (req, res) => {
  const { user_id, notification_id } = req.body;
  const db = loadDB();

  if (notification_id) {
    const idx = db.notifications.findIndex((n) => n.notification_id === notification_id);
    if (idx !== -1) db.notifications[idx].is_read = true;
  } else if (user_id) {
    db.notifications.forEach((n) => {
      if (n.user_id === user_id) n.is_read = true;
    });
  }

  saveDB(db);
  res.json({ success: true });
});

// Update Profile & Settings
app.put("/api/user/:userId/settings", async (req, res) => {
  const { userId } = req.params;
  const { name, email, currency, default_category, theme, budget_rollover_enabled, new_password } = req.body;

  const db = loadDB();
  const user = db.users.find((u) => u.user_id === userId);
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  if (name) user.name = name;
  if (email) user.email = email.toLowerCase();
  if (currency) user.currency = currency;
  if (default_category) user.default_category = default_category;
  if (theme) user.theme = theme;
  if (budget_rollover_enabled !== undefined) user.budget_rollover_enabled = budget_rollover_enabled;

  if (new_password && new_password.trim().length > 0) {
    const salt = await bcrypt.genSalt(10);
    user.password_hash = await bcrypt.hash(new_password, salt);
  }

  saveDB(db);
  const { password_hash: _, ...safeUser } = user;
  res.json({ user: safeUser });
});

// Populate Demo Data
app.post("/api/user/:userId/demo-data", (req, res) => {
  const { userId } = req.params;
  generateDemoDataForUser(userId);
  res.json({ success: true });
});

// Reset User Expenses
app.post("/api/user/:userId/reset", (req, res) => {
  const { userId } = req.params;
  const db = loadDB();

  db.expenses = db.expenses.filter((e) => e.user_id !== userId);
  db.budgets = db.budgets.filter((b) => b.user_id !== userId);
  db.category_limits = db.category_limits.filter((c) => c.user_id !== userId);
  db.recurring_expenses = db.recurring_expenses.filter((r) => r.user_id !== userId);
  db.savings_goals = db.savings_goals.filter((g) => g.user_id !== userId);
  db.notifications = db.notifications.filter((n) => n.user_id !== userId);

  saveDB(db);
  res.json({ success: true });
});

// Delete User Account
app.delete("/api/user/:userId", (req, res) => {
  const { userId } = req.params;
  const db = loadDB();

  db.users = db.users.filter((u) => u.user_id !== userId);
  db.expenses = db.expenses.filter((e) => e.user_id !== userId);
  db.budgets = db.budgets.filter((b) => b.user_id !== userId);
  db.category_limits = db.category_limits.filter((c) => c.user_id !== userId);
  db.recurring_expenses = db.recurring_expenses.filter((r) => r.user_id !== userId);
  db.savings_goals = db.savings_goals.filter((g) => g.user_id !== userId);
  db.notifications = db.notifications.filter((n) => n.user_id !== userId);

  saveDB(db);
  res.json({ success: true });
});

// Heuristic fallback for category suggestion
function ruleBasedCategorySuggestion(text: string): { category: string; confidence: number; reason: string } {
  const lower = text.toLowerCase();

  // Food
  if (/\b(food|lunch|dinner|breakfast|snack|snacks|canteen|mess|cafe|coffee|tea|chai|pizza|burger|swiggy|zomato|starbucks|mcdonald|kfc|subway|domino|bakery|grocer|groceries|restaurant|dosa|biryani|eat|meal|supermarket|ice cream|shawarma|chole)\b/i.test(lower)) {
    return { category: "Food", confidence: 0.9, reason: "Matched dining, mess, cafe, or food keywords" };
  }

  // Transportation
  if (/\b(uber|ola|rapido|metro|bus|train|irctc|cab|taxi|auto|rickshaw|flight|indigo|air|petrol|diesel|fuel|gas|fare|ticket|transit|commute|toll|parking|scooter|bike)\b/i.test(lower)) {
    return { category: "Transportation", confidence: 0.9, reason: "Matched transit, ride-share, or commute keywords" };
  }

  // Education
  if (/\b(book|books|textbook|course|courses|udemy|coursera|tuition|exam|exams|college|university|school|stationery|pen|pencil|notebook|paper|library|lab|xerox|photocopy|print|printing|edx|class|fee|fees|semester)\b/i.test(lower)) {
    return { category: "Education", confidence: 0.9, reason: "Matched academic, tuition, or study materials" };
  }

  // Entertainment
  if (/\b(movie|movies|cinema|film|pvr|inox|theatre|netflix|spotify|disney|prime video|youtube|game|gaming|steam|playstation|xbox|concert|club|party|bowling|arcade|show)\b/i.test(lower)) {
    return { category: "Entertainment", confidence: 0.9, reason: "Matched movies, games, or entertainment" };
  }

  // Mobile/Internet
  if (/\b(recharge|jio|airtel|vi|vodafone|bsnl|broadband|wifi|internet|data|mobile data|cellular|fiber|telecom|phone bill)\b/i.test(lower)) {
    return { category: "Mobile/Internet", confidence: 0.9, reason: "Matched cellular, data, or internet recharge" };
  }

  // Shopping
  if (/\b(amazon|flipkart|myntra|zara|h&m|clothes|clothing|shirt|t-shirt|pants|jeans|shoes|sneakers|electronics|gadget|gadgets|mall|store|buy|purchase|dress|jacket|hoodie|watch)\b/i.test(lower)) {
    return { category: "Shopping", confidence: 0.85, reason: "Matched retail, electronics, or shopping" };
  }

  // Personal
  if (/\b(haircut|salon|barber|grooming|pharmacy|medicine|medicines|doctor|clinic|hospital|apollo|gym|fitness|rent|hostel|room|laundry|dry clean|soap|shampoo|skincare|dentist)\b/i.test(lower)) {
    return { category: "Personal", confidence: 0.85, reason: "Matched personal care, hostel rent, or health" };
  }

  return { category: "Other", confidence: 0.5, reason: "General transaction expense" };
}

// AI Category Suggestion using Gemini API
app.post("/api/ai/suggest-category", async (req, res) => {
  const { text, merchant, description } = req.body;
  const inputStr = [merchant, description, text].filter(Boolean).join(" - ").trim();

  if (!inputStr) {
    return res.json({
      category: "Food",
      confidence: 0,
      reason: "No merchant or description provided",
      source: "rule_fallback",
    });
  }

  const ai = getGeminiClient();
  if (ai) {
    try {
      const prompt = `You are an expense categorization assistant for a university student expense tracker.
Categorize this transaction into ONE of these exact categories:
- Food: restaurants, dining, campus mess, cafe, bakery, coffee, snacks, groceries, Swiggy, Zomato, Starbucks, McDonald's, KFC
- Transportation: bus, train, metro, auto, cab, bike, fuel, Uber, Ola, Rapido, flight
- Education: tuition, college fees, books, textbooks, stationery, online courses (Udemy, Coursera), exams, lab equipment
- Shopping: clothing, shoes, fashion, electronics, gadgets, Amazon, Flipkart, accessories
- Entertainment: movies, cinema, concerts, Netflix, Spotify, streaming, gaming, outings, party
- Personal: hostel rent, haircut, grooming, gym, pharmacy, medical, laundry, personal care
- Mobile/Internet: phone recharge, cellular data, WiFi, broadband, Jio, Airtel, Vi
- Other: miscellaneous expenses not fitting the above

Merchant / Transaction: "${inputStr}"

Output JSON with:
- category: strictly one of ["Food", "Transportation", "Education", "Shopping", "Entertainment", "Personal", "Mobile/Internet", "Other"]
- confidence: number between 0.0 and 1.0
- reason: concise explanation (under 10 words) why this category fits`;

      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              category: {
                type: Type.STRING,
                enum: [
                  "Food",
                  "Transportation",
                  "Education",
                  "Shopping",
                  "Entertainment",
                  "Personal",
                  "Mobile/Internet",
                  "Other",
                ],
                description: "The most fitting category",
              },
              confidence: {
                type: Type.NUMBER,
                description: "Confidence from 0 to 1",
              },
              reason: {
                type: Type.STRING,
                description: "Short reason for category",
              },
            },
            required: ["category", "confidence", "reason"],
          },
        },
      });

      const responseText = response.text;
      if (responseText) {
        const parsed = JSON.parse(responseText.trim());
        if (parsed && parsed.category) {
          return res.json({
            category: parsed.category,
            confidence: parsed.confidence ?? 0.95,
            reason: parsed.reason ?? "Identified by Gemini AI",
            source: "gemini",
          });
        }
      }
    } catch (err: any) {
      console.warn("Gemini API category suggestion error:", err?.message || err);
    }
  }

  // Fallback heuristic if Gemini API key is unset or error occurs
  const fallback = ruleBasedCategorySuggestion(inputStr);
  return res.json({
    ...fallback,
    source: "rule_fallback",
  });
});

// Start server function
async function startServer() {
  ensureDemoUserExists();

  // Vite middleware for dev
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Student Expense Tracker running on http://localhost:${PORT}`);
  });
}

startServer();
