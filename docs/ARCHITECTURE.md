# SSGMCE College ERP — System Architecture Specification

## 1. Executive Summary

This document specifies the unified production architecture for the **Shri Sant Gajanan Maharaj College of Engineering (SSGMCE)** Autonomous College Enterprise Resource Planning (ERP) System.

The ERP system has been consolidated from fragmented prototypes and dual-server configurations into **one clean, canonical architecture**:
```
frontend/        → Unified Single-Page Application (SPA) & Static HTML Portals
backend/         → Unified FastAPI + SQLAlchemy Async/Pooler Application (Port 8000)
supabase/        → Production PostgreSQL Schemas, Functions, Triggers & Seed Scripts
docs/            → System Documentation & Audit Reports
tests/           → End-to-End API, Database, and Frontend Verification Suites
```

### Core Architecture Invariants
1. **Single Production Database:** **Supabase PostgreSQL** (`aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres`) is the sole production database. SQLite (`erp.db`) has been decommissioned and archived.
2. **Zero Route Duplication:** All API operations route through canonical endpoints registered under FastAPI `/api/v1/...` on port `8000`. Legacy port `5001` and port `8001` Express/Flask servers have been completely retired.
3. **Canonical Frontend:** All student, faculty, and administrative portals operate from `frontend/html/` with shared styling in `frontend/css/` and consolidated client logic in `frontend/js/`.
4. **Preserved UI & Design:** All UI layouts, color palettes, responsive sidebars, swipe cards, and interaction behaviors remain 100% intact.

---

## 2. End-to-End Data Flow

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                   FRONTEND LAYER                                       │
│                                                                                        │
│  [student-dashboard.html]  [teacher-dashboard.html]  [admin-dashboard.html]            │
│  [student-quiz.html]       [teacher-quiz.html]       [teacher-attendance-roster.html]  │
│                                                                                        │
│  Client Services: api.js (Port 8000), auth.js, data.js, supabaseClient.js              │
└─────────────────────────────────────────┬──────────────────────────────────────────────┘
                                          │ HTTP / REST / JSON
                                          ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                              BACKEND / API LAYER (FastAPI)                             │
│                              Host: 0.0.0.0 | Port: 8000                                │
│                                                                                        │
│  Core Orchestrator: backend/main.py                                                    │
│  Authentication:    backend/routes/auth.py        & backend/services/auth_service.py   │
│  Faculty & Roster:  backend/routes/faculty.py     & backend/services/faculty_service.py│
│  Attendance:        backend/routes/attendance.py  & backend/services/att_service.py    │
│  Quizzes & Exams:   backend/routes/quiz.py        & backend/services/quiz_service.py   │
│  Student & Wallet:  backend/routes/academic_wallet.py & academic_wallet_service.py     │
│  Notifications:     backend/routes/notifications.py   & notification_service.py        │
│  Admin Management:  backend/routes/management.py      & management_service.py          │
└────────────────────────────────────┬─────────────────────────┬─────────────────────────┘
                                     │                         │
                  JWT / Auth Session │                         │ Storage API (Files)
                                     ▼                         ▼
        ┌────────────────────────────────────┐    ┌───────────────────────────────────┐
        │        SUPABASE AUTH ENGINE        │    │      SUPABASE CLOUD STORAGE       │
        │                                    │    │                                   │
        │  • Token Verification              │    │  • Bucket: student-documents      │
        │  • Role Extraction (JWT claims)    │    │  • Bucket: student-certificates   │
        │  • Session Invalidation            │    │  • Bucket: fee-receipts           │
        └─────────────────┬──────────────────┘    │  • Bucket: marksheets             │
                          │                       └───────────────────────────────────┘
                          │ PostgreSQL Connection Pooler (Port 6543)
                          ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        SUPABASE CLOUD POSTGRESQL DATABASE                              │
