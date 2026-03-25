@echo off
title Stress Monitor - AI Server
color 0A
echo.
echo ==========================================
echo   AUTISM STUDENT STRESS MONITOR
echo   Starting AI Server...
echo ==========================================
echo.

cd /d "%~dp0ai_module"

REM Check Python
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python not found. Please install Python 3.8+
    pause
    exit /b 1
)

REM Check models
if not exist stress_model.h5 (
    echo ERROR: stress_model.h5 not found!
    echo This file should be in the ai_module folder.
    pause
    exit /b 1
)

echo [OK] Trained stress model found
echo [OK] Starting AI server on port 5001...
echo.
echo When you see "Ready on port 5001" - go back to the browser
echo and click "Refresh" on the Live Monitor page.
echo.
echo Press Ctrl+C to stop the AI server.
echo.

python ai_server.py --port 5001

pause
