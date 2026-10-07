import os
import sys
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
import json
import uuid
from datetime import datetime, timedelta

from backend.apply_supabase_seed_chunks import get_supabase_token, run_query

def sq(val):
    if val is None:
        return "NULL"
    return "'" + str(val).replace("'", "''") + "'"

def main():
    print("Connecting to Supabase Cloud to seed Step 5 Quiz & Assessment Portal in batch mode...")
    token = get_supabase_token()

    batch_sql = [
        "DELETE FROM public.result_change_logs",
        "DELETE FROM public.result_publication_logs",
        "DELETE FROM public.quiz_results",
        "DELETE FROM public.student_answer_options",
        "DELETE FROM public.student_answers",
        "DELETE FROM public.quiz_attempts",
        "DELETE FROM public.question_options",
        "DELETE FROM public.quiz_questions",
        "DELETE FROM public.quizzes"
    ]

    # 1. Fetch Master Data
    teachers_raw = json.loads(run_query("SELECT id, emp_code, full_name FROM public.teachers;", token))
    classes_raw = json.loads(run_query("SELECT id, class_name FROM public.classes;", token))
    subjects_raw = json.loads(run_query("SELECT id, code, name FROM public.subjects;", token))
    students_3r = json.loads(run_query("SELECT id, student_code, roll_no, full_name, class_name FROM public.students WHERE class_name = '3R' ORDER BY roll_no;", token))

    teacher_map = {t['full_name']: t['id'] for t in teachers_raw}
    class_map = {c['class_name']: c['id'] for c in classes_raw}
    subject_map = {s['code']: s['id'] for s in subjects_raw}

    patil_id = teacher_map.get("Dr. J. M. Patil") or teachers_raw[0]['id']
    kandoi_id = teacher_map.get("Dr. N. M. Kandoi") or teachers_raw[1]['id']
    deshmukh_id = teacher_map.get("Prof. R. V. Deshmukh") or teachers_raw[2]['id']
    zamare_id = teacher_map.get("Dr. R. A. Zamare") or teachers_raw[3]['id']

    class_3r_id = class_map.get("3R")
    dbms_id = subject_map.get("5CS220PC")
    cd_id = subject_map.get("5CS221PC")
    cao_id = subject_map.get("5CS222PC")
    dss_id = subject_map.get("5CS223PE")

    print(f"Loaded master entities: Patil={patil_id}, Class 3R={class_3r_id}, Students 3R={len(students_3r)}")

    # --------------------------------------------------------------------------
    # QUIZ 1: DBMS Mid-Term Assessment (PUBLISHED)
    # --------------------------------------------------------------------------
    q1_id = str(uuid.uuid4())
    start_q1 = (datetime.now() - timedelta(days=5)).isoformat()
    end_q1 = (datetime.now() + timedelta(days=2)).isoformat()

    batch_sql.append(f"""
    INSERT INTO public.quizzes (
        id, teacher_id, class_id, subject_id, title, description, instructions,
        total_questions, total_marks, passing_marks, duration_minutes,
        start_time, end_time, max_attempts, randomize_questions, randomize_options,
        negative_marking, negative_marks_per_question, status, result_published
    ) VALUES (
        {sq(q1_id)}, {sq(patil_id)}, {sq(class_3r_id)}, {sq(dbms_id)},
        {sq('Mid-Semester Assessment: Database Management Systems')},
        {sq('Comprehensive assessment covering Relational Algebra, SQL Queries, Normalization up to BCNF, and Concurrency Control.')},
        {sq('1. Ensure uninterrupted internet connection.\n2. Total time allowed is 30 minutes.\n3. Each question carries marks as indicated.\n4. Negative marking of 0.25 marks applies for incorrect answers.\n5. Click Submit once finished.')},
        5, 10.0, 4.0, 30,
        {sq(start_q1)}, {sq(end_q1)}, 1, true, true,
        true, 0.25, 'active', false
    )
    """)

    # Questions for Quiz 1
    q1_questions = [
        {
            "id": str(uuid.uuid4()),
            "text": "Which normal form deals with the elimination of transitive dependencies?",
            "type": "single_choice", "marks": 2.0, "neg": 0.25,
            "exp": "3NF removes transitive dependencies (X -> Y where Y is non-prime and X is not a superkey).",
            "hint": "Think about dependencies through an intermediate attribute.",
            "options": [
                (str(uuid.uuid4()), "1NF", False), (str(uuid.uuid4()), "2NF", False),
                (str(uuid.uuid4()), "3NF", True), (str(uuid.uuid4()), "BCNF", False)
            ]
        },
        {
            "id": str(uuid.uuid4()),
            "text": "In ACID properties of a DBMS, what does the 'I' stand for?",
            "type": "single_choice", "marks": 2.0, "neg": 0.25,
            "exp": "I stands for Isolation, ensuring concurrent transactions do not interfere with each other.",
            "hint": "Concurrent execution property.",
            "options": [
                (str(uuid.uuid4()), "Integrity", False), (str(uuid.uuid4()), "Isolation", True),
                (str(uuid.uuid4()), "Indexation", False), (str(uuid.uuid4()), "Iteration", False)
            ]
        },
        {
            "id": str(uuid.uuid4()),
            "text": "A primary key constraint in SQL enforces both UNIQUE and NOT NULL constraints automatically.",
            "type": "true_false", "marks": 2.0, "neg": 0.25,
            "exp": "A primary key uniquely identifies each record and cannot contain NULL values.",
            "hint": "Check the definition of entity integrity.",
            "options": [
                (str(uuid.uuid4()), "True", True), (str(uuid.uuid4()), "False", False)
            ]
        },
        {
            "id": str(uuid.uuid4()),
            "text": "Which of the following are valid DDL (Data Definition Language) commands in SQL? (Select all that apply)",
            "type": "multiple_choice", "marks": 2.0, "neg": 0.25,
            "exp": "CREATE, ALTER, and DROP are DDL commands. INSERT and UPDATE are DML.",
            "hint": "Commands that modify the schema structure.",
            "options": [
                (str(uuid.uuid4()), "CREATE", True), (str(uuid.uuid4()), "ALTER", True),
                (str(uuid.uuid4()), "INSERT", False), (str(uuid.uuid4()), "DROP", True)
            ]
        },
        {
            "id": str(uuid.uuid4()),
            "text": "Which SQL clause is used to filter records resulting from a GROUP BY operation?",
            "type": "single_choice", "marks": 2.0, "neg": 0.25,
            "exp": "HAVING filters groups created by GROUP BY, while WHERE filters individual rows before grouping.",
            "hint": "Applies aggregate condition filtering.",
            "options": [
                (str(uuid.uuid4()), "WHERE", False), (str(uuid.uuid4()), "HAVING", True),
                (str(uuid.uuid4()), "ORDER BY", False), (str(uuid.uuid4()), "FILTER", False)
            ]
        }
    ]

    for order, q_item in enumerate(q1_questions, start=1):
        batch_sql.append(f"""
        INSERT INTO public.quiz_questions (id, quiz_id, question_text, question_type, marks, negative_marks, explanation, hint, question_order)
        VALUES ({sq(q_item["id"])}, {sq(q1_id)}, {sq(q_item["text"])}, {sq(q_item["type"])}, {q_item["marks"]}, {q_item["neg"]}, {sq(q_item["exp"])}, {sq(q_item["hint"])}, {order})
        """)
        for opt_order, (opt_id, opt_text, is_corr) in enumerate(q_item["options"], start=1):
            batch_sql.append(f"""
            INSERT INTO public.question_options (id, question_id, option_text, option_order, is_correct)
            VALUES ({sq(opt_id)}, {sq(q_item["id"])}, {sq(opt_text)}, {opt_order}, {str(is_corr).lower()})
            """)

    # --------------------------------------------------------------------------
    # QUIZ 2: Compiler Design (UNPUBLISHED)
    # --------------------------------------------------------------------------
    q2_id = str(uuid.uuid4())
    start_q2 = (datetime.now() - timedelta(days=2)).isoformat()
    end_q2 = (datetime.now() + timedelta(days=4)).isoformat()

    batch_sql.append(f"""
    INSERT INTO public.quizzes (
        id, teacher_id, class_id, subject_id, title, description, instructions,
        total_questions, total_marks, passing_marks, duration_minutes,
        start_time, end_time, max_attempts, randomize_questions, randomize_options,
        negative_marking, negative_marks_per_question, status, result_published
    ) VALUES (
        {sq(q2_id)}, {sq(kandoi_id)}, {sq(class_3r_id)}, {sq(cd_id)},
        {sq('Unit Assessment: Lexical Analysis & CFG in Compiler Design')},
        {sq('Tests DFA/NFA construction, Lex specifications, and LL(1) parse table derivation.')},
        {sq('1. Time allowed is 20 minutes.\n2. Read all options carefully before selecting.')},
        3, 6.0, 3.0, 20,
        {sq(start_q2)}, {sq(end_q2)}, 1, false, false,
        false, 0.0, 'active', false
    )
    """)

    q2_questions = [
        ("Which phase of a compiler produces a stream of tokens as its output?", "single_choice", 2.0, [("Lexical Analyzer", True), ("Syntax Analyzer", False), ("Semantic Analyzer", False), ("Code Generator", False)]),
        ("An LL(1) parser is an example of a Top-Down Parser.", "true_false", 2.0, [("True", True), ("False", False)]),
        ("Which data structure is primarily used by a bottom-up shift-reduce parser?", "single_choice", 2.0, [("Queue", False), ("Stack", True), ("Binary Tree", False), ("Graph", False)])
    ]

    for order, (q_text, q_type, marks, opts) in enumerate(q2_questions, start=1):
        qid = str(uuid.uuid4())
        batch_sql.append(f"""
        INSERT INTO public.quiz_questions (id, quiz_id, question_text, question_type, marks, question_order)
        VALUES ({sq(qid)}, {sq(q2_id)}, {sq(q_text)}, {sq(q_type)}, {marks}, {order})
        """)
        for opt_order, (opt_text, is_corr) in enumerate(opts, start=1):
            batch_sql.append(f"""
            INSERT INTO public.question_options (id, question_id, option_text, option_order, is_correct)
            VALUES ({sq(str(uuid.uuid4()))}, {sq(qid)}, {sq(opt_text)}, {opt_order}, {str(is_corr).lower()})
            """)

    # --------------------------------------------------------------------------
    # QUIZ 3: CAO (SCHEDULED)
    # --------------------------------------------------------------------------
    q3_id = str(uuid.uuid4())
    start_q3 = (datetime.now() + timedelta(days=2)).isoformat()
    end_q3 = (datetime.now() + timedelta(days=7)).isoformat()

    batch_sql.append(f"""
    INSERT INTO public.quizzes (
        id, teacher_id, class_id, subject_id, title, description, instructions,
        total_questions, total_marks, passing_marks, duration_minutes,
        start_time, end_time, max_attempts, randomize_questions, randomize_options,
        negative_marking, negative_marks_per_question, status, result_published
    ) VALUES (
        {sq(q3_id)}, {sq(deshmukh_id)}, {sq(class_3r_id)}, {sq(cao_id)},
        {sq('Scheduled Quiz: Pipelining & Cache Memory Hierarchies')},
        {sq('Upcoming internal assessment on pipeline hazards (structural, data, control) and cache mapping techniques.')},
        {sq('Will activate on scheduled start time.')},
        5, 10.0, 4.0, 25,
        {sq(start_q3)}, {sq(end_q3)}, 1, true, true,
        false, 0.0, 'scheduled', false
    )
    """)

    # --------------------------------------------------------------------------
    # SEED ATTEMPTS AND ANSWERS FOR QUIZ 1
    # --------------------------------------------------------------------------
    attempt_ids = []
    for idx, st in enumerate(students_3r[:15]):
        att_id = str(uuid.uuid4())
        attempt_ids.append(att_id)
        batch_sql.append(f"""
        INSERT INTO public.quiz_attempts (
            id, quiz_id, student_id, attempt_number, started_at, submitted_at, status, total_questions
        ) VALUES (
            {sq(att_id)}, {sq(q1_id)}, {sq(st['id'])}, 1,
            NOW() - INTERVAL '30 minutes', NOW() - INTERVAL '5 minutes', 'submitted', 5
        )
        """)

        is_top = (st['student_code'] == '308637' or idx % 3 == 0)

        for q_item in q1_questions:
            ans_id = str(uuid.uuid4())
            qid = q_item["id"]
            q_type = q_item["type"]
            corr_opts = [o for o in q_item["options"] if o[2]]
            wrong_opts = [o for o in q_item["options"] if not o[2]]

            if q_type in ('single_choice', 'true_false'):
                if is_top or (idx + hash(qid)) % 4 != 0:
                    chosen_opt_id = corr_opts[0][0]
                else:
                    chosen_opt_id = wrong_opts[0][0] if wrong_opts else corr_opts[0][0]

                batch_sql.append(f"""
                INSERT INTO public.student_answers (id, attempt_id, question_id, selected_option_id, is_answered, answered_at)
                VALUES ({sq(ans_id)}, {sq(att_id)}, {sq(qid)}, {sq(chosen_opt_id)}, true, NOW())
                """)

            elif q_type == 'multiple_choice':
                batch_sql.append(f"""
                INSERT INTO public.student_answers (id, attempt_id, question_id, is_answered, answered_at)
                VALUES ({sq(ans_id)}, {sq(att_id)}, {sq(qid)}, true, NOW())
                """)
                if is_top:
                    for c_opt in corr_opts:
                        batch_sql.append(f"""
                        INSERT INTO public.student_answer_options (id, student_answer_id, option_id)
                        VALUES ({sq(str(uuid.uuid4()))}, {sq(ans_id)}, {sq(c_opt[0])})
                        """)
                else:
                    chosen_subset = [corr_opts[0]] + (wrong_opts[:1] if wrong_opts else [])
                    for s_opt in chosen_subset:
                        batch_sql.append(f"""
                        INSERT INTO public.student_answer_options (id, student_answer_id, option_id)
                        VALUES ({sq(str(uuid.uuid4()))}, {sq(ans_id)}, {sq(s_opt[0])})
                        """)

    print(f"Compiled {len(batch_sql)} statements in batch. Executing transactional block in Supabase Cloud...")
    full_sql = "BEGIN;\n" + ";\n".join(batch_sql) + ";\nCOMMIT;"
    res = run_query(full_sql, token)
    print("Initial batch executed successfully:", res)

    # Now evaluate the attempts using stored procedure
    print("Evaluating attempts and computing marks...")
    eval_stmts = [f"SELECT public.fn_evaluate_quiz_attempt('{aid}')" for aid in attempt_ids]
    eval_sql = ";\n".join(eval_stmts) + ";"
    run_query(eval_sql, token)
    print("All attempts evaluated!")

    # Publish Quiz 1
    print("Publishing Quiz 1...")
    pub_sql = f"""
    SELECT public.fn_publish_quiz_results(
        '{q1_id}', '{patil_id}', 'Official release of Mid-Semester Assessment results'
    );
    """
    run_query(pub_sql, token)
    print("Quiz 1 published!")

    # Modify 1 result for audit testing
    sample_res = json.loads(run_query(f"SELECT id, student_id, marks_obtained FROM public.quiz_results WHERE quiz_id = '{q1_id}' LIMIT 1;", token))
    if sample_res:
        res_id = sample_res[0]['id']
        old_m = float(sample_res[0]['marks_obtained'])
        new_m = min(10.0, old_m + 0.5)
        mod_sql = f"""
        SELECT public.fn_modify_student_result(
            '{res_id}', {new_m}, '{patil_id}', 'Re-evaluated answer 4 due to step credit'
        );
        """
        run_query(mod_sql, token)
        print(f"Modified result {res_id} from {old_m} to {new_m}")

    print("\n--- STEP 5 DATABASE SEED COMPLETED 100% SUCCESSFULLY ---")

if __name__ == "__main__":
    main()