│                                                                                        │
│  Master Tables:                                                                        │
│    • users, students (304 rows), teachers (15 rows), classes (4 rows), subjects (15)   │
│    • timetable_entries (203 rows), attendance_sessions (250 rows), attendance_records   │
│  Assessment & Quiz Tables (Step 5):                                                    │
│    • quizzes, quiz_questions, question_options, quiz_attempts, student_answers         │
│    • quiz_results, result_publication_logs, result_change_logs                          │
│  Academic Records & Digital Wallet (Step 6):                                           │
│    • student_academic_records (401 rows), student_subject_results, student_backlogs    │
│    • student_fee_accounts, fee_invoices, fee_invoice_items, fee_payments, fee_receipts │
│    • student_documents, student_certificates, academic_result_publications            │
│  Notifications & Alerts (Step 7):                                                      │
│    • notifications, notification_targets, notification_preferences, notif_logs         │
│  Management & RBAC (Step 8):                                                           │
│    • roles, permissions, role_permissions, user_roles, faculty_leave_requests          │
│    • faculty_subject_assignments, faculty_class_assignments, admin_audit_logs         │
│  Database Logic:                                                                       │
│    • Stored Procedures (RPCs): get_admin_dashboard, get_teacher_dashboard, etc.        │
│    • Triggers & Row-Level Security (RLS) Policies                                      │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Directory Structure

```
d:\ERP-SYSTEM\
├── backend\
│   ├── config\
│   │   ├── database.py             # Supabase PostgreSQL engine & session pooler
│   │   └── settings.py             # Environment configuration (Pydantic BaseSettings)
│   ├── models\                     # SQLAlchemy ORM models
│   ├── routes\                     # FastApi Modular APIRouters
│   │   ├── academic_wallet.py      # Step 6: Academic Records & Digital Wallet API
│   │   ├── admin.py                # System Admin operations
│   │   ├── attendance.py           # Faculty attendance & roster API
│   │   ├── auth.py                 # Authentication & profile switching
│   │   ├── faculty.py              # Faculty profile, timetable & class cards
│   │   ├── management.py           # Step 8: Management & Administrative tools
│   │   ├── notifications.py        # Step 7: Centralized real-time alerts
│   │   ├── quiz.py                 # Step 5: Assessment & Online Quiz portal
│   │   ├── student.py              # Student academic overview & profile
│   │   ├── student_records.py      # Student marksheets & certificates
│   │   └── syllabus.py             # Syllabus & curriculum units
│   ├── schemas\                    # Pydantic validation schemas
│   ├── services\                   # Core business logic layer
│   │   ├── academic_wallet_service.py
│   │   ├── att_service.py
│   │   ├── auth_service.py
│   │   ├── faculty_service.py
│   │   ├── management_service.py
│   │   ├── notification_service.py
│   │   ├── quiz_service.py
│   │   ├── student_service.py
│   │   └── syllabus_service.py
│   ├── utils\
│   │   ├── helpers.py              # Response formatters, UUID & date utilities
│   │   └── security.py             # Password hashing & JWT helpers
│   ├── main.py                     # Primary FastAPI application entry point
│   ├── requirements.txt            # Python production dependencies
│   └── .env                        # Backend environment secrets & DB connection string
├── docs\
│   ├── ARCHITECTURE.md             # This document
│   └── ERP-AUDIT.md                # System audit and migration analysis
├── frontend\
│   ├── assets\                     # SVG icons and visual assets
│   ├── css\                        # Consolidated styles
│   │   ├── attendance.css          # Swipe cards, roster & marking table
│   │   ├── student-dashboard.css   # Student layout, wallet & results
│   │   ├── teacher-dashboard.css   # Teacher schedule, workload & leave
│   │   └── admin-dashboard.css     # Admin overview & RBAC matrix
│   ├── html\                       # Production web pages
│   │   ├── login.html              # Unified login (Student, Faculty, Admin)
│   │   ├── student-dashboard.html  # Student Academic & Wallet portal
│   │   ├── teacher-dashboard.html  # Teacher Workspace & Tools
│   │   ├── admin-dashboard.html    # Administrative Console
│   │   ├── student-quiz.html       # Online quiz taking interface
│   │   ├── teacher-quiz.html       # Assessment creation & grading
│   │   ├── teacher-attendance.html # Attendance marking console
│   │   └── teacher-attendance-roster.html # Class roster view
│   ├── images\                     # College logos and official assets
│   └── js\                         # Unified frontend client scripts
│       ├── api.js                  # Centralized HTTP client targeting Port 8000
│       ├── app.js                  # Application state & view orchestrator
│       ├── auth.js                 # Authentication, tokens & logout
│       ├── data.js                 # Local cache, subjects & mock fallbacks
│       ├── student-dashboard.js    # Student portal controller
│       ├── teacher-dashboard.js    # Teacher portal controller
│       └── supabaseClient.js       # Supabase Realtime client
├── supabase\
│   ├── migrations\                 # Step 5–8 Canonical PostgreSQL Migrations
│   │   ├── 01_step5_quiz_schema.sql
│   │   ├── 02_step6_academic_wallet_schema.sql
│   │   ├── 03_notifications_realtime_alerts.sql
│   │   └── 04_teacher_admin_management.sql
│   ├── schemas\                    # Table definitions and views
│   ├── scripts\                    # Administrative seed and synchronization scripts
│   └── legacy_sqlite_backup\       # Archived SQLite database (erp.db)
├── tests\
│   ├── db_helper.py                # Common database execution helper for tests
│   ├── test_api_endpoints.py       # Core FastAPI endpoint test suite
│   ├── test_database.py            # Direct Supabase PostgreSQL integrity tests
│   ├── test_frontend_assets.py     # Frontend HTML loading & static route tests
│   ├── test_step5_quiz_verification.py
│   ├── test_step6_academic_wallet_api.py
│   ├── test_step6_academic_wallet_verification.py
│   ├── test_step7_notifications_api.py
│   ├── test_step7_notifications_verification.py
│   ├── test_step8_management_api.py
│   └── test_step8_management_verification.py
├── DATA\                           # Source college reference PDFs & Excel rosters
├── run_backend.bat                 # Single canonical launcher script
└── .env                            # Root environment configuration
```

