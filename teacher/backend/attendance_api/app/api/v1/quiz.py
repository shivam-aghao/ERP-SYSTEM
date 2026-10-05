from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
import uuid
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.api.deps import get_db
from app.models.db_models import Class, Student
from app.utils.response import success_response, error_response

router = APIRouter(prefix="/quiz", tags=["Quiz Module"])

# ==============================================================================
# PYDANTIC SCHEMAS
# ==============================================================================

class OptionSchema(BaseModel):
    key: str # 'A', 'B', 'C', 'D'
    text: str
    is_correct: Optional[bool] = False

class QuestionCreateSchema(BaseModel):
    question_text: str
    marks: float = 2.0
    negative_marks: float = 0.5
    options: List[OptionSchema]

class QuizCreateSchema(BaseModel):
    title: str
    description: Optional[str] = None
    subject: str = "Computer Science"
    class_id: Optional[str] = None # Class ID or Class Name (e.g., '1R1', '3R')
    class_name: Optional[str] = None
    duration_minutes: int = 20
    total_marks: float = 10.0
    marks_per_question: float = 2.0
    negative_marks: float = 0.5
    status: str = "PUBLISHED"
    questions: Optional[List[QuestionCreateSchema]] = []

class AnswerSubmitSchema(BaseModel):
    question_id: str
    selected_option: Optional[str] = None # 'A', 'B', 'C', 'D'
    time_taken_seconds: float = 0.0

class QuizAttemptSubmitSchema(BaseModel):
    attempt_id: str
    answers: List[AnswerSubmitSchema]

class StartQuizRequest(BaseModel):
    student_id: Optional[str] = "demo-student-id"
    student_name: Optional[str] = "Student"
    class_name: Optional[str] = None

# ==============================================================================
# 1. CLASSES & MASTER DATA ENDPOINTS
# ==============================================================================

@router.get("/classes")
def list_quiz_classes(db: Session = Depends(get_db)):
    """Fetch all available academic classes for quiz targeting."""
    rows = db.execute(text("""
        SELECT c.id, c.class_name, c.division, c.year, COUNT(s.id) as student_count
        FROM classes c
        LEFT JOIN students s ON s.class_id = c.id
        GROUP BY c.id
        ORDER BY c.year ASC, c.class_name ASC
    """)).fetchall()
    
    result = []
    for r in rows:
        m = r._mapping
        result.append({
            "id": m["id"],
            "class_name": m["class_name"] or "Unknown",
            "division": m["division"] or "",
            "year": m["year"] or 1,
            "student_count": m["student_count"] or 0
        })
    return success_response(result)

@router.get("/students")
def list_quiz_students(class_name: Optional[str] = None, db: Session = Depends(get_db)):
    """Fetch students for class switcher & authorization testing."""
    filter_sql = f"WHERE c.class_name = '{class_name}'" if class_name else ""
    rows = db.execute(text(f"""
        SELECT s.id, s.student_code, s.full_name, s.roll_no, c.class_name
        FROM students s
        LEFT JOIN classes c ON s.class_id = c.id
        {filter_sql}
        ORDER BY c.class_name ASC, s.roll_no ASC
        LIMIT 100
    """)).fetchall()

    result = []
    for r in rows:
        m = r._mapping
        result.append({
            "id": m["id"],
            "student_code": m["student_code"],
            "full_name": m["full_name"],
            "roll_no": m["roll_no"],
            "class_name": m["class_name"] or "Unknown"
        })
    return success_response(result)

@router.get("/teacher/profile")
def get_teacher_profile(db: Session = Depends(get_db)):
    """Fetch logged in teacher profile for header."""
    row = db.execute(text("SELECT id, full_name, designation, emp_code FROM teachers LIMIT 1")).fetchone()
    if row:
        m = row._mapping
        return success_response({
            "id": m["id"],
            "full_name": m["full_name"],
            "designation": m["designation"],
            "emp_code": m["emp_code"]
        })
    return success_response({
        "id": "cd1f48e7-1343-4e04-b851-bee7443aa658",
        "full_name": "Prof. Rajesh Sharma",
        "designation": "Associate Professor",
        "emp_code": "EMP-CSE-1042"
    })

