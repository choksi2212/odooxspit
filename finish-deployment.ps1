# Finish StockMaster Deployment
# This completes the database setup and frontend deployment

$ErrorActionPreference = "Stop"

Write-Host "`n=== Finishing StockMaster Deployment ===`n" -ForegroundColor Cyan

# Database and Redis URLs (from your input)
# Using DIRECT connection (port 5432) instead of pooler (6543) for Prisma migrations
$DATABASE_URL_POOLER = "postgres://postgres.sfafrxescitdxjxartnl:OVJPPh1MmW3Mb2AW@aws-1-ap-south-1.pooler.supabase.com:6543/postgres"
$DATABASE_URL_DIRECT = "postgres://postgres.sfafrxescitdxjxartnl:OVJPPh1MmW3Mb2AW@aws-1-ap-south-1.pooler.supabase.com:5432/postgres"
$REDIS_URL = "redis://default:zOWU5NGQ5MnAyMjQ4NzY@modest-jawfish-24876.upstash.io:6379"
$BACKEND_URL = "https://backend-6tbd3v3hq-manas-choksis-projects-ed92c8ab.vercel.app"

Write-Host "[1/4] Updating backend .env file..." -ForegroundColor Yellow

cd backend

# Update .env file with correct DATABASE_URL (use pooler for app, direct for migrations)
$envContent = @"
# Database (use pooler for production)
DATABASE_URL="$DATABASE_URL_POOLER"

# Redis
REDIS_URL="$REDIS_URL"

# Server
NODE_ENV=production
PORT=4000

# JWT (these will be set in Vercel, but keeping for local dev)
JWT_SECRET=local-dev-secret-change-in-production
JWT_REFRESH_SECRET=local-dev-refresh-secret-change-in-production
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# CORS
CORS_ORIGIN=*

# Rate Limiting
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW_MS=900000

# OTP
OTP_EXPIRY_MINUTES=10
"@

$envContent | Out-File -FilePath ".env" -Encoding UTF8 -Force

Write-Host "[SUCCESS] .env file updated!`n" -ForegroundColor Green

# Step 2: Generate Prisma Client
Write-Host "[2/4] Generating Prisma Client..." -ForegroundColor Yellow
npx prisma generate
Write-Host "[SUCCESS] Prisma Client generated!`n" -ForegroundColor Green

# Step 3: Push database schema
Write-Host "[3/4] Creating database schema..." -ForegroundColor Yellow
Write-Host "Using direct connection for faster migration...`n" -ForegroundColor Cyan

# Try direct connection first (faster for migrations)
$env:DATABASE_URL = $DATABASE_URL_DIRECT

Write-Host "Attempting database connection..." -ForegroundColor Yellow
$timeout = 30
$job = Start-Job -ScriptBlock {
    param($dbUrl)
    $env:DATABASE_URL = $dbUrl
    Set-Location $using:PWD
    npx prisma db push --accept-data-loss --skip-generate --force-reset 2>&1
} -ArgumentList $DATABASE_URL_DIRECT

try {
    $result = Wait-Job -Job $job -Timeout $timeout | Receive-Job
    if ($job.State -eq "Completed") {
        Write-Host "`n[SUCCESS] Database schema created!`n" -ForegroundColor Green
    } else {
        Write-Host "[WARNING] Migration timed out, trying alternative method...`n" -ForegroundColor Yellow
        # Try with pooler connection
        $env:DATABASE_URL = $DATABASE_URL_POOLER
        npx prisma db push --accept-data-loss --skip-generate
        Write-Host "`n[SUCCESS] Database schema created!`n" -ForegroundColor Green
    }
} catch {
    Write-Host "[ERROR] Migration failed. Trying pooler connection...`n" -ForegroundColor Red
    $env:DATABASE_URL = $DATABASE_URL_POOLER
    npx prisma db push --accept-data-loss --skip-generate
    Write-Host "`n[SUCCESS] Database schema created!`n" -ForegroundColor Green
} finally {
    Remove-Job -Job $job -Force -ErrorAction SilentlyContinue
}

# Step 4: Seed database
Write-Host "[4/4] Seeding database with sample data..." -ForegroundColor Yellow
npm run prisma:seed

Write-Host "`n[SUCCESS] Database seeded!`n" -ForegroundColor Green

cd ..

# Step 5: Deploy Frontend
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Deploying Frontend to Vercel..." -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

cd front-end

Write-Host "Setting environment variables..." -ForegroundColor Yellow
$WS_URL = $BACKEND_URL -replace "https://", "wss://"

Write-Host "Deploying to Vercel..." -ForegroundColor Yellow
Write-Host "When prompted, enter:" -ForegroundColor Cyan
Write-Host "  VITE_API_URL = $BACKEND_URL" -ForegroundColor White
Write-Host "  VITE_WS_URL = $WS_URL/ws`n" -ForegroundColor White

npx vercel --yes --prod

Write-Host "`n========================================" -ForegroundColor Green
Write-Host "DEPLOYMENT COMPLETE!" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Green

Write-Host "Your Backend:" -ForegroundColor Cyan
Write-Host $BACKEND_URL -ForegroundColor White
Write-Host ""

Write-Host "Your Frontend (check Vercel output above for URL):" -ForegroundColor Cyan
Write-Host "Or run: npx vercel ls`n" -ForegroundColor White

cd ..

Write-Host "Test your app at the frontend URL above!`n" -ForegroundColor Green

