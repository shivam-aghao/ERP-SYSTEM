@echo off
title SSGMCE Unified College ERP Backend
echo ==============================================================================
echo  SHRI SANT GAJANAN MAHARAJ COLLEGE OF ENGINEERING, SHEGAON
echo  SSGMCE UNIFIED COLLEGE ERP BACKEND (FASTAPI + SUPABASE POSTGRESQL)
echo ==============================================================================
echo.
echo  Port:     8000
echo  Swagger:  http://localhost:8000/docs
echo  Health:   http://localhost:8000/health
echo  Database: Cloud Supabase PostgreSQL (aws-0-ap-southeast-1.pooler.supabase.com)
echo.
echo Starting Unified Uvicorn Server...
cd /d "%~dp0"
python run.py
pause
