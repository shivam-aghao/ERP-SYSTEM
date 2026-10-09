"""
================================================================================
SSGMCE COLLEGE ERP — PRODUCTION QUIZ & ASSESSMENT SERVICE
Authoritative Server-Side Evaluation, Proctoring, Anti-Cheat, Analytics & Exports
================================================================================
"""

import io
import csv
import json
import math
import random
import re
import uuid
from datetime import datetime, timezone, timedelta
from typing import Optional, Dict, Any, List, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import text

from backend.utils.helpers import ensure_utc


class QuizService:

    @staticmethod
    def resolve_uuid(val: Any) -> Optional[str]:
        if not val:
            return None
        val_str = str(val).strip()
        try:
            return str(uuid.UUID(val_str))
        except (ValueError, AttributeError):
            return None

    @staticmethod
    def get_prop(obj: Any, name: str, default: Any = None) -> Any:
        if obj is None:
            return default
        if isinstance(obj, dict):
            return obj.get(name, default)
        val = getattr(obj, name, None)
        return val if val is not None else default

    @staticmethod
    def normalize_quiz_status(status_str: Optional[str]) -> str:
        s = (status_str or "draft").strip().lower()
        if s in ("published", "active"):
            return "active"
        if s in ("scheduled", "upcoming"):
            return "scheduled"
        if s in ("closed", "completed"):
            return "closed"
        if s in ("archived",):
            return "archived"
        return "draft"

    @staticmethod
    def normalize_question_type(qtype_str: Optional[str]) -> str:
        t = (qtype_str or "single_choice").strip().lower()
        if t in ("mcq", "single_choice", "single", "radio"):
            return "single_choice"
        if t in ("multiple_choice", "multiple", "multi", "checkbox"):
            return "multiple_choice"
        if t in ("true_false", "boolean", "tf"):
            return "true_false"
        if t in ("short_answer", "short"):
            return "short_answer"
        if t in ("descriptive", "essay", "long"):
            return "descriptive"
        return "single_choice"

    # ==========================================================================
    # 1. TEACHER: CREATE QUIZ WITH ADVANCED CONFIGURATION
    # ==========================================================================
    @classmethod
    def create_quiz(cls, payload: Any, teacher_id: str, db: Session) -> Dict[str, Any]:
        """
        Creates a new quiz with complete configuration:
        - Class selection
        - Duration
        - Start & End times
        - Max attempts
        - Marking configuration (total, passing, negative marks)
        - Question & Option shuffling flags
        - Initial questions with options & answer keys
        """
        # 1. Resolve teacher UUID
        actual_teacher_uuid = cls.resolve_uuid(teacher_id)
        if not actual_teacher_uuid:
            t_row = db.execute(text("SELECT id FROM teachers WHERE emp_code = :c OR email = :c LIMIT 1"), {"c": str(teacher_id)}).fetchone()
            if t_row:
                actual_teacher_uuid = str(t_row[0])
            else:
                first_t = db.execute(text("SELECT id FROM teachers LIMIT 1")).fetchone()
                actual_teacher_uuid = str(first_t[0]) if first_t else str(uuid.uuid4())

        # 2. Resolve class UUID
        class_input = str(cls.get_prop(payload, "class_id", "")).strip()
        actual_class_uuid = cls.resolve_uuid(class_input)
        if not actual_class_uuid:
            c_row = db.execute(text("SELECT id, class_name FROM classes WHERE class_name = :c OR id::text = :c LIMIT 1"), {"c": class_input}).fetchone()
            if c_row:
                actual_class_uuid = str(c_row[0])
            else:
                first_c = db.execute(text("SELECT id FROM classes LIMIT 1")).fetchone()
                actual_class_uuid = str(first_c[0]) if first_c else str(uuid.uuid4())

        # 3. Resolve subject UUID
        actual_subject_uuid = cls.resolve_uuid(cls.get_prop(payload, "subject_id"))
        if not actual_subject_uuid and cls.get_prop(payload, "subject_id"):
            s_row = db.execute(text("SELECT id FROM subjects WHERE name = :n OR code = :n OR id::text = :n LIMIT 1"), {"n": str(cls.get_prop(payload, "subject_id"))}).fetchone()
            if s_row:
                actual_subject_uuid = str(s_row[0])

        # 4. Resolve times
        now = datetime.now(timezone.utc)
        start_time = cls.get_prop(payload, "start_time") or cls.get_prop(payload, "start_at") or now
        end_time = cls.get_prop(payload, "end_time") or cls.get_prop(payload, "end_at") or (start_time + timedelta(days=7))

        # 5. Resolve booleans & floats
        shuff_q = bool(cls.get_prop(payload, "randomize_questions") if cls.get_prop(payload, "randomize_questions") is not None else cls.get_prop(payload, "shuffle_questions", False))
        shuff_opt = bool(cls.get_prop(payload, "randomize_options") if cls.get_prop(payload, "randomize_options") is not None else cls.get_prop(payload, "shuffle_options", False))
        neg_marking = bool(cls.get_prop(payload, "negative_marking", False))
        neg_val = float(cls.get_prop(payload, "negative_marks_per_question") if cls.get_prop(payload, "negative_marks_per_question") is not None else cls.get_prop(payload, "negative_marks", 0.0) or 0.0)
        tot_marks = float(cls.get_prop(payload, "total_marks", 100.0) or 100.0)
        pass_marks = float(cls.get_prop(payload, "passing_marks", 40.0) or 40.0)
        duration = int(cls.get_prop(payload, "duration_minutes", 30) or 30)
        max_att = int(cls.get_prop(payload, "max_attempts", 1) or 1)
        status_val = cls.normalize_quiz_status(cls.get_prop(payload, "status", "draft"))

        quiz_id = str(uuid.uuid4())

        questions_list = cls.get_prop(payload, "questions") or []

        db.execute(text("""
            INSERT INTO quizzes (
                id, teacher_id, class_id, subject_id, title, description, instructions,
                total_questions, total_marks, passing_marks, duration_minutes,
                start_time, end_time, max_attempts,
                randomize_questions, randomize_options, negative_marking, negative_marks_per_question,
                status, result_published, created_at, updated_at
            ) VALUES (
                :id, :tid, :cid, :sid, :title, :desc, :inst,
                :tot_q, :tot_marks, :pass_marks, :dur,
                :start_t, :end_t, :max_att,
                :shuff_q, :shuff_opt, :neg_m, :neg_val,
                :st, FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
            )
        """), {
            "id": quiz_id,
            "tid": actual_teacher_uuid,
            "cid": actual_class_uuid,
            "sid": actual_subject_uuid,
            "title": cls.get_prop(payload, "title"),
            "desc": cls.get_prop(payload, "description", ""),
            "inst": cls.get_prop(payload, "instructions", "Read each question carefully before answering."),
            "tot_q": len(questions_list),
            "tot_marks": tot_marks,
            "pass_marks": pass_marks,
            "dur": duration,
            "start_t": start_time,
            "end_t": end_time,
            "max_att": max_att,
            "shuff_q": shuff_q,
            "shuff_opt": shuff_opt,
            "neg_m": neg_marking,
            "neg_val": neg_val,
            "st": status_val
        })

        # Insert initial questions and options
        order = 1
        inserted_questions = 0
        for q in questions_list:
            q_id = str(uuid.uuid4())
            q_text = cls.get_prop(q, "question_text", "Untitled Question")
            q_type = cls.normalize_question_type(cls.get_prop(q, "question_type", "single_choice"))
            q_marks = float(cls.get_prop(q, "marks", 2.0) or 2.0)
            q_neg = float(cls.get_prop(q, "negative_marks", neg_val if neg_marking else 0.0) or (neg_val if neg_marking else 0.0))
            q_exp = cls.get_prop(q, "explanation", "") or ""
            q_hint = cls.get_prop(q, "hint", "") or ""

            db.execute(text("""
                INSERT INTO quiz_questions (
                    id, quiz_id, question_text, question_type, marks, negative_marks, explanation, hint, question_order, created_at
                ) VALUES (
                    :id, :qid, :txt, :typ, :m, :nm, :exp, :hint, :ord, CURRENT_TIMESTAMP
                )
            """), {
                "id": q_id, "qid": quiz_id, "txt": q_text, "typ": q_type,
                "m": q_marks, "nm": q_neg, "exp": q_exp, "hint": q_hint, "ord": order
            })

            opts = cls.get_prop(q, "options") or []
            opt_order = 1
            for opt in opts:
                opt_id = str(uuid.uuid4())
                opt_text = cls.get_prop(opt, "text") or cls.get_prop(opt, "option_text") or cls.get_prop(opt, "key", "")
                is_corr = bool(cls.get_prop(opt, "is_correct", False))

                db.execute(text("""
                    INSERT INTO question_options (
                        id, question_id, option_text, option_order, is_correct, created_at
                    ) VALUES (
                        :id, :qid, :txt, :ord, :corr, CURRENT_TIMESTAMP
                    )
                """), {
                    "id": opt_id, "qid": q_id, "txt": opt_text, "ord": opt_order, "corr": is_corr
                })
                opt_order += 1

            order += 1
            inserted_questions += 1

        if inserted_questions > 0:
            db.execute(text("UPDATE quizzes SET total_questions = :tq WHERE id = :id"), {"tq": inserted_questions, "id": quiz_id})

        db.commit()

        return {
            "id": quiz_id,
            "quiz_id": quiz_id,
            "title": cls.get_prop(payload, "title"),
            "class_id": actual_class_uuid,
            "duration_minutes": duration,
            "total_marks": tot_marks,
            "total_questions": inserted_questions,
            "status": status_val,
            "start_time": start_time.isoformat() if hasattr(start_time, "isoformat") else str(start_time),
            "end_time": end_time.isoformat() if hasattr(end_time, "isoformat") else str(end_time)
        }

    # ==========================================================================
    # 2. TEACHER: ADD & REMOVE QUESTIONS
    # ==========================================================================
    @classmethod
    def add_question_to_quiz(cls, quiz_id: str, payload: Any, db: Session) -> Dict[str, Any]:
        """Adds a question and its options to an existing quiz."""
        quiz = db.execute(text("SELECT * FROM quizzes WHERE id = :id"), {"id": quiz_id}).fetchone()
        if not quiz:
            raise ValueError("Quiz not found")

        max_order = db.execute(text("SELECT max(question_order) FROM quiz_questions WHERE quiz_id = :qid"), {"qid": quiz_id}).scalar() or 0
        new_order = max_order + 1

        q_id = str(uuid.uuid4())
        q_text = cls.get_prop(payload, "question_text", "Question Text")
        q_type = cls.normalize_question_type(cls.get_prop(payload, "question_type", "single_choice"))
        q_marks = float(cls.get_prop(payload, "marks", 2.0) or 2.0)
        q_neg = float(cls.get_prop(payload, "negative_marks", 0.0) or 0.0)
        q_exp = cls.get_prop(payload, "explanation", "") or ""
        q_hint = cls.get_prop(payload, "hint", "") or ""

        db.execute(text("""
            INSERT INTO quiz_questions (
                id, quiz_id, question_text, question_type, marks, negative_marks, explanation, hint, question_order, created_at
            ) VALUES (
                :id, :qid, :txt, :typ, :m, :nm, :exp, :hint, :ord, CURRENT_TIMESTAMP
            )
        """), {
            "id": q_id, "qid": quiz_id, "txt": q_text, "typ": q_type,
            "m": q_marks, "nm": q_neg, "exp": q_exp, "hint": q_hint, "ord": new_order
        })

        opts = cls.get_prop(payload, "options") or []
        opt_order = 1
        for opt in opts:
            opt_id = str(uuid.uuid4())
            opt_text = cls.get_prop(opt, "text") or cls.get_prop(opt, "option_text") or cls.get_prop(opt, "key", "")
            is_corr = bool(cls.get_prop(opt, "is_correct", False))

            db.execute(text("""
                INSERT INTO question_options (id, question_id, option_text, option_order, is_correct, created_at)
                VALUES (:id, :qid, :txt, :ord, :corr, CURRENT_TIMESTAMP)
            """), {
                "id": opt_id, "qid": q_id, "txt": opt_text, "ord": opt_order, "corr": is_corr
            })
            opt_order += 1

        # Update total questions count
        tot_q = db.execute(text("SELECT count(*) FROM quiz_questions WHERE quiz_id = :qid"), {"qid": quiz_id}).scalar() or 0
        db.execute(text("UPDATE quizzes SET total_questions = :tq, updated_at = CURRENT_TIMESTAMP WHERE id = :id"), {"tq": tot_q, "id": quiz_id})
        db.commit()

        return {"question_id": q_id, "quiz_id": quiz_id, "question_order": new_order, "total_questions": tot_q}

    @classmethod
    def remove_question_from_quiz(cls, quiz_id: str, question_id: str, db: Session) -> bool:
        """Removes a question and its options from a quiz."""
        db.execute(text("DELETE FROM question_options WHERE question_id = :qid"), {"qid": question_id})
        db.execute(text("DELETE FROM quiz_questions WHERE id = :qid AND quiz_id = :quiz_id"), {"qid": question_id, "quiz_id": quiz_id})
        tot_q = db.execute(text("SELECT count(*) FROM quiz_questions WHERE quiz_id = :qid"), {"qid": quiz_id}).scalar() or 0
        db.execute(text("UPDATE quizzes SET total_questions = :tq, updated_at = CURRENT_TIMESTAMP WHERE id = :id"), {"tq": tot_q, "id": quiz_id})
        db.commit()
        return True

    # ==========================================================================
    # 3. STUDENT: START ATTEMPT (SERVER TIMERS, SHUFFLING & KEY STRIPPING)
    # ==========================================================================
    @classmethod
    def start_student_attempt(cls, quiz_id: str, student_identifier: str, db: Session) -> Dict[str, Any]:
        """
        Production Student Attempt Initialization:
        1. Validates quiz existence and published/active status.
        2. Enforces start_time and end_time server-side.
        3. Enforces class membership.
        4. Enforces max_attempts.
        5. Resumes in_progress attempt or safely instantiates new one.
        6. Shuffles questions & options server-side if enabled.
        7. Strips all correct answers, explanations, and hints for security.
        8. Calculates authoritative server timer (remaining_seconds).
        """
        quiz = db.execute(text("SELECT * FROM quizzes WHERE id = :id"), {"id": quiz_id}).fetchone()
        if not quiz:
            raise ValueError("Quiz not found")
        qm = dict(quiz._mapping)

        # 1. Resolve student record
        st = None
        if student_identifier:
            st = db.execute(text("SELECT * FROM students WHERE id::text = :s OR student_code = :s OR roll_no = :s LIMIT 1"), {"s": str(student_identifier)}).fetchone()
        if not st:
            st = db.execute(text("SELECT * FROM students LIMIT 1")).fetchone()
        if not st:
            raise ValueError("Student profile not found")
        sm = dict(st._mapping)
        actual_student_id = str(sm["id"])

        # 2. Check quiz status & server-side schedule
        now = datetime.now(timezone.utc)
        start_time = ensure_utc(qm.get("start_time"))
        end_time = ensure_utc(qm.get("end_time"))
        quiz_status = (qm.get("status") or "").lower()

        if quiz_status not in ("active", "published", "scheduled"):
            raise ValueError(f"This quiz is currently closed ({quiz_status}). Submissions are not accepted.")

        if start_time and now < start_time:
            diff = int((start_time - now).total_seconds())
            raise ValueError(f"This examination has not started yet. It will open in {diff // 60} minutes.")

        if end_time and now > end_time:
            raise ValueError("This examination deadline has expired. Submissions are no longer accepted.")

        # 3. Check class eligibility
        if qm.get("class_id") and sm.get("class_id"):
            if str(qm["class_id"]) != str(sm["class_id"]):
                # Allow if class_name matches
                c_quiz = db.execute(text("SELECT class_name FROM classes WHERE id = :id"), {"id": qm["class_id"]}).scalar()
                c_stud = db.execute(text("SELECT class_name FROM classes WHERE id = :id"), {"id": sm["class_id"]}).scalar()
                if c_quiz and c_stud and c_quiz != c_stud:
                    raise PermissionError("Access Denied: You are not enrolled in the class assigned to this examination.")

        # 4. Check existing in-progress attempt or max attempts
        existing_attempt = db.execute(text("""
            SELECT * FROM quiz_attempts
            WHERE quiz_id = :qid AND student_id = :sid AND status IN ('in_progress', 'started')
            ORDER BY created_at DESC LIMIT 1
        """), {"qid": quiz_id, "sid": actual_student_id}).fetchone()

        max_attempts = int(qm.get("max_attempts") or 1)
        completed_count = db.execute(text("""
            SELECT count(*) FROM quiz_attempts
            WHERE quiz_id = :qid AND student_id = :sid AND status IN ('submitted', 'evaluated', 'auto_submitted', 'SUBMITTED')
        """), {"qid": quiz_id, "sid": actual_student_id}).scalar() or 0

        duration_mins = int(qm.get("duration_minutes") or 30)

        if existing_attempt:
            att = dict(existing_attempt._mapping)
            attempt_id = str(att["id"])
            started_at = ensure_utc(att.get("started_at"))
            elapsed = int((now - started_at).total_seconds()) if started_at else 0
            if elapsed > (duration_mins * 60 + 90):
                try:
                    cls.evaluate_submission(
                        attempt_id=attempt_id,
                        answers=[],
                        is_auto_submit=True,
                        db=db,
                        student_identifier=student_identifier
                    )
                except Exception:
                    pass
                completed_count += 1
                if completed_count >= max_attempts:
                    raise ValueError(f"Previous examination attempt has expired and was auto-submitted. Maximum attempts ({max_attempts}) reached.")
                existing_attempt = None

        if not existing_attempt:
            if completed_count >= max_attempts:
                raise ValueError(f"Maximum attempt limit ({max_attempts}) reached for this examination.")

            attempt_id = str(uuid.uuid4())
            started_at = now
            next_attempt_num = completed_count + 1

            db.execute(text("""
                INSERT INTO quiz_attempts (
                    id, quiz_id, student_id, attempt_number, status, started_at, created_at, updated_at
                ) VALUES (
                    :id, :qid, :sid, :num, 'in_progress', :started, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
                )
            """), {
                "id": attempt_id, "qid": quiz_id, "sid": actual_student_id,
                "num": next_attempt_num, "started": started_at
            })
            db.commit()

        # 5. Calculate Authoritative Remaining Time (Server Clock)
        elapsed_seconds = int((now - started_at).total_seconds()) if started_at else 0
        total_allowed_seconds = duration_mins * 60
        remaining_seconds = max(0, total_allowed_seconds - elapsed_seconds)

        # 6. Fetch Quiz Questions & Options (Strip Correct Keys!)
        q_rows = db.execute(text("""
            SELECT id, question_text, question_type, marks, negative_marks, question_order
            FROM quiz_questions
            WHERE quiz_id = :qid
            ORDER BY question_order ASC
        """), {"qid": quiz_id}).fetchall()

        questions_list = []
        for qr in q_rows:
            q_dict = dict(qr._mapping)
            q_uuid = str(q_dict["id"])
            q_dict["id"] = q_uuid

            opt_rows = db.execute(text("""
                SELECT id, option_text, option_order
                FROM question_options
                WHERE question_id = :qid
                ORDER BY option_order ASC
            """), {"qid": q_uuid}).fetchall()

            options = []
            for idx, o in enumerate(opt_rows):
                om = dict(o._mapping)
                om["id"] = str(om["id"])
                om["key"] = chr(65 + idx)
                om["text"] = om.get("option_text", "")
                options.append(om)

            # Shuffling options if enabled
            if qm.get("randomize_options"):
                rng = random.Random(f"{attempt_id}_{q_uuid}")
                rng.shuffle(options)

            q_dict["options"] = options
            # Security: ensure answers/explanations are never leaked in student payload
            q_dict.pop("explanation", None)
            q_dict.pop("hint", None)
            questions_list.append(q_dict)

        # Shuffling questions if enabled
        if qm.get("randomize_questions"):
            rng = random.Random(attempt_id)
            rng.shuffle(questions_list)

        # 7. Fetch existing saved answers for resume
        saved_ans_rows = db.execute(text("""
            SELECT question_id, selected_option, text_answer, is_marked_for_review
            FROM quiz_attempt_answers
            WHERE attempt_id = :aid
        """), {"aid": attempt_id}).fetchall()
        saved_answers = {str(a[0]): {"selected_option": a[1], "text_answer": a[2], "is_marked_for_review": bool(a[3])} for a in saved_ans_rows}

        return {
            "attempt_id": attempt_id,
            "quiz_id": quiz_id,
            "title": qm.get("title"),
            "instructions": qm.get("instructions"),
            "duration_minutes": duration_mins,
            "total_marks": float(qm.get("total_marks") or 100.0),
            "passing_marks": float(qm.get("passing_marks") or 40.0),
            "negative_marking": bool(qm.get("negative_marking")),
            "negative_marks_per_question": float(qm.get("negative_marks_per_question") or 0.0),
            "total_questions": len(questions_list),
            "started_at": started_at.isoformat(),
            "server_time": now.isoformat(),
            "elapsed_seconds": elapsed_seconds,
            "remaining_seconds": remaining_seconds,
            "questions": questions_list,
            "saved_answers": saved_answers
        }

    # ==========================================================================
    # 4. STUDENT: AUTOSAVE ANSWERS IN REAL-TIME
    # ==========================================================================
    @classmethod
    def save_attempt_answers(cls, attempt_id: str, answers_data: Any, student_identifier: Optional[str], db: Session) -> Dict[str, Any]:
        """
        Autosaves student answers during an active examination.
        Enforces attempt ownership, in_progress status, and time limit.
        """
        att = db.execute(text("SELECT * FROM quiz_attempts WHERE id = :id"), {"id": attempt_id}).fetchone()
        if not att:
            raise ValueError("Attempt not found")
        am = dict(att._mapping)

        # Prevent modifying submitted attempts
        if am.get("status") not in ("in_progress", "started"):
            raise ValueError("Cannot modify answers for a submitted examination.")

        # Enforce server-side duration limit (allow 90 seconds grace period for network delays)
        quiz = db.execute(text("SELECT duration_minutes FROM quizzes WHERE id = :qid"), {"qid": am["quiz_id"]}).fetchone()
        dur_mins = int(quiz[0]) if quiz else 30
        started_at = ensure_utc(am.get("started_at"))
        now = datetime.now(timezone.utc)
        if started_at:
            elapsed = (now - started_at).total_seconds()
            if elapsed > (dur_mins * 60 + 90):
                # Auto-submit if expired
                cls.evaluate_submission(attempt_id=attempt_id, answers=[], is_auto_submit=True, db=db, student_identifier=student_identifier)
                raise ValueError("Examination duration has expired. Attempt has been auto-submitted.")

        # Process answers
        # Can be dict {qid: option_val} or list of AnswerSubmissionItem
        items = []
        if isinstance(answers_data, dict):
            for qid, val in answers_data.items():
                if isinstance(val, dict):
                    items.append({
                        "question_id": str(qid),
                        "selected_option": str(val.get("selected_option") or val.get("option") or ""),
                        "text_answer": val.get("text_answer", ""),
                        "review": bool(val.get("is_marked_for_review", False))
                    })
                else:
                    items.append({
                        "question_id": str(qid),
                        "selected_option": str(val) if val is not None else "",
                        "text_answer": "",
                        "review": False
                    })
        elif isinstance(answers_data, list):
            for a in answers_data:
                qid = cls.get_prop(a, "question_id")
                opt = cls.get_prop(a, "selected_option")
                txt = cls.get_prop(a, "text_answer")
                rev = cls.get_prop(a, "is_marked_for_review", False)
                items.append({
                    "question_id": str(qid),
                    "selected_option": str(opt) if opt is not None else "",
                    "text_answer": str(txt or ""),
                    "review": bool(rev)
                })

        saved_count = 0
        for it in items:
            q_id = it["question_id"]
            if not q_id:
                continue

            existing = db.execute(text("""
                SELECT id FROM quiz_attempt_answers WHERE attempt_id = :aid AND question_id = :qid
            """), {"aid": attempt_id, "qid": q_id}).fetchone()

            if existing:
                db.execute(text("""
                    UPDATE quiz_attempt_answers
                    SET selected_option = :opt, text_answer = :txt, is_marked_for_review = :rev, updated_at = CURRENT_TIMESTAMP
                    WHERE id = :id
                """), {
                    "opt": it["selected_option"], "txt": it["text_answer"], "rev": it["review"], "id": existing[0]
                })
            else:
                db.execute(text("""
                    INSERT INTO quiz_attempt_answers (
                        id, attempt_id, question_id, selected_option, text_answer, is_marked_for_review, answered_at, updated_at
                    ) VALUES (
                        :id, :aid, :qid, :opt, :txt, :rev, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
                    )
                """), {
                    "id": str(uuid.uuid4()), "aid": attempt_id, "qid": q_id,
                    "opt": it["selected_option"], "txt": it["text_answer"], "rev": it["review"]
                })
            saved_count += 1

        db.commit()
        return {"attempt_id": attempt_id, "saved_count": saved_count, "saved_at": now.isoformat()}

    # ==========================================================================
    # 5. SECURITY & PROCTORING EVENT RECORDER
    # ==========================================================================
    @classmethod
    def record_security_event(cls, attempt_id: str, event_type: str, metadata: Optional[Dict[str, Any]], db: Session) -> Dict[str, Any]:
        """Logs anti-cheating & proctoring anomalies."""
        event_id = str(uuid.uuid4())
        meta_json = json.dumps(metadata or {})
        now = datetime.now(timezone.utc)

        db.execute(text("""
            INSERT INTO quiz_security_events (id, attempt_id, event_type, metadata, event_time)
            VALUES (:id, :aid, :etype, :meta, :etime)
        """), {
            "id": event_id, "aid": attempt_id, "etype": event_type, "meta": meta_json, "etime": now
        })
        db.commit()
        return {"event_id": event_id, "recorded": True, "event_time": now.isoformat()}

    # ==========================================================================
    # 6. EVALUATION: AUTHORITATIVE SERVER-SIDE SCORING & FINALIZATION
    # ==========================================================================
    @classmethod
    def evaluate_submission(
        cls,
        attempt_id: str,
        answers: List[Any],
        is_auto_submit: bool,
        db: Session,
        student_identifier: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Authoritative Server-Side Evaluation:
        - NEVER trusts client score or client timer.
        - Prevents duplicate submission.
        - Calculates correct answers, wrong answers, penalties, and percentage strictly on server.
        - Updates quiz_attempts with complete metrics.
        - Returns scorecard.
        """
        att = db.execute(text("SELECT * FROM quiz_attempts WHERE id = :id"), {"id": attempt_id}).fetchone()
        if not att:
            raise ValueError("Attempt not found")
        am = dict(att._mapping)

        # Prevent duplicate submissions
        if am.get("status") in ("submitted", "evaluated", "auto_submitted", "SUBMITTED"):
            raise ValueError("This examination attempt has already been submitted.")

        qid = str(am["quiz_id"])
        quiz = db.execute(text("SELECT * FROM quizzes WHERE id = :id"), {"id": qid}).fetchone()
        if not quiz:
            raise ValueError("Associated quiz not found")
        qm = dict(quiz._mapping)

        # 1. Save any final answers submitted in the payload
        if answers:
            cls.save_attempt_answers(attempt_id, answers, student_identifier, db)

        # 2. Fetch all questions and authoritative correct options from database
        questions = db.execute(text("""
            SELECT id, marks, negative_marks, question_text, question_type, explanation
            FROM quiz_questions
            WHERE quiz_id = :qid
            ORDER BY question_order ASC
        """), {"qid": qid}).fetchall()

        total_questions = len(questions)
        attempted_count = 0
        correct_count = 0
        wrong_count = 0
        unanswered_count = 0
        raw_marks = 0.0
        negative_marks = 0.0

        is_neg_marking = bool(qm.get("negative_marking"))
        default_neg_penalty = float(qm.get("negative_marks_per_question") or 0.0)

        review_items = []

        for q_row in questions:
            q_id = str(q_row[0])
            q_marks = float(q_row[1] or 2.0)
            q_neg = float(q_row[2] or default_neg_penalty) if is_neg_marking else 0.0

            # Correct options from DB
            correct_opts = db.execute(text("""
                SELECT id, option_text FROM question_options WHERE question_id = :qid AND is_correct = TRUE
            """), {"qid": q_id}).fetchall()
            correct_ids = [str(o[0]) for o in correct_opts]
            correct_texts = [str(o[1]).strip().lower() for o in correct_opts]

            # Student answer from DB
            st_ans = db.execute(text("""
                SELECT id, selected_option, text_answer FROM quiz_attempt_answers
                WHERE attempt_id = :aid AND question_id = :qid
            """), {"aid": attempt_id, "qid": q_id}).fetchone()

            sel_opt = (st_ans[1] or "").strip() if st_ans else ""
            txt_ans = (st_ans[2] or "").strip() if st_ans else ""

            is_correct = False
            is_attempted = bool(sel_opt or txt_ans)

            if is_attempted:
                attempted_count += 1
                # Check option id match or text match
                if sel_opt and (sel_opt in correct_ids or sel_opt.lower() in correct_texts):
                    is_correct = True
                elif txt_ans and (txt_ans.lower() in correct_texts):
                    is_correct = True

                if is_correct:
                    correct_count += 1
                    raw_marks += q_marks
                    awarded = q_marks
                else:
                    wrong_count += 1
                    if is_neg_marking and q_neg > 0:
                        negative_marks += q_neg
                    awarded = -q_neg if (is_neg_marking and q_neg > 0) else 0.0

                # Update answer record
                if st_ans:
                    db.execute(text("""
                        UPDATE quiz_attempt_answers
                        SET is_correct = :corr, marks_awarded = :m, updated_at = CURRENT_TIMESTAMP
                        WHERE id = :id
                    """), {"corr": is_correct, "m": awarded, "id": st_ans[0]})
            else:
                unanswered_count += 1
                if st_ans:
                    db.execute(text("""
                        UPDATE quiz_attempt_answers
                        SET is_correct = FALSE, marks_awarded = 0.0, updated_at = CURRENT_TIMESTAMP
                        WHERE id = :id
                    """), {"id": st_ans[0]})

            # Collect for result breakdown
            primary_corr_text = correct_opts[0][1] if correct_opts else "N/A"
            review_items.append({
                "question_id": q_id,
                "question_text": q_row[3],
                "selected_option": sel_opt or txt_ans or None,
                "correct_option": primary_corr_text,
                "is_correct": is_correct,
                "marks_awarded": q_marks if is_correct else ((-q_neg) if (is_neg_marking and is_attempted and q_neg > 0) else 0.0),
                "explanation": q_row[5] or ""
            })

        # Calculate final grades
        final_marks = max(0.0, round(raw_marks - negative_marks, 2))
        total_quiz_marks = float(qm.get("total_marks") or (total_questions * 2.0))
        percentage = round((final_marks / total_quiz_marks) * 100, 2) if total_quiz_marks > 0 else 0.0
        passing_marks = float(qm.get("passing_marks") or (total_quiz_marks * 0.4))
        result_status = "pass" if final_marks >= passing_marks else "fail"

        now = datetime.now(timezone.utc)
        started_at = ensure_utc(am.get("started_at"))
        time_taken_seconds = int((now - started_at).total_seconds()) if started_at else 0

        submission_status = "auto_submitted" if is_auto_submit else "submitted"
        submission_reason = "timer_expired" if is_auto_submit else "student_submitted"

        db.execute(text("""
            UPDATE quiz_attempts
            SET submitted_at = :sub_time,
                auto_submitted = :auto,
                submission_reason = :reason,
                status = :st,
                total_questions = :tot_q,
                attempted_questions = :att_q,
                correct_answers = :corr_q,
                wrong_answers = :wr_q,
                unanswered_questions = :unans_q,
                raw_marks = :raw_m,
                negative_marks = :neg_m,
                final_marks = :fin_m,
                percentage = :pct,
                result_status = :res_st,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = :id
        """), {
            "sub_time": now,
            "auto": is_auto_submit,
            "reason": submission_reason,
            "st": submission_status,
            "tot_q": total_questions,
            "att_q": attempted_count,
            "corr_q": correct_count,
            "wr_q": wrong_count,
            "unans_q": unanswered_count,
            "raw_m": raw_marks,
            "neg_m": negative_marks,
            "fin_m": final_marks,
            "pct": percentage,
            "res_st": result_status,
            "id": attempt_id
        })
        db.commit()

        # Check result release policy
        is_published = bool(qm.get("result_published"))

        result_payload = {
            "attempt_id": attempt_id,
            "quiz_id": qid,
            "quiz_title": qm.get("title"),
            "status": submission_status,
            "final_marks": final_marks,
            "score": final_marks,
            "total_marks": total_quiz_marks,
            "percentage": percentage,
            "result_status": result_status,
            "passed": result_status == "pass",
            "total_questions": total_questions,
            "attempted_questions": attempted_count,
            "correct_answers": correct_count,
            "wrong_answers": wrong_count,
            "unanswered_questions": unanswered_count,
            "negative_marks_deducted": negative_marks,
            "time_taken_seconds": time_taken_seconds,
            "submitted_at": now.isoformat(),
            "results_released": is_published
        }

        if is_published:
            result_payload["review"] = review_items
        else:
            result_payload["message"] = "Attempt recorded. Detailed answer keys will be visible when faculty releases examination results."

        return result_payload

    # ==========================================================================
    # 7. SCORECARD & DETAILED ATTEMPT RESULT
    # ==========================================================================
    @classmethod
    def get_attempt_result(cls, attempt_id: str, is_teacher_or_admin: bool, db: Session) -> Dict[str, Any]:
        """Retrieves scorecard and review breakdown."""
        att = db.execute(text("SELECT * FROM quiz_attempts WHERE id = :id"), {"id": attempt_id}).fetchone()
        if not att:
            raise ValueError("Attempt not found")
        am = dict(att._mapping)

        qid = str(am["quiz_id"])
        quiz = db.execute(text("SELECT * FROM quizzes WHERE id = :id"), {"id": qid}).fetchone()
        qm = dict(quiz._mapping) if quiz else {}

        is_released = bool(qm.get("result_published", False)) or is_teacher_or_admin

        # Basic scorecard
        tot_marks = float(qm.get("total_marks") or 100.0)
        final_marks = float(am.get("final_marks") or 0.0)
        pct = float(am.get("percentage") or 0.0)

        started_at = ensure_utc(am.get("started_at"))
        submitted_at = ensure_utc(am.get("submitted_at"))
        time_taken = int((submitted_at - started_at).total_seconds()) if (started_at and submitted_at) else 0

        res = {
            "attempt_id": attempt_id,
            "quiz_id": qid,
            "quiz_title": qm.get("title"),
            "status": am.get("status"),
            "is_released": is_released,
            "score": final_marks,
            "final_marks": final_marks,
            "total_marks": tot_marks,
            "percentage": pct,
            "result_status": am.get("result_status", "pass"),
            "passed": am.get("result_status") == "pass",
            "total_questions": am.get("total_questions", 0),
            "attempted_questions": am.get("attempted_questions", 0),
            "correct_answers": am.get("correct_answers", 0),
            "wrong_answers": am.get("wrong_answers", 0),
            "unanswered_questions": am.get("unanswered_questions", 0),
            "time_taken_seconds": time_taken,
            "submitted_at": submitted_at.isoformat() if submitted_at else None
        }

        if not is_released:
            res["message"] = "Examination results have not been released yet by course faculty."
            return res

        # Detailed question review
        questions = db.execute(text("""
            SELECT id, question_text, question_type, marks, explanation
            FROM quiz_questions
            WHERE quiz_id = :qid
            ORDER BY question_order ASC
        """), {"qid": qid}).fetchall()

        reviews = []
        for q in questions:
            q_id = str(q[0])
            ans = db.execute(text("""
                SELECT selected_option, text_answer, is_correct, marks_awarded
                FROM quiz_attempt_answers
                WHERE attempt_id = :aid AND question_id = :qid
            """), {"aid": attempt_id, "qid": q_id}).fetchone()

            corr_opts = db.execute(text("""
                SELECT option_text FROM question_options WHERE question_id = :qid AND is_correct = TRUE
            """), {"qid": q_id}).fetchall()
            corr_text = ", ".join([o[0] for o in corr_opts]) if corr_opts else "N/A"

            all_opts = db.execute(text("""
                SELECT id, option_text, is_correct FROM question_options WHERE question_id = :qid ORDER BY option_order ASC
            """), {"qid": q_id}).fetchall()

            reviews.append({
                "question_id": q_id,
                "question_text": q[1],
                "options": [{"id": str(o[0]), "text": o[1], "is_correct": bool(o[2])} for o in all_opts],
                "selected_option": ans[0] if ans else None,
                "correct_option": corr_text,
                "is_correct": bool(ans[2]) if ans else False,
                "marks_awarded": float(ans[3] or 0.0) if ans else 0.0,
                "total_marks": float(q[3] or 2.0),
                "explanation": q[4] or ""
            })

        res["review"] = reviews
        return res

    # ==========================================================================
    # 8. TEACHER ANALYTICS: AGGREGATES, QUESTION ACCURACY, DISTRIBUTIONS
    # ==========================================================================
    @classmethod
    def get_quiz_analytics(cls, quiz_id: str, db: Session) -> Dict[str, Any]:
        """
        Comprehensive production analytics for faculty:
        - average score
        - highest score
        - lowest score
        - pass percentage
        - question accuracy
        - student ranking
        - time spent (avg, min, max)
        - attempt distribution (score ranges)
        - security proctoring incident count
        """
        quiz = db.execute(text("SELECT q.*, c.class_name FROM quizzes q LEFT JOIN classes c ON q.class_id = c.id WHERE q.id = :id"), {"id": quiz_id}).fetchone()
        if not quiz:
            raise ValueError("Quiz not found")
        qm = dict(quiz._mapping)

        # Submitted attempts
        attempts = db.execute(text("""
            SELECT qa.*, s.student_code, s.roll_no, s.full_name
            FROM quiz_attempts qa
            JOIN students s ON qa.student_id = s.id
            WHERE qa.quiz_id = :qid AND qa.status IN ('submitted', 'evaluated', 'auto_submitted', 'SUBMITTED')
            ORDER BY qa.final_marks DESC, qa.submitted_at ASC
        """), {"qid": quiz_id}).fetchall()

        total_attempts = len(attempts)
        scores = [float(a._mapping.get("final_marks") or 0.0) for a in attempts]
        tot_marks = float(qm.get("total_marks") or 100.0)

        if total_attempts > 0:
            avg_score = round(sum(scores) / total_attempts, 2)
            high_score = round(max(scores), 2)
            low_score = round(min(scores), 2)
            passed_count = sum(1 for a in attempts if (a._mapping.get("result_status") == "pass" or (float(a._mapping.get("final_marks") or 0.0) >= float(qm.get("passing_marks") or 40.0))))
            pass_pct = round((passed_count / total_attempts) * 100, 1)
        else:
            avg_score = 0.0
            high_score = 0.0
            low_score = 0.0
            pass_pct = 0.0

        # Time spent
        times = []
        for a in attempts:
            am = a._mapping
            st = ensure_utc(am.get("started_at"))
            sb = ensure_utc(am.get("submitted_at"))
            if st and sb:
                times.append(int((sb - st).total_seconds()))

        if times:
            avg_time = int(sum(times) / len(times))
            min_time = min(times)
            max_time = max(times)
        else:
            avg_time = 0
            min_time = 0
            max_time = 0

        # Score distribution buckets (0-20%, 21-40%, 41-60%, 61-80%, 81-100%)
        buckets = {"0-20%": 0, "21-40%": 0, "41-60%": 0, "61-80%": 0, "81-100%": 0}
        for s in scores:
            pct = (s / tot_marks * 100) if tot_marks > 0 else 0
            if pct <= 20:
                buckets["0-20%"] += 1
            elif pct <= 40:
                buckets["21-40%"] += 1
            elif pct <= 60:
                buckets["41-60%"] += 1
            elif pct <= 80:
                buckets["61-80%"] += 1
            else:
                buckets["81-100%"] += 1

        # Question Accuracy
        questions = db.execute(text("""
            SELECT id, question_text, marks, question_order
            FROM quiz_questions
            WHERE quiz_id = :qid
            ORDER BY question_order ASC
        """), {"qid": quiz_id}).fetchall()

        question_accuracy = []
        for q in questions:
            q_id = str(q[0])
            ans_stats = db.execute(text("""
                SELECT 
                    count(*) as total_answers,
                    sum(CASE WHEN is_correct = TRUE THEN 1 ELSE 0 END) as correct_answers
                FROM quiz_attempt_answers qaa
                JOIN quiz_attempts qa ON qaa.attempt_id = qa.id::text
                WHERE qaa.question_id = :qid AND qa.status IN ('submitted', 'evaluated', 'auto_submitted', 'SUBMITTED')
            """), {"qid": q_id}).fetchone()

            tot_ans = ans_stats[0] if ans_stats else 0
            corr_ans = ans_stats[1] if (ans_stats and ans_stats[1] is not None) else 0
            acc_pct = round((corr_ans / tot_ans * 100), 1) if tot_ans > 0 else 0.0

            question_accuracy.append({
                "question_id": q_id,
                "question_order": q[3],
                "question_text": q[1],
                "marks": float(q[2] or 2.0),
                "total_answered": tot_ans,
                "correct_count": corr_ans,
                "accuracy_percentage": acc_pct
            })

        # Student rankings (Leaderboard)
        rankings = []
        rank = 1
        for a in attempts:
            am = a._mapping
            st = ensure_utc(am.get("started_at"))
            sb = ensure_utc(am.get("submitted_at"))
            dur = int((sb - st).total_seconds()) if (st and sb) else 0
            dur_mins = dur // 60
            dur_secs = dur % 60

            rankings.append({
                "rank": rank,
                "student_id": str(am["student_id"]),
                "name": am["full_name"],
                "roll": am.get("roll_no") or am.get("student_code"),
                "student_code": am.get("student_code"),
                "score": float(am.get("final_marks") or 0.0),
                "percentage": float(am.get("percentage") or 0.0),
                "status": am.get("result_status", "pass"),
                "time_taken_seconds": dur,
                "speed": f"{dur_mins}m {dur_secs:02d}s"
            })
            rank += 1

        # Proctoring security incidents
        sec_count = db.execute(text("""
            SELECT count(*)
            FROM quiz_security_events qse
            JOIN quiz_attempts qa ON qse.attempt_id = qa.id::text
            WHERE qa.quiz_id = :qid
        """), {"qid": quiz_id}).scalar() or 0

        return {
            "quiz_id": quiz_id,
            "title": qm.get("title"),
            "class_name": qm.get("class_name"),
            "total_marks": tot_marks,
            "passing_marks": float(qm.get("passing_marks") or 40.0),
            "total_attempts": total_attempts,
            "average_score": avg_score,
            "highest_score": high_score,
            "lowest_score": low_score,
            "pass_percentage": pass_pct,
            "time_spent": {
                "average_seconds": avg_time,
                "average_formatted": f"{avg_time // 60}m {avg_time % 60:02d}s",
                "min_seconds": min_time,
                "max_seconds": max_time
            },
            "attempt_distribution": buckets,
            "question_accuracy": question_accuracy,
            "student_ranking": rankings,
            "security_incidents_count": sec_count
        }

    # ==========================================================================
    # 9. LEADERBOARD
    # ==========================================================================
    @classmethod
    def get_quiz_leaderboard(cls, quiz_id: str, db: Session) -> List[Dict[str, Any]]:
        """Returns leaderboard sorted by highest score and lowest time taken."""
        analytics = cls.get_quiz_analytics(quiz_id, db)
        return analytics.get("student_ranking", [])

    # ==========================================================================
    # 10. EXPORT: CSV, EXCEL-COMPATIBLE & STRUCTURED FORMATS
    # ==========================================================================
    @classmethod
    def export_quiz_results(cls, quiz_id: str, filter_type: str, export_format: str, db: Session) -> Any:
        """
        Exports comprehensive quiz scorecard:
        - CSV
        - Excel-compatible (UTF-8 BOM)
        - JSON
        """
        from fastapi.responses import Response

        quiz = db.execute(text("SELECT q.*, c.class_name FROM quizzes q LEFT JOIN classes c ON q.class_id = c.id WHERE q.id = :id"), {"id": quiz_id}).fetchone()
        if not quiz:
            raise ValueError("Quiz not found")
        qm = dict(quiz._mapping)
        target_class_id = qm["class_id"]
        class_label = qm.get("class_name", "Class")

        # Fetch all enrolled students and their attempts
        rows = db.execute(text("""
            SELECT 
                s.id as student_id,
                s.student_code,
                s.roll_no,
                s.full_name,
                c.class_name,
                COALESCE(s.email, '') as email,
                qa.id as attempt_id,
                qa.status as attempt_status,
                qa.attempt_number,
                qa.started_at,
                qa.submitted_at,
                qa.final_marks,
                qa.percentage,
                qa.result_status,
                qa.correct_answers,
                qa.wrong_answers,
                qa.unanswered_questions,
                qa.auto_submitted
            FROM students s
            LEFT JOIN classes c ON s.class_id = c.id
            LEFT JOIN quiz_attempts qa ON (s.id = qa.student_id AND qa.quiz_id = :qid AND qa.status IN ('submitted', 'evaluated', 'auto_submitted', 'SUBMITTED'))
            WHERE s.class_id = :cid
            ORDER BY s.roll_no ASC, s.full_name ASC
        """), {"cid": target_class_id, "qid": quiz_id}).fetchall()

        export_rows = []
        sr = 1
        for r in rows:
            m = dict(r._mapping)
            has_attempted = bool(m.get("attempt_id") and m.get("attempt_status") in ("submitted", "evaluated", "auto_submitted", "SUBMITTED"))
            res_st = m.get("result_status")
            passed = res_st == "pass"

            if filter_type == "attempted" and not has_attempted:
                continue
            if filter_type == "not_attempted" and has_attempted:
                continue
            if filter_type == "passed" and (not has_attempted or not passed):
                continue
            if filter_type == "failed" and (not has_attempted or passed):
                continue

            st = ensure_utc(m.get("started_at"))
            sb = ensure_utc(m.get("submitted_at"))
            time_sec = int((sb - st).total_seconds()) if (st and sb) else 0
            time_formatted = f"{time_sec // 60}m {time_sec % 60:02d}s" if has_attempted else "-"

            export_rows.append({
                "Sr No": sr,
                "Student Code": m.get("student_code") or "-",
                "Roll No": m.get("roll_no") or "-",
                "Student Name": m.get("full_name") or "-",
                "Class": m.get("class_name") or class_label,
                "Email": m.get("email") or "-",
                "Attempt Status": "Attempted" if has_attempted else "Not Attempted",
                "Attempt Number": m.get("attempt_number") if has_attempted else "-",
                "Started At": st.strftime("%Y-%m-%d %H:%M:%S") if st else "-",
                "Submitted At": sb.strftime("%Y-%m-%d %H:%M:%S") if sb else "-",
                "Time Taken": time_formatted,
                "Total Marks": float(qm.get("total_marks") or 100.0),
                "Score": float(m.get("final_marks") or 0.0) if has_attempted else 0.0,
                "Percentage": f"{float(m.get('percentage') or 0.0):.1f}%" if has_attempted else "0.0%",
                "Correct Answers": int(m.get("correct_answers") or 0) if has_attempted else 0,
                "Wrong Answers": int(m.get("wrong_answers") or 0) if has_attempted else 0,
                "Unanswered": int(m.get("unanswered_questions") or 0) if has_attempted else 0,
                "Result": ("Passed" if passed else "Failed") if has_attempted else "Not Attempted",
                "Auto Submitted": "Yes" if m.get("auto_submitted") else "No"
            })
            sr += 1

        clean_title = re.sub(r'[^a-zA-Z0-9_]', '_', qm.get('title', 'Quiz'))

        if export_format.lower() == "json":
            return export_rows

        headers = [
            "Sr No", "Student Code", "Roll No", "Student Name", "Class", "Email",
            "Attempt Status", "Attempt Number", "Started At", "Submitted At", "Time Taken",
            "Total Marks", "Score", "Percentage", "Correct Answers", "Wrong Answers", "Unanswered", "Result", "Auto Submitted"
        ]

        output = io.StringIO()
        writer = csv.DictWriter(output, fieldnames=headers)
        writer.writeheader()
        for row in export_rows:
            writer.writerow(row)

        content = output.getvalue()

        # Excel compatibility: Prepend UTF-8 Byte Order Mark (BOM)
        bom_content = "\ufeff" + content
        filename = f"SSGMCE_Quiz_{clean_title}_{class_label}.csv"

        media_type = "application/vnd.ms-excel" if export_format.lower() in ("excel", "xlsx", "xls") else "text/csv; charset=utf-8"

        return Response(
            content=bom_content.encode("utf-8"),
            media_type=media_type,
            headers={
                "Content-Disposition": f'attachment; filename="{filename}"'
            }
        )
