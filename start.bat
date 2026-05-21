@echo off
echo ========================================
echo NestAI Launcher
echo ========================================
echo.

REM Backend with full paths
set PYTHON=E:\Software\Anaconda\python.exe
set BACKEND_CMD=cd /d D:/Code/NestAI/python-server && set PYTHONPATH=D:/Code/NestAI/python-server && %PYTHON% -m uvicorn app.main:app --reload --port 8000 --host 0.0.0.0

echo [1] Starting Backend...
start "NestAI Backend" cmd /k "%BACKEND_CMD%"

echo [2] Waiting...
timeout /t 5 /nobreak >nul

echo [3] Starting Frontend...
set FRONTEND_CMD=cd /d D:/Code/NestAI/web && D:/Code/NestAI/web/node_modules/.bin/pnpm.cmd dev
start "NestAI Frontend" cmd /k "%FRONTEND_CMD%"

echo.
echo ========================================
echo Done!
echo Frontend: http://localhost:5000
echo Backend:  http://localhost:8000
echo ========================================
pause
