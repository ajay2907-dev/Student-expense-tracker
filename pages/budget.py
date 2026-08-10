import streamlit as st
import uuid
import datetime
from database import get_connection
from utils import get_current_month_str, format_currency

def render_budget():
    if "user" not in st.session_state or not st.session_state.user:
        st.warning("Please log in first.")
        return

    user_id = st.session_state.user['user_id']
    curr_month = get_current_month_str()
    st.title("💵 Monthly Budget Planner")

    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT amount FROM budgets WHERE user_id = ? AND month = ?", (user_id, curr_month))
    b_row = cursor.fetchone()
    current_budget = b_row['amount'] if b_row else 15000.0

    cursor.execute(
        "SELECT SUM(amount) as total FROM expenses WHERE user_id = ? AND strftime('%Y-%m', date) = ?",
        (user_id, curr_month)
    )
    e_row = cursor.fetchone()
    total_spent = e_row['total'] if e_row and e_row['total'] else 0.0
    conn.close()

    remaining = current_budget - total_spent
    pct = min(100, int((total_spent / current_budget) * 100)) if current_budget > 0 else 0

    st.subheader(f"Current Month: {curr_month}")
    c1, c2, c3, c4 = st.columns(4)
    c1.metric("Monthly Budget", format_currency(current_budget))
    c2.metric("Spent", format_currency(total_spent))
    c3.metric("Remaining", format_currency(remaining))
    c4.metric("Budget Used", f"{pct}%")

    st.progress(pct / 100.0)

    if pct < 50:
        st.success("🟢 Your spending is well under control!")
    elif pct < 80:
        st.warning("🟡 Be mindful: You have used over half your monthly budget.")
    elif pct <= 100:
        st.error("🔴 Warning: You are approaching your budget limit!")
    else:
        st.error("🚨 ALERT: You have exceeded your monthly budget!")

    st.divider()
    st.subheader("⚙️ Update Monthly Budget")
    new_b = st.number_input("Set Budget Amount (₹)", min_value=1000.0, value=float(current_budget), step=1000.0)
    if st.button("Save Budget", type="primary"):
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT budget_id FROM budgets WHERE user_id = ? AND month = ?", (user_id, curr_month))
        existing = cursor.fetchone()
        if existing:
            cursor.execute("UPDATE budgets SET amount = ? WHERE user_id = ? AND month = ?", (new_b, user_id, curr_month))
        else:
            bid = "b_" + uuid.uuid4().hex[:12]
            now_iso = datetime.datetime.now().isoformat()
            cursor.execute(
                "INSERT INTO budgets (budget_id, user_id, month, amount, created_at) VALUES (?, ?, ?, ?, ?)",
                (bid, user_id, curr_month, new_b, now_iso)
            )
        conn.commit()
        conn.close()
        st.success("Budget updated successfully!")
        st.rerun()

if __name__ == "__main__":
    render_budget()
