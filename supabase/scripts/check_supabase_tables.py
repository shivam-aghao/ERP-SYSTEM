import os
import urllib.request
import json
import urllib.error
from dotenv import load_dotenv

load_dotenv()
key = os.getenv('SUPABASE_ANON_KEY', '')
base = (os.getenv('SUPABASE_URL', 'https://gftqvclenyplnuoocbwe.supabase.co')).rstrip('/') + '/rest/v1'

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
