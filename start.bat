@echo off
REM ============================================================
REM Synthetica - local startup script (Windows)
REM Boots the FastAPI backend and a static file server for the
REM frontend, with one command.
REM
REM Usage:
REM   Double-click start.bat
REM   OR run it from cmd:  start.bat
REM
REM Then open:
REM   Frontend  -> http://localhost:3000
REM   Dashboard -> http://localhost:3000/dashboard.html
REM   Backend   -> http://localhost:8000/api/health
REM
REM Close the two new terminal windows to stop everything.
REM ============================================================

setlocal
set ROOT_DIR=%~dp0
set BACKEND_DIR=%ROOT_DIR%backend
set VENV_DIR=%BACKEND_DIR%\.venv

echo Starting Synthetica...
echo.

REM ---- 1. Check Python is available ----
where python >nul 2>nul
if errorlevel 1 (
    echo ERROR: Python was not found on PATH.
    echo Install it from https://www.python.org/downloads/ and check
    echo "Add python.exe to PATH" during install, then re-run this script.
    pause
    exit /b 1
)

REM ---- 2. Set up virtual environment (first run only) ----
if not exist "%VENV_DIR%" (
    echo Creating Python virtual environment...
    python -m venv "%VENV_DIR%"
)

call "%VENV_DIR%\Scripts\activate.bat"

echo Installing backend dependencies...
pip install -q --upgrade pip
pip install -q -r "%BACKEND_DIR%\requirements.txt"

REM ---- 3. Start backend (FastAPI on :8000) in a new window ----
echo Starting backend on http://localhost:8000 ...
start "Synthetica Backend" cmd /k "cd /d "%BACKEND_DIR%" && call "%VENV_DIR%\Scripts\activate.bat" && uvicorn server:app --reload --port 8000"

REM Give the backend a moment to boot
timeout /t 3 /nobreak >nul

REM ---- 4. Start frontend (static file server on :3000) in a new window ----
echo Starting frontend on http://localhost:3000 ...
start "Synthetica Frontend" cmd /k "cd /d "%ROOT_DIR%" && python -m http.server 3000"

timeout /t 2 /nobreak >nul

echo.
echo ============================================================
echo  Synthetica is running in two new windows
echo    Landing page : http://localhost:3000/index.html
echo    Dashboard    : http://localhost:3000/dashboard.html
echo    Backend API  : http://localhost:8000/api/health
echo    WebSocket    : ws://localhost:8000/ws
echo.
echo  Close the "Synthetica Backend" and "Synthetica Frontend"
echo  windows to stop everything.
echo ============================================================
echo.

REM Open the app in your default browser
start http://localhost:3000/index.html

pause
