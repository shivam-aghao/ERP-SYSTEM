# SSGMCE Faculty Attendance ERP - FastAPI & Supabase Backend

High-performance, production-ready backend built with **FastAPI**, **Supabase (PostgreSQL)**, and **SQLAlchemy** for the SSGMCE Faculty Attendance Management System.

---

## 🚀 Features

- **FastAPI Modern Architecture**: Async endpoints, automatic OpenAPI / Swagger documentation (`/docs`), and Pydantic validation.
- **Supabase Cloud Database**: Seamless integration with Supabase client (`supabase-py`) and PostgreSQL with Row-Level Security (RLS) policies.
- **Exact Faculty Attendance Structure**:
  - **Departments**: CSE, IT, ASH, MECH, EE, ENTC
  - **Classes**: 2R1, 2R2, 3R, 4R, 2N1, etc.
  - **Subjects**: CS301, CS302, CS303, CS305, etc.
  - **Students**: Complete student roster (all 69 students including roll 60 Shivam Sanjay Aghao).
  - **Class Cards**: CRUD and duplicate checks for teacher course assignment cards.
  - **Attendance Engine**: Duplicate lecture check, draft auto-save, final submission with automatic attendance percentage and lecture history tracking (`P`/`A` pattern).
  - **Reports & Defaulters**: Instant class stats and list of students below 75% threshold.
  - **JWT Authentication**: Access and refresh token rotation with password hashing.

---

## 🛠️ Quick Start

### 1. Requirements
Ensure Python 3.10+ is installed:
```powershell
python --version
```

### 2. Install Dependencies
```powershell
cd d:\ERP-SYSTEM\faculty_attendence\backend
pip install -r requirements.txt
```

### 3. Run the Server
```powershell
python run.py
```
Or with uvicorn directly:
```powershell
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The server will start at:
- **API Base URL**: `http://localhost:8000/api/v1`
- **Swagger Interactive Docs**: `http://localhost:8000/docs`
- **ReDoc Documentation**: `http://localhost:8000/redoc`

---

## 🗄️ Supabase Setup & Migrations

The database migration SQL files are located in `supabase/migrations/`:
- `0001_init.sql`: Creates all schemas, tables, triggers, views, and RLS policies.
- `0002_seed.sql`: Seeds all departments, classes, subjects, faculty, and student rosters.

### Applying to Your Supabase Project:
1. Go to your [Supabase Dashboard](https://supabase.com/dashboard).
2. Open the **SQL Editor**.
3. Copy and run [`0001_init.sql`](file:///d:/ERP-SYSTEM/faculty_attendence/backend/supabase/migrations/0001_init.sql).
4. Copy and run [`0002_seed.sql`](file:///d:/ERP-SYSTEM/faculty_attendence/backend/supabase/migrations/0002_seed.sql).

---

## 🔑 Default Credentials

- **Faculty Employee Code**: `EMP-CSE-1042`
- **Email**: `rajesh.sharma@ssgmce.ac.in`
- **Password**: `password123`

---

## 📡 API Endpoint Overview

| Module | Method | Endpoint | Description |
|---|---|---|---|
| **Auth** | `POST` | `/api/v1/auth/login` | Login with empCode or email |
| **Auth** | `POST` | `/api/v1/auth/refresh-token` | Renew access token |
| **Auth** | `GET` | `/api/v1/auth/me` | Current teacher info |
| **Profile** | `GET` | `/api/v1/profile` | Teacher profile & stats |
| **Profile** | `GET` | `/api/v1/notifications` | Unread notifications |
| **Master** | `GET` | `/api/v1/master/departments` | All departments |
| **Master** | `GET` | `/api/v1/master/classes` | Classes list (filter by dept) |
| **Master** | `GET` | `/api/v1/master/subjects` | Subjects list (filter by dept/sem) |
| **Cards** | `GET` | `/api/v1/cards` | Teacher's active class cards |
| **Cards** | `POST` | `/api/v1/cards` | Add new class card |
| **Cards** | `GET` | `/api/v1/cards/check-duplicate` | Duplicate card validation |
| **Students** | `GET` | `/api/v1/students/class/{class_id}` | Class roster with last 10 lecture history |
| **Attendance** | `GET` | `/api/v1/attendance/check-duplicate`| Check if lecture already submitted |
| **Attendance** | `POST`| `/api/v1/attendance/draft` | Save temporary draft |
| **Attendance** | `POST`| `/api/v1/attendance/submit` | Final attendance submission |
| **Attendance** | `GET` | `/api/v1/attendance/records` | Past submitted lecture sessions |
| **Reports** | `GET` | `/api/v1/reports/classes/{class_id}/stats` | Class attendance %, defaulters (<75%) |
