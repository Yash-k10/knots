import sqlite3

conn = sqlite3.connect("f:/Knots-Updated4/backend/knots.db")
cursor = conn.cursor()

# Check users
print("--- Users ---")
try:
    cursor.execute(
        "SELECT id, email, first_name, last_name FROM users JOIN profiles ON users.id = profiles.user_id WHERE first_name LIKE '%Meenakshi%' OR first_name LIKE '%Rajesh%'"
    )
    for row in cursor.fetchall():
        print(row)
except Exception as e:
    print("Error checking users:", e)

# Check posts
print("--- Posts ---")
try:
    cursor.execute("SELECT id, content, created_at FROM posts LIMIT 10")
    for row in cursor.fetchall():
        print(row)
except Exception as e:
    print("Error checking posts:", e)

conn.close()
