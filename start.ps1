# NestAI Launcher
Write-Host "========================================" -ForegroundColor Yellow
Write-Host "NestAI Launcher" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Yellow
Write-Host ""

# Start Backend in new window
Write-Host "[1] Starting Backend..." -ForegroundColor Green
Start-Process cmd -ArgumentList "/k cd /d D:/Code/NestAI/python-server && E:/Software/Anaconda/python.exe -m uvicorn app.main:app --reload --port 8000 --host 0.0.0.0"

# Wait
Write-Host "[2] Waiting 5 seconds..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Start Frontend in new window
Write-Host "[3] Starting Frontend..." -ForegroundColor Blue
Start-Process cmd -ArgumentList "/k cd /d D:/Code/NestAI/web && pnpm dev"

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "All services started!" -ForegroundColor Green
Write-Host "Frontend: http://localhost:5000" -ForegroundColor Cyan
Write-Host "Backend:  http://localhost:8000" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Close this window will NOT stop services."
Write-Host "Press Ctrl+C in each service window to stop."
