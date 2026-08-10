import datetime

def format_currency(amount: float, currency_symbol: str = "₹") -> str:
    try:
        return f"{currency_symbol}{amount:,.2f}"
    except (ValueError, TypeError):
        return f"{currency_symbol}0.00"

def get_current_month_str() -> str:
    now = datetime.datetime.now()
    return now.strftime("%Y-%m")

def parse_date(date_str: str) -> datetime.date:
    try:
        return datetime.datetime.strptime(date_str, "%Y-%m-%d").date()
    except Exception:
        return datetime.date.today()

CATEGORIES = [
    "Food",
    "Transportation",
    "Education",
    "Shopping",
    "Entertainment",
    "Personal",
    "Mobile/Internet",
    "Other"
]

PAYMENT_METHODS = [
    "UPI",
    "Cash",
    "Debit Card",
    "Credit Card",
    "Bank Transfer"
]
