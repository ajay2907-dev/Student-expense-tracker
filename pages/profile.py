import streamlit as st
from database import get_connection

def render_profile():
    if "user" not in st.session_state or not st.session_state.user:
        st.warning("Please log in first.")
        return

    user = st.session_state.user
    st.title("👤 Student Profile")

    st.write(f"**Full Name:** {user['name']}")
    st.write(f"**Email:** {user['email']}")
    st.write(f"**Member Since:** {user['created_at'][:10]}")

    st.divider()
    st.subheader("Edit Profile Information")
    new_name = st.text_input("Name", value=user['name'])
    new_email = st.text_input("Email", value=user['email'])

    if st.button("Save Profile Changes", type="primary"):
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("UPDATE users SET name = ?, email = ? WHERE user_id = ?", (new_name, new_email, user['user_id']))
        conn.commit()
        conn.close()
        st.session_state.user['name'] = new_name
        st.session_state.user['email'] = new_email
        st.success("Profile updated successfully!")
        st.rerun()

if __name__ == "__main__":
    render_profile()
