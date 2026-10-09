"""
================================================================================
SSGMCE COLLEGE ERP — ACADEMIC RECORDS & MARKS SCHEMAS
Standardized Pydantic Request & Response Models for Marks Entry, Locking,
Publication, Revaluation, and Institutional Reporting
================================================================================
"""

from typing import Optional, List, Dict, Any, Union
from pydantic import BaseModel, Field, model_validator


class MarkItem(BaseModel):
    student_id: Optional[str] = None
    student_code: Optional[str] = None
    roll_no: Optional[str] = None
    internal_marks: float = Field(default=0.0, description="Internal Continuous Evaluation (CIE) marks")
    external_marks: float = Field(default=0.0, description="End Semester Exam (ESE) marks")
    practical_marks: Optional[float] = Field(default=0.0, description="Practical / Lab marks")
    assignment_marks: Optional[float] = Field(default=0.0, description="Assignments / Quizzes component")
    maximum_marks: Optional[float] = Field(default=100.0, description="Maximum total marks")
    max_internal: Optional[float] = Field(default=30.0, description="Maximum internal component marks")
    max_external: Optional[float] = Field(default=70.0, description="Maximum external component marks")
    remarks: Optional[str] = None

    @model_validator(mode="before")
    @classmethod
    def normalize_aliases(cls, data: Any) -> Any:
        if isinstance(data, dict):
            if "studentId" in data and not data.get("student_id"):
                data["student_id"] = data["studentId"]
            if "studentCode" in data and not data.get("student_code"):
                data["student_code"] = data["studentCode"]
            if "rollNo" in data and not data.get("roll_no"):
                data["roll_no"] = data["rollNo"]
            if "internalMarks" in data and not data.get("internal_marks"):
                data["internal_marks"] = data["internalMarks"]
            if "externalMarks" in data and not data.get("external_marks"):
                data["external_marks"] = data["externalMarks"]
            if "practicalMarks" in data and not data.get("practical_marks"):
                data["practical_marks"] = data["practicalMarks"]
            if "maximumMarks" in data and not data.get("maximum_marks"):
                data["maximum_marks"] = data["maximumMarks"]
        return data


class MarksEntryRequest(BaseModel):
    class_id: str = Field(..., description="Target Class ID or Class Name (e.g. '3R', '2R1')")
    subject_id: str = Field(..., description="Target Subject ID or Code (e.g. 'CS502', 'Theory of Computation')")
    semester_number: int = Field(default=5, ge=1, le=8, description="Autonomous Semester Number (1-8)")
    academic_year: Optional[str] = Field(default="2026-27")
    marks: List[MarkItem] = Field(default_factory=list, description="List of student marks entries")
    is_draft: Optional[bool] = Field(default=False, description="Save as draft work-in-progress without submission")

    @model_validator(mode="before")
    @classmethod
    def normalize_request(cls, data: Any) -> Any:
        if isinstance(data, dict):
            if "class" in data and not data.get("class_id"):
                data["class_id"] = data["class"]
            if "class_name" in data and not data.get("class_id"):
                data["class_id"] = data["class_name"]
            if "subject" in data and not data.get("subject_id"):
                data["subject_id"] = data["subject"]
            if "subject_code" in data and not data.get("subject_id"):
                data["subject_id"] = data["subject_code"]
            if "semester" in data and not data.get("semester_number"):
                data["semester_number"] = data["semester"]
            if "marks_data" in data and not data.get("marks"):
                data["marks"] = data["marks_data"]
        return data


class MarksLockRequest(BaseModel):
    class_id: str
    subject_id: str
    semester_number: int = 5
    reason: Optional[str] = "Marks entry locked by course instructor"

    @model_validator(mode="before")
    @classmethod
    def normalize_lock(cls, data: Any) -> Any:
        if isinstance(data, dict):
            if "class_name" in data and not data.get("class_id"):
                data["class_id"] = data["class_name"]
            if "subject_code" in data and not data.get("subject_id"):
                data["subject_id"] = data["subject_code"]
            if "semester" in data and not data.get("semester_number"):
                data["semester_number"] = data["semester"]
        return data


class MarksUnlockRequest(BaseModel):
    class_id: str
    subject_id: str
    semester_number: int = 5
    reason: str = Field(..., min_length=3, description="Mandatory audit justification for unlocking marks")

    @model_validator(mode="before")
    @classmethod
    def normalize_unlock(cls, data: Any) -> Any:
        if isinstance(data, dict):
            if "class_name" in data and not data.get("class_id"):
                data["class_id"] = data["class_name"]
            if "subject_code" in data and not data.get("subject_id"):
                data["subject_id"] = data["subject_code"]
            if "semester" in data and not data.get("semester_number"):
                data["semester_number"] = data["semester"]
        return data


class MarksVerifyRequest(BaseModel):
    class_id: str
    subject_id: str
    semester_number: int = 5
    remarks: Optional[str] = "Marks verified by Examination Cell"

    @model_validator(mode="before")
    @classmethod
    def normalize_verify(cls, data: Any) -> Any:
        if isinstance(data, dict):
            if "class_name" in data and not data.get("class_id"):
                data["class_id"] = data["class_name"]
            if "subject_code" in data and not data.get("subject_id"):
                data["subject_id"] = data["subject_code"]
            if "semester" in data and not data.get("semester_number"):
                data["semester_number"] = data["semester"]
        return data


class ResultPublishRequest(BaseModel):
    class_name: Optional[str] = None
    semester: Optional[int] = 5
    student_code: Optional[str] = None
    reason: Optional[str] = "Official end-semester result publication"


class ResultUnpublishRequest(BaseModel):
    class_name: Optional[str] = None
    semester: Optional[int] = 5
    student_code: Optional[str] = None
    reason: Optional[str] = "Administrative review hold / mark rectification"


class RevaluationApplyRequest(BaseModel):
    subject_code: str = Field(..., description="Subject code to re-evaluate")
    semester_number: int = Field(default=5, ge=1, le=8)
    reason: str = Field(..., min_length=5, description="Student's justification for revaluation")
    fee_receipt_no: Optional[str] = Field(default=None, description="Fee transaction reference ID")


class RevaluationReviewRequest(BaseModel):
    request_id: str = Field(..., description="Revaluation request UUID")
    status: str = Field(..., pattern="^(APPROVED|REJECTED)$", description="'APPROVED' or 'REJECTED'")
    revalued_internal: Optional[float] = None
    revalued_external: Optional[float] = None
    revalued_marks: Optional[float] = None
    comments: Optional[str] = "Reviewed by Examination Evaluation Board"

