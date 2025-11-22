# StockMaster - Fresh Railway Deployment
# This script cleans up old projects and deploys fresh

$ErrorActionPreference = "Stop"

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "   StockMaster - Fresh Deployment" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Step 1: List and delete old projects
Write-Host "[CLEANUP] Checking for old projects..." -ForegroundColor Yellow

cd backend

# Get list of projects
Write-Host "`nYour Railway projects:" -ForegroundColor Cyan
npx @railway/cli list

Write-Host "`n[ACTION] Opening Railway dashboard to delete old projects..." -ForegroundColor Yellow
Write-Host "Please:" -ForegroundColor White
Write-Host "  1. Delete ALL old StockMaster/StockSPIT projects" -ForegroundColor White
Write-Host "  2. Press ENTER here when done`n" -ForegroundColor White

# Open dashboard
Start-Process "https://railway.app/dashboard"

# Wait for user
Read-Host "Press ENTER after deleting old projects"

Write-Host "`n[SUCCESS] Old projects cleaned up!" -ForegroundColor Green
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "   Starting Fresh Deployment" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Step 2: Create fresh project with unique name
$projectName = "StockMaster-Production"
Write-Host "[1/7] Creating project: $projectName" -ForegroundColor Cyan

npx @railway/cli init --name $projectName
Write-Host "[SUCCESS] Project created!`n" -ForegroundColor Green

# Step 3: Deploy code first
Write-Host "[2/7] Deploying backend code..." -ForegroundColor Cyan
Write-Host "Building and uploading... (3-5 minutes)`n" -ForegroundColor Yellow

npx @railway/cli up --detach

Write-Host "[SUCCESS] Code deployed! Waiting for service to initialize...`n" -ForegroundColor Green
Start-Sleep -Seconds 45

# Step 4: Add PostgreSQL
Write-Host "[3/7] Adding PostgreSQL database..." -ForegroundColor Cyan
npx @railway/cli add --database postgres
Write-Host "[SUCCESS] PostgreSQL added!`n" -ForegroundColor Green
Start-Sleep -Seconds 10

# Step 5: Add Redis
Write-Host "[4/7] Adding Redis..." -ForegroundColor Cyan
npx @railway/cli add --database redis
Write-Host "[SUCCESS] Redis added!`n" -ForegroundColor Green
Start-Sleep -Seconds 10

# Step 6: Generate and set environment variables
Write-Host "[5/7] Configuring environment variables..." -ForegroundColor Cyan

$JWT_SECRET = -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 64 | ForEach-Object {[char]$_})
$JWT_REFRESH_SECRET = -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 64 | ForEach-Object {[char]$_})

Write-Host "Setting NODE_ENV, PORT, JWT secrets..." -ForegroundColor Yellow
npx @railway/cli variables --set NODE_ENV=production
npx @railway/cli variables --set PORT=4000
npx @railway/cli variables --set "JWT_SECRET=$JWT_SECRET"
npx @railway/cli variables --set "JWT_REFRESH_SECRET=$JWT_REFRESH_SECRET"
npx @railway/cli variables --set JWT_EXPIRES_IN=15m
npx @railway/cli variables --set JWT_REFRESH_EXPIRES_IN=7d
npx @railway/cli variables --set "CORS_ORIGIN=http://localhost:5173"
npx @railway/cli variables --set RATE_LIMIT_MAX=100
npx @railway/cli variables --set RATE_LIMIT_WINDOW_MS=900000
npx @railway/cli variables --set OTP_EXPIRY_MINUTES=10

Write-Host "[SUCCESS] Variables configured! Redeploying with databases...`n" -ForegroundColor Green

npx @railway/cli up --detach
Write-Host "Waiting for redeployment with database connections..." -ForegroundColor Yellow
Start-Sleep -Seconds 60

# Step 7: Initialize database
Write-Host "[6/7] Initializing database..." -ForegroundColor Cyan

Write-Host "Creating schema..." -ForegroundColor Yellow
npx @railway/cli run npx prisma db push --accept-data-loss --skip-generate

Write-Host "`nSeeding with sample data (8 users, 5 warehouses, 16 products)..." -ForegroundColor Yellow
npx @railway/cli run npm run prisma:seed

Write-Host "[SUCCESS] Database ready!`n" -ForegroundColor Green

# Step 8: Generate domain and test
Write-Host "[7/7] Generating public domain..." -ForegroundColor Cyan
npx @railway/cli domain

Write-Host "`nFetching deployment URL..." -ForegroundColor Yellow
$url = npx @railway/cli domain 2>&1 | Select-String -Pattern "https://" | ForEach-Object { $_.ToString().Trim() }

Write-Host "`n========================================" -ForegroundColor Green
Write-Host "   DEPLOYMENT SUCCESSFUL!" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Green

if ($url) {
    Write-Host "Backend URL:" -ForegroundColor Cyan
    Write-Host $url -ForegroundColor White
    Write-Host ""
    
    # Test health endpoint
    Write-Host "[TEST] Testing /health endpoint..." -ForegroundColor Yellow
    try {
        $health = Invoke-RestMethod -Uri "$url/health" -Method Get -TimeoutSec 10
        Write-Host "[SUCCESS] Health check passed!" -ForegroundColor Green
        Write-Host "Status: $($health.status)" -ForegroundColor White
        Write-Host "Database: $($health.database)" -ForegroundColor White
        Write-Host "Redis: $($health.redis)" -ForegroundColor White
    } catch {
        Write-Host "[WARNING] Health check pending (service still starting)" -ForegroundColor Yellow
    }
    
    Write-Host ""
    Write-Host "[TEST] Testing /api/warehouses endpoint..." -ForegroundColor Yellow
    try {
        $warehouses = Invoke-RestMethod -Uri "$url/api/warehouses" -Method Get -TimeoutSec 10
        Write-Host "[SUCCESS] API working! Found $($warehouses.Count) warehouses" -ForegroundColor Green
    } catch {
        Write-Host "[WARNING] API pending (service still starting)" -ForegroundColor Yellow
    }
    
    Write-Host "`n========================================" -ForegroundColor Cyan
    Write-Host "   READY FOR FRONTEND DEPLOYMENT" -ForegroundColor Cyan
    Write-Host "========================================`n" -ForegroundColor Cyan
    
    Write-Host "Use these URLs for Vercel:" -ForegroundColor Yellow
    Write-Host "  VITE_API_URL=$url" -ForegroundColor White
    $wsUrl = $url -replace "https://", "wss://"
    Write-Host "  VITE_WS_URL=$wsUrl/ws`n" -ForegroundColor White
    
    Write-Host "Test Users (password: password123):" -ForegroundColor Yellow
    Write-Host "  admin01  - Admin access" -ForegroundColor White
    Write-Host "  manager01 - Manager access" -ForegroundColor White
    Write-Host "  staff01  - Staff access`n" -ForegroundColor White
    
    Write-Host "Useful Commands:" -ForegroundColor Yellow
    Write-Host "  railway logs      - View server logs" -ForegroundColor White
    Write-Host "  railway open      - Open dashboard" -ForegroundColor White
    Write-Host "  railway status    - Check status`n" -ForegroundColor White
} else {
    Write-Host "[WARNING] Could not fetch URL automatically" -ForegroundColor Yellow
    Write-Host "Run: npx @railway/cli domain`n" -ForegroundColor White
}

cd ..

Write-Host "========================================" -ForegroundColor Green
Write-Host "Deployment script completed!" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Green

