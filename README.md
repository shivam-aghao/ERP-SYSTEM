# Shri Sant Gajanan Maharaj College of Engineering (SSGMCE), Shegaon
## Autonomous Enterprise College ERP & Examination Management System

[![FastAPI](https://img.shields.io/badge/FastAPI-0.110.0-009688.svg?logo=fastapi)](https://fastapi.tiangolo.com)
[![Python](https://img.shields.io/badge/Python-3.10%2B-blue.svg?logo=python)](https://python.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-336791.svg?logo=postgresql)](https://postgresql.org)
[![Supabase](https://img.shields.io/badge/Supabase-Cloud-3ECF8E.svg?logo=supabase)](https://supabase.com)
[![Architecture](https://img.shields.io/badge/Architecture-Clean%20API%20%7C%20Zero--Trust-orange.svg)](#system-architecture)

A comprehensive, zero-trust, cloud-synchronized Enterprise Resource Planning (ERP) platform architected for **Shri Sant Gajanan Maharaj College of Engineering (SSGMCE), Shegaon**. The system centralizes college operations across administration, faculty instruction, student self-service, financial ledgers, biometric attendance sessions, instructional timetables, and an automated online quiz engine with anti-cheat proctoring and per-student question paper randomization.

---

## Table of Contents

- [1. Project Overview & Problem Statement](#1-project-overview--problem-statement)
- [2. Technology Stack & Architecture](#2-technology-stack--architecture)
- [3. Complete ERP Module Documentation](#3-complete-erp-module-documentation)
- [4. Role-Based Access Control (RBAC) Matrix](#4-role-based-access-control-rbac-matrix)
- [5. Complete Online Quiz & Assessment System](#5-complete-online-quiz--assessment-system)
  - [Teacher Quiz Workflow](#a-teacher-quiz-workflow)
  - [AI Question Generator & Curriculum Engine](#b-ai-question-generator--curriculum-engine)
  - [Student Quiz Examination Workflow](#c-student-quiz-examination-workflow)
  - [Question Paper Randomization & Balancing Engine](#d-question-paper-randomization--balancing-engine)
  - [Anti-Cheating, Proctoring & The 5-Warning Auto-Submit Rule](#e-anti-cheating-proctoring--the-5-warning-auto-submit-rule)
  - [Automated Scoring & Shuffled Options Evaluation](#f-automated-scoring--shuffled-options-evaluation)
  - [Teacher Analytics & Exposure Heatmap](#g-teacher-analytics--exposure-heatmap)
- [6. Database Architecture & Entity Relationships](#6-database-architecture--entity-relationships)
- [7. Canonical REST API Reference](#7-canonical-rest-api-reference)
- [8. Installation & Local Setup (Windows PowerShell)](#8-installation--local-setup-windows-powershell)
- [9. Configuration & Environment Variables](#9-configuration--environment-variables)
- [10. Testing & Verification Suite](#10-testing--verification-suite)
- [11. Security, Zero-Trust Policies & Data Integrity](#11-security-zero-trust-policies--data-integrity)
- [12. Known Limitations & Technical Gaps](#12-known-limitations--technical-gaps)
- [13. Recommended Future Improvements](#13-recommended-future-improvements)
- [14. Troubleshooting Guide](#14-troubleshooting-guide)
- [15. License & Institutional Attribution](#15-license--institutional-attribution)

---

## 1. Project Overview & Problem Statement

### Problems Solved
Traditional engineering college management frequently suffers from fragmented spreadsheets, disconnected biometric attendance logs, insecure local quiz evaluation, untracked academic record alterations, and paper-based fee processing.

This platform centralizes institutional data into a single **Supabase PostgreSQL** cloud database, ensuring:
- **Zero-Trust Identity**: Strict role isolation between Super Admins, Department Heads (HODs), Faculty, Accountants, and Students.
- **Fair Online Assessments**: Prevention of student collusion through per-student question subsets, difficulty balancing, independent MCQ option shuffling, and enforced browser unfocus limits.
- **Continuous Academic Roster**: Live tracking of student attendance percentages, SGPA/CGPA gazettes, backlogs, and financial clearance receipts.
- **Unified Single-Process Deployment**: Boots both the asynchronous REST API and client web dashboards from a single command (`python backend.py`).

### Target Roles
1. **Super Administrator**: Complete governance over institutional settings, database sync, role overrides, and system audit logs.
2. **Administrator / HOD**: Class and subject allocation, timetable approval, attendance unlock authorization, and department performance auditing.
3. **Faculty / Teacher**: Attendance marking via swipe engine, curriculum syllabus tracking, quiz pool authoring, AI question synthesis, and live test proctoring.
4. **Accountant / Cashier**: Invoice generation, scholarship application, fee collection, and digital wallet reconciliations.
5. **Student**: Self-service profile management, active quiz examinations, timetable inspection, verified document downloads, and financial ledger tracking.

---

## 2. Technology Stack & Architecture

### Core Tech Stack

| Layer | Technology | Version | Purpose |
| :--- | :--- | :--- | :--- |
| **Backend Framework** | [FastAPI](https://fastapi.tiangolo.com) | `0.110.0+` | High-performance asynchronous REST API, dependency injection, and OpenAPI documentation |
| **ASGI Server** | [Uvicorn](https://www.uvicorn.org) | `0.28.0+` | ASGI web server running on port `8000` |
| **Data Validation** | [Pydantic](https://docs.pydantic.dev) | `v2.0+` | Strict request/response payload typing and schema serialization |
| **Database ORM** | [SQLAlchemy](https://www.sqlalchemy.org) | `2.0+` | PostgreSQL connection pooling, raw text queries, and declarative models |
| **Database Engine** | [PostgreSQL (Supabase Cloud)](https://supabase.com) | `15.x` | Managed multi-tenant cloud PostgreSQL with connection pooling on port `6543` |
| **Database Driver** | [psycopg](https://www.psycopg.org) | `3.1.18+` | Modern binary PostgreSQL client supporting SSL |
| **Storage & Auth** | [Supabase Storage & REST](https://supabase.com) | `v2.117+` | Cloud object storage for documents, certificates, and institutional avatars |
| **Frontend UI** | HTML5, CSS3, Vanilla ES6+ JS | - | Native client dashboards, CSS variables design system, and Lucide icons |
| **AI Question Engine** | [Google Gemini API](https://ai.google.dev) | Flash models | Live generative question authoring with curriculum engine fallback |

### End-to-End System Architecture

```mermaid
flowchart TD
    subgraph Clients ["Client Layer (Web Browsers)"]
        U_STUDENT["Student Portal (student-dashboard.html, student-quiz.html)"]
        U_TEACHER["Teacher Portal (teacher-dashboard.html, teacher-quiz.html)"]
        U_ADMIN["Admin Portal (admin-dashboard.html, login.html)"]
    end

    subgraph Security ["Security & Gateways"]
        CORS["FastAPI CORS Middleware (Configurable Origins)"]
        AUTH_GUARD["JWT Token Auth Guard & Role Verification"]
        RATE_LIMIT["Incident Deduplication & Session Lockouts"]
    end

    subgraph Application ["Application Core (FastAPI & Services)"]
        API_AUTH["Auth Router (/api/v1/auth)"]
        API_STUDENTS["Students Router (/api/v1/students)"]
        API_TEACHERS["Teachers Router (/api/v1/teachers)"]
        API_ATTENDANCE["Attendance Router (/api/v1/attendance)"]
        API_QUIZZES["Quiz Engine Router (/api/v1/quizzes, /api/v1/attempts)"]
        API_RESULTS["Results Router (/api/v1/results)"]
        API_FEES["Fees Router (/api/v1/fees)"]
        API_DOCS["Documents Router (/api/v1/documents)"]
        
        SRV_QUIZ["QuizService Engine (Paper Randomizer & Option Shuffler)"]
        SRV_AI["AIQuestionService (Gemini API / Curriculum Synthesizer)"]
        SRV_ATT["AttendanceService (Swipe Engine & Session Locks)"]
    end

    subgraph Storage ["Cloud Infrastructure & Persistence"]
        DB[(PostgreSQL Supabase Database)]
        BLOB["Supabase Storage Buckets (Documents & Receipts)"]
    end

    Clients --> CORS --> AUTH_GUARD --> Application
    API_QUIZZES --> SRV_QUIZ
    API_QUIZZES --> SRV_AI
    API_ATTENDANCE --> SRV_ATT
    Application --> DB
    API_DOCS --> BLOB
```

---

## 3. Complete ERP Module Documentation

### Module Inventory & Status

| Module | Primary Purpose | Authorized Roles | Implementation Status | Real Endpoints & Routes |
| :--- | :--- | :--- | :--- | :--- |
| **Authentication & Sessions** | Persona authentication, JWT token issuance, multi-role resolution | All Users | **Complete** | `/api/v1/auth/login`, `/api/v1/auth/me`, `/api/v1/auth/refresh` |
| **Student Management** | Academic profile, e-learning materials, syllabus tracking, wallet | Student, Teacher, Admin | **Complete** | `/api/v1/students`, `/api/v1/students/{id}/profile`, `/api/v1/students/me/*` |
| **Teacher & Faculty** | Workload rosters, course assignments, certifications, class teaching | Teacher, HOD, Admin | **Complete** | `/api/v1/teachers`, `/api/v1/teachers/{id}/assignments`, `/api/v1/faculty` |
| **Class & Curriculum** | Department hierarchies, classes (e.g. 1R1, 3R), subject syllabi | All Users | **Complete** | `/api/v1/master/classes`, `/api/v1/master/departments`, `/api/v1/syllabus` |
| **Attendance Engine** | Session generation, attendance marking, student attendance percentages | Teacher, HOD, Admin, Student | **Complete** | `/api/v1/attendance/sessions`, `/api/v1/attendance/records`, `/api/v1/attendance/my` |
| **Instructional Timetable** | Weekly schedule matrices, conflict detection, scheduled tests | All Users | **Complete** | `/api/v1/timetable/class/{id}`, `/api/v1/timetable/teacher/{id}` |
| **Quiz & Assessment Engine** | Question pools, difficulty balancing, paper generation, auto-grading | Teacher, Admin, Student | **Complete** | `/api/v1/quizzes`, `/api/v1/quizzes/{id}/start`, `/api/v1/attempts/{id}/submit` |
| **AI Question Synthesizer** | Automated question authoring via Gemini API / Curriculum knowledge bank | Teacher, Admin | **Complete** | `/api/v1/quizzes/generate-questions` |
| **Marks & Results Gazette** | CIA/ESE marks rosters, SGPA/CGPA computation, revaluations | Teacher, Admin, Student | **Complete** | `/api/v1/results/quizzes/{id}`, `/api/v1/results/publish` |
| **Fees & Digital Wallet** | Semester invoices, payment gateway simulation, receipts, refunds | Accountant, Admin, Student | **Complete** | `/api/v1/fees/invoices`, `/api/v1/fees/pay`, `/api/v1/fees/receipt/{id}` |
| **Document Vault** | Certified mark-sheet uploads, identity proofs, Supabase Storage integration | All Users | **Complete** | `/api/v1/documents/upload`, `/api/v1/documents/my` |
| **Notifications** | Emergency alerts, attendance alerts, exam deadline announcements | All Users | **Complete** | `/api/v1/notifications`, `/api/v1/notifications/broadcast` |
| **Admin Governance & Auditing**| Database sync health, system activity logs, RBAC configuration | Admin, Super Admin | **Complete** | `/api/v1/admin/audit-logs`, `/api/v1/admin/sync`, `/health` |

---

## 4. Role-Based Access Control (RBAC) Matrix

Permissions are enforced via [`backend/rbac/matrix.py`](file:///d:/ERP-SYSTEM/backend/rbac/matrix.py) with zero wildcard privileges.

| Capability / Resource | Super Admin | Admin | HOD | Teacher | Accountant | Student |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **System Governance & Raw DB Sync** | `Yes` | `Yes` | `No` | `No` | `No` | `No` |
| **Manage Teachers & Roles** | `Yes` | `Yes` | `No` | `No` | `No` | `No` |
| **View Student Profile & Roster** | `Yes` | `Yes` | `Yes` | `Assigned Classes` | `Billing Only` | `Self Only` |
| **Mark Class Attendance** | `Yes` | `Yes` | `Yes` | `Assigned Sessions`| `No` | `No (View Self)` |
| **Unlock Past Attendance Locks** | `Yes` | `Yes` | `Yes` | `No` | `No` | `No` |
| **Create & Publish Quizzes** | `Yes` | `Yes` | `Yes` | `Assigned Subjects`| `No` | `No` |
| **Delete Quiz & Question Pool** | `Yes` | `Yes` | `Yes` | `Own Quizzes` | `No` | `No` |
| **Take Quiz & Submit Answers** | `No` | `No` | `No` | `No` | `No` | `Enrolled Class` |
| **View Individual Student Attempts** | `Yes` | `Yes` | `Yes` | `Assigned Quizzes` | `No` | `Self Only` |
| **Publish Academic Marks / Gazettes**| `Yes` | `Yes` | `Yes` | `Draft Only` | `No` | `No` |
| **Manage Fees, Invoices & Refunds** | `Yes` | `Yes` | `View Clearance` | `No` | `Yes` | `Pay / View Self`|
| **Upload Institutional Documents** | `Yes` | `Yes` | `Yes` | `Yes` | `Receipts` | `Personal KYC` |

---

## 5. Complete Online Quiz & Assessment System

The quiz engine is an autonomous assessment module supporting individual paper generation, option scrambling, automated grading, and live anti-cheat tracking.

```mermaid
sequenceDiagram
    autonumber
    actor T as Teacher
    participant API as FastAPI Backend
    participant Q_ENG as Quiz Service Engine
    participant DB as PostgreSQL Database
    actor S as Student

    T->>API: POST /api/v1/quizzes (Title, Class, 50-Q Pool, Config: 20 Q/student, Shuffled Options)
    API->>DB: INSERT into quizzes & quiz_randomization_configs
    T->>API: POST /api/v1/quizzes/generate-questions (Subject, Unit, Topic)
    API-->>T: Return 50 Preview Questions (AI/Curriculum Engine)
    T->>API: POST /api/v1/quizzes/{id}/questions (Bulk Insert)
    T->>API: POST /api/v1/quizzes/{id}/toggle-publish (Publish)
    API->>Q_ENG: validate_quiz_for_publishing(quiz_id)
    Q_ENG-->>API: Pool Verified (N >= K, Difficulty Satisfied)
    API->>DB: UPDATE quizzes SET status = 'active'

    Note over S,API: Student Starts Exam
    S->>API: POST /api/v1/quizzes/{id}/start
    API->>Q_ENG: _generate_or_get_attempt_paper(student_id)
    Q_ENG->>DB: Query or Generate Attempt Paper & Shuffled Options Map
    Q_ENG-->>S: Return 20 Questions (Stripped is_correct & explanations)
    
    loop Real-Time Exam Monitoring
        S->>API: POST /api/v1/attempts/{id}/answers (Autosave selections)
        S->>API: POST /api/v1/attempts/{id}/security-event (Tab switch logged)
        Note over S: If 5 Warnings Reached -> Auto-Submit Immediately
    end

    S->>API: POST /api/v1/attempts/{id}/submit
    API->>Q_ENG: evaluate_submission(attempt_id, answers)
    Q_ENG->>DB: Grade against Student's Shuffled Options Map
    API-->>S: Scorecard & Instant Review (if published)
```

---

### A. Teacher Quiz Workflow
1. **Login & Portal Access**: Faculty authenticate at `/frontend/html/login.html` and navigate to the **Online Quiz** tab in `teacher-quiz.html`.
2. **Quiz Configuration**:
   - Title, Academic Subject, Class Assignment (`1R1`, `2R1`, `3R`), Total Duration (Minutes), Marks per Question, and Negative Marking (e.g. `0.5` marks penalty per wrong answer).
3. **Randomization & Proctoring Setup**:
   - **Randomize Questions**: Shuffles question delivery order per student.
   - **Randomize Options**: Shuffles MCQ choices A/B/C/D independently per student attempt.
   - **Questions Per Student ($K$)**: Selects a subset from a larger question pool ($N$).
   - **Difficulty Quotas**: Custom ratios (e.g. 40% Easy, 40% Medium, 20% Hard).
4. **Pre-Publish Validation**:
   - The engine validates that total questions in the pool satisfy $N \ge K$ and that difficulty quotas are physically present before allowing the quiz to go live.
5. **Publishing**: Sets state to `active`, immediately notifying students in the target class.

---

### B. AI Question Generator & Curriculum Engine
Implemented in [`backend/services/ai_question_service.py`](file:///d:/ERP-SYSTEM/backend/services/ai_question_service.py):
- **Live Google Gemini API Integration**:
  - When `GEMINI_API_KEY` is configured in `backend/.env`, the system queries models (`gemini-2.5-flash`, `gemini-2.0-flash`) with structured JSON schemas.
  - Generates college-level questions matching the teacher's exact Subject, Unit number, Topic, Subtopics, and teacher instructions.
- **Curriculum Fallback Engine (Offline Resilience)**:
  - If no API key is supplied or rate limits are reached, the system automatically falls back to the **SSGMCE Authoritative CSE Curriculum Engine** (`CSE_CURRICULUM_BANK`).
  - Contains verified question blueprints for Data Structures, OS, DBMS, Computer Networks, Java/OOP, and Software Engineering.
- **Teacher Review & Approval**:
  - Questions render in an editable card preview list. Teachers can modify question statements, change distractors, swap correct keys, regenerate individual items, and commit selections to PostgreSQL with a single bulk insert.

---

### C. Student Quiz Examination Workflow
1. **Eligibility & Start**:
   - Students see active quizzes for their enrolled class.
   - Calling `POST /api/v1/quizzes/{id}/start` verifies eligibility and remaining duration.
2. **Protected Quiz Runner**:
   - Student enters `#view-runner` mode in `student-quiz.html`.
   - Browser full-screen is requested, right-click context menu is blocked, and clipboard operations (`copy`, `cut`, `paste`) are neutralized.
3. **Timer & Real-Time Autosave**:
   - Authoritative countdown timer backed by server start timestamps.
   - Answers save in real-time to `quiz_attempt_answers` via debounced network calls.
4. **Reconnection & Refresh Resilience**:
   - If a student refreshes their browser or experiences a network dropout, re-opening the quiz returns their **exact saved question paper snapshot** and identical option order. Questions and options are never re-rolled mid-attempt.

---

### D. Question Paper Randomization & Balancing Engine
Implemented in [`backend/services/quiz_service.py`](file:///d:/ERP-SYSTEM/backend/services/quiz_service.py):
- **Exposure-Balanced Sampling**: Questions are partitioned into Easy, Medium, and Hard buckets. When a student starts, the system prioritizes least-exposed questions, guaranteeing even question distribution across the class.
- **Per-Attempt Option Scrambling**:
  - For each question, options A, B, C, D are randomized using a cryptographically seeded shuffle.
  - The resulting mapping is stored in `quiz_attempt_papers.options_map`:
    ```json
    {
      "displayed_options": {
        "A": {"original_key": "C", "text": "Shortest Job First (SJF)", "is_correct": true},
        "B": {"original_key": "A", "text": "First-Come First-Served", "is_correct": false}
      },
      "correct_keys": ["A"]
    }
    ```
- **Zero Answer Leakage**: The client payload completely strips `is_correct` and `explanation` attributes. Students inspecting browser DOM or network tabs cannot view the answers.

---

### E. Anti-Cheating, Proctoring & The 5-Warning Auto-Submit Rule
Implemented in [`frontend/js/student-quiz-security.js`](file:///d:/ERP-SYSTEM/frontend/js/student-quiz-security.js):

| Incident | Student UI Feedback | Backend System Action |
| :--- | :--- | :--- |
| **Window Blur / Tab Switch (Warnings 1 - 3)** | Screen blurs. Modal displays: `Recorded Warning X of 5`. Student must acknowledge notice to resume. | Event logged to `quiz_security_events` with timestamp and metadata. |
| **Warning 4 of 5** | Caution banner: `⚠️ FINAL WARNING: 1 more focus loss will automatically submit your quiz!` | Flagged in faculty proctoring logs. |
| **Warning 5 of 5 (Limit Exceeded)** | Modal locks permanently. Badge indicates `Recorded Warning 5 of 5 - Limit Reached`. Button changes to disabled `Submitting Quiz Responses...`. Resume is disabled. | **Immediate Automatic Submit**: Submits attempt payload with `is_auto_submit: true, submission_reason: "max_security_violations"`. |
| **Attempt Resubmission** | Blocked. Attempts in `auto_submitted` or `submitted` status reject subsequent modifications. | HTTP 400 rejection on subsequent answer posts. |

---

### F. Automated Scoring & Shuffled Options Evaluation
- Evaluated strictly against the student attempt's `options_map`:
  $$\text{Raw Marks} = \sum (\text{Correct Answers} \times \text{Marks per Question})$$
  $$\text{Negative Penalty} = \sum (\text{Incorrect Answers} \times \text{Negative Marks per Question})$$
  $$\text{Final Marks} = \max(0.0, \text{Raw Marks} - \text{Negative Penalty})$$
  $$\text{Percentage} = \left(\frac{\text{Final Marks}}{\text{Total Quiz Marks}}\right) \times 100$$
- Unanswered questions contribute `0.0` marks and are exempt from negative marking penalties.

---

### G. Teacher Analytics & Exposure Heatmap
Accessible via `GET /api/v1/quizzes/{id}/analytics`:
- **Paper Uniqueness Metric**: Reports total generated papers vs. distinct question combinations (e.g. 30 unique papers for 30 students).
- **Question Exposure Heatmap**: Tracks exposure counts and percentages for every question in the pool.
- **Proctoring Incident Feed**: Displays roll numbers, timestamps, and violation counts for students flagged during the exam.

---

## 6. Database Architecture & Entity Relationships

The schema runs on Supabase PostgreSQL. Below is the Entity-Relationship map representing the academic core and online quiz engine.

```mermaid
erDiagram
    DEPARTMENTS ||--o{ CLASSES : contains
    CLASSES ||--o{ STUDENTS : enrolls
    TEACHERS ||--o{ FACULTY_CLASS_ASSIGNMENTS : assigned_to
    CLASSES ||--o{ FACULTY_CLASS_ASSIGNMENTS : allocates
    
    SUBJECTS ||--o{ QUIZZES : categorized_under
    CLASSES ||--o{ QUIZZES : assigned_to
    TEACHERS ||--o{ QUIZZES : authors

    QUIZZES ||--|| QUIZ_RANDOMIZATION_CONFIGS : configures
    QUIZZES ||--o{ QUIZ_QUESTIONS : contains
    QUIZ_QUESTIONS ||--o{ QUESTION_OPTIONS : provides
    QUIZ_QUESTIONS ||--|| QUIZ_QUESTION_METADATA : classified_by

    QUIZZES ||--o{ QUIZ_ATTEMPTS : taken_in
    STUDENTS ||--o{ QUIZ_ATTEMPTS : attempts
    QUIZ_ATTEMPTS ||--|| QUIZ_ATTEMPT_PAPERS : snapshots
    QUIZ_ATTEMPTS ||--o{ QUIZ_ATTEMPT_ANSWERS : records
    QUIZ_ATTEMPTS ||--|| QUIZ_RESULTS : calculates
    QUIZ_ATTEMPTS ||--o{ QUIZ_SECURITY_EVENTS : logs

    DEPARTMENTS {
        string id PK
        string department_code UK
        string department_name
    }

    CLASSES {
        string id PK
        string class_name UK
        string department_id FK
        string academic_year
    }

    STUDENTS {
        string id PK
        string student_code UK
        string roll_no
        string full_name
        string email UK
        string class_id FK
    }

    TEACHERS {
        string id PK
        string teacher_code UK
        string full_name
        string email UK
        string department_id FK
    }

    QUIZZES {
        string id PK
        string title
        string class_id FK
        string teacher_id FK
        int duration_minutes
        float total_marks
        float passing_marks
        boolean randomize_questions
        boolean randomize_options
        boolean negative_marking
        float negative_marks_per_question
        string status
    }

    QUIZ_RANDOMIZATION_CONFIGS {
        string quiz_id PK,FK
        int questions_per_student
        boolean unique_question_paper
        boolean prevent_duplicate_questions
        boolean randomize_question_types
        text difficulty_distribution
        text security_settings
    }

    QUIZ_ATTEMPT_PAPERS {
        string attempt_id PK,FK
        string quiz_id FK
        string student_id FK
        text question_ids
        text paper_payload
        text options_map
    }

    QUIZ_ATTEMPTS {
        string id PK
        string quiz_id FK
        string student_id FK
        string status
        boolean auto_submitted
        string submission_reason
        datetime started_at
        datetime submitted_at
        float final_marks
        float percentage
    }
```

---

## 7. Canonical REST API Reference

All endpoints conform to `/api/v1/*` and return a standardized JSON envelope:
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation completed successfully",
  "code": 200
}
```

### Core API Endpoints

| Method | Endpoint | Description | Auth / Role Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/auth/login` | Authenticate student, teacher, or admin via credentials | Public |
| `GET` | `/api/v1/auth/me` | Fetch active user session profile & permissions | Bearer Token |
| `GET` | `/api/v1/students` | List students with optional class filter | Teacher / Admin |
| `GET` | `/api/v1/teachers` | List all faculty and instructor assignments | Admin |
| `GET` | `/api/v1/master/classes` | Fetch academic classes (`1R1`, `2R1`, `3R`, etc.) | Authenticated |
| `GET` | `/api/v1/attendance/records` | Query session attendance records | Teacher / Admin |
| `POST`| `/api/v1/attendance/submit` | Submit finalized class attendance sheet | Teacher / Admin |
| `GET` | `/api/v1/timetable/class/{id}` | Fetch weekly schedule matrix for a class | Authenticated |
| `GET` | `/api/v1/quizzes` | List quizzes filtered by role and class | Authenticated |
| `POST`| `/api/v1/quizzes` | Create a new quiz with pool & randomization configuration | Teacher / Admin |
| `POST`| `/api/v1/quizzes/generate-questions` | Generate syllabus-aligned questions (AI/Curriculum) | Teacher / Admin |
| `GET` | `/api/v1/quizzes/{id}/validate-publish` | Pre-publish verification of question pool and quotas | Teacher / Admin |
| `POST`| `/api/v1/quizzes/{id}/toggle-publish` | Toggle quiz publish status (`publish`/`unpublish`) | Teacher / Admin |
| `POST`| `/api/v1/quizzes/{id}/start` | Initialize student attempt, generate balanced paper snapshot | Student |
| `POST`| `/api/v1/attempts/{id}/answers` | Real-time autosave of student selected options | Student |
| `POST`| `/api/v1/attempts/{id}/security-event` | Log focus loss, tab switch, or fullscreen exit | Student |
| `POST`| `/api/v1/attempts/{id}/submit` | Finalize attempt submission & calculate scorecard | Student |
| `GET` | `/api/v1/attempts/{id}/result` | Fetch scorecard and review solutions | Authenticated |
| `GET` | `/api/v1/quizzes/{id}/analytics` | Comprehensive teacher quiz analytics and exposure heat | Teacher / Admin |
| `GET` | `/api/v1/fees/summary` | Student fee ledger balance, dues, and transaction log | Student / Accountant |
| `POST`| `/api/v1/fees/pay` | Simulate payment against outstanding invoice | Student / Accountant |
| `GET` | `/health` | Health check for PostgreSQL database and Supabase client | Public |

---

## 8. Installation & Local Setup (Windows PowerShell)

Follow these step-by-step instructions to run the ERP system locally on Windows.

### Prerequisites
- **Python 3.10+** (Confirm with `python --version`)
- **Git** (Confirm with `git --version`)
- **Internet connectivity** for Supabase Cloud PostgreSQL pooler connection

### 1. Clone Repository & Open PowerShell
```powershell
cd D:\
git clone https://github.com/your-org/ERP-SYSTEM.git
cd D:\ERP-SYSTEM
```

### 2. Configure Python Virtual Environment
```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

### 3. Install Backend Dependencies
```powershell
pip install --upgrade pip
pip install -r backend\requirements.txt
```

### 4. Setup Environment Configuration
Copy the provided environment template to `.env` and `backend/.env`:
```powershell
Copy-Item .env.example .env
Copy-Item .env.example backend\.env
```
Open `.env` and fill in your Supabase connection strings as described in [Configuration](#9-configuration--environment-variables).

### 5. Start Unified ERP Server
Execute the master launch command:
```powershell
python backend.py
```
*Expected Console Output:*
```
INFO:     Started server process
INFO:     Waiting for application startup.
INFO:     Startup: Supabase Cloud bi-directional synchronization completed.
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
```

### 6. Access Dashboards in Web Browser
- **Unified Login**: `http://localhost:8000/frontend/html/login.html`
- **Student Portal**: `http://localhost:8000/frontend/html/student-dashboard.html`
- **Teacher Portal**: `http://localhost:8000/frontend/html/teacher-dashboard.html`
- **Admin Portal**: `http://localhost:8000/frontend/html/admin-dashboard.html`
- **Interactive Swagger API Docs**: `http://localhost:8000/docs`

---

## 9. Configuration & Environment Variables

Environment variables are loaded automatically from `.env` and `backend/.env` using `python-dotenv`.

| Variable | Description | Required | Example Placeholder |
| :--- | :--- | :---: | :--- |
| `PORT` | Local HTTP port for FastAPI/Uvicorn server | No (Default: 8000) | `8000` |
| `DATABASE_URL` | PostgreSQL pooler connection string | **Yes** | `postgresql://user:password@host:6543/postgres?sslmode=require` |
| `SUPABASE_URL` | HTTPS endpoint for Supabase project | **Yes** | `https://your-project.supabase.co` |
| `SUPABASE_ANON_KEY` | Public client key for client SDK requests | **Yes** | `eyJhbGciOiJIUzI1Ni...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Admin secret key for backend storage/auth overrides | **Yes** | `eyJhbGciOiJIUzI1Ni...` |
| `JWT_SECRET` | Secret key used to sign and verify ERP session tokens | No (Has fallback) | `ssgmce-erp-super-secure-jwt-secret-key-2026` |
| `GEMINI_API_KEY` | Google Gemini API key for live AI question generation | Optional | `AIzaSy...` (System uses curriculum fallback if omitted) |

> [!CAUTION]
> **Security Notice**: Never commit `.env` files containing real production database passwords or Supabase service-role keys to public Git repositories.

---

## 10. Testing & Verification Suite

The repository includes end-to-end verification suites to ensure database integrity, scoring accuracy, and anti-cheat enforcement.

### Running End-to-End Test Suites

1. **30-Student Randomized Quiz Verification**:
   Validates difficulty ratios, option scrambling, 100% duplicate prevention, reconnection resilience, and analytics exposures across 30 real student accounts:
   ```powershell
   python -u test_randomized_quiz_30_students.py
   ```

2. **Integration Audit & Security Verification**:
   Tests zero-trust token authorization, attendance lock validations, and fee invoice payments:
   ```powershell
   python tests\test_e2e_integration_audit.py
   ```

3. **Academic Results & Ledger Audit**:
   Verifies SGPA/CGPA calculation formulas and backlog tracking:
   ```powershell
   python backend\verify_step8_schema.py
   ```

---

## 11. Security, Zero-Trust Policies & Data Integrity

- **Zero-Trust Identity**: Every API endpoint validates the bearer JWT token, resolves the user role, and blocks Horizontal Privilege Escalation (IDOR).
- **Answer Security**: Correct answers (`is_correct`) and explanations are strictly omitted from student delivery payloads.
- **Snapshot Integrity**: The question subset and shuffled option map for each student attempt are frozen in `quiz_attempt_papers` on initial start, preventing paper-swapping attacks.
- **Client-Side Deterrents**: Right-click blocking, clipboard neutralization, and focus tracking deter casual cheating.

> [!NOTE]
> **Proctoring Disclaimer**: Client-side JavaScript detection of window blur or tab-switching serves as an audit trail and exam deterrent. It cannot physically prevent hardware-level camera capture or secondary device usage.

---

## 12. Known Limitations & Technical Gaps

1. **Browser Security Scope**: Focus-loss detection relies on browser window events (`blur`, `visibilitychange`). OS-level notifications or background windows can occasionally trigger unintended focus loss events.
2. **Offline Local SQLite Redundancy**: While production data persists to Supabase PostgreSQL, local fallback SQLite mirrors do not support full PostgreSQL concurrency under heavy load.
3. **Automated Proctoring Snapshots**: Live webcam proctoring and face detection are currently architected as roadmap features and are not yet enabled in the default runner.

---

## 13. Recommended Future Improvements

- **Webcam & Audio AI Proctoring**: Integration of periodic, privacy-compliant webcam snapshots to detect secondary individuals in the examination room.
- **Dynamic Coding Sandbox**: Execution container for CSE programming questions allowing live code compilation and unit test grading.
- **Biometric Push Notification**: Push alerts delivered directly to the SSGMCE mobile app when attendance falls below the mandatory 75% university threshold.
- **Automated Fee Payment Webhooks**: Integration of live Razorpay/UPI webhooks for real-time fee receipt generation and reconciliation.

---

## 14. Troubleshooting Guide

| Issue / Error | Probable Cause | Recommended Resolution |
| :--- | :--- | :--- |
| `Cannot connect to PostgreSQL server` | Missing or invalid `DATABASE_URL` in `.env` | Verify pooler port is `6543` and password does not contain unescaped characters. |
| `Access Denied: Not enrolled in class` | Student attempted to start a quiz assigned to another class | Ensure student record in `students` table has matching `class_id`. |
| `Maximum Security Warnings Reached` | Student switched tabs or minimized quiz window 5 times | Expected behavior under proctoring rules. Quiz was auto-submitted. |
| `Method Not Allowed (405)` | Incorrect HTTP method or trailing slash on API route | Confirm canonical URL without trailing slashes (e.g. `/api/v1/quizzes`). |
| `FastAPI server failed to start` | Port `8000` is already in use by another process | Terminate the occupying process or set `PORT=8080` in `.env`. |

---

## 15. License & Institutional Attribution

Developed for **Shri Sant Gajanan Maharaj College of Engineering (SSGMCE), Shegaon**  
Department of Computer Science & Engineering (CSE)  
*All institutional rights reserved (2026).*