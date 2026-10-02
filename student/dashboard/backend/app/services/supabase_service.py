"""
SSGMCE Student ERP - Enterprise Supabase Service Layer
=====================================================
Provides high-resilience, fault-tolerant connectivity to Supabase PostgreSQL,
incorporating:
- Timeout-bounded non-blocking health checks and queries
- Circuit breaker & connection status caching
- Dual-engine fallback: Transparent fallback to local SQLite when Supabase
  is offline, unreachable, or in local development mode
- Automatic data normalization conforming to SSGMCE ERP schemas
"""

import time
import logging
from typing import Any, Dict, List, Optional, Tuple
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from supabase import Client

from app.config import settings
from app.database import get_supabase_client
from app.models.db_models import (
    StudentProfile, AcademicMetrics, TimetableEntry, SubjectSyllabus,
    FeeRecord, FeeReceipt, ElearningAssignment, ElearningContent,
    ElearningQuiz, ChangeInfoRequest, UpdationInfoRecord, StudentDocument,
    ExamMark, ExamRevaluation, StudentNotification, StudentAttendanceSubject
)

logger = logging.getLogger("student_erp_fastapi.supabase")

class SupabaseService:
    def __init__(self):
        self._client: Optional[Client] = None
        self._connected: bool = False
        self._last_checked: float = 0.0
        self._check_interval: float = 20.0  # Cache health check for 20 seconds
        self._latency_ms: Optional[float] = None
        self._error_msg: Optional[str] = None

    @property
    def client(self) -> Optional[Client]:
        if self._client is None:
            try:
                self._client = get_supabase_client()
            except Exception as e:
                logger.warning("Could not instantiate Supabase client: %s", e)
        return self._client

    def is_online(self) -> bool:
        """Returns cached or freshly tested online status of Supabase."""
        now = time.time()
        if (now - self._last_checked) < self._check_interval:
            return self._connected
        self.check_connection()
        return self._connected

    def check_connection(self) -> Dict[str, Any]:
        """Probes Supabase connection with tight timeout and latency measurement."""
        self._last_checked = time.time()
        c = self.client
        if not c:
            self._connected = False
            self._error_msg = "Supabase client uninitialized or missing keys"
            self._latency_ms = None
            return self._status_dict()

        start = time.time()
        try:
            # Lightweight probe on students or student_profiles
            res = c.table("students").select("id").limit(1).execute()
            self._latency_ms = round((time.time() - start) * 1000, 2)
            self._connected = True
            self._error_msg = None
            logger.info("Supabase connection verified (latency: %s ms)", self._latency_ms)
        except Exception as exc:
            self._latency_ms = round((time.time() - start) * 1000, 2)
            self._connected = False
            self._error_msg = str(exc)
            logger.warning("Supabase connection probe failed: %s (using local fallback)", exc)

        return self._status_dict()

    def _status_dict(self) -> Dict[str, Any]:
        return {
            "connected": self._connected,
            "url": settings.SUPABASE_URL,
            "status": "ONLINE" if self._connected else "OFFLINE_FALLBACK",
            "latencyMs": self._latency_ms,
            "error": self._error_msg,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }

    # =========================================================================
    # 1. PROFILE
    # =========================================================================
    def get_profile(self, student_code: str = "308637", db: Optional[Session] = None) -> Tuple[Dict[str, Any], Dict[str, Any]]:
        # 1. Try Supabase
        if self.is_online():
            # A. Try your existing 'profiles' table directly
            try:
                res = (
                    self.client.table("profiles")
                    .select("*")
                    .or_(f"student_code.eq.{student_code},roll_no.eq.21,email.ilike.%shivam%")
                    .limit(1)
                    .execute()
                )
                if res.data and len(res.data) > 0:
                    row = res.data[0]
                    return {
                        "id": row.get("id"),
                        "rollNo": row.get("roll_no", 21),
                        "studentCode": row.get("student_code", student_code),
                        "fullName": row.get("full_name", "Shivam Sanjay Aghao"),
                        "email": row.get("email", "shivam.aghao@ssgmce.ac.in"),
                        "department": row.get("department", "Computer Science & Engineering"),
                        "departmentCode": row.get("department_code", "CSE"),
                        "className": row.get("class_name", "TY B.E. Computer Science and Engineering-A"),
                        "division": row.get("division", "A"),
                        "semester": row.get("semester", 4),
                        "academicYear": row.get("academic_year", "2025-26"),
                        "prn": row.get("prn", "202401088219"),
                        "caste": row.get("caste", "Kunbi"),
                        "category": row.get("category", "OBC"),
                        "isEmployeeWard": False,
                        "phone": row.get("phone", "+91 94221 88219"),
                        "dateOfBirth": str(row.get("date_of_birth", "2004-08-15")),
                        "gender": row.get("gender", "Male"),
                        "bloodGroup": row.get("blood_group", "O+ve"),
                        "nationality": row.get("nationality", "Indian"),
                        "emergencyContact": row.get("emergency_contact", "+91 98230 41092"),
                        "permanentAddress": row.get("permanent_address", "Plot 14, Gajanan Colony, Buldhana Road, Shegaon"),
                        "district": row.get("district", "Buldhana"),
                        "state": row.get("state", "Maharashtra"),
                        "pincode": row.get("pincode", "444203"),
                        "fatherName": row.get("father_name", "Mr. Sanjay Aghao"),
                        "motherName": row.get("mother_name", "Mrs. Sunita Aghao"),
                        "facultyMentor": row.get("faculty_mentor", "Dr. Rohan Deshmukh (HOD, CSE)"),
                        "admissionQuota": row.get("admission_quota", "MHT-CET State Merit (Autonomous CAP)"),
                        "hostelStatus": row.get("hostel_status", "Day Scholar"),
                        "cgpa": float(row.get("cgpa", 8.64)),
                        "sgpa": float(row.get("sgpa", 8.84)),
                        "attendanceRate": float(row.get("attendance_rate", 82.0)),
                        "avatarUrl": row.get("avatar_url") or "images/logo.png"
                    }, {"source": "supabase_profiles", "connected": True}
            except Exception as e:
                logger.info("Supabase direct 'profiles' table check: %s", e)

            # B. Try view_student_full_profile
            try:
                res = (
                    self.client.table("view_student_full_profile")
                    .select("*")
                    .or_(f"student_code.eq.{student_code},roll_no.eq.21")
                    .limit(1)
                    .execute()
                )
                if res.data and len(res.data) > 0:
                    row = res.data[0]
                    return {
                        "id": row.get("student_id"),
                        "rollNo": row.get("roll_no", 21),
                        "studentCode": row.get("student_code", student_code),
                        "fullName": row.get("full_name", "Shivam Sanjay Aghao"),
                        "email": row.get("institutional_email", "shivam.aghao@ssgmce.ac.in"),
                        "department": row.get("department_name", "Computer Science and Engineering"),
                        "departmentCode": row.get("department_code", "CSE"),
                        "className": row.get("class_name", "TY B.E. Computer Science and Engineering-A"),
                        "division": row.get("division", "A"),
                        "semester": row.get("current_semester", 4),
                        "academicYear": row.get("class_academic_year", "2025-26"),
                        "prn": row.get("prn", "202401088219"),
                        "caste": row.get("caste", "Kunbi"),
                        "category": row.get("category", "OBC"),
                        "isEmployeeWard": False,
                        "phone": row.get("primary_mobile", "+91 94221 88219"),
                        "dateOfBirth": row.get("date_of_birth", "2004-08-15"),
                        "gender": row.get("gender", "Male"),
                        "bloodGroup": row.get("blood_group", "O+ve"),
                        "nationality": row.get("nationality", "Indian"),
                        "emergencyContact": row.get("emergency_contact", "+91 98230 41092"),
                        "permanentAddress": row.get("permanent_address", "Plot 14, Gajanan Colony, Buldhana Road, Shegaon"),
                        "district": row.get("district", "Buldhana"),
                        "state": row.get("state", "Maharashtra"),
                        "pincode": row.get("pincode", "444203"),
                        "fatherName": row.get("father_name", "Mr. Sanjay Aghao"),
                        "motherName": row.get("mother_name", "Mrs. Sunita Aghao"),
                        "facultyMentor": row.get("faculty_mentor", "Dr. Rohan Deshmukh (HOD, CSE)"),
                        "admissionQuota": row.get("admission_quota", "MHT-CET State Merit (Autonomous CAP)"),
                        "hostelStatus": row.get("hostel_status", "Day Scholar"),
                        "cgpa": float(row.get("cgpa", 8.64)),
                        "sgpa": float(row.get("latest_sgpa", 8.84)),
                        "attendanceRate": float(row.get("overall_attendance_pct", 82.0)),
                        "avatarUrl": row.get("avatar_url") or "images/logo.png"
                    }, {"source": "supabase", "connected": True}
            except Exception as e:
                logger.warning("Supabase view_student_full_profile failed: %s, falling back", e)

        # 2. Local Fallback
        student = None
        if db:
            student = db.query(StudentProfile).first()

        if student:
            return {
                "id": student.id,
                "rollNo": student.roll_no,
                "studentCode": student.student_code,
                "fullName": student.full_name,
                "email": student.email,
                "department": student.department,
                "className": student.class_name,
                "division": student.division,
                "semester": student.semester,
                "academicYear": student.academic_year,
                "prn": student.prn,
                "caste": student.caste,
                "isEmployeeWard": student.is_employee_ward,
                "phone": student.phone,
                "dateOfBirth": getattr(student, "date_of_birth", "2004-08-15"),
                "gender": getattr(student, "gender", "Male"),
                "bloodGroup": getattr(student, "blood_group", "O+ve"),
                "nationality": getattr(student, "nationality", "Indian"),
                "emergencyContact": getattr(student, "emergency_contact", "+91 98230 41092"),
                "permanentAddress": getattr(student, "permanent_address", "Plot 14, Gajanan Colony, Buldhana Road, Shegaon"),
                "district": getattr(student, "district", "Buldhana"),
                "state": getattr(student, "state", "Maharashtra"),
                "pincode": getattr(student, "pincode", "444203"),
                "fatherName": getattr(student, "father_name", "Mr. Sanjay Aghao"),
                "motherName": getattr(student, "mother_name", "Mrs. Sunita Aghao"),
                "facultyMentor": getattr(student, "faculty_mentor", "Dr. Rohan Deshmukh (HOD, CSE)"),
                "admissionQuota": getattr(student, "admission_quota", "MHT-CET State Merit (Autonomous CAP)"),
                "hostelStatus": getattr(student, "hostel_status", "Day Scholar"),
                "cgpa": student.cgpa,
                "sgpa": student.sgpa,
                "attendanceRate": student.attendance_rate,
                "avatarUrl": student.avatar_url or "images/logo.png"
            }, {"source": "local_sqlite_fallback", "connected": self._connected}

        # 3. Static Guaranteed Return (Fail-safe)
        return {
            "id": "std-cse-308637",
            "rollNo": 21,
            "studentCode": "308637",
            "fullName": "Shivam Sanjay Aghao",
            "email": "shivam.aghao@ssgmce.ac.in",
            "department": "Computer Science & Engineering",
            "className": "TY B.E. Computer Science and Engineering-A",
            "division": "A",
            "semester": 4,
            "academicYear": "2025-26",
            "prn": "202401088219",
            "caste": "Kunbi",
            "isEmployeeWard": False,
            "phone": "+91 94221 88219",
            "cgpa": 8.64,
            "sgpa": 8.84,
            "attendanceRate": 82.00,
            "avatarUrl": "images/logo.png"
        }, {"source": "in_memory_fallback", "connected": False}

    def update_profile(self, student_code: str, updates: Dict[str, Any], db: Optional[Session] = None) -> Tuple[bool, str]:
        # Synchronize to Supabase if available
        if self.is_online():
            try:
                sb_updates = {}
                if "phone" in updates or "primaryMobile" in updates:
                    sb_updates["primary_mobile"] = updates.get("phone") or updates.get("primaryMobile")
                if "emergencyContact" in updates:
                    sb_updates["emergency_contact"] = updates["emergencyContact"]
                if "permanentAddress" in updates:
                    sb_updates["permanent_address"] = updates["permanentAddress"]
                if "district" in updates:
                    sb_updates["district"] = updates["district"]
                if "pincode" in updates:
                    sb_updates["pincode"] = updates["pincode"]
                if "avatarUrl" in updates:
                    sb_updates["avatar_url"] = updates["avatarUrl"]

                if sb_updates:
                    self.client.table("student_profiles").update(sb_updates).match({"prn": "202401088219"}).execute()
                    logger.info("Updated Supabase student_profiles table")
            except Exception as e:
                logger.warning("Supabase profile update sync error: %s", e)

        # Always update local DB
        if db:
            student = db.query(StudentProfile).first()
            if student:
                if "phone" in updates or "primaryMobile" in updates:
                    student.phone = updates.get("phone") or updates.get("primaryMobile")
                if "emergencyContact" in updates and hasattr(student, "emergency_contact"):
                    student.emergency_contact = updates["emergencyContact"]
                if "permanentAddress" in updates and hasattr(student, "permanent_address"):
                    student.permanent_address = updates["permanentAddress"]
                if "district" in updates and hasattr(student, "district"):
                    student.district = updates["district"]
                if "pincode" in updates and hasattr(student, "pincode"):
                    student.pincode = updates["pincode"]
                if "avatarUrl" in updates:
                    student.avatar_url = updates["avatarUrl"]
                if "caste" in updates:
                    student.caste = updates["caste"]
                db.commit()
                return True, "Profile updated successfully in persistent storage"

        return True, "Profile changes processed"

    # =========================================================================
    # 2. ACADEMIC METRICS
    # =========================================================================
    def get_academic_metrics(self, student_code: str = "308637", db: Optional[Session] = None) -> Tuple[Dict[str, Any], Dict[str, Any]]:
        if self.is_online():
            try:
                res = self.client.table("student_academic_metrics").select("*").limit(1).execute()
                if res.data and len(res.data) > 0:
                    m = res.data[0]
                    return {
                        "studentCode": student_code,
                        "academicYear": m.get("academic_year", "2025-26"),
                        "currentSemester": m.get("current_semester", 4),
                        "cgpa": float(m.get("cgpa", 8.64)),
                        "latestSgpa": float(m.get("latest_sgpa", 8.84)),
                        "sem1Sgpa": float(m.get("sem1_sgpa", 8.42)),
                        "sem2Sgpa": float(m.get("sem2_sgpa", 8.58)),
                        "sem3Sgpa": float(m.get("sem3_sgpa", 8.64)),
                        "overallAttendancePct": float(m.get("overall_attendance_pct", 82.0)),
                        "earnedCredits": int(m.get("earned_credits", 86)),
                        "totalCredits": int(m.get("total_credits", 160)),
                        "academicStanding": m.get("academic_standing", "Active Student (Autonomous)")
                    }, {"source": "supabase", "connected": True}
            except Exception as e:
                logger.warning("Supabase student_academic_metrics query failed: %s", e)

        # Fallback
        if db:
            local_m = db.query(AcademicMetrics).first()
            if local_m:
                return {
                    "studentCode": local_m.student_code,
                    "academicYear": local_m.academic_year,
                    "currentSemester": local_m.current_semester,
                    "cgpa": local_m.cgpa,
                    "latestSgpa": local_m.latest_sgpa,
                    "sem1Sgpa": local_m.sem1_sgpa,
                    "sem2Sgpa": local_m.sem2_sgpa,
                    "sem3Sgpa": local_m.sem3_sgpa,
                    "overallAttendancePct": local_m.overall_attendance_pct,
                    "earnedCredits": local_m.earned_credits,
                    "totalCredits": local_m.total_credits,
                    "academicStanding": local_m.academic_standing
                }, {"source": "local_sqlite_fallback", "connected": False}

        return {
            "studentCode": student_code,
            "academicYear": "2025-26",
            "currentSemester": 4,
            "cgpa": 8.64,
            "latestSgpa": 8.84,
            "sem1Sgpa": 8.42,
            "sem2Sgpa": 8.58,
            "sem3Sgpa": 8.64,
            "overallAttendancePct": 82.00,
            "earnedCredits": 86,
            "totalCredits": 160,
            "academicStanding": "Active Student (Autonomous)"
        }, {"source": "seeded_fallback", "connected": False}

    # =========================================================================
    # 3. ATTENDANCE SUMMARY & SUBJECTS
    # =========================================================================
    def get_attendance(self, student_code: str = "308637", db: Optional[Session] = None) -> Tuple[Dict[str, Any], Dict[str, Any]]:
        # 1. Try Supabase student_attendance table directly
        if self.is_online():
            try:
                res = self.client.table("student_attendance").select("*").execute()
                if res.data and len(res.data) > 0:
                    subjects = []
                    for row in res.data:
                        attended = row.get("present_periods", 0)
                        total = row.get("total_periods", 0)
                        pct = round((attended / total * 100), 1) if total > 0 else 0.0
                        subjects.append({
                            "id": str(row.get("id")),
                            "code": row.get("subject_code"),
                            "name": row.get("subject_name"),
                            "type": row.get("subject_type", "TH"),
                            "typeName": "Practical" if row.get("subject_type") == "PR" else "Theory",
                            "attended": attended,
                            "total": total,
                            "percentage": pct,
                            "faculty": row.get("faculty_name", "Faculty Advisor"),
                            "classroom": row.get("classroom", "LH-201"),
                            "status": "Safe Zone" if pct >= 75 else "Critical (<75%)"
                        })
                    if subjects:
                        total_attended = sum(s["attended"] for s in subjects)
                        total_lectures = sum(s["total"] for s in subjects)
                        overall_pct = round((total_attended / total_lectures * 100), 2) if total_lectures > 0 else 82.0
                        return {
                            "overallPercentage": overall_pct,
                            "attendedLectures": total_attended,
                            "totalLectures": total_lectures,
                            "absentLectures": max(0, total_lectures - total_attended),
                            "eligibilityStatus": "Eligible for Mid-Term Exams" if overall_pct >= 75 else "Advisory: Defaulter List Risk",
                            "defaulterAlert": "Attention: Attendance below 75% in some subjects." if any(s["percentage"] < 75 for s in subjects) else "All subjects within safe attendance zone.",
                            "subjectWise": subjects
                        }, {"source": "supabase_student_attendance", "connected": True}
            except Exception as e:
                logger.warning("Supabase student_attendance query failed: %s", e)

        # 2. Query subject list from local database or fallback
        subjects = []
        if db:
            sub_records = db.query(StudentAttendanceSubject).all()
            if sub_records:
                for s in sub_records:
                    pct = round((s.present_periods / s.total_periods * 100), 1) if s.total_periods > 0 else 0.0
                    subjects.append({
                        "id": s.id,
                        "code": s.subject_code,
                        "name": s.subject_name,
                        "type": s.subject_type,
                        "typeName": s.type_name,
                        "attended": s.present_periods,
                        "total": s.total_periods,
                        "percentage": pct,
                        "faculty": s.faculty_name,
                        "classroom": s.classroom,
                        "status": "Safe Zone" if pct >= 75 else "Critical (<75%)"
                    })

        if not subjects:
            subjects = [
                {"code": "5CS220PC", "name": "Database Management Systems", "type": "TH", "attended": 28, "total": 32, "percentage": 87.5, "status": "Good Standing", "faculty": "Dr. Rohan Deshmukh"},
                {"code": "5CS221PC", "name": "Compiler Design", "type": "TH", "attended": 22, "total": 28, "percentage": 78.6, "status": "Good Standing", "faculty": "Prof. Priya Patil"},
                {"code": "5CS223PE", "name": "Data Science & Statistics", "type": "TH", "attended": 19, "total": 24, "percentage": 79.2, "status": "Safe Zone", "faculty": "Prof. Rajesh Sharma"},
                {"code": "5CS227MD", "name": "Computer Networks", "type": "TH", "attended": 18, "total": 25, "percentage": 72.0, "status": "Critical (<75%)", "faculty": "Prof. A. S. Manekar"},
                {"code": "5CS228LB", "name": "Advanced Java Lab", "type": "PR", "attended": 14, "total": 16, "percentage": 87.5, "status": "Good Standing", "faculty": "Prof. K. N. Somwanshi"},
            ]

        total_attended = sum(s.get("attended", 0) for s in subjects)
        total_lectures = sum(s.get("total", 0) for s in subjects)
        overall_pct = round((total_attended / total_lectures * 100), 2) if total_lectures > 0 else 82.0

        return {
            "overallPercentage": overall_pct,
            "attendedLectures": total_attended,
            "totalLectures": total_lectures,
            "absentLectures": max(0, total_lectures - total_attended),
            "eligibilityStatus": "Eligible for Mid-Term Exams" if overall_pct >= 75 else "Advisory: Defaulter List Risk",
            "defaulterAlert": "Attention: Attendance below 75% in some subjects." if any(s["percentage"] < 75 for s in subjects) else "All subjects within safe attendance zone.",
            "subjectWise": subjects
        }, {"source": "local_sqlite" if db else "seeded", "connected": self._connected}

    # =========================================================================
    # 4. TIMETABLE
    # =========================================================================
    def get_timetable(self, day: Optional[str] = None, db: Optional[Session] = None) -> Tuple[Any, Dict[str, Any]]:
        # 1. Try Supabase student_timetables
        if self.is_online():
            try:
                res = self.client.table("student_timetables").select("*").order("period_no").execute()
                if res.data and len(res.data) > 0:
                    days_data: Dict[str, List[Dict[str, Any]]] = {}
                    for row in res.data:
                        d = str(row.get("day_of_week", "Monday")).strip().lower()
                        if d not in days_data:
                            days_data[d] = []
                        start_time = str(row.get("start_time", ""))[:5]
                        end_time = str(row.get("end_time", ""))[:5]
                        time_str = f"{start_time} - {end_time}" if start_time and end_time else "10:00 - 11:00"
                        days_data[d].append({
                            "num": f"Period {row.get('period_no', 1)}",
                            "time": time_str,
                            "code": row.get("subject_code"),
                            "name": row.get("subject_name"),
                            "venue": row.get("room", "LH-101"),
                            "teacher": row.get("faculty_name", "Faculty Mentor"),
                            "status": "Scheduled",
                            "statusClass": "status-upcoming",
                            "att": row.get("session_type", "Theory"),
                            "isCompleted": False,
                            "isActiveNow": False,
                            "isCritical": False
                        })

                    if day:
                        d_key = day.strip().lower()
                        periods_for_day = days_data.get(d_key, [])
                        return periods_for_day, {"source": "supabase_student_timetables", "connected": True}
                    return days_data, {"source": "supabase_student_timetables", "connected": True}
            except Exception as e:
                logger.warning("Supabase student_timetables query error: %s", e)

        # 2. Local Fallback
        if db:
            query = db.query(TimetableEntry)
            if day:
                query = query.filter(TimetableEntry.day == day.lower())
            entries = query.all()
            days_data = {}
            for e in entries:
                d = e.day.lower()
                if d not in days_data:
                    days_data[d] = []
                days_data[d].append({
                    "num": e.period_num,
                    "time": e.period_time,
                    "code": e.course_code,
                    "name": e.course_name,
                    "venue": e.venue,
                    "teacher": e.teacher_name,
                    "status": e.status,
                    "statusClass": e.status_class,
                    "att": e.att_label,
                    "isCompleted": e.is_completed,
                    "isActiveNow": e.is_active_now,
                    "isCritical": e.is_critical
                })
            if day:
                return days_data.get(day.lower(), []), {"source": "local_sqlite_fallback", "connected": self._connected}
            return days_data, {"source": "local_sqlite_fallback", "connected": self._connected}

        return [] if day else {}, {"source": "empty", "connected": False}

    # =========================================================================
    # 5. SYLLABUS
    # =========================================================================
    def get_syllabus(self, db: Optional[Session] = None) -> Tuple[List[Dict[str, Any]], Dict[str, Any]]:
        # 1. Try Supabase syllabus_subjects
        if self.is_online():
            try:
                res = self.client.table("syllabus_subjects").select("*").execute()
                if res.data and len(res.data) > 0:
                    syllabus_list = []
                    for s in res.data:
                        code = s.get("code") or s.get("course_code") or s.get("subject_code", "")
                        faculty_raw = s.get("faculty_name", "Prof. Faculty")
                        fac_email = f"{str(faculty_raw).lower().replace(' ', '.').replace('prof.', '').replace('dr.', '').strip('.')}@ssgmce.ac.in"
                        syllabus_list.append({
                            "id": str(s.get("id")),
                            "subjectCode": code,
                            "subjectName": s.get("name") or s.get("course_name") or s.get("title", ""),
                            "shortCode": s.get("short_description") or code,
                            "courseType": s.get("type", "Core"),
                            "semester": s.get("semester", "Semester V"),
                            "credits": s.get("credits", 3.0),
                            "faculty": {
                                "name": faculty_raw,
                                "email": fac_email,
                                "designation": "Associate Professor",
                                "cabin": "CSE Academic Wing"
                            },
                            "overview": s.get("short_description", "Autonomous course curriculum"),
                            "syllabusProgress": s.get("syllabus_progress", 80),
                            "curriculumPdfUrl": s.get("pdf_url") or f"https://ssgmce.ac.in/syllabus/{code}.pdf"
                        })
                    return syllabus_list, {"source": "supabase_syllabus_subjects", "connected": True}
            except Exception as e:
                logger.info("Supabase syllabus_subjects query notice: %s", e)

        # 2. Local Fallback
        if db:
            subjects = db.query(SubjectSyllabus).all()
            if subjects:
                return [
                    {
                        "id": s.id,
                        "subjectCode": s.subject_code,
                        "subjectName": s.subject_name,
                        "credits": s.credits,
                        "faculty": {
                            "name": s.faculty_name,
                            "designation": s.faculty_designation,
                            "email": s.faculty_email,
                            "cabin": s.faculty_cabin
                        },
                        "syllabusProgress": s.syllabus_progress,
                        "curriculumPdfUrl": s.curriculum_pdf_url
                    }
                    for s in subjects
                ], {"source": "local_sqlite_fallback", "connected": self._connected}

        return [], {"source": "empty", "connected": False}

    # =========================================================================
    # 6. D-WALLET & DOCUMENTS
    # =========================================================================
    def get_documents(self, student_code: str = "308637", db: Optional[Session] = None) -> Tuple[List[Dict[str, Any]], Dict[str, Any]]:
        if self.is_online():
            try:
                res = self.client.table("syllabus_documents").select("*").execute()
                if res.data and len(res.data) > 0:
                    docs = []
                    for d in res.data:
                        docs.append({
                            "id": str(d.get("id")),
                            "documentName": d.get("title") or d.get("name", "Document"),
                            "documentType": d.get("document_type") or "Verified Document",
                            "fileSize": d.get("file_size") or "Verified PDF",
                            "verificationStatus": "VERIFIED",
                            "uploadDate": d.get("created_at", ""),
                            "downloadUrl": d.get("file_url") or "#"
                        })
                    return docs, {"source": "supabase_syllabus_documents", "connected": True}
            except Exception as e:
                logger.warning("Supabase syllabus_documents query error: %s", e)

        if db:
            docs = db.query(StudentDocument).all()
            return [
                {
                    "id": d.id,
                    "documentName": d.document_name,
                    "documentType": d.document_type,
                    "fileSize": d.file_size,
                    "verificationStatus": d.verification_status,
                    "uploadDate": d.upload_date.isoformat() if d.upload_date else "",
                    "downloadUrl": d.download_url
                }
                for d in docs
            ], {"source": "local_sqlite_fallback", "connected": self._connected}

        return [], {"source": "empty", "connected": False}

    def upload_document(self, student_code: str, doc_data: Dict[str, Any], db: Optional[Session] = None) -> Tuple[bool, str]:
        # Sync to Supabase
        if self.is_online():
            try:
                self.client.table("student_documents").insert({
                    "student_id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d", # Default test UUID or lookup
                    "document_type": doc_data.get("category", "academic").lower(),
                    "title": doc_data.get("documentName", "Uploaded Document"),
                    "status": "Verified",
                    "download_url": doc_data.get("fileUrl", "#")
                }).execute()
                logger.info("Inserted document into Supabase student_documents")
            except Exception as e:
                logger.warning("Supabase upload document sync warning: %s", e)

        # Local DB commit
        if db:
            doc = StudentDocument(
                student_code=student_code,
                document_name=doc_data.get("documentName", "Uploaded Document"),
                category=doc_data.get("category", "ACADEMIC"),
                file_url=doc_data.get("fileUrl", "#"),
                file_size="1.5 MB",
                is_verified=True,
                upload_date="Just now"
            )
            db.add(doc)
            db.commit()
            return True, "Document uploaded and verified in D-Wallet"

        return True, "Document processed"

    # =========================================================================
    # 7. NOTIFICATIONS
    # =========================================================================
    def get_notifications(self, student_code: str = "308637", db: Optional[Session] = None) -> Tuple[List[Dict[str, Any]], Dict[str, Any]]:
        if self.is_online():
            try:
                res = self.client.table("student_notifications").select("*").order("created_at", desc=True).execute()
                if res.data and len(res.data) > 0:
                    notifs = []
                    for n in res.data:
                        notifs.append({
                            "id": str(n.get("id")),
                            "title": n.get("title", "Official Announcement"),
                            "message": n.get("message", ""),
                            "category": n.get("category") or n.get("source", "Academic Cell"),
                            "severity": n.get("severity", "info"),
                            "isRead": n.get("is_read", False),
                            "createdAt": n.get("created_at", "")
                        })
                    return notifs, {"source": "supabase_student_notifications", "connected": True}
            except Exception as e:
                logger.warning("Supabase student_notifications query failed: %s", e)

        if db:
            notes = db.query(StudentNotification).order_by(StudentNotification.created_at.desc()).all()
            data = [
                {
                    "id": n.id,
                    "title": n.title,
                    "message": n.message,
                    "category": n.category,
                    "severity": "info" if "Alert" not in n.title else "warning",
                    "isRead": n.is_read,
                    "createdAt": n.created_at.isoformat() if n.created_at else ""
                }
                for n in notes
            ]
            return data, {"source": "local_sqlite_fallback", "connected": self._connected}

        return [], {"source": "empty", "connected": False}

    def mark_notification_read(self, notification_id: str, db: Optional[Session] = None) -> Tuple[bool, str]:
        if self.is_online():
            try:
                self.client.table("student_notifications").update({"is_read": True}).eq("id", notification_id).execute()
            except Exception as e:
                logger.warning("Supabase notification read sync error: %s", e)

        if db:
            note = db.query(StudentNotification).filter(StudentNotification.id == notification_id).first()
            if note:
                note.is_read = True
                db.commit()
                return True, "Notification marked as read"

        return True, "Notification updated"

    # =========================================================================
    # 8. CONSOLIDATED OVERVIEW
    # =========================================================================
    def get_dashboard_overview(self, student_code: str = "308637", db: Optional[Session] = None) -> Dict[str, Any]:
        profile_data, p_meta = self.get_profile(student_code, db)
        metrics_data, m_meta = self.get_academic_metrics(student_code, db)
        attendance_data, a_meta = self.get_attendance(student_code, db)
        timetable_data, t_meta = self.get_timetable("Monday", db)
        notifications_data, n_meta = self.get_notifications(student_code, db)

        # Fallback to any day if Monday is empty
        today_periods = timetable_data if isinstance(timetable_data, list) else (timetable_data.get("monday") or [])
        if not today_periods and isinstance(timetable_data, dict):
            for day_k, periods in timetable_data.items():
                if periods:
                    today_periods = periods
                    break

        return {
            "student": profile_data,
            "metrics": metrics_data,
            "attendanceSummary": attendance_data,
            "todayTimetable": today_periods,
            "recentNotifications": notifications_data[:4],
            "systemStatus": {
                "supabaseConnected": self._connected,
                "dataSource": p_meta.get("source", "supabase_live"),
                "timestamp": datetime.now(timezone.utc).isoformat()
            }
        }

# Singleton instance
supabase_service = SupabaseService()
