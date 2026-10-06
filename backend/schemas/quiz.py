from typing import List, Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel

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
    event_type: str
    metadata: Optional[Dict[str, Any]] = None
