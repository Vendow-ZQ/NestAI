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

where pnpm >nul 2>nul
if errorlevel 1 (
  where pnpm.cmd >nul 2>nul
  if errorlevel 1 (
    if exist "%APPDATA%\npm\pnpm.cmd" (
      set PNPM=%APPDATA%\npm\pnpm.cmd
    ) else (
      echo [ERROR] pnpm was not found in PATH.
      pause
      exit /b 1
    )
  ) else (
    set PNPM=pnpm.cmd
  )
) else (
  set PNPM=pnpm
)

echo [1] Starting Backend...
start "NestAI Backend" /D "%ROOT%\python-server" cmd /k "set PYTHONPATH=%ROOT%\python-server&& python -m uvicorn app.main:app --reload --port 8000 --host 0.0.0.0"

echo [2] Waiting...
timeout /t 5 /nobreak >nul

echo [3] Starting Frontend...
start "NestAI Frontend" /D "%ROOT%\web" cmd /k ""%PNPM%" dev"

echo.
echo ========================================
echo Done!
echo Frontend: http://localhost:5000
echo Backend:  http://localhost:8000
echo API Docs: http://localhost:8000/docs
echo ========================================
pause
