@echo off
title SSGMCE Student ERP - FastAPI & Supabase Backend
cd /d "%~dp0student\dashboard\backend"
echo ========================================================
echo   SSGMCE Student ERP - FastAPI & Supabase Backend
echo   Port: 8001 ^| Health: http://localhost:8001/health
echo   Docs: http://localhost:8001/docs
echo ========================================================
python -m uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload
pause
