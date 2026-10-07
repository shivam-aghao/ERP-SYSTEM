import urllib.request
import json
import urllib.error

key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdmdHF2Y2xlbnlwbG51b29jYndlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA0ODc3MjYsImV4cCI6MjEwNjA2MzcyNn0.kE1dD3VmL44ekYsqDpuPaMiwr3ljGQ-c4wDuumx9XxY'
base = 'https://gftqvclenyplnuoocbwe.supabase.co/rest/v1'

candidate_tables = [
    'timetable_entries', 'timetable', 'timetables', 'teacher_timetable', 
    'faculty_timetable', 'timetable_assessments', 'schedule', 'schedules',
    'subject_syllabus', 'teachers', 'students', 'classes', 'subjects', 'attendance_sessions',
    'departments', 'class_cards', 'quizzes', 'notifications'
]

for tbl in candidate_tables:
    url = f'{base}/{tbl}?select=*&limit=1'
    req = urllib.request.Request(url, headers={'apikey': key, 'Authorization': f'Bearer {key}'})
    try:
        with urllib.request.urlopen(req) as resp:
            data = json.loads(resp.read().decode('utf-8'))
            print(f'[FOUND] Table "{tbl}" EXISTS in Supabase: count={len(data)}')
    except urllib.error.HTTPError as e:
        if e.code == 404:
            print(f'[MISSING] Table "{tbl}" NOT in Supabase (404)')
        else:
            print(f'[HTTP {e.code}] Table "{tbl}": {e.reason}')
    except Exception as e:
        print(f'[ERROR] Table "{tbl}": {e}')
