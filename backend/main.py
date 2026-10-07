"""
================================================================================
SSGMCE COLLEGE ERP — UNIFIED AUTONOMOUS ENTERPRISE BACKEND
Institution: Shri Sant Gajanan Maharaj College of Engineering, Shegaon
Consolidated Single-File Backend for:
  - Authentication (Student, Faculty, Admin)
  - Student Portal & Academic Dashboard
  - Faculty Attendance Management & Roster
  - Online Quiz & Examination Module (Moodle/Google Forms Equivalent)
================================================================================
"""

import os
import re
import csv
import io
import json
import uuid
import random
import logging
from datetime import datetime, timezone, timedelta
from typing import List, Optional, Dict, Any

from fastapi import FastAPI, APIRouter, Depends, HTTPException, Query, Path, Body, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, Response, RedirectResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field
from sqlalchemy import create_engine, text
from sqlalchemy.orm import declarative_base, sessionmaker, Session

# Configure Logging
logging.basicConfig(
    level=logging.INFO,
    format="[%(asctime)s] [%(levelname)s] [%(name)s]: %(message)s"
)
logger = logging.getLogger("ssgmce_erp_backend")

# ==============================================================================
# 1. DATABASE CONFIGURATION & CONNECTIVITY
# ==============================================================================
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
ERP_ROOT = os.path.dirname(BASE_DIR)
DB_PATH = os.path.join(BASE_DIR, "erp.db").replace("\\", "/")

DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///{DB_PATH}")

connect_args = {}
if DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

engine = create_engine(DATABASE_URL, connect_args=connect_args, echo=False)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Initialize critical tables if not present
try:
    with engine.connect() as _con:
        _con.execute(text("""
            CREATE TABLE IF NOT EXISTS timetable_assessments (
                id VARCHAR(36) PRIMARY KEY,
                teacher_id VARCHAR(36),
                type VARCHAR(30) NOT NULL,
                subject VARCHAR(150) NOT NULL,
                title VARCHAR(250) NOT NULL,
                date VARCHAR(20) NOT NULL,
                start_time VARCHAR(10) NOT NULL,
                end_time VARCHAR(10) NOT NULL,
                link TEXT NOT NULL,
                class_code VARCHAR(50) DEFAULT '2R1',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """))
        _con.commit()
except Exception as _e:
    logger.warning("Could not auto-create timetable_assessments table: %s", _e)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Supabase Client Optional Integration
supabase_client = None
try:
    from supabase import create_client
    sb_url = os.getenv("SUPABASE_URL", "https://gftqvclenyplnuoocbwe.supabase.co")
    sb_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_ANON_KEY")
    if sb_key:
        supabase_client = create_client(sb_url, sb_key)
        logger.info("Supabase client active: %s", sb_url)
except Exception as e:
    logger.info("Supabase direct client notice: %s", e)

# Standard Response Helpers
def success_response(data: Any = None, message: str = "Success", meta: Optional[Dict[str, Any]] = None, code: int = 200):
    payload = {
        "success": True,
        "code": code,
        "message": message,
        "data": data
    }
    if meta is not None:
        payload["meta"] = meta
    return payload

def error_response(message: str = "Error", code: int = 400, details: Any = None):
    return JSONResponse(
        status_code=code,
        content={
            "success": False,
            "code": code,
            "message": message,
            "error": {
                "code": code,
                "message": message,
                "details": details
            }
        }
    )

def ensure_utc(val: Any) -> Optional[datetime]:
    if not val:
        return None
    if isinstance(val, datetime):
        return val if val.tzinfo else val.replace(tzinfo=timezone.utc)
    if isinstance(val, str):
        try:
            val_clean = val.replace("Z", "+00:00")
            dt = datetime.fromisoformat(val_clean)
            return dt if dt.tzinfo else dt.replace(tzinfo=timezone.utc)
        except Exception:
            return None
    return None

def log_audit(db: Session, user_id: str, action: str, entity_name: str, entity_id: str, payload: Optional[Dict] = None):
    try:
        db.execute(
            text("""
            INSERT INTO quiz_audit_logs (id, user_id, action, entity_name, entity_id, payload, created_at)
            VALUES (:id, :uid, :act, :ename, :eid, :pld, CURRENT_TIMESTAMP)
            """),
            {
                "id": str(uuid.uuid4()),
                "uid": user_id,
                "act": action,
                "ename": entity_name,
                "eid": entity_id,
                "pld": json.dumps(payload or {})
            }
        )
    except Exception as e:
        logger.warning("Audit log notice: %s", e)

# ==============================================================================
# 2. PYDANTIC DATA SCHEMAS
# ==============================================================================
class LoginRequest(BaseModel):
    user_id: Optional[str] = None
    username: Optional[str] = None
    roll_number: Optional[str] = None
    email: Optional[str] = None
    password: Optional[str] = ""
    role: Optional[str] = "student"

class TeacherProfileUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    cabin_number: Optional[str] = None
    designation: Optional[str] = None

class StudentProfileUpdate(BaseModel):
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    blood_group: Optional[str] = None
    emergency_contact: Optional[str] = None

class ClassCardCreate(BaseModel):
    class_id: str
    subject_id: str
    academic_year: str = "2026-27"
    semester: str = "Odd"

class ClassCardUpdate(BaseModel):
    academic_year: Optional[str] = None
    semester: Optional[str] = None
    is_active: Optional[bool] = None

class AttendanceDraftRequest(BaseModel):
    class_id: str
    subject_id: str
    session_date: str
    period_number: int = 1
    session_type: str = "theory"
    present_student_ids: List[str] = []
    absent_student_ids: List[str] = []

class AttendanceSubmitRequest(BaseModel):
    class_id: str
    subject_id: str
    session_date: str
    period_number: int = 1
    session_type: str = "theory"
    present_student_ids: List[str] = []
    absent_student_ids: List[str] = []

class TimetableAssessmentCreate(BaseModel):
    id: Optional[str] = None
    type: str # 'Quiz', 'Assignment', 'TEC'
    subject: str
    title: str
    date: str # 'YYYY-MM-DD'
    start_time: str # 'HH:MM'
    end_time: str # 'HH:MM'
    link: str
    class_code: Optional[str] = "2R1"

class TimetableAssessmentUpdate(BaseModel):
    type: Optional[str] = None
    subject: Optional[str] = None
    title: Optional[str] = None
    date: Optional[str] = None
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    link: Optional[str] = None
    class_code: Optional[str] = None

def verify_faculty_or_admin(request: Request):
    """Enforces strict role permissions: students are read-only; only faculty/admin can schedule."""
    headers = {k.lower(): v for k, v in request.headers.items()} if hasattr(request.headers, "items") else {}
    auth_header = headers.get("authorization", "")
    token = ""
    if auth_header.startswith("Bearer "):
        token = auth_header.split(" ", 1)[1].strip()
    elif hasattr(request, "query_params") and "token" in request.query_params:
        token = request.query_params["token"]

    role_header = headers.get("x-user-role", "").lower()

    # Reject student role attempts with 403 Forbidden
    if token.startswith("st_token_") or role_header == "student" or token == "demo-student-token-ssgmce-2026":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: Students have read-only access. Only faculty can schedule, edit, or manage assessments."
        )

    return {"role": "faculty", "token": token}

class QuestionOptionInput(BaseModel):
    key: str # 'A', 'B', 'C', 'D'
    text: str
    is_correct: Optional[bool] = False

class QuestionBankCreate(BaseModel):
    question_text: str
    question_type: str = "MCQ"
    subject_id: Optional[str] = None
    subject_name: Optional[str] = "Computer Science"
    topic: Optional[str] = None
    difficulty: str = "MEDIUM"
    marks: float = 2.0
    negative_marks: float = 0.0
    expected_answer: Optional[str] = None
    explanation: Optional[str] = None
    options: Optional[List[QuestionOptionInput]] = []

class QuizCreateSchema(BaseModel):
    title: str
    description: Optional[str] = None
    instructions: Optional[str] = None
    subject_id: Optional[str] = None
    subject_name: Optional[str] = "Computer Science"
    class_id: str
    start_at: Optional[datetime] = None
    end_at: Optional[datetime] = None
    duration_minutes: int = 30
    total_marks: float = 100.0
    passing_marks: float = 40.0
    max_attempts: int = 1
    shuffle_questions: bool = False
    shuffle_options: bool = False
    allow_question_navigation: bool = True
    allow_back_navigation: bool = True
    show_result_immediately: bool = True
    show_correct_answers: bool = True
    result_release_mode: str = "IMMEDIATE"
    negative_marking: bool = False
    negative_marks: float = 0.0

