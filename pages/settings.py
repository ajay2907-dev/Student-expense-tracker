import streamlit as st
import uuid
import datetime
from database import get_connection

def render_settings():
    if "user" not in st.session_state or not st.session_state.user:
        st.warning("Please log in first.")
        return

    user_id = st.session_state.user['user_id']
    st.title("⚙️ Application Settings")

    st.subheader("Preferences")
    currency = st.selectbox("Preferred Currency", ["₹ (INR)", "$ (USD)", "€ (EUR)", "£ (GBP)"])
    theme = st.selectbox("Theme Mode", ["🌙 Dark Mode (Glassmorphism)", "☀️ Light Mode"])

    st.divider()
    st.subheader("🧪 Demo Data Seeder")
    st.write("Populate your account with realistic sample university expenses for testing.")
    if st.button("Load Demo Sample Expenses", type="secondary"):
        conn = get_connection()
        cursor = conn.cursor()
        
        sample_items = [
            (180, "Food", "Lunch at mess", "UPI"),
            (45, "Food", "Evening Tea & Samosa", "Cash"),
            (850, "Education", "Computer Science Textbook", "Debit Card"),
            (120, "Transportation", "Bus Pass Renewal", "UPI"),
            (4500, "Personal", "Campus Hostel Rent", "Bank Transfer"),
            (299, "Mobile/Internet", "Mobile Data Recharge", "UPI"),
            (350, "Entertainment", "Movie Ticket", "Credit Card")
        ]
        
        now = datetime.datetime.now()
        for idx, (amt, cat, desc, pay) in enumerate(sample_items):
            exp_id = "demo_" + uuid.uuid4().hex[:10]
            exp_date = (now - datetime.timedelta(days=idx*2)).strftime("%Y-%m-%d")
            cursor.execute(
                "INSERT INTO expenses (expense_id, user_id, amount, category, date, description, payment_method, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                (exp_id, user_id, amt, cat, exp_date, desc, pay, now.isoformat())
            )
        conn.commit()
        conn.close()
        st.success("Loaded 7 sample student expenses successfully!")

    st.divider()
    st.subheader("⚠️ Data Reset")
    if st.button("Delete All Expenses", type="primary"):
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM expenses WHERE user_id = ?", (user_id,))
        conn.commit()
        conn.close()
        st.warning("All expense records cleared.")
        st.rerun()

if __name__ == "__main__":
    render_settings()
