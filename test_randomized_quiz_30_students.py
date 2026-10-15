import sys
import os
import json
import random
import requests
import uuid

BASE_URL = "http://127.0.0.1:8000/api/v1"

def run_tests():
    print("=" * 80)
    print("STARTING 30-STUDENT RANDOMIZED QUIZ VERIFICATION")
    print("=" * 80)

    # 1. Create a Teacher Quiz with 50 Questions (20 Easy, 20 Medium, 10 Hard)
    print("\n[Step 1] Creating Quiz with Randomization Config & 50-Question Pool...")
    
    questions_pool = []
    # 20 Easy questions
    for i in range(1, 21):
        questions_pool.append({
            "question_text": f"Easy Question #{i}: What is the primary purpose of CPU scheduling in Operating Systems?",
            "question_type": "multiple_choice",
            "marks": 2.0,
            "difficulty": "easy",
            "topic": "CPU Scheduling",
            "options": [
                {"key": "A", "text": f"Maximize CPU utilization and throughput (Easy {i})", "is_correct": True},
                {"key": "B", "text": f"Turn off unused cores (Easy {i})", "is_correct": False},
                {"key": "C", "text": f"Format storage drives (Easy {i})", "is_correct": False},
                {"key": "D", "text": f"Compile source code (Easy {i})", "is_correct": False}
            ],
            "explanation": "CPU scheduling aims to maximize CPU utilization and throughput."
        })

    # 20 Medium questions
    for i in range(1, 21):
        questions_pool.append({
            "question_text": f"Medium Question #{i}: Which condition is NOT one of Coffman's four deadlock conditions?",
            "question_type": "multiple_choice",
            "marks": 2.0,
            "difficulty": "medium",
            "topic": "Deadlocks",
            "options": [
                {"key": "A", "text": f"Preemptive resource allocation without priority (Medium {i})", "is_correct": True},
                {"key": "B", "text": f"Mutual Exclusion (Medium {i})", "is_correct": False},
                {"key": "C", "text": f"Hold and Wait (Medium {i})", "is_correct": False},
                {"key": "D", "text": f"Circular Wait (Medium {i})", "is_correct": False}
            ],
            "explanation": "Preemption prevents deadlock rather than being a condition for it."
        })

    # 10 Hard questions
    for i in range(1, 11):
        questions_pool.append({
            "question_text": f"Hard Question #{i}: In Banker's algorithm, what is the time complexity to verify if a state is safe?",
            "question_type": "multiple_choice",
            "marks": 2.0,
            "difficulty": "hard",
            "topic": "Deadlock Avoidance",
            "options": [
                {"key": "A", "text": f"O(m * n^2) where m=resources, n=processes (Hard {i})", "is_correct": True},
                {"key": "B", "text": f"O(n * log(m)) (Hard {i})", "is_correct": False},
                {"key": "C", "text": f"O(m + n) linear time (Hard {i})", "is_correct": False},
                {"key": "D", "text": f"O(2^n) exponential time (Hard {i})", "is_correct": False}
            ],
            "explanation": "Safety algorithm in Banker's takes O(m * n^2) operations."
        })

    quiz_payload = {
        "title": "Automated CSE Randomization Test Quiz",
        "subject": "Operating Systems",
        "class_id": "51e6fba4-bd51-43ba-8cd1-aef0248c97c8",
        "class_name": "3R",
        "duration_minutes": 30,
        "total_marks": 40.0,
        "passing_marks": 16.0,
        "marks_per_question": 2.0,
        "negative_marks": 0.5,
        "negative_marking": True,
        "randomize_questions": True,
        "randomize_options": True,
        "questions_per_student": 20,
        "unique_question_paper": True,
        "prevent_duplicate_questions": True,
        "randomize_question_types": True,
        "difficulty_distribution": {
            "easy": 40,
            "medium": 40,
            "hard": 20
        },
        "security_settings": {
            "track_tab_switches": True,
            "enable_fullscreen_lock": False,
            "block_clipboard": True
        },
        "description": "Validation test for student randomized papers.",
        "status": "draft",
        "questions": questions_pool
    }

    res = requests.post(f"{BASE_URL}/quizzes", json=quiz_payload)
    if res.status_code not in (200, 201):
        print(f"FAILED to create quiz: {res.status_code} {res.text}")
        sys.exit(1)

    res_json = res.json()
    quiz_data = res_json.get("data") or res_json
    quiz_id = quiz_data.get("id")
    print(f" Quiz created successfully! ID: {quiz_id}")
    print(f"  Pool size: {len(questions_pool)} questions | Per student: 20")

    # 2. Test Pre-Publish Validation
    print("\n[Step 2] Testing Pre-Publish Validation Engine...")
    val_res = requests.get(f"{BASE_URL}/quizzes/{quiz_id}/validate-publish")
    assert val_res.status_code == 200, f"Validate publish failed: {val_res.text}"
    val_json = val_res.json().get("data") or val_res.json()
    print(f"  Validation result: valid={val_json.get('valid')}, errors={val_json.get('errors')}, warnings={val_json.get('warnings')}")
    assert val_json.get("valid") is True, f"Quiz should be valid for publishing! {val_json}"

    # Publish the quiz
    pub_res = requests.put(f"{BASE_URL}/quizzes/{quiz_id}/publish?action=publish")
    assert pub_res.status_code == 200, f"Publish failed: {pub_res.text}"
    print(" Quiz published and active for students!")

    # 3. Simulate 30 Students Starting Attempts
    print("\n[Step 3] Simulating 30 Distinct Students Starting Quiz Attempts...")
    students_res = requests.get(f"{BASE_URL}/students")
    assert students_res.status_code == 200, "Could not fetch student roster"
    real_students = (students_res.json().get("data") or students_res.json())[:30]
    assert len(real_students) >= 30, f"Need at least 30 students in database, found {len(real_students)}"
    print(f"  Loaded {len(real_students)} real student accounts from ERP database.")

    generated_papers = []
    student_attempt_records = []
    
    # We will simulate 30 real students
    for idx, stu in enumerate(real_students, start=1):
        student_id = stu["id"]
        start_payload = {
            "student_id": student_id,
            "student_name": stu.get("full_name") or f"Student {idx}",
            "student_roll": stu.get("student_code") or f"CSE-{idx:03d}"
        }
        
        attempt_res = requests.post(f"{BASE_URL}/quizzes/{quiz_id}/start", json=start_payload)
        assert attempt_res.status_code in (200, 201), f"Student {idx} start failed: {attempt_res.text}"
        attempt_json = attempt_res.json()
        attempt_data = attempt_json.get("data") or attempt_json
        attempt_id = attempt_data["attempt_id"]
        questions = attempt_data["questions"]

        # Check A: Exactly 20 questions
        assert len(questions) == 20, f"Student {idx} received {len(questions)} questions instead of 20!"

        # Check B: Zero duplicate questions in this attempt
        q_ids = [q["id"] for q in questions]
        assert len(q_ids) == len(set(q_ids)), f"Student {idx} has duplicate questions in paper!"

        # Check C: Difficulty distribution: 40% Easy (8), 40% Medium (8), 20% Hard (4)
        easy_count = sum(1 for q in questions if "Easy Question" in q["question_text"] or q.get("difficulty") == "easy")
        med_count = sum(1 for q in questions if "Medium Question" in q["question_text"] or q.get("difficulty") == "medium")
        hard_count = sum(1 for q in questions if "Hard Question" in q["question_text"] or q.get("difficulty") == "hard")
        assert easy_count == 8, f"Student {idx} got {easy_count} easy questions (expected 8)"
        assert med_count == 8, f"Student {idx} got {med_count} med questions (expected 8)"
        assert hard_count == 4, f"Student {idx} got {hard_count} hard questions (expected 4)"

        # Check D: Security check - ensure is_correct and explanations are NOT exposed
        for q in questions:
            assert "explanation" not in q or q.get("explanation") in (None, ""), f"Explanation leaked in student paper!"
            for opt in q["options"]:
                assert "is_correct" not in opt, f"is_correct leaked in option to student!"

        # Check E: Page refresh / Reconnect test for 1st student
        if idx == 1:
            resume_res = requests.post(f"{BASE_URL}/quizzes/{quiz_id}/start", json=start_payload)
            assert resume_res.status_code in (200, 201)
            resume_json = resume_res.json()
            resume_data = resume_json.get("data") or resume_json
            resume_q_ids = [q["id"] for q in resume_data["questions"]]
            assert resume_q_ids == q_ids, "Page refresh / Reconnect returned DIFFERENT questions!"
            # Verify options order is also identical
            for q_orig, q_res in zip(questions, resume_data["questions"]):
                orig_opts = [o.get("text") or o.get("option_text") for o in q_orig["options"]]
                res_opts = [o.get("text") or o.get("option_text") for o in q_res["options"]]
                assert orig_opts == res_opts, "Options order changed upon reconnection!"
            print("   Reconnection resilience verified (exact paper restored without re-shuffling).")

        generated_papers.append(tuple(sorted(q_ids)))
        student_attempt_records.append({
            "student_id": student_id,
            "attempt_id": attempt_id,
            "questions": questions
        })

    print(f" All 30 student attempts generated successfully.")
    
    # Check F: Uniqueness across papers
    unique_combinations = len(set(generated_papers))
    print(f"\n[Step 4] Checking Question Paper Variation Across Students...")
    print(f"  Unique combinations generated: {unique_combinations} out of 30 attempts")
    # In a pool of 50 questions choosing 20 (with 40/40/20 difficulty constraints), C(20,8)*C(20,8)*C(10,4) = 125,970 * 125,970 * 210 > 3.3 * 10^12 combinations.
    # We expect close to 30 unique combinations.
    assert unique_combinations >= 28, f"Uniqueness too low: {unique_combinations} unique papers for 30 students!"
    print("  Paper diversity and variation criteria met!")

    # Check G: Option Shuffling Check across students for the same question
    # Find a question that appeared in multiple students' papers and compare the option key for the correct text
    first_q_id = student_attempt_records[0]["questions"][0]["id"]
    option_keys_seen = set()
    for rec in student_attempt_records:
        matching_q = next((q for q in rec["questions"] if q["id"] == first_q_id), None)
        if matching_q:
            # find which key ('A','B','C','D') holds the text with "Maximize CPU" or "Preemptive" or "O(m"
            for opt in matching_q["options"]:
                txt = opt.get("text") or opt.get("option_text") or ""
                if "Maximize CPU" in txt or "Preemptive" in txt or "O(m * n^2)" in txt:
                    option_keys_seen.add(opt.get("key") or opt.get("option_key"))
    print(f"\n[Step 5] Checking MCQ Option Shuffling:")
    print(f"  Distinct option keys assigned to correct answer for Q({first_q_id[:8]}...): {option_keys_seen}")
    assert len(option_keys_seen) > 1, "MCQ options were not shuffled across students!"
    print("  MCQ options are verified to be independently shuffled per student.")

    # 6. Submit student answers and verify accurate grading
    print("\n[Step 6] Submitting Answers & Verifying Evaluation Against Student Option Map...")
    for idx, rec in enumerate(student_attempt_records):
        answers_payload = []
        # Student answers:
        # If student index is even, answer all correctly.
        # If odd, answer 10 correctly and 10 incorrectly.
        target_correct = 20 if (idx % 2 == 0) else 10
        for q_idx, q in enumerate(rec["questions"]):
            correct_opt_key = None
            wrong_opt_keys = []
            for opt in q["options"]:
                txt = opt.get("text") or opt.get("option_text") or ""
                k = opt.get("key") or opt.get("option_key")
                if "Maximize CPU" in txt or "Preemptive" in txt or "O(m * n^2)" in txt:
                    correct_opt_key = k
                else:
                    wrong_opt_keys.append(k)
            
            if q_idx < target_correct:
                chosen_key = correct_opt_key
            else:
                chosen_key = wrong_opt_keys[0] if wrong_opt_keys else "B"

            answers_payload.append({
                "question_id": q["id"],
                "selected_option": chosen_key,
                "is_marked_for_review": False
            })

        sub_res = requests.post(
            f"{BASE_URL}/attempts/{rec['attempt_id']}/submit",
            json={"answers": answers_payload, "is_auto_submit": False, "submission_reason": "completed"}
        )
        assert sub_res.status_code in (200, 201), f"Submit failed for student {idx}: {sub_res.text}"
        sub_json = sub_res.json()
        sub_data = sub_json.get("data") or sub_json
        
        # Verify score calculation:
        # 20 questions @ 2.0 marks = 40.0 total marks.
        if idx % 2 == 0:
            # 20 correct -> 40 marks (100%)
            assert sub_data["score"] == 40.0, f"Student {idx} expected 40.0 marks, got {sub_data['score']}"
            assert sub_data["correct_answers"] == 20
            assert sub_data["percentage"] == 100.0
        else:
            # 10 correct (+20.0), 10 wrong (-5.0 with neg mark 0.5) = 15.0 marks (37.5%)
            assert sub_data["score"] == 15.0, f"Student {idx} expected 15.0 marks, got {sub_data['score']}"
            assert sub_data["correct_answers"] == 10
            assert sub_data["percentage"] == 37.5

    print(" All 30 submissions graded accurately against attempt-specific options_map!")

    # 7. Verify Teacher Analytics
    print("\n[Step 7] Checking Quiz Analytics (Exposure Heat & Uniqueness)...")
    analytics_res = requests.get(f"{BASE_URL}/quizzes/{quiz_id}/analytics")
    assert analytics_res.status_code == 200, f"Analytics failed: {analytics_res.text}"
    analytics_json = analytics_res.json()
    analytics_data = analytics_json.get("data") or analytics_json
    print(f"  Total student attempts: {analytics_data.get('total_attempts')}")
    print(f"  Unique papers count: {analytics_data.get('unique_papers_count')}")
    print(f"  Total papers generated: {analytics_data.get('total_papers_generated')}")
    print(f"  Average score: {analytics_data.get('average_score')}%")
    print(f"  Top performers count: {len(analytics_data.get('top_performers', []))}")
    
    question_exposure = analytics_data.get("question_exposure", [])
    print(f"  Questions tracked in exposure list: {len(question_exposure)}")
    assert len(question_exposure) == 50, f"Expected 50 questions in exposure list, got {len(question_exposure)}"
    
    # Total question servings across 30 students = 30 * 20 = 600 servings across 50 questions
    total_servings = sum(qe["exposure_count"] for qe in question_exposure)
    assert total_servings == 600, f"Expected 600 total question servings, got {total_servings}"
    print(f"  Total question exposures summed: {total_servings} (exactly 30 students x 20 questions)")

    print("\n" + "=" * 80)
    print(" ALL 30-STUDENT RANDOMIZED QUIZ VERIFICATION TESTS PASSED SUCCESSFULLY!")
    print("=" * 80)

if __name__ == "__main__":
    run_tests()
