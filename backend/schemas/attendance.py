"""
================================================================================
SSGMCE COLLEGE ERP — ATTENDANCE SCHEMAS
Comprehensive schemas for Attendance Sessions, Marking, Audit, and Governance
================================================================================
"""

from typing import List, Optional, Dict, Any, Union
from datetime import datetime, timezone
from pydantic import BaseModel, Field, model_validator


class AttendanceRecordItem(BaseModel):
    student_id: str
    status: Optional[str] = "present"  # "present", "absent", "leave", "exempt"
    is_present: Optional[bool] = None
    remarks: Optional[str] = None


class AttendanceDraftRequest(BaseModel):
    class_id: str = "3R"
    subject_id: str = "5CS220PC"
    session_date: str = Field(default_factory=lambda: datetime.now(timezone.utc).strftime("%Y-%m-%d"))
    period_number: Union[int, str] = 1
    session_type: str = "theory"
    present_student_ids: Optional[List[str]] = []
    absent_student_ids: Optional[List[str]] = []
    records: Optional[List[Dict[str, Any]]] = []
    attendance_records: Optional[List[Dict[str, Any]]] = []
    topic_taught: Optional[str] = None
    remark: Optional[str] = None

    @model_validator(mode="before")
    @classmethod
    def normalize_fields(cls, data: Any) -> Any:
        if isinstance(data, dict):
            # Normalize class_id aliases
            if not data.get("class_id"):
                data["class_id"] = data.get("classCode") or data.get("class_name") or data.get("division") or data.get("class") or "3R"
            # Normalize subject_id aliases
            if not data.get("subject_id"):
                data["subject_id"] = data.get("subject") or data.get("subjectCode") or data.get("subject_code") or data.get("course") or "5CS220PC"
            # Normalize session_date aliases
            if not data.get("session_date"):
                data["session_date"] = data.get("date") or data.get("lectureDate") or datetime.now(timezone.utc).strftime("%Y-%m-%d")
            # Normalize period_number aliases
            if not data.get("period_number"):
                data["period_number"] = data.get("period") or data.get("timeSlot") or data.get("lectureTime") or 1
        return data


class AttendanceSubmitRequest(BaseModel):
    class_id: str = "3R"
    subject_id: str = "5CS220PC"
    session_date: str = Field(default_factory=lambda: datetime.now(timezone.utc).strftime("%Y-%m-%d"))
    period_number: Union[int, str] = 1
    session_type: str = "theory"
    present_student_ids: Optional[List[str]] = []
    absent_student_ids: Optional[List[str]] = []
    records: Optional[List[Dict[str, Any]]] = []
    attendance_records: Optional[List[Dict[str, Any]]] = []
    topic_taught: Optional[str] = None
    remark: Optional[str] = None

    @model_validator(mode="before")
    @classmethod
    def normalize_fields(cls, data: Any) -> Any:
        if isinstance(data, dict):
            # Normalize class_id aliases
            if not data.get("class_id"):
                data["class_id"] = data.get("classCode") or data.get("class_name") or data.get("division") or data.get("class") or "3R"
            # Normalize subject_id aliases
            if not data.get("subject_id"):
                data["subject_id"] = data.get("subject") or data.get("subjectCode") or data.get("subject_code") or data.get("course") or "5CS220PC"
            # Normalize session_date aliases
            if not data.get("session_date"):
                data["session_date"] = data.get("date") or data.get("lectureDate") or datetime.now(timezone.utc).strftime("%Y-%m-%d")
            # Normalize period_number aliases
            if not data.get("period_number"):
                data["period_number"] = data.get("period") or data.get("timeSlot") or data.get("lectureTime") or 1
        return data


class AttendanceLockRequest(BaseModel):
    session_id: str
    reason: Optional[str] = "Standard session locking"


class AttendanceUnlockRequest(BaseModel):
    session_id: str
    reason: Optional[str] = "Administrative correction unlock"


class AttendanceApproveRequest(BaseModel):
    session_id: str
    remark: Optional[str] = "Approved by Department Authority"
