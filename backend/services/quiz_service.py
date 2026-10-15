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
    # 0. RANDOMIZATION & EXAM SECURITY CONFIGURATION MANAGERS
    # ==========================================================================
    @classmethod
    def _save_randomization_config(cls, quiz_id: str, payload: Any, db: Session):
        """Persists granular randomization & security policies."""
        q_per_stud = cls.get_prop(payload, "questions_per_student", None)
        if q_per_stud is not None:
            try:
                q_per_stud = int(q_per_stud)
                if q_per_stud <= 0:
                    q_per_stud = None
            except Exception:
                q_per_stud = None

        uniq_paper = bool(cls.get_prop(payload, "unique_question_paper", False))
        prev_dup = bool(cls.get_prop(payload, "prevent_duplicate_questions", True))
        rand_types = bool(cls.get_prop(payload, "randomize_question_types", False))

        diff_dist = cls.get_prop(payload, "difficulty_distribution", None)
        if isinstance(diff_dist, (dict, list)):
            diff_dist_str = json.dumps(diff_dist)
        elif isinstance(diff_dist, str):
            diff_dist_str = diff_dist.strip() or None
        else:
            diff_dist_str = None

        sec_set = cls.get_prop(payload, "security_settings", None)
        if isinstance(sec_set, (dict, list)):
            sec_set_str = json.dumps(sec_set)
        elif isinstance(sec_set, str):
            sec_set_str = sec_set.strip() or None
        else:
            sec_set_str = None

        # Also sync randomize_questions / randomize_options to quizzes table
        rand_q = cls.get_prop(payload, "randomize_questions", cls.get_prop(payload, "shuffle_questions", None))
        rand_opt = cls.get_prop(payload, "randomize_options", cls.get_prop(payload, "shuffle_options", None))
        updates = []
        params = {"qid": quiz_id}
        if rand_q is not None:
            updates.append("randomize_questions = :rq")
            params["rq"] = bool(rand_q)
        if rand_opt is not None:
            updates.append("randomize_options = :ro")
            params["ro"] = bool(rand_opt)
        if updates:
            try:
                db.execute(text(f"UPDATE quizzes SET {', '.join(updates)}, updated_at = CURRENT_TIMESTAMP WHERE id = :qid"), params)
            except Exception:
                pass

        try:
            db.execute(text("""
                INSERT INTO quiz_randomization_configs (
                    quiz_id, questions_per_student, unique_question_paper, prevent_duplicate_questions,
                    randomize_question_types, difficulty_distribution, security_settings, created_at, updated_at
                ) VALUES (
                    :qid, :qps, :uqp, :pdq, :rqt, :dd, :ss, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
                )
                ON CONFLICT (quiz_id) DO UPDATE SET
                    questions_per_student = :qps,
                    unique_question_paper = :uqp,
                    prevent_duplicate_questions = :pdq,
                    randomize_question_types = :rqt,
                    difficulty_distribution = :dd,
                    security_settings = :ss,
                    updated_at = CURRENT_TIMESTAMP
            """), {
                "qid": quiz_id, "qps": q_per_stud, "uqp": uniq_paper, "pdq": prev_dup,
                "rqt": rand_types, "dd": diff_dist_str, "ss": sec_set_str
            })
            db.commit()
        except Exception:
            db.rollback()

    @classmethod
    def _get_randomization_config(cls, quiz_id: str, db: Session) -> Dict[str, Any]:
        """Loads randomization & exam security configuration."""
        try:
            cfg = db.execute(text("SELECT * FROM quiz_randomization_configs WHERE quiz_id = :qid"), {"qid": quiz_id}).fetchone()
        except Exception:
            cfg = None

        if not cfg:
            return {
                "questions_per_student": None,
                "unique_question_paper": False,
                "prevent_duplicate_questions": True,
                "randomize_question_types": False,
                "difficulty_distribution": None,
                "security_settings": None
            }
        cm = dict(cfg._mapping)
        diff_dist = None
        if cm.get("difficulty_distribution"):
            try:
                diff_dist = json.loads(cm["difficulty_distribution"])
            except Exception:
                diff_dist = cm["difficulty_distribution"]
        sec_set = None
        if cm.get("security_settings"):
            try:
                sec_set = json.loads(cm["security_settings"])
            except Exception:
                sec_set = cm["security_settings"]

        return {
            "questions_per_student": cm.get("questions_per_student"),
            "unique_question_paper": bool(cm.get("unique_question_paper")),
            "prevent_duplicate_questions": bool(cm.get("prevent_duplicate_questions")) if cm.get("prevent_duplicate_questions") is not None else True,
            "randomize_question_types": bool(cm.get("randomize_question_types")),
            "difficulty_distribution": diff_dist,
            "security_settings": sec_set
        }

    @classmethod
    def validate_quiz_for_publishing(cls, quiz_id: str, db: Session) -> Dict[str, Any]:
        """Validates pool size, difficulty distribution, and paper constraints before publishing."""
        quiz = db.execute(text("SELECT * FROM quizzes WHERE id = :id"), {"id": quiz_id}).fetchone()
        if not quiz:
            raise ValueError("Quiz not found")
        qm = dict(quiz._mapping)

        q_rows = db.execute(text("""
            SELECT qq.id, qq.question_text, qq.marks, qq.hint, qqm.difficulty
            FROM quiz_questions qq
            LEFT JOIN quiz_question_metadata qqm ON CAST(qq.id AS TEXT) = CAST(qqm.question_id AS TEXT)
            WHERE qq.quiz_id = :qid
        """), {"qid": quiz_id}).fetchall()

        pool_size = len(q_rows)
        if pool_size == 0:
            return {
                "valid": False,
                "pool_size": 0,
                "errors": ["Cannot publish an empty quiz. Please add at least one question to the pool first."],
                "warnings": [],
                "can_proceed": False
            }

        cfg = cls._get_randomization_config(quiz_id, db)
        q_per_student = cfg.get("questions_per_student") or pool_size

        errors = []
        warnings = []

        if q_per_student > pool_size:
            errors.append(f"Configured questions per student ({q_per_student}) exceeds total question pool size ({pool_size}). Please add more questions or reduce questions per student.")

        # Count available questions by difficulty
        diff_counts = {"EASY": 0, "MEDIUM": 0, "HARD": 0}
        for r in q_rows:
            rm = dict(r._mapping)
            diff = "MEDIUM"
            if rm.get("difficulty"):
                diff = str(rm["difficulty"]).upper()
            elif rm.get("hint"):
                try:
                    h = json.loads(rm["hint"])
                    if isinstance(h, dict) and h.get("difficulty"):
                        diff = str(h["difficulty"]).upper()
                except Exception:
                    pass
            if not rm.get("difficulty"):
                q_txt_lower = str(rm.get("question_text", "")).lower()
                if "hard" in q_txt_lower:
                    diff = "HARD"
                elif "easy" in q_txt_lower:
                    diff = "EASY"
            if diff in diff_counts:
                diff_counts[diff] += 1
            else:
                diff_counts["MEDIUM"] += 1

        diff_dist = cfg.get("difficulty_distribution")
        if diff_dist and isinstance(diff_dist, dict):
            for d_key in ("easy", "medium", "hard"):
                pct = diff_dist.get(d_key, 0)
                if isinstance(pct, (int, float)) and pct > 0:
                    target = round(q_per_student * (pct / 100))
                    avail = diff_counts.get(d_key.upper(), 0)
                    if target > avail:
                        warnings.append(f"Requested {target} {d_key.capitalize()} questions per student, but pool only contains {avail} {d_key.capitalize()} questions. System will automatically supplement remaining questions from available pool.")

        if pool_size < 10 and q_per_student >= pool_size:
            warnings.append(f"Question pool has only {pool_size} questions. For effective individual student randomization, consider generating a larger question pool (20-50 questions).")

        is_valid = (len(errors) == 0)
        return {
            "valid": is_valid,
            "can_proceed": is_valid,
            "pool_size": pool_size,
            "questions_per_student": q_per_student,
            "difficulty_counts": diff_counts,
            "errors": errors,
            "warnings": warnings
        }

    @classmethod
    def _generate_or_get_attempt_paper(
        cls,
        attempt_id: str,
        quiz_id: str,
        student_id: str,
        qm: Dict[str, Any],
        db: Session
    ) -> Tuple[List[Dict[str, Any]], Dict[str, Any]]:
        """
        Retrieves existing assigned paper (resilience across page refresh / reconnect)
        or synthesizes a brand-new, difficulty-balanced, unique randomized question paper.
        """
        # 1. Check if paper already generated for this attempt (Refresh & Reconnect Safety)
        existing_paper = db.execute(text("SELECT * FROM quiz_attempt_papers WHERE attempt_id = :aid"), {"aid": attempt_id}).fetchone()
        if existing_paper:
            ep = dict(existing_paper._mapping)
            try:
                paper_payload = json.loads(ep["paper_payload"])
                options_map = json.loads(ep["options_map"]) if ep.get("options_map") else {}
                return paper_payload, options_map
            except Exception:
                pass

        # 2. Load Quiz Randomization & Exam Security Settings
        cfg = cls._get_randomization_config(quiz_id, db)
        questions_per_student = cfg.get("questions_per_student")
        unique_paper = bool(cfg.get("unique_question_paper"))
        prev_duplicate = bool(cfg.get("prevent_duplicate_questions", True))
        rand_types = bool(cfg.get("randomize_question_types"))
        diff_dist = cfg.get("difficulty_distribution")

        rand_questions = bool(qm.get("randomize_questions") or qm.get("shuffle_questions"))
        rand_options = bool(qm.get("randomize_options") or qm.get("shuffle_options"))

        # 3. Retrieve all questions in quiz pool
        q_rows = db.execute(text("""
            SELECT qq.id, qq.question_text, qq.question_type, qq.marks, qq.negative_marks, qq.question_order, qq.hint,
                   qqm.difficulty as meta_difficulty, qqm.topic as meta_topic
            FROM quiz_questions qq
            LEFT JOIN quiz_question_metadata qqm ON CAST(qq.id AS TEXT) = CAST(qqm.question_id AS TEXT)
            WHERE qq.quiz_id = :qid
            ORDER BY qq.question_order ASC
        """), {"qid": quiz_id}).fetchall()

        if not q_rows:
            return [], {}

        all_q_pool = []
        for qr in q_rows:
            qd = dict(qr._mapping)
            qd["id"] = str(qd["id"])
            diff = "MEDIUM"
            if qd.get("meta_difficulty"):
                diff = str(qd["meta_difficulty"]).upper()
            elif qd.get("hint"):
                try:
                    h = json.loads(qd["hint"])
                    if isinstance(h, dict) and h.get("difficulty"):
                        diff = str(h["difficulty"]).upper()
                except Exception:
                    pass
            if not qd.get("meta_difficulty"):
                q_txt_lower = str(qd.get("question_text", "")).lower()
                if "hard" in q_txt_lower:
                    diff = "HARD"
                elif "easy" in q_txt_lower:
                    diff = "EASY"
            qd["difficulty"] = diff
            all_q_pool.append(qd)

        pool_size = len(all_q_pool)
        target_count = min(int(questions_per_student), pool_size) if (questions_per_student and int(questions_per_student) > 0) else pool_size

        # 4. Question usage tracking for Unique Paper Generation
        usage_counts = {q["id"]: 0 for q in all_q_pool}
        if unique_paper:
            prev_papers = db.execute(text("SELECT question_ids FROM quiz_attempt_papers WHERE quiz_id = :qid"), {"qid": quiz_id}).fetchall()
            for pr in prev_papers:
                try:
                    p_ids = json.loads(pr[0])
                    for pid in p_ids:
                        if pid in usage_counts:
                            usage_counts[pid] += 1
                except Exception:
                    pass

        # 5. Difficulty-Aware Selection & Balancing
        selected_questions = []

        if diff_dist and isinstance(diff_dist, dict):
            easy_pool = [q for q in all_q_pool if q["difficulty"] == "EASY"]
            med_pool = [q for q in all_q_pool if q["difficulty"] == "MEDIUM"]
            hard_pool = [q for q in all_q_pool if q["difficulty"] == "HARD"]

            easy_pct = float(diff_dist.get("easy", 0))
            med_pct = float(diff_dist.get("medium", 0))
            hard_pct = float(diff_dist.get("hard", 0))
            tot_pct = easy_pct + med_pct + hard_pct or 100.0

            target_easy = round(target_count * (easy_pct / tot_pct))
            target_med = round(target_count * (med_pct / tot_pct))
            target_hard = max(0, target_count - (target_easy + target_med))

            def pick_from_tier(tier_pool, count_needed, already_selected_ids):
                avail = [q for q in tier_pool if q["id"] not in already_selected_ids]
                if not avail or count_needed <= 0:
                    return []
                if unique_paper:
                    # Sort by (usage_count, random_salt) to prefer least-used questions
                    avail.sort(key=lambda q: (usage_counts[q["id"]], random.random()))
                    return avail[:count_needed]
                else:
                    return random.sample(avail, min(len(avail), count_needed))

            sel_ids = set()
            e_picked = pick_from_tier(easy_pool, target_easy, sel_ids)
            for q in e_picked: sel_ids.add(q["id"])
            m_picked = pick_from_tier(med_pool, target_med, sel_ids)
            for q in m_picked: sel_ids.add(q["id"])
            h_picked = pick_from_tier(hard_pool, target_hard, sel_ids)
            for q in h_picked: sel_ids.add(q["id"])

            selected_questions = e_picked + m_picked + h_picked

            # If any tier is short, backfill from remaining questions without duplication
            if len(selected_questions) < target_count:
                remain_pool = [q for q in all_q_pool if q["id"] not in sel_ids]
                if unique_paper:
                    remain_pool.sort(key=lambda q: (usage_counts[q["id"]], random.random()))
                else:
                    random.shuffle(remain_pool)
                needed = target_count - len(selected_questions)
                selected_questions.extend(remain_pool[:needed])
        else:
            # No explicit difficulty distribution -> sample from overall pool
            if unique_paper:
                sorted_pool = list(all_q_pool)
                sorted_pool.sort(key=lambda q: (usage_counts[q["id"]], random.random()))
                selected_questions = sorted_pool[:target_count]
            else:
                selected_questions = random.sample(all_q_pool, target_count)

        # 6. Shuffle question order for student
        if rand_questions:
            rng_q = random.Random(f"{attempt_id}_{uuid.uuid4()}")
            rng_q.shuffle(selected_questions)

        # 7. Mix question types if enabled
        if rand_types:
            by_type = {}
            for q in selected_questions:
                by_type.setdefault(q.get("question_type", "single_choice"), []).append(q)
            interleaved = []
            type_keys = list(by_type.keys())
            random.shuffle(type_keys)
            max_len = max(len(v) for v in by_type.values())
            for idx in range(max_len):
                for tk in type_keys:
                    if idx < len(by_type[tk]):
                        interleaved.append(by_type[tk][idx])
            selected_questions = interleaved

        # 8. Options shuffling & Option mapping for evaluation
        paper_payload = []
        options_map = {}

        for idx, q_dict in enumerate(selected_questions):
            q_uuid = q_dict["id"]
            opt_rows = db.execute(text("""
                SELECT id, option_text, option_order, is_correct
                FROM question_options
                WHERE question_id = :qid
                ORDER BY option_order ASC
            """), {"qid": q_uuid}).fetchall()

            raw_options = []
            for o in opt_rows:
                om = dict(o._mapping)
                om["id"] = str(om["id"])
                om["text"] = str(om.get("option_text") or "")
                om["is_correct"] = bool(om.get("is_correct"))
                raw_options.append(om)

            if rand_options:
                rng_opt = random.Random(f"{attempt_id}_{q_uuid}_{idx}")
                rng_opt.shuffle(raw_options)

            displayed_options = []
            q_opt_map = {"displayed_options": {}, "correct_keys": []}

            for opt_idx, opt in enumerate(raw_options):
                disp_key = chr(65 + opt_idx)  # 'A', 'B', 'C', 'D'
                displayed_options.append({
                    "id": opt["id"],
                    "key": disp_key,
                    "text": opt["text"],
                    "option_text": opt["text"]
                })
                is_corr = opt["is_correct"]
                q_opt_map["displayed_options"][disp_key] = {
                    "id": opt["id"],
                    "text": opt["text"],
                    "is_correct": is_corr
                }
                if is_corr:
                    q_opt_map["correct_keys"].append(disp_key)

            options_map[q_uuid] = q_opt_map

            # Sanitized question payload delivered to student (no answer leaks!)
            paper_payload.append({
                "id": q_uuid,
                "question_id": q_uuid,
                "question_text": q_dict["question_text"],
                "text": q_dict["question_text"],
                "question_type": q_dict["question_type"],
                "marks": float(q_dict.get("marks") or 2.0),
                "negative_marks": float(q_dict.get("negative_marks") or 0.0),
                "question_order": idx + 1,
                "options": displayed_options,
                "difficulty": q_dict.get("difficulty", "MEDIUM")
            })

        # 9. Commit paper snapshot to quiz_attempt_papers
        question_ids_list = [q["id"] for q in paper_payload]
        try:
            db.execute(text("""
                INSERT INTO quiz_attempt_papers (
                    attempt_id, quiz_id, student_id, question_ids, paper_payload, options_map, created_at
                ) VALUES (
                    :aid, :qid, :sid, :qids, :payload, :optmap, CURRENT_TIMESTAMP
                )
                ON CONFLICT (attempt_id) DO UPDATE SET
                    paper_payload = :payload,
                    options_map = :optmap
            """), {
                "aid": attempt_id,
                "qid": quiz_id,
                "sid": student_id,
                "qids": json.dumps(question_ids_list),
                "payload": json.dumps(paper_payload),
                "optmap": json.dumps(options_map)
            })
            db.commit()
        except Exception as err:
            logger.warning("Notice on saving attempt paper: %s", err)

        return paper_payload, options_map

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
            c_row = db.execute(text("SELECT id, class_name FROM classes WHERE class_name = :c OR CAST(id AS TEXT) = :c LIMIT 1"), {"c": class_input}).fetchone()
            if c_row:
                actual_class_uuid = str(c_row[0])
            else:
                first_c = db.execute(text("SELECT id FROM classes LIMIT 1")).fetchone()
                actual_class_uuid = str(first_c[0]) if first_c else str(uuid.uuid4())

        # 3. Resolve subject UUID
        actual_subject_uuid = cls.resolve_uuid(cls.get_prop(payload, "subject_id"))
        if not actual_subject_uuid and cls.get_prop(payload, "subject_id"):
            s_row = db.execute(text("SELECT id FROM subjects WHERE name = :n OR code = :n OR CAST(id AS TEXT) = :n LIMIT 1"), {"n": str(cls.get_prop(payload, "subject_id"))}).fetchone()
            if s_row:
                actual_subject_uuid = str(s_row[0])

        # 4. Resolve times
        now = datetime.now(timezone.utc)
        start_time = cls.get_prop(payload, "start_time") or cls.get_prop(payload, "start_at") or now
        end_time = cls.get_prop(payload, "end_time") or cls.get_prop(payload, "end_at") or (start_time + timedelta(days=7))
        if end_time <= start_time:
            end_time = start_time + timedelta(days=7)

        # 5. Resolve booleans & floats
        shuff_q = bool(cls.get_prop(payload, "randomize_questions") if cls.get_prop(payload, "randomize_questions") is not None else cls.get_prop(payload, "shuffle_questions", False))
        shuff_opt = bool(cls.get_prop(payload, "randomize_options") if cls.get_prop(payload, "randomize_options") is not None else cls.get_prop(payload, "shuffle_options", False))
        neg_marking = bool(cls.get_prop(payload, "negative_marking", False))
        neg_val = max(0.0, float(cls.get_prop(payload, "negative_marks_per_question") if cls.get_prop(payload, "negative_marks_per_question") is not None else cls.get_prop(payload, "negative_marks", 0.0) or 0.0))
        tot_marks = max(1.0, float(cls.get_prop(payload, "total_marks", 100.0) or 100.0))
        raw_pass = cls.get_prop(payload, "passing_marks")
        if raw_pass is not None:
            pass_marks = float(raw_pass)
        else:
            pass_marks = round(tot_marks * 0.4, 2)
        if pass_marks > tot_marks:
            pass_marks = round(tot_marks * 0.4, 2)
        if pass_marks < 0:
            pass_marks = 0.0
        duration = max(1, int(cls.get_prop(payload, "duration_minutes", 30) or 30))
        max_att = max(1, int(cls.get_prop(payload, "max_attempts", 1) or 1))
        status_val = cls.normalize_quiz_status(cls.get_prop(payload, "status", "draft"))

        quiz_id = str(uuid.uuid4())

        questions_list = cls.get_prop(payload, "questions") or []

        res_pub = bool(cls.get_prop(payload, "result_published", False))

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
                :st, :res_pub, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
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
            "st": status_val,
            "res_pub": res_pub
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

            # Persist question metadata (difficulty, topic)
            q_diff = str(cls.get_prop(q, "difficulty", "medium") or "medium").lower()
            q_topic = str(cls.get_prop(q, "topic", "") or "")
            try:
                db.execute(text("""
                    INSERT INTO quiz_question_metadata (question_id, quiz_id, difficulty, topic, created_at)
                    VALUES (:qid, :quiz_id, :diff, :topic, CURRENT_TIMESTAMP)
                    ON CONFLICT (question_id) DO UPDATE SET difficulty = :diff, topic = :topic
                """), {
                    "qid": q_id,
                    "quiz_id": quiz_id,
                    "diff": q_diff,
                    "topic": q_topic
                })
            except Exception:
                pass

            order += 1
            inserted_questions += 1

        if inserted_questions > 0:
            db.execute(text("UPDATE quizzes SET total_questions = :tq WHERE id = :id"), {"tq": inserted_questions, "id": quiz_id})

        db.commit()

        # Persist randomization & security settings
        cls._save_randomization_config(quiz_id, payload, db)
        rand_cfg = cls._get_randomization_config(quiz_id, db)

        return {
            "id": quiz_id,
            "quiz_id": quiz_id,
            "title": cls.get_prop(payload, "title"),
            "class_id": actual_class_uuid,
            "duration_minutes": duration,
            "total_marks": tot_marks,
            "total_questions": inserted_questions,
            "status": status_val,
            "randomize_questions": bool(shuff_q),
            "randomize_options": bool(shuff_opt),
            "start_time": start_time.isoformat() if hasattr(start_time, "isoformat") else str(start_time),
            "end_time": end_time.isoformat() if hasattr(end_time, "isoformat") else str(end_time),
            **rand_cfg
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

        # Persist question metadata (difficulty, topic)
        q_diff = str(cls.get_prop(payload, "difficulty", "medium") or "medium").lower()
        q_topic = str(cls.get_prop(payload, "topic", "") or "")
        try:
            db.execute(text("""
                INSERT INTO quiz_question_metadata (question_id, quiz_id, difficulty, topic, created_at)
                VALUES (:qid, :quiz_id, :diff, :topic, CURRENT_TIMESTAMP)
                ON CONFLICT (question_id) DO UPDATE SET difficulty = :diff, topic = :topic
            """), {
                "qid": q_id,
                "quiz_id": quiz_id,
                "diff": q_diff,
                "topic": q_topic
            })
        except Exception:
            pass

        # Update total questions count and total marks
        tot_q = db.execute(text("SELECT count(*) FROM quiz_questions WHERE quiz_id = :qid"), {"qid": quiz_id}).scalar() or 0
        sum_marks = db.execute(text("SELECT COALESCE(SUM(marks), 0) FROM quiz_questions WHERE quiz_id = :qid"), {"qid": quiz_id}).scalar() or 0
        if sum_marks > 0:
            pass_m = round(float(sum_marks) * 0.4, 2)
            db.execute(text("UPDATE quizzes SET total_questions = :tq, total_marks = :tm, passing_marks = :pm, updated_at = CURRENT_TIMESTAMP WHERE id = :id"), {"tq": tot_q, "tm": float(sum_marks), "pm": pass_m, "id": quiz_id})
        else:
            db.execute(text("UPDATE quizzes SET total_questions = :tq, updated_at = CURRENT_TIMESTAMP WHERE id = :id"), {"tq": tot_q, "id": quiz_id})
        db.commit()

        return {
            "id": q_id,
            "question_id": q_id,
            "quiz_id": quiz_id,
            "question_text": q_text,
            "marks": q_marks,
            "negative_marks": q_neg,
            "explanation": q_exp,
            "question_order": new_order,
            "total_questions": tot_q,
            "total_marks": float(sum_marks) if sum_marks > 0 else float(quiz._mapping.get("total_marks") or 10)
        }

    @classmethod
    def update_question_in_quiz(cls, quiz_id: str, question_id: str, payload: Any, db: Session) -> Dict[str, Any]:
        """Updates an existing question and its options in a quiz."""
        existing = db.execute(
            text("SELECT * FROM quiz_questions WHERE id = :qid AND quiz_id = :quiz_id"),
            {"qid": question_id, "quiz_id": quiz_id}
        ).fetchone()
        if not existing:
            raise ValueError("Question not found in this quiz")

        em = dict(existing._mapping)
        q_text = cls.get_prop(payload, "question_text", em.get("question_text") or "Question Text")
        q_type = cls.normalize_question_type(cls.get_prop(payload, "question_type", em.get("question_type") or "single_choice"))
        q_marks = float(cls.get_prop(payload, "marks", em.get("marks") or 2.0) or 2.0)
        q_neg = float(cls.get_prop(payload, "negative_marks", em.get("negative_marks") or 0.0) or 0.0)
        q_exp = cls.get_prop(payload, "explanation", em.get("explanation") or "") or ""
        q_hint = cls.get_prop(payload, "hint", em.get("hint") or "") or ""

        db.execute(text("""
            UPDATE quiz_questions
            SET question_text = :txt,
                question_type = :typ,
                marks = :m,
                negative_marks = :nm,
                explanation = :exp,
                hint = :hint
            WHERE id = :id AND quiz_id = :qid
        """), {
            "id": question_id, "qid": quiz_id,
            "txt": q_text, "typ": q_type, "m": q_marks, "nm": q_neg, "exp": q_exp, "hint": q_hint
        })

        opts = cls.get_prop(payload, "options")
        if opts is not None and isinstance(opts, list) and len(opts) > 0:
            db.execute(text("DELETE FROM question_options WHERE question_id = :qid"), {"qid": question_id})
            opt_order = 1
            for opt in opts:
                opt_id = str(uuid.uuid4())
                opt_text = cls.get_prop(opt, "text") or cls.get_prop(opt, "option_text") or cls.get_prop(opt, "key", "")
                is_corr = bool(cls.get_prop(opt, "is_correct", False))
                db.execute(text("""
                    INSERT INTO question_options (id, question_id, option_text, option_order, is_correct, created_at)
                    VALUES (:id, :qid, :txt, :ord, :corr, CURRENT_TIMESTAMP)
                """), {
                    "id": opt_id, "qid": question_id, "txt": opt_text, "ord": opt_order, "corr": is_corr
                })
                opt_order += 1

        tot_q = db.execute(text("SELECT count(*) FROM quiz_questions WHERE quiz_id = :qid"), {"qid": quiz_id}).scalar() or 0
        sum_marks = db.execute(text("SELECT COALESCE(SUM(marks), 0) FROM quiz_questions WHERE quiz_id = :qid"), {"qid": quiz_id}).scalar() or 0
        if sum_marks > 0:
            pass_m = round(float(sum_marks) * 0.4, 2)
            db.execute(text("UPDATE quizzes SET total_questions = :tq, total_marks = :tm, passing_marks = :pm, updated_at = CURRENT_TIMESTAMP WHERE id = :id"), {"tq": tot_q, "tm": float(sum_marks), "pm": pass_m, "id": quiz_id})
        db.commit()

        return {
            "id": question_id,
            "question_id": question_id,
            "quiz_id": quiz_id,
            "question_text": q_text,
            "marks": q_marks,
            "negative_marks": q_neg,
            "explanation": q_exp,
            "total_questions": tot_q,
            "total_marks": float(sum_marks)
        }

    @classmethod
    def remove_question_from_quiz(cls, quiz_id: str, question_id: str, db: Session) -> bool:
        """Removes a question and its options from a quiz."""
        db.execute(text("DELETE FROM question_options WHERE question_id = :qid"), {"qid": question_id})
        db.execute(text("DELETE FROM quiz_questions WHERE id = :qid AND quiz_id = :quiz_id"), {"qid": question_id, "quiz_id": quiz_id})
        tot_q = db.execute(text("SELECT count(*) FROM quiz_questions WHERE quiz_id = :qid"), {"qid": quiz_id}).scalar() or 0
        sum_marks = db.execute(text("SELECT COALESCE(SUM(marks), 0) FROM quiz_questions WHERE quiz_id = :qid"), {"qid": quiz_id}).scalar() or 0
        if sum_marks > 0:
            pass_m = round(float(sum_marks) * 0.4, 2)
            db.execute(text("UPDATE quizzes SET total_questions = :tq, total_marks = :tm, passing_marks = :pm, updated_at = CURRENT_TIMESTAMP WHERE id = :id"), {"tq": tot_q, "tm": float(sum_marks), "pm": pass_m, "id": quiz_id})
        else:
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
            st = db.execute(text("SELECT * FROM students WHERE CAST(id AS TEXT) = :s OR student_code = :s OR roll_no = :s LIMIT 1"), {"s": str(student_identifier)}).fetchone()
        
        if st:
            sm = dict(st._mapping)
            actual_student_id = str(sm["id"])
        elif student_identifier:
            try:
                actual_student_id = str(uuid.UUID(str(student_identifier)))
            except (ValueError, AttributeError):
                actual_student_id = str(uuid.uuid5(uuid.NAMESPACE_DNS, str(student_identifier)))
            sm = {"id": actual_student_id, "class_id": qm.get("class_id")}
        else:
            first_s = db.execute(text("SELECT * FROM students LIMIT 1")).fetchone()
            if first_s:
                sm = dict(first_s._mapping)
                actual_student_id = str(sm["id"])
            else:
                actual_student_id = str(uuid.uuid4())
                sm = {"id": actual_student_id, "class_id": qm.get("class_id")}

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

        # 6. Fetch or Generate Personalized Student Paper with Shuffled Questions & Options
        questions_list, options_map = cls._generate_or_get_attempt_paper(
            attempt_id=attempt_id,
            quiz_id=quiz_id,
            student_id=actual_student_id,
            qm=qm,
            db=db
        )

        # 7. Fetch existing saved answers for resume
        saved_ans_rows = db.execute(text("""
            SELECT question_id, selected_option, text_answer, is_marked_for_review
            FROM quiz_attempt_answers
            WHERE attempt_id = :aid
        """), {"aid": attempt_id}).fetchall()
        saved_answers = {str(a[0]): {"selected_option": a[1], "text_answer": a[2], "is_marked_for_review": bool(a[3])} for a in saved_ans_rows}

        quiz_summary = {
            "id": str(qm.get("id")),
            "title": qm.get("title") or "Quiz Assessment",
            "subject": qm.get("subject"),
            "subject_name": qm.get("subject_name") or qm.get("subject") or "General Subject",
            "duration_minutes": duration_mins,
            "total_marks": float(qm.get("total_marks") or 100.0),
            "passing_marks": float(qm.get("passing_marks") or 40.0),
            "negative_marks": float(qm.get("negative_marks") or qm.get("negative_marks_per_question") or 0.0),
            "negative_marks_per_question": float(qm.get("negative_marks_per_question") or 0.0),
            "negative_marking": bool(qm.get("negative_marking")),
            "class_id": str(qm.get("class_id")) if qm.get("class_id") else None,
            "status": qm.get("status"),
            "max_violations": 5,
            "auto_submit_on_violation": True
        }

        return {
            "attempt_id": attempt_id,
            "quiz_id": quiz_id,
            "quiz": quiz_summary,
            "title": qm.get("title"),
            "instructions": qm.get("instructions"),
            "duration_minutes": duration_mins,
            "total_marks": float(qm.get("total_marks") or 100.0),
            "passing_marks": float(qm.get("passing_marks") or 40.0),
            "negative_marking": bool(qm.get("negative_marking")),
            "negative_marks_per_question": float(qm.get("negative_marks_per_question") or 0.0),
            "max_violations": 5,
            "auto_submit_on_violation": True,
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
        """Logs anti-cheating & proctoring anomalies for active attempts while stripping any secret fields."""
        att = db.execute(text("SELECT status FROM quiz_attempts WHERE id = :id"), {"id": attempt_id}).fetchone()
        if not att:
            raise ValueError("Attempt not found")
        if str(att[0] or "").lower() not in ("in_progress", "active", "started"):
            return {"event_id": None, "recorded": False, "ignored_reason": "attempt_not_active"}

        safe_meta: Dict[str, Any] = {}
        if isinstance(metadata, dict):
            forbidden_substrings = ("token", "password", "secret", "authorization", "cookie", "key")
            for k, v in metadata.items():
                k_lower = str(k).lower()
                if any(f in k_lower for f in forbidden_substrings):
                    continue
                safe_meta[str(k)[:64]] = v

        safe_event_type = str(event_type or "security_event").strip()[:64]
        event_id = str(uuid.uuid4())
        meta_json = json.dumps(safe_meta)
        now = datetime.now(timezone.utc)

        db.execute(text("""
            INSERT INTO quiz_security_events (id, attempt_id, event_type, metadata, event_time)
            VALUES (:id, :aid, :etype, :meta, :etime)
        """), {
            "id": event_id, "aid": attempt_id, "etype": safe_event_type, "meta": meta_json, "etime": now
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
        student_identifier: Optional[str] = None,
        submission_reason: Optional[str] = None
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

        # 2. Check if student was assigned an individual randomized paper
        paper_row = db.execute(text("SELECT * FROM quiz_attempt_papers WHERE attempt_id = :aid"), {"aid": attempt_id}).fetchone()
        assigned_q_ids = None
        assigned_q_order = []
        attempt_options_map = {}
        if paper_row:
            try:
                p_data = dict(paper_row._mapping)
                p_payload = json.loads(p_data["paper_payload"])
                assigned_q_ids = set(str(q["id"]) for q in p_payload)
                assigned_q_order = [str(q["id"]) for q in p_payload]
                if p_data.get("options_map"):
                    attempt_options_map = json.loads(p_data["options_map"])
            except Exception:
                pass

        # 3. Fetch questions and authoritative correct options from database
        raw_questions = db.execute(text("""
            SELECT id, marks, negative_marks, question_text, question_type, explanation
            FROM quiz_questions
            WHERE quiz_id = :qid
            ORDER BY question_order ASC
        """), {"qid": qid}).fetchall()

        if assigned_q_ids:
            q_by_id = {str(qr[0]): qr for qr in raw_questions}
            questions = [q_by_id[qid] for qid in assigned_q_order if qid in q_by_id]
        else:
            questions = raw_questions

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

            # All options from DB ordered by option_order ASC
            all_opts = db.execute(text("""
                SELECT id, option_text, option_order, is_correct FROM question_options WHERE question_id = :qid ORDER BY option_order ASC
            """), {"qid": q_id}).fetchall()

            correct_ids = []
            correct_texts = []
            correct_keys = []
            formatted_opts = []
            for idx, o in enumerate(all_opts):
                opt_key = chr(65 + idx)
                opt_id = str(o[0])
                opt_txt = str(o[1] or "").strip()
                opt_corr = bool(o[3])
                formatted_opts.append({
                    "id": opt_id,
                    "key": opt_key,
                    "text": opt_txt,
                    "option_text": opt_txt,
                    "is_correct": opt_corr
                })
                if opt_corr:
                    correct_ids.append(opt_id)
                    correct_texts.append(opt_txt.lower())
                    correct_keys.append(opt_key.upper())

            # Student attempt-specific shuffled option map
            q_opt_map = attempt_options_map.get(q_id, {})
            shuffled_correct_keys = [k.upper() for k in q_opt_map.get("correct_keys", [])]

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
                # Check randomized displayed key, option id, or option text
                if sel_opt:
                    s_opt_up = sel_opt.strip().upper()
                    if shuffled_correct_keys:
                        if s_opt_up in shuffled_correct_keys:
                            is_correct = True
                        elif q_opt_map.get("displayed_options", {}).get(s_opt_up, {}).get("is_correct"):
                            is_correct = True
                    else:
                        if s_opt_up in correct_keys or sel_opt in correct_ids or sel_opt.lower() in correct_texts:
                            is_correct = True
                elif txt_ans:
                    t_ans_up = txt_ans.strip().upper()
                    if shuffled_correct_keys:
                        if t_ans_up in shuffled_correct_keys:
                            is_correct = True
                    else:
                        if t_ans_up in correct_keys or txt_ans in correct_ids or txt_ans.lower() in correct_texts:
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
            primary_corr_key = (shuffled_correct_keys[0] if shuffled_correct_keys else (correct_keys[0] if correct_keys else "A"))
            active_correct_keys = shuffled_correct_keys if shuffled_correct_keys else correct_keys

            # If student saw shuffled options, reflect their displayed order in formatted_opts
            if q_opt_map.get("displayed_options"):
                student_display_opts = []
                for k, opt_info in q_opt_map["displayed_options"].items():
                    student_display_opts.append({
                        "id": opt_info.get("id"),
                        "key": k,
                        "text": opt_info.get("text", ""),
                        "option_text": opt_info.get("text", ""),
                        "is_correct": bool(opt_info.get("is_correct"))
                    })
                student_display_opts.sort(key=lambda x: x["key"])
                display_opts_for_review = student_display_opts
            else:
                display_opts_for_review = formatted_opts

            review_items.append({
                "question_id": q_id,
                "question_text": q_row[3],
                "options": display_opts_for_review,
                "selected_option": sel_opt or txt_ans or None,
                "correct_option": primary_corr_key,
                "correct_options": active_correct_keys,
                "is_correct": is_correct,
                "marks": q_marks,
                "marks_awarded": q_marks if is_correct else ((-q_neg) if (is_neg_marking and is_attempted and q_neg > 0) else 0.0),
                "explanation": q_row[5] or ""
            })

        # Calculate final grades based on assigned paper marks
        final_marks = max(0.0, round(raw_marks - negative_marks, 2))
        total_quiz_marks = sum(float(q[1] or 2.0) for q in questions) if questions else float(qm.get("total_marks") or 100.0)
        percentage = round((final_marks / total_quiz_marks) * 100, 2) if total_quiz_marks > 0 else 0.0
        passing_marks = float(qm.get("passing_marks") or (total_quiz_marks * 0.4))
        result_status = "pass" if final_marks >= passing_marks else "fail"

        now = datetime.now(timezone.utc)
        started_at = ensure_utc(am.get("started_at"))
        time_taken_seconds = int((now - started_at).total_seconds()) if started_at else 0

        submission_status = "auto_submitted" if is_auto_submit else "submitted"
        final_reason = (str(submission_reason).strip()[:64] if submission_reason else "") or ("timer_expired" if is_auto_submit else "student_submitted")

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
            "reason": final_reason,
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

        # Check result release policy (default True if null)
        raw_pub = qm.get("result_published")
        is_published = True if raw_pub is None else bool(raw_pub)

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
            "correct_count": correct_count,
            "wrong_answers": wrong_count,
            "incorrect_count": wrong_count,
            "unanswered_questions": unanswered_count,
            "unanswered_count": unanswered_count,
            "negative_marks_deducted": negative_marks,
            "time_taken_seconds": time_taken_seconds,
            "submitted_at": now.isoformat(),
            "results_released": is_published,
            "is_released": is_published
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

        raw_pub = qm.get("result_published")
        is_released = (True if raw_pub is None else bool(raw_pub)) or is_teacher_or_admin

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
            "results_released": is_released,
            "score": final_marks,
            "final_marks": final_marks,
            "total_marks": tot_marks,
            "percentage": pct,
            "result_status": am.get("result_status", "pass"),
            "passed": am.get("result_status") == "pass",
            "total_questions": am.get("total_questions", 0),
            "attempted_questions": am.get("attempted_questions", 0),
            "correct_answers": am.get("correct_answers", 0),
            "correct_count": am.get("correct_answers", 0),
            "wrong_answers": am.get("wrong_answers", 0),
            "incorrect_count": am.get("wrong_answers", 0),
            "unanswered_questions": am.get("unanswered_questions", 0),
            "unanswered_count": am.get("unanswered_questions", 0),
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

            all_opts = db.execute(text("""
                SELECT id, option_text, is_correct FROM question_options WHERE question_id = :qid ORDER BY option_order ASC
            """), {"qid": q_id}).fetchall()

            formatted_opts = []
            corr_keys = []
            for idx, o in enumerate(all_opts):
                opt_key = chr(65 + idx)
                opt_corr = bool(o[2])
                formatted_opts.append({
                    "id": str(o[0]),
                    "key": opt_key,
                    "text": o[1],
                    "option_text": o[1],
                    "is_correct": opt_corr
                })
                if opt_corr:
                    corr_keys.append(opt_key)

            primary_corr = corr_keys[0] if corr_keys else "A"

            reviews.append({
                "question_id": q_id,
                "question_text": q[1],
                "options": formatted_opts,
                "selected_option": ans[0] if ans else None,
                "correct_option": primary_corr,
                "correct_options": corr_keys,
                "is_correct": bool(ans[2]) if ans else False,
                "marks": float(q[3] or 2.0),
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
                JOIN quiz_attempts qa ON qaa.attempt_id = CAST(qa.id AS TEXT)
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
                "accuracy_percentage": acc_pct,
                "accuracy": acc_pct
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
            pct_val = round(float(am.get("percentage") or 0.0), 1)

            rankings.append({
                "rank": rank,
                "student_id": str(am["student_id"]),
                "name": am["full_name"],
                "roll": am.get("roll_no") or am.get("student_code") or "-",
                "roll_no": am.get("roll_no") or am.get("student_code") or "-",
                "student_code": am.get("student_code") or "-",
                "score": float(am.get("final_marks") or 0.0),
                "percentage": pct_val,
                "accuracy": pct_val,
                "status": am.get("result_status", "pass"),
                "time_taken_seconds": dur,
                "speed": f"{dur_mins}m {dur_secs:02d}s"
            })
            rank += 1

        avg_accuracy = round(sum(r["percentage"] for r in rankings) / len(rankings), 1) if rankings else 0.0

        # Proctoring security incidents & suspicious attempts
        sec_count = db.execute(text("""
            SELECT count(*)
            FROM quiz_security_events qse
            JOIN quiz_attempts qa ON qse.attempt_id = CAST(qa.id AS TEXT)
            WHERE qa.quiz_id = :qid
        """), {"qid": quiz_id}).scalar() or 0

        # Detailed suspicious attempts with proctoring violations
        suspicious_rows = db.execute(text("""
            SELECT qse.id, qse.attempt_id, qse.event_type, qse.event_time, qse.metadata,
                   s.full_name, s.roll_no, s.student_code
            FROM quiz_security_events qse
            JOIN quiz_attempts qa ON qse.attempt_id = CAST(qa.id AS TEXT)
            JOIN students s ON qa.student_id = s.id
            WHERE qa.quiz_id = :qid
            ORDER BY qse.event_time DESC
            LIMIT 50
        """), {"qid": quiz_id}).fetchall()
        suspicious_attempts = [dict(r._mapping) for r in suspicious_rows]

        # Paper randomization metrics & Question exposure
        attempt_papers = db.execute(text("""
            SELECT attempt_id, student_id, question_ids
            FROM quiz_attempt_papers
            WHERE quiz_id = :qid
        """), {"qid": quiz_id}).fetchall()

        unique_combinations = set()
        question_exposure = {}
        for ap in attempt_papers:
            try:
                q_ids = json.loads(ap[2])
                unique_combinations.add(tuple(sorted(q_ids)))
                for qid in q_ids:
                    question_exposure[qid] = question_exposure.get(qid, 0) + 1
            except Exception:
                pass

        # Query question metadata for difficulty and topic
        q_meta_rows = db.execute(text("""
            SELECT question_id, difficulty, topic
            FROM quiz_question_metadata
            WHERE quiz_id = :qid
        """), {"qid": quiz_id}).fetchall()
        meta_dict = {str(r[0]): {"difficulty": r[1], "topic": r[2]} for r in q_meta_rows}

        # Attach exposure count to questions_analysis and build exposure_list
        exposure_list = []
        for qa_item in question_accuracy:
            qid_str = str(qa_item.get("question_id") or "")
            count = question_exposure.get(qid_str, 0)
            pct = round((count / len(attempt_papers)) * 100, 1) if attempt_papers else 0.0
            qa_item["exposure_count"] = count
            qa_item["exposure_percentage"] = pct
            m = meta_dict.get(qid_str, {})
            qa_item["difficulty"] = m.get("difficulty") or "medium"
            qa_item["topic"] = m.get("topic")

            exposure_list.append({
                "question_id": qid_str,
                "question_text": qa_item.get("question_text"),
                "question_order": qa_item.get("question_order"),
                "difficulty": m.get("difficulty") or "medium",
                "topic": m.get("topic"),
                "exposure_count": count,
                "exposure_percentage": pct
            })

        rand_cfg = cls._get_randomization_config(quiz_id, db)

        return {
            "quiz_id": quiz_id,
            "title": qm.get("title"),
            "class_name": qm.get("class_name"),
            "total_marks": tot_marks,
            "passing_marks": float(qm.get("passing_marks") or 40.0),
            "total_attempts": total_attempts,
            "average_score": avg_score,
            "average_accuracy": avg_accuracy,
            "average_time_seconds": avg_time,
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
            "questions_analysis": question_accuracy,
            "student_ranking": rankings,
            "top_performers": rankings[:10],
            "security_incidents_count": sec_count,
            "suspicious_attempts": suspicious_attempts,
            "unique_papers_count": len(unique_combinations),
            "total_papers_generated": len(attempt_papers),
            "question_exposure": exposure_list,
            "question_exposure_map": question_exposure,
            "randomization_config": {
                **rand_cfg,
                "randomize_questions": bool(qm.get("randomize_questions") or qm.get("shuffle_questions")),
                "randomize_options": bool(qm.get("randomize_options") or qm.get("shuffle_options"))
            }
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

        # Fetch all enrolled students in class (plus any student who attempted this quiz) and their latest submitted attempt
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
            LEFT JOIN LATERAL (
                SELECT *
                FROM quiz_attempts a
                WHERE a.student_id = s.id
                  AND a.quiz_id = :qid
                  AND a.status IN ('submitted', 'evaluated', 'auto_submitted', 'SUBMITTED')
                ORDER BY a.submitted_at DESC NULLS LAST, a.started_at DESC NULLS LAST
                LIMIT 1
            ) qa ON TRUE
            WHERE s.class_id = :cid OR qa.id IS NOT NULL
            ORDER BY CASE WHEN qa.id IS NOT NULL THEN 0 ELSE 1 END, s.roll_no ASC, s.full_name ASC
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
            corr_cnt = int(m.get("correct_answers") or 0) if has_attempted else 0
            wrong_cnt = int(m.get("wrong_answers") or 0) if has_attempted else 0

            export_rows.append({
                "Sr No": sr,
                "Student Code": m.get("student_code") or "-",
                "Student ID": m.get("student_code") or "-",
                "Roll No": m.get("roll_no") or m.get("student_code") or "-",
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
                "Correct Answers": corr_cnt,
                "Wrong Answers": wrong_cnt,
                "Correct": corr_cnt,
                "Wrong": wrong_cnt,
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
        writer = csv.DictWriter(output, fieldnames=headers, extrasaction="ignore")
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
