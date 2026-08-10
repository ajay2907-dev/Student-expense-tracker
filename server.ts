import express from "express";
import path from "path";
import fs from "fs";
import bcrypt from "bcryptjs";
import { createServer as createViteServer } from "vite";

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
  savings_goals: SavingsGoal[];
  notifications: Notification[];
}

function loadDB(): DatabaseSchema {
  if (!fs.existsSync(dbFilePath)) {
    const initialDB: DatabaseSchema = {
      users: [],
      expenses: [],
      budgets: [],
      savings_goals: [],
      notifications: [],
    };
    fs.writeFileSync(dbFilePath, JSON.stringify(initialDB, null, 2));
    return initialDB;
  }
  try {
    const data = fs.readFileSync(dbFilePath, "utf-8");
    return JSON.parse(data);
  } catch (e) {
    console.error("Error reading database:", e);
    return { users: [], expenses: [], budgets: [], savings_goals: [], notifications: [] };
  }
}

function saveDB(db: DatabaseSchema) {
  fs.writeFileSync(dbFilePath, JSON.stringify(db, null, 2));
}

// Demo data generator helper
function generateDemoDataForUser(userId: string) {
  const db = loadDB();

  // Remove existing user expenses, budgets, goals, notifications
  db.expenses = db.expenses.filter((e) => e.user_id !== userId);
  db.budgets = db.budgets.filter((b) => b.user_id !== userId);
  db.savings_goals = db.savings_goals.filter((g) => g.user_id !== userId);
  db.notifications = db.notifications.filter((n) => n.user_id !== userId);

  const now = new Date();
  const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  
  const prevMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevMonthStr = `${prevMonthDate.getFullYear()}-${String(prevMonthDate.getMonth() + 1).padStart(2, "0")}`;

  // Monthly Budget
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

function ensureDemoUserExists() {
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
    };

    db.users.push(demoUser);
    saveDB(db);
    generateDemoDataForUser(userId);
    console.log("Demo user initialized: alex.student@university.edu");
  } else {
    // Ensure password123 is valid
    const isPasswordValid = bcrypt.compareSync("password123", demoUser.password_hash);
    if (!isPasswordValid) {
      demoUser.password_hash = bcrypt.hashSync("password123", bcrypt.genSaltSync(10));
      saveDB(db);
    }
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

  const db = loadDB();
  const user = db.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
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
  const db = loadDB();

  const user = db.users.find((u) => u.user_id === userId);
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  const userExpenses = db.expenses.filter((e) => e.user_id === userId);
  const userBudgets = db.budgets.filter((b) => b.user_id === userId);
  const userGoals = db.savings_goals.filter((g) => g.user_id === userId);
  const userNotifications = db.notifications.filter((n) => n.user_id === userId);

  const { password_hash: _, ...safeUser } = user;

  res.json({
    user: safeUser,
    expenses: userExpenses,
    budgets: userBudgets,
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

  if (existingIdx !== -1) {
    db.budgets[existingIdx].amount = Number(amount);
  } else {
    db.budgets.push({
      budget_id: "b_" + Date.now(),
      user_id,
      month,
      amount: Number(amount),
      created_at: new Date().toISOString(),
    });
  }

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
  const { name, email, currency, default_category, theme, new_password } = req.body;

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
  db.savings_goals = db.savings_goals.filter((g) => g.user_id !== userId);
  db.notifications = db.notifications.filter((n) => n.user_id !== userId);

  saveDB(db);
  res.json({ success: true });
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