---

## 4. Database Architecture (Supabase Cloud PostgreSQL)

### 4.1 Connection Configuration
All backend services connect directly to Supabase PostgreSQL using SQLAlchemy Connection Pooling with automatic keep-alive:
```python
DATABASE_URL = "postgresql://erp_app.gftqvclenyplnuoocbwe:SsgmceApp2026@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres"

engine = create_engine(
    DATABASE_URL,
    pool_size=10,
    max_overflow=20,
    pool_pre_ping=True,      # Proactively verifies connection liveness
    pool_recycle=300         # Recycles pooled connections every 5 minutes
)
```

### 4.2 Verified Database Row Counts
| Table / Entity | Verified Row Count | Description |
| :--- | :--- | :--- |
| `students` | 304 | Official roll list across 2R1, 2R2, 3R, 4R |
| `teachers` | 15 | Computer Science & Engineering faculty |
| `classes` | 4 | Academic classes (2R1, 2R2, 3R, 4R) |
| `subjects` | 15 | Departmental theory and lab courses |
| `timetable_entries` | 203 | Official college weekly class slots |
| `attendance_sessions` | 250 | Conducted classroom & lab sessions |
| `attendance_records` | 1,900+ | Student-level attendance records |
| `quizzes` | 3 | Step 5 active & scheduled assessments |
| `student_academic_records`| 401 | Step 6 semester-wise academic records |
| `student_subject_results` | 560 | Subject-level marks, grades & credits |
| `student_fee_accounts` | 80 | Digital fee balance ledgers |
| `fee_receipts` | 160 | Official fee payment receipts |
| `student_documents` | 372 | Bonafide, marksheets, admission receipts |
| `student_certificates` | 153 | Verified academic certificates |
| `notifications` | 17 | Real-time broadcast and targeted alerts |
| `roles` | 5 | Super Admin, Admin, HOD, Teacher, Student |
| `permissions` | 30 | Granular operation permissions |
| `role_permissions` | 101 | Role-to-permission mappings |

