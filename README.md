# 💰 Student Expense Tracker

A modern, full-featured web application built for university students to track personal expenses, set monthly budgets, monitor savings goals, analyze spending patterns with interactive Plotly charts, and export PDF/CSV financial reports.

Designed with a sleek **Luminous Scholar Glassmorphism** aesthetic supporting both Light and Dark themes.

---

## 🌟 Key Features

1. **Authentication**: Secure registration, login, and password hashing. Multi-tenant user isolation.
2. **Dashboard**: Financial stats overview (Monthly Budget, Total Spent, Remaining, Avg Daily Spending, Highest Expense), recent transactions, and progress indicators.
3. **Add Expense**: Categorized expense recording (Food, Transportation, Education, Shopping, Entertainment, Personal, Mobile/Internet, Other) with flexible payment methods (UPI, Cash, Debit Card, Credit Card, Bank Transfer).
4. **Expense History**: Multi-criteria search, category & payment filtering, date ranges, sorting, and inline edit/delete controls.
5. **Analytics**: Interactive Plotly visualizations (Category Donut Chart, Monthly Bar Chart, Daily Spending Trend, Payment Breakdown) + automated smart AI insights.
6. **Budget Tracker**: Set monthly budgets, real-time spent vs. remaining tracking, and dynamic alert thresholds (0-50% Green, 50-80% Yellow, 80-100% Red, >100% Exceeded).
7. **Savings Goals**: Milestone cards with target amounts, current savings progress bars, deposit updates, and target dates.
8. **Monthly Comparison**: Month-over-month spending analysis with percentage increase/decrease calculations.
9. **Notifications**: Smart budget warnings, high expense flags, and savings milestone alerts.
10. **Reports**: Filtered CSV data downloads and professional PDF financial statements powered by ReportLab.
11. **Profile & Settings**: Profile editing, currency selection (₹ INR default, $, €), Light/Dark theme selector, and sample demo data loader.

---

## 🛠️ Technology Stack

- **Frontend & App Framework**: Streamlit / React + Tailwind CSS
- **Database**: SQLite (`expenses.db`)
- **Data Processing**: Pandas
- **Visualizations**: Plotly / Recharts
- **PDF Reports**: ReportLab / jsPDF
- **Security**: Password hashing with bcrypt, parameterized SQL queries

---

## 🚀 Quick Start Guide

### Installation

1. Clone the repository and navigate into the project directory:
   ```bash
   cd student_expense_tracker
   ```

2. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Launch the Streamlit application:
   ```bash
   streamlit run app.py
   ```

---

## 📂 Project Architecture

```text
student_expense_tracker/
│
├── app.py              # Main Streamlit application entrypoint & routing
├── database.py         # SQLite database schema, connections & queries
├── auth.py             # User registration, login & password security
├── analytics.py        # Pandas aggregation & Plotly chart builders
├── reports.py          # PDF & CSV statement generators
├── notifications.py    # Budget threshold alert engine
├── utils.py            # Currency formatting & helper utilities
├── requirements.txt    # Python dependencies
├── README.md           # Documentation
│
├── pages/
│   ├── dashboard.py        # Main stats overview & sparklines
│   ├── add_expense.py      # Expense entry form
│   ├── expense_history.py  # Filterable & editable transaction table
│   ├── analytics.py        # Deep chart visualizer & smart insights
│   ├── budget.py           # Monthly budget gauge & history
│   ├── savings_goals.py    # Milestone savings trackers
│   ├── reports.py          # PDF / CSV export center
│   ├── notifications.py    # Read/unread notification feed
│   ├── profile.py          # User information & activity stats
│   └── settings.py         # App customization & demo data loader
│
└── database/
    └── expenses.db         # Persistent SQLite database
```

---

## 🔒 Security & Privacy

- Every SQL query is parameterized to prevent SQL injection.
- Passwords are securely hashed using bcrypt salts.
- Session state ensures users can only access their own financial records.
