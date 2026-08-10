import streamlit as st
import datetime
import uuid
from database import get_connection
from utils import CATEGORIES, PAYMENT_METHODS, get_current_month_str
from notifications import check_budget_alerts

def render_add_expense():
    if "user" not in st.session_state or not st.session_state.user:
        st.warning("Please log in first.")
        return

    user_id = st.session_state.user['user_id']
    st.title("➕ Add New Expense")

    with st.form("add_expense_form"):
        col1, col2 = st.columns(2)
        with col1:
            amount = st.number_input("Amount (₹)", min_value=1.0, value=150.0, step=10.0)
            category = st.selectbox("Category", CATEGORIES)
            payment_method = st.selectbox("Payment Method", PAYMENT_METHODS)

        with col2:
            date_val = st.date_input("Date", datetime.date.today())
            description = st.text_input("Description / Notes", placeholder="e.g. Lunch at college mess")

        submitted = st.form_submit_button("Add Expense", type="primary", use_container_width=True)

        if submitted:
            conn = get_connection()
            cursor = conn.cursor()
            exp_id = "exp_" + uuid.uuid4().hex[:12]
            now_iso = datetime.datetime.now().isoformat()
            
            cursor.execute(
                "INSERT INTO expenses (expense_id, user_id, amount, category, date, description, payment_method, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                (exp_id, user_id, amount, category, str(date_val), description, payment_method, now_iso)
            )
            conn.commit()
            conn.close()

            # Trigger budget checks
            month_str = str(date_val)[:7]
            check_budget_alerts(user_id, month_str)

            st.success(f"Success! Recorded ₹{amount:,.2f} for '{description or category}'.")

if __name__ == "__main__":
    render_add_expense()
