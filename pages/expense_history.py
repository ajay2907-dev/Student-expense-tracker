import streamlit as st
import pandas as pd
from analytics import fetch_user_expenses_df
from utils import CATEGORIES, PAYMENT_METHODS
from database import get_connection

def render_expense_history():
    if "user" not in st.session_state or not st.session_state.user:
        st.warning("Please log in first.")
        return

    user_id = st.session_state.user['user_id']
    st.title("📋 Expense History & Management")

    df = fetch_user_expenses_df(user_id)
    if df.empty:
        st.info("No expense history recorded yet.")
        return

    c1, c2, c3 = st.columns(3)
    with c1:
        search_query = st.text_input("🔍 Search Description", placeholder="e.g. Books, Pizza, Bus...")
    with c2:
        cat_filter = st.multiselect("Category Filter", CATEGORIES, default=[])
    with c3:
        pay_filter = st.multiselect("Payment Method Filter", PAYMENT_METHODS, default=[])

    filtered_df = df.copy()
    if search_query:
        filtered_df = filtered_df[filtered_df['description'].str.contains(search_query, case=False, na=False)]
    if cat_filter:
        filtered_df = filtered_df[filtered_df['category'].isin(cat_filter)]
    if pay_filter:
        filtered_df = filtered_df[filtered_df['payment_method'].isin(pay_filter)]

    st.write(f"Showing **{len(filtered_df)}** of {len(df)} total transactions.")
    st.dataframe(filtered_df, use_container_width=True)

    st.divider()
    st.subheader("🗑️ Delete Transaction")
    exp_to_del = st.selectbox("Select Expense ID to delete", filtered_df['expense_id'].tolist() if not filtered_df.empty else [])
    if st.button("Delete Selected Expense", type="secondary"):
        if exp_to_del:
            conn = get_connection()
            cursor = conn.cursor()
            cursor.execute("DELETE FROM expenses WHERE expense_id = ? AND user_id = ?", (exp_to_del, user_id))
            conn.commit()
            conn.close()
            st.success("Expense deleted successfully!")
            st.rerun()

if __name__ == "__main__":
    render_expense_history()
