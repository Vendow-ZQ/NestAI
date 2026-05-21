# NestAI one-click launcher for Windows PowerShell.
$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host "========================================" -ForegroundColor Yellow
Write-Host "NestAI Launcher" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Yellow
Write-Host ""

$Python = (Get-Command python -ErrorAction SilentlyContinue).Source
if (-not $Python) {
  $Python = (Get-Command py -ErrorAction SilentlyContinue).Source
}
if (-not $Python) {
  throw "Python was not found in PATH."
}

$Pnpm = (Get-Command pnpm -ErrorAction SilentlyContinue).Source
if (-not $Pnpm) {
  $Pnpm = (Get-Command pnpm.cmd -ErrorAction SilentlyContinue).Source
}
if (-not $Pnpm) {
  throw "pnpm was not found in PATH. Install pnpm first."
}

Write-Host "[1] Starting Backend..." -ForegroundColor Green
Start-Process powershell -ArgumentList @(
  "-NoExit",
  "-Command",
  "cd '$Root\python-server'; `$env:PYTHONPATH='$Root\python-server'; & '$Python' -m uvicorn app.main:app --reload --port 8000 --host 0.0.0.0"
) -WindowStyle Normal

Write-Host "[2] Waiting 5 seconds..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

Write-Host "[3] Starting Frontend..." -ForegroundColor Blue
Start-Process powershell -ArgumentList @(
  "-NoExit",
  "-Command",
  "cd '$Root\web'; & '$Pnpm' dev"
) -WindowStyle Normal

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "All services started!" -ForegroundColor Green
Write-Host "Frontend: http://localhost:5000" -ForegroundColor Cyan
Write-Host "Backend:  http://localhost:8000" -ForegroundColor Cyan
Write-Host "API Docs: http://localhost:8000/docs" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Close the Backend/Frontend windows or press Ctrl+C in them to stop services."
