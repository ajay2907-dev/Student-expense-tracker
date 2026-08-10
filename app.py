import streamlit as st
from database import init_db
from auth import login_user, register_user

st.set_page_config(
    page_title="Student Expense Tracker",
    page_icon="💰",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Custom Glassmorphism Theme CSS
st.markdown("""
<style>
    .stApp {
        background-color: #0b1326;
        color: #dae2fd;
    }
    .stSidebar {
        background-color: rgba(23, 31, 51, 0.8) !important;
        backdrop-filter: blur(20px);
        border-right: 1px solid rgba(255, 255, 255, 0.1);
    }
    .metric-card {
        background: rgba(255, 255, 255, 0.05);
        backdrop-filter: blur(20px);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 16px;
        padding: 20px;
        margin-bottom: 15px;
    }
</style>
""", unsafe_allow_html=True)

# Initialize Database
init_db()

if "logged_in" not in st.session_state:
    st.session_state.logged_in = False
if "user" not in st.session_state:
    st.session_state.user = None

def main():
    if not st.session_state.logged_in:
        st.title("💰 Student Expense Tracker")
        st.subheader("Smart, visual expense management designed for university students.")
        
        tab1, tab2 = st.tabs(["🔐 Login", "📝 Register"])
        
        with tab1:
            st.write("### Sign In to Your Account")
            email = st.text_input("Email", key="login_email")
            password = st.text_input("Password", type="password", key="login_pass")
            if st.button("Login", type="primary", use_container_width=True):
                success, res = login_user(email, password)
                if success:
                    st.session_state.logged_in = True
                    st.session_state.user = res
                    st.success("Login successful!")
                    st.rerun()
                else:
                    st.error(res)
                    
        with tab2:
            st.write("### Create Student Account")
            reg_name = st.text_input("Full Name", key="reg_name")
            reg_email = st.text_input("Email Address", key="reg_email")
            reg_pass = st.text_input("Password", type="password", key="reg_pass")
            reg_pass_conf = st.text_input("Confirm Password", type="password", key="reg_pass_conf")
            
            if st.button("Register", use_container_width=True):
                if reg_pass != reg_pass_conf:
                    st.error("Passwords do not match!")
                else:
                    ok, msg = register_user(reg_name, reg_email, reg_pass)
                    if ok:
                        st.success("Registration successful! Please login.")
                    else:
                        st.error(msg)
    else:
        st.sidebar.title("💰 ExpenseFlow")
        st.sidebar.caption(f"Logged in as: {st.session_state.user['name']}")
        
        menu = st.sidebar.radio(
            "Navigation",
            ["Dashboard", "Add Expense", "Expense History", "Analytics", "Budget", "Savings Goals", "Reports", "Notifications", "Profile", "Settings"]
        )
        
        if st.sidebar.button("🚪 Logout", use_container_width=True):
            st.session_state.logged_in = False
            st.session_state.user = None
            st.rerun()

        st.info("💡 Tip: Use the navigation menu on the left to switch views.")

if __name__ == "__main__":
    main()