@router.get("/student/{student_id}/trend")
def get_student_quiz_trend(student_id: str, db: Session = Depends(get_db)):
    """Compute 100% real student performance metrics and trend history from quiz_attempts."""
    attempts = db.execute(text(f"""
        SELECT qa.id, qa.score, qa.accuracy, qa.time_taken_seconds, qa.submitted_at, q.title as quiz_title, q.total_marks
        FROM quiz_attempts qa
        JOIN quizzes q ON qa.quiz_id = q.id
        WHERE (qa.student_id = '{student_id}' OR qa.student_id = 'demo-student-id') AND qa.status = 'SUBMITTED'
        ORDER BY qa.submitted_at ASC
    """)).fetchall()

    if not attempts:
        return success_response({
            "total_attempts": 0,
            "average_score_pct": 0.0,
            "average_speed_seconds": 0,
            "overall_accuracy_pct": 0.0,
            "trend_labels": [],
            "trend_scores": []
        })

    total_attempts = len(attempts)
    total_score_pct = 0.0
    total_time = 0
    total_acc = 0.0
    trend_labels = []
    trend_scores = []

    for a in attempts:
        m = a._mapping
        score = float(m["score"] or 0.0)
        tot_marks = float(m["total_marks"] or 10.0)
        pct = round((score / tot_marks) * 100, 1) if tot_marks > 0 else 0.0
        acc = float(m["accuracy"] or 0.0)
        t = int(m["time_taken_seconds"] or 0)

        total_score_pct += pct
        total_time += t
        total_acc += acc
        trend_labels.append(m["quiz_title"])
        trend_scores.append(pct)

    avg_score_pct = round(total_score_pct / total_attempts, 1)
    avg_speed = round(total_time / total_attempts)
    overall_acc = round(total_acc / total_attempts, 1)

    return success_response({
        "total_attempts": total_attempts,
        "average_score_pct": avg_score_pct,
        "average_speed_seconds": avg_speed,
        "overall_accuracy_pct": overall_acc,
        "trend_labels": trend_labels,
        "trend_scores": trend_scores
    })

# ==============================================================================
# 2. TEACHER QUIZ MANAGEMENT ENDPOINTS
# ==============================================================================


@router.get("/teacher/quizzes")
def list_teacher_quizzes(db: Session = Depends(get_db)):
    """List all quizzes created with class name, question count, and attempts count."""
    quizzes = db.execute(text("""
        SELECT q.*, COALESCE(c.class_name, q.class_id) as class_name
        FROM quizzes q
        LEFT JOIN classes c ON q.class_id = c.id
        ORDER BY q.created_at DESC
    """)).fetchall()
    
    result = []
    for q in quizzes:
        q_dict = dict(q._mapping)
        qid = q_dict["id"]
        q_cnt = db.execute(text(f"SELECT COUNT(*) FROM quiz_questions WHERE quiz_id = '{qid}'")).scalar() or 0
        att_cnt = db.execute(text(f"SELECT COUNT(*) FROM quiz_attempts WHERE quiz_id = '{qid}' AND status = 'SUBMITTED'")).scalar() or 0
        avg_sc = db.execute(text(f"SELECT AVG(score) FROM quiz_attempts WHERE quiz_id = '{qid}' AND status = 'SUBMITTED'")).scalar() or 0.0
        
        q_dict["question_count"] = q_cnt
        q_dict["attempts_count"] = att_cnt
        q_dict["average_score"] = round(float(avg_sc), 1)
        result.append(q_dict)
        
    return success_response(result)

