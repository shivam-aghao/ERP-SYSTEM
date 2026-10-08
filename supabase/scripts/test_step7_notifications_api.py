import urllib.request
import json
import urllib.parse

BASE = "http://localhost:8000/api/v1"

def test_api(name, path, method="GET", body=None):
    url = f"{BASE}{path}"
    headers = {"Content-Type": "application/json"}
    data = json.dumps(body).encode("utf-8") if body else None
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=5) as resp:
            data = json.loads(resp.read().decode())
            print(f"[PASS] {name}: code={data.get('code')}")
            return data.get("data")
    except Exception as e:
        print(f"[FAIL] {name} ({url}): {e}")
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
        "target_id": "308637",
        "action_url": "/student/quiz"
    })
    print(f"     Created notification ID: {new_notif.get('notification_id') if new_notif else 'None'}")

    # 7. Analytics
    analytics = test_api("7. Notification Analytics (Admin)", "/notifications/analytics")
    if analytics:
        print(f"     Total notifications: {analytics.get('total_notifications')}, Read rate: {analytics.get('read_rate')}%")

if __name__ == '__main__':
    main()

