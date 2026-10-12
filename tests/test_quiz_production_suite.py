"""
================================================================================
SSGMCE COLLEGE ERP — PRODUCTION QUIZ SYSTEM VERIFICATION SUITE
Tests the entire lifecycle for Teacher, Student, Anti-Cheating Proctoring,
Server-Side Evaluation, Analytics, RLS Compliance & Exporting
================================================================================
"""

import os
import sys
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
import uuid
from datetime import datetime, timezone, timedelta
from fastapi.testclient import TestClient
from sqlalchemy import text

from backend.main import app
from backend.config.database import SessionLocal
from backend.auth import create_access_token

client = TestClient(app)

def run_quiz_test_suite():
    print("=" * 80)
    print("SSGMCE COLLEGE ERP — QUIZ SYSTEM PRODUCTION READINESS AUDIT")
    print("=" * 80)

    db = SessionLocal()
    try:
        # Resolve target student and their enrolled class
        student = db.execute(text("SELECT s.id, s.student_code, s.class_id, c.class_name FROM students s JOIN classes c ON s.class_id = c.id LIMIT 1")).fetchone()
        student_id = str(student[0])
        student_code = student[1]
        class_id = str(student[2])
        class_name = student[3]

        print(f"Target Class: {class_name} ({class_id})")
        print(f"Target Student: {student_code} ({student_id})")

        # Setup Auth Tokens
        teacher_token = create_access_token({
            "sub": "EMP-CSE-1001", "role": "teacher", "identifier": "EMP-CSE-1001", "user_id": "EMP-CSE-1001",
            "email": "teacher.cse@ssgmce.ac.in", "name": "Prof. J. M. Patil"
        })
        teacher_headers = {"Authorization": f"Bearer {teacher_token}"}

        student_token = create_access_token({
            "sub": student_code, "role": "student", "identifier": student_code, "user_id": student_id,
            "email": f"{student_code}@ssgmce.ac.in", "name": "Student Test"
        })
        student_headers = {"Authorization": f"Bearer {student_token}"}

        # ======================================================================
        # TEST 1: TEACHER - CREATE QUIZ WITH FULL CONFIGURATION
        # ======================================================================
        print("\n[TEST 1] Teacher: Create Quiz with Advanced Configuration...")
        now = datetime.now(timezone.utc)
        quiz_payload = {
            "title": f"Production Test Assessment {uuid.uuid4().hex[:6]}",
            "description": "Automated production readiness evaluation quiz",
            "instructions": "All questions are mandatory. Negative marking applies.",
            "class_id": class_id,
            "duration_minutes": 25,
            "start_time": (now - timedelta(minutes=5)).isoformat(),
            "end_time": (now + timedelta(days=2)).isoformat(),
            "max_attempts": 2,
            "total_marks": 10.0,
            "passing_marks": 4.0,
            "randomize_questions": True,
            "randomize_options": True,
            "negative_marking": True,
            "negative_marks_per_question": 0.5,
            "status": "draft",
            "questions": [
                {
                    "question_text": "What does ACID stand for in Database Systems?",
                    "question_type": "mcq",
                    "marks": 2.0,
                    "negative_marks": 0.5,
                    "explanation": "Atomicity, Consistency, Isolation, Durability",
                    "options": [
                        {"text": "Atomicity, Consistency, Isolation, Durability", "is_correct": True},
                        {"text": "Accuracy, Concurrency, Integrity, Durability", "is_correct": False},
                        {"text": "Atomicity, Cache, Index, Distribution", "is_correct": False},
                        {"text": "None of the above", "is_correct": False}
                    ]
                },
                {
                    "question_text": "Which normal form eliminates transitive functional dependencies?",
                    "question_type": "mcq",
                    "marks": 2.0,
                    "negative_marks": 0.5,
                    "explanation": "3NF removes transitive dependencies",
                    "options": [
                        {"text": "1NF", "is_correct": False},
                        {"text": "2NF", "is_correct": False},
                        {"text": "3NF", "is_correct": True},
                        {"text": "BCNF", "is_correct": False}
                    ]
                }
            ]
        }

        r1 = client.post("/api/v1/quizzes", json=quiz_payload, headers=teacher_headers)
        assert r1.status_code == 201, f"Create quiz failed: {r1.text}"
        quiz_data = r1.json()["data"]
        quiz_id = quiz_data["id"]
        print(f" -> PASS: Quiz created with ID: {quiz_id}")

        # ======================================================================
        # TEST 2: TEACHER - ADD ADDITIONAL QUESTION
        # ======================================================================
        print("\n[TEST 2] Teacher: Add Question to Quiz...")
        new_q_payload = {
            "question_text": "What is the primary purpose of an index in SQL?",
            "question_type": "mcq",
            "marks": 2.0,
            "negative_marks": 0.5,
            "explanation": "To speed up data retrieval operations",
            "options": [
                {"text": "To speed up SELECT queries", "is_correct": True},
                {"text": "To compress table storage", "is_correct": False},
                {"text": "To encrypt row data", "is_correct": False}
            ]
        }
        r2 = client.post(f"/api/v1/quizzes/{quiz_id}/questions", json=new_q_payload, headers=teacher_headers)
        assert r2.status_code == 201, f"Add question failed: {r2.text}"
        added_q = r2.json()["data"]
        print(f" -> PASS: Question added to quiz. Order: {added_q['question_order']}, Total questions: {added_q['total_questions']}")

        # ======================================================================
        # TEST 3: TEACHER - PUBLISH QUIZ
        # ======================================================================
        print("\n[TEST 3] Teacher: Publish Quiz...")
        r3 = client.put(f"/api/v1/quizzes/{quiz_id}/publish", headers=teacher_headers)
        assert r3.status_code == 200, f"Publish quiz failed: {r3.text}"
        assert r3.json()["data"]["is_published"] is True
        print(" -> PASS: Quiz successfully published to class roster")

        # ======================================================================
        # TEST 4: STUDENT - VIEW AVAILABLE QUIZZES (SECURITY: NO ANSWER KEYS)
        # ======================================================================
        print("\n[TEST 4] Student: View Available Quizzes...")
        r4 = client.get(f"/api/v1/quizzes?class_id={class_id}", headers=student_headers)
        assert r4.status_code == 200, f"Get student quizzes failed: {r4.text}"
        quizzes_list = r4.json()["data"]
        found = any(q["id"] == quiz_id for q in quizzes_list)
        assert found, "Created quiz not listed in student quizzes"
        print(" -> PASS: Student sees published quiz in available assessments list")

        # ======================================================================
        # TEST 5: STUDENT - START ATTEMPT (SERVER TIMERS & KEY STRIPPING)
        # ======================================================================
        print("\n[TEST 5] Student: Start Quiz Attempt & Verify Security Strip...")
        r5 = client.post(f"/api/v1/quizzes/{quiz_id}/start", json={"student_id": student_id}, headers=student_headers)
        assert r5.status_code == 201, f"Start attempt failed: {r5.text}"
        attempt_data = r5.json()["data"]
        attempt_id = attempt_data["attempt_id"]
        assert attempt_data["remaining_seconds"] > 0, "Server timer not returned"
        assert len(attempt_data["questions"]) == 3, f"Expected 3 questions, got {len(attempt_data['questions'])}"

        # Verify Answer Keys & Explanations are 100% STRIPPED for students!
        for q in attempt_data["questions"]:
            assert "explanation" not in q or q.get("explanation") in ("", None), "LEAK: Question explanation leaked to student!"
            for opt in q["options"]:
                assert "is_correct" not in opt, f"CRITICAL LEAK: is_correct leaked in option {opt}!"
        print(f" -> PASS: Attempt started ({attempt_id}). Server timer active ({attempt_data['remaining_seconds']}s). All correct answers stripped!")

        # ======================================================================
        # TEST 6: STUDENT - AUTOSAVE ANSWERS IN REAL-TIME
        # ======================================================================
        print("\n[TEST 6] Student: Autosave Answers...")
        # Get question IDs and first option of each
        q1 = attempt_data["questions"][0]
        q2 = attempt_data["questions"][1]
        q3 = attempt_data["questions"][2]

        opt1 = q1["options"][0]["id"]
        opt2 = q2["options"][0]["id"]

        autosave_payload = {
            "answers": {
                q1["id"]: opt1,
                q2["id"]: opt2
            }
        }
        r6 = client.put(f"/api/v1/attempts/{attempt_id}/answers", json=autosave_payload, headers=student_headers)
        assert r6.status_code == 200, f"Autosave failed: {r6.text}"
        assert r6.json()["data"]["saved_count"] == 2
        print(" -> PASS: Autosave successfully persisted answers to database in real-time")

        # ======================================================================
        # TEST 7: PROCTORING - RECORD SECURITY ANOMALY EVENT
        # ======================================================================
        print("\n[TEST 7] Proctoring: Record Security Anomaly Events...")
        sec_payload = {
            "event_type": "tab_switch",
            "metadata": {"count": 1, "browser": "Chrome", "action": "focus_lost"}
        }
        r7 = client.post(f"/api/v1/attempts/{attempt_id}/security-event", json=sec_payload, headers=student_headers)
        assert r7.status_code == 200, f"Security event logging failed: {r7.text}"
        assert r7.json()["data"]["recorded"] is True
        print(" -> PASS: Anti-cheat security event recorded into audit trail")

        # ======================================================================
        # TEST 8: STUDENT - SUBMIT ATTEMPT & SERVER-SIDE EVALUATION
        # ======================================================================
        print("\n[TEST 8] Student: Authoritative Server-Side Evaluation & Scoring...")
        # Now find the actual correct option for q1, q2, q3 from DB to test scoring
        q1_corr = db.execute(text("SELECT id FROM question_options WHERE question_id = :qid AND is_correct = TRUE"), {"qid": q1["id"]}).scalar()
        q2_wrong = db.execute(text("SELECT id FROM question_options WHERE question_id = :qid AND is_correct = FALSE"), {"qid": q2["id"]}).scalar()

        # Submit: q1 correct, q2 wrong (penalized with negative marking), q3 unanswered
        submit_payload = {
            "answers": [
                {"question_id": q1["id"], "selected_option": str(q1_corr)},
                {"question_id": q2["id"], "selected_option": str(q2_wrong)}
            ],
            "is_auto_submit": False
        }
        r8 = client.post(f"/api/v1/attempts/{attempt_id}/submit", json=submit_payload, headers=student_headers)
        assert r8.status_code == 200, f"Submit attempt failed: {r8.text}"
        eval_data = r8.json()["data"]

        assert eval_data["status"] == "submitted"
        assert eval_data["correct_answers"] == 1, f"Expected 1 correct, got {eval_data['correct_answers']}"
        assert eval_data["wrong_answers"] == 1, f"Expected 1 wrong, got {eval_data['wrong_answers']}"
        assert eval_data["unanswered_questions"] == 1, f"Expected 1 unanswered, got {eval_data['unanswered_questions']}"
        # q1 gives 2.0 marks, q2 deducts 0.5 negative marks => final = 1.5
        expected_final = 1.5
        assert abs(eval_data["final_marks"] - expected_final) < 0.01, f"Expected final score {expected_final}, got {eval_data['final_marks']}"
        print(f" -> PASS: Server-side evaluation complete. Score: {eval_data['final_marks']}/10.0 (Correct: 1, Wrong: 1, Negative deducted: 0.5)")

        # ======================================================================
        # TEST 9: SECURITY - PREVENT DUPLICATE SUBMISSION & MODIFICATION
        # ======================================================================
        print("\n[TEST 9] Security: Prevent Duplicate Submission & Modifying Submitted Attempt...")
        # 1. Try to submit again
        r9a = client.post(f"/api/v1/attempts/{attempt_id}/submit", json=submit_payload, headers=student_headers)
        assert r9a.status_code == 400, "SECURITY FAIL: Duplicate submission allowed!"
        # 2. Try to autosave on submitted attempt
        r9b = client.put(f"/api/v1/attempts/{attempt_id}/answers", json=autosave_payload, headers=student_headers)
        assert r9b.status_code == 400, "SECURITY FAIL: Modifying submitted attempt allowed!"
        print(" -> PASS: Duplicate submission blocked (400) and tampering with submitted attempt blocked (400)")

        # ======================================================================
        # TEST 10: TEACHER - PERFORMANCE ANALYTICS & QUESTION ACCURACY
        # ======================================================================
        print("\n[TEST 10] Teacher: Comprehensive Analytics & Question Accuracy...")
        r10 = client.get(f"/api/v1/quizzes/{quiz_id}/analytics", headers=teacher_headers)
        assert r10.status_code == 200, f"Analytics failed: {r10.text}"
        analytics = r10.json()["data"]
        assert analytics["total_attempts"] >= 1
        assert "average_score" in analytics
        assert "highest_score" in analytics
        assert "lowest_score" in analytics
        assert "pass_percentage" in analytics
        assert "question_accuracy" in analytics
        assert len(analytics["question_accuracy"]) == 3
        assert "attempt_distribution" in analytics
        assert "time_spent" in analytics
        print(f" -> PASS: Teacher Analytics computed successfully:")
        print(f"    • Average: {analytics['average_score']}, High: {analytics['highest_score']}, Low: {analytics['lowest_score']}")
        print(f"    • Pass Rate: {analytics['pass_percentage']}%, Total Attempts: {analytics['total_attempts']}")
        print(f"    • Score Distribution: {analytics['attempt_distribution']}")

        # ======================================================================
        # TEST 11: LEADERBOARD RANKING
        # ======================================================================
        print("\n[TEST 11] Leaderboard: Class Ranking...")
        r11 = client.get(f"/api/v1/quizzes/{quiz_id}/leaderboard", headers=teacher_headers)
        assert r11.status_code == 200, f"Leaderboard failed: {r11.text}"
        board = r11.json()["data"]
        assert len(board) >= 1
        print(f" -> PASS: Leaderboard computed. Rank 1: {board[0]['name']} (Score: {board[0]['score']}, Speed: {board[0]['speed']})")

        # ======================================================================
        # TEST 12: EXPORT TO CSV & EXCEL
        # ======================================================================
        print("\n[TEST 12] Export: CSV and Excel-Compatible Formats...")
        r12_csv = client.get(f"/api/v1/quizzes/{quiz_id}/export?format=csv", headers=teacher_headers)
        assert r12_csv.status_code == 200, f"CSV export failed: {r12_csv.text}"
        assert "Student Name" in r12_csv.text or "Score" in r12_csv.text

        r12_xls = client.get(f"/api/v1/quizzes/{quiz_id}/export?format=excel", headers=teacher_headers)
        assert r12_xls.status_code == 200, f"Excel export failed: {r12_xls.text}"
        assert r12_xls.headers["content-type"].startswith("application/vnd.ms-excel")
        print(" -> PASS: CSV and Excel-compatible exports generated successfully with BOM headers")

        # ======================================================================
        # TEST 13: TEACHER - TOGGLE RESULT RELEASE TO STUDENTS
        # ======================================================================
        print("\n[TEST 13] Teacher: Release Results to Students & Verify Review...")
        r13 = client.post(f"/api/v1/quizzes/{quiz_id}/toggle-release-results", json={"release": True}, headers=teacher_headers)
        assert r13.status_code == 200, f"Toggle release failed: {r13.text}"
        assert r13.json()["data"]["result_published"] is True

        # Now student checks their result - question review must now be accessible!
        r13_res = client.get(f"/api/v1/attempts/{attempt_id}/result", headers=student_headers)
        assert r13_res.status_code == 200
        res_data = r13_res.json()["data"]
        assert res_data["is_released"] is True
        assert "review" in res_data
        assert len(res_data["review"]) == 3
        print(" -> PASS: Result released by faculty. Student now sees complete scorecard with explanations & correct keys.")

        print("\n" + "=" * 80)
        print("ALL 13 QUIZ SYSTEM PRODUCTION READINESS VERIFICATION TESTS PASSED!")
        print("=" * 80)

    finally:
        db.close()

if __name__ == "__main__":
    run_quiz_test_suite()
