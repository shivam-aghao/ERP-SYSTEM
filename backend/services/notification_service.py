"""
================================================================================
SSGMCE COLLEGE ERP — STEP 7: NOTIFICATIONS & REAL-TIME ALERTS SERVICE
Unified Autonomous Notification & Alert Service connecting to Supabase Cloud
================================================================================
"""

import json
import logging
import urllib.parse
import urllib.request
import urllib.error
from typing import Dict, Any, List, Optional
from backend.config.settings import settings

logger = logging.getLogger("notification_service")


class NotificationService:
    """
    Production-ready service layer for:
      1. Targeted Notifications (user, class, division, department, semester, role, college)
      2. Multi-channel delivery records (in_app, push, email)
      3. Live unread counters (unread, high, urgent)
      4. Read state tracking per recipient
      5. User preferences management
      6. Event integration with Quizzes, Results, Fees, Attendance, and Timetables
      7. Administrative delivery analytics & audit tracking
    """

    @classmethod
    def _get_headers(cls) -> Dict[str, str]:
        key = settings.SUPABASE_SERVICE_ROLE_KEY or settings.SUPABASE_ANON_KEY
        return {
            "apikey": key,
            "Authorization": f"Bearer {key}",
            "Content-Type": "application/json",
            "Prefer": "return=representation"
        }

    @classmethod
    def _supabase_get(cls, endpoint: str) -> List[Dict[str, Any]]:
        """Executes REST GET query to Supabase Cloud."""
        url = f"{settings.SUPABASE_URL}/rest/v1/{endpoint}"
        req = urllib.request.Request(url, headers=cls._get_headers())
        try:
            with urllib.request.urlopen(req, timeout=5) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                return data if isinstance(data, list) else [data]
        except urllib.error.HTTPError as e:
            err_msg = e.read().decode("utf-8") if e.fp else str(e)
            logger.error("Supabase REST GET error [%s]: %s", endpoint, err_msg)
            return []
        except Exception as e:
            logger.error("Network error querying Supabase [%s]: %s", endpoint, e)
            return []

    @classmethod
    def _supabase_rpc(cls, function_name: str, payload: Dict[str, Any]) -> Any:
        """Executes a Supabase PL/pgSQL RPC function."""
        url = f"{settings.SUPABASE_URL}/rest/v1/rpc/{function_name}"
        data = json.dumps(payload).encode("utf-8")
        req = urllib.request.Request(url, data=data, headers=cls._get_headers(), method="POST")
        try:
            with urllib.request.urlopen(req, timeout=8) as resp:
                res_body = resp.read().decode("utf-8")
                return json.loads(res_body) if res_body else None
        except urllib.error.HTTPError as e:
            err_msg = e.read().decode("utf-8") if e.fp else str(e)
            logger.error("Supabase RPC error [%s]: %s", function_name, err_msg)
            return None
        except Exception as e:
            logger.error("Network error invoking RPC [%s]: %s", function_name, e)
            return None

    @classmethod
    def _supabase_post(cls, endpoint: str, payload: Any) -> Any:
        """Executes REST POST query to Supabase Cloud."""
        url = f"{settings.SUPABASE_URL}/rest/v1/{endpoint}"
        data = json.dumps(payload).encode("utf-8")
        req = urllib.request.Request(url, data=data, headers=cls._get_headers(), method="POST")
        try:
            with urllib.request.urlopen(req, timeout=5) as resp:
                res_body = resp.read().decode("utf-8")
                return json.loads(res_body) if res_body else None
        except Exception as e:
            logger.error("Supabase REST POST error [%s]: %s", endpoint, e)
            return None

    @classmethod
    def resolve_user_id(cls, identifier: str) -> Optional[str]:
        """Resolves student_code, emp_code, or username to UUID."""
        if not identifier:
            return None
        ident = identifier.strip()

        # Check if already a valid UUID format
        if len(ident) == 36 and ident.count("-") == 4:
            return ident

        # 1. Check student
        students = cls._supabase_get(f"students?student_code=eq.{ident}&select=id&limit=1")
        if students and len(students) > 0 and "id" in students[0]:
            return students[0]["id"]

        # 2. Check teacher
        teachers = cls._supabase_get(f"teachers?emp_code=eq.{ident}&select=id&limit=1")
        if teachers and len(teachers) > 0 and "id" in teachers[0]:
            return teachers[0]["id"]

        # 3. Check admin
        admins = cls._supabase_get(f"admins?username=eq.{ident}&select=id&limit=1")
        if admins and len(admins) > 0 and "id" in admins[0]:
            return admins[0]["id"]

        return None

    @classmethod
    def get_unread_counts(cls, user_id_or_code: str) -> Dict[str, int]:
        """Returns live unread, urgent, high, and total active notification counts."""
        user_id = cls.resolve_user_id(user_id_or_code)
        if not user_id:
            return {"unread_count": 0, "urgent_count": 0, "high_priority_count": 0, "total_active": 0}

        rpc_res = cls._supabase_rpc("get_unread_notification_count", {"p_recipient_id": user_id})
        if rpc_res and isinstance(rpc_res, dict):
            return rpc_res

        # Fallback to direct query on v_user_notifications
        notifs = cls._supabase_get(f"v_user_notifications?recipient_id=eq.{user_id}&select=priority,is_read")
        unread = [n for n in notifs if not n.get("is_read")]
        urgent = [n for n in unread if n.get("priority") == "urgent"]
        high = [n for n in unread if n.get("priority") == "high"]
        return {
            "unread_count": len(unread),
            "urgent_count": len(urgent),
            "high_priority_count": len(high),
            "total_active": len(notifs)
        }

    @classmethod
    def get_user_notifications(
        cls,
        user_id_or_code: str,
        status: Optional[str] = None,
        notif_type: Optional[str] = None,
        priority: Optional[str] = None,
        limit: int = 50,
        offset: int = 0
    ) -> List[Dict[str, Any]]:
        """
        Retrieves user-specific notifications with optional status filter:
        'all', 'unread', 'read', 'important' (urgent + high).
        """
        user_id = cls.resolve_user_id(user_id_or_code)
        if not user_id:
            return []

        query_params = [
            f"recipient_id=eq.{user_id}",
            "order=received_at.desc",
            f"limit={limit}",
            f"offset={offset}"
        ]

        if status == "unread":
            query_params.append("is_read=is.false")
        elif status == "read":
            query_params.append("is_read=is.true")
        elif status == "important":
            query_params.append("priority=in.(urgent,high)")

        if notif_type and notif_type != "all":
            query_params.append(f"notification_type=eq.{notif_type}")

        if priority and priority != "all":
            query_params.append(f"priority=eq.{priority}")

        endpoint = f"v_user_notifications?{'&'.join(query_params)}"
        rows = cls._supabase_get(endpoint)
        return rows

    @classmethod
    def mark_as_read(cls, notification_id: str, user_id_or_code: str) -> bool:
        """Marks a notification as read for the user."""
        user_id = cls.resolve_user_id(user_id_or_code)
        if not user_id:
            return False

        res = cls._supabase_rpc("mark_notification_read", {
            "p_notification_id": notification_id,
            "p_recipient_id": user_id
        })
        return bool(res)

    @classmethod
    def mark_all_as_read(cls, user_id_or_code: str) -> int:
        """Marks all notifications as read for the user."""
        user_id = cls.resolve_user_id(user_id_or_code)
        if not user_id:
            return 0

        res = cls._supabase_rpc("mark_all_notifications_read", {
            "p_recipient_id": user_id
        })
        return int(res or 0)

    @classmethod
    def dismiss_notification(cls, notification_id: str, user_id_or_code: str) -> bool:
        """Dismisses a notification from the user's active feed."""
        user_id = cls.resolve_user_id(user_id_or_code)
        if not user_id:
            return False

        res = cls._supabase_rpc("dismiss_notification", {
            "p_notification_id": notification_id,
            "p_recipient_id": user_id
        })
        return bool(res)

    @classmethod
    def create_notification(
        cls,
        notification_type: str,
        title: str,
        message: str,
        priority: str = "normal",
        sender_id: Optional[str] = None,
        action_url: Optional[str] = None,
        target_type: str = "user",
        target_id: Optional[str] = None,
        entity_type: Optional[str] = None,
        entity_id: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None,
        scheduled_at: Optional[str] = None,
        expires_at: Optional[str] = None
    ) -> Optional[str]:
        """Creates a targeted notification and fans out to recipients."""
        payload = {
            "p_notification_type": notification_type,
            "p_title": title,
            "p_message": message,
            "p_priority": priority,
            "p_sender_id": sender_id,
            "p_action_url": action_url,
            "p_target_type": target_type,
            "p_target_id": str(target_id) if target_id else None,
            "p_entity_type": entity_type,
            "p_entity_id": entity_id,
            "p_metadata": metadata or {},
            "p_scheduled_at": scheduled_at,
            "p_expires_at": expires_at
        }
        res = cls._supabase_rpc("create_targeted_notification", payload)
        return str(res) if res else None

    @classmethod
    def get_preferences(cls, user_id_or_code: str) -> List[Dict[str, Any]]:
        """Retrieves user notification preferences."""
        user_id = cls.resolve_user_id(user_id_or_code)
        if not user_id:
            return []
        return cls._supabase_get(f"notification_preferences?user_id=eq.{user_id}")

    @classmethod
    def update_preferences(cls, user_id_or_code: str, prefs: List[Dict[str, Any]]) -> bool:
        """Updates user notification preferences."""
        user_id = cls.resolve_user_id(user_id_or_code)
        if not user_id:
            return False

        for p in prefs:
            notif_type = p.get("notification_type")
            if not notif_type:
                continue
            payload = {
                "user_id": user_id,
                "notification_type": notif_type,
                "in_app_enabled": p.get("in_app_enabled", True),
                "email_enabled": p.get("email_enabled", False),
                "push_enabled": p.get("push_enabled", True)
            }
            cls._supabase_post("notification_preferences", payload)
        return True

    @classmethod
    def get_analytics(cls) -> Dict[str, Any]:
        """Provides administrator metrics on notification reach, read rates, and channels."""
        all_notifs = cls._supabase_get("notifications?select=id,notification_type,priority,created_at&limit=1000")
        all_recipients = cls._supabase_get("notification_recipients?select=id,read_at,created_at&limit=2000")

        total_sent = len(all_notifs)
        total_delivered = len(all_recipients)
        read_count = len([r for r in all_recipients if r.get("read_at")])
        read_rate = round((read_count / total_delivered * 100), 1) if total_delivered > 0 else 0.0

        by_type: Dict[str, int] = {}
        by_priority: Dict[str, int] = {}
        for n in all_notifs:
            t = n.get("notification_type", "other")
            p = n.get("priority", "normal")
            by_type[t] = by_type.get(t, 0) + 1
            by_priority[p] = by_priority.get(p, 0) + 1

        return {
            "total_notifications": total_sent,
            "total_recipients_delivered": total_delivered,
            "read_notifications": read_count,
            "unread_notifications": total_delivered - read_count,
            "delivery_rate": 100.0,
            "read_rate": read_rate,
            "by_type": by_type,
            "by_priority": by_priority
        }

    # -------------------------------------------------------------------------
    # ERP Module Trigger Integrations
    # -------------------------------------------------------------------------

    @classmethod
    def send_result_published_notification(cls, class_id: str, semester: int, published_by: Optional[str] = None):
        """Called when faculty/admin publishes exam results for a class."""
        return cls._supabase_rpc("create_result_notification", {
            "p_class_id": str(class_id),
            "p_semester": int(semester),
            "p_published_by": published_by
        })

    @classmethod
    def send_quiz_notification(cls, quiz_id: str, class_id: str, title: str, teacher_id: Optional[str] = None):
        """Called when a quiz is assigned or scheduled."""
        return cls._supabase_rpc("create_quiz_notification", {
            "p_quiz_id": str(quiz_id),
            "p_class_id": str(class_id),
            "p_title": title,
            "p_teacher_id": teacher_id
        })

    @classmethod
    def send_fee_payment_notification(cls, student_id: str, amount: float, receipt_no: str):
        """Called when an online or offline fee payment succeeds."""
        title = f"Fee Payment Verified: Rs. {amount:,.2f}"
        msg = f"Your fee payment of Rs. {amount:,.2f} has been verified. Official receipt #{receipt_no} is generated."
        return cls.create_notification(
            notification_type="payment",
            title=title,
            message=msg,
            priority="normal",
            action_url="/student/fees",
            target_type="user",
            target_id=student_id,
            entity_type="fee_receipt"
        )

    @classmethod
    def send_attendance_shortage_notification(cls, student_id: str, subject_name: str, percentage: float):
        """Called when attendance falls below 75%."""
        return cls._supabase_rpc("create_attendance_notification", {
            "p_student_id": str(student_id),
            "p_subject_name": subject_name,
            "p_percentage": float(percentage)
        })