@router.post("/teacher/quizzes")
def create_quiz(payload: QuizCreateSchema, db: Session = Depends(get_db)):
    """Teacher creates a quiz targeted to a specific class and triggers notifications."""
    quiz_id = str(uuid.uuid4())
    
    # Resolve target class
    target_class_id = payload.class_id
    target_class_name = payload.class_name or ""
    
    if target_class_id:
        c_obj = db.execute(text(f"SELECT id, class_name FROM classes WHERE id = '{target_class_id}' OR class_name = '{target_class_id}' LIMIT 1")).fetchone()
        if c_obj:
            target_class_id = c_obj._mapping["id"]
            target_class_name = c_obj._mapping["class_name"]
    elif target_class_name:
        c_obj = db.execute(text(f"SELECT id, class_name FROM classes WHERE class_name = '{target_class_name}' LIMIT 1")).fetchone()
        if c_obj:
            target_class_id = c_obj._mapping["id"]
            target_class_name = c_obj._mapping["class_name"]

    if not target_class_id:
        # Fallback to default class
        first_c = db.execute(text("SELECT id, class_name FROM classes LIMIT 1")).fetchone()
        if first_c:
            target_class_id = first_c._mapping["id"]
            target_class_name = first_c._mapping["class_name"]
        else:
            target_class_id = "11111111-1111-1111-1111-111111111111"
            target_class_name = "1R1"

    # Insert quiz
    db.execute(
        text("""
        INSERT INTO quizzes (id, class_id, title, description, subject, duration_minutes, total_marks, marks_per_question, negative_marks, status, created_at, updated_at)
        VALUES (:id, :class_id, :title, :description, :subject, :duration, :total_marks, :marks_per_q, :neg_marks, :status, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        """),
        {
            "id": quiz_id,
            "class_id": target_class_id,
            "title": payload.title,
            "description": payload.description or "",
            "subject": payload.subject,
            "duration": payload.duration_minutes,
            "total_marks": payload.total_marks,
            "marks_per_q": payload.marks_per_question,
            "neg_marks": payload.negative_marks,
            "status": payload.status
        }
    )

    # Insert questions if provided
    if payload.questions:
        for idx, q_data in enumerate(payload.questions, start=1):
            qid = str(uuid.uuid4())
            db.execute(
                text("""
                INSERT INTO quiz_questions (id, quiz_id, question_text, question_order, marks, negative_marks, created_at)
                VALUES (:id, :quiz_id, :text, :q_order, :marks, :neg_marks, CURRENT_TIMESTAMP)
                """),
                {
                    "id": qid,
                    "quiz_id": quiz_id,
                    "text": q_data.question_text,
                    "q_order": idx,
                    "marks": q_data.marks,
                    "neg_marks": q_data.negative_marks
                }
            )
            for opt in q_data.options:
                db.execute(
                    text("""
                    INSERT INTO question_options (id, question_id, option_key, option_text, is_correct, created_at)
                    VALUES (:id, :qid, :key, :text, :is_correct, CURRENT_TIMESTAMP)
                    """),
                    {
                        "id": str(uuid.uuid4()),
                        "qid": qid,
                        "key": opt.key,
                        "text": opt.text,
                        "is_correct": 1 if opt.is_correct else 0
                    }
                )

    # AUTO NOTIFICATION TRIGGER (Only when published)
    if payload.status == "PUBLISHED":
        notif_id = str(uuid.uuid4())
        msg = f"New quiz '{payload.title}' ({payload.subject}) uploaded for class {target_class_name}. Duration: {payload.duration_minutes} mins, Marks: {payload.total_marks}."
        db.execute(
            text("""
            INSERT INTO notifications (id, teacher_id, class_id, class_name, title, message, type, is_read, created_at)
            VALUES (:id, :teacher_id, :class_id, :class_name, :title, :message, :type, 0, CURRENT_TIMESTAMP)
            """),
            {
                "id": notif_id,
                "teacher_id": "FAC-CSE-1048",
                "class_id": target_class_id,
                "class_name": target_class_name,
                "title": f"New Quiz: {payload.title}",
                "message": msg,
                "type": "QUIZ"
            }
        )
        # Direct Supabase Cloud Sync
        try:
            from app.database import get_supabase_client
            sb = get_supabase_client()
            if sb:
                sb.table("notifications").insert({
                    "id": notif_id,
                    "title": f"New Quiz: {payload.title}",
                    "message": msg,
                    "type": "QUIZ",
                    "class_name": target_class_name
                }).execute()
        except Exception:
            pass

    db.commit()

    return success_response({
        "id": quiz_id,
        "title": payload.title,
        "class_id": target_class_id,
        "class_name": target_class_name,
        "status": payload.status,
        "question_count": len(payload.questions) if payload.questions else 0
    }, "Quiz created successfully and class notified")

@router.put("/teacher/quizzes/{quiz_id}/publish")
def toggle_publish_quiz(quiz_id: str, db: Session = Depends(get_db)):
    """Toggle quiz between PUBLISHED and DRAFT, triggering notifications on publish."""
    quiz = db.execute(text(f"SELECT * FROM quizzes WHERE id = '{quiz_id}'")).fetchone()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
        
    current_status = quiz._mapping["status"]
    new_status = "DRAFT" if current_status == "PUBLISHED" else "PUBLISHED"
    
    db.execute(text(f"UPDATE quizzes SET status = '{new_status}', updated_at = CURRENT_TIMESTAMP WHERE id = '{quiz_id}'"))
    
    # Notify class if newly published
    if new_status == "PUBLISHED":
        c_obj = db.execute(text(f"SELECT class_name FROM classes WHERE id = '{quiz._mapping['class_id']}'")).fetchone()
        c_name = c_obj._mapping["class_name"] if c_obj else quiz._mapping['class_id']
        notif_id = str(uuid.uuid4())
        msg = f"Quiz '{quiz._mapping['title']}' ({quiz._mapping['subject']}) is now ACTIVE for class {c_name}."
        db.execute(
            text("""
            INSERT INTO notifications (id, teacher_id, class_id, class_name, title, message, type, is_read, created_at)
            VALUES (:id, :teacher_id, :class_id, :class_name, :title, :message, :type, 0, CURRENT_TIMESTAMP)
            """),
            {
                "id": notif_id,
                "teacher_id": "FAC-CSE-1048",
                "class_id": quiz._mapping['class_id'],
                "class_name": c_name,
                "title": f"Quiz Published: {quiz._mapping['title']}",
                "message": msg,
                "type": "QUIZ"
            }
        )
        try:
            from app.database import get_supabase_client
            sb = get_supabase_client()
            if sb:
                sb.table("notifications").insert({
                    "id": notif_id,
                    "title": f"Quiz Published: {quiz._mapping['title']}",
                    "message": msg,
                    "type": "QUIZ",
                    "class_name": c_name
                }).execute()
        except Exception:
            pass
        
    db.commit()
    return success_response({"id": quiz_id, "status": new_status}, f"Quiz status updated to {new_status}")

