import sqlite3
import uuid
from datetime import datetime, timezone

db_path = r'D:\ERP-SYSTEM\teacher\backend\attendance_api\ssgmce_erp.db'
conn = sqlite3.connect(db_path)
cur = conn.cursor()

# Get teacher
cur.execute('SELECT id FROM teachers LIMIT 1;')
t_row = cur.fetchone()
teacher_id = t_row[0] if t_row else 'cd1f48e7-1343-4e04-b851-bee7443aa658'

# Clean previous quiz data for clean test state
cur.execute('DROP TABLE IF EXISTS quiz_questions;')
cur.execute('''
CREATE TABLE quiz_questions (
    id VARCHAR(36) PRIMARY KEY,
    quiz_id VARCHAR(36) NOT NULL,
    question_id VARCHAR(36) NOT NULL,
    question_order INTEGER NOT NULL DEFAULT 1,
    marks REAL NOT NULL DEFAULT 2.0,
    negative_marks REAL NOT NULL DEFAULT 0.0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
''')
cur.execute('DELETE FROM question_options;')
cur.execute('DELETE FROM question_bank;')
cur.execute('DELETE FROM quiz_attempt_answers;')
cur.execute('DELETE FROM quiz_attempts;')
cur.execute('DELETE FROM quiz_security_events;')
cur.execute('DELETE FROM quiz_audit_logs;')
cur.execute('DELETE FROM quizzes;')

questions_data = [
    {
        'text': 'Which CPU scheduling algorithm is non-preemptive and executes jobs strictly in arrival sequence?',
        'type': 'MCQ',
        'subject': 'Operating Systems',
        'topic': 'CPU Scheduling',
        'diff': 'EASY',
        'marks': 2.0,
        'neg': 0.5,
        'exp': 'FCFS (First-Come, First-Served) is the simplest non-preemptive algorithm.',
        'options': [
            ('A', 'FCFS (First-Come First-Served)', 1),
            ('B', 'Round Robin', 0),
            ('C', 'Shortest Remaining Time First', 0),
            ('D', 'Priority Scheduling (Preemptive)', 0)
        ]
    },
    {
        'text': 'Which of the following are necessary conditions for a Deadlock to occur in an operating system? (Select all that apply)',
        'type': 'MULTIPLE_CHOICE',
        'subject': 'Operating Systems',
        'topic': 'Deadlocks',
        'diff': 'HARD',
        'marks': 4.0,
        'neg': 1.0,
        'exp': 'The Coffman conditions are Mutual Exclusion, Hold and Wait, No Preemption, and Circular Wait.',
        'options': [
            ('A', 'Mutual Exclusion', 1),
            ('B', 'Hold and Wait', 1),
            ('C', 'Circular Wait', 1),
            ('D', 'Starvation Prevention', 0)
        ]
    },
    {
        'text': 'Virtual memory allows the execution of processes that are not completely in main memory.',
        'type': 'TRUE_FALSE',
        'subject': 'Operating Systems',
        'topic': 'Memory Management',
        'diff': 'EASY',
        'marks': 2.0,
        'neg': 0.0,
        'exp': 'True. Virtual memory separates logical user memory from physical storage.',
        'options': [
            ('A', 'True', 1),
            ('B', 'False', 0)
        ]
    },
    {
        'text': 'What is the standard system call in UNIX/Linux used to create a new child process?',
        'type': 'SHORT_ANSWER',
        'subject': 'Operating Systems',
        'topic': 'Process Management',
        'diff': 'MEDIUM',
        'marks': 2.0,
        'neg': 0.0,
        'expected': 'fork',
        'exp': 'fork() creates a duplicate child process that inherits address space.',
        'options': []
    },
    {
        'text': 'In the Dining Philosophers problem, what is the primary concurrency hazard that must be avoided?',
        'type': 'MCQ',
        'subject': 'Operating Systems',
        'topic': 'Process Synchronization',
        'diff': 'MEDIUM',
        'marks': 2.0,
        'neg': 0.5,
        'exp': 'Deadlock occurs if all philosophers grab their left chopstick simultaneously.',
        'options': [
            ('A', 'Deadlock and Starvation', 1),
            ('B', 'Buffer Overflow', 0),
            ('C', 'Thrashing', 0),
            ('D', 'Internal Fragmentation', 0)
        ]
    }
]

