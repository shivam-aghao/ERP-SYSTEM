import uuid
from typing import Optional, Dict, Any, List
from fastapi import APIRouter, Depends, Query, Body, HTTPException, Response
from sqlalchemy.orm import Session
from sqlalchemy import text
from backend.config.database import get_db
from backend.schemas.quiz import (
    QuestionBankCreate, QuizCreateSchema, QuizSubmitRequest, SecurityEventRequest
)
from backend.services.quiz_service import QuizService
from backend.utils.helpers import success_response, error_response

router = APIRouter(tags=["Quiz & Examination Assessment"])

@router.get("/questions")
@router.get("/quiz/questions")
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
        opts = db.execute(text("SELECT * FROM question_options WHERE question_id = :qid ORDER BY option_key ASC"), {"qid": m["id"]}).fetchall()
        m["options"] = [dict(o._mapping) for o in opts]
        result.append(m)
    return success_response(result)

@router.post("/questions")
@router.post("/quiz/questions")
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

@router.get("/teacher/quizzes")
@router.get("/quizzes")
@router.get("/quiz/teacher/quizzes")
@router.get("/quiz/quizzes")
def get_teacher_quizzes(class_id: Optional[str] = None, db: Session = Depends(get_db)):
    clause = "WHERE 1=1"
    params = {}
    if class_id:
        clause += " AND (q.class_id::text = :cid OR c.class_name = :cid)"
        params["cid"] = class_id

    rows = db.execute(text(f"""
        SELECT q.*, c.class_name, COALESCE(s.name, 'General') as subject_name,
               (SELECT count(*) FROM quiz_questions WHERE quiz_id = q.id) as question_count,
               (SELECT count(*) FROM quiz_attempts WHERE quiz_id = q.id AND status IN ('submitted', 'auto_submitted', 'SUBMITTED')) as attempt_count
        FROM quizzes q
        LEFT JOIN classes c ON q.class_id = c.id
        LEFT JOIN subjects s ON q.subject_id = s.id
        {clause}
        ORDER BY q.created_at DESC
    """), params).fetchall()
    return success_response([dict(r._mapping) for r in rows])

@router.post("/teacher/quizzes")
@router.post("/quizzes")
@router.post("/quiz/teacher/quizzes")
@router.post("/quiz/quizzes")
def create_quiz(payload: QuizCreateSchema, db: Session = Depends(get_db)):
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

@router.get("/quizzes/{quiz_id}")
@router.get("/teacher/quizzes/{quiz_id}")
@router.get("/quiz/quizzes/{quiz_id}")
def get_quiz_details(quiz_id: str, db: Session = Depends(get_db)):
    row = db.execute(text("""
        SELECT q.*, c.class_name, COALESCE(s.name, 'General') as subject_name
        FROM quizzes q
        LEFT JOIN classes c ON q.class_id = c.id
        LEFT JOIN subjects s ON q.subject_id = s.id
        WHERE q.id = :id
    """), {"id": quiz_id}).fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Quiz not found")
    m = dict(row._mapping)
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

@router.put("/quizzes/{quiz_id}/publish")
@router.post("/quizzes/{quiz_id}/publish")
@router.put("/teacher/quizzes/{quiz_id}/publish")
@router.post("/teacher/quizzes/{quiz_id}/publish")
@router.put("/quiz/quizzes/{quiz_id}/publish")
@router.post("/quiz/quizzes/{quiz_id}/publish")
def publish_quiz(quiz_id: str, db: Session = Depends(get_db)):
    q = db.execute(text("SELECT * FROM quizzes WHERE id = :id"), {"id": quiz_id}).fetchone()
    if not q:
        raise HTTPException(status_code=404, detail="Quiz not found")
    cnt = db.execute(text("SELECT count(*) FROM quiz_questions WHERE quiz_id = :id"), {"id": quiz_id}).scalar() or 0
    if cnt == 0:
        raise HTTPException(status_code=400, detail="Cannot publish a quiz with 0 questions. Please add questions first.")

    db.execute(text("UPDATE quizzes SET is_published = 1, status = 'active', updated_at = CURRENT_TIMESTAMP WHERE id = :id"), {"id": quiz_id})
    c_info = db.execute(text("SELECT class_name FROM classes WHERE id = :cid"), {"cid": q._mapping["class_id"]}).fetchone()
    c_name = c_info[0] if c_info else "Target Class"
    db.execute(text("""
        INSERT INTO notifications (id, title, message, class_name, type, created_at)
        VALUES (:id, :title, :msg, :cname, 'quiz', CURRENT_TIMESTAMP)
    """), {
        "id": str(uuid.uuid4()),
        "title": f"New Quiz Published: {q._mapping['title']}",
        "msg": f"A new quiz has been published for {c_name}. Duration: {q._mapping['duration_minutes']} mins.",
        "cname": c_name
    })
    db.commit()

    # Step 7: Push Real-Time Assessment Notification to Supabase Cloud
    try:
        from backend.services.notification_service import NotificationService
        NotificationService.send_quiz_notification(
            quiz_id=quiz_id,
            class_id=str(q._mapping["class_id"]),
            title=q._mapping["title"],
            teacher_id=str(q._mapping.get("teacher_id")) if q._mapping.get("teacher_id") else None
        )
    except Exception as notif_err:
        pass

    return success_response({"id": quiz_id, "is_published": True, "status": "active"}, "Quiz published successfully")

