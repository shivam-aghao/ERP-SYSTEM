import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, Float, Boolean, Text, DateTime, ForeignKey, JSON
from backend.config.database import Base

class Quiz(Base):
    __tablename__ = "quizzes"
    __table_args__ = {"extend_existing": True}

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    teacher_id = Column(String(36), ForeignKey("teachers.id"), nullable=True)
    class_id = Column(String(36), ForeignKey("classes.id"), nullable=False, index=True)
    subject_id = Column(String(36), ForeignKey("subjects.id"), nullable=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    instructions = Column(Text, nullable=True)
    total_questions = Column(Integer, default=0)
    total_marks = Column(Float, default=100.0)
    passing_marks = Column(Float, default=40.0)
    duration_minutes = Column(Integer, default=30)
    start_time = Column(DateTime(timezone=True), nullable=True)
    end_time = Column(DateTime(timezone=True), nullable=True)
    max_attempts = Column(Integer, default=1)
    randomize_questions = Column(Boolean, default=False)
    randomize_options = Column(Boolean, default=False)
    negative_marking = Column(Boolean, default=False)
    negative_marks_per_question = Column(Float, default=0.0)
    status = Column(String(30), default="draft")
    result_published = Column(Boolean, default=False)
    result_published_at = Column(DateTime(timezone=True), nullable=True)
    result_published_by = Column(String(36), nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    # Compatibility properties for older code references
    @property
    def start_at(self):
        return self.start_time

    @start_at.setter
    def start_at(self, val):
        self.start_time = val

    @property
    def end_at(self):
        return self.end_time

    @end_at.setter
    def end_at(self, val):
        self.end_time = val

    @property
    def shuffle_questions(self):
        return self.randomize_questions

    @shuffle_questions.setter
    def shuffle_questions(self, val):
        self.randomize_questions = val

    @property
    def shuffle_options(self):
        return self.randomize_options

    @shuffle_options.setter
    def shuffle_options(self, val):
        self.randomize_options = val

    @property
    def is_published(self):
        return self.status in ("published", "active") or self.result_published

    @property
    def negative_marks(self):
        return self.negative_marks_per_question


class QuestionBank(Base):
    __tablename__ = "question_bank"
    __table_args__ = {"extend_existing": True}

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    subject_id = Column(String(36), nullable=True)
    subject_name = Column(String(100), default="Computer Science")
    topic = Column(String(100), nullable=True)
    question_text = Column(Text, nullable=False)
    question_type = Column(String(30), default="MCQ")
    difficulty = Column(String(20), default="MEDIUM")
    marks = Column(Float, default=2.0)
    negative_marks = Column(Float, default=0.0)
    expected_answer = Column(Text, nullable=True)
    explanation = Column(Text, nullable=True)
    created_by = Column(String(36), nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))


class QuizQuestion(Base):
    __tablename__ = "quiz_questions"
    __table_args__ = {"extend_existing": True}

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    quiz_id = Column(String(36), ForeignKey("quizzes.id", ondelete="CASCADE"), nullable=False)
    question_text = Column(Text, nullable=False)
    question_type = Column(String(30), default="single_choice")
    marks = Column(Float, default=2.0)
    negative_marks = Column(Float, default=0.0)
    explanation = Column(Text, nullable=True)
    hint = Column(Text, nullable=True)
    question_order = Column(Integer, default=1)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))


class QuestionOption(Base):
    __tablename__ = "question_options"
    __table_args__ = {"extend_existing": True}

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    question_id = Column(String(36), ForeignKey("quiz_questions.id", ondelete="CASCADE"), nullable=False)
    option_text = Column(Text, nullable=False)
    option_order = Column(Integer, default=1)
    is_correct = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))