q_ids = []
for qd in questions_data:
    qid = str(uuid.uuid4())
    q_ids.append(qid)
    cur.execute('''
    INSERT INTO question_bank (id, question_text, question_type, subject_name, topic, difficulty, marks, negative_marks, expected_answer, explanation, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    ''', (qid, qd['text'], qd['type'], qd['subject'], qd['topic'], qd['diff'], qd['marks'], qd['neg'], qd.get('expected'), qd.get('exp'), teacher_id))
    
    for opt in qd.get('options', []):
        cur.execute('''
        INSERT INTO question_options (id, question_id, option_key, option_text, is_correct)
        VALUES (?, ?, ?, ?, ?);
        ''', (str(uuid.uuid4()), qid, opt[0], opt[1], opt[2]))

# 1. Create Quiz for CSE 3R (Class ID: ac46eda9-4dd3-4432-ac69-d4b91b61aa4d)
quiz_3r_id = 'c3e3a001-3333-4444-5555-666677778888'
cur.execute('''
INSERT INTO quizzes (
    id, teacher_id, class_id, subject_name, title, description, instructions,
    duration_minutes, total_marks, passing_marks, max_attempts, status,
    start_at, end_at, shuffle_questions, shuffle_options, negative_marking, negative_marks
) VALUES (
    ?, ?, 'ac46eda9-4dd3-4432-ac69-d4b91b61aa4d', 'Operating Systems',
    'Unit 1 Operating Systems: Process & CPU Scheduling',
    'Mid-semester assessment on process lifecycle, CPU scheduling, synchronization and deadlock.',
    '1. Answer all questions within the 30-minute limit.\n2. Negative marking applies for objective questions.\n3. Leaving or switching tabs will be recorded by exam proctoring.',
    30, 12.0, 5.0, 2, 'PUBLISHED',
    datetime('now'), datetime('now', '+7 days'), 1, 1, 1, 0.5
);
''', (quiz_3r_id, teacher_id))

# Link questions to Quiz 3R
for idx, qid in enumerate(q_ids, 1):
    cur.execute('''
    INSERT INTO quiz_questions (id, quiz_id, question_id, question_order, marks, negative_marks)
    VALUES (?, ?, ?, ?, 2.0, 0.5);
    ''', (str(uuid.uuid4()), quiz_3r_id, qid, idx))

# 2. Create Quiz for CSE 2R1 (Class ID: 0a7372d4-db33-4908-9f85-896c7009fd76)
quiz_2r1_id = 'c2e2a002-2222-3333-4444-555566667777'
cur.execute('''
INSERT INTO quizzes (
    id, teacher_id, class_id, subject_name, title, description, instructions,
    duration_minutes, total_marks, passing_marks, max_attempts, status,
    start_at, end_at, shuffle_questions, shuffle_options, negative_marking, negative_marks
) VALUES (
    ?, ?, '0a7372d4-db33-4908-9f85-896c7009fd76', 'Discrete Mathematics',
    'Unit 1 Propositional Logic & Set Theory',
    'Core evaluation for SY CSE 2R1 on logic, truth tables, and mathematical induction.',
    '1. Test duration is 25 minutes.\n2. Passing mark is 40%.\n3. Fullscreen mode required.',
    25, 10.0, 4.0, 1, 'PUBLISHED',
    datetime('now'), datetime('now', '+7 days'), 0, 0, 0, 0.0
);
''', (quiz_2r1_id, teacher_id))

# Question for 2R1 quiz
dm_qid = str(uuid.uuid4())
cur.execute('''
INSERT INTO question_bank (id, question_text, question_type, subject_name, topic, difficulty, marks, negative_marks, explanation, created_by)
VALUES (?, 'If P is True and Q is False, what is the truth value of P IMPLIES Q (P -> Q)?', 'MCQ', 'Discrete Mathematics', 'Logic', 'EASY', 2.0, 0.0, 'P -> Q is false only when P is true and Q is false.', ?);
''', (dm_qid, teacher_id))

cur.execute('''
INSERT INTO question_options (id, question_id, option_key, option_text, is_correct)
VALUES (?, ?, 'A', 'False', 1);
''', (str(uuid.uuid4()), dm_qid))
cur.execute('''
INSERT INTO question_options (id, question_id, option_key, option_text, is_correct)
VALUES (?, ?, 'B', 'True', 0);
''', (str(uuid.uuid4()), dm_qid))

cur.execute('''
INSERT INTO quiz_questions (id, quiz_id, question_id, question_order, marks, negative_marks)
VALUES (?, ?, ?, 1, 2.0, 0.0);
''', (str(uuid.uuid4()), quiz_2r1_id, dm_qid))

conn.commit()
conn.close()
print("Seeding completed successfully!")