@router.post("/quizzes/{quiz_id}/close")
@router.post("/quiz/quizzes/{quiz_id}/close")
def close_quiz(quiz_id: str, db: Session = Depends(get_db)):
    db.execute(text("UPDATE quizzes SET status = 'closed', is_published = 0, updated_at = CURRENT_TIMESTAMP WHERE id = :id"), {"id": quiz_id})
    db.commit()
    return success_response({"id": quiz_id, "status": "closed"}, "Quiz closed successfully")

@router.delete("/quizzes/{quiz_id}")
@router.delete("/teacher/quizzes/{quiz_id}")
@router.delete("/quiz/quizzes/{quiz_id}")
def delete_quiz(quiz_id: str, db: Session = Depends(get_db)):
    db.execute(text("DELETE FROM quiz_questions WHERE quiz_id = :id"), {"id": quiz_id})
    db.execute(text("DELETE FROM quiz_attempts WHERE quiz_id = :id"), {"id": quiz_id})
    db.execute(text("DELETE FROM quizzes WHERE id = :id"), {"id": quiz_id})
    db.commit()
    return success_response({"id": quiz_id}, "Quiz deleted")

@router.get("/quizzes/{quiz_id}/questions")
@router.get("/teacher/quizzes/{quiz_id}/questions")
@router.get("/quiz/quizzes/{quiz_id}/questions")
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

@router.post("/quizzes/{quiz_id}/questions")
@router.post("/teacher/quizzes/{quiz_id}/questions")
@router.post("/quiz/quizzes/{quiz_id}/questions")
def add_question_to_quiz(quiz_id: str, payload: Dict[str, Any] = Body(...), db: Session = Depends(get_db)):
    qid = payload.get("question_id")
    if not qid:
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

    max_order = db.execute(text("SELECT max(question_order) FROM quiz_questions WHERE quiz_id = :qid"), {"qid": quiz_id}).scalar() or 0
    next_order = max_order + 1
    db.execute(text("""
        INSERT INTO quiz_questions (quiz_id, question_id, question_order, marks)
        VALUES (:qid, :qbank_id, :ord, :m)
    """), {"qid": quiz_id, "qbank_id": qid, "ord": next_order, "m": payload.get("marks", 2.0)})
    db.commit()
    return success_response({"quiz_id": quiz_id, "question_id": qid, "order": next_order}, "Question added to quiz", code=201)

@router.delete("/quizzes/{quiz_id}/questions/{question_id}")
@router.delete("/teacher/quizzes/{quiz_id}/questions/{question_id}")
def remove_question_from_quiz(quiz_id: str, question_id: str, db: Session = Depends(get_db)):
    db.execute(text("DELETE FROM quiz_questions WHERE quiz_id = :qid AND question_id = :qid2"), {"qid": quiz_id, "qid2": question_id})
    db.commit()
    return success_response({"quiz_id": quiz_id, "question_id": question_id}, "Question removed")