---

## 5. Canonical Module Implementations

### 5.1 Attendance Module
- **Frontend Pages:** `frontend/html/teacher-attendance.html`, `frontend/html/teacher-attendance-roster.html`
- **Client Controller:** `frontend/js/attendance.js` (Tinder-style swipe engine & spreadsheet bulk entry)
- **Backend Route:** `backend/routes/attendance.py`
- **Backend Service:** `backend/services/att_service.py`
- **Key Capabilities:**
  - Class-wise student roster retrieval (`GET /api/v1/teacher/class-roster?classId=2R1`)
  - Session creation with atomic bulk attendance insertion (`POST /api/v1/teacher/attendance/bulk`)
  - Live attendance summary calculation with safe-zone margin analysis (`GET /api/v1/student/attendance?student_code=308637`)
  - Defaulter tracking (<75% threshold) with automated alert triggering.

### 5.2 Timetable & Faculty Workload Module
- **Frontend Views:** `frontend/html/teacher-dashboard.html#timetable`, `frontend/html/student-dashboard.html#timetable`
- **Backend Route:** `backend/routes/faculty.py`, `backend/routes/syllabus.py`
- **Backend Service:** `backend/services/faculty_service.py`
- **Key Capabilities:**
  - Personalized 6-slot weekly timetable grid for teachers based on official college timetable (`GET /api/v1/timetable/my`)
  - Weekly workload hours calculation (Lectures + Labs)
  - Student personal schedule retrieval with venue and faculty details.

### 5.3 Assessment & Online Quiz Module (Step 5)
- **Frontend Pages:** `frontend/html/teacher-quiz.html` (Authoring & Grading), `frontend/html/student-quiz.html` (Test Taking)
- **Backend Route:** `backend/routes/quiz.py`
- **Backend Service:** `backend/services/quiz_service.py`
- **Database Tables:** `quizzes`, `quiz_questions`, `question_options`, `quiz_attempts`, `student_answers`, `quiz_results`
- **Key Capabilities:**
  - Strict class-enrollment validation (students can only access quizzes assigned to their class)
  - Timed attempt execution with automatic timer validation
  - Auto-grading supporting single choice, multiple choice, and true/false questions
  - Negative marking calculation
  - Teacher result publication workflow (results hidden until teacher publishes)
  - Full class export to CSV including non-attempted students
  - Complete audit logs of result publication and manual mark alterations.

### 5.4 Student Academic Records & Digital Wallet (Step 6)
- **Frontend Page:** `frontend/html/student-dashboard.html`
- **Client Script:** `frontend/js/student-dashboard.js`
- **Backend Route:** `backend/routes/academic_wallet.py`
- **Backend Service:** `backend/services/academic_wallet_service.py`
- **Database Tables:** `student_academic_records`, `student_subject_results`, `student_backlogs`, `student_fee_accounts`, `fee_invoices`, `fee_payments`, `fee_receipts`, `student_documents`, `student_certificates`
- **Key Capabilities:**
  - Semester-wise results view (SGPA, CGPA, total percentage, credits earned, backlog tracking)
  - Unified fee financial ledger: **Total Fees → Scholarship → Discount → Net Payable → Paid → Pending Due**
  - Online fee payment processing with instant transaction receipt generation
  - Digital document wallet: Bonafide certificates, official marksheets, admission receipts
  - Public certificate authenticity verification (`GET /api/v1/certificates/verify/{cert_code}`).

### 5.5 Notifications & Real-Time Alerts (Step 7)
- **Frontend Widgets:** Topbar notification bell dropdown, banner alerts, notification preferences modal
- **Client Service:** `frontend/js/supabaseClient.js`
- **Backend Route:** `backend/routes/notifications.py`
- **Backend Service:** `backend/services/notification_service.py`
- **Database Tables:** `notifications`, `notification_targets`, `notification_preferences`, `notification_delivery_logs`
- **Key Capabilities:**
  - Real-time event notifications (Quiz published, Attendance alert, Fee received, Leave approved)
  - Multi-level targeting: `user`, `class`, `division`, `department`, `semester`, `role`, `college`
  - Granular unread count badges (`GET /api/v1/notifications/unread-count?user_id=...`)
  - Mark single / mark all read operations
  - Priority levels: `low`, `normal`, `high`, `urgent`.

