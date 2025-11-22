# Railway Deployment - Simplified & Working
$ErrorActionPreference = "Stop"

Write-Host "`n=== StockMaster Railway Deployment ===`n" -ForegroundColor Cyan

# Navigate to backend
cd backend

# Step 1: Deploy (this creates everything)
Write-Host "[1/3] Deploying to Railway..." -ForegroundColor Yellow
Write-Host "Project: StockSPIT" -ForegroundColor Green
Write-Host "This will take 3-5 minutes...`n" -ForegroundColor Yellow

npx @railway/cli up

# Step 2: Add databases
Write-Host "`n[2/3] Adding databases..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

Write-Host "Adding PostgreSQL..." -ForegroundColor Green
npx @railway/cli add --database postgres

Write-Host "Adding Redis..." -ForegroundColor Green  
npx @railway/cli add --database redis

# Step 3: Set variables
Write-Host "`n[3/3] Setting environment variables..." -ForegroundColor Yellow

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

Write-Host "`nVariables set! Redeploying...`n" -ForegroundColor Green
npx @railway/cli up

# Run migrations
Write-Host "`nRunning database migrations..." -ForegroundColor Yellow
Start-Sleep -Seconds 30
npx @railway/cli run npx prisma db push --accept-data-loss --skip-generate

Write-Host "`nSeeding database..." -ForegroundColor Yellow
npx @railway/cli run npm run prisma:seed

# Get URL
Write-Host "`n=== DEPLOYMENT COMPLETE! ===`n" -ForegroundColor Green
Write-Host "Your backend URL:" -ForegroundColor Cyan
npx @railway/cli domain

Write-Host "`nTest it:" -ForegroundColor Yellow
Write-Host "  /health endpoint"
Write-Host "  /api/warehouses endpoint`n"

cd ..

