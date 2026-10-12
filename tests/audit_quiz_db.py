import os
import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from sqlalchemy import text
from backend.config.database import engine

def audit_database():
    print("=== LIVE SUPABASE POSTGRESQL QUIZ AUDIT ===")
    with engine.connect() as conn:
        # 1. RLS Policies
        print("\n--- RLS POLICIES ---")
        policies = conn.execute(text("""
            SELECT tablename, policyname, roles, cmd, qual, with_check
            FROM pg_policies
            WHERE tablename IN (
                'quizzes', 'quiz_questions', 'question_options', 'quiz_attempts',
                'student_answers', 'quiz_attempt_answers', 'quiz_results',
                'question_bank', 'quiz_security_events', 'result_publication_logs', 'result_change_logs'
            )
            ORDER BY tablename, policyname;
        """)).fetchall()
        for p in policies:
            print(f"[{p.tablename}] {p.policyname} ({p.cmd}) roles={p.roles} qual={p.qual}")

        # 2. RLS Enabled Status
        print("\n--- RLS ENABLED STATUS ---")
        rls_status = conn.execute(text("""
            SELECT relname, relrowsecurity, relforcerowsecurity
            FROM pg_class
            WHERE relname IN (
                'quizzes', 'quiz_questions', 'question_options', 'quiz_attempts',
                'student_answers', 'quiz_attempt_answers', 'quiz_results',
                'question_bank', 'quiz_security_events'
            );
        """)).fetchall()
        for r in rls_status:
            print(f"Table: {r.relname} | RLS Enabled: {r.relrowsecurity} | Force RLS: {r.relforcerowsecurity}")

        # 3. Tables & Record Counts
        print("\n--- TABLE RECORD COUNTS ---")
        tables = [
            'quizzes', 'quiz_questions', 'question_bank', 'question_options',
            'quiz_attempts', 'student_answers', 'quiz_attempt_answers',
            'quiz_results', 'quiz_security_events', 'result_publication_logs', 'result_change_logs'
        ]
        for t in tables:
            try:
                cnt = conn.execute(text(f"SELECT count(*) FROM {t}")).scalar()
                print(f"  {t}: {cnt} rows")
            except Exception as e:
                print(f"  {t}: Error - {e}")

if __name__ == "__main__":
    audit_database()
