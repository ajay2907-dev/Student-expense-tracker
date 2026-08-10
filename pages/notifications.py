import streamlit as st
from notifications import get_user_notifications, mark_notification_read

def render_notifications():
    if "user" not in st.session_state or not st.session_state.user:
        st.warning("Please log in first.")
        return

    user_id = st.session_state.user['user_id']
    st.title("🔔 Notifications & Alerts Feed")

    notifs = get_user_notifications(user_id)

    if not notifs:
        st.info("No notifications right now.")
        return

    for n in notifs:
        icon = "🚨" if n['type'] == "alert" else "⚠️" if n['type'] == "warning" else "ℹ️"
        st.write(f"{icon} **{n['created_at'][:10]}**: {n['message']}")
        if not n['is_read']:
            if st.button("Mark as Read", key=f"read_{n['notification_id']}"):
                mark_notification_read(n['notification_id'])
                st.rerun()

if __name__ == "__main__":
    render_notifications()
