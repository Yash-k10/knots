import sqlite3
from sqlalchemy import create_engine, text
from app.core.config import settings


def main():
    # Connect to SQLite
    sqlite_conn = sqlite3.connect("knots.db")
    sqlite_cursor = sqlite_conn.cursor()

    # Connect to Postgres
    pg_engine = create_engine(settings.SYNC_DATABASE_URL)

    tables = [
        "roles",
        "users",
        "profiles",
        "posts",
        "comments",
        "likes",
        "connections",
        "conversations",
        "messages",
        "conversation_participants",
    ]

    with pg_engine.connect():
        for table in tables:
            print(f"Migrating table: {table}")
            try:
                sqlite_cursor.execute(f"SELECT * FROM {table}")
                rows = sqlite_cursor.fetchall()
                if not rows:
                    print(f"No rows in {table}")
                    continue

                # Get column names
                sqlite_cursor.execute(f"PRAGMA table_info({table})")
                cols = [col[1] for col in sqlite_cursor.fetchall()]

                col_names = ", ".join(cols)
                placeholders = ", ".join([f":{col}" for col in cols])

                insert_stmt = text(
                    f"INSERT INTO {table} ({col_names}) VALUES ({placeholders}) ON CONFLICT DO NOTHING"
                )

                # Execute inserts
                for row in rows:
                    params = dict(zip(cols, row))
                    # Convert SQLite integers to booleans for Postgres
                    for k, v in params.items():
                        if k in [
                            "is_active",
                            "is_verified",
                            "is_superuser",
                            "is_group",
                            "is_read",
                        ]:
                            if v == 1:
                                params[k] = True
                            elif v == 0:
                                params[k] = False

                    with pg_engine.begin() as inner_conn:
                        try:
                            inner_conn.execute(insert_stmt, params)
                        except Exception as row_err:
                            print(f"Row insert error in {table}: {row_err}")
            except Exception as e:
                print(f"Error migrating {table}: {e}")

    sqlite_conn.close()


if __name__ == "__main__":
    main()
