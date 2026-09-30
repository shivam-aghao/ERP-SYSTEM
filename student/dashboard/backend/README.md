# SSGMCE Student ERP Dashboard - FastAPI & Supabase Backend

Dedicated, production-ready backend built with **FastAPI**, **Supabase (PostgreSQL)**, and **SQLAlchemy** for the SSGMCE Student ERP Dashboard.

---

## 🚀 Features

- **FastAPI Modern Architecture**: High-speed async endpoints, Swagger UI (`/docs`), and full Pydantic validation.
- **Supabase Cloud Database**: Integrates directly with Supabase Cloud (`https://szymhbmrupktrboduvlw.supabase.co`) and maps to `public.student_documents`.
- **All Student Modules Supported**:
  1. **Timetable**: Today's live period tracker, full Monday–Saturday schedule.
  2. **Attendance**: 82% overall rate, 5 engineering subjects breakdown with <75% critical alert on Computer Networks.
  3. **Syllabus**: Subjects, credits, faculty details, and SGBAU curriculum links.
  4. **Fees**: Fee structure breakdown, online payment gateway integration, downloadable receipts.
  5. **E-Learning**: Assignments submission, unit-wise notes/PPTs/videos, and quizzes.
  6. **Change Information**: Form submission for Name, Caste, Ward status, and Personal Photo.
  7. **Updation Information**: AICTE 100 activity points portfolio (Industrial Visits, Seminars, Workshops).
  8. **D-Wallet**: Verified document repository (Aadhaar, HSC marksheets, CAP allotment) matching Supabase.
  9. **Examination**: CIE internal tests (30M), SGBAU grade cards, revaluation application submission.
  10. **Notifications**: Academic alerts, exam schedules, and circulars.

---

## 🛠️ Quick Start

### 1. Run the Server
Using Python:
```powershell
cd d:\ERP-SYSTEM\Student_dashbord\backend
python run.py
```
Or double-click:
[`Student_dashbord\backend\run.bat`](file:///d:/ERP-SYSTEM/Student_dashbord/backend/run.bat)

### 2. Access the APIs
- **Interactive Swagger Docs**: [http://localhost:8001/docs](http://localhost:8001/docs)
- **ReDoc Documentation**: [http://localhost:8001/redoc](http://localhost:8001/redoc)
- **API Base URL**: `http://localhost:8001/api/v1/student`

---

## 📡 Endpoints Table

| Module | Method | Endpoint | Description |
|---|---|---|---|
| **Profile** | `GET` | `/api/v1/student/profile` | Student info (Shivam Sanjay Aghao, 308637) |
| **Timetable** | `GET` | `/api/v1/student/timetable` | Monday–Saturday schedule and live periods |
| **Attendance**| `GET` | `/api/v1/student/attendance`| Subject breakdown, eligibility calculator |
| **Syllabus** | `GET` | `/api/v1/student/syllabus` | Subjects, syllabus progress, faculty info |
| **Fees** | `GET` | `/api/v1/student/fees` | Fee summary and receipts |
| **Fees** | `POST` | `/api/v1/student/fees/pay` | Initiate online fee payment |
| **E-Learning** | `GET` | `/api/v1/student/elearning` | Assignments, study materials, quizzes |
| **Change Info**| `GET` | `/api/v1/student/change-info` | Track submitted change requests |
| **Change Info**| `POST`| `/api/v1/student/change-info` | Submit new change request to Dean Office |
| **Updation** | `GET` | `/api/v1/student/update-info` | Extracurricular and AICTE activity points |
| **Updation** | `POST`| `/api/v1/student/update-info` | Submit new activity certificate |
| **D-Wallet** | `GET` | `/api/v1/student/dwallet` | Verified documents (matches Supabase) |
| **D-Wallet** | `POST`| `/api/v1/student/dwallet/upload` | Upload new document to D-Vault |
| **Exam** | `GET` | `/api/v1/student/examination` | CIE marks, SGBAU grades, backlog status |
| **Exam** | `POST`| `/api/v1/student/examination/revaluation` | Apply for revaluation / photocopy |
| **Notifs** | `GET` | `/api/v1/student/notifications` | Student alerts and announcements |
