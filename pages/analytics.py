import streamlit as st
from analytics import (
    fetch_user_expenses_df,
    generate_category_pie_chart,
    generate_monthly_bar_chart,
    generate_daily_line_chart,
    generate_payment_chart,
    generate_spending_insights
)

def render_analytics():
    if "user" not in st.session_state or not st.session_state.user:
        st.warning("Please log in first.")
        return

    user_id = st.session_state.user['user_id']
    st.title("📊 Financial Analytics & Insights")

    df = fetch_user_expenses_df(user_id)
    if df.empty:
        st.info("No expense data available to build analytics. Please add expenses first.")
        return

    tab1, tab2 = st.tabs(["📈 Visual Charts", "🧠 Smart Insights"])

    with tab1:
        c1, c2 = st.columns(2)
        with c1:
            st.subheader("Category Distribution")
            fig1 = generate_category_pie_chart(df)
            if fig1: st.plotly_chart(fig1, use_container_width=True)
        with c2:
            st.subheader("Monthly Spending Trend")
            fig2 = generate_monthly_bar_chart(df)
            if fig2: st.plotly_chart(fig2, use_container_width=True)

        c3, c4 = st.columns(2)
        with c3:
            st.subheader("Daily Spending")
            fig3 = generate_daily_line_chart(df)
            if fig3: st.plotly_chart(fig3, use_container_width=True)
        with c4:
            st.subheader("Payment Method Breakdown")
            fig4 = generate_payment_chart(df)
            if fig4: st.plotly_chart(fig4, use_container_width=True)

    with tab2:
        st.subheader("Automated AI Spending Insights")
        insights = generate_spending_insights(df)
        for insight in insights:
            st.info(insight)

if __name__ == "__main__":
    render_analytics()
