import sqlite3
import json

conn = sqlite3.connect('backend/erp.db')
cursor = conn.cursor()
cursor.execute('SELECT * FROM timetable_entries')
cols = [description[0] for description in cursor.description]
rows = cursor.fetchall()

header = """-- ==============================================================================
-- SSGMCE ERP: Supabase PostgreSQL Schema for Timetable Entries
-- Sourced directly from DATA/Personal Timtable for teacher.pdf
-- 15 CSE Faculty Members, Autumn Session 2026-2027
-- Instructions:
-- 1. Open your Supabase Dashboard: https://supabase.com/dashboard/project/gftqvclenyplnuoocbwe
-- 2. Click "SQL Editor" in the left sidebar
-- 3. Paste this entire script into the editor and click "Run"
-- ==============================================================================

-- 1. Create table
CREATE TABLE IF NOT EXISTS public.timetable_entries (
    id TEXT PRIMARY KEY,
    day VARCHAR(20) NOT NULL,
    slot_index INTEGER NOT NULL,
    period_num VARCHAR(20),
    period_time VARCHAR(50),
    course_code VARCHAR(20),
    course_name VARCHAR(150),
    venue VARCHAR(100),
    teacher_name VARCHAR(100),
    teacher_id TEXT,
    emp_code VARCHAR(50),
    class_code VARCHAR(50),
    is_lab BOOLEAN DEFAULT false,
    batch VARCHAR(20),
    subject_abbr VARCHAR(100),
    status VARCHAR(50) DEFAULT 'Scheduled',
    status_class VARCHAR(50) DEFAULT 'status-scheduled',
    att_label VARCHAR(50) DEFAULT 'Attendance: Pending',
    is_completed BOOLEAN DEFAULT false,
    is_active_now BOOLEAN DEFAULT false,
    is_critical BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Performance Indexes
CREATE INDEX IF NOT EXISTS idx_timetable_emp_code ON public.timetable_entries(emp_code);
CREATE INDEX IF NOT EXISTS idx_timetable_teacher_id ON public.timetable_entries(teacher_id);
CREATE INDEX IF NOT EXISTS idx_timetable_class_code ON public.timetable_entries(class_code);
CREATE INDEX IF NOT EXISTS idx_timetable_day_slot ON public.timetable_entries(day, slot_index);

-- 3. Row Level Security Policies (Allow Public Read)
ALTER TABLE public.timetable_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access on timetable_entries" ON public.timetable_entries;
CREATE POLICY "Allow public read access on timetable_entries"
    ON public.timetable_entries FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public insert on timetable_entries" ON public.timetable_entries;
CREATE POLICY "Allow public insert on timetable_entries"
    ON public.timetable_entries FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public update on timetable_entries" ON public.timetable_entries;
CREATE POLICY "Allow public update on timetable_entries"
    ON public.timetable_entries FOR UPDATE USING (true);

-- 4. Insert all 203 official faculty period entries
INSERT INTO public.timetable_entries (
    id, day, slot_index, period_num, period_time, course_code, course_name, venue,
    teacher_name, teacher_id, emp_code, class_code, is_lab, batch, subject_abbr,
    status, status_class, att_label, is_completed, is_active_now, is_critical
) VALUES
"""

def esc(v):
    if v is None:
        return 'NULL'
    if isinstance(v, bool):
        return 'true' if v else 'false'
    if isinstance(v, (int, float)):
        return str(v)
    s = str(v).replace("'", "''")
    return f"'{s}'"

value_lines = []
for r in rows:
    row_dict = dict(zip(cols, r))
    vals = [
        esc(row_dict.get('id')),
        esc(row_dict.get('day')),
        str(row_dict.get('slot_index') or 1),
        esc(row_dict.get('period_num')),
        esc(row_dict.get('period_time')),
        esc(row_dict.get('course_code')),
        esc(row_dict.get('course_name')),
        esc(row_dict.get('venue')),
        esc(row_dict.get('teacher_name')),
        esc(row_dict.get('teacher_id')),
        esc(row_dict.get('emp_code')),
        esc(row_dict.get('class_code')),
        'true' if row_dict.get('is_lab') else 'false',
        esc(row_dict.get('batch')),
        esc(row_dict.get('subject_abbr')),
        esc(row_dict.get('status')),
        esc(row_dict.get('status_class')),
        esc(row_dict.get('att_label')),
        'true' if row_dict.get('is_completed') else 'false',
        'true' if row_dict.get('is_active_now') else 'false',
        'true' if row_dict.get('is_critical') else 'false'
    ]
    value_lines.append(f"    ({', '.join(vals)})")

footer = """
ON CONFLICT (id) DO UPDATE SET
    day = EXCLUDED.day,
    slot_index = EXCLUDED.slot_index,
    period_time = EXCLUDED.period_time,
    course_name = EXCLUDED.course_name,
    venue = EXCLUDED.venue,
    class_code = EXCLUDED.class_code,
    is_lab = EXCLUDED.is_lab,
    batch = EXCLUDED.batch;
"""

full_sql = header + ',\n'.join(value_lines) + footer

with open('backend/supabase_timetable_schema.sql', 'w', encoding='utf-8') as f:
    f.write(full_sql)

print(f"Generated backend/supabase_timetable_schema.sql with {len(rows)} entries!")

