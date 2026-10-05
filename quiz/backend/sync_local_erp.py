"""
Syncs the PDF extracted students and new schema additions into the active local ERP database:
D:/ERP-SYSTEM/teacher/backend/attendance_api/ssgmce_erp.db
Ensures full functionality of existing ERP without breaking attendance/teacher modules.
"""
import re
import uuid
import sqlite3
from process_roll_lists import parse_pdf1, parse_pdf2, validate_students


def sync_local_erp():
    db_path = r'D:\ERP-SYSTEM\teacher\backend\attendance_api\ssgmce_erp.db'
    conn = sqlite3.connect(db_path)
    cur = conn.cursor()
    
    # 1. Check / Add columns to classes table
    cur.execute("PRAGMA table_info(classes);")
    classes_cols = {row[1] for row in cur.fetchall()}
    if 'class_name' not in classes_cols:
        cur.execute("ALTER TABLE classes ADD COLUMN class_name VARCHAR;")
    cur.execute("UPDATE classes SET class_name = name WHERE class_name IS NULL OR class_name = '';")
    if 'year' not in classes_cols:
        cur.execute("ALTER TABLE classes ADD COLUMN year INTEGER;")
    cur.execute("UPDATE classes SET year = semester WHERE year IS NULL;")


    # 2. Check / Add columns to students table
    cur.execute("PRAGMA table_info(students);")
    students_cols = {row[1] for row in cur.fetchall()}
    if 'sis_id' not in students_cols:
        cur.execute("ALTER TABLE students ADD COLUMN sis_id VARCHAR;")
        cur.execute("UPDATE students SET sis_id = student_code WHERE sis_id IS NULL;")
    if 'department_id' not in students_cols:
        cur.execute("ALTER TABLE students ADD COLUMN department_id VARCHAR(36);")
    if 'year' not in students_cols:
        cur.execute("ALTER TABLE students ADD COLUMN year INTEGER;")
    if 'division' not in students_cols:
        cur.execute("ALTER TABLE students ADD COLUMN division VARCHAR;")
    if 'status' not in students_cols:
        cur.execute("ALTER TABLE students ADD COLUMN status VARCHAR DEFAULT 'ACTIVE';")
    if 'email' not in students_cols:
        cur.execute("ALTER TABLE students ADD COLUMN email VARCHAR;")

    # 3. Create student_import_batches & student_import_errors & quizzes tables
    cur.execute("""
    CREATE TABLE IF NOT EXISTS student_import_batches (
        id VARCHAR(36) PRIMARY KEY,
        file_name VARCHAR NOT NULL,
        class_id VARCHAR(36),
        total_records INTEGER NOT NULL DEFAULT 0,
        successful_records INTEGER NOT NULL DEFAULT 0,
        duplicate_records INTEGER NOT NULL DEFAULT 0,
        failed_records INTEGER NOT NULL DEFAULT 0,
        imported_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        status VARCHAR NOT NULL
    );
    """)

    cur.execute("""
    CREATE TABLE IF NOT EXISTS student_import_errors (
        id VARCHAR(36) PRIMARY KEY,
        batch_id VARCHAR(36) NOT NULL,
        row_reference VARCHAR,
        raw_value TEXT,
        error_type VARCHAR NOT NULL,
        error_message TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)

    cur.execute("""
    CREATE TABLE IF NOT EXISTS quizzes (
        id VARCHAR(36) PRIMARY KEY,
        teacher_id VARCHAR(36),
        class_id VARCHAR(36) NOT NULL,
        title VARCHAR NOT NULL,
        description TEXT,
        subject_id VARCHAR(36),
        duration_minutes INTEGER NOT NULL DEFAULT 30,
        total_marks REAL NOT NULL DEFAULT 100,
        marks_per_question REAL NOT NULL DEFAULT 1,
        negative_marks REAL NOT NULL DEFAULT 0,
        start_time TIMESTAMP,
        end_time TIMESTAMP,
        max_attempts INTEGER NOT NULL DEFAULT 1,
        status VARCHAR NOT NULL DEFAULT 'DRAFT',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)

    # 4. Get CSE Department ID
    cur.execute("SELECT id FROM departments WHERE code = 'CSE';")
    cse_row = cur.fetchone()
    cse_id = cse_row[0] if cse_row else '0f268768-4431-4405-a96e-6cd73041cadf'

    # 5. Ensure Class 1R1 exists
    cur.execute("SELECT id FROM classes WHERE name = '1R1' OR class_name = '1R1';")
    row_1r1 = cur.fetchone()
    if not row_1r1:
        id_1r1 = '11111111-1111-1111-1111-111111111111'
        cur.execute("""
            INSERT INTO classes (id, department_id, name, class_name, academic_year, semester, year, division, room, total_students)
            VALUES (?, ?, '1R1', '1R1', '2025-26', 1, 1, 'A', 'LH-101', 69);
        """, (id_1r1, cse_id))
    else:
        id_1r1 = row_1r1[0]

    # Get Class 3R ID
    cur.execute("SELECT id FROM classes WHERE name = '3R' OR class_name = '3R';")
    row_3r = cur.fetchone()
    id_3r = row_3r[0] if row_3r else 'ac46eda9-4dd3-4432-ac69-d4b91b61aa4d'

    # 6. Parse and Insert PDF 1 students (1R1_Roll_List.pdf)
    meta1, s1 = parse_pdf1('d:/QUIZ/1R1_Roll_List.pdf')
    v1, e1 = validate_students(s1, '1R1')

    # Record batch
    batch1_id = str(uuid.uuid4())
    cur.execute("""
        INSERT INTO student_import_batches (id, file_name, class_id, total_records, successful_records, duplicate_records, failed_records, status)
        VALUES (?, ?, ?, ?, ?, 0, 0, 'COMPLETED');
    """, (batch1_id, meta1['file_name'], id_1r1, len(v1), len(v1)))

    inserted_p1 = 0
    updated_p1 = 0
    for s in v1:
        sis = s['sis_id']
        roll_val = int(re.sub(r'\D', '', s['roll_no'])) if re.sub(r'\D', '', s['roll_no']) else int(s['sr_no'])
        cur.execute("SELECT id FROM students WHERE student_code = ? OR sis_id = ?;", (sis, sis))
        existing = cur.fetchone()
        if existing:
            cur.execute("""
                UPDATE students SET roll_no = ?, student_code = ?, full_name = ?, class_id = ?, department_id = ?, sis_id = ?, year = 1, division = 'A'
                WHERE id = ?;
            """, (roll_val, sis, s['full_name'], id_1r1, cse_id, sis, existing[0]))
            updated_p1 += 1
        else:
            s_uid = str(uuid.uuid4())
            cur.execute("""
                INSERT INTO students (id, class_id, roll_no, student_code, full_name, is_provisional, sis_id, department_id, year, division, status)
                VALUES (?, ?, ?, ?, ?, 0, ?, ?, 1, 'A', 'ACTIVE');
            """, (s_uid, id_1r1, roll_val, sis, s['full_name'], sis, cse_id))
            inserted_p1 += 1

    # 7. Parse and Update/Insert PDF 2 students (3R_ Student_Roll_List.pdf)
    meta2, s2 = parse_pdf2('d:/QUIZ/3R_ Student_Roll_List.pdf')
    v2, e2 = validate_students(s2, '3R')

    batch2_id = str(uuid.uuid4())
    cur.execute("""
        INSERT INTO student_import_batches (id, file_name, class_id, total_records, successful_records, duplicate_records, failed_records, status)
        VALUES (?, ?, ?, ?, ?, 0, 0, 'COMPLETED');
    """, (batch2_id, meta2['file_name'], id_3r, len(v2), len(v2)))

    inserted_p2 = 0
    updated_p2 = 0
    for s in v2:
        sis = s['sis_id']
        roll_val = int(s['roll_no'])
        cur.execute("SELECT id FROM students WHERE student_code = ? OR sis_id = ?;", (sis, sis))
        existing = cur.fetchone()
        if existing:
            cur.execute("""
                UPDATE students SET roll_no = ?, student_code = ?, full_name = ?, class_id = ?, department_id = ?, sis_id = ?, year = 3, division = '1'
                WHERE id = ?;
            """, (roll_val, sis, s['full_name'], id_3r, cse_id, sis, existing[0]))
            updated_p2 += 1
        else:
            s_uid = str(uuid.uuid4())
            cur.execute("""
                INSERT INTO students (id, class_id, roll_no, student_code, full_name, is_provisional, sis_id, department_id, year, division, status)
                VALUES (?, ?, ?, ?, ?, 0, ?, ?, 3, '1', 'ACTIVE');
            """, (s_uid, id_3r, roll_val, sis, s['full_name'], sis, cse_id))
            inserted_p2 += 1

    conn.commit()
    print(f"Local ERP database sync complete:")
    print(f"  PDF 1 (1R1): {inserted_p1} inserted, {updated_p1} updated")
    print(f"  PDF 2 (3R):  {inserted_p2} inserted, {updated_p2} updated")
    
    # Verification query 1
    cur.execute("SELECT COUNT(*) FROM students;")
    print("Verification: SELECT COUNT(*) FROM students:", cur.fetchone()[0])

    # Verification query 2
    cur.execute("""
        SELECT c.class_name, COUNT(s.id) AS student_count
        FROM students s
        JOIN classes c ON s.class_id = c.id
        GROUP BY c.class_name
        ORDER BY c.class_name;
    """)
    print("Verification: Students grouped by class:")
    for r in cur.fetchall():
        print(f"  Class: {r[0]} -> {r[1]} students")

    # Verification query 3
    cur.execute("""
        SELECT sis_id, COUNT(*)
        FROM students
        GROUP BY sis_id
        HAVING COUNT(*) > 1;
    """)
    dups = cur.fetchall()
    print("Verification: Duplicate SIS IDs count:", len(dups))

    conn.close()

if __name__ == '__main__':
    sync_local_erp()
