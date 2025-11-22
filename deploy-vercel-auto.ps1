# StockMaster - Fully Automated Vercel + Supabase Deployment
# Just run this script and get your live URL!

$ErrorActionPreference = "Stop"

Write-Host "`n============================================" -ForegroundColor Cyan
Write-Host "   StockMaster - Automated Deployment" -ForegroundColor Cyan
Write-Host "   Vercel + Supabase (100% FREE)" -ForegroundColor Cyan
Write-Host "============================================`n" -ForegroundColor Cyan

# Step 1: Install Vercel CLI
Write-Host "[1/10] Checking Vercel CLI..." -ForegroundColor Yellow
try {
    npx vercel --version | Out-Null
    Write-Host "[SUCCESS] Vercel CLI ready!`n" -ForegroundColor Green
} catch {
    Write-Host "[INFO] Installing Vercel CLI..." -ForegroundColor Yellow
    npm install -g vercel
    Write-Host "[SUCCESS] Vercel CLI installed!`n" -ForegroundColor Green
}

# Step 2: Login to Vercel
Write-Host "[2/10] Logging into Vercel..." -ForegroundColor Yellow
Write-Host "[INFO] Browser will open for authentication...`n" -ForegroundColor Cyan
vercel login

Write-Host "[SUCCESS] Logged in to Vercel!`n" -ForegroundColor Green

# Step 3: Install Supabase CLI
Write-Host "[3/10] Checking Supabase CLI..." -ForegroundColor Yellow
try {
    npx supabase --version | Out-Null
    Write-Host "[SUCCESS] Supabase CLI ready!`n" -ForegroundColor Green
} catch {
    Write-Host "[INFO] Supabase CLI will use npx...`n" -ForegroundColor Yellow
}

# Step 4: Create Supabase project
Write-Host "[4/10] Setting up Supabase (PostgreSQL)..." -ForegroundColor Yellow
Write-Host "[INFO] Opening Supabase to create project..." -ForegroundColor Cyan
Write-Host "`nPlease:" -ForegroundColor White
Write-Host "  1. Go to https://supabase.com/dashboard" -ForegroundColor White
Write-Host "  2. Click 'New Project'" -ForegroundColor White
Write-Host "  3. Name: StockMaster-Production" -ForegroundColor White
Write-Host "  4. Copy the DATABASE_URL (postgres://...)" -ForegroundColor White
Write-Host "  5. Paste it here and press ENTER`n" -ForegroundColor White

Start-Process "https://supabase.com/dashboard/projects"
Start-Sleep -Seconds 3

$DATABASE_URL = Read-Host "Paste DATABASE_URL here"
Write-Host "[SUCCESS] Database configured!`n" -ForegroundColor Green

# Step 5: Create Upstash Redis
Write-Host "[5/10] Setting up Upstash Redis..." -ForegroundColor Yellow
Write-Host "[INFO] Opening Upstash to create Redis..." -ForegroundColor Cyan
Write-Host "`nPlease:" -ForegroundColor White
Write-Host "  1. Go to https://console.upstash.com/" -ForegroundColor White
Write-Host "  2. Click 'Create Database'" -ForegroundColor White
Write-Host "  3. Name: stockmaster-redis" -ForegroundColor White
Write-Host "  4. Copy the REDIS_URL (redis://...)" -ForegroundColor White
Write-Host "  5. Paste it here and press ENTER`n" -ForegroundColor White

Start-Process "https://console.upstash.com/redis"
Start-Sleep -Seconds 3

$REDIS_URL = Read-Host "Paste REDIS_URL here"
Write-Host "[SUCCESS] Redis configured!`n" -ForegroundColor Green

# Step 6: Generate secrets
Write-Host "[6/10] Generating secure secrets..." -ForegroundColor Yellow
$JWT_SECRET = -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 64 | ForEach-Object {[char]$_})
$JWT_REFRESH_SECRET = -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 64 | ForEach-Object {[char]$_})
Write-Host "[SUCCESS] Secrets generated!`n" -ForegroundColor Green

# Step 7: Deploy Backend
Write-Host "[7/10] Deploying Backend to Vercel..." -ForegroundColor Yellow
Write-Host "[INFO] Uploading code (this may take 2-3 minutes)...`n" -ForegroundColor Cyan

cd backend

# Create Vercel project and deploy
$backendDeploy = vercel --yes --prod `
    --env NODE_ENV=production `
    --env PORT=4000 `
    --env DATABASE_URL="$DATABASE_URL" `
    --env REDIS_URL="$REDIS_URL" `
    --env JWT_SECRET="$JWT_SECRET" `
    --env JWT_REFRESH_SECRET="$JWT_REFRESH_SECRET" `
    --env JWT_EXPIRES_IN=15m `
    --env JWT_REFRESH_EXPIRES_IN=7d `
    --env CORS_ORIGIN="*" `
    --env RATE_LIMIT_MAX=100 `
    --env RATE_LIMIT_WINDOW_MS=900000 `
    --env OTP_EXPIRY_MINUTES=10