### 5.6 Teacher & Admin Management Tools (Step 8)
- **Frontend Pages:** `frontend/html/teacher-dashboard.html`, `frontend/html/admin-dashboard.html`
- **Backend Route:** `backend/routes/management.py`
- **Backend Service:** `backend/services/management_service.py`
- **Database Tables:** `roles`, `permissions`, `role_permissions`, `user_roles`, `faculty_leave_requests`, `faculty_documents`, `admin_audit_logs`
- **Key Capabilities:**
  - Administrative system overview via high-performance PostgreSQL RPC: `public.get_admin_dashboard()`
  - Faculty dashboard overview via PostgreSQL RPC: `public.get_teacher_dashboard(faculty_id)`
  - Faculty leave application and review workflow (Pending → Approved/Rejected)
  - Bulk marks entry with validation against maximum marks and attendance boundaries
  - Role-Based Access Control (RBAC) permission matrix
  - Comprehensive immutable administrative audit logging (`admin_audit_logs`).

---

## 6. Unified API Route Map

All routes are served by `backend/main.py` on port `8000` under `/api/v1`:

| Module | Method | Canonical Route | Description |
| :--- | :--- | :--- | :--- |
| **System** | `GET` | `/health` | System health and database connectivity |
| **Auth** | `POST` | `/api/v1/auth/login` | Role-based authentication (student, teacher, admin) |
| **Auth** | `GET` | `/api/v1/auth/me` | Current authenticated user context |
| **Master Data** | `GET` | `/api/v1/classes` | All classes (`2R1`, `2R2`, `3R`, `4R`) |
| **Master Data** | `GET` | `/api/v1/subjects` | Departmental subject curriculum |
| **Faculty** | `GET` | `/api/v1/teacher/profile` | Teacher profile data |
| **Faculty** | `PUT` | `/api/v1/teacher/profile` | Update permitted profile fields |
| **Faculty** | `GET` | `/api/v1/timetable/my` | Weekly 6-slot timetable schedule |
| **Attendance** | `GET` | `/api/v1/teacher/class-roster` | Real student roster for class |
| **Attendance** | `POST` | `/api/v1/teacher/attendance/bulk` | Bulk attendance marking submission |
| **Student** | `GET` | `/api/v1/student/profile` | Student academic profile |
| **Student** | `GET` | `/api/v1/student/attendance` | Subject-wise attendance and safe-zone margin |
| **Quiz** | `GET` | `/api/v1/quiz/quizzes` | List quizzes (filtered by class/status) |
| **Quiz** | `POST` | `/api/v1/quiz/quizzes` | Create assessment |
| **Quiz** | `GET` | `/api/v1/quiz/quizzes/{id}` | Detailed quiz info & questions |
| **Quiz** | `POST` | `/api/v1/quiz/student/quizzes/{id}/start` | Start timed attempt |
| **Quiz** | `POST` | `/api/v1/quiz/student/attempts/{id}/submit` | Submit answers & auto-grade |
| **Academic Wallet** | `GET` | `/api/v1/student/academic-dashboard`| Student semester summary (SGPA/CGPA) |
| **Academic Wallet** | `GET` | `/api/v1/student/semester-results` | Detailed course-wise grades & credits |
| **Academic Wallet** | `GET` | `/api/v1/student/fees` | Financial balance (Payable/Paid/Pending) |
| **Academic Wallet** | `GET` | `/api/v1/student/fee-transactions` | Payment history and receipts |
| **Academic Wallet** | `POST` | `/api/v1/student/fees/pay` | Record online fee payment |
| **Academic Wallet** | `GET` | `/api/v1/student/documents` | Verified certificates & grade sheets |
| **Academic Wallet** | `GET` | `/api/v1/certificates/verify/{code}` | Public certificate verification |
| **Notifications** | `GET` | `/api/v1/notifications/unread-count`| Unread alert counts |
| **Notifications** | `GET` | `/api/v1/notifications/list` | Paginated notification list |
| **Notifications** | `POST` | `/api/v1/notifications/mark-read/{id}` | Mark single notification read |
| **Notifications** | `POST` | `/api/v1/notifications/create` | Dispatch targeted notification |
| **Management** | `GET` | `/api/v1/management/admin/dashboard` | Admin overview metrics RPC |
| **Management** | `GET` | `/api/v1/management/teacher/dashboard` | Teacher workload & classes RPC |
| **Management** | `POST` | `/api/v1/management/teacher/leave/apply` | Apply for faculty leave |
| **Management** | `POST` | `/api/v1/management/leave/review` | Approve/reject leave application |
| **Management** | `POST` | `/api/v1/management/teacher/marks/bulk`| Bulk marks entry with audit log |
| **Management** | `GET` | `/api/v1/management/rbac/matrix` | Full RBAC permissions matrix |
| **Management** | `GET` | `/api/v1/management/audit/logs` | Immutable audit log trail |

