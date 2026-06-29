@echo off
title SYNTHETICA Launcher
echo ========================================
echo   🚀 SYNTHETICA — AI World Generator
echo ========================================
echo.
echo 📍 Backend:  http://localhost:8000
echo 📍 Frontend: http://localhost:3000
echo.
echo Starting backend server...
start cmd /k "cd backend && py server.py"
timeout /t 3 /nobreak >nul
echo Starting frontend server...
start cmd /k "py -m http.server 3000"
echo.
echo ========================================
echo   ✅ SYNTHETICA IS RUNNING!
echo ========================================
echo.
echo 🌐 Open: http://localhost:3000
echo.
pause