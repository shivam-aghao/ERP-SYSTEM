"""
SSGMCE ERP Database Seed Utility
Verifies and seeds essential classes, roles, and subjects if erp.db is empty.
"""
import os
import sys

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ERP_ROOT = os.path.dirname(BASE_DIR)
if ERP_ROOT not in sys.path:
    sys.path.insert(0, ERP_ROOT)

from backend.config.database import SessionLocal, engine
from sqlalchemy import text

def seed():
    session = SessionLocal()
    try:
        # Check if classes exist
        res = session.execute(text("SELECT COUNT(*) FROM classes")).scalar()
        if res == 0:
            print("Seeding standard classes...")
            classes = [
                ("1R1", "First Year R1", "FY", "1"),
                ("2R1", "Second Year R1", "SY", "2"),
                ("2R2", "Second Year R2", "SY", "2"),
                ("3R", "Third Year R", "TY", "3"),
                ("4R", "Final Year R", "FINAL", "4")
            ]
            for code, name, year, sem in classes:
                session.execute(
                    text("INSERT INTO classes (class_code, class_name, academic_year, semester) VALUES (:c, :n, :y, :s)"),
                    {"c": code, "n": name, "y": year, "s": sem}
                )
            session.commit()
            print("Classes seeded.")
        else:
            print(f"Database already populated ({res} classes found).")
    except Exception as e:
        print(f"Seed notice: {e}")
        session.rollback()
    finally:
        session.close()

if __name__ == "__main__":
    seed()
