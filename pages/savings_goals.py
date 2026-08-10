import streamlit as st
import uuid
import datetime
from database import get_connection
from utils import format_currency

def render_savings_goals():
    if "user" not in st.session_state or not st.session_state.user:
        st.warning("Please log in first.")
        return

    user_id = st.session_state.user['user_id']
    st.title("🎯 Savings Goals Tracker")

    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM savings_goals WHERE user_id = ? ORDER BY created_at DESC", (user_id,))
    goals = [dict(r) for r in cursor.fetchall()]
    conn.close()

    if goals:
        st.subheader("Your Active Savings Goals")
        for g in goals:
            target = g['target_amount']
            saved = g['saved_amount']
            pct = min(1.0, saved / target) if target > 0 else 0.0
            
            with st.expander(f"🎯 {g['goal_name']} - {format_currency(saved)} / {format_currency(target)} ({int(pct*100)}%)", expanded=True):
                st.progress(pct)
                col1, col2 = st.columns(2)
                col1.write(f"**Target Date:** {g['target_date'] or 'N/A'}")
                col2.write(f"**Remaining:** {format_currency(target - saved)}")

                add_amt = st.number_input(f"Deposit to {g['goal_name']}", min_value=1.0, value=500.0, step=100.0, key=f"dep_{g['goal_id']}")
                if st.button("Deposit Funds", key=f"btn_dep_{g['goal_id']}"):
                    new_saved = saved + add_amt
                    conn = get_connection()
                    cursor = conn.cursor()
                    cursor.execute("UPDATE savings_goals SET saved_amount = ? WHERE goal_id = ?", (new_saved, g['goal_id']))
                    conn.commit()
                    conn.close()
                    st.success(f"Added {format_currency(add_amt)} to {g['goal_name']}!")
                    st.rerun()

    st.divider()
    st.subheader("➕ Create New Savings Goal")
    with st.form("new_goal_form"):
        gname = st.text_input("Goal Name", placeholder="e.g. New Laptop for Coding")
        target_amt = st.number_input("Target Amount (₹)", min_value=500.0, value=10000.0, step=500.0)
        initial_saved = st.number_input("Initial Saved Amount (₹)", min_value=0.0, value=1000.0, step=100.0)
        tdate = st.date_input("Target Date", datetime.date.today() + datetime.timedelta(days=90))

        if st.form_submit_button("Create Goal", type="primary"):
            conn = get_connection()
            cursor = conn.cursor()
            gid = "goal_" + uuid.uuid4().hex[:12]
            now_iso = datetime.datetime.now().isoformat()
            cursor.execute(
                "INSERT INTO savings_goals (goal_id, user_id, goal_name, target_amount, saved_amount, target_date, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
                (gid, user_id, gname, target_amt, initial_saved, str(tdate), now_iso)
            )
            conn.commit()
            conn.close()
            st.success(f"Created goal '{gname}'!")
            st.rerun()

if __name__ == "__main__":
    render_savings_goals()
