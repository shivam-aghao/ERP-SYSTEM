import os
import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from backend.config.database import SessionLocal
from sqlalchemy import text
from backend.services.fee_service import FeeService

db = SessionLocal()
try:
    for code in ['308637', '312225E015', '308979', '307001']:
        res = FeeService.resolve_student(code, db)
        print(f"Code: {code} -> {res['full_name']}, Class: {res['class_name']}")
finally:
    db.close()

