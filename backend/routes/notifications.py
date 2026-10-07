from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from backend.main import success_response, get_db
from typing import List
import asyncio

router = APIRouter(prefix="/api/v1/notifications", tags=["Notifications"])

# In-memory store for demo purposes
notifications_store = [
    {"id": "notif-001", "title": "New Assignment", "message": "A new assignment has been posted.", "timestamp": "2026-10-07T10:00:00"},
    {"id": "notif-002", "title": "Attendance Alert", "message": "2 students missed today’s lecture.", "timestamp": "2026-10-07T12:30:00"},
]

# Connected WebSocket clients
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast(self, message: str):
        for connection in self.active_connections:
            await connection.send_text(message)

manager = ConnectionManager()

@router.get("/list")
def list_notifications(db: Depends = Depends(get_db)):
    # For now return static dummy list
    return success_response(notifications_store, "Notifications fetched")

@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            # Keep connection alive; optionally receive pings
            data = await websocket.receive_text()
            # Echo back or ignore; real implementation would push notifications
            await websocket.send_text(f"Echo: {data}")
    except WebSocketDisconnect:
        manager.disconnect(websocket)

# Example background task to push a demo notification every 60 seconds
async def periodic_demo_push():
    while True:
        await asyncio.sleep(60)
        await manager.broadcast("{\"title\": \"Reminder\", \"message\": \"Check new assignments\"}")

