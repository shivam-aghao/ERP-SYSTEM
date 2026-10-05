import requests
import sys
import json

BASE_URL = "http://127.0.0.1:8000/api/v1/quiz"

def test_full_pipeline():
    print("=== SSGMCE QUIZ E2E SYSTEM INTEGRATION TEST ===")
    
    # 1. Classes & Students
    r = requests.get(f"{BASE_URL}/classes")
    assert r.status_code == 200, f"Classes failed: {r.text}"
    classes = r.json()["data"]
    print(f"[OK] Fetched {len(classes)} classes")
    
    r = requests.get(f"{BASE_URL}/students")
    assert r.status_code == 200, f"Students failed: {r.text}"
    students = r.json()["data"]
    print(f"[OK] Fetched {len(students)} students")
    
    # Find a 1R1 student who hasn't submitted target quiz yet
    quizzes_1r1_meta = requests.get(f"{BASE_URL}/student/quizzes?class_name=1R1").json()["data"]["quizzes"]
    target_qid = quizzes_1r1_meta[0]["id"]
    
    student_1r1 = None
    for s in [x for x in students if x["class_name"] == "1R1"]:
        # check if student attempted
        st_quizzes = requests.get(f"{BASE_URL}/student/quizzes?class_name=1R1&student_id={s['id']}").json()["data"]["quizzes"]
        tq = next((q for q in st_quizzes if q["id"] == target_qid), None)
        if tq and tq.get("attempts_count", 0) == 0:
            student_1r1 = s
            break
            
    if not student_1r1:
        # Fallback to any 1R1 student if none found
        student_1r1 = next(x for x in students if x["class_name"] == "1R1")
        
    student_2r1 = next((s for s in students if s["class_name"] == "2R1"), None)
    assert student_1r1, "No 1R1 student found"
    assert student_2r1, "No 2R1 student found"
    print(f"[OK] Selected 1R1 Student: {student_1r1['full_name']} ({student_1r1['id']})")
    print(f"[OK] Selected 2R1 Student: {student_2r1['full_name']} ({student_2r1['id']})")
    
    # 2. Strict Class-Restricted Quizzes Fetch
    r = requests.get(f"{BASE_URL}/student/quizzes?class_name=1R1&student_id={student_1r1['id']}")
    assert r.status_code == 200
    quizzes_1r1 = r.json()["data"]["quizzes"]
    print(f"[OK] 1R1 Student sees {len(quizzes_1r1)} quizzes for 1R1")
    for q in quizzes_1r1:
        assert q["class_name"] == "1R1", f"Class leak detected! {q['class_name']} visible to 1R1"
        
    r = requests.get(f"{BASE_URL}/student/quizzes?class_name=2R1&student_id={student_2r1['id']}")
    assert r.status_code == 200
    quizzes_2r1 = r.json()["data"]["quizzes"]
    print(f"[OK] 2R1 Student sees {len(quizzes_2r1)} quizzes for 2R1")
    for q in quizzes_2r1:
        assert q["class_name"] == "2R1", f"Class leak detected! {q['class_name']} visible to 2R1"
        
    # 3. Security: 2R1 student attempting to start 1R1 quiz should be FORBIDDEN (403)
    target_quiz = quizzes_1r1[0]
    quiz_id = target_quiz["id"]
    r = requests.post(f"{BASE_URL}/student/quizzes/{quiz_id}/start", json={
        "student_id": student_2r1["id"],
        "student_name": student_2r1["full_name"],
        "class_name": "2R1"
    })
    assert r.status_code == 403, f"Expected 403 Forbidden for cross-class access, got {r.status_code}"
    print("[OK] Cross-class unauthorized quiz start correctly blocked with HTTP 403")

    # 4. Valid Student Starts Quiz
    r = requests.post(f"{BASE_URL}/student/quizzes/{quiz_id}/start", json={
        "student_id": student_1r1["id"],
        "student_name": student_1r1["full_name"],
        "class_name": "1R1"
    })
    assert r.status_code == 200, f"Start quiz failed: {r.text}"
    start_data = r.json()["data"]
    attempt_id = start_data["attempt_id"]
    questions = start_data["questions"]
    print(f"[OK] Quiz started. Attempt ID: {attempt_id}, Questions: {len(questions)}")
    
    # Verify no correct answers leaked before submission
    for q in questions:
        for opt in q.get("options", []):
            assert "is_correct" not in opt, "Security violation: is_correct leaked in start payload!"
    print("[OK] Security confirmed: is_correct is stripped from student runner payload")
    
    # 5. Autosave Answer
    first_q = questions[0]
    r = requests.put(f"{BASE_URL}/attempts/{attempt_id}/answers", json={
        "answers": [{
            "question_id": first_q["question_id"],
            "selected_option": "B",
            "is_marked_for_review": False
        }]
    })
    assert r.status_code == 200
    print("[OK] Autosave successfully accepted")
    
    # 6. Proctoring Security Event (Tab switch)
    r = requests.post(f"{BASE_URL}/attempts/{attempt_id}/security-event", json={
        "event_type": "tab_switch",
        "metadata": {"switch_count": 1}
    })
    assert r.status_code == 200
    print("[OK] Proctoring telemetry event logged")
    
    # 7. Submit Quiz Attempt and Verify Server-Side Evaluation & Review details
    submit_answers = []
    for idx, q in enumerate(questions):
        submit_answers.append({
            "question_id": q["question_id"],
            "selected_option": "A" if idx % 2 == 0 else "B",
            "time_taken_seconds": 15
        })
    r = requests.post(f"{BASE_URL}/student/attempts/{attempt_id}/submit", json={
        "attempt_id": attempt_id,
        "answers": submit_answers
    })
    assert r.status_code == 200, f"Submit failed: {r.text}"
    eval_res = r.json()["data"]
    print(f"[OK] Evaluated Score: {eval_res['score']}/{eval_res['total_marks']} ({eval_res['percentage']}%)")
    print(f"[OK] Correct: {eval_res['correct_count']}, Wrong: {eval_res['incorrect_count']}, Unanswered: {eval_res['unanswered_count']}")
    
    # Check Review payload is present
    assert "review" in eval_res, "Review payload missing in submission result!"
    review_list = eval_res["review"]
    assert len(review_list) == len(questions), f"Expected {len(questions)} review items, got {len(review_list)}"
    print(f"[OK] Server generated detailed review for all {len(review_list)} questions")
    
    # 8. Student Performance Trend
    r = requests.get(f"{BASE_URL}/student/{student_1r1['id']}/trend")
    assert r.status_code == 200
    trend = r.json()["data"]
    print(f"[OK] Trend Analytics: Total Attempts={trend['total_attempts']}, Avg Score={trend['average_score_pct']}%")
    
    # 9. Quiz Leaderboard
    r = requests.get(f"{BASE_URL}/quizzes/{quiz_id}/leaderboard")
    assert r.status_code == 200
    lb = r.json()["data"]
    print(f"[OK] Leaderboard rows returned: {len(lb)}")
    assert any(x["student_id"] == student_1r1["id"] for x in lb), "Student missing from leaderboard!"
    
    # 10. Teacher Analytics & Results
    r = requests.get(f"{BASE_URL}/quizzes/{quiz_id}/results")
    assert r.status_code == 200
    res_data = r.json()["data"]
    print(f"[OK] Quiz Results: Attempted={res_data['attempted_count']}, Avg Score={res_data['average_score']}, Pass%={res_data['pass_percentage']}%")

    r = requests.get(f"{BASE_URL}/quizzes/{quiz_id}/analytics")
    assert r.status_code == 200
    analytics = r.json()["data"]
    print(f"[OK] Quiz Question Analytics: Questions={len(analytics['questions'])}, Title='{analytics['quiz_title']}'")
    
    # 11. Teacher Quiz Lifecycle (Create -> Publish -> Delete)
    r = requests.post(f"{BASE_URL}/teacher/quizzes", json={
        "title": "Automated Integration Test Quiz",
        "subject": "Computer Networks",
        "class_id": student_1r1["class_id"],
        "class_name": "1R1",
        "duration_minutes": 25,
        "total_marks": 50,
        "marks_per_question": 2,
        "negative_marks": 0.5,
        "description": "Lifecycle testing",
        "status": "DRAFT",
        "questions": []
    })
    assert r.status_code == 200, f"Quiz creation failed: {r.text}"
    created_quiz = r.json()["data"]
    created_quiz_id = created_quiz["id"]
    print(f"[OK] Created new test quiz: {created_quiz_id}")
    
    # Publish
    r = requests.put(f"{BASE_URL}/teacher/quizzes/{created_quiz_id}/publish")
    assert r.status_code == 200
    print("[OK] Quiz published successfully")
    
    # Check notifications triggered
    r = requests.get(f"{BASE_URL}/notifications?class_name=1R1")
    assert r.status_code == 200
    notifs = r.json()["data"]
    print(f"[OK] Class notifications count: {len(notifs)}")
    
    # Clean up created quiz
    r = requests.delete(f"{BASE_URL}/teacher/quizzes/{created_quiz_id}")
    assert r.status_code == 200
    print("[OK] Cleaned up test quiz via DELETE")
    
    print("\n>>> ALL END-TO-END TESTS PASSED FLACIDLY & PERFECTLY! <<<")

if __name__ == "__main__":
    test_full_pipeline()