class QuizAttempt(Base):
    __tablename__ = "quiz_attempts"
    __table_args__ = {"extend_existing": True}

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    quiz_id = Column(String(36), ForeignKey("quizzes.id", ondelete="CASCADE"), nullable=False)
    student_id = Column(String(36), ForeignKey("students.id"), nullable=False)
    attempt_number = Column(Integer, default=1)
    started_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    submitted_at = Column(DateTime(timezone=True), nullable=True)
    auto_submitted = Column(Boolean, default=False)
    submission_reason = Column(String(100), nullable=True)
    status = Column(String(30), default="in_progress")
    total_questions = Column(Integer, default=0)
    attempted_questions = Column(Integer, default=0)
    correct_answers = Column(Integer, default=0)
    wrong_answers = Column(Integer, default=0)
    unanswered_questions = Column(Integer, default=0)
    raw_marks = Column(Float, default=0.0)
    negative_marks = Column(Float, default=0.0)
    final_marks = Column(Float, default=0.0)
    percentage = Column(Float, default=0.0)
    result_status = Column(String(20), default="pending")
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    @property
    def score(self):
        return self.final_marks

    @property
    def passed(self):
        return self.result_status == "pass"


class QuizAttemptAnswer(Base):
    __tablename__ = "quiz_attempt_answers"
    __table_args__ = {"extend_existing": True}

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    attempt_id = Column(String(36), ForeignKey("quiz_attempts.id", ondelete="CASCADE"), nullable=False)
    question_id = Column(String(36), ForeignKey("quiz_questions.id"), nullable=False)
    selected_option = Column(String(255), nullable=True)
    selected_options = Column(JSON, nullable=True)
    text_answer = Column(Text, nullable=True)
    is_correct = Column(Boolean, default=False)
    marks_awarded = Column(Float, default=0.0)
    is_marked_for_review = Column(Boolean, default=False)
    answered_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))


class QuizResult(Base):
    __tablename__ = "quiz_results"
    __table_args__ = {"extend_existing": True}

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    quiz_id = Column(String(36), ForeignKey("quizzes.id", ondelete="CASCADE"), nullable=False)
    student_id = Column(String(36), ForeignKey("students.id"), nullable=False)
    attempt_id = Column(String(36), ForeignKey("quiz_attempts.id"), nullable=False)
    total_marks = Column(Float, default=0.0)
    marks_obtained = Column(Float, default=0.0)
    percentage = Column(Float, default=0.0)
    correct_answers = Column(Integer, default=0)
    wrong_answers = Column(Integer, default=0)
    unanswered_questions = Column(Integer, default=0)
    rank = Column(Integer, nullable=True)
    result_status = Column(String(20), default="pending")
    teacher_remarks = Column(Text, nullable=True)
    published = Column(Boolean, default=False)
    published_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))


class QuizSecurityEvent(Base):
    __tablename__ = "quiz_security_events"
    __table_args__ = {"extend_existing": True}

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    attempt_id = Column(String(36), nullable=False)
    event_type = Column(String(50), nullable=False)
    event_time = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    metadata = Column(JSON, nullable=True)


class QuizRandomizationConfig(Base):
    __tablename__ = "quiz_randomization_configs"
    __table_args__ = {"extend_existing": True}

    quiz_id = Column(String(100), primary_key=True)
    questions_per_student = Column(Integer, nullable=True)
    unique_question_paper = Column(Boolean, default=False)
    prevent_duplicate_questions = Column(Boolean, default=True)
    randomize_question_types = Column(Boolean, default=False)
    difficulty_distribution = Column(Text, nullable=True)
    security_settings = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))


class QuizAttemptPaper(Base):
    __tablename__ = "quiz_attempt_papers"
    __table_args__ = {"extend_existing": True}

    attempt_id = Column(String(100), primary_key=True)
    quiz_id = Column(String(100), nullable=False, index=True)
    student_id = Column(String(100), nullable=False, index=True)
    question_ids = Column(Text, nullable=False)
    paper_payload = Column(Text, nullable=False)
    options_map = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))


class QuizQuestionMetadata(Base):
    __tablename__ = "quiz_question_metadata"
    __table_args__ = {"extend_existing": True}

    question_id = Column(String(100), primary_key=True)
    quiz_id = Column(String(100), nullable=False, index=True)
    difficulty = Column(String(30), default="MEDIUM")
    topic = Column(String(150), nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

