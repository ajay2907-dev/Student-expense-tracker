import uuid
import datetime
from database import get_connection

def add_notification(user_id: str, message: str, notif_type: str = "info"):
    conn = get_connection()
    cursor = conn.cursor()
    notif_id = "notif_" + uuid.uuid4().hex[:12]
    now = datetime.datetime.now().isoformat()
    cursor.execute(
        "INSERT INTO notifications (notification_id, user_id, message, type, is_read, created_at) VALUES (?, ?, ?, ?, 0, ?)",
        (notif_id, user_id, message, notif_type, now)
    )
    conn.commit()
    conn.close()

def get_user_notifications(user_id: str):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC", (user_id,))
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]

def mark_notification_read(notification_id: str):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("UPDATE notifications SET is_read = 1 WHERE notification_id = ?", (notification_id,))
    conn.commit()
    conn.close()

def check_budget_alerts(user_id: str, month: str):
    conn = get_connection()
    cursor = conn.cursor()
    
    cursor.execute("SELECT amount FROM budgets WHERE user_id = ? AND month = ?", (user_id, month))
    b_row = cursor.fetchone()
    if not b_row:
        conn.close()
        return
        
    budget_amt = b_row['amount']
    
    cursor.execute(
        "SELECT SUM(amount) as total FROM expenses WHERE user_id = ? AND strftime('%Y-%m', date) = ?",
        (user_id, month)
    )
    exp_row = cursor.fetchone()
    total_spent = exp_row['total'] if exp_row and exp_row['total'] else 0.0
    conn.close()
    
    usage_pct = (total_spent / budget_amt) * 100 if budget_amt > 0 else 0
    
    if usage_pct >= 100:
        add_notification(
            user_id,
            f"🚨 EXCEEDED BUDGET: You spent ₹{total_spent:,.2f} exceeding your monthly limit of ₹{budget_amt:,.2f}!",
            "alert"
        )
    elif usage_pct >= 80:
        add_notification(
            user_id,
            f"⚠️ BUDGET WARNING: You have reached {usage_pct:.1f}% of your ₹{budget_amt:,.2f} budget.",
            "warning"
        )
