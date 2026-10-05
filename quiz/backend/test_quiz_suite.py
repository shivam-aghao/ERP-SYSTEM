import sys
sys.path.append(r'D:\ERP-SYSTEM\teacher\backend\attendance_api')
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

print('=== 1. TEST CLASSES ===')
res = client.get('/api/v1/quiz/classes')
assert res.status_code == 200, res.text
classes = res.json()['data']
print('Found classes:', [c['class_name'] for c in classes])

print('\n=== 2. TEST CLASS-BASED QUIZ ACCESS ===')
# Student in 3R (308979: Ku. Aarti Ganesh Kawle)
res_3r = client.get('/api/v1/quiz/student/quizzes?student_id=308979')
assert res_3r.status_code == 200, res_3r.text
quizzes_3r = res_3r.json()['data']['quizzes']
print('Student 3R saw quizzes:', [q['title'] for q in quizzes_3r])
assert any('Operating Systems' in q['title'] for q in quizzes_3r), 'Student 3R should see OS quiz'
assert not any('Propositional Logic' in q['title'] for q in quizzes_3r), 'Student 3R must NOT see 2R1 quiz!'

# Student in 2R1 (307001: Student 2R1-01)
res_2r1 = client.get('/api/v1/quiz/student/quizzes?student_id=307001')
assert res_2r1.status_code == 200, res_2r1.text
quizzes_2r1 = res_2r1.json()['data']['quizzes']
print('Student 2R1 saw quizzes:', [q['title'] for q in quizzes_2r1])
assert any('Propositional Logic' in q['title'] for q in quizzes_2r1), 'Student 2R1 should see DM quiz'
assert not any('Operating Systems' in q['title'] for q in quizzes_2r1), 'Student 2R1 must NOT see 3R quiz!'

print('\n=== 3. CRITICAL SECURITY TEST: UNAUTHORIZED QUIZ_ID TAMPERING ===')
os_quiz_id = [q['id'] for q in quizzes_3r if 'Operating Systems' in q['title']][0]
# Student 2R1 attempts to start the 3R quiz
attack_res = client.post(f'/api/v1/quiz/student/quizzes/{os_quiz_id}/start', json={'student_id': '307001'})
print('Attack response status:', attack_res.status_code)
print('Attack response body:', attack_res.text)
assert attack_res.status_code == 403, f'Expected 403 Forbidden, got {attack_res.status_code}'
print('>>> SUCCESS: Backend strictly blocked student from 2R1 from accessing 3R quiz!')

print('\n=== 4. TEST LEGITIMATE QUIZ START ===')
start_res = client.post(f'/api/v1/quiz/student/quizzes/{os_quiz_id}/start', json={'student_id': '308979'})
assert start_res.status_code == 200, start_res.text
start_data = start_res.json()['data']
attempt_id = start_data['attempt_id']
questions = start_data['questions']
print(f'Attempt started: {attempt_id}, Questions count: {len(questions)}')
# Verify answers are NOT exposed to student!
for q in questions:
    for opt in q.get('options', []):
        assert 'is_correct' not in opt, 'is_correct must NOT be exposed before submission!'
print('>>> SUCCESS: Answer keys securely stripped from student question API!')

print('\n=== 5. TEST AUTOSAVE ===')
first_q = questions[0]
save_res = client.put(f'/api/v1/quiz/attempts/{attempt_id}/answers', json={
    'answers': [{
        'question_id': first_q['question_id'],
        'selected_option': 'A',
        'is_marked_for_review': False
    }]
})
assert save_res.status_code == 200, save_res.text
print('Autosave status:', save_res.json()['message'])

print('\n=== 6. TEST PROCTORING / TELEMETRY EVENT ===')
event_res = client.post(f'/api/v1/quiz/attempts/{attempt_id}/security-event', json={
    'event_type': 'tab_switch',
    'metadata': {'reason': 'Student switched window'}
})
assert event_res.status_code == 200, event_res.text
print('Security event logged:', event_res.json()['data']['event_id'])

print('\n=== 7. TEST SUBMISSION & EVALUATION ===')
# Prepare answers for all 5 questions
answers_payload = []
for q in questions:
    qid = q['question_id']
    qtype = q['question_type']
    if qtype == 'MCQ':
        answers_payload.append({'question_id': qid, 'selected_option': 'A'})
    elif qtype == 'MULTIPLE_CHOICE':
        answers_payload.append({'question_id': qid, 'selected_options': ['A', 'B', 'C']})
    elif qtype == 'TRUE_FALSE':
        answers_payload.append({'question_id': qid, 'selected_option': 'A'})
    elif qtype == 'SHORT_ANSWER':
        answers_payload.append({'question_id': qid, 'text_answer': 'fork'})

sub_res = client.post(f'/api/v1/quiz/attempts/{attempt_id}/submit', json={'answers': answers_payload})
assert sub_res.status_code == 200, sub_res.text
sub_data = sub_res.json()['data']
print(f"Score: {sub_data['score']} / {sub_data['total_marks']}")
print(f"Percentage: {sub_data['percentage']}%, Passed: {sub_data['passed']}")
print(f"Correct: {sub_data['correct_count']}, Incorrect: {sub_data['incorrect_count']}")
assert sub_data['score'] > 0, 'Score should be positive'

print('\n=== 8. TEST TEACHER RESULTS DASHBOARD ===')
results_res = client.get(f'/api/v1/quiz/quizzes/{os_quiz_id}/results')
assert results_res.status_code == 200, results_res.text
rdata = results_res.json()['data']
print(f"Teacher Results - Enrolled in class: {rdata['total_students']}, Attempted: {rdata['attempted_count']}, Avg Score: {rdata['average_score']}")
assert len(rdata['students']) >= 1, 'Should include student submission in results'

print('\n=== 9. TEST QUESTION DIFFICULTY ANALYTICS ===')
analytics_res = client.get(f'/api/v1/quiz/quizzes/{os_quiz_id}/analytics')
assert analytics_res.status_code == 200, analytics_res.text
adata = analytics_res.json()['data']
print(f"Questions analyzed: {len(adata['questions'])}")
for qitem in adata['questions']:
    print(f"  Q{qitem['order']}: {qitem['difficulty']} - Correct: {qitem['correct_percentage']}%")

print('\n>>> ALL 9 CORE INTEGRATION & SECURITY TESTS PASSED PERFECTLY! <<<')

