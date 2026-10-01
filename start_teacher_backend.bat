@echo off
title SSGMCE Teacher Dashboard Backend (Port 5001)
echo ==============================================================================
echo  SSGMCE SHEGAON - TEACHER DASHBOARD BACKEND API (PORT 5001)
echo  Database: Cloud Supabase (PostgreSQL)
echo ==============================================================================
echo.
cd /d "%~dp0Teacher _dashbord\backend"
echo Starting Express server on http://localhost:5001 ...
node src/server.js
pause
