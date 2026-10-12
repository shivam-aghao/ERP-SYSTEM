"""
================================================================================
SSGMCE COLLEGE ERP — MASTER UNIFIED BACKEND SERVER ENTRYPOINT
Institution: Shri Sant Gajanan Maharaj College of Engineering, Shegaon
================================================================================
Single command execution:
    python run.py
or
    python main.py
or
    python backend/main.py

Boots the entire unified backend serving:
  • /api/v1/auth          — Multi-persona Authentication, JWT Tokens & Sessions
  • /api/v1/students      — Student Profiles, Records, E-Learning
  • /api/v1/teachers      — Teacher Assignments, Rosters & Classes
  • /api/v1/admin         — System Administration, Governance & Roster Control
  • /api/v1/attendance    — Database-driven Attendance, Roster, Draft & Lock
  • /api/v1/timetable     — Instructional Timetable & Scheduled Tests
  • /api/v1/quizzes       — Autonomous Quiz Engine & Question Bank
  • /api/v1/attempts      — Student Attempts & Server-Side Auto-Grading
  • /api/v1/results       — Authoritative Marks Roster, SGPA/CGPA & Gazettes
  • /api/v1/fees          — Fee Ledger, Online Payments & Official Receipts
  • /api/v1/documents     — Private Supabase Storage Document Vault
  • /api/v1/notifications — Real-time Multi-Channel Notifications
  • /health               — System Health Check (DB + Supabase)
  • /docs                 — OpenAPI / Swagger Interactive Documentation
  • Frontend Static Apps  — Student, Teacher & Admin Dashboards & Login
================================================================================
"""

import os
import sys

# 1. Ensure project root is at the head of sys.path
PROJECT_ROOT = os.path.dirname(os.path.abspath(__file__))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

import uvicorn
from backend.main import app

def main():
    host = os.environ.get("HOST", "0.0.0.0")
    port = int(os.environ.get("PORT", "8000"))
    reload_flag = os.environ.get("RELOAD", "false").lower() in ("true", "1")

    print("\n" + "=" * 80)
    print("  SHRI SANT GAJANAN MAHARAJ COLLEGE OF ENGINEERING, SHEGAON")
    print("  SSGMCE AUTONOMOUS COLLEGE ERP — UNIFIED FULL-STACK BACKEND")
    print("=" * 80)
    print(f"  [✓] Server URL:       http://localhost:{port}")
    print(f"  [✓] Swagger Docs:     http://localhost:{port}/docs")
    print(f"  [✓] System Health:    http://localhost:{port}/health")
    print(f"  [✓] Login Portal:     http://localhost:{port}/login.html")
    print(f"  [✓] Student Portal:   http://localhost:{port}/student-dashboard.html")
    print(f"  [✓] Teacher Portal:   http://localhost:{port}/teacher-dashboard.html")
    print(f"  [✓] Admin Portal:     http://localhost:{port}/admin-dashboard.html")
    print("=" * 80)
    print(f"  Booting unified Uvicorn server on {host}:{port} ...")
    print("  Press Ctrl+C to stop the server.")
    print("=" * 80 + "\n")

    try:
        uvicorn.run(app, host=host, port=port)
    except KeyboardInterrupt:
        print("\n[!] SSGMCE College ERP Backend stopped by user.")


if __name__ == "__main__":
    main()

