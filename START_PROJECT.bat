@echo off
title Stress Monitor - Full Project Launcher
color 0B
echo.
echo ==========================================
echo   AUTISM STUDENT STRESS MONITOR
echo   Full Project Startup
echo ==========================================
echo.
echo STEP 1: Starting Node.js backend server...
cd /d "%~dp0server"
start "Backend Server" cmd /k "npm install && node server.js"

timeout /t 3 /nobreak >nul

echo STEP 2: Starting React frontend...
cd /d "%~dp0client"
start "Frontend" cmd /k "npm install && npm start"

timeout /t 3 /nobreak >nul

echo STEP 3: Starting AI Server...
cd /d "%~dp0ai_module"
start "AI Server" cmd /k "pip install flask flask-cors tensorflow opencv-python numpy requests && python ai_server.py"

echo.
echo ==========================================
echo   All 3 servers are starting!
echo.
echo   Backend  : http://localhost:5000
echo   Frontend : http://localhost:3000
echo   AI Server: http://localhost:5001
echo.
echo   Open http://localhost:3000 in your browser
echo ==========================================
echo.
pause
