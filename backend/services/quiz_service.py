import io
import csv
import re
import uuid
from datetime import datetime, timezone
from typing import Optional, Dict, Any, List
from sqlalchemy.orm import Session
from sqlalchemy import text
from backend.utils.helpers import ensure_utc

class QuizService:
    @staticmethod
    def evaluate_submission(attempt_id: str, answers: List[Any], is_auto_submit: bool, db: Session) -> Dict[str, Any]:
        att = db.execute(text("SELECT * FROM quiz_attempts WHERE id = :id"), {"id": attempt_id}).fetchone()
        if not att:
            raise ValueError("Attempt not found")
        am = dict(att._mapping)
        qid = am["quiz_id"]
        q = db.execute(text("SELECT * FROM quizzes WHERE id = :id"), {"id": qid}).fetchone()
        qm = dict(q._mapping)

        # Save answers
        for a in answers:
            q_id = getattr(a, "question_id", None) or a.get("question_id")
            opt = getattr(a, "selected_option", None) or a.get("selected_option")
            txt = getattr(a, "text_answer", None) or a.get("text_answer")
            db.execute(text("""
                INSERT OR REPLACE INTO quiz_attempt_answers (id, attempt_id, question_id, selected_option, text_answer, updated_at)
                VALUES (COALESCE((SELECT id FROM quiz_attempt_answers WHERE attempt_id = :aid AND question_id = :qid), :nid), :aid, :qid, :opt, :txt, CURRENT_TIMESTAMP)
            """), {"aid": attempt_id, "qid": q_id, "opt": opt, "txt": txt, "nid": str(uuid.uuid4())})
        db.commit()

        # Grade
        questions = db.execute(text("""
            SELECT qq.question_id, qq.marks, qb.expected_answer
            FROM quiz_questions qq
            JOIN question_bank qb ON qq.question_id = qb.id
            WHERE qq.quiz_id = :qid
        """), {"qid": qid}).fetchall()

        total_score = 0.0
        correct_count = 0
        incorrect_count = 0
        unanswered_count = 0
        negative_marking = bool(qm.get("negative_marking", False))
        neg_marks = float(qm.get("negative_marks", 0.0))

        review_list = []
        for q_item in questions:
            q_id = q_item[0]
            q_marks = float(q_item[1] or 2.0)
            expected = q_item[2]

            ans = db.execute(text("SELECT selected_option, text_answer FROM quiz_attempt_answers WHERE attempt_id = :aid AND question_id = :qid"), {"aid": attempt_id, "qid": q_id}).fetchone()
            sel = ans[0] if ans else None
            txt_ans = ans[1] if ans else None

            corr_opt = db.execute(text("SELECT option_key FROM question_options WHERE question_id = :qid AND is_correct = 1 LIMIT 1"), {"qid": q_id}).fetchone()
            correct_key = corr_opt[0] if corr_opt else expected

            is_corr = False
            if sel:
                if sel == correct_key:
                    is_corr = True
                    total_score += q_marks
                    correct_count += 1
                else:
                    incorrect_count += 1
                    if negative_marking:
                        total_score -= neg_marks
            elif txt_ans and expected and txt_ans.strip().lower() == expected.strip().lower():
                is_corr = True
                total_score += q_marks
                correct_count += 1
            else:
                unanswered_count += 1

            review_list.append({
                "question_id": q_id,
                "selected_option": sel,
                "correct_option": correct_key,
                "is_correct": is_corr,
                "marks": q_marks if is_corr else 0.0
            })

        total_score = max(0.0, total_score)
        tot_marks = float(qm.get("total_marks", 100.0))
        pct = round((total_score / tot_marks) * 100, 1) if tot_marks > 0 else 0.0
        pass_marks = float(qm.get("passing_marks", 40.0))
        passed = total_score >= pass_marks

        start_t = ensure_utc(am.get("started_at"))
        now = datetime.now(timezone.utc)
        time_taken = int((now - start_t).total_seconds()) if start_t else 0
        status_str = "auto_submitted" if is_auto_submit else "submitted"

        db.execute(text("""
            UPDATE quiz_attempts
            SET submitted_at = CURRENT_TIMESTAMP,
                status = :st,
                score = :sc,
                percentage = :pct,
                passed = :p,
                correct_count = :corr,
                incorrect_count = :inc,
                unanswered_count = :unans,
                time_taken_seconds = :sec,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = :id
        """), {
            "st": status_str, "sc": total_score, "pct": pct, "p": 1 if passed else 0,
            "corr": correct_count, "inc": incorrect_count, "unans": unanswered_count,
            "sec": time_taken, "id": attempt_id
        })
        db.commit()

        rel_mode = qm.get("result_release_mode", "IMMEDIATE")
        release_immediate = (rel_mode == "IMMEDIATE") and bool(qm.get("show_result_immediately", True))

        res_data = {
            "attempt_id": attempt_id,
            "quiz_id": qid,
            "status": status_str,
            "score": total_score,
            "total_marks": tot_marks,
            "percentage": pct,
            "passed": passed,
            "correct_count": correct_count,
            "incorrect_count": incorrect_count,
            "unanswered_count": unanswered_count,
            "time_taken_seconds": time_taken,
            "results_released": release_immediate
        }
        if release_immediate:
            res_data["review"] = review_list
        return res_data

    @staticmethod
    def generate_class_export_csv(quiz_id: str, filter_type: str, db: Session) -> tuple[str, str]:
        quiz = db.execute(text("SELECT q.*, c.class_name FROM quizzes q LEFT JOIN classes c ON q.class_id = c.id WHERE q.id = :id"), {"id": quiz_id}).fetchone()
        if not quiz:
            raise ValueError("Quiz not found")
        qm = dict(quiz._mapping)
        target_class_id = qm["class_id"]
        class_label = qm.get("class_name", "Target Class")

        query = text("""
            SELECT 
                s.id as student_db_id,
                s.student_code,
                s.roll_no,
                s.full_name,
                c.class_name,
                c.division,
                COALESCE(s.email, '') as email,
                qa.id as attempt_id,
                qa.status as attempt_status,
                qa.attempt_number,
                qa.started_at,
                qa.submitted_at,
                qa.time_taken_seconds,
                qa.score,
                qa.percentage,
                qa.passed,
                qa.correct_count,
                qa.incorrect_count,
                qa.unanswered_count
            FROM students s
            LEFT JOIN classes c ON s.class_id = c.id
            LEFT JOIN quiz_attempts qa ON (s.id = qa.student_id AND qa.quiz_id = :qid AND qa.status IN ('submitted', 'auto_submitted', 'SUBMITTED'))
            WHERE s.class_id = :cid
            ORDER BY s.roll_no ASC, s.full_name ASC
        """)
        rows = db.execute(query, {"cid": target_class_id, "qid": quiz_id}).fetchall()

        export_rows = []
        sr = 1
        for r in rows:
            m = dict(r._mapping)
            has_attempted = bool(m.get("attempt_id") and m.get("attempt_status") in ("submitted", "auto_submitted", "SUBMITTED"))
            status_label = "Attempted" if has_attempted else "Not Attempted"
            passed_val = bool(m.get("passed"))
            result_label = "Passed" if (has_attempted and passed_val) else ("Failed" if has_attempted else "Not Attempted")

            if filter_type == "attempted" and not has_attempted:
                continue
            if filter_type == "not_attempted" and has_attempted:
                continue
            if filter_type == "passed" and (not has_attempted or not passed_val):
                continue
            if filter_type == "failed" and (not has_attempted or passed_val):
                continue

            mins = int(m.get("time_taken_seconds") or 0) // 60
            secs = int(m.get("time_taken_seconds") or 0) % 60
            speed_formatted = f"{mins}m {secs:02d}s" if has_attempted else "-"

            export_rows.append({
                "Sr No": sr,
                "Student ID": m.get("student_code") or m.get("student_db_id"),
                "SIS ID": m.get("student_code") or "-",
                "Roll No": m.get("roll_no") or "-",
                "Student Name": m.get("full_name") or "-",
                "Class": m.get("class_name") or class_label,
                "Division": m.get("division") or "1",
                "Email": m.get("email") or "-",
                "Attempt Status": status_label,
                "Attempt Number": m.get("attempt_number") if has_attempted else "-",
                "Started At": str(m.get("started_at")) if has_attempted else "-",
                "Submitted At": str(m.get("submitted_at")) if has_attempted else "-",
                "Time Taken": speed_formatted,
                "Total Marks": qm.get("total_marks", 100.0),
                "Score": round(float(m.get("score") or 0.0), 2) if has_attempted else 0,
                "Percentage": f"{float(m.get('percentage') or 0.0):.1f}%" if has_attempted else "0%",
                "Correct": int(m.get("correct_count") or 0) if has_attempted else 0,
                "Wrong": int(m.get("incorrect_count") or 0) if has_attempted else 0,
                "Unanswered": int(m.get("unanswered_count") or 0) if has_attempted else 0,
                "Result": result_label
            })
            sr += 1

        output = io.StringIO()
        headers = [
            "Sr No", "Student ID", "SIS ID", "Roll No", "Student Name", "Class", "Division", "Email",
            "Attempt Status", "Attempt Number", "Started At", "Submitted At", "Time Taken",
            "Total Marks", "Score", "Percentage", "Correct", "Wrong", "Unanswered", "Result"
        ]
        writer = csv.DictWriter(output, fieldnames=headers)
        writer.writeheader()
        for row in export_rows:
            writer.writerow(row)

        clean_title = re.sub(r'[^a-zA-Z0-9_]', '_', qm.get('title', 'Quiz'))
        filename = f"SSGMCE_Quiz_Report_{clean_title}_{class_label}.csv"
        return output.getvalue(), filename
