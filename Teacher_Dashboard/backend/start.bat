@echo off
title SSGMCE Teacher Dashboard Backend (Port 5001)
echo ==============================================================================
echo  SSGMCE SHEGAON - TEACHER DASHBOARD BACKEND API (PORT 5001)
echo ==============================================================================
echo.
cd /d "%~dp0"
echo Starting Express server on http://localhost:5001 ...
node server.js
pause

