@echo off
title SSGMCE Faculty Attendance ERP - FastAPI Backend
echo ========================================================
echo Starting SSGMCE Faculty Attendance FastAPI Backend...
echo ========================================================
if exist venv\Scripts\python.exe (
    venv\Scripts\python.exe run.py
) else (
    python run.py
)
pause
