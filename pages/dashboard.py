import streamlit as st
import pandas as pd
from analytics import fetch_user_expenses_df, generate_category_pie_chart, generate_monthly_bar_chart
from utils import format_currency, get_current_month_str
from database import get_connection

def render_dashboard():
    if "user" not in st.session_state or not st.session_state.user:
        st.warning("Please log in first.")
        return

    user_id = st.session_state.user['user_id']
    st.title("🏠 Financial Dashboard")

    df = fetch_user_expenses_df(user_id)
    curr_month = get_current_month_str()

    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT amount FROM budgets WHERE user_id = ? AND month = ?", (user_id, curr_month))
    b_row = cursor.fetchone()
    monthly_budget = b_row['amount'] if b_row else 15000.0
    conn.close()

    total_spent = df['amount'].sum() if not df.empty else 0.0
    remaining = monthly_budget - total_spent
    num_exp = len(df)
    avg_daily = total_spent / 30.0
    max_exp = df['amount'].max() if not df.empty else 0.0

    c1, c2, c3, c4, c5, c6 = st.columns(6)
    c1.metric("Monthly Budget", format_currency(monthly_budget))
    c2.metric("Total Spent", format_currency(total_spent))
    c3.metric("Remaining", format_currency(remaining))
    c4.metric("Expenses Count", str(num_exp))
    c5.metric("Avg Daily", format_currency(avg_daily))
    c6.metric("Highest Expense", format_currency(max_exp))

    st.divider()

    col_left, col_right = st.columns([2, 1])

    with col_left:
        st.subheader("📋 Recent Transactions")
        if not df.empty:
            st.dataframe(df[['date', 'description', 'category', 'payment_method', 'amount']].head(8), use_container_width=True)
        else:
            st.info("No expense history recorded yet. Click 'Add Expense' to record your first transaction!")

    with col_right:
        st.subheader("📊 Category Spending")
        fig_pie = generate_category_pie_chart(df)
        if fig_pie:
            st.plotly_chart(fig_pie, use_container_width=True)
        else:
            st.info("No data for pie chart.")

if __name__ == "__main__":
    render_dashboard()
