#!/usr/bin/env pwsh
<#
.SYNOPSIS
    StockMaster - Start Script
.DESCRIPTION
    Starts both backend and frontend servers with a single command
.NOTES
    Prerequisites:
    - PostgreSQL running on port 5432
    - Redis/Memurai running on port 6379
    - Node.js 20+ installed
#>

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   StockMaster - Starting Application   " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if PostgreSQL is running
Write-Host "[1/4] Checking PostgreSQL..." -ForegroundColor Yellow
$pgRunning = Get-Process postgres -ErrorAction SilentlyContinue
if ($pgRunning) {
    Write-Host "✓ PostgreSQL is running" -ForegroundColor Green
} else {
    Write-Host "✗ PostgreSQL is not running!" -ForegroundColor Red
    Write-Host "  Please start PostgreSQL before running this script" -ForegroundColor Red
    exit 1
}

# Check if Redis/Memurai is running
Write-Host "[2/4] Checking Redis/Memurai..." -ForegroundColor Yellow
$redisRunning = Get-Service Memurai -ErrorAction SilentlyContinue | Where-Object {$_.Status -eq "Running"}
if (-not $redisRunning) {
    $redisRunning = Get-Process redis-server -ErrorAction SilentlyContinue
}
if ($redisRunning) {
    Write-Host "✓ Redis/Memurai is running" -ForegroundColor Green
} else {
    Write-Host "✗ Redis/Memurai is not running!" -ForegroundColor Red
    Write-Host "  Please start Redis/Memurai before running this script" -ForegroundColor Red
    exit 1
}

# Check if backend dependencies are installed
Write-Host "[3/4] Checking backend dependencies..." -ForegroundColor Yellow
if (-not (Test-Path "backend/node_modules")) {
    Write-Host "  Installing backend dependencies..." -ForegroundColor Yellow
    Push-Location backend
    npm install
    Pop-Location
    Write-Host "✓ Backend dependencies installed" -ForegroundColor Green
} else {
    Write-Host "✓ Backend dependencies ready" -ForegroundColor Green
}

# Check if frontend dependencies are installed
Write-Host "[4/4] Checking frontend dependencies..." -ForegroundColor Yellow
if (-not (Test-Path "front-end/node_modules")) {
    Write-Host "  Installing frontend dependencies..." -ForegroundColor Yellow
    Push-Location front-end
    npm install
    Pop-Location
    Write-Host "✓ Frontend dependencies installed" -ForegroundColor Green
} else {
    Write-Host "✓ Frontend dependencies ready" -ForegroundColor Green
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   Starting Backend & Frontend Servers  " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Start backend in new window
Write-Host "Starting Backend Server..." -ForegroundColor Yellow
Write-Host "  → http://localhost:4000/api" -ForegroundColor Gray
Write-Host "  → ws://localhost:4000/ws" -ForegroundColor Gray
Start-Process pwsh -ArgumentList "-NoExit", "-Command", "cd '$PWD/backend'; Write-Host 'Backend Server' -ForegroundColor Green; npm run dev"

# Wait a bit for backend to start
Start-Sleep -Seconds 3

# Start frontend in new window
Write-Host "Starting Frontend Server..." -ForegroundColor Yellow
Write-Host "  → http://localhost:8080" -ForegroundColor Gray
Start-Process pwsh -ArgumentList "-NoExit", "-Command", "cd '$PWD/front-end'; Write-Host 'Frontend Server' -ForegroundColor Green; npm run dev"

# Wait for servers to start
Write-Host ""
Write-Host "Waiting for servers to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 8

# Check if servers are running
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   Server Status Check                  " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check backend health
try {
    $backendHealth = Invoke-WebRequest -Uri "http://localhost:4000/health" -TimeoutSec 5 -UseBasicParsing -ErrorAction Stop
    Write-Host "✓ Backend Server: RUNNING" -ForegroundColor Green
    Write-Host "  Health Status: $($backendHealth.StatusCode)" -ForegroundColor Gray
} catch {
    Write-Host "✗ Backend Server: NOT RESPONDING" -ForegroundColor Red
    Write-Host "  Check the backend terminal window for errors" -ForegroundColor Yellow
}

# Check frontend
try {
    $frontendHealth = Invoke-WebRequest -Uri "http://localhost:8080" -TimeoutSec 5 -UseBasicParsing -ErrorAction Stop
    Write-Host "✓ Frontend Server: RUNNING" -ForegroundColor Green
    Write-Host "  Status: $($frontendHealth.StatusCode)" -ForegroundColor Gray
} catch {
    Write-Host "✗ Frontend Server: NOT RESPONDING" -ForegroundColor Red
    Write-Host "  Check the frontend terminal window for errors" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   StockMaster is Ready!                " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📱 Frontend:   http://localhost:8080" -ForegroundColor Green
Write-Host "🔧 Backend:    http://localhost:4000/api" -ForegroundColor Green
Write-Host "🔌 WebSocket:  ws://localhost:4000/ws" -ForegroundColor Green
Write-Host "💾 Database:   http://localhost:5555 (run: npm run prisma:studio)" -ForegroundColor Green
Write-Host ""
Write-Host "Test Credentials:" -ForegroundColor Cyan
Write-Host "  Username: admin01" -ForegroundColor White
Write-Host "  Password: password123" -ForegroundColor White
Write-Host ""
Write-Host "To stop the servers, close both terminal windows or press Ctrl+C in each." -ForegroundColor Yellow
Write-Host ""
Write-Host "Opening browser..." -ForegroundColor Yellow
Start-Sleep -Seconds 2
Start-Process "http://localhost:8080"

Write-Host ""
Write-Host "Press any key to exit this window..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

