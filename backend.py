"""
================================================================================
SSGMCE COLLEGE ERP — UNIFIED MASTER BACKEND SERVER
Shri Sant Gajanan Maharaj College of Engineering, Shegaon
================================================================================
Single command execution:
    python backend.py
or
    python run.py
or
    python main.py
or
    backend.bat

This file boots the unified FastAPI backend serving all ERP modules:
  [1]  /api/v1/auth          — Multi-persona Authentication, JWT Tokens & Sessions
  [2]  /api/v1/students      — Student Profiles, Records, E-Learning, Dashboard
  [3]  /api/v1/teachers      — Teacher Assignments, Rosters & Classes
  [4]  /api/v1/admin         — System Administration, Governance & Audit Logs
  [5]  /api/v1/attendance    — Database-Driven Attendance, Rosters, Sessions & Locks
  [6]  /api/v1/timetable     — Instructional Timetable & Scheduled Tests
  [7]  /api/v1/quizzes       — Autonomous Quiz Engine & Question Bank
  [8]  /api/v1/attempts      — Student Attempts & Auto-Grading Engine
  [9]  /api/v1/results       — Authoritative Marks Roster, SGPA/CGPA & Gazettes
  [10] /api/v1/fees          — Fee Ledger, Payments & Official Receipts
  [11] /api/v1/documents     — Private Supabase Storage Document Vault
  [12] /api/v1/notifications — Real-time Multi-Channel Notifications
  [13] /health               — System Health Check (Database + Supabase)
  [14] /docs                 — OpenAPI / Swagger Interactive Documentation
  [15] Frontend Static Apps  — Student, Teacher, Admin Dashboards & Login
================================================================================
"""

import os
import sys

# Ensure UTF-8 console output on Windows
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")

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
    print("  Active Modules Loaded:")
    print("    • Auth (/api/v1/auth)")
    print("    • Students (/api/v1/students)")
    print("    • Teachers (/api/v1/teachers)")
    print("    • Admin (/api/v1/admin)")
    print("    • Attendance (/api/v1/attendance)")
    print("    • Timetable (/api/v1/timetable)")
    print("    • Quizzes & Tests (/api/v1/quizzes)")
    print("    • Attempts & Auto-Grading (/api/v1/attempts)")
    print("    • Results & Academic Records (/api/v1/results)")
    print("    • Fees & Receipts (/api/v1/fees)")
    print("    • Documents & Vault (/api/v1/documents)")
    print("    • Notifications (/api/v1/notifications)")
    print("    • Legacy Compatibility (/api/v1/compat & /api/v1/student/...)")
    print("=" * 80)
    print(f"  Booting unified Uvicorn server on {host}:{port} ...")
    print("  Press Ctrl+C to stop the server.")
    print("=" * 80 + "\n")

    try:
        uvicorn.run("backend.main:app", host=host, port=port, reload=reload_flag)
    except KeyboardInterrupt:
        print("\n[!] SSGMCE College ERP Backend stopped by user.")


if __name__ == "__main__":
    main()

