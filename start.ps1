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

Set-Location $Root
& $Python run.py
