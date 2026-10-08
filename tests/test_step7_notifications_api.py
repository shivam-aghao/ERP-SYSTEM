import sys, os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)

def test_api(name, path, method="GET", body=None):
    try:
        if method == "POST":
            resp = client.post(f"/api/v1{path}", json=body)
        else:
            resp = client.get(f"/api/v1{path}")
        data = resp.json()
        print(f"[PASS] {name}: code={data.get('code', resp.status_code)}")
        return data.get("data")
    except Exception as e:
        print(f"[FAIL] {name}: {e}")
        return None

def main():
    print("=============================================================")
    print("  STEP 7: NOTIFICATIONS & REAL-TIME ALERTS API TESTS")
    print("=============================================================")

    # 1. Unread count
    c = test_api("1. Unread Notification Counts", "/notifications/unread-count?user_id=308637")
    if c:
        print(f"     Unread: {c.get('unread_count')}, Urgent: {c.get('urgent_count')}, High: {c.get('high_priority_count')}")

    # 2. List notifications
    notifs = test_api("2. List Notifications (All)", "/notifications/list?user_id=308637&status=all")
    if notifs is not None:
        print(f"     Returned {len(notifs)} notifications")
        if len(notifs) > 0:
            top = notifs[0]
            print(f"     Top alert: [{top.get('priority')}] {top.get('title')}")

    # 3. Filter by unread
    unread_list = test_api("3. List Unread Notifications", "/notifications/list?user_id=308637&status=unread")
    if unread_list is not None:
        print(f"     Unread notifications: {len(unread_list)}")

    # 4. Mark single read
    if notifs and len(notifs) > 0:
        first_id = notifs[0].get("notification_id")
        m1 = test_api("4. Mark Single Notification Read", f"/notifications/mark-read/{first_id}?user_id=308637", method="POST")
        print(f"     Mark read response: {m1}")

    # 5. Preferences
    prefs = test_api("5. Notification Preferences", "/notifications/preferences?user_id=308637")
    if prefs is not None:
        print(f"     Preferences count: {len(prefs)}")

    # 6. Create targeted notification
    new_notif = test_api("6. Create Targeted Notification (Quiz)", "/notifications/create", method="POST", body={
        "notification_type": "quiz",
        "title": "Automated Unit Test Alert",
        "message": "Continuous assessment evaluation starts at 10:00 AM.",
        "priority": "high",
        "target_type": "user",
        "target_student_code": "308637",
        "action_url": "/student-quiz.html",
        "action_payload": {"quiz_code": "DBMS-UNIT-1"}
    })
    if new_notif:
        print(f"     Created notification: {new_notif.get('id')}")

if __name__ == "__main__":
    main()
