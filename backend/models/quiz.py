import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, Float, Boolean, Text, DateTime, ForeignKey
from backend.config.database import Base

class Quiz(Base):
    __tablename__ = "quizzes"
    __table_args__ = {"extend_existing": True}

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    teacher_id = Column(String(36), ForeignKey("teachers.id"), nullable=True)
    class_id = Column(String(36), ForeignKey("classes.id"), nullable=False, index=True)
    subject_id = Column(String(36), ForeignKey("subjects.id"), nullable=True)
    subject_name = Column(String(100), default="Computer Science")
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    instructions = Column(Text, nullable=True)
    start_at = Column(DateTime, nullable=True)
    end_at = Column(DateTime, nullable=True)
    duration_minutes = Column(Integer, default=30)
    total_marks = Column(Float, default=100.0)
    passing_marks = Column(Float, default=40.0)
    max_attempts = Column(Integer, default=1)
    shuffle_questions = Column(Boolean, default=False)
    shuffle_options = Column(Boolean, default=False)
    allow_question_navigation = Column(Boolean, default=True)
    allow_back_navigation = Column(Boolean, default=True)
    show_result_immediately = Column(Boolean, default=True)
    show_correct_answers = Column(Boolean, default=True)
    result_release_mode = Column(String(30), default="IMMEDIATE")
    negative_marking = Column(Boolean, default=False)
    negative_marks = Column(Float, default=0.0)
    status = Column(String(20), default="draft")
    is_published = Column(Boolean, default=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

class QuestionBank(Base):
    __tablename__ = "question_bank"
    __table_args__ = {"extend_existing": True}

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    question_text = Column(Text, nullable=False)
    question_type = Column(String(30), default="MCQ")
    subject_id = Column(String(36), nullable=True)
    subject_name = Column(String(100), default="Computer Science")
    topic = Column(String(100), nullable=True)
    difficulty = Column(String(20), default="MEDIUM")
    marks = Column(Float, default=2.0)
    negative_marks = Column(Float, default=0.0)
    expected_answer = Column(Text, nullable=True)
    explanation = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

class QuizQuestion(Base):
    __tablename__ = "quiz_questions"
    __table_args__ = {"extend_existing": True}

    quiz_id = Column(String(36), ForeignKey("quizzes.id", ondelete="CASCADE"), primary_key=True)
    question_id = Column(String(36), ForeignKey("question_bank.id"), primary_key=True)
    question_order = Column(Integer, default=1)
    marks = Column(Float, default=2.0)

class QuestionOption(Base):
    __tablename__ = "question_options"
    __table_args__ = {"extend_existing": True}

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    question_id = Column(String(36), ForeignKey("question_bank.id", ondelete="CASCADE"), nullable=False)
    option_key = Column(String(5), nullable=False)
    option_text = Column(Text, nullable=False)
    is_correct = Column(Boolean, default=False)

class QuizAttempt(Base):
    __tablename__ = "quiz_attempts"
    __table_args__ = {"extend_existing": True}

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    quiz_id = Column(String(36), ForeignKey("quizzes.id", ondelete="CASCADE"), nullable=False)
    student_id = Column(String(36), ForeignKey("students.id"), nullable=False)
    attempt_number = Column(Integer, default=1)
    status = Column(String(30), default="in_progress")
    started_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    submitted_at = Column(DateTime, nullable=True)
    time_taken_seconds = Column(Integer, default=0)
    score = Column(Float, default=0.0)
    percentage = Column(Float, default=0.0)
    passed = Column(Boolean, default=False)
    correct_count = Column(Integer, default=0)
    incorrect_count = Column(Integer, default=0)
    unanswered_count = Column(Integer, default=0)
    total_questions = Column(Integer, default=0)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

class QuizAttemptAnswer(Base):
    __tablename__ = "quiz_attempt_answers"
    __table_args__ = {"extend_existing": True}

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    attempt_id = Column(String(36), ForeignKey("quiz_attempts.id", ondelete="CASCADE"), nullable=False)
    question_id = Column(String(36), ForeignKey("question_bank.id"), nullable=False)
    selected_option = Column(String(10), nullable=True)
    text_answer = Column(Text, nullable=True)
    is_correct = Column(Boolean, default=False)
    marks_awarded = Column(Float, default=0.0)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