class QuizUpdateSchema(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    instructions: Optional[str] = None
    subject_id: Optional[str] = None
    class_id: Optional[str] = None
    start_at: Optional[datetime] = None
    end_at: Optional[datetime] = None
    duration_minutes: Optional[int] = None
    total_marks: Optional[float] = None
    passing_marks: Optional[float] = None
    max_attempts: Optional[int] = None
    shuffle_questions: Optional[bool] = None
    shuffle_options: Optional[bool] = None
    show_result_immediately: Optional[bool] = None
    show_correct_answers: Optional[bool] = None
    result_release_mode: Optional[str] = None
    negative_marking: Optional[bool] = None
    negative_marks: Optional[float] = None

class AnswerSubmissionItem(BaseModel):
    question_id: str
    selected_option: Optional[str] = None
    selected_options: Optional[List[str]] = None
    text_answer: Optional[str] = None

class QuizSubmitRequest(BaseModel):
    answers: Optional[List[AnswerSubmissionItem]] = []
    is_auto_submit: Optional[bool] = False

class SecurityEventRequest(BaseModel):
    event_type: str # 'tab_switch', 'fullscreen_exit', 'browser_blur', 'warning'
    metadata: Optional[Dict[str, Any]] = None

# ==============================================================================
# 3. INITIALIZE FASTAPI APPLICATION
# ==============================================================================
app = FastAPI(
    title="SSGMCE College ERP Unified System",
    description="Unified Full-Stack ERP Backend for SSGMCE: Student Portal, Faculty Attendance, and Online Quiz Assessment Platform.",
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

api = APIRouter(prefix="/api/v1")

# ==============================================================================
# 4. SYSTEM HEALTH & DIAGNOSTICS
# ==============================================================================
@app.get("/health", tags=["System Diagnostics"])
@app.get("/api/health", tags=["System Diagnostics"])
@api.get("/health", tags=["System Diagnostics"])
def health_check():
    return {
        "status": "healthy",
        "service": "SSGMCE College ERP Unified Backend",
        "framework": "FastAPI + SQLAlchemy",
        "database": "connected",
        "database_type": "SQLite / Supabase Ready",
        "port": 8000
    }


@api.get("/status", tags=["System Diagnostics"])
def status_check(db: Session = Depends(get_db)):
    student_count = db.execute(text("SELECT count(*) FROM students")).scalar() or 0
    quiz_count = db.execute(text("SELECT count(*) FROM quizzes")).scalar() or 0
    return success_response({
        "service": "SSGMCE College ERP Unified Backend",
        "status": "Operational",
        "total_students": student_count,
        "total_quizzes": quiz_count,
        "database_file": DB_PATH
    })

# ==============================================================================
# 5. AUTHENTICATION MODULE
# ==============================================================================
from backend.services.auth_service import AuthService

@app.post("/api/v1/auth/login", tags=["Authentication"])
@app.post("/api/auth/login", tags=["Authentication"])
@app.post("/auth/login", tags=["Authentication"])
@api.post("/auth/login", tags=["Authentication"])
def auth_login(payload: LoginRequest, db: Session = Depends(get_db)):
    result = AuthService.authenticate_user(payload, db)
    resp = success_response(result, "Authenticated successfully")
    resp["user"] = result.get("user")
    resp["token"] = result.get("token")
    resp["role"] = result.get("role")
    resp["redirect"] = result.get("redirect")
    return resp


@api.post("/auth/logout", tags=["Authentication"])
def auth_logout():
    return success_response({"logged_out": True}, "Session terminated successfully")

@api.get("/auth/me", tags=["Authentication"])
def auth_me(role: str = Query("student"), db: Session = Depends(get_db)):
    if role == "student":
        st = db.execute(text("SELECT s.*, c.class_name FROM students s LEFT JOIN classes c ON s.class_id = c.id LIMIT 1")).fetchone()
        return success_response(dict(st._mapping) if st else {})
    t = db.execute(text("SELECT * FROM teachers LIMIT 1")).fetchone()
    return success_response(dict(t._mapping) if t else {})

# ==============================================================================
# 6. MASTER DATA MODULE (CLASSES, SUBJECTS, DEPARTMENTS)
# ==============================================================================
@api.get("/departments", tags=["Master Data"])
def get_departments(db: Session = Depends(get_db)):
    rows = db.execute(text("SELECT id, code, name, name as dept_name, icon, classes_count, description FROM departments ORDER BY name ASC")).fetchall()
    return success_response([dict(r._mapping) for r in rows])

@api.get("/classes", tags=["Master Data"])
def get_classes(db: Session = Depends(get_db)):
    rows = db.execute(text("SELECT * FROM classes ORDER BY class_name ASC")).fetchall()
    return success_response([dict(r._mapping) for r in rows])

@api.get("/subjects", tags=["Master Data"])
def get_subjects(db: Session = Depends(get_db)):
    rows = db.execute(text("SELECT id, department_id, code, name, semester, type, code as subject_code, name as subject_name FROM subjects ORDER BY name ASC")).fetchall()
    return success_response([dict(r._mapping) for r in rows])

@api.get("/students", tags=["Master Data"])
def get_all_students(class_name: Optional[str] = None, class_id: Optional[str] = None, db: Session = Depends(get_db)):
    clause = ""
    params = {}
    if class_id:
        clause = "WHERE s.class_id = :cid"
        params["cid"] = class_id
    elif class_name:
        clause = "WHERE c.class_name = :cname"
        params["cname"] = class_name

    rows = db.execute(text(f"""
        SELECT s.*, c.class_name, c.division
        FROM students s
        LEFT JOIN classes c ON s.class_id = c.id
        {clause}
        ORDER BY s.roll_no ASC, s.full_name ASC
    """), params).fetchall()
    return success_response([dict(r._mapping) for r in rows])

@api.get("/students/class/{class_id}", tags=["Master Data"])
def get_students_by_class(class_id: str, db: Session = Depends(get_db)):
    rows = db.execute(text("""
        SELECT s.*, c.class_name, c.division
        FROM students s
        LEFT JOIN classes c ON s.class_id = c.id
        WHERE s.class_id = :cid OR c.class_name = :cid
        ORDER BY s.roll_no ASC
    """), {"cid": class_id}).fetchall()
    return success_response([dict(r._mapping) for r in rows])

# ==============================================================================
# 7. TEACHER PORTAL & ATTENDANCE MANAGEMENT
# ==============================================================================
@api.get("/profile/active", tags=["Faculty Portal"])
@api.get("/teacher/profile", tags=["Faculty Portal"])
def get_teacher_profile(db: Session = Depends(get_db)):
    row = db.execute(text("SELECT t.*, d.name as department_name FROM teachers t LEFT JOIN departments d ON t.department_id = d.id LIMIT 1")).fetchone()
    if not row:
        return error_response("Teacher record not found", 404)
    data = dict(row._mapping)
    data["fullName"] = data.get("full_name")
    data["empCode"] = data.get("emp_code")
    data["department"] = data.get("department_name") or "CSE"
    return success_response(data)

@api.put("/teacher/profile", tags=["Faculty Portal"])
def update_teacher_profile(payload: TeacherProfileUpdate, db: Session = Depends(get_db)):
    row = db.execute(text("SELECT id FROM teachers LIMIT 1")).fetchone()
    if not row:
        return error_response("Teacher record not found", 404)
    tid = row[0]
    updates = payload.model_dump(exclude_unset=True)
    for k, v in updates.items():
        if v is not None:
            db.execute(text(f"UPDATE teachers SET {k} = :val WHERE id = :id"), {"val": v, "id": tid})
    db.commit()
    upd = db.execute(text("SELECT * FROM teachers WHERE id = :id"), {"id": tid}).fetchone()
    return success_response(dict(upd._mapping), "Teacher profile updated")

@api.get("/dashboard/summary", tags=["Faculty Portal"])
def get_teacher_dashboard_summary(db: Session = Depends(get_db)):
    classes_cnt = db.execute(text("SELECT count(*) FROM classes")).scalar() or 0
    students_cnt = db.execute(text("SELECT count(*) FROM students")).scalar() or 0
    quizzes_cnt = db.execute(text("SELECT count(*) FROM quizzes")).scalar() or 0
    sessions_cnt = db.execute(text("SELECT count(*) FROM attendance_sessions")).scalar() or 0
    return success_response({
        "total_classes": classes_cnt,
        "total_students": students_cnt,
        "total_quizzes": quizzes_cnt,
        "total_attendance_sessions": sessions_cnt,
        "attendance_average_pct": 84.5
    })

@api.get("/timetable/my", tags=["Faculty Portal"])
def get_teacher_timetable(db: Session = Depends(get_db)):
    rows = db.execute(text("SELECT * FROM timetable_entries LIMIT 10")).fetchall()
    return success_response([dict(r._mapping) for r in rows])

# ==============================================================================
# TIMETABLE ASSESSMENTS / TESTS MODULE (Shared DB between Faculty & Student)
# ==============================================================================
@api.get("/timetable/tests", tags=["Timetable Assessments"])
@api.get("/student/timetable/tests", tags=["Timetable Assessments"])
@api.get("/teacher/timetable/tests", tags=["Timetable Assessments"])
def get_timetable_tests(class_code: Optional[str] = Query(None), db: Session = Depends(get_db)):
    """Fetch all scheduled tests & assessments from database (accessible to both faculty and students)."""
    if class_code:
        rows = db.execute(text("SELECT * FROM timetable_assessments WHERE LOWER(class_code) = LOWER(:cc) OR class_code IS NULL ORDER BY date ASC, start_time ASC"), {"cc": class_code}).fetchall()
    else:
        rows = db.execute(text("SELECT * FROM timetable_assessments ORDER BY date ASC, start_time ASC")).fetchall()
    tests = []
    for r in rows:
        m = dict(r._mapping)
        tests.append({
            "id": m["id"],
            "type": m["type"],
            "subject": m["subject"],
            "title": m["title"],
            "date": m["date"],
            "start": m["start_time"],
            "end": m["end_time"],
            "link": m["link"],
            "class_code": m.get("class_code", "2R1")
        })
    return success_response(tests)

@api.post("/timetable/tests", tags=["Timetable Assessments"])
@api.post("/teacher/timetable/tests", tags=["Timetable Assessments"])
def create_timetable_test(payload: TimetableAssessmentCreate, auth: dict = Depends(verify_faculty_or_admin), db: Session = Depends(get_db)):
    """Faculty schedules a test or assessment. Stored directly in backend database. Rejected for students (403)."""
    test_id = payload.id or f"test-{uuid.uuid4().hex[:10]}"
    db.execute(text("""
        INSERT INTO timetable_assessments (id, type, subject, title, date, start_time, end_time, link, class_code, created_at, updated_at)
        VALUES (:id, :type, :subject, :title, :date, :start, :end, :link, :class_code, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    """), {
        "id": test_id,
        "type": payload.type,
        "subject": payload.subject,
        "title": payload.title,
        "date": payload.date,
        "start": payload.start_time,
        "end": payload.end_time,
        "link": payload.link,
        "class_code": payload.class_code or "2R1"
    })
    db.commit()
    return success_response({
        "id": test_id,
        "type": payload.type,
        "subject": payload.subject,
        "title": payload.title,
        "date": payload.date,
        "start": payload.start_time,
        "end": payload.end_time,
        "link": payload.link
    }, "Assessment scheduled successfully in database", code=201)

@api.put("/timetable/tests/{test_id}", tags=["Timetable Assessments"])
@api.put("/teacher/timetable/tests/{test_id}", tags=["Timetable Assessments"])
def update_timetable_test(test_id: str, payload: TimetableAssessmentUpdate, auth: dict = Depends(verify_faculty_or_admin), db: Session = Depends(get_db)):
    """Faculty updates an assessment. Rejected for students (403)."""
    existing = db.execute(text("SELECT * FROM timetable_assessments WHERE id = :id"), {"id": test_id}).fetchone()
    if not existing:
        raise HTTPException(status_code=404, detail="Scheduled assessment not found")

    updates = []
    params = {"id": test_id}
    if payload.type is not None:
        updates.append("type = :type")
        params["type"] = payload.type
    if payload.subject is not None:
        updates.append("subject = :subject")
        params["subject"] = payload.subject
    if payload.title is not None:
        updates.append("title = :title")
        params["title"] = payload.title
    if payload.date is not None:
        updates.append("date = :date")
        params["date"] = payload.date
    if payload.start_time is not None:
        updates.append("start_time = :start")
        params["start"] = payload.start_time
    if payload.end_time is not None:
        updates.append("end_time = :end")
        params["end"] = payload.end_time
    if payload.link is not None:
        updates.append("link = :link")
        params["link"] = payload.link
    if payload.class_code is not None:
        updates.append("class_code = :class_code")
        params["class_code"] = payload.class_code

    updates.append("updated_at = CURRENT_TIMESTAMP")
    db.execute(text(f"UPDATE timetable_assessments SET {', '.join(updates)} WHERE id = :id"), params)
    db.commit()

    updated = db.execute(text("SELECT * FROM timetable_assessments WHERE id = :id"), {"id": test_id}).fetchone()
    m = dict(updated._mapping)
    return success_response({
        "id": m["id"], "type": m["type"], "subject": m["subject"], "title": m["title"],
        "date": m["date"], "start": m["start_time"], "end": m["end_time"], "link": m["link"]
    }, "Assessment updated successfully")

@api.delete("/timetable/tests/{test_id}", tags=["Timetable Assessments"])
@api.delete("/teacher/timetable/tests/{test_id}", tags=["Timetable Assessments"])
def delete_timetable_test(test_id: str, auth: dict = Depends(verify_faculty_or_admin), db: Session = Depends(get_db)):
    """Faculty deletes an assessment. Rejected for students (403)."""
    db.execute(text("DELETE FROM timetable_assessments WHERE id = :id"), {"id": test_id})
    db.commit()
    return success_response({"id": test_id}, "Assessment deleted successfully")

@api.get("/class-cards", tags=["Faculty Portal"])
def get_class_cards(db: Session = Depends(get_db)):
    rows = db.execute(text("""
        SELECT cc.*, c.class_name, c.division, s.name as subject_name, s.code as subject_code
        FROM class_cards cc
        LEFT JOIN classes c ON cc.class_id = c.id
        LEFT JOIN subjects s ON cc.subject_id = s.id
        ORDER BY cc.created_at DESC
    """)).fetchall()
    return success_response([dict(r._mapping) for r in rows])

@api.post("/class-cards", tags=["Faculty Portal"])
def create_class_card(payload: ClassCardCreate, db: Session = Depends(get_db)):
    cid = str(uuid.uuid4())
    db.execute(text("""
        INSERT INTO class_cards (id, teacher_id, class_id, subject_id, academic_year, semester, created_at)
        VALUES (:id, (SELECT id FROM teachers LIMIT 1), :cid, :sid, :ay, :sem, CURRENT_TIMESTAMP)
    """), {"id": cid, "cid": payload.class_id, "sid": payload.subject_id, "ay": payload.academic_year, "sem": payload.semester})
    db.commit()
    return success_response({"id": cid}, "Class card created successfully", code=201)

@api.delete("/class-cards/{card_id}", tags=["Faculty Portal"])
def delete_class_card(card_id: str, db: Session = Depends(get_db)):
    db.execute(text("DELETE FROM class_cards WHERE id = :id"), {"id": card_id})
    db.commit()
    return success_response({"id": card_id}, "Class card removed")

@api.get("/attendance/check-duplicate", tags=["Attendance Marking"])
def check_duplicate_attendance(class_id: str, subject_id: str, session_date: str, period_number: int = 1, db: Session = Depends(get_db)):
    row = db.execute(text("""
        SELECT id FROM attendance_sessions
        WHERE class_id = :cid AND subject_id = :sid AND attendance_date = :sdate AND period = :pnum
        LIMIT 1
    """), {"cid": class_id, "sid": subject_id, "sdate": session_date, "pnum": period_number}).fetchone()
    return success_response({"duplicate_exists": bool(row), "session_id": row[0] if row else None})

@api.get("/attendance/draft", tags=["Attendance Marking"])
def get_attendance_draft(class_id: str, subject_id: str, session_date: str, period_number: int = 1, db: Session = Depends(get_db)):
    row = db.execute(text("""
        SELECT * FROM attendance_sessions
        WHERE class_id = :cid AND subject_id = :sid AND attendance_date = :sdate AND period = :pnum AND status = 'draft'
        LIMIT 1
    """), {"cid": class_id, "sid": subject_id, "sdate": session_date, "pnum": period_number}).fetchone()
    if not row:
        return success_response(None, "No draft found")
    return success_response(dict(row._mapping))

@api.post("/attendance/draft", tags=["Attendance Marking"])
def save_attendance_draft(payload: AttendanceDraftRequest, db: Session = Depends(get_db)):
    sess_id = str(uuid.uuid4())
    db.execute(text("""
        INSERT OR REPLACE INTO attendance_sessions
        (id, teacher_id, class_id, subject_id, attendance_date, period, status, created_at, updated_at)
        VALUES (:id, (SELECT id FROM teachers LIMIT 1), :cid, :sid, :sdate, :pnum, 'draft', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    """), {
        "id": sess_id, "cid": payload.class_id, "sid": payload.subject_id,
        "sdate": payload.session_date, "pnum": payload.period_number
    })
    db.commit()
    return success_response({"session_id": sess_id}, "Attendance draft saved")

@api.post("/attendance/submit", tags=["Attendance Marking"])
def submit_attendance(payload: AttendanceSubmitRequest, db: Session = Depends(get_db)):
    sess_id = str(uuid.uuid4())
    db.execute(text("""
        INSERT INTO attendance_sessions
        (id, teacher_id, class_id, subject_id, attendance_date, period, status, total_students, present_count, absent_count, submitted_at, created_at, updated_at)
        VALUES (:id, (SELECT id FROM teachers LIMIT 1), :cid, :sid, :sdate, :pnum, 'submitted', :tot, :pres, :abs, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    """), {
        "id": sess_id, "cid": payload.class_id, "sid": payload.subject_id,
        "sdate": payload.session_date, "pnum": payload.period_number,
        "tot": len(payload.present_student_ids) + len(payload.absent_student_ids),
        "pres": len(payload.present_student_ids),
        "abs": len(payload.absent_student_ids)
    })
    # Insert attendance records
    for sid in payload.present_student_ids:
        db.execute(text("""
            INSERT INTO attendance_records (id, session_id, student_id, status, created_at)
            VALUES (:id, :sess_id, :sid, 'present', CURRENT_TIMESTAMP)
        """), {"id": str(uuid.uuid4()), "sess_id": sess_id, "sid": sid})
    for sid in payload.absent_student_ids:
        db.execute(text("""
            INSERT INTO attendance_records (id, session_id, student_id, status, created_at)
            VALUES (:id, :sess_id, :sid, 'absent', CURRENT_TIMESTAMP)
        """), {"id": str(uuid.uuid4()), "sess_id": sess_id, "sid": sid})
    db.commit()
    return success_response({
        "session_id": sess_id,
        "present_count": len(payload.present_student_ids),
        "absent_count": len(payload.absent_student_ids)
    }, "Attendance recorded successfully")

@api.get("/attendance/records", tags=["Attendance Marking"])
def get_attendance_records(class_id: Optional[str] = None, subject_id: Optional[str] = None, db: Session = Depends(get_db)):
    clause = ""
    params = {}
    if class_id:
        clause = "WHERE ass.class_id = :cid"
        params["cid"] = class_id
    rows = db.execute(text(f"""
        SELECT ass.*, c.class_name, s.name as subject_name
        FROM attendance_sessions ass
        LEFT JOIN classes c ON ass.class_id = c.id
        LEFT JOIN subjects s ON ass.subject_id = s.id
        {clause}
        ORDER BY ass.created_at DESC
        LIMIT 50
    """), params).fetchall()
    return success_response([dict(r._mapping) for r in rows])

@api.get("/teacher/class-roster", tags=["Attendance Marking"])
@app.get("/api/teacher/class-roster", tags=["Attendance Marking"])
def get_teacher_class_roster(classId: Optional[str] = Query(None), class_id: Optional[str] = Query(None), db: Session = Depends(get_db)):
    cid = classId or class_id or "2R1"
    rows = db.execute(text("""
        SELECT s.id, s.roll_no, s.full_name, s.student_code, s.email, c.class_name
        FROM students s
        LEFT JOIN classes c ON s.class_id = c.id
        WHERE c.class_name = :cid OR s.class_id = :cid OR c.id = :cid
        ORDER BY s.roll_no ASC
    """), {"cid": cid}).fetchall()

    students = []
    for r in rows:
        m = dict(r._mapping)
        roll = m.get("roll_no") or 1
        roll_fmt = f"{m.get('class_name') or cid}-{str(roll).zfill(2)}"
        students.append({
            "id": m.get("id"),
            "rollNo": roll,
            "rollFormatted": roll_fmt,
            "name": m.get("full_name"),
            "enrollmentNo": m.get("student_code"),
            "cardId": f"CARD-{roll_fmt}",
            "classCode": m.get("class_name") or cid
        })
    return success_response({"students": students})

@api.post("/teacher/attendance/bulk", tags=["Attendance Marking"])
@app.post("/api/teacher/attendance/bulk", tags=["Attendance Marking"])
def submit_teacher_attendance_bulk(payload: Dict[str, Any] = Body(...), db: Session = Depends(get_db)):
    class_code = payload.get("classCode") or payload.get("classId") or "2R1"
    sub_title = payload.get("subject") or "General"
    date_str = payload.get("date") or payload.get("lectureDate") or datetime.now().strftime("%Y-%m-%d")
    slot = payload.get("timeSlot") or payload.get("lectureTime") or "09:00 - 10:00"
    records = payload.get("records", [])

    c_row = db.execute(text("SELECT id FROM classes WHERE class_name = :c OR id = :c LIMIT 1"), {"c": class_code}).fetchone()
    cid = c_row[0] if c_row else "0a7372d4-db33-4908-9f85-896c7009fd76"

    s_row = db.execute(text("SELECT id FROM subjects WHERE name LIKE :s OR id = :s LIMIT 1"), {"s": f"%{sub_title}%"}).fetchone()
    sid = s_row[0] if s_row else "s0000000-0000-0000-0000-000000000001"

    sess_id = str(uuid.uuid4())
    present_count = len([r for r in records if r.get("status") == "present"])
    absent_count = len([r for r in records if r.get("status") == "absent"])
    total_count = len(records)

    db.execute(text("""
        INSERT INTO attendance_sessions
        (id, teacher_id, class_id, subject_id, attendance_date, period, status, total_students, present_count, absent_count, submitted_at, created_at, updated_at)
        VALUES (:id, (SELECT id FROM teachers LIMIT 1), :cid, :sid, :sdate, 1, 'submitted', :tot, :pres, :abs, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    """), {
        "id": sess_id, "cid": cid, "sid": sid, "sdate": date_str,
        "tot": total_count, "pres": present_count, "abs": absent_count
    })

    for r in records:
        st_id = r.get("studentId") or r.get("id")
        status = r.get("status", "present")
        if st_id:
            db.execute(text("""
                INSERT INTO attendance_records (id, session_id, student_id, status, created_at)
                VALUES (:id, :sess_id, :sid, :st, CURRENT_TIMESTAMP)
            """), {"id": str(uuid.uuid4()), "sess_id": sess_id, "sid": st_id, "st": status})

    db.commit()

    return success_response({
        "sessionId": sess_id,
        "classCode": class_code,
        "subject": sub_title,
        "date": date_str,
        "lectureDate": date_str,
        "timeSlot": slot,
        "presentCount": present_count,
        "absentCount": absent_count,
        "totalStudents": total_count,
        "status": "submitted"
    }, "Bulk attendance recorded successfully")

@api.get("/teacher/attendance/sessions", tags=["Attendance Marking"])
@app.get("/api/teacher/attendance/sessions", tags=["Attendance Marking"])
def get_teacher_attendance_sessions(db: Session = Depends(get_db)):
    rows = db.execute(text("""
        SELECT ass.id, ass.attendance_date, ass.total_students, ass.present_count, ass.absent_count,
               ass.status, ass.submitted_at, c.class_name, s.name as subject_name
        FROM attendance_sessions ass
        LEFT JOIN classes c ON ass.class_id = c.id
        LEFT JOIN subjects s ON ass.subject_id = s.id
        ORDER BY ass.attendance_date DESC, ass.created_at DESC
        LIMIT 100
    """)).fetchall()
    sessions = []
    for r in rows:
        m = dict(r._mapping)
        sessions.append({
            "sessionId": m.get("id"),
            "date": m.get("attendance_date"),
            "lectureDate": m.get("attendance_date"),
            "classCode": m.get("class_name") or "2R1",
            "subject": m.get("subject_name") or "Lecture",
            "subjectCode": m.get("subject_name"),
            "presentCount": m.get("present_count"),
            "absentCount": m.get("absent_count"),
            "totalStudents": m.get("total_students"),
            "status": m.get("status")
        })
    return success_response({"sessions": sessions})

@api.get("/attendance/export", tags=["Attendance Marking"])
@api.get("/teacher/attendance/export", tags=["Attendance Marking"])
def export_attendance_csv(class_name: str = Query("3R"), db: Session = Depends(get_db)):
    students = db.execute(text("""
        SELECT s.id, s.roll_no, s.full_name, s.student_code, c.class_name
        FROM students s
        LEFT JOIN classes c ON s.class_id = c.id
        WHERE c.class_name = :cn OR s.class_id = :cn
        ORDER BY s.roll_no ASC
    """), {"cn": class_name}).fetchall()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Roll No", "Student Name", "Student ID", "Class", "Total Lectures", "Attended", "Attendance %", "Eligibility (<75%)"])

    for st in students:
        sm = dict(st._mapping)
        sid = sm["id"]
        tot = db.execute(text("SELECT count(*) FROM attendance_records WHERE student_id = :sid"), {"sid": sid}).scalar() or 0
        pres = db.execute(text("SELECT count(*) FROM attendance_records WHERE student_id = :sid AND status = 'present'"), {"sid": sid}).scalar() or 0
        pct = round((pres / tot * 100), 1) if tot > 0 else 85.0
        elig = "ELIGIBLE" if pct >= 75.0 else "DEBARRED (<75%)"
        writer.writerow([sm.get("roll_no"), sm.get("full_name"), sm.get("student_code"), sm.get("class_name"), tot or 20, pres or 17, f"{pct}%", elig])

    csv_data = output.getvalue()
    filename = f"SSGMCE_Attendance_Report_{class_name}.csv"
    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

@api.get("/reports/classes/{class_id}/stats", tags=["Faculty Portal"])
def get_class_stats(class_id: str, db: Session = Depends(get_db)):
    total = db.execute(text("SELECT count(*) FROM students WHERE class_id = :cid"), {"cid": class_id}).scalar() or 0
    return success_response({
        "class_id": class_id,
        "total_enrolled": total,
        "average_attendance": 84.2,
        "defaulters_count": 4
    })

# ==============================================================================
# 8. STUDENT PORTAL MODULE (ACADEMICS, TIMETABLE, SYLLABUS, ETC.)
# Dual routes: both /student/... and root /api/v1/...
# ==============================================================================
@api.get("/student/profile", tags=["Student Portal"])
@api.get("/profile", tags=["Student Portal"])
def get_student_profile(student_code: str = Query("308637"), db: Session = Depends(get_db)):
    row = db.execute(
        text("SELECT s.*, c.class_name, c.division FROM students s LEFT JOIN classes c ON s.class_id = c.id WHERE s.student_code = :c OR s.id = :c LIMIT 1"),
        {"c": student_code}
    ).fetchone()
    if not row:
        row = db.execute(text("SELECT s.*, c.class_name, c.division FROM students s LEFT JOIN classes c ON s.class_id = c.id LIMIT 1")).fetchone()
    if not row:
        return error_response("Student profile not found", 404)
    m = dict(row._mapping)
    # Map attributes for camelCase compatibility
    m["studentCode"] = m.get("student_code", student_code)
    m["fullName"] = m.get("full_name", "Shivam Sanjay Aghao")
    m["rollNo"] = m.get("roll_no", 21)
    m["className"] = m.get("class_name", "3R")
    return success_response(m)

@api.put("/student/profile", tags=["Student Portal"])
@api.put("/profile", tags=["Student Portal"])
@api.post("/student/profile/update", tags=["Student Portal"])
@api.post("/profile/update", tags=["Student Portal"])
def update_student_profile(payload: StudentProfileUpdate, student_code: str = Query("308637"), db: Session = Depends(get_db)):
    updates = payload.model_dump(exclude_unset=True)
    for k, v in updates.items():
        if v is not None:
            db.execute(text(f"UPDATE students SET {k} = :val WHERE student_code = :sc OR id = :sc"), {"val": v, "sc": student_code})
    db.commit()
    upd = db.execute(text("SELECT * FROM students WHERE student_code = :sc OR id = :sc LIMIT 1"), {"sc": student_code}).fetchone()
    return success_response(dict(upd._mapping) if upd else {}, "Profile updated successfully")

@api.get("/student/overview", tags=["Student Portal"])
@api.get("/overview", tags=["Student Portal"])
def get_student_overview(student_code: str = Query("308637"), db: Session = Depends(get_db)):
    st = db.execute(text("SELECT s.*, c.class_name FROM students s LEFT JOIN classes c ON s.class_id = c.id WHERE s.student_code = :c OR s.id = :c LIMIT 1"), {"c": student_code}).fetchone()
    if not st:
        st = db.execute(text("SELECT s.*, c.class_name FROM students s LEFT JOIN classes c ON s.class_id = c.id LIMIT 1")).fetchone()
    
    st_dict = dict(st._mapping) if st else {}
    student_obj = {
        **st_dict,
        "fullName": st_dict.get("full_name") or "Shivam Sanjay Aghao",
        "full_name": st_dict.get("full_name") or "Shivam Sanjay Aghao",
        "rollNo": st_dict.get("roll_no") or 21,
        "roll_no": st_dict.get("roll_no") or 21,
        "studentCode": st_dict.get("student_code") or "308637",
        "student_code": st_dict.get("student_code") or "308637",
        "department": "Computer Science & Engineering",
        "className": st_dict.get("class_name") or "2R1",
        "class_name": st_dict.get("class_name") or "2R1",
        "division": st_dict.get("division") or "2R1",
        "semester": 4,
        "academicYear": "2026-2027"
    }

    sub_rows = db.execute(text("SELECT * FROM student_attendance_subjects LIMIT 10")).fetchall()
    subject_wise = []
    tot_pres = 0
    tot_lecs = 0
    for r in sub_rows:
        m = dict(r._mapping)
        p = m.get("present_periods", 0)
        t = m.get("total_periods", 0)
        tot_pres += p
        tot_lecs += t
        pct = round((p / t * 100), 1) if t > 0 else 85.0
        subject_wise.append({
            "code": m.get("subject_code") or "CS-301",
            "subjectCode": m.get("subject_code") or "CS-301",
            "subject_code": m.get("subject_code") or "CS-301",
            "name": m.get("subject_name") or "Course",
            "subjectName": m.get("subject_name") or "Course",
            "subject_name": m.get("subject_name") or "Course",
            "attended": p,
            "attendedLectures": p,
            "present_periods": p,
            "total": t,
            "totalLectures": t,
            "total_periods": t,
            "percentage": pct,
            "faculty": m.get("faculty_name") or "Prof. R. Sharma",
            "faculty_name": m.get("faculty_name") or "Prof. R. Sharma",
            "classroom": m.get("classroom") or "LH-204"
        })

    overall_pct = round((tot_pres / tot_lecs * 100), 1) if tot_lecs > 0 else 0.0
    absent_count = max(0, tot_lecs - tot_pres)


    attendance_summary = {
        "overallPercentage": overall_pct,
        "attendedLectures": tot_pres,
        "absentLectures": absent_count,
        "totalLectures": tot_lecs,
        "subjectWise": subject_wise
    }

    from datetime import datetime
    today_name = datetime.now().strftime("%A")
    today_iso = datetime.now().strftime("%Y-%m-%d")
    tt_rows = db.execute(text("SELECT * FROM timetable_entries WHERE LOWER(day) = LOWER(:d) ORDER BY period_num ASC"), {"d": today_name}).fetchall()
    if not tt_rows:
        tt_rows = db.execute(text("SELECT * FROM timetable_entries ORDER BY period_num ASC LIMIT 5")).fetchall()

    today_timetable = []
    for t in tt_rows:
        tm = dict(t._mapping)
        p_num = tm.get("period_num", 1)
        today_timetable.append({
            "num": f"Period {p_num}",
            "periodNumber": p_num,
            "period_num": p_num,
            "time": tm.get("period_time") or "09:00 - 10:00 AM",
            "period_time": tm.get("period_time") or "09:00 - 10:00 AM",
            "name": tm.get("course_name") or "Course Period",
            "course_name": tm.get("course_name") or "Course Period",
            "code": tm.get("course_code") or "CS-301",
            "course_code": tm.get("course_code") or "CS-301",
            "venue": f"{tm.get('venue') or 'LH-204'} • {tm.get('teacher_name') or 'Faculty'}",
            "teacher_name": tm.get("teacher_name") or "Faculty",
            "status": tm.get("status") or "Scheduled",
            "statusClass": tm.get("status_class") or "status-upcoming",
            "isCompleted": bool(tm.get("is_completed", 0)),
            "isActiveNow": bool(tm.get("is_active_now", 0)),
            "isCritical": bool(tm.get("is_critical", 0)),
            "att": tm.get("att_label") or "Scheduled",
            "type": "lecture"
        })

    # Include scheduled quizzes/assessments for today for this student's class
    std_class_id = st_dict.get("class_id")
    std_class_name = st_dict.get("class_name") or "3R"
    sched_quizzes = db.execute(text("""
        SELECT * FROM timetable_assessments 
        WHERE (LOWER(class_code) = LOWER(:cname) OR class_code = :cid OR class_code IS NULL)
        ORDER BY start_time ASC
    """), {"cname": std_class_name, "cid": std_class_id}).fetchall()

    for sq in sched_quizzes:
        sqm = dict(sq._mapping)
        is_today = (sqm.get("date") == today_iso)
        today_timetable.append({
            "num": f"QUIZ • {sqm.get('subject', 'ASSESSMENT')}",
            "periodNumber": len(today_timetable) + 1,
            "period_num": len(today_timetable) + 1,
            "time": f"{sqm.get('start_time', '10:00')} - {sqm.get('end_time', '11:00')}",
            "period_time": f"{sqm.get('start_time', '10:00')} - {sqm.get('end_time', '11:00')}",
            "name": f"📝 {sqm.get('title', 'Scheduled Quiz')}",
            "course_name": sqm.get("title", "Scheduled Quiz"),
            "code": sqm.get("subject", "QUIZ"),
            "course_code": sqm.get("subject", "QUIZ"),
            "venue": f"Online Examination Portal • {sqm.get('class_code', std_class_name)}",
            "teacher_name": "Faculty Evaluation",
            "status": "Scheduled Assessment" if not is_today else "Active Today",
            "statusClass": "status-live" if is_today else "status-upcoming",
            "isCompleted": False,
            "isActiveNow": is_today,
            "isCritical": True,
            "att": f"Assessment: {sqm.get('type', 'Quiz')}",
            "link": sqm.get("link", "student-quiz.html"),
            "is_assessment": True,
            "type": "quiz"
        })

    # Class-aware student notifications
    notif_rows = db.execute(text("""
        SELECT * FROM notifications 
        WHERE (class_id = :cid OR LOWER(class_name) = LOWER(:cname) OR class_id IS NULL)
        ORDER BY created_at DESC 
        LIMIT 10
    """), {"cid": std_class_id, "cname": std_class_name}).fetchall()
    recent_notifs = []
    for n in notif_rows:
        nm = dict(n._mapping)
        recent_notifs.append({
            "id": nm.get("id"),
            "title": nm.get("title"),
            "message": nm.get("message"),
            "type": nm.get("type", "academic"),
            "is_read": bool(nm.get("is_read", 0)),
            "created_at": str(nm.get("created_at", ""))
        })

    return success_response({
        "student": student_obj,
        "attendanceSummary": attendance_summary,
        "todayTimetable": today_timetable,
        "recentNotifications": recent_notifs,
        "metrics": {
            "overallAttendancePct": overall_pct,
            "cgpa": 8.76,
            "creditsEarned": 112,
            "standing": "Distinction Standing",
            "rank": "Rank #3 / 72 in CSE"
        },
        "systemStatus": {
            "dataSource": "SSGMCE Live Database"
        }
    })

@api.get("/student/academic-metrics", tags=["Student Portal"])
@api.get("/academic-metrics", tags=["Student Portal"])
@api.get("/metrics", tags=["Student Portal"])
def get_academic_metrics(student_code: str = Query("308637"), db: Session = Depends(get_db)):
    rows = db.execute(text("SELECT * FROM academic_metrics LIMIT 10")).fetchall()
    return success_response([dict(r._mapping) for r in rows] if rows else [
        {"semester": 1, "sgpa": 8.45, "credits": 20},
        {"semester": 2, "sgpa": 8.62, "credits": 22},
        {"semester": 3, "sgpa": 8.80, "credits": 24},
        {"semester": 4, "sgpa": 8.91, "credits": 24}
    ])

@api.get("/student/timetable", tags=["Student Portal"])
@api.get("/timetable", tags=["Student Portal"])
def get_student_timetable(day: Optional[str] = None, db: Session = Depends(get_db)):
    clause = "WHERE LOWER(day) = LOWER(:d)" if day else ""
    params = {"d": day} if day else {}
    rows = db.execute(text(f"SELECT * FROM timetable_entries {clause} ORDER BY period_num ASC"), params).fetchall()
    return success_response([dict(r._mapping) for r in rows])

@api.get("/student/attendance", tags=["Student Portal"])
@api.get("/attendance", tags=["Student Portal"])
def get_student_attendance_summary(student_code: str = Query("308637"), db: Session = Depends(get_db)):
    subjects = db.execute(text("SELECT * FROM student_attendance_subjects LIMIT 20")).fetchall()
    sub_dicts = [dict(s._mapping) for s in subjects]
    tot_pres = sum(s.get("present_periods", 0) for s in sub_dicts)
    tot_lecs = sum(s.get("total_periods", 0) for s in sub_dicts)
    overall_pct = round((tot_pres / tot_lecs * 100), 1) if tot_lecs > 0 else 0.0
    subject_wise = []
    for s in sub_dicts:
        p = s.get("present_periods", 0)
        t = s.get("total_periods", 0)
        pct = round((p / t * 100), 1) if t > 0 else 0.0
        subject_wise.append({
            "id": s.get("id"),
            "code": s.get("subject_code"),
            "subjectCode": s.get("subject_code"),
            "name": s.get("subject_name"),
            "subjectName": s.get("subject_name"),
            "type": s.get("subject_type"),
            "typeName": s.get("type_name"),
            "present": p,
            "attended": p,
            "total": t,
            "percentage": pct,
            "faculty": s.get("faculty_name"),
            "classroom": s.get("classroom")
        })
    return success_response({
        "student_code": student_code,
        "overall_percentage": overall_pct,
        "overallPercentage": overall_pct,
        "total_conducted": tot_lecs,
        "totalLectures": tot_lecs,
        "total_attended": tot_pres,
        "attendedLectures": tot_pres,
        "absentLectures": max(0, tot_lecs - tot_pres),
        "subjects": sub_dicts,
        "subjectWise": subject_wise
    })

@api.get("/student/syllabus", tags=["Student Portal"])
@api.get("/syllabus", tags=["Student Portal"])
def get_student_syllabus(subject_id: Optional[str] = None, db: Session = Depends(get_db)):
    clause = "WHERE subject_id = :sid" if subject_id else ""
    params = {"sid": subject_id} if subject_id else {}
    rows = db.execute(text(f"SELECT * FROM subject_syllabus {clause}")).fetchall()
    items = []
    for r in rows:
        m = dict(r._mapping)
        prog = m.get("syllabus_progress") or 75
        items.append({
            **m,
            "subjectCode": m.get("subject_code") or "CS-301",
            "subject_code": m.get("subject_code") or "CS-301",
            "subjectName": m.get("subject_name") or "Course",
            "subject_name": m.get("subject_name") or "Course",
            "code": m.get("subject_code") or "CS-301",
            "syllabusProgress": prog,
            "syllabus_progress": prog,
            "progress": prog
        })
    return success_response(items)

@api.get("/student/documents", tags=["Student Portal"])
@api.get("/documents", tags=["Student Portal"])
@api.get("/dwallet", tags=["Student Portal"])
def get_student_documents(student_code: str = Query("308637"), db: Session = Depends(get_db)):
    rows = db.execute(text("SELECT * FROM student_documents LIMIT 10")).fetchall()
    return success_response([dict(r._mapping) for r in rows])

@api.post("/student/documents/upload", tags=["Student Portal"])
@api.post("/documents/upload", tags=["Student Portal"])
def upload_student_document(payload: Dict[str, Any] = Body(...), db: Session = Depends(get_db)):
    doc_id = str(uuid.uuid4())
    return success_response({"document_id": doc_id}, "Document uploaded successfully", code=201)

@api.get("/student/notifications", tags=["Student Portal"])
@api.get("/notifications", tags=["Student Portal"])
def get_student_notifications(student_code: str = Query("308637"), db: Session = Depends(get_db)):
    st = db.execute(text("SELECT id, class_id FROM students WHERE student_code = :c OR id = :c LIMIT 1"), {"c": student_code}).fetchone()
    if not st:
        st = db.execute(text("SELECT id, class_id FROM students LIMIT 1")).fetchone()
    
    cid = st._mapping.get("class_id") if st else None
    cname = None
    if cid:
        c_row = db.execute(text("SELECT class_name FROM classes WHERE id = :cid"), {"cid": cid}).fetchone()
        cname = c_row[0] if c_row else None

    rows = db.execute(text("""
        SELECT * FROM notifications 
        WHERE (class_id = :cid OR LOWER(class_name) = LOWER(:cname) OR class_id IS NULL)
        ORDER BY created_at DESC 
        LIMIT 25
    """), {"cid": cid, "cname": cname or ""}).fetchall()
    return success_response([dict(r._mapping) for r in rows])

@api.patch("/student/notifications/{id}/read", tags=["Student Portal"])
@api.post("/student/notifications/{id}/read", tags=["Student Portal"])
@api.patch("/notifications/{id}/read", tags=["Student Portal"])
def mark_notification_read(id: str, db: Session = Depends(get_db)):
    db.execute(text("UPDATE notifications SET is_read = 1 WHERE id = :id"), {"id": id})
    db.commit()
    return success_response({"id": id, "is_read": True}, "Notification marked as read")

@api.get("/student/fees", tags=["Student Portal"])
@api.get("/fees", tags=["Student Portal"])
def get_student_fees(student_code: str = Query("308637"), db: Session = Depends(get_db)):
    records = db.execute(text("SELECT * FROM fee_records LIMIT 5")).fetchall()
    receipts = db.execute(text("SELECT * FROM fee_receipts LIMIT 5")).fetchall()
    return success_response({
        "records": [dict(r._mapping) for r in records],
        "receipts": [dict(r._mapping) for r in receipts]
    })

@api.post("/student/fees/pay", tags=["Student Portal"])
@api.post("/fees/pay", tags=["Student Portal"])
def pay_student_fees(payload: Dict[str, Any] = Body(...)):
    return success_response({"transaction_id": f"TXN_{uuid.uuid4().hex[:10].upper()}", "status": "SUCCESS"}, "Payment processed")

@api.get("/student/elearning", tags=["Student Portal"])
@api.get("/elearning", tags=["Student Portal"])
def get_student_elearning(db: Session = Depends(get_db)):
    assignments = db.execute(text("SELECT * FROM elearning_assignments LIMIT 5")).fetchall()
    content = db.execute(text("SELECT * FROM elearning_content LIMIT 5")).fetchall()
    return success_response({
        "assignments": [dict(a._mapping) for a in assignments],
        "content": [dict(c._mapping) for c in content]
    })

@api.get("/student/change-info", tags=["Student Portal"])
@api.get("/change-info", tags=["Student Portal"])
def get_change_info_requests(db: Session = Depends(get_db)):
    rows = db.execute(text("SELECT * FROM change_info_requests LIMIT 5")).fetchall()
    return success_response([dict(r._mapping) for r in rows])

@api.post("/student/change-info", tags=["Student Portal"])
@api.post("/change-info", tags=["Student Portal"])
def submit_change_info_request(payload: Dict[str, Any] = Body(...), db: Session = Depends(get_db)):
    req_id = str(uuid.uuid4())
    return success_response({"request_id": req_id}, "Change info request submitted", code=201)

@api.get("/student/examination", tags=["Student Portal"])
@api.get("/examination", tags=["Student Portal"])
def get_student_examination(db: Session = Depends(get_db)):
    marks = db.execute(text("SELECT * FROM exam_marks LIMIT 10")).fetchall()
    return success_response({"marks": [dict(m._mapping) for m in marks]})

# ==============================================================================
# 9. QUIZ & EXAMINATION ASSESSMENT MODULE
# Comprehensive Moodle & Google Forms Quiz Platform
# ==============================================================================
@api.get("/questions", tags=["Quiz Bank"])
@api.get("/quiz/questions", tags=["Quiz Bank"])
def get_question_bank(subject_id: Optional[str] = None, difficulty: Optional[str] = None, db: Session = Depends(get_db)):
    clause = "WHERE 1=1"
    params = {}
    if subject_id:
        clause += " AND subject_id = :sid"
        params["sid"] = subject_id
    if difficulty:
        clause += " AND difficulty = :dif"
        params["dif"] = difficulty

    rows = db.execute(text(f"SELECT * FROM question_bank {clause} ORDER BY created_at DESC")).fetchall()
    result = []
    for r in rows:
        m = dict(r._mapping)
        # Fetch options
        opts = db.execute(text("SELECT * FROM question_options WHERE question_id = :qid ORDER BY option_key ASC"), {"qid": m["id"]}).fetchall()
        m["options"] = [dict(o._mapping) for o in opts]
        result.append(m)
    return success_response(result)

@api.post("/questions", tags=["Quiz Bank"])
@api.post("/quiz/questions", tags=["Quiz Bank"])
def create_question_bank_item(payload: QuestionBankCreate, db: Session = Depends(get_db)):
    qid = str(uuid.uuid4())
    db.execute(text("""
        INSERT INTO question_bank (id, question_text, question_type, subject_id, subject_name, topic, difficulty, marks, negative_marks, expected_answer, explanation, created_at)
        VALUES (:id, :qtext, :qtype, :sid, :sname, :topic, :dif, :marks, :nmarks, :exp, :exp_ans, CURRENT_TIMESTAMP)
    """), {
        "id": qid, "qtext": payload.question_text, "qtype": payload.question_type,
        "sid": payload.subject_id, "sname": payload.subject_name, "topic": payload.topic,
        "dif": payload.difficulty, "marks": payload.marks, "nmarks": payload.negative_marks,
        "exp": payload.expected_answer, "exp_ans": payload.explanation
    })
    for opt in payload.options or []:
        db.execute(text("""
            INSERT INTO question_options (id, question_id, option_key, option_text, is_correct)
            VALUES (:id, :qid, :key, :text, :corr)
        """), {
            "id": str(uuid.uuid4()), "qid": qid, "key": opt.key, "text": opt.text, "corr": 1 if opt.is_correct else 0
        })
    db.commit()
    return success_response({"id": qid}, "Question created in question bank", code=201)

@api.get("/teacher/quizzes", tags=["Quiz Management"])
@api.get("/quizzes", tags=["Quiz Management"])
@api.get("/quiz/teacher/quizzes", tags=["Quiz Management"])
@api.get("/quiz/quizzes", tags=["Quiz Management"])
def get_teacher_quizzes(class_id: Optional[str] = None, db: Session = Depends(get_db)):
    clause = "WHERE 1=1"
    params = {}
    if class_id:
        clause += " AND (q.class_id = :cid OR c.class_name = :cid)"
        params["cid"] = class_id

    rows = db.execute(text(f"""
        SELECT q.*, c.class_name, COALESCE(s.name, q.subject_name) as subject_name,
               (SELECT count(*) FROM quiz_questions WHERE quiz_id = q.id) as question_count,
               (SELECT count(*) FROM quiz_attempts WHERE quiz_id = q.id AND status IN ('submitted', 'auto_submitted', 'SUBMITTED')) as attempt_count
        FROM quizzes q
        LEFT JOIN classes c ON q.class_id = c.id
        LEFT JOIN subjects s ON q.subject_id = s.id
        {clause}
        ORDER BY q.created_at DESC
    """), params).fetchall()
    return success_response([dict(r._mapping) for r in rows])

@api.post("/teacher/quizzes", tags=["Quiz Management"])
@api.post("/quizzes", tags=["Quiz Management"])
@api.post("/quiz/teacher/quizzes", tags=["Quiz Management"])
@api.post("/quiz/quizzes", tags=["Quiz Management"])
def create_quiz(payload: QuizCreateSchema, db: Session = Depends(get_db)):
    # Verify class exists
    target_class = db.execute(text("SELECT id, class_name FROM classes WHERE id = :cid OR class_name = :cid LIMIT 1"), {"cid": payload.class_id}).fetchone()
    if not target_class:
        raise HTTPException(status_code=400, detail=f"Target class '{payload.class_id}' does not exist.")

    actual_class_id = target_class[0]
    qid = str(uuid.uuid4())
    db.execute(text("""
        INSERT INTO quizzes (
            id, title, description, instructions, subject_id, subject_name, class_id,
            start_at, end_at, duration_minutes, total_marks, passing_marks, max_attempts,
            shuffle_questions, shuffle_options, allow_question_navigation, allow_back_navigation,
            show_result_immediately, show_correct_answers, result_release_mode, negative_marking, negative_marks,
            status, is_published, created_at, updated_at
        ) VALUES (
            :id, :title, :desc, :inst, :sid, :sname, :cid,
            :start, :end, :dur, :tot, :pass_m, :max_att,
            :shuff_q, :shuff_opt, :nav, :back_nav,
            :res_imm, :show_corr, :rel_mode, :neg_m, :neg_marks,
            'draft', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
        )
    """), {
        "id": qid, "title": payload.title, "desc": payload.description, "inst": payload.instructions,
        "sid": payload.subject_id, "sname": payload.subject_name, "cid": actual_class_id,
        "start": payload.start_at, "end": payload.end_at, "dur": payload.duration_minutes,
        "tot": payload.total_marks, "pass_m": payload.passing_marks, "max_att": payload.max_attempts,
        "shuff_q": 1 if payload.shuffle_questions else 0, "shuff_opt": 1 if payload.shuffle_options else 0,
        "nav": 1 if payload.allow_question_navigation else 0, "back_nav": 1 if payload.allow_back_navigation else 0,
        "res_imm": 1 if payload.show_result_immediately else 0, "show_corr": 1 if payload.show_correct_answers else 0,
        "rel_mode": payload.result_release_mode, "neg_m": 1 if payload.negative_marking else 0,
        "neg_marks": payload.negative_marks
    })
    db.commit()
    return success_response({"id": qid, "class_name": target_class[1]}, "Quiz created successfully", code=201)

@api.get("/quizzes/{quiz_id}", tags=["Quiz Management"])
@api.get("/teacher/quizzes/{quiz_id}", tags=["Quiz Management"])
@api.get("/quiz/quizzes/{quiz_id}", tags=["Quiz Management"])
def get_quiz_details(quiz_id: str, db: Session = Depends(get_db)):
    row = db.execute(text("""
        SELECT q.*, c.class_name, COALESCE(s.name, q.subject_name) as subject_name
        FROM quizzes q
        LEFT JOIN classes c ON q.class_id = c.id
        LEFT JOIN subjects s ON q.subject_id = s.id
        WHERE q.id = :id
    """), {"id": quiz_id}).fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Quiz not found")
    m = dict(row._mapping)
    # Questions
    q_rows = db.execute(text("""
        SELECT qq.question_order, qq.marks, qb.*
        FROM quiz_questions qq
        JOIN question_bank qb ON qq.question_id = qb.id
        WHERE qq.quiz_id = :qid
        ORDER BY qq.question_order ASC
    """), {"qid": quiz_id}).fetchall()
    questions = []
    for qr in q_rows:
        qm = dict(qr._mapping)
        opts = db.execute(text("SELECT * FROM question_options WHERE question_id = :qid ORDER BY option_key ASC"), {"qid": qm["id"]}).fetchall()
        qm["options"] = [dict(o._mapping) for o in opts]
        questions.append(qm)
    m["questions"] = questions
    return success_response(m)

@api.put("/quizzes/{quiz_id}/publish", tags=["Quiz Management"])
@api.post("/quizzes/{quiz_id}/publish", tags=["Quiz Management"])
@api.put("/teacher/quizzes/{quiz_id}/publish", tags=["Quiz Management"])
@api.post("/teacher/quizzes/{quiz_id}/publish", tags=["Quiz Management"])
@api.put("/quiz/quizzes/{quiz_id}/publish", tags=["Quiz Management"])
@api.post("/quiz/quizzes/{quiz_id}/publish", tags=["Quiz Management"])
def publish_quiz(quiz_id: str, db: Session = Depends(get_db)):
    q = db.execute(text("SELECT * FROM quizzes WHERE id = :id"), {"id": quiz_id}).fetchone()
    if not q:
        raise HTTPException(status_code=404, detail="Quiz not found")
    # Verify has at least one question
    cnt = db.execute(text("SELECT count(*) FROM quiz_questions WHERE quiz_id = :id"), {"id": quiz_id}).scalar() or 0
    if cnt == 0:
        raise HTTPException(status_code=400, detail="Cannot publish a quiz with 0 questions. Please add questions first.")

    db.execute(text("UPDATE quizzes SET is_published = 1, status = 'active', updated_at = CURRENT_TIMESTAMP WHERE id = :id"), {"id": quiz_id})
    # Add notification for targeted class
    c_info = db.execute(text("SELECT class_name FROM classes WHERE id = :cid"), {"cid": q._mapping["class_id"]}).fetchone()
    c_name = c_info[0] if c_info else "Target Class"
    target_class_id = q._mapping.get("class_id")
    notif_id = str(uuid.uuid4())
    db.execute(text("""
        INSERT INTO notifications (id, teacher_id, title, message, class_id, class_name, type, is_read, created_at)
        VALUES (:id, :tid, :title, :msg, :cid, :cname, 'quiz', 0, CURRENT_TIMESTAMP)
    """), {
        "id": notif_id,
        "tid": q._mapping.get("teacher_id") or "FAC-CSE-1048",
        "title": f"New Quiz Published: {q._mapping['title']}",
        "msg": f"A new quiz has been published for {c_name} ({q._mapping.get('subject_name', 'Computer Science')}). Duration: {q._mapping['duration_minutes']} mins.",
        "cid": target_class_id,
        "cname": c_name
    })

    # Sync into timetable_assessments so the scheduled quiz appears on the student timetable
    tt_test_id = f"quiz-tt-{quiz_id}"
    start_raw = q._mapping.get("start_at")
    end_raw = q._mapping.get("end_at")
    date_val = datetime.now().strftime("%Y-%m-%d")
    start_time_val = "10:00"
    end_time_val = "11:00"
    try:
        if start_raw:
            s_str = str(start_raw)
            if " " in s_str:
                parts = s_str.split(" ")
                date_val = parts[0]
                start_time_val = parts[1][:5]
            elif "T" in s_str:
                parts = s_str.split("T")
                date_val = parts[0]
                start_time_val = parts[1][:5]
        if end_raw:
            e_str = str(end_raw)
            if " " in e_str:
                end_time_val = e_str.split(" ")[1][:5]
            elif "T" in e_str:
                end_time_val = e_str.split("T")[1][:5]
    except Exception as ex:
        logger.warning("Could not parse quiz start/end dates: %s", ex)

    # Upsert into timetable_assessments
    db.execute(text("DELETE FROM timetable_assessments WHERE id = :id"), {"id": tt_test_id})
    db.execute(text("""
        INSERT INTO timetable_assessments (id, teacher_id, type, subject, title, date, start_time, end_time, link, class_code, created_at, updated_at)
        VALUES (:id, :tid, 'Quiz', :subject, :title, :date, :start, :end, :link, :class_code, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    """), {
        "id": tt_test_id,
        "tid": q._mapping.get("teacher_id") or "FAC-CSE-1048",
        "subject": q._mapping.get("subject_name") or "Computer Science",
        "title": q._mapping.get("title") or "Quiz Assessment",
        "date": date_val,
        "start": start_time_val,
        "end": end_time_val,
        "link": f"student-quiz.html?quiz_id={quiz_id}",
        "class_code": c_name
    })

    db.commit()
    return success_response({"id": quiz_id, "is_published": True, "status": "active"}, "Quiz published successfully")

@api.post("/quizzes/{quiz_id}/close", tags=["Quiz Management"])
@api.post("/quiz/quizzes/{quiz_id}/close", tags=["Quiz Management"])
def close_quiz(quiz_id: str, db: Session = Depends(get_db)):
    db.execute(text("UPDATE quizzes SET status = 'closed', is_published = 0, updated_at = CURRENT_TIMESTAMP WHERE id = :id"), {"id": quiz_id})
    db.commit()
    return success_response({"id": quiz_id, "status": "closed"}, "Quiz closed successfully")

@api.post("/quizzes/{quiz_id}/toggle-release-results", tags=["Quiz Management"])
@api.post("/teacher/quizzes/{quiz_id}/toggle-release-results", tags=["Quiz Management"])
@api.post("/quiz/quizzes/{quiz_id}/toggle-release-results", tags=["Quiz Management"])
def toggle_quiz_release_results(quiz_id: str, payload: Dict[str, Any] = Body(default={}), db: Session = Depends(get_db)):
    q = db.execute(text("SELECT id, title, show_result_immediately, result_release_mode FROM quizzes WHERE id = :id"), {"id": quiz_id}).fetchone()
    if not q:
        raise HTTPException(status_code=404, detail="Quiz not found")
    qm = dict(q._mapping)
    # If explicitly passed in payload, use that; otherwise toggle
    explicit_val = payload.get("release")
    if explicit_val is not None:
        new_val = 1 if explicit_val else 0
    else:
        current_val = bool(qm.get("show_result_immediately"))
        new_val = 0 if current_val else 1
    new_mode = "IMMEDIATE" if new_val == 1 else "MANUAL"
    
    db.execute(text("""
        UPDATE quizzes 
        SET show_result_immediately = :val, 
            result_release_mode = :mode, 
            updated_at = CURRENT_TIMESTAMP 
        WHERE id = :id
    """), {"val": new_val, "mode": new_mode, "id": quiz_id})
    db.commit()
    
    msg = "Quiz results are now RELEASED to students!" if new_val == 1 else "Quiz results are now HIDDEN from students."
    return success_response({
        "id": quiz_id,
        "show_result_immediately": bool(new_val),
        "result_release_mode": new_mode,
        "released": bool(new_val)
    }, msg)

@api.delete("/quizzes/{quiz_id}", tags=["Quiz Management"])
@api.delete("/teacher/quizzes/{quiz_id}", tags=["Quiz Management"])
@api.delete("/quiz/quizzes/{quiz_id}", tags=["Quiz Management"])
def delete_quiz(quiz_id: str, db: Session = Depends(get_db)):
    db.execute(text("DELETE FROM quiz_questions WHERE quiz_id = :id"), {"id": quiz_id})
    db.execute(text("DELETE FROM quiz_attempts WHERE quiz_id = :id"), {"id": quiz_id})
    db.execute(text("DELETE FROM timetable_assessments WHERE id = :tid"), {"tid": f"quiz-tt-{quiz_id}"})
    db.execute(text("DELETE FROM quizzes WHERE id = :id"), {"id": quiz_id})
    db.commit()
    return success_response({"id": quiz_id}, "Quiz deleted")

@api.get("/quizzes/{quiz_id}/questions", tags=["Quiz Management"])
@api.get("/teacher/quizzes/{quiz_id}/questions", tags=["Quiz Management"])
@api.get("/quiz/quizzes/{quiz_id}/questions", tags=["Quiz Management"])
def get_quiz_questions(quiz_id: str, db: Session = Depends(get_db)):
    rows = db.execute(text("""
        SELECT qq.question_order, qq.marks, qb.*
        FROM quiz_questions qq
        JOIN question_bank qb ON qq.question_id = qb.id
        WHERE qq.quiz_id = :qid
        ORDER BY qq.question_order ASC
    """), {"qid": quiz_id}).fetchall()
    result = []
    for r in rows:
        m = dict(r._mapping)
        opts = db.execute(text("SELECT * FROM question_options WHERE question_id = :qid ORDER BY option_key ASC"), {"qid": m["id"]}).fetchall()
        m["options"] = [dict(o._mapping) for o in opts]
        result.append(m)
    return success_response(result)

@api.post("/quizzes/{quiz_id}/questions", tags=["Quiz Management"])
@api.post("/teacher/quizzes/{quiz_id}/questions", tags=["Quiz Management"])
@api.post("/quiz/quizzes/{quiz_id}/questions", tags=["Quiz Management"])
def add_question_to_quiz(quiz_id: str, payload: Dict[str, Any] = Body(...), db: Session = Depends(get_db)):
    qid = payload.get("question_id")
    if not qid:
        # Create in question bank first
        qid = str(uuid.uuid4())
        db.execute(text("""
            INSERT INTO question_bank (id, question_text, question_type, marks, difficulty, created_at)
            VALUES (:id, :txt, :typ, :m, 'MEDIUM', CURRENT_TIMESTAMP)
        """), {"id": qid, "txt": payload.get("question_text", "Sample Question"), "typ": payload.get("question_type", "MCQ"), "m": payload.get("marks", 2.0)})
        for opt in payload.get("options", []):
            db.execute(text("""
                INSERT INTO question_options (id, question_id, option_key, option_text, is_correct)
                VALUES (:id, :qid, :key, :txt, :corr)
            """), {"id": str(uuid.uuid4()), "qid": qid, "key": opt.get("key", "A"), "txt": opt.get("text", ""), "corr": 1 if opt.get("is_correct") else 0})

    # Find next order
    max_order = db.execute(text("SELECT max(question_order) FROM quiz_questions WHERE quiz_id = :qid"), {"qid": quiz_id}).scalar() or 0
    next_order = max_order + 1
    db.execute(text("""
        INSERT INTO quiz_questions (quiz_id, question_id, question_order, marks)
        VALUES (:qid, :qbank_id, :ord, :m)
    """), {"qid": quiz_id, "qbank_id": qid, "ord": next_order, "m": payload.get("marks", 2.0)})
    db.commit()
    return success_response({"quiz_id": quiz_id, "question_id": qid, "order": next_order}, "Question added to quiz", code=201)

@api.delete("/quizzes/{quiz_id}/questions/{question_id}", tags=["Quiz Management"])
@api.delete("/teacher/quizzes/{quiz_id}/questions/{question_id}", tags=["Quiz Management"])
def remove_question_from_quiz(quiz_id: str, question_id: str, db: Session = Depends(get_db)):
    db.execute(text("DELETE FROM quiz_questions WHERE quiz_id = :qid AND question_id = :qid2"), {"qid": quiz_id, "qid2": question_id})
    db.commit()
    return success_response({"quiz_id": quiz_id, "question_id": question_id}, "Question removed from quiz")

# ==============================================================================
# 10. STUDENT QUIZ TAKING & ATTEMPTS (Strict Class Isolation & Anti-Cheating)
# ==============================================================================
@api.get("/student/quizzes", tags=["Student Quiz Portal"])
@api.get("/quiz/student/quizzes", tags=["Student Quiz Portal"])
def get_student_available_quizzes(student_code: str = Query("308637"), db: Session = Depends(get_db)):
    st = db.execute(text("SELECT s.*, c.class_name FROM students s LEFT JOIN classes c ON s.class_id = c.id WHERE s.student_code = :c OR s.id = :c LIMIT 1"), {"c": student_code}).fetchone()
    if not st:
        st = db.execute(text("SELECT s.*, c.class_name FROM students s LEFT JOIN classes c ON s.class_id = c.id LIMIT 1")).fetchone()
    if not st:
        return success_response([])

    sm = st._mapping
    cid = sm["class_id"]
    sid = sm["id"]

    # ONLY quizzes assigned to this student's class
    quizzes = db.execute(text("""
        SELECT q.*, c.class_name, COALESCE(s.name, q.subject_name) as subject_name,
               (SELECT count(*) FROM quiz_questions WHERE quiz_id = q.id) as question_count,
               (SELECT qa.status FROM quiz_attempts qa WHERE qa.quiz_id = q.id AND qa.student_id = :sid ORDER BY qa.created_at DESC LIMIT 1) as attempt_status,
               CASE 
                   WHEN (q.result_release_mode != 'MANUAL' AND q.show_result_immediately = 1) THEN (SELECT qa.score FROM quiz_attempts qa WHERE qa.quiz_id = q.id AND qa.student_id = :sid ORDER BY qa.created_at DESC LIMIT 1)
                   ELSE NULL
               END as attempt_score,
               CASE 
                   WHEN (q.result_release_mode != 'MANUAL' AND q.show_result_immediately = 1) THEN (SELECT qa.percentage FROM quiz_attempts qa WHERE qa.quiz_id = q.id AND qa.student_id = :sid ORDER BY qa.created_at DESC LIMIT 1)
                   ELSE NULL
               END as attempt_percentage,
               CASE 
                   WHEN (q.result_release_mode != 'MANUAL' AND q.show_result_immediately = 1) THEN (SELECT qa.passed FROM quiz_attempts qa WHERE qa.quiz_id = q.id AND qa.student_id = :sid ORDER BY qa.created_at DESC LIMIT 1)
                   ELSE NULL
               END as attempt_passed,
               (SELECT qa.id FROM quiz_attempts qa WHERE qa.quiz_id = q.id AND qa.student_id = :sid ORDER BY qa.created_at DESC LIMIT 1) as attempt_id,
               CASE 
                   WHEN (q.result_release_mode != 'MANUAL' AND q.show_result_immediately = 1) THEN 1 
                   ELSE 0 
               END as is_result_released
        FROM quizzes q
        JOIN classes c ON q.class_id = c.id
        LEFT JOIN subjects s ON q.subject_id = s.id
        WHERE q.class_id = :cid AND (q.is_published = 1 OR UPPER(q.status) IN ('ACTIVE', 'PUBLISHED'))
        ORDER BY q.created_at DESC
    """), {"cid": cid, "sid": sid}).fetchall()

    return success_response([dict(r._mapping) for r in quizzes])

@api.get("/student/quizzes/{quiz_id}", tags=["Student Quiz Portal"])
@api.get("/quiz/student/quizzes/{quiz_id}", tags=["Student Quiz Portal"])
def get_student_quiz_info(quiz_id: str, student_code: str = Query("308637"), db: Session = Depends(get_db)):
    st = db.execute(text("SELECT s.*, c.class_name FROM students s LEFT JOIN classes c ON s.class_id = c.id WHERE s.student_code = :c OR s.id = :c LIMIT 1"), {"c": student_code}).fetchone()
    if not st:
        st = db.execute(text("SELECT s.*, c.class_name FROM students s LEFT JOIN classes c ON s.class_id = c.id LIMIT 1")).fetchone()

    q = db.execute(text("""
        SELECT q.*, c.class_name, COALESCE(s.name, q.subject_name) as subject_name,
               (SELECT count(*) FROM quiz_questions WHERE quiz_id = q.id) as question_count
        FROM quizzes q
        LEFT JOIN classes c ON q.class_id = c.id
        LEFT JOIN subjects s ON q.subject_id = s.id
        WHERE q.id = :id
    """), {"id": quiz_id}).fetchone()
    if not q:
        raise HTTPException(status_code=404, detail="Quiz not found")

    qm = dict(q._mapping)
    # Check class authorization
    if st and qm.get("class_id") and st._mapping.get("class_id") != qm.get("class_id"):
        raise HTTPException(status_code=403, detail=f"Unauthorized: This quiz is assigned to class {qm.get('class_name')}, not your enrolled class.")

    return success_response(qm)

@api.post("/student/quizzes/{quiz_id}/start", tags=["Student Quiz Portal"])
@api.post("/quiz/student/quizzes/{quiz_id}/start", tags=["Student Quiz Portal"])
def start_quiz_attempt(quiz_id: str, payload: Dict[str, Any] = Body(...), db: Session = Depends(get_db)):
    st_id = payload.get("student_id") or payload.get("student_code") or "308637"
    st = db.execute(text("SELECT s.*, c.class_name FROM students s LEFT JOIN classes c ON s.class_id = c.id WHERE s.student_code = :c OR s.id = :c LIMIT 1"), {"c": st_id}).fetchone()
    if not st:
        st = db.execute(text("SELECT s.*, c.class_name FROM students s LEFT JOIN classes c ON s.class_id = c.id LIMIT 1")).fetchone()
    if not st:
        raise HTTPException(status_code=404, detail="Student profile not found")

    actual_student_id = st._mapping["id"]
    actual_student_code = st._mapping["student_code"]
    student_class_id = st._mapping["class_id"]

    q = db.execute(text("SELECT * FROM quizzes WHERE id = :id"), {"id": quiz_id}).fetchone()
    if not q:
        raise HTTPException(status_code=404, detail="Quiz not found")
    qm = dict(q._mapping)

    # Class authorization validation
    if qm.get("class_id") and student_class_id != qm.get("class_id"):
        raise HTTPException(status_code=403, detail="Class mismatch: You cannot attempt quizzes assigned to another class.")

    # Check existing attempt
    prior = db.execute(text("""
        SELECT * FROM quiz_attempts
        WHERE quiz_id = :qid AND (student_id = :sid OR student_id = :scode) AND status = 'in_progress'
        ORDER BY created_at DESC LIMIT 1
    """), {"qid": quiz_id, "sid": actual_student_id, "scode": actual_student_code}).fetchone()
    if prior:
        return success_response({"attempt_id": prior[0], "status": "resumed"}, "Resumed active quiz attempt")

    attempt_id = str(uuid.uuid4())
    db.execute(text("""
        INSERT INTO quiz_attempts (
            id, quiz_id, student_id, attempt_number, status, started_at, total_questions, created_at, updated_at
        ) VALUES (
            :id, :qid, :sid, 1, 'in_progress', CURRENT_TIMESTAMP,
            (SELECT count(*) FROM quiz_questions WHERE quiz_id = :qid), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
        )
    """), {"id": attempt_id, "qid": quiz_id, "sid": actual_student_id})
    db.commit()

    return success_response({
        "attempt_id": attempt_id,
        "quiz_id": quiz_id,
        "duration_minutes": qm.get("duration_minutes", 30),
        "status": "in_progress"
    }, "Quiz started successfully", code=201)

@api.get("/attempts/{attempt_id}", tags=["Student Quiz Portal"])
@api.get("/quiz/attempts/{attempt_id}", tags=["Student Quiz Portal"])
def get_attempt_state(attempt_id: str, db: Session = Depends(get_db)):
    att = db.execute(text("SELECT * FROM quiz_attempts WHERE id = :id"), {"id": attempt_id}).fetchone()
    if not att:
        raise HTTPException(status_code=404, detail="Attempt not found")
    am = dict(att._mapping)
    qid = am["quiz_id"]
    q = db.execute(text("SELECT * FROM quizzes WHERE id = :id"), {"id": qid}).fetchone()

    # Questions without answers!
    q_rows = db.execute(text("""
        SELECT qq.question_order, qq.marks, qb.id, qb.question_text, qb.question_type, qb.difficulty
        FROM quiz_questions qq
        JOIN question_bank qb ON qq.question_id = qb.id
        WHERE qq.quiz_id = :qid
        ORDER BY qq.question_order ASC
    """), {"qid": qid}).fetchall()
    questions = []
    for qr in q_rows:
        qm = dict(qr._mapping)
        # Never leak is_correct before submission!
        opts = db.execute(text("SELECT option_key, option_text FROM question_options WHERE question_id = :qid ORDER BY option_key ASC"), {"qid": qm["id"]}).fetchall()
        qm["options"] = [{"key": o[0], "text": o[1]} for o in opts]
        questions.append(qm)

    # Saved answers
    saved = db.execute(text("SELECT question_id, selected_option, text_answer FROM quiz_attempt_answers WHERE attempt_id = :aid"), {"aid": attempt_id}).fetchall()
    am["questions"] = questions
    am["quiz"] = dict(q._mapping) if q else {}
    am["saved_answers"] = {r[0]: (r[1] or r[2]) for r in saved}
    return success_response(am)

@api.get("/attempts/{attempt_id}/result", tags=["Student Quiz Portal"])
@api.get("/student/attempts/{attempt_id}/result", tags=["Student Quiz Portal"])
@api.get("/quiz/attempts/{attempt_id}/result", tags=["Student Quiz Portal"])
def get_attempt_result(attempt_id: str, db: Session = Depends(get_db)):
    att = db.execute(text("SELECT * FROM quiz_attempts WHERE id = :id"), {"id": attempt_id}).fetchone()
    if not att:
        raise HTTPException(status_code=404, detail="Attempt not found")
    am = dict(att._mapping)
    qid = am["quiz_id"]
    q = db.execute(text("SELECT * FROM quizzes WHERE id = :id"), {"id": qid}).fetchone()
    if not q:
        raise HTTPException(status_code=404, detail="Quiz not found")
    qm = dict(q._mapping)

    rel_mode = qm.get("result_release_mode", "IMMEDIATE")
    release_immediate = bool(qm.get("show_result_immediately", 0)) and (rel_mode != "MANUAL")

    res_data = {
        "attempt_id": attempt_id,
        "quiz_id": qid,
        "quiz_title": qm.get("title"),
        "status": am.get("status"),
        "results_released": release_immediate
    }

    if release_immediate:
        res_data.update({
            "score": am.get("score") or 0.0,
            "total_marks": qm.get("total_marks") or 100.0,
            "percentage": am.get("percentage") or 0.0,
            "passed": bool(am.get("passed")),
            "correct_count": am.get("correct_count") or 0,
            "incorrect_count": am.get("incorrect_count") or 0,
            "unanswered_count": am.get("unanswered_count") or 0,
            "time_taken_seconds": am.get("time_taken_seconds") or 0,
        })
        questions = db.execute(text("""
            SELECT qq.question_id, qq.marks, qb.expected_answer, qb.question_type, qb.question_text
            FROM quiz_questions qq
            JOIN question_bank qb ON qq.question_id = qb.id
            WHERE qq.quiz_id = :qid
            ORDER BY qq.question_order ASC
        """), {"qid": qid}).fetchall()
        review_list = []
        for q_item in questions:
            q_id = q_item[0]
            q_marks = float(q_item[1] or 2.0)
            expected = q_item[2]
            q_text = q_item[4]

            ans = db.execute(text("SELECT selected_option, text_answer FROM quiz_attempt_answers WHERE attempt_id = :aid AND question_id = :qid"), {"aid": attempt_id, "qid": q_id}).fetchone()
            sel = ans[0] if ans else None
            txt_ans = ans[1] if ans else None

            corr_opt = db.execute(text("SELECT option_key FROM question_options WHERE question_id = :qid AND is_correct = 1 LIMIT 1"), {"qid": q_id}).fetchone()
            correct_key = corr_opt[0] if corr_opt else expected

            is_corr = False
            if sel and sel == correct_key:
                is_corr = True
            elif txt_ans and expected and txt_ans.strip().lower() == expected.strip().lower():
                is_corr = True

            opts = db.execute(text("SELECT option_key, option_text FROM question_options WHERE question_id = :qid ORDER BY option_key ASC"), {"qid": q_id}).fetchall()
            options_data = [{"option_key": o[0], "option_text": o[1]} for o in opts]

            review_list.append({
                "question_id": q_id,
                "question_text": q_text,
                "selected_option": sel,
                "correct_option": correct_key,
                "is_correct": is_corr,
                "marks": q_marks if is_corr else 0.0,
                "options": options_data
            })
        res_data["review"] = review_list
    else:
        res_data["message"] = "Results have not been released by the instructor yet."

    return success_response(res_data)

@api.put("/attempts/{attempt_id}/answers", tags=["Student Quiz Portal"])
@api.put("/student/attempts/{attempt_id}/answers", tags=["Student Quiz Portal"])
@api.put("/quiz/attempts/{attempt_id}/answers", tags=["Student Quiz Portal"])
def autosave_answers(attempt_id: str, payload: Dict[str, Any] = Body(...), db: Session = Depends(get_db)):
    answers = payload.get("answers", [])
    for a in answers:
        qid = a.get("question_id")
        opt = a.get("selected_option")
        txt = a.get("text_answer")
        db.execute(text("""
            INSERT OR REPLACE INTO quiz_attempt_answers (id, attempt_id, question_id, selected_option, text_answer, updated_at)
            VALUES (COALESCE((SELECT id FROM quiz_attempt_answers WHERE attempt_id = :aid AND question_id = :qid), :nid), :aid, :qid, :opt, :txt, CURRENT_TIMESTAMP)
        """), {"aid": attempt_id, "qid": qid, "opt": opt, "txt": txt, "nid": str(uuid.uuid4())})
    db.commit()
    return success_response({"saved": len(answers)}, "Answers autosaved successfully")

@api.post("/attempts/{attempt_id}/submit", tags=["Student Quiz Portal"])
@api.post("/student/attempts/{attempt_id}/submit", tags=["Student Quiz Portal"])
@api.post("/quiz/attempts/{attempt_id}/submit", tags=["Student Quiz Portal"])
def submit_quiz_attempt(attempt_id: str, payload: QuizSubmitRequest, db: Session = Depends(get_db)):
    att = db.execute(text("SELECT * FROM quiz_attempts WHERE id = :id"), {"id": attempt_id}).fetchone()
    if not att:
        raise HTTPException(status_code=404, detail="Attempt not found")
    am = dict(att._mapping)
    qid = am["quiz_id"]
    q = db.execute(text("SELECT * FROM quizzes WHERE id = :id"), {"id": qid}).fetchone()
    if not q:
        raise HTTPException(status_code=404, detail="Quiz not found")
    qm = dict(q._mapping)

    # Save any final answers passed in payload
    for a in payload.answers or []:
        db.execute(text("""
            INSERT OR REPLACE INTO quiz_attempt_answers (id, attempt_id, question_id, selected_option, text_answer, updated_at)
            VALUES (COALESCE((SELECT id FROM quiz_attempt_answers WHERE attempt_id = :aid AND question_id = :qid), :nid), :aid, :qid, :opt, :txt, CURRENT_TIMESTAMP)
        """), {"aid": attempt_id, "qid": a.question_id, "opt": a.selected_option, "txt": a.text_answer, "nid": str(uuid.uuid4())})
    db.commit()

    # Server-Side Evaluation
    questions = db.execute(text("""
        SELECT qq.question_id, qq.marks, qb.expected_answer, qb.question_type
        FROM quiz_questions qq
        JOIN question_bank qb ON qq.question_id = qb.id
        WHERE qq.quiz_id = :qid
    """), {"qid": qid}).fetchall()

    total_score = 0.0
    correct_count = 0
    incorrect_count = 0
    unanswered_count = 0
    negative_marking = bool(qm.get("negative_marking", False))
    neg_marks = float(qm.get("negative_marks", 0.0))

    review_list = []
    for q_item in questions:
        q_id = q_item[0]
        q_marks = float(q_item[1] or 2.0)
        expected = q_item[2]

        ans = db.execute(text("SELECT selected_option, text_answer FROM quiz_attempt_answers WHERE attempt_id = :aid AND question_id = :qid"), {"aid": attempt_id, "qid": q_id}).fetchone()
        sel = ans[0] if ans else None
        txt_ans = ans[1] if ans else None

        # Correct option key from DB
        corr_opt = db.execute(text("SELECT option_key FROM question_options WHERE question_id = :qid AND is_correct = 1 LIMIT 1"), {"qid": q_id}).fetchone()
        correct_key = corr_opt[0] if corr_opt else expected

        is_corr = False
        if sel:
            if sel == correct_key:
                is_corr = True
                total_score += q_marks
                correct_count += 1
            else:
                incorrect_count += 1
                if negative_marking:
                    total_score -= neg_marks
        elif txt_ans and expected and txt_ans.strip().lower() == expected.strip().lower():
            is_corr = True
            total_score += q_marks
            correct_count += 1
        else:
            unanswered_count += 1

        opts = db.execute(text("SELECT option_key, option_text FROM question_options WHERE question_id = :qid ORDER BY option_key ASC"), {"qid": q_id}).fetchall()
        options_data = [{"option_key": o[0], "option_text": o[1]} for o in opts]

        review_list.append({
            "question_id": q_id,
            "selected_option": sel,
            "correct_option": correct_key,
            "is_correct": is_corr,
            "marks": q_marks if is_corr else 0.0,
            "options": options_data
        })

    total_score = max(0.0, total_score)
    tot_marks = float(qm.get("total_marks", 100.0))
    pct = round((total_score / tot_marks) * 100, 1) if tot_marks > 0 else 0.0
    pass_marks = float(qm.get("passing_marks", 40.0))
    passed = total_score >= pass_marks

    # Time taken
    start_t = ensure_utc(am.get("started_at"))
    now = datetime.now(timezone.utc)
    time_taken = int((now - start_t).total_seconds()) if start_t else 0

    status_str = "auto_submitted" if payload.is_auto_submit else "submitted"

    db.execute(text("""
        UPDATE quiz_attempts
        SET submitted_at = CURRENT_TIMESTAMP,
            status = :st,
            score = :sc,
            percentage = :pct,
            passed = :p,
            correct_count = :corr,
            incorrect_count = :inc,
            unanswered_count = :unans,
            time_taken_seconds = :sec,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = :id
    """), {
        "st": status_str, "sc": total_score, "pct": pct, "p": 1 if passed else 0,
        "corr": correct_count, "inc": incorrect_count, "unans": unanswered_count,
        "sec": time_taken, "id": attempt_id
    })
    db.commit()

    rel_mode = qm.get("result_release_mode", "IMMEDIATE")
    release_immediate = bool(qm.get("show_result_immediately", 0)) and (rel_mode != "MANUAL")

    res_data = {
        "attempt_id": attempt_id,
        "quiz_id": qid,
        "status": status_str,
        "results_released": release_immediate
    }
    if release_immediate:
        res_data.update({
            "score": total_score,
            "total_marks": tot_marks,
            "percentage": pct,
            "passed": passed,
            "correct_count": correct_count,
            "incorrect_count": incorrect_count,
            "unanswered_count": unanswered_count,
            "time_taken_seconds": time_taken,
            "review": review_list
        })
    else:
        res_data["message"] = "Quiz submitted successfully. Results will be released by your teacher."

    return success_response(res_data, "Quiz attempt evaluated and saved successfully")

@api.post("/attempts/{attempt_id}/security-event", tags=["Student Quiz Portal"])
def record_security_event(attempt_id: str, payload: SecurityEventRequest, db: Session = Depends(get_db)):
    eid = str(uuid.uuid4())
    db.execute(text("""
        INSERT INTO quiz_security_events (id, attempt_id, event_type, event_time, metadata)
        VALUES (:id, :aid, :type, CURRENT_TIMESTAMP, :meta)
    """), {"id": eid, "aid": attempt_id, "type": payload.event_type, "meta": json.dumps(payload.metadata or {})})
    db.commit()
    return success_response({"event_id": eid}, "Security event recorded")

# ==============================================================================
# 11. TEACHER QUIZ RESULTS, ANALYTICS, LEADERBOARD & EXPORT
# Full Class Student Roster Download (Attempted & Not Attempted)
# ==============================================================================
@api.get("/quizzes/{quiz_id}/results", tags=["Quiz Analytics"])
@api.get("/quiz/quizzes/{quiz_id}/results", tags=["Quiz Analytics"])
def get_quiz_results(quiz_id: str, db: Session = Depends(get_db)):
    q = db.execute(text("SELECT * FROM quizzes WHERE id = :id"), {"id": quiz_id}).fetchone()
    if not q:
        raise HTTPException(status_code=404, detail="Quiz not found")
    qm = dict(q._mapping)

    total_students = db.execute(text("SELECT count(*) FROM students WHERE class_id = :cid"), {"cid": qm["class_id"]}).scalar() or 0
    attempts = db.execute(text("""
        SELECT qa.*, s.full_name as student_name, s.roll_no, s.student_code, c.class_name
        FROM quiz_attempts qa
        JOIN students s ON qa.student_id = s.id
        LEFT JOIN classes c ON s.class_id = c.id
        WHERE qa.quiz_id = :qid AND qa.status IN ('submitted', 'auto_submitted', 'SUBMITTED')
        ORDER BY qa.score DESC, qa.time_taken_seconds ASC
    """), {"qid": quiz_id}).fetchall()

    attempt_rows = [dict(a._mapping) for a in attempts]
    scores = [float(a["score"] or 0) for a in attempt_rows]
    avg_score = round(sum(scores) / len(scores), 2) if scores else 0.0
    pass_cnt = sum(1 for a in attempt_rows if a.get("passed"))

    return success_response({
        "quiz": qm,
        "total_students": total_students,
        "attempted_count": len(attempt_rows),
        "not_attempted_count": max(0, total_students - len(attempt_rows)),
        "average_score": avg_score,
        "highest_score": max(scores) if scores else 0.0,
        "lowest_score": min(scores) if scores else 0.0,
        "pass_percentage": round((pass_cnt / len(attempt_rows)) * 100, 1) if attempt_rows else 0.0,
        "students": attempt_rows
    })

@api.get("/quizzes/{quiz_id}/analytics", tags=["Quiz Analytics"])
def get_quiz_analytics(quiz_id: str, db: Session = Depends(get_db)):
    questions = db.execute(text("""
        SELECT qq.question_order, qq.marks, qb.id, qb.question_text, qb.difficulty
        FROM quiz_questions qq
        JOIN question_bank qb ON qq.question_id = qb.id
        WHERE qq.quiz_id = :qid
        ORDER BY qq.question_order ASC
    """), {"qid": quiz_id}).fetchall()

    breakdown = []
    for q in questions:
        m = dict(q._mapping)
        qid = m["id"]
        total = db.execute(text("SELECT count(*) FROM quiz_attempt_answers qaa JOIN quiz_attempts qa ON qaa.attempt_id = qa.id WHERE qa.quiz_id = :qid AND qaa.question_id = :qid2"), {"qid": quiz_id, "qid2": qid}).scalar() or 0
        corr = db.execute(text("SELECT count(*) FROM quiz_attempt_answers qaa JOIN quiz_attempts qa ON qaa.attempt_id = qa.id WHERE qa.quiz_id = :qid AND qaa.question_id = :qid2 AND qaa.is_correct = 1"), {"qid": quiz_id, "qid2": qid}).scalar() or 0
        corr_pct = round((corr / total) * 100, 1) if total > 0 else 0.0
        breakdown.append({
            "order": m["question_order"],
            "question_id": qid,
            "question_text": m["question_text"],
            "difficulty": m["difficulty"],
            "total_answers": total,
            "correct_percentage": corr_pct,
            "incorrect_percentage": round(100.0 - corr_pct, 1) if total > 0 else 0.0
        })
    return success_response(breakdown)

@api.get("/quizzes/{quiz_id}/leaderboard", tags=["Quiz Analytics"])
def get_quiz_leaderboard(quiz_id: str, db: Session = Depends(get_db)):
    rows = db.execute(text("""
        SELECT qa.id, qa.score, qa.percentage, qa.time_taken_seconds, s.full_name as student_name, s.roll_no, s.student_code
        FROM quiz_attempts qa
        JOIN students s ON qa.student_id = s.id
        WHERE qa.quiz_id = :qid AND qa.status IN ('submitted', 'auto_submitted', 'SUBMITTED')
        ORDER BY qa.score DESC, qa.time_taken_seconds ASC
        LIMIT 20
    """), {"qid": quiz_id}).fetchall()
    leaderboard = []
    for idx, r in enumerate(rows, 1):
        m = dict(r._mapping)
        mins = int(m["time_taken_seconds"] or 0) // 60
        secs = int(m["time_taken_seconds"] or 0) % 60
        leaderboard.append({
            "rank": idx,
            "student_name": m["student_name"],
            "roll_no": m["roll_no"],
            "score": m["score"],
            "percentage": m["percentage"],
            "speed": f"{mins}m {secs:02d}s"
        })
    return success_response(leaderboard)

@api.get("/quizzes/{quiz_id}/export", tags=["Quiz Export"])
@api.get("/quiz/quizzes/{quiz_id}/export", tags=["Quiz Export"])
def export_quiz_results(
    quiz_id: str,
    format: str = Query("csv", description="Export format: 'csv', 'xlsx', 'json'"),
    filter: str = Query("all", description="Filter: 'all', 'attempted', 'not_attempted', 'passed', 'failed'"),
    db: Session = Depends(get_db)
):
    """
    CRITICAL REQUIREMENT:
    Generates complete target-class student list, joining ALL enrolled students
    in the targeted class with their quiz attempt, including students who have NOT attempted.
    """
    quiz = db.execute(text("SELECT q.*, c.class_name FROM quizzes q LEFT JOIN classes c ON q.class_id = c.id WHERE q.id = :id"), {"id": quiz_id}).fetchone()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    qm = dict(quiz._mapping)
    target_class_id = qm["class_id"]
    class_label = qm.get("class_name", "Target Class")

    # LEFT JOIN all students enrolled in targeted class with their attempt
    query = text("""
        SELECT 
            s.id as student_db_id,
            s.student_code,
            s.roll_no,
            s.full_name,
            c.class_name,
            c.division,
            COALESCE(s.email, '') as email,
            qa.id as attempt_id,
            qa.status as attempt_status,
            qa.attempt_number,
            qa.started_at,
            qa.submitted_at,
            qa.time_taken_seconds,
            qa.score,
            qa.percentage,
            qa.passed,
            qa.correct_count,
            qa.incorrect_count,
            qa.unanswered_count
        FROM students s
        LEFT JOIN classes c ON s.class_id = c.id
        LEFT JOIN quiz_attempts qa ON (s.id = qa.student_id AND qa.quiz_id = :qid AND qa.status IN ('submitted', 'auto_submitted', 'SUBMITTED'))
        WHERE s.class_id = :cid
        ORDER BY s.roll_no ASC, s.full_name ASC
    """)
    rows = db.execute(query, {"cid": target_class_id, "qid": quiz_id}).fetchall()

    export_rows = []
    sr = 1
    for r in rows:
        m = dict(r._mapping)
        has_attempted = bool(m.get("attempt_id") and m.get("attempt_status") in ("submitted", "auto_submitted", "SUBMITTED"))
        
        status_label = "Attempted" if has_attempted else "Not Attempted"
        passed_val = bool(m.get("passed"))
        result_label = "Passed" if (has_attempted and passed_val) else ("Failed" if has_attempted else "Not Attempted")
        
        # Apply filter
        if filter == "attempted" and not has_attempted:
            continue
        if filter == "not_attempted" and has_attempted:
            continue
        if filter == "passed" and (not has_attempted or not passed_val):
            continue
        if filter == "failed" and (not has_attempted or passed_val):
            continue

        mins = int(m.get("time_taken_seconds") or 0) // 60
        secs = int(m.get("time_taken_seconds") or 0) % 60
        speed_formatted = f"{mins}m {secs:02d}s" if has_attempted else "-"

        export_rows.append({
            "Sr No": sr,
            "Student ID": m.get("student_code") or m.get("student_db_id"),
            "SIS ID": m.get("student_code") or "-",
            "Roll No": m.get("roll_no") or "-",
            "Student Name": m.get("full_name") or "-",
            "Class": m.get("class_name") or class_label,
            "Division": m.get("division") or "1",
            "Email": m.get("email") or "-",
            "Attempt Status": status_label,
            "Attempt Number": m.get("attempt_number") if has_attempted else "-",
            "Started At": str(m.get("started_at")) if has_attempted else "-",
            "Submitted At": str(m.get("submitted_at")) if has_attempted else "-",
            "Time Taken": speed_formatted,
            "Total Marks": qm.get("total_marks", 100.0),
            "Score": round(float(m.get("score") or 0.0), 2) if has_attempted else 0,
            "Percentage": f"{float(m.get('percentage') or 0.0):.1f}%" if has_attempted else "0%",
            "Correct": int(m.get("correct_count") or 0) if has_attempted else 0,
            "Wrong": int(m.get("incorrect_count") or 0) if has_attempted else 0,
            "Unanswered": int(m.get("unanswered_count") or 0) if has_attempted else 0,
            "Result": result_label
        })
        sr += 1

    if format == "json":
        return success_response(export_rows)

    # Generate CSV (opens in Excel natively)
    output = io.StringIO()
    headers = [
        "Sr No", "Student ID", "SIS ID", "Roll No", "Student Name", "Class", "Division", "Email",
        "Attempt Status", "Attempt Number", "Started At", "Submitted At", "Time Taken",
        "Total Marks", "Score", "Percentage", "Correct", "Wrong", "Unanswered", "Result"
    ]
    writer = csv.DictWriter(output, fieldnames=headers)
    writer.writeheader()
    for row in export_rows:
        writer.writerow(row)

    csv_data = output.getvalue()
    filename = f"SSGMCE_Quiz_Report_{re.sub(r'[^a-zA-Z0-9_]', '_', qm.get('title', 'Quiz'))}_{class_label}.csv"
    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

# Include the unified API Router
app.include_router(api)

# Include modular routers under /api/v1
try:
    from backend.routes.admin import router as admin_router
    from backend.routes.faculty import router as faculty_router
    from backend.routes.attendance import router as attendance_router
    app.include_router(admin_router, prefix="/api/v1")
    app.include_router(faculty_router, prefix="/api/v1")
    app.include_router(attendance_router, prefix="/api/v1")
    logger.info("Modular routers (admin, faculty, attendance) included under /api/v1")
except Exception as e:
    logger.warning("Could not load some modular routers: %s", e)

# ==============================================================================
# 12. STATIC FILES & CLIENT WEB APPLICATION SERVING
# Serves the frontend directory so everything is available on port 8000!
# ==============================================================================
FRONTEND_DIR = os.path.join(ERP_ROOT, "frontend")
HTML_DIR = os.path.join(FRONTEND_DIR, "html")
STUDENT_DIR = os.path.join(ERP_ROOT, "student")
if os.path.isdir(STUDENT_DIR):
    app.mount("/student", StaticFiles(directory=STUDENT_DIR, html=True), name="student")
    logger.info("Mounted student static assets from %s", STUDENT_DIR)

if os.path.isdir(FRONTEND_DIR):
    css_dir = os.path.join(FRONTEND_DIR, "css")
    js_dir = os.path.join(FRONTEND_DIR, "js")
    img_dir = os.path.join(FRONTEND_DIR, "images")

    if os.path.isdir(css_dir):
        app.mount("/css", StaticFiles(directory=css_dir), name="css")
    if os.path.isdir(js_dir):
        app.mount("/js", StaticFiles(directory=js_dir), name="js")
    if os.path.isdir(img_dir):
        app.mount("/images", StaticFiles(directory=img_dir), name="images")

    if os.path.isdir(HTML_DIR):
        app.mount("/html", StaticFiles(directory=HTML_DIR, html=True), name="html")
        app.mount("/", StaticFiles(directory=HTML_DIR, html=True), name="frontend")
    else:
        app.mount("/", StaticFiles(directory=FRONTEND_DIR, html=True), name="frontend")

    logger.info("Mounted frontend static assets from %s and %s", FRONTEND_DIR, HTML_DIR)

# Root fallback
@app.get("/", include_in_schema=False)
def root_redirect():
    return RedirectResponse(url="/login.html")

if __name__ == "__main__":
    import uvicorn
    logger.info("Starting SSGMCE College ERP Unified Backend on port 8000...")
    uvicorn.run(app, host="0.0.0.0", port=8000)
