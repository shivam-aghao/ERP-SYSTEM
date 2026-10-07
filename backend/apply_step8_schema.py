import sys, os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
import json
import urllib.request
import urllib.error
from backend.apply_supabase_seed_chunks import get_supabase_token, run_query

def main():
    token = get_supabase_token()
    print("Acquired Supabase token successfully.")

    sql_file = "database/04_teacher_admin_management.sql"
    with open(sql_file, "r", encoding="utf-8") as f:
        sql_content = f.read()

    print(f"Applying Step 8 SQL Schema ({len(sql_content)} bytes)...")
    try:
        res = run_query(sql_content, token)
        print("Schema applied successfully!")
        print("Response:", res[:300] if res else "Empty OK")
    except urllib.error.HTTPError as e:
        print("HTTP Error:", e.code)
        print(e.read().decode())
        sys.exit(1)

if __name__ == '__main__':
    main()

