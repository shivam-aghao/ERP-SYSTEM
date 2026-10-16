"""
================================================================================
SSGMCE COLLEGE ERP - BACKEND PACKAGE EXECUTABLE ENTRYPOINT
Enables running:
    python -m backend
or
    python backend
================================================================================
"""

import os
import sys

# Ensure project root is in sys.path
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(CURRENT_DIR)
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from backend.main import app
import backend.main as backend_module

if __name__ == "__main__":
    import uvicorn
    host = os.environ.get("HOST", "0.0.0.0")
    port = int(os.environ.get("PORT", "8000"))
    reload_flag = os.environ.get("RELOAD", "false").lower() in ("true", "1")
    uvicorn.run("backend.main:app", host=host, port=port, reload=reload_flag)

