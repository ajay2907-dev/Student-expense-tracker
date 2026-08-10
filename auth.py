import hashlib
import uuid
import datetime
from database import get_connection

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode('utf-8')).hexdigest()

def register_user(name: str, email: str, password: str) -> tuple[bool, str]:
    if not name or not email or not password:
        return False, "All fields are required."
    
    email = email.strip().lower()
    conn = get_connection()
    cursor = conn.cursor()
    
    cursor.execute("SELECT user_id FROM users WHERE email = ?", (email,))
    if cursor.fetchone():
        conn.close()
        return False, "An account with this email already exists."
    
    user_id = "user_" + uuid.uuid4().hex[:12]
    pwd_hash = hash_password(password)
    now = datetime.datetime.now().isoformat()
    
    cursor.execute(
        "INSERT INTO users (user_id, name, email, password_hash, created_at) VALUES (?, ?, ?, ?, ?)",
        (user_id, name, email, pwd_hash, now)
    )
    conn.commit()
    conn.close()
    return True, user_id

def login_user(email: str, password: str) -> tuple[bool, dict | str]:
    email = email.strip().lower()
    pwd_hash = hash_password(password)
    
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE email = ? AND password_hash = ?", (email, pwd_hash))
    user = cursor.fetchone()
    conn.close()
    
    if user:
        user_dict = dict(user)
        del user_dict['password_hash']
        return True, user_dict
    return False, "Invalid email or password."
