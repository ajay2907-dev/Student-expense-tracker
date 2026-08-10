import streamlit as st
from analytics import fetch_user_expenses_df
from reports import generate_csv_report, generate_pdf_report
from utils import get_current_month_str
from database import get_connection

def render_reports():
    if "user" not in st.session_state or not st.session_state.user:
        st.warning("Please log in first.")
        return

    user = st.session_state.user
    user_id = user['user_id']
    st.title("📄 Financial Statements & Export")

    df = fetch_user_expenses_df(user_id)
    curr_month = get_current_month_str()

    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT amount FROM budgets WHERE user_id = ? AND month = ?", (user_id, curr_month))
    b_row = cursor.fetchone()
    monthly_budget = b_row['amount'] if b_row else 15000.0
    conn.close()

    total_spent = df['amount'].sum() if not df.empty else 0.0

    col1, col2 = st.columns(2)

    with col1:
        st.subheader("📊 Export Raw CSV")
        st.write("Download your full transaction history in CSV format.")
        csv_bytes = generate_csv_report(df)
        st.download_button(
            label="📥 Download CSV File",
            data=csv_bytes,
            file_name=f"student_expenses_{curr_month}.csv",
            mime="text/csv",
            use_container_width=True
        )

    with col2:
        st.subheader("📑 Generate Official PDF Statement")
        st.write("Generate a styled PDF statement with summary tables.")
        if st.button("📄 Build PDF Statement", type="primary", use_container_width=True):
            pdf_bytes = generate_pdf_report(
                student_name=user['name'],
                email=user['email'],
                period_str=curr_month,
                budget=monthly_budget,
                total_spent=total_spent,
                df=df
            )
            st.download_button(
                label="📥 Download PDF Statement",
                data=pdf_bytes,
                file_name=f"expense_statement_{user['name']}_{curr_month}.pdf",
                mime="application/pdf",
                use_container_width=True
            )

if __name__ == "__main__":
    render_reports()