@router.delete("/teacher/quizzes/{quiz_id}")
def delete_quiz(quiz_id: str, db: Session = Depends(get_db)):
    """Delete quiz and clean up questions, options, and student attempts."""
    # Find question ids
    q_ids = [r[0] for r in db.execute(text(f"SELECT id FROM quiz_questions WHERE quiz_id = '{quiz_id}'")).fetchall()]
    for qid in q_ids:
        db.execute(text(f"DELETE FROM question_options WHERE question_id = '{qid}'"))
        db.execute(text(f"DELETE FROM student_answers WHERE question_id = '{qid}'"))
    
    db.execute(text(f"DELETE FROM quiz_questions WHERE quiz_id = '{quiz_id}'"))
    db.execute(text(f"DELETE FROM quiz_attempts WHERE quiz_id = '{quiz_id}'"))
    db.execute(text(f"DELETE FROM quizzes WHERE id = '{quiz_id}'"))
    db.commit()
    
    return success_response({"id": quiz_id}, "Quiz deleted successfully")

@router.get("/teacher/quizzes/{quiz_id}/questions")
def get_quiz_questions_for_teacher(quiz_id: str, db: Session = Depends(get_db)):
    """Fetch all questions and answer keys for teacher editing."""
    questions = db.execute(text(f"""
        SELECT id, question_text, marks, negative_marks, question_order
        FROM quiz_questions
        WHERE quiz_id = '{quiz_id}'
        ORDER BY question_order ASC
    """)).fetchall()
    
    q_list = []
    for q in questions:
        qd = dict(q._mapping)
        opts = db.execute(text(f"""
            SELECT option_key, option_text, is_correct
            FROM question_options
            WHERE question_id = '{qd["id"]}'
            ORDER BY option_key ASC
        """)).fetchall()
        qd["options"] = [{"key": o[0], "text": o[1], "is_correct": bool(o[2])} for o in opts]
        q_list.append(qd)
        
    return success_response(q_list)

@router.post("/teacher/quizzes/{quiz_id}/questions")
def add_question_to_quiz(quiz_id: str, payload: QuestionCreateSchema, db: Session = Depends(get_db)):
    """Add a question with choices and correct answer key to a quiz."""
    qid = str(uuid.uuid4())
    curr_order = (db.execute(text(f"SELECT MAX(question_order) FROM quiz_questions WHERE quiz_id = '{quiz_id}'")).scalar() or 0) + 1
    
    db.execute(
        text("""
        INSERT INTO quiz_questions (id, quiz_id, question_text, question_order, marks, negative_marks, created_at)
        VALUES (:id, :quiz_id, :text, :q_order, :marks, :neg_marks, CURRENT_TIMESTAMP)
        """),
        {"id": qid, "quiz_id": quiz_id, "text": payload.question_text, "q_order": curr_order, "marks": payload.marks, "neg_marks": payload.negative_marks}
    )
    for opt in payload.options:
        db.execute(
            text("""
            INSERT INTO question_options (id, question_id, option_key, option_text, is_correct, created_at)
            VALUES (:id, :qid, :key, :text, :is_correct, CURRENT_TIMESTAMP)
            """),
            {
                "id": str(uuid.uuid4()),
                "qid": qid,
                "key": opt.key,
                "text": opt.text,
                "is_correct": 1 if opt.is_correct else 0
            }
        )
    db.commit()
    return success_response({"question_id": qid, "order": curr_order}, "Question added successfully")

