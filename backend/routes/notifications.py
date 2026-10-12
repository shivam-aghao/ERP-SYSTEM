"""
================================================================================
SSGMCE COLLEGE ERP — STEP 7: NOTIFICATIONS & REAL-TIME ALERTS API ROUTES
FastAPI Endpoints with Real-Time WebSocket and Supabase Cloud Integration
================================================================================
"""

import json
import asyncio
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query, Body, HTTPException, Depends
from backend.services.notification_service import NotificationService
from backend.utils.helpers import success_response
from backend.auth.dependencies import get_optional_user
from backend.auth.models import AuthenticatedUser
from backend.rbac.service import RBACService
from backend.rbac.models import Permission

router = APIRouter(prefix="/notifications", tags=["Notifications"])


class WebSocketNotificationHub:
    """Manages real-time WebSocket connections with per-user channel routing."""

    def __init__(self):
        self.active_sockets: List[WebSocket] = []
        self.user_sockets: Dict[str, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, user_id: Optional[str] = None):
        await websocket.accept()
        self.active_sockets.append(websocket)
        if user_id:
            if user_id not in self.user_sockets:
                self.user_sockets[user_id] = []
            self.user_sockets[user_id].append(websocket)

    def disconnect(self, websocket: WebSocket, user_id: Optional[str] = None):
        if websocket in self.active_sockets:
            self.active_sockets.remove(websocket)
        if user_id and user_id in self.user_sockets:
            if websocket in self.user_sockets[user_id]:
                self.user_sockets[user_id].remove(websocket)

    async def broadcast_to_all(self, payload: Dict[str, Any]):
        msg_str = json.dumps(payload)
        for ws in list(self.active_sockets):
            try:
                await ws.send_text(msg_str)
            except Exception:
                pass

    async def send_to_user(self, user_id: str, payload: Dict[str, Any]):
        msg_str = json.dumps(payload)
        sockets = self.user_sockets.get(user_id, [])
        for ws in list(sockets):
            try:
                await ws.send_text(msg_str)
            except Exception:
                pass


ws_hub = WebSocketNotificationHub()


# -----------------------------------------------------------------------------
# REST ENDPOINTS
# -----------------------------------------------------------------------------

@router.get("")
@router.get("/")
@router.get("/list")
@router.get("/my")
def get_user_notifications(
    user_id: Optional[str] = Query(None),
    status: Optional[str] = Query("all", description="all, unread, read, important"),
    notif_type: Optional[str] = Query(None, alias="type"),
    priority: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_user: Optional[AuthenticatedUser] = Depends(get_optional_user)
):
    """Retrieves paginated notifications for the specified student or faculty member."""
    if current_user:
        if not RBACService.has_permission(current_user, Permission.NOTIFICATIONS_VIEW.value):
            raise HTTPException(
                status_code=403,
                detail="Forbidden: You do not possess permission 'notifications.view'."
            )
        target_id = RBACService.verify_student_self(current_user, user_id)
    else:
        target_id = user_id or "308637"
    notifs = NotificationService.get_user_notifications(
        user_id_or_code=target_id,
        status=status,
        notif_type=notif_type,
        priority=priority,
        limit=limit,
        offset=offset
    )
    return success_response(notifs, "User notifications retrieved successfully")


@router.get("/user/{user_id}")
def get_user_notifications_by_path(
    user_id: str,
    status: Optional[str] = Query("all", description="all, unread, read, important"),
    notif_type: Optional[str] = Query(None, alias="type"),
    priority: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0)
):
    """Retrieves paginated notifications for a specific user ID."""
    notifs = NotificationService.get_user_notifications(
        user_id_or_code=user_id,
        status=status,
        notif_type=notif_type,
        priority=priority,
        limit=limit,
        offset=offset
    )
    return success_response(notifs, "User notifications retrieved successfully")


@router.get("/unread-count")
def get_unread_count(user_id: Optional[str] = Query(None, alias="user_id")):
    """Returns unread, high, and urgent notification counts for badge rendering."""
    target_id = user_id or "308637"
    counts = NotificationService.get_unread_counts(target_id)
    return success_response(counts, "Unread count retrieved")


@router.post("/{notification_id}/read")
@router.patch("/{notification_id}/read")
@router.post("/mark-read/{notification_id}")
def mark_notification_read(
    notification_id: str,
    user_id: Optional[str] = Query(None)
):
    """Marks a single notification as read."""
    target_id = user_id or "308637"
    res = NotificationService.mark_as_read(notification_id, target_id)
    return success_response({"success": res, "notification_id": notification_id}, "Notification marked as read")


@router.post("/mark-all-read")
def mark_all_notifications_read(
    payload: Optional[Dict[str, Any]] = Body(default={}),
    user_id: Optional[str] = Query(None)
):
    """Marks all unread notifications as read for the user."""
    target_id = (payload.get("user_id") if payload else None) or user_id or "308637"
    count = NotificationService.mark_all_as_read(target_id)
    return success_response({"marked_count": count}, f"{count} notifications marked as read")


