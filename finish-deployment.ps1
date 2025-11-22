# Finish StockMaster Deployment
# This completes the database setup and frontend deployment

$ErrorActionPreference = "Stop"

Write-Host "`n=== Finishing StockMaster Deployment ===`n" -ForegroundColor Cyan

# Database and Redis URLs (from your input)
$DATABASE_URL = "postgres://postgres.sfafrxescitdxjxartnl:OVJPPh1MmW3Mb2AW@aws-1-ap-south-1.pooler.supabase.com:6543/postgres"
$REDIS_URL = "redis://default:zOWU5NGQ5MnAyMjQ4NzY@modest-jawfish-24876.upstash.io:6379"
$BACKEND_URL = "https://backend-6tbd3v3hq-manas-choksis-projects-ed92c8ab.vercel.app"

Write-Host "[1/4] Updating backend .env file..." -ForegroundColor Yellow

cd backend

# Update .env file with correct DATABASE_URL
$envContent = @"
# Database
DATABASE_URL="$DATABASE_URL"

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
Write-Host "This may take 30-60 seconds...`n" -ForegroundColor Cyan

# Set environment variable and run
$env:DATABASE_URL = $DATABASE_URL
npx prisma db push --accept-data-loss --skip-generate

Write-Host "`n[SUCCESS] Database schema created!`n" -ForegroundColor Green

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

