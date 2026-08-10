import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
from database import get_connection

def fetch_user_expenses_df(user_id: str) -> pd.DataFrame:
    conn = get_connection()
    df = pd.read_sql_query(
        "SELECT expense_id, amount, category, date, description, payment_method, created_at FROM expenses WHERE user_id = ? ORDER BY date DESC",
        conn,
        params=(user_id,)
    )
    conn.close()
    if not df.empty:
        df['date'] = pd.to_datetime(df['date'])
        df['amount'] = pd.to_numeric(df['amount'])
    return df

def generate_category_pie_chart(df: pd.DataFrame):
    if df.empty:
        return None
    cat_summary = df.groupby('category')['amount'].sum().reset_index()
    fig = px.pie(
        cat_summary,
        values='amount',
        names='category',
        hole=0.4,
        color_discrete_sequence=px.colors.qualitative.Pastel
    )
    fig.update_layout(
        margin=dict(t=20, b=20, l=20, r=20),
        paper_bgcolor='rgba(0,0,0,0)',
        plot_bgcolor='rgba(0,0,0,0)',
        font=dict(color='#dae2fd')
    )
    return fig

def generate_monthly_bar_chart(df: pd.DataFrame):
    if df.empty:
        return None
    df_copy = df.copy()
    df_copy['Month'] = df_copy['date'].dt.strftime('%Y-%m')
    m_summary = df_copy.groupby('Month')['amount'].sum().reset_index()
    fig = px.bar(
        m_summary,
        x='Month',
        y='amount',
        text_auto='.2s',
        color_discrete_sequence=['#d0bcff']
    )
    fig.update_layout(
        margin=dict(t=20, b=20, l=20, r=20),
        paper_bgcolor='rgba(0,0,0,0)',
        plot_bgcolor='rgba(0,0,0,0)',
        font=dict(color='#dae2fd'),
        xaxis_title="Month",
        yaxis_title="Total Spent (₹)"
    )
    return fig

def generate_daily_line_chart(df: pd.DataFrame):
    if df.empty:
        return None
    daily = df.groupby('date')['amount'].sum().reset_index()
    fig = px.line(
        daily,
        x='date',
        y='amount',
        markers=True,
        color_discrete_sequence=['#ffb0cd']
    )
    fig.update_layout(
        margin=dict(t=20, b=20, l=20, r=20),
        paper_bgcolor='rgba(0,0,0,0)',
        plot_bgcolor='rgba(0,0,0,0)',
        font=dict(color='#dae2fd'),
        xaxis_title="Date",
        yaxis_title="Daily Spent (₹)"
    )
    return fig

def generate_payment_chart(df: pd.DataFrame):
    if df.empty:
        return None
    pay_summary = df.groupby('payment_method')['amount'].sum().reset_index()
    fig = px.bar(
        pay_summary,
        x='payment_method',
        y='amount',
        color='payment_method',
        color_discrete_sequence=px.colors.qualitative.Set2
    )
    fig.update_layout(
        margin=dict(t=20, b=20, l=20, r=20),
        paper_bgcolor='rgba(0,0,0,0)',
        plot_bgcolor='rgba(0,0,0,0)',
        font=dict(color='#dae2fd'),
        showlegend=False
    )
    return fig

def generate_spending_insights(df: pd.DataFrame) -> list[str]:
    insights = []
    if df.empty:
        return ["No expense data available to generate insights yet."]

    total_spent = df['amount'].sum()
    insights.append(f"💡 Total cumulative recorded spending: ₹{total_spent:,.2f} across {len(df)} transactions.")

    cat_group = df.groupby('category')['amount'].sum()
    top_cat = cat_group.idxmax()
    top_cat_amt = cat_group.max()
    top_cat_pct = (top_cat_amt / total_spent) * 100
    insights.append(f"🍔 Highest Spending Category: **{top_cat}** (₹{top_cat_amt:,.2f}, which is {top_cat_pct:.1f}% of total).")

    avg_expense = df['amount'].mean()
    insights.append(f"📊 Your average cost per transaction is ₹{avg_expense:,.2f}.")

    pay_group = df.groupby('payment_method')['amount'].sum()
    top_pay = pay_group.idxmax()
    insights.append(f"💳 Primary payment channel used: **{top_pay}**.")

    return insights