@router.post("/dismiss/{notification_id}")
def dismiss_notification(
    notification_id: str,
    user_id: Optional[str] = Query(None)
):
    """Dismisses a notification from the user's active list."""
    target_id = user_id or "308637"
    res = NotificationService.dismiss_notification(notification_id, target_id)
    return success_response({"success": res, "notification_id": notification_id}, "Notification dismissed")


@router.post("")
@router.post("/")
@router.post("/create")
async def create_notification(
    payload: Dict[str, Any] = Body(...),
    current_user: Optional[AuthenticatedUser] = Depends(get_optional_user)
):
    """
    Creates a new targeted notification (Faculty/Admin).
    Fans out to users in target group and emits to live WebSocket hub.
    """
    if current_user and not RBACService.has_permission(current_user, Permission.NOTIFICATIONS_MANAGE.value):
        raise HTTPException(
            status_code=403,
            detail="Forbidden: You do not possess permission 'notifications.manage' to create notifications."
        )

    notif_type = payload.get("notification_type", "announcement")
    title = payload.get("title", "Campus Notice")
    message = payload.get("message", "")
    priority = payload.get("priority", "normal")
    target_type = payload.get("target_type", "user")
    target_id = payload.get("target_id")
    action_url = payload.get("action_url")
    sender_id = payload.get("sender_id") or (current_user.identifier if current_user else None)

    notif_id = NotificationService.create_notification(
        notification_type=notif_type,
        title=title,
        message=message,
        priority=priority,
        sender_id=sender_id,
        action_url=action_url,
        target_type=target_type,
        target_id=target_id,
        metadata=payload.get("metadata", {})
    )

    if not notif_id:
        raise HTTPException(status_code=400, detail="Failed to create notification")

    # Broadcast real-time ping to WebSocket listeners
    broadcast_data = {
        "event": "new_notification",
        "notification_id": notif_id,
        "title": title,
        "message": message,
        "priority": priority,
        "notification_type": notif_type,
        "action_url": action_url,
        "target_type": target_type
    }
    await ws_hub.broadcast_to_all(broadcast_data)

    return success_response({"notification_id": notif_id}, "Notification created and delivered")


@router.post("/broadcast")
async def broadcast_announcement(
    payload: Dict[str, Any] = Body(...),
    current_user: Optional[AuthenticatedUser] = Depends(get_optional_user)
):
    """Broadcasts a high-priority announcement across college, department, or roles."""
    if current_user and not RBACService.has_permission(current_user, Permission.NOTIFICATIONS_MANAGE.value):
        raise HTTPException(
            status_code=403,
            detail="Forbidden: You do not possess permission 'notifications.manage' to broadcast announcements."
        )

    title = payload.get("title", "Important Announcement")
    message = payload.get("message", "")
    priority = payload.get("priority", "normal")
    target_type = payload.get("target_type", "college")
    target_id = payload.get("target_id")

    notif_id = NotificationService.create_notification(
        notification_type="announcement",
        title=title,
        message=message,
        priority=priority,
        action_url=payload.get("action_url", "/student/announcements"),
        target_type=target_type,
        target_id=target_id
    )

    await ws_hub.broadcast_to_all({
        "event": "broadcast_announcement",
        "title": title,
        "message": message,
        "priority": priority
    })

    return success_response({"notification_id": notif_id}, "Broadcast announcement dispatched")


@router.get("/preferences")
def get_preferences(user_id: Optional[str] = Query(None)):
    """Retrieves user notification channel preferences."""
    target_id = user_id or "308637"
    prefs = NotificationService.get_preferences(target_id)
    return success_response(prefs, "Notification preferences retrieved")


@router.put("/preferences")
def update_preferences(payload: Dict[str, Any] = Body(...)):
    """Updates user notification preferences."""
    target_id = payload.get("user_id") or "308637"
    prefs = payload.get("preferences", [])
    success = NotificationService.update_preferences(target_id, prefs)
    return success_response({"updated": success}, "Notification preferences updated")


@router.get("/analytics")
def get_analytics():
    """Administrative metrics on notification reach, volume, and read rate."""
    data = NotificationService.get_analytics()
    return success_response(data, "Notification analytics computed")


# -----------------------------------------------------------------------------
# REAL-TIME WEBSOCKET ENDPOINT
# -----------------------------------------------------------------------------

@router.websocket("/ws")
async def websocket_notifications(websocket: WebSocket, user_id: Optional[str] = None):
    """
    Subscribes client to real-time notification events.
    Receives pings and pushes new alerts without full page reload.
    """
    await ws_hub.connect(websocket, user_id)
    try:
        # Send initial connection confirmation
        await websocket.send_text(json.dumps({
            "event": "connected",
            "message": "Connected to SSGMCE Real-Time Notification Stream",
            "user_id": user_id
        }))
        while True:
            raw_text = await websocket.receive_text()
            try:
                client_msg = json.loads(raw_text)
                if client_msg.get("action") == "ping":
                    await websocket.send_text(json.dumps({"event": "pong"}))
            except Exception:
                pass
    except WebSocketDisconnect:
        ws_hub.disconnect(websocket, user_id)
    except Exception:
        ws_hub.disconnect(websocket, user_id)
