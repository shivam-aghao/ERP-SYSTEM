from supabase import create_client, Client
from config import settings
import logging

logger = logging.getLogger("uvicorn")

supabase: Client = None

def get_supabase_client() -> Client:
    global supabase
    if supabase is None:
        try:
            supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)
            logger.info("Connected to Supabase PostgreSQL database successfully.")
        except Exception as e:
            logger.error(f"Failed to connect to Supabase: {e}")
            raise e
    return supabase

db = get_supabase_client()
