# Railway Deployment - FINAL WORKING VERSION
$ErrorActionPreference = "Stop"

Write-Host "`n=== StockMaster Railway Deployment ===" -ForegroundColor Cyan
Write-Host "Fully automated - just wait!`n" -ForegroundColor Green

# Generate unique project name
$timestamp = Get-Date -Format "MMddHHmm"
$projectName = "StockMaster-$timestamp"

Write-Host "Project: $projectName`n" -ForegroundColor Yellow

cd backend

# Step 1: Init with unique name
Write-Host "[1/6] Creating new project..." -ForegroundColor Cyan
npx @railway/cli init --name $projectName

# Step 2: Deploy code (creates the service)
Write-Host "`n[2/6] Deploying backend code..." -ForegroundColor Cyan
Write-Host "This creates the Node.js service (3-5 min)...`n" -ForegroundColor Yellow
npx @railway/cli up --detach

# Wait for initial deploy
Write-Host "Waiting for service to be created..." -ForegroundColor Yellow
Start-Sleep -Seconds 45

# Step 3: Add databases
Write-Host "`n[3/6] Adding databases..." -ForegroundColor Cyan
npx @railway/cli add
Write-Host "Adding PostgreSQL..." -ForegroundColor Green
Start-Sleep -Seconds 5

npx @railway/cli add
Write-Host "Adding Redis..." -ForegroundColor Green
Start-Sleep -Seconds 5

# Step 4: Set environment variables
Write-Host "`n[4/6] Generating and setting variables..." -ForegroundColor Cyan

$JWT_SECRET = -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 64 | ForEach-Object {[char]$_})
$JWT_REFRESH_SECRET = -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 64 | ForEach-Object {[char]$_})

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

Write-Host "Variables set! Redeploying with new config..." -ForegroundColor Green
npx @railway/cli up --detach

# Wait for redeploy
Write-Host "Waiting for redeployment..." -ForegroundColor Yellow
Start-Sleep -Seconds 60

# Step 5: Run migrations
Write-Host "`n[5/6] Setting up database..." -ForegroundColor Cyan
npx @railway/cli run npx prisma db push --accept-data-loss --skip-generate
Write-Host "Schema created!" -ForegroundColor Green

Write-Host "`nSeeding with sample data..." -ForegroundColor Yellow
npx @railway/cli run npm run prisma:seed
Write-Host "Database ready!" -ForegroundColor Green

# Step 6: Get URL
Write-Host "`n[6/6] Generating domain..." -ForegroundColor Cyan
npx @railway/cli domain

$url = npx @railway/cli domain 2>&1 | Select-String -Pattern "https://" | ForEach-Object { $_.ToString().Trim() }

Write-Host "`n=== DEPLOYMENT COMPLETE! ===" -ForegroundColor Green
Write-Host "`nYour backend is LIVE at:" -ForegroundColor Cyan
Write-Host $url -ForegroundColor White
Write-Host "`nTest endpoints:" -ForegroundColor Yellow
Write-Host "  $url/health"
Write-Host "  $url/api/warehouses"
Write-Host "`nWebSocket:" -ForegroundColor Yellow
$wsUrl = $url -replace "https://", "wss://"
Write-Host "  $wsUrl/ws"
Write-Host "`nNext: Deploy frontend to Vercel with these URLs!`n" -ForegroundColor Green

cd ..