---

## 7. Operational Verification & Test Suite

All 10 verification test suites in `tests/` pass with **100% success**:

```bash
# 1. Database Integrity & Row Count Verification
python tests/test_database.py
# Result: ALL DATABASE TESTS PASSED (304 students, 15 teachers, 4 classes, 15 subjects)

# 2. FastAPI Core Endpoints Verification
python tests/test_api_endpoints.py
# Result: ALL API ENDPOINT TESTS PASSED (Health, Auth, Master Data, Student, Teacher, Quiz, Admin)

# 3. Frontend Assets & Static Routing Verification
python tests/test_frontend_assets.py
# Result: ALL FRONTEND ASSET TESTS PASSED (All 8 HTML pages & redirects return 200/307)

# 4. Step 5 Assessment & Online Quiz Verification
python tests/test_step5_quiz_verification.py
# Result: VERIFICATION COMPLETE (3 Quizzes, Questions, Attempts, Leaderboard & Audit Logs)

# 5. Step 6 Academic Records & Digital Wallet Verification
python tests/test_step6_academic_wallet_verification.py
# Result: STEP 6 DATABASE IS 100% OPERATIONAL, INTEGRATED & VERIFIED

# 6. Step 6 Academic Wallet API Suite
python tests/test_step6_academic_wallet_api.py
# Result: ALL 8 API TESTS PASSED (Dashboard, Results, Fees, Documents, Certificates)

# 7. Step 7 Notifications Verification
python tests/test_step7_notifications_verification.py
# Result: ALL NOTIFICATION DATABASE OBJECTS VERIFIED

# 8. Step 7 Notifications API Suite
python tests/test_step7_notifications_api.py
# Result: ALL 6 NOTIFICATION API TESTS PASSED

# 9. Step 8 Management Schema Verification
python tests/test_step8_management_verification.py
# Result: ALL STEP 8 DATABASE OBJECTS VERIFIED PERFECTLY (Tables, Views, RPCs)

# 10. Step 8 Management API Suite
python tests/test_step8_management_api.py
# Result: 15 / 15 TEST SUITES PASSED (100.0%)
```

---

## 8. Starting the Production System

To launch the unified ERP Backend:
```bat
run_backend.bat
```
Or execute directly via Python:
```bash
python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
```

The system will start on port `8000`:
- **API Documentation (Swagger UI):** `http://localhost:8000/docs`
- **System Health Endpoint:** `http://localhost:8000/health`
- **Student Dashboard:** `http://localhost:8000/student-dashboard.html`
- **Teacher Dashboard:** `http://localhost:8000/teacher-dashboard.html`
- **Admin Dashboard:** `http://localhost:8000/admin-dashboard.html`
- **Assessment Portal:** `http://localhost:8000/student-quiz.html`

