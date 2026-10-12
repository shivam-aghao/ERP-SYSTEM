"""
================================================================================
SSGMCE COLLEGE ERP — PRODUCTION QUIZ SCHEMAS
Comprehensive validation models for Quizzes, Questions, Attempts, Proctoring & Grading
================================================================================
"""

from typing import List, Optional, Dict, Any, Union
from datetime import datetime
from pydantic import BaseModel, Field


class QuestionOptionInput(BaseModel):
    id: Optional[str] = None
    key: Optional[str] = None  # 'A', 'B', 'C', 'D'
    text: str
    option_text: Optional[str] = None
    is_correct: Optional[bool] = False
    option_order: Optional[int] = None


class QuizQuestionInput(BaseModel):
    id: Optional[str] = None
    question_text: str
    question_type: str = "mcq"  # 'mcq', 'single_choice', 'multiple_choice', 'true_false', 'short_answer'
    marks: float = 2.0
    negative_marks: float = 0.0
    explanation: Optional[str] = None
    hint: Optional[str] = None
    question_order: Optional[int] = None
    options: Optional[List[QuestionOptionInput]] = []


class QuestionBankCreate(BaseModel):
    question_text: str
    question_type: str = "mcq"
    subject_id: Optional[str] = None
    subject_name: Optional[str] = "Computer Science"
    topic: Optional[str] = None
    difficulty: str = "MEDIUM"  # 'EASY', 'MEDIUM', 'HARD'
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
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    start_at: Optional[datetime] = None
    end_at: Optional[datetime] = None
    duration_minutes: int = 30
    total_marks: float = 100.0
    passing_marks: float = 40.0
    max_attempts: int = 1
    randomize_questions: Optional[bool] = None
    randomize_options: Optional[bool] = None
    shuffle_questions: bool = False
    shuffle_options: bool = False
    allow_question_navigation: bool = True
    allow_back_navigation: bool = True
    show_result_immediately: bool = True
    show_correct_answers: bool = True
    result_release_mode: str = "IMMEDIATE"
    negative_marking: bool = False
    negative_marks: float = 0.0
    negative_marks_per_question: Optional[float] = None
    status: Optional[str] = "draft"
    questions: Optional[List[QuizQuestionInput]] = []


class QuizUpdateSchema(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    instructions: Optional[str] = None
    subject_id: Optional[str] = None
    class_id: Optional[str] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    start_at: Optional[datetime] = None
    end_at: Optional[datetime] = None
    duration_minutes: Optional[int] = None
    total_marks: Optional[float] = None
    passing_marks: Optional[float] = None
    max_attempts: Optional[int] = None
    randomize_questions: Optional[bool] = None
    randomize_options: Optional[bool] = None
    shuffle_questions: Optional[bool] = None
    shuffle_options: Optional[bool] = None
    show_result_immediately: Optional[bool] = None
    show_correct_answers: Optional[bool] = None
    result_release_mode: Optional[str] = None
    negative_marking: Optional[bool] = None
    negative_marks: Optional[float] = None
    negative_marks_per_question: Optional[float] = None
    status: Optional[str] = None


class AnswerSubmissionItem(BaseModel):
    question_id: str
    selected_option: Optional[str] = None
    selected_options: Optional[List[str]] = None
    text_answer: Optional[str] = None
    is_marked_for_review: Optional[bool] = False


class QuizSubmitRequest(BaseModel):
    answers: Optional[Union[List[AnswerSubmissionItem], Dict[str, Any], List[Dict[str, Any]]]] = []
    is_auto_submit: Optional[bool] = False
    submission_reason: Optional[str] = None
    time_taken_seconds: Optional[int] = None


class SecurityEventRequest(BaseModel):
    event_type: str  # 'tab_switch', 'window_blur', 'fullscreen_exit', 'paste_attempt', 'right_click'
    metadata: Optional[Dict[str, Any]] = None
