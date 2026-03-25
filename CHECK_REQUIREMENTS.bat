@echo off
color 0A
echo ============================================================
echo   AUTISM STRESS MONITOR - REQUIREMENTS CHECKER
echo   Windows 10 - Auto Setup Checker
echo ============================================================
echo.

set ERRORS=0

:: Check Node.js
echo [1/5] Checking Node.js...
node -v >nul 2>&1
if %errorlevel% == 0 (
    for /f "tokens=*" %%i in ('node -v') do echo       ✅ Node.js found: %%i
) else (
    echo       ❌ Node.js NOT found!
    echo          Download from: https://nodejs.org
    set ERRORS=1
)

:: Check npm
echo [2/5] Checking npm...
npm -v >nul 2>&1
if %errorlevel% == 0 (
    for /f "tokens=*" %%i in ('npm -v') do echo       ✅ npm found: %%i
) else (
    echo       ❌ npm NOT found! (Install Node.js first)
    set ERRORS=1
)

:: Check Python
echo [3/5] Checking Python...
python --version >nul 2>&1
if %errorlevel% == 0 (
    for /f "tokens=*" %%i in ('python --version') do echo       ✅ Python found: %%i
) else (
    echo       ❌ Python NOT found!
    echo          Download from: https://python.org
    set ERRORS=1
)

:: Check pip
echo [4/5] Checking pip...
pip --version >nul 2>&1
if %errorlevel% == 0 (
    echo       ✅ pip found
) else (
    echo       ❌ pip NOT found!
    set ERRORS=1
)

:: Check internet/MongoDB Atlas connection
echo [5/5] Checking Internet Connection...
ping -n 1 google.com >nul 2>&1
if %errorlevel% == 0 (
    echo       ✅ Internet connected - MongoDB Atlas will work!
) else (
    echo       ❌ No internet - MongoDB Atlas needs internet!
    set ERRORS=1
)

echo.
echo ============================================================
if %ERRORS% == 0 (
    echo   ✅ ALL CHECKS PASSED! Ready to run the project!
    echo   Run START_PROJECT.bat next
) else (
    echo   ❌ Some requirements missing. Fix above errors first.
)
echo ============================================================
echo.
pause
