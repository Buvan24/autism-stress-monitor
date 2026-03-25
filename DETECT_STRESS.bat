@echo off
color 0C
echo ============================================================
echo   AUTISM STRESS MONITOR - LIVE WEBCAM DETECTION
echo ============================================================
echo.

set /p STUDENT_ID="Enter Student ID (e.g. S101): "

echo.
echo Starting webcam detection for student: %STUDENT_ID%
echo Press Q in the camera window to stop
echo.

cd ai_module
python detect_stress.py --student_id %STUDENT_ID% --server http://localhost:5000
cd ..

pause
