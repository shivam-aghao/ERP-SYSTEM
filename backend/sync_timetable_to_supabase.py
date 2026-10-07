import sqlite3
import urllib.request
import json
import urllib.error

SUPABASE_URL = "https://gftqvclenyplnuoocbwe.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdmdHF2Y2xlbnlwbG51b29jYndlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA0ODc3MjYsImV4cCI6MjEwNjA2MzcyNn0.kE1dD3VmL44ekYsqDpuPaMiwr3ljGQ-c4wDuumx9XxY"

def sync_to_supabase():
    conn = sqlite3.connect("backend/erp.db")
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM timetable_entries")
    cols = [d[0] for d in cursor.description]
    rows = cursor.fetchall()
    
    entries = []
    for r in rows:
        d = dict(zip(cols, r))
        # Ensure booleans
        d['is_lab'] = bool(d.get('is_lab'))
        d['is_completed'] = bool(d.get('is_completed'))
        d['is_active_now'] = bool(d.get('is_active_now'))
        d['is_critical'] = bool(d.get('is_critical'))
        entries.append(d)

    print(f"Loaded {len(entries)} timetable entries from local erp.db.")
    print("Attempting to sync with Supabase REST API (https://gftqvclenyplnuoocbwe.supabase.co/rest/v1/timetable_entries)...")

    url = f"{SUPABASE_URL}/rest/v1/timetable_entries"
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "resolution=merge-duplicates"
    }

    # Batch insert in chunks of 50
    chunk_size = 50
    synced = 0
    for i in range(0, len(entries), chunk_size):
        chunk = entries[i:i+chunk_size]
        req = urllib.request.Request(url, data=json.dumps(chunk).encode('utf-8'), headers=headers, method="POST")
        try:
            with urllib.request.urlopen(req) as resp:
                synced += len(chunk)
                print(f"  Synced batch {i//chunk_size + 1}: {len(chunk)} items (Total: {synced}/{len(entries)})")
        except urllib.error.HTTPError as e:
            err_body = e.read().decode('utf-8') if e.fp else ''
            if e.code == 404:
                print("\n[NOTE] Table 'timetable_entries' does not exist yet in Supabase!")
                print("Please run 'backend/supabase_timetable_schema.sql' in your Supabase Dashboard SQL Editor first:")
                print("1. Go to https://supabase.com/dashboard/project/gftqvclenyplnuoocbwe/sql")
                print("2. Paste the contents of 'backend/supabase_timetable_schema.sql'")
                print("3. Click 'Run'")
                return False
            else:
                print(f"  HTTP Error {e.code}: {e.reason}")
                print(f"  Details: {err_body}")
                return False
        except Exception as e:
            print(f"  Error: {e}")
            return False

    print(f"\nSuccessfully synced all {synced} entries to Supabase!")
    return True

if __name__ == "__main__":
    sync_to_supabase()