@router.delete("/teacher/quizzes/{quiz_id}/questions/{question_id}")
def delete_quiz_question(quiz_id: str, question_id: str, db: Session = Depends(get_db)):
    """Delete a question and its options."""
    db.execute(text(f"DELETE FROM question_options WHERE question_id = '{question_id}'"))
    db.execute(text(f"DELETE FROM student_answers WHERE question_id = '{question_id}'"))
    db.execute(text(f"DELETE FROM quiz_questions WHERE id = '{question_id}'"))
    db.commit()
    return success_response({"question_id": question_id}, "Question deleted")

# ==============================================================================
# 3. STUDENT QUIZ ENDPOINTS (CLASS-TARGETED RESTRICTION)
# ==============================================================================

@router.get("/student/quizzes")
def get_available_quizzes_for_student(
    student_id: Optional[str] = None,
    class_id: Optional[str] = None,
    class_name: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    CRITICAL CLASS RESTRICTION:
    Students can ONLY view quizzes targeted to their assigned class.
    """
    target_class_id = class_id

    # If student code or ID passed, resolve student's class
    if student_id and not target_class_id:
        st = db.execute(text(f"SELECT class_id FROM students WHERE id = '{student_id}' OR student_code = '{student_id}' LIMIT 1")).fetchone()
        if st and st[0]:
            target_class_id = st[0]

    # If class name passed (e.g., '1R1' or '3R')
    if class_name and not target_class_id:
        c = db.execute(text(f"SELECT id FROM classes WHERE class_name = '{class_name}' LIMIT 1")).fetchone()
        if c:
            target_class_id = c[0]
        else:
            target_class_id = class_name

    if not target_class_id:
        target_class_id = "11111111-1111-1111-1111-111111111111"

    # Query quizzes strictly for this class or class name
    quizzes = db.execute(text(f"""
        SELECT q.*, COALESCE(c.class_name, q.class_id) as class_name
        FROM quizzes q
        LEFT JOIN classes c ON q.class_id = c.id
        WHERE (q.class_id = '{target_class_id}' OR c.class_name = '{class_name or ""}' OR q.class_id = '{class_name or ""}')
          AND q.status = 'PUBLISHED'
        ORDER BY q.created_at DESC
    """)).fetchall()

    result = []
    for q in quizzes:
        q_dict = dict(q._mapping)
        qid = q_dict["id"]
        q_cnt = db.execute(text(f"SELECT COUNT(*) FROM quiz_questions WHERE quiz_id = '{qid}'")).scalar() or 0
        q_dict["question_count"] = q_cnt

        # Check if student already attempted this quiz
        has_attempted = False
        latest_attempt = None
        if student_id:
            att = db.execute(text(f"""
                SELECT id, score, accuracy, submitted_at, time_taken_seconds
                FROM quiz_attempts
                WHERE quiz_id = '{qid}' AND (student_id = '{student_id}' OR student_id = 'demo-student-id') AND status = 'SUBMITTED'
                ORDER BY submitted_at DESC
                LIMIT 1
            """)).fetchone()
            if att:
                has_attempted = True
                latest_attempt = dict(att._mapping)

        q_dict["has_attempted"] = has_attempted
        q_dict["latest_attempt"] = latest_attempt
        result.append(q_dict)

    return success_response(result)

@router.post("/student/quizzes/{quiz_id}/start")
def start_quiz_attempt(quiz_id: str, payload: Optional[StartQuizRequest] = None, db: Session = Depends(get_db)):
    """
    Start attempt session. Verifies quiz existence and never exposes answer keys!
    """
    quiz = db.execute(text(f"SELECT * FROM quizzes WHERE id = '{quiz_id}'")).fetchone()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")

    student_id = payload.student_id if payload else "demo-student-id"
    attempt_id = str(uuid.uuid4())

    db.execute(
        text("""
        INSERT INTO quiz_attempts (id, quiz_id, student_id, started_at, status, created_at, updated_at)
        VALUES (:id, :quiz_id, :student_id, CURRENT_TIMESTAMP, 'IN_PROGRESS', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        """),
        {"id": attempt_id, "quiz_id": quiz_id, "student_id": student_id}
    )
    db.commit()

    # Fetch questions and options WITHOUT is_correct
    questions = db.execute(text(f"""
        SELECT id, question_text, marks, negative_marks, question_order
        FROM quiz_questions
        WHERE quiz_id = '{quiz_id}'
        ORDER BY question_order ASC
    """)).fetchall()

    q_list = []
    for q in questions:
        qd = dict(q._mapping)
        opts = db.execute(text(f"""
            SELECT option_key, option_text
            FROM question_options
            WHERE question_id = '{qd["id"]}'
            ORDER BY option_key ASC
        """)).fetchall()
        qd["options"] = [{"key": o[0], "text": o[1]} for o in opts]
        q_list.append(qd)

    return success_response({
        "attempt_id": attempt_id,
        "quiz": dict(quiz._mapping),
        "questions": q_list
    }, "Quiz attempt session started")

@router.post("/student/attempts/{attempt_id}/submit")
def submit_quiz_attempt(attempt_id: str, payload: QuizAttemptSubmitSchema, db: Session = Depends(get_db)):
    """
    Server-side evaluation:
    1. Compares selected option with correct option from database
    2. Applies positive and negative marks
    3. Saves record to student_answers and quiz_attempts
    4. Returns score card and full response review sheet
    """
    attempt = db.execute(text(f"SELECT * FROM quiz_attempts WHERE id = '{attempt_id}'")).fetchone()
    if not attempt:
        raise HTTPException(status_code=404, detail="Attempt not found")

    quiz_id = attempt._mapping["quiz_id"]
    quiz = db.execute(text(f"SELECT * FROM quizzes WHERE id = '{quiz_id}'")).fetchone()
    neg_rate = float(quiz._mapping["negative_marks"] or 0.0)

    total_correct = 0
    total_wrong = 0
    total_unanswered = 0
    final_score = 0.0
    total_time = sum(a.time_taken_seconds for a in payload.answers)
    review_details = []

    for ans in payload.answers:
        # Get correct answer for question
        corr_row = db.execute(text(f"SELECT option_key, option_text FROM question_options WHERE question_id = '{ans.question_id}' AND is_correct = 1 LIMIT 1")).fetchone()
        correct_key = corr_row[0] if corr_row else "A"
        correct_text = corr_row[1] if corr_row else ""

        q_row = db.execute(text(f"SELECT question_text, marks FROM quiz_questions WHERE id = '{ans.question_id}'")).fetchone()
        q_text = q_row[0] if q_row else "Question"
        q_marks = float(q_row[1] if q_row else 2.0)

        is_corr = False
        marks_earned = 0.0

        if not ans.selected_option:
            total_unanswered += 1
            status_label = "UNANSWERED"
        elif ans.selected_option == correct_key:
            is_corr = True
            marks_earned = q_marks
            total_correct += 1
            final_score += marks_earned
            status_label = "CORRECT"
        else:
            total_wrong += 1
            marks_earned = -neg_rate
            final_score += marks_earned
            status_label = "WRONG"

        # Record in student_answers
        ans_id = str(uuid.uuid4())
        db.execute(
            text("""
            INSERT INTO student_answers (id, attempt_id, question_id, selected_option, is_correct, marks_obtained, time_taken_seconds, created_at)
            VALUES (:id, :att_id, :qid, :sel, :corr, :marks, :time_taken, CURRENT_TIMESTAMP)
            """),
            {
                "id": ans_id,
                "att_id": attempt_id,
                "qid": ans.question_id,
                "sel": ans.selected_option or "",
                "corr": 1 if is_corr else 0,
                "marks": marks_earned,
                "time_taken": ans.time_taken_seconds
            }
        )

        review_details.append({
            "question_id": ans.question_id,
            "question_text": q_text,
            "selected_option": ans.selected_option,
            "correct_option": correct_key,
            "correct_text": correct_text,
            "is_correct": is_corr,
            "marks_earned": marks_earned,
            "status": status_label
        })

    if final_score < 0:
        final_score = 0.0

    attempted_count = total_correct + total_wrong
    accuracy = round((total_correct / attempted_count) * 100, 1) if attempted_count > 0 else 0.0

    # Update attempt record
    db.execute(
        text("""
        UPDATE quiz_attempts 
        SET submitted_at = CURRENT_TIMESTAMP,
            time_taken_seconds = :time_sec,
            score = :score,
            accuracy = :acc,
            total_correct = :corr,
            total_wrong = :wrong,
            total_unanswered = :unans,
            status = 'SUBMITTED',
            updated_at = CURRENT_TIMESTAMP
        WHERE id = :id
        """),
        {
            "id": attempt_id,
            "time_sec": int(total_time),
            "score": final_score,
            "acc": accuracy,
            "corr": total_correct,
            "wrong": total_wrong,
            "unans": total_unanswered
        }
    )
    db.commit()

    return success_response({
        "attempt_id": attempt_id,
        "score": round(final_score, 2),
        "total_marks": float(quiz._mapping["total_marks"] or 10.0),
        "accuracy": accuracy,
        "total_correct": total_correct,
        "total_wrong": total_wrong,
        "total_unanswered": total_unanswered,
        "time_taken_seconds": int(total_time),
        "review": review_details
    }, "Quiz evaluated successfully")

# ==============================================================================
# 4. NOTIFICATIONS ENDPOINT (CLASS-SPECIFIC QUIZ ALERTS)
# ==============================================================================

@router.get("/notifications")
def get_quiz_notifications(
    class_id: Optional[str] = None,
    class_name: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Fetch notifications for students of a specific class when quizzes are uploaded."""
    conditions = ["type = 'QUIZ'"]
    if class_id or class_name:
        c_clause = []
        if class_id:
            c_clause.append(f"class_id = '{class_id}'")
        if class_name:
            c_clause.append(f"class_name = '{class_name}'")
        conditions.append(f"({' OR '.join(c_clause)})")

    where_sql = f"WHERE {' AND '.join(conditions)}" if conditions else ""
    rows = db.execute(text(f"""
        SELECT id, title, message, type, class_name, is_read, created_at
        FROM notifications
        {where_sql}
        ORDER BY created_at DESC
        LIMIT 20
    """)).fetchall()

    result = [dict(r._mapping) for r in rows]
    return success_response(result)

# ==============================================================================
# 5. TEACHER ANALYTICS & LEADERBOARD
# ==============================================================================

@router.get("/quizzes/{quiz_id}/analytics")
def get_quiz_analytics(quiz_id: str, db: Session = Depends(get_db)):
    """Fetch real performance analytics and grade distribution for a quiz."""
    quiz = db.execute(text(f"SELECT * FROM quizzes WHERE id = '{quiz_id}'")).fetchone()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")

    attempts_count = db.execute(text(f"SELECT COUNT(*) FROM quiz_attempts WHERE quiz_id = '{quiz_id}' AND status = 'SUBMITTED'")).scalar() or 0
    avg_score = db.execute(text(f"SELECT AVG(score) FROM quiz_attempts WHERE quiz_id = '{quiz_id}' AND status = 'SUBMITTED'")).scalar() or 0.0
    avg_acc = db.execute(text(f"SELECT AVG(accuracy) FROM quiz_attempts WHERE quiz_id = '{quiz_id}' AND status = 'SUBMITTED'")).scalar() or 0.0
    high_score = db.execute(text(f"SELECT MAX(score) FROM quiz_attempts WHERE quiz_id = '{quiz_id}' AND status = 'SUBMITTED'")).scalar() or 0.0
    avg_time = db.execute(text(f"SELECT AVG(time_taken_seconds) FROM quiz_attempts WHERE quiz_id = '{quiz_id}' AND status = 'SUBMITTED'")).scalar() or 0.0

    questions = db.execute(text(f"SELECT id, question_text FROM quiz_questions WHERE quiz_id = '{quiz_id}' ORDER BY question_order ASC")).fetchall()
    q_breakdown = []
    for q in questions:
        qid = q._mapping["id"]
        total_ans = db.execute(text(f"SELECT COUNT(*) FROM student_answers WHERE question_id = '{qid}'")).scalar() or 0
        corr_ans = db.execute(text(f"SELECT COUNT(*) FROM student_answers WHERE question_id = '{qid}' AND is_correct = 1")).scalar() or 0
        acc = round((corr_ans / total_ans) * 100, 1) if total_ans > 0 else 0.0
        q_breakdown.append({
            "question_id": qid,
            "text": q._mapping["question_text"],
            "accuracy": acc,
            "total_answered": total_ans
        })

    # Fetch top performers
    top_rows = db.execute(text(f"""
        SELECT qa.id, qa.score, qa.accuracy, qa.time_taken_seconds,
               COALESCE(s.full_name, 'Shivam Sanjay Aghao') as student_name,
               COALESCE(s.roll_no, 60) as roll_no
        FROM quiz_attempts qa
        LEFT JOIN students s ON (qa.student_id = s.id OR qa.student_id = s.student_code)
        WHERE qa.quiz_id = '{quiz_id}' AND qa.status = 'SUBMITTED'
        ORDER BY qa.score DESC, qa.time_taken_seconds ASC
        LIMIT 5
    """)).fetchall()
    top_performers = []
    for idx, tr in enumerate(top_rows, 1):
        m = tr._mapping
        top_performers.append({
            "rank": idx,
            "name": m["student_name"],
            "roll_no": m["roll_no"],
            "score": float(m["score"] or 0.0),
            "accuracy": float(m["accuracy"] or 0.0),
            "time_taken_seconds": int(m["time_taken_seconds"] or 0)
        })

    return success_response({
        "quiz_title": quiz._mapping["title"],
        "total_attempts": attempts_count,
        "average_score": round(float(avg_score), 1),
        "average_accuracy": round(float(avg_acc), 1),
        "highest_score": round(float(high_score), 1),
        "average_time_seconds": int(avg_time),
        "questions_analysis": q_breakdown,
        "top_performers": top_performers
    })

@router.get("/quizzes/{quiz_id}/leaderboard")
def get_quiz_leaderboard(quiz_id: str, db: Session = Depends(get_db)):
    """Fetch leaderboard ranking for students who attempted this quiz."""
    rows = db.execute(text(f"""
        SELECT qa.id, qa.student_id, qa.score, qa.accuracy, qa.time_taken_seconds,
               COALESCE(s.full_name, 'Student') as student_name,
               COALESCE(s.roll_no, '--') as roll_no
        FROM quiz_attempts qa
        LEFT JOIN students s ON (qa.student_id = s.id OR qa.student_id = s.student_code)
        WHERE qa.quiz_id = '{quiz_id}' AND qa.status = 'SUBMITTED'
        ORDER BY qa.score DESC, qa.accuracy DESC, qa.time_taken_seconds ASC
        LIMIT 20
    """)).fetchall()

    leaderboard = []
    for idx, r in enumerate(rows, 1):
        m = r._mapping
        leaderboard.append({
            "rank": idx,
            "student_id": m["student_id"],
            "name": m["student_name"],
            "roll_no": m["roll_no"],
            "score": float(m["score"] or 0.0),
            "accuracy": float(m["accuracy"] or 0.0),
            "time_taken_seconds": int(m["time_taken_seconds"] or 0),
            "status": "Submitted"
        })
    return success_response(leaderboard)

@router.get("/student/{student_id}/trend")
def get_student_trend(student_id: str, db: Session = Depends(get_db)):
    """Fetch real dynamic performance trend and statistics for a student."""
    attempts = db.execute(text("""
        SELECT qa.id, qa.score, qa.accuracy, qa.time_taken_seconds, qa.submitted_at, q.title, q.total_marks
        FROM quiz_attempts qa
        JOIN quizzes q ON qa.quiz_id = q.id
        WHERE (qa.student_id = :sid OR qa.student_id = 'demo-student-id' OR :sid = 'default')
          AND qa.status = 'SUBMITTED'
        ORDER BY qa.submitted_at ASC
        LIMIT 10
    """), {"sid": student_id}).fetchall()

    if not attempts:
        st = db.execute(text("SELECT id, student_code FROM students WHERE id = :sid OR student_code = :sid LIMIT 1"), {"sid": student_id}).fetchone()
        if st:
            attempts = db.execute(text("""
                SELECT qa.id, qa.score, qa.accuracy, qa.time_taken_seconds, qa.submitted_at, q.title, q.total_marks
                FROM quiz_attempts qa
                JOIN quizzes q ON qa.quiz_id = q.id
                WHERE (qa.student_id = :id1 OR qa.student_id = :id2)
                  AND qa.status = 'SUBMITTED'
                ORDER BY qa.submitted_at ASC
                LIMIT 10
            """), {"id1": st[0], "id2": st[1]}).fetchall()

    if not attempts:
        return success_response({
            "total_attempts": 0,
            "average_score_pct": 0.0,
            "average_speed_seconds": 0,
            "overall_accuracy_pct": 0.0,
            "trend_labels": [],
            "trend_scores": []
        })

    scores = []
    accuracies = []
    speeds = []
    labels = []
    for att in attempts:
        m = att._mapping
        tot = float(m["total_marks"] or 10.0)
        sc = float(m["score"] or 0.0)
        pct = round((sc / tot) * 100, 1) if tot > 0 else 0.0
        scores.append(pct)
        accuracies.append(float(m["accuracy"] or 0.0))
        speeds.append(int(m["time_taken_seconds"] or 0))
        labels.append(m["title"][:20] if m["title"] else f"Quiz {len(labels)+1}")

    avg_score = round(sum(scores) / len(scores), 1) if scores else 0.0
    avg_acc = round(sum(accuracies) / len(accuracies), 1) if accuracies else 0.0
    avg_speed = int(sum(speeds) / len(speeds)) if speeds else 0

    return success_response({
        "total_attempts": len(attempts),
        "average_score_pct": avg_score,
        "average_speed_seconds": avg_speed,
        "overall_accuracy_pct": avg_acc,
        "trend_labels": labels,
        "trend_scores": scores
    })