@router.get("/student/quizzes")
@router.get("/quiz/student/quizzes")
def get_student_available_quizzes(student_code: Optional[str] = Query(None), db: Session = Depends(get_db)):
    st = None
    if student_code:
        st = db.execute(text("SELECT s.*, c.class_name FROM students s LEFT JOIN classes c ON s.class_id = c.id WHERE s.student_code = :c OR s.id::text = :c LIMIT 1"), {"c": student_code}).fetchone()
    if not st:
        st = db.execute(text("SELECT s.*, c.class_name FROM students s LEFT JOIN classes c ON s.class_id = c.id LIMIT 1")).fetchone()
    if not st:
        return success_response([])

    sm = st._mapping
    cid = sm["class_id"]
    sid = sm["id"]

    quizzes = db.execute(text("""
        SELECT q.*, c.class_name, COALESCE(s.name, 'General Subject') as subject_name,
               (SELECT count(*) FROM quiz_questions WHERE quiz_id = q.id) as question_count,
               (SELECT qa.status FROM quiz_attempts qa WHERE qa.quiz_id = q.id AND qa.student_id = :sid ORDER BY qa.created_at DESC LIMIT 1) as attempt_status,
               CASE 
                   WHEN q.result_published = TRUE THEN (SELECT qa.final_marks FROM quiz_attempts qa WHERE qa.quiz_id = q.id AND qa.student_id = :sid ORDER BY qa.created_at DESC LIMIT 1)
                   ELSE NULL
               END as attempt_score,
               (SELECT qa.id FROM quiz_attempts qa WHERE qa.quiz_id = q.id AND qa.student_id = :sid ORDER BY qa.created_at DESC LIMIT 1) as attempt_id
        FROM quizzes q
        JOIN classes c ON q.class_id = c.id
        LEFT JOIN subjects s ON q.subject_id = s.id
        WHERE q.class_id = :cid AND (q.result_published = TRUE OR UPPER(q.status) IN ('ACTIVE', 'PUBLISHED', 'SCHEDULED'))
        ORDER BY q.created_at DESC
    """), {"cid": cid, "sid": sid}).fetchall()
    return success_response([dict(r._mapping) for r in quizzes])

@router.get("/student/quizzes/{quiz_id}")
@router.get("/quiz/student/quizzes/{quiz_id}")
def get_student_quiz_info(quiz_id: str, student_code: Optional[str] = Query(None), db: Session = Depends(get_db)):
    st = None
    if student_code:
        st = db.execute(text("SELECT s.*, c.class_name FROM students s LEFT JOIN classes c ON s.class_id = c.id WHERE s.student_code = :c OR s.id::text = :c LIMIT 1"), {"c": student_code}).fetchone()
    if not st:
        st = db.execute(text("SELECT s.*, c.class_name FROM students s LEFT JOIN classes c ON s.class_id = c.id LIMIT 1")).fetchone()

    q = db.execute(text("""
        SELECT q.*, c.class_name, COALESCE(s.name, 'General Subject') as subject_name,
               (SELECT count(*) FROM quiz_questions WHERE quiz_id = q.id) as question_count
        FROM quizzes q
        LEFT JOIN classes c ON q.class_id = c.id
        LEFT JOIN subjects s ON q.subject_id = s.id
        WHERE q.id = :id
    """), {"id": quiz_id}).fetchone()
    if not q:
        raise HTTPException(status_code=404, detail="Quiz not found")

    qm = dict(q._mapping)
    if st and qm.get("class_id") and st._mapping.get("class_id") != qm.get("class_id"):
        raise HTTPException(status_code=403, detail=f"Unauthorized: This quiz is assigned to class {qm.get('class_name')}, not your enrolled class.")
    return success_response(qm)

@router.post("/student/quizzes/{quiz_id}/start")
@router.post("/quiz/student/quizzes/{quiz_id}/start")
def start_quiz_attempt(quiz_id: str, payload: Dict[str, Any] = Body(...), db: Session = Depends(get_db)):
    st_id = payload.get("student_id") or payload.get("student_code")
    st = None
    if st_id:
        st = db.execute(text("SELECT s.*, c.class_name FROM students s LEFT JOIN classes c ON s.class_id = c.id WHERE s.student_code = :c OR s.id::text = :c LIMIT 1"), {"c": st_id}).fetchone()
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

    if qm.get("class_id") and student_class_id != qm.get("class_id"):
        raise HTTPException(status_code=403, detail="Class mismatch: You cannot attempt quizzes assigned to another class.")

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

