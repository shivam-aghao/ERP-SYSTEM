import sys
import uuid
import random
from datetime import date, timedelta
from sqlalchemy import text
from backend.config.database import engine, get_supabase_client

def run_supabase_connection():
    print("================================================================================")
    print(" CONNECTING BACKEND & SUPABASE COMPLETELY")
    print("================================================================================")
    
    with engine.begin() as conn:
        print("\n[1] Updating 'subjects' table schema and syncing data...")
        conn.execute(text("""
            ALTER TABLE subjects ADD COLUMN IF NOT EXISTS subject_name VARCHAR(255);
            ALTER TABLE subjects ADD COLUMN IF NOT EXISTS subject_code VARCHAR(100);
            ALTER TABLE subjects ADD COLUMN IF NOT EXISTS teacher_id UUID;
        """))
        conn.execute(text("""
            UPDATE subjects SET subject_name = name WHERE subject_name IS NULL AND name IS NOT NULL;
            UPDATE subjects SET subject_code = code WHERE subject_code IS NULL AND code IS NOT NULL;
            UPDATE subjects SET name = subject_name WHERE name IS NULL AND subject_name IS NOT NULL;
            UPDATE subjects SET code = subject_code WHERE code IS NULL AND subject_code IS NOT NULL;
        """))
        
        # Link teachers to subjects
        teacher_rows = conn.execute(text("SELECT id, full_name, email FROM users WHERE role = 'teacher'")).fetchall()
        print(f"    Found {len(teacher_rows)} teachers in 'users' table.")
        
        if teacher_rows:
            teacher_ids = [r[0] for r in teacher_rows]
            sub_rows = conn.execute(text("SELECT id, name FROM subjects")).fetchall()
            print(f"    Assigning teachers to {len(sub_rows)} subjects...")
            for idx, sub in enumerate(sub_rows):
                assigned_tid = teacher_ids[idx % len(teacher_ids)]
                conn.execute(text("""
                    UPDATE subjects 
                    SET teacher_id = :tid 
                    WHERE id = :sid AND (teacher_id IS NULL OR teacher_id NOT IN (SELECT id FROM users))
                """), {"tid": assigned_tid, "sid": sub[0]})
        
        print("\n[2] Checking 'attendance' table schema and records...")
        conn.execute(text("""
            ALTER TABLE attendance ADD COLUMN IF NOT EXISTS period_type VARCHAR(50) DEFAULT 'REGULAR';
            ALTER TABLE attendance ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'PRESENT';
        """))
        
        att_count = conn.execute(text("SELECT count(*) FROM attendance")).scalar()
        print(f"    Current attendance records: {att_count}")
        
        if att_count == 0:
            print("    Seeding initial attendance records for students...")
            student_rows = conn.execute(text("SELECT id, full_name FROM users WHERE role = 'student' LIMIT 20")).fetchall()
            subject_rows = conn.execute(text("SELECT id FROM subjects LIMIT 5")).fetchall()
            
            today = date.today()
            sample_attendance = []
            for student in student_rows:
                s_id = student[0]
                for sub in subject_rows:
                    sub_id = sub[0]
                    # Create 5 days of attendance for each student-subject pair
                    for d_offset in range(5):
                        rec_date = today - timedelta(days=d_offset)
                        status = "PRESENT" if random.random() > 0.2 else "ABSENT"
                        sample_attendance.append({
                            "id": str(uuid.uuid4()),
                            "student_id": s_id,
                            "subject_id": sub_id,
                            "date": rec_date,
                            "status": status,
                            "period_type": "REGULAR"
                        })
            
            for a in sample_attendance:
                conn.execute(text("""
                    INSERT INTO attendance (id, student_id, subject_id, date, status, period_type)
                    VALUES (:id, :student_id, :subject_id, :date, :status, :period_type)
                """), a)
            print(f"    Inserted {len(sample_attendance)} initial attendance rows.")

        print("\n[3] Checking 'teacher_certifications' table schema...")
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS teacher_certifications (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                teacher_id UUID NOT NULL,
                title VARCHAR(255) NOT NULL,
                type VARCHAR(100) NOT NULL,
                issuing_organization VARCHAR(255) NOT NULL,
                year INTEGER NOT NULL,
                credential_url TEXT,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                updated_at TIMESTAMPTZ DEFAULT NOW()
            );
        """))
        
        cert_count = conn.execute(text("SELECT count(*) FROM teacher_certifications")).scalar()
        print(f"    Current teacher certifications: {cert_count}")
        if cert_count == 0 and teacher_rows:
            print("    Seeding initial teacher certifications...")
            sample_certs = [
                ("Ph.D in Computer Science & Engineering", "Degree", "SGBAU Amravati", 2021, "https://example.com/phd"),
                ("AWS Certified Solutions Architect", "Course", "Amazon Web Services", 2023, "https://aws.amazon.com/verify/1002"),
                ("Deep Learning Applications in Healthcare", "Research Paper", "IEEE Transactions", 2024, "https://doi.org/10.1109/sample"),
                ("Modern Cloud Architecture & Microservices", "Workshop", "IIT Bombay", 2023, "https://iitb.ac.in/workshop/cert")
            ]
            for t in teacher_rows:
                t_id = t[0]
                for title, ctype, org, year, url in sample_certs:
                    conn.execute(text("""
                        INSERT INTO teacher_certifications (id, teacher_id, title, type, issuing_organization, year, credential_url)
                        VALUES (:id, :tid, :title, :type, :org, :year, :url)
                    """), {
                        "id": str(uuid.uuid4()),
                        "tid": t_id,
                        "title": title,
                        "type": ctype,
                        "org": org,
                        "year": year,
                        "url": url
                    })
            print(f"    Seeded initial certifications for {len(teacher_rows)} teachers.")

        print("\n[4] Granting Supabase PostgREST permissions for public access...")
        tables = [
            "users", "subjects", "attendance", "teacher_certifications",
            "students", "teachers", "departments", "classes", "timetable_entries",
            "student_updation_records", "marks_submissions", "marks_revaluation_requests"
        ]
        for tbl in tables:
            try:
                conn.execute(text(f"""
                    GRANT ALL ON TABLE {tbl} TO anon, authenticated, service_role, postgres;
                """))
            except Exception as e:
                print(f"    Notice granting on {tbl}: {e}")
        
        # Reload PostgREST schema cache
        try:
            conn.execute(text("NOTIFY pgrst, 'reload schema'"))
            print("    Notified PostgREST to reload schema cache.")
        except Exception as e:
            print(f"    Notice on reload schema: {e}")

    print("\n[5] Testing Supabase Client Queries via PostgREST...")
    sb = get_supabase_client()
    if not sb:
        print("    [!] ERROR: Supabase Client could not be initialized!")
        sys.exit(1)
        
    u_res = sb.table("users").select("id, full_name, role").limit(3).execute()
    print(f"    [OK] Users query returned {len(u_res.data)} rows: {[r['full_name'] for r in u_res.data]}")

    s_res = sb.table("subjects").select("id, subject_name, subject_code, teacher_id").limit(3).execute()
    print(f"    [OK] Subjects query returned {len(s_res.data)} rows: {[r['subject_name'] for r in s_res.data]}")

    a_res = sb.table("attendance").select("id, student_id, subject_id, date, status, period_type").limit(3).execute()
    print(f"    [OK] Attendance query returned {len(a_res.data)} rows: {[r['status'] for r in a_res.data]}")

    c_res = sb.table("teacher_certifications").select("id, teacher_id, title, type").limit(3).execute()
    print(f"    [OK] Teacher Certifications query returned {len(c_res.data)} rows: {[r['title'] for r in c_res.data]}")

    print("\n================================================================================")
    print(" SUPABASE & BACKEND ARE FULLY & PROPERLY CONNECTED!")
    print("================================================================================")

if __name__ == "__main__":
    run_supabase_connection()

