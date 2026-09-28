import os
from pathlib import Path
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from datetime import datetime

from config import settings
from routers import (
    auth,
    teacher,
    departments,
    classes,
    subjects,
    class_cards,
    students,
    attendance,
    notifications
)

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Python FastAPI Backend for SSGMCE Teacher Attendance ERP Portal",
    version="1.0.0"
)

# CORS Middleware (Allows Live Server port 5500, localhost 5000, 3000, etc.)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health Check Route
@app.get("/health")
def health_check():
    return {
        "success": True,
        "message": "SSGMCE Faculty Attendance API is healthy",
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "env": settings.NODE_ENV,
        "backend": "Python 3.14 (FastAPI)"
    }

# Register API v1 Routers
api_v1_prefix = "/api/v1"
app.include_router(auth.router, prefix=api_v1_prefix)
app.include_router(teacher.router, prefix=api_v1_prefix)
app.include_router(departments.router, prefix=api_v1_prefix)
app.include_router(classes.router, prefix=api_v1_prefix)
app.include_router(subjects.router, prefix=api_v1_prefix)
app.include_router(class_cards.router, prefix=api_v1_prefix)
app.include_router(students.router, prefix=api_v1_prefix)
app.include_router(attendance.router, prefix=api_v1_prefix)
app.include_router(notifications.router, prefix=api_v1_prefix)

# Frontend Static File Serving
FRONTEND_DIR = Path(__file__).resolve().parent.parent / "frontend"

if FRONTEND_DIR.exists():
    app.mount("/js", StaticFiles(directory=str(FRONTEND_DIR / "js")), name="js")
    app.mount("/css", StaticFiles(directory=str(FRONTEND_DIR / "css")), name="css")
    app.mount("/assets", StaticFiles(directory=str(FRONTEND_DIR / "assets")), name="assets")

    @app.get("/")
    def serve_index():
        return FileResponse(FRONTEND_DIR / "index.html")

    @app.get("/index.html")
    def serve_index_html():
        return FileResponse(FRONTEND_DIR / "index.html")
        
    @app.get("/attendance_roster.html")
    def serve_roster():
        return FileResponse(FRONTEND_DIR / "attendance_roster.html")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host=settings.HOST, port=settings.PORT, reload=True)
