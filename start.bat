@echo off
setlocal
set ROOT=%~dp0
set ROOT=%ROOT:~0,-1%

echo ========================================
echo NestAI Launcher
echo ========================================
echo.

where python >nul 2>nul
if errorlevel 1 (
  echo [ERROR] Python was not found in PATH.
  pause
  exit /b 1
)

cd /d "%ROOT%"
python run.py
pause