@router.get("/attempts/{attempt_id}")
@router.get("/quiz/attempts/{attempt_id}")
def get_attempt_state(attempt_id: str, db: Session = Depends(get_db)):
    att = db.execute(text("SELECT * FROM quiz_attempts WHERE id = :id"), {"id": attempt_id}).fetchone()
    if not att:
        raise HTTPException(status_code=404, detail="Attempt not found")
    am = dict(att._mapping)
    qid = am["quiz_id"]
    q = db.execute(text("SELECT * FROM quizzes WHERE id = :id"), {"id": qid}).fetchone()

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
        opts = db.execute(text("SELECT option_key, option_text FROM question_options WHERE question_id = :qid ORDER BY option_key ASC"), {"qid": qm["id"]}).fetchall()
        qm["options"] = [{"key": o[0], "text": o[1]} for o in opts]
        questions.append(qm)

    saved = db.execute(text("SELECT question_id, selected_option, text_answer FROM quiz_attempt_answers WHERE attempt_id = :aid"), {"aid": attempt_id}).fetchall()
    am["questions"] = questions
    am["quiz"] = dict(q._mapping) if q else {}
    am["saved_answers"] = {r[0]: (r[1] or r[2]) for r in saved}
    return success_response(am)

@router.put("/attempts/{attempt_id}/answers")
@router.put("/student/attempts/{attempt_id}/answers")
@router.put("/quiz/attempts/{attempt_id}/answers")
def autosave_answers(attempt_id: str, payload: Dict[str, Any] = Body(...), db: Session = Depends(get_db)):
    answers = payload.get("answers", [])
    for a in answers:
        qid = a.get("question_id")
        opt = a.get("selected_option")
        txt = a.get("text_answer")
        db.execute(text("DELETE FROM quiz_attempt_answers WHERE attempt_id = :aid AND question_id = :qid"), {"aid": attempt_id, "qid": qid})
        db.execute(text("""
            INSERT INTO quiz_attempt_answers (id, attempt_id, question_id, selected_option, text_answer, updated_at)
            VALUES (:nid, :aid, :qid, :opt, :txt, CURRENT_TIMESTAMP)
        """), {"aid": attempt_id, "qid": qid, "opt": opt, "txt": txt, "nid": str(uuid.uuid4())})
    db.commit()
    return success_response({"saved": len(answers)}, "Answers autosaved successfully")

@router.post("/attempts/{attempt_id}/submit")
@router.post("/student/attempts/{attempt_id}/submit")
@router.post("/quiz/attempts/{attempt_id}/submit")
def submit_quiz_attempt(attempt_id: str, payload: QuizSubmitRequest, db: Session = Depends(get_db)):
    try:
        result = QuizService.evaluate_submission(attempt_id, payload.answers or [], bool(payload.is_auto_submit), db)
        return success_response(result, "Quiz evaluated successfully")
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.post("/attempts/{attempt_id}/security-event")
def record_security_event(attempt_id: str, payload: SecurityEventRequest, db: Session = Depends(get_db)):
    import json
    eid = str(uuid.uuid4())
    db.execute(text("""
        INSERT INTO quiz_security_events (id, attempt_id, event_type, event_time, metadata)
        VALUES (:id, :aid, :type, CURRENT_TIMESTAMP, :meta)
    """), {"id": eid, "aid": attempt_id, "type": payload.event_type, "meta": json.dumps(payload.metadata or {})})
    db.commit()
    return success_response({"event_id": eid}, "Security event recorded")

@router.get("/quizzes/{quiz_id}/results")
@router.get("/quiz/quizzes/{quiz_id}/results")
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

@router.get("/quizzes/{quiz_id}/analytics")
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

@router.get("/quizzes/{quiz_id}/leaderboard")
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

@router.get("/quizzes/{quiz_id}/export")
@router.get("/quiz/quizzes/{quiz_id}/export")
def export_quiz_results(
    quiz_id: str,
    format: str = Query("csv"),
    filter: str = Query("all"),
    db: Session = Depends(get_db)
):
    try:
        csv_data, filename = QuizService.generate_class_export_csv(quiz_id, filter, db)
        return Response(
            content=csv_data,
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
