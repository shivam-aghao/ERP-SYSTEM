import sys, os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
import json
from backend.apply_supabase_seed_chunks import get_supabase_token, run_query

def main():
    token = get_supabase_token()
    shivam_id = "d8e55ec8-72a4-40ca-86ec-5ecef2bd22c8"

    # 1. Unread count RPC
    counts = json.loads(run_query(f"SELECT public.get_unread_notification_count('{shivam_id}'::uuid) as c;", token))
    print("Unread count result:", counts[0]['c'])

    # 2. View user notifications
    notifs = json.loads(run_query(f"""
        SELECT notification_id, notification_type, title, priority, is_read, action_url, received_at
        FROM public.v_user_notifications
        WHERE recipient_id = '{shivam_id}'
        ORDER BY received_at DESC;
    """, token))
    print(f"Total active notifications for Shivam: {len(notifs)}")
    for n in notifs[:5]:
        print(f"  [{n['priority'].upper()}] {n['notification_type']}: {n['title']} (is_read={n['is_read']})")

    # 3. Test mark_notification_read
    test_nid = notifs[0]['notification_id']
    mark_res = json.loads(run_query(f"SELECT public.mark_notification_read('{test_nid}'::uuid, '{shivam_id}'::uuid) as res;", token))
    print(f"Mark read for {test_nid}:", mark_res[0]['res'])

    # 4. Check counts again
    counts2 = json.loads(run_query(f"SELECT public.get_unread_notification_count('{shivam_id}'::uuid) as c;", token))
    print("Updated unread count:", counts2[0]['c'])

if __name__ == '__main__':
    main()
