import json
from decimal import Decimal
from datetime import datetime, date
from uuid import UUID
from sqlalchemy import text
from backend.config.database import SessionLocal

class CustomJSONEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, (Decimal, UUID)):
            return str(obj)
        if isinstance(obj, (datetime, date)):
            return obj.isoformat()
        return super().default(obj)

def run_query(sql: str, token: str = None) -> str:
    db = SessionLocal()
    try:
        res = db.execute(text(sql))
        if sql.strip().upper().startswith(("SELECT", "WITH", "SHOW")):
            rows = res.fetchall()
            data = [dict(r._mapping) for r in rows]
            return json.dumps(data, cls=CustomJSONEncoder)
        else:
            db.commit()
            return "[]"
    finally:
        db.close()

def get_supabase_token() -> str:
    return "direct_postgres_session"