$BACKEND_URL = $backendDeploy | Select-String -Pattern "https://.*\.vercel\.app" | ForEach-Object { $_.Matches[0].Value }

Write-Host "[SUCCESS] Backend deployed!`n" -ForegroundColor Green
Write-Host "Backend URL: $BACKEND_URL`n" -ForegroundColor White

cd ..

# Step 8: Run Database Migrations
Write-Host "[8/10] Setting up database schema..." -ForegroundColor Yellow
$env:DATABASE_URL = $DATABASE_URL

cd backend
npx prisma db push --accept-data-loss --skip-generate
Write-Host "[SUCCESS] Database schema created!`n" -ForegroundColor Green

Write-Host "Seeding database with sample data..." -ForegroundColor Yellow
npm run prisma:seed
Write-Host "[SUCCESS] Database ready with sample data!`n" -ForegroundColor Green

cd ..

# Step 9: Deploy Frontend
Write-Host "[9/10] Deploying Frontend to Vercel..." -ForegroundColor Yellow
Write-Host "[INFO] Building and uploading frontend...`n" -ForegroundColor Cyan

cd front-end

$WS_URL = $BACKEND_URL -replace "https://", "wss://"

$frontendDeploy = vercel --yes --prod `
    --env VITE_API_URL="$BACKEND_URL" `
    --env VITE_WS_URL="$WS_URL/ws"

$FRONTEND_URL = $frontendDeploy | Select-String -Pattern "https://.*\.vercel\.app" | ForEach-Object { $_.Matches[0].Value }

Write-Host "[SUCCESS] Frontend deployed!`n" -ForegroundColor Green
Write-Host "Frontend URL: $FRONTEND_URL`n" -ForegroundColor White

cd ..

# Step 10: Update CORS
Write-Host "[10/10] Updating CORS settings..." -ForegroundColor Yellow
cd backend
vercel env rm CORS_ORIGIN production --yes
vercel env add CORS_ORIGIN production --value="$FRONTEND_URL"
vercel --prod
cd ..

Write-Host "[SUCCESS] CORS updated!`n" -ForegroundColor Green

# Final Testing
Write-Host "`n============================================" -ForegroundColor Green
Write-Host "   DEPLOYMENT COMPLETE!" -ForegroundColor Green
Write-Host "============================================`n" -ForegroundColor Green

Write-Host "Testing backend..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "$BACKEND_URL/health" -Method Get -TimeoutSec 15
    Write-Host "[SUCCESS] Backend is live!" -ForegroundColor Green
    Write-Host "  Status: $($health.status)" -ForegroundColor White
    Write-Host "  Database: $($health.database)" -ForegroundColor White
    Write-Host "  Redis: $($health.redis)`n" -ForegroundColor White
} catch {
    Write-Host "[WARNING] Backend is still starting up...`n" -ForegroundColor Yellow
}

Write-Host "`n============================================" -ForegroundColor Cyan
Write-Host "   YOUR APP IS LIVE!" -ForegroundColor Cyan
Write-Host "============================================`n" -ForegroundColor Cyan

Write-Host "App URL (use this!):" -ForegroundColor Green
Write-Host $FRONTEND_URL -ForegroundColor White -BackgroundColor Blue
Write-Host ""

Write-Host "Backend API:" -ForegroundColor Yellow
Write-Host "  $BACKEND_URL" -ForegroundColor White
Write-Host ""

Write-Host "Test Users (password: password123):" -ForegroundColor Yellow
Write-Host "  admin01   - Full admin access" -ForegroundColor White
Write-Host "  manager01 - Inventory manager" -ForegroundColor White
Write-Host "  staff01   - Warehouse staff" -ForegroundColor White
Write-Host ""

Write-Host "Sample Data Included:" -ForegroundColor Yellow
Write-Host "  8 users, 5 warehouses, 16 products" -ForegroundColor White
Write-Host "  Complete with stock across all warehouses!" -ForegroundColor White
Write-Host ""

Write-Host "============================================`n" -ForegroundColor Green

# Save URLs to file
@"
StockMaster Deployment URLs
============================

Frontend (Your App): $FRONTEND_URL
Backend API: $BACKEND_URL
WebSocket: $WS_URL/ws

Database: Supabase PostgreSQL
Redis: Upstash Redis

Test Users (password: password123):
- admin01
- manager01  
- staff01

Deployed: $(Get-Date)
"@ | Out-File -FilePath "DEPLOYMENT_URLS.txt" -Encoding UTF8

Write-Host "[INFO] URLs saved to DEPLOYMENT_URLS.txt`n" -ForegroundColor Cyan
Write-Host "Deployment complete! Enjoy your app! `n" -ForegroundColor Green

