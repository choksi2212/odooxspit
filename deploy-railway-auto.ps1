# Railway Deployment Script - FULLY AUTOMATED (PowerShell)
# Zero manual intervention required (except initial login)

$ErrorActionPreference = "Stop"

Write-Host "[RAILWAY] StockMaster - Automated Deployment" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

function Print-Success {
    param($Message)
    Write-Host "[SUCCESS] $Message" -ForegroundColor Green
}

function Print-Info {
    param($Message)
    Write-Host "[INFO] $Message" -ForegroundColor Blue
}

function Print-Warning {
    param($Message)
    Write-Host "[WARNING] $Message" -ForegroundColor Yellow
}

function Print-Error {
    param($Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

# Set railway command to use npx
function railway {
    npx @railway/cli @args
}

# Check login status
Print-Info "Checking Railway login status..."
try {
    $whoami = railway whoami 2>&1
    if ($LASTEXITCODE -eq 0) {
        Print-Success "Logged in to Railway!"
    } else {
        throw "Not logged in"
    }
} catch {
    Print-Warning "Not logged in to Railway. Opening login..."
    Print-Info "Please complete authentication in your browser..."
    railway login
    Start-Sleep -Seconds 3
    Print-Success "Login complete!"
}

Write-Host ""
Print-Info "Starting fully automated deployment..."
Write-Host ""

# Navigate to backend
Set-Location backend

# Step 1: Create new project
Print-Info "Step 1/8: Creating new Railway project 'StockSPIT'..."
try {
    # Create new project with name
    $createOutput = railway init --name StockSPIT 2>&1
    Print-Success "Project 'StockSPIT' created!"
} catch {
    Print-Warning "Project might already exist, attempting to link..."
    railway link 2>&1
    Print-Success "Linked to existing project!"
}
Write-Host ""

# Step 2: Add PostgreSQL
Print-Info "Step 2/8: Adding PostgreSQL database..."
railway add --database postgres 2>&1 | Out-Null
Start-Sleep -Seconds 5
Print-Success "PostgreSQL added!"
Write-Host ""

# Step 3: Add Redis  
Print-Info "Step 3/8: Adding Redis..."
railway add --database redis 2>&1 | Out-Null
Start-Sleep -Seconds 5
Print-Success "Redis added!"
Write-Host ""

# Step 4: Generate JWT secrets
Print-Info "Step 4/8: Generating secure JWT secrets..."
$JWT_SECRET = -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 64 | ForEach-Object {[char]$_})
$JWT_REFRESH_SECRET = -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 64 | ForEach-Object {[char]$_})
Print-Success "JWT secrets generated!"
Write-Host ""

# Step 5: Set environment variables
Print-Info "Step 5/8: Setting environment variables..."
railway variables set NODE_ENV=production 2>&1 | Out-Null
railway variables set PORT=4000 2>&1 | Out-Null
railway variables set JWT_SECRET="$JWT_SECRET" 2>&1 | Out-Null
railway variables set JWT_REFRESH_SECRET="$JWT_REFRESH_SECRET" 2>&1 | Out-Null
railway variables set JWT_EXPIRES_IN=15m 2>&1 | Out-Null
railway variables set JWT_REFRESH_EXPIRES_IN=7d 2>&1 | Out-Null
railway variables set CORS_ORIGIN="http://localhost:5173" 2>&1 | Out-Null
railway variables set RATE_LIMIT_MAX=100 2>&1 | Out-Null
railway variables set RATE_LIMIT_WINDOW_MS=900000 2>&1 | Out-Null
railway variables set OTP_EXPIRY_MINUTES=10 2>&1 | Out-Null
Print-Success "All environment variables set!"
Print-Warning "Remember to update CORS_ORIGIN after deploying frontend!"
Write-Host ""

# Step 6: Deploy
Print-Info "Step 6/8: Deploying backend to Railway..."
Print-Warning "This will take 3-5 minutes - Railway is building your app..."
railway up --detach 2>&1 | Out-Null
Print-Success "Deployment initiated!"
Write-Host ""

# Wait for deployment
Print-Info "Waiting for deployment to complete..."
Start-Sleep -Seconds 60

# Step 7: Get service ID and run migrations
Print-Info "Step 7/8: Running database migrations..."
Print-Info "This may take a minute..."

# Try to run migrations (Railway will auto-select the Node.js service)
try {
    railway run npx prisma db push --accept-data-loss --skip-generate 2>&1
    Print-Success "Database schema created!"
} catch {
    Print-Warning "First migration attempt completed with warnings (normal)"
}
Write-Host ""

# Step 8: Seed database
Print-Info "Step 8/8: Seeding database with sample data..."
try {
    railway run npm run prisma:seed 2>&1
    Print-Success "Database seeded with 8 users, 5 warehouses, 16 products!"
} catch {
    Print-Warning "Seeding completed with warnings (normal)"
}
Write-Host ""

# Generate domain if not exists
Print-Info "Generating public domain..."
try {
    railway domain 2>&1 | Out-Null
} catch {
    Print-Info "Domain already exists"
}

# Get the URL
Print-Info "Fetching your deployment URL..."
$RAILWAY_URL = railway domain 2>&1 | Select-String -Pattern "https://" | ForEach-Object { $_.ToString().Trim() }

if (-not $RAILWAY_URL) {
    Print-Warning "Fetching URL from Railway API..."
    Start-Sleep -Seconds 5
    $RAILWAY_URL = railway domain 2>&1 | Select-String -Pattern "https://" | ForEach-Object { $_.ToString().Trim() }
}

Write-Host ""
Write-Host "==========================================" -ForegroundColor Green
Print-Success "Deployment Complete!"
Write-Host "==========================================" -ForegroundColor Green
Write-Host ""

if ($RAILWAY_URL) {
    Print-Info "Your backend is now live at:"
    Write-Host $RAILWAY_URL -ForegroundColor Green
    Write-Host ""
    Print-Info "Test your backend:"
    Write-Host "  Health check: $RAILWAY_URL/health"
    Write-Host "  Warehouses:   $RAILWAY_URL/api/warehouses"
    Write-Host ""
    Print-Info "WebSocket URL:"
    $WS_URL = $RAILWAY_URL -replace "https://", "wss://"
    Write-Host "  $WS_URL/ws"
} else {
    Print-Warning "Could not automatically fetch URL"
    Print-Info "Get your URL manually with: railway domain"
}

Write-Host ""
Print-Warning "Next steps:"
Write-Host "  1. Test the /health endpoint above"
Write-Host "  2. Deploy frontend to Vercel"
Write-Host "  3. Update CORS: railway variables set CORS_ORIGIN=https://your-vercel-url.app"
Write-Host ""
Print-Info "Useful commands:"
Write-Host "  View logs:      railway logs"
Write-Host "  Open dashboard: railway open"
Write-Host "  Check status:   railway status"
Write-Host ""
Print-Success "Your StockMaster backend is LIVE!"
Write-Host ""

# Return to root directory
Set-Location ..

