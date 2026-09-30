@echo off
title SSGMCE ERP Dual Backend Launcher
echo ==============================================================================
echo  SSGMCE SHEGAON - COLLEGE ERP DUAL BACKEND LAUNCHER
echo  Database: Cloud Supabase (gftqvclenyplnuoocbwe)
echo ==============================================================================
echo.
echo [1/2] Starting Faculty Attendance Backend on Port 8000...
start "SSGMCE Faculty Attendance API (Port 8000)" cmd /k "cd /d %~dp0faculty\attendance_backend && python run.py"

timeout /t 2 /nobreak >nul

echo [2/2] Starting Student Dashboard Backend on Port 8001...
start "SSGMCE Student Dashboard API (Port 8001)" cmd /k "cd /d %~dp0student\dashboard\backend && python run.py"

echo.
echo ==============================================================================
echo  SUCCESS: Both backends are running in separate persistent windows!
echo   - Faculty Attendance Swagger: http://localhost:8000/docs
echo   - Student Dashboard Swagger:  http://localhost:8001/docs
echo ==============================================================================
echo.
pause
