# Railway Deployment Script for StockMaster Backend (PowerShell)
# This script automates the entire Railway deployment process

$ErrorActionPreference = "Stop"

Write-Host "[RAILWAY] StockMaster - Railway Deployment Script" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Function to print colored messages
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

# Check if Railway CLI is installed
try {
    $null = npx @railway/cli --version 2>$null
    Print-Success "Railway CLI is accessible!"
} catch {
    Print-Info "Railway CLI will be used via npx..."
}

# Set railway command (use npx for compatibility)
function railway {
    npx @railway/cli @args
}

# Check if user is logged in
Print-Info "Checking Railway login status..."
try {
    $null = railway whoami 2>$null
    Print-Success "Already logged in to Railway!"
} catch {
    Print-Warning "Not logged in to Railway. Please login..."
    Print-Info "A browser window will open for authentication..."
    railway login
    Print-Success "Logged in successfully!"
}

Write-Host ""
Print-Info "Starting deployment process..."
Write-Host ""

# Navigate to backend directory
Set-Location backend

# Initialize Railway project
Print-Info "Step 1/7: Initializing Railway project..."
railway init
Print-Success "Project initialized!"
Write-Host ""

# Link to the project
Print-Info "Step 2/7: Linking to Railway project..."
railway link
Write-Host ""

# Add PostgreSQL
Print-Info "Step 3/7: Adding PostgreSQL database..."
railway add --database postgres
Print-Success "PostgreSQL added!"
Write-Host ""

# Add Redis
Print-Info "Step 4/7: Adding Redis..."
railway add --database redis
Print-Success "Redis added!"
Write-Host ""

# Generate JWT secrets
Print-Info "Step 5/7: Generating JWT secrets..."
$JWT_SECRET = -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 64 | ForEach-Object {[char]$_})
$JWT_REFRESH_SECRET = -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 64 | ForEach-Object {[char]$_})
Print-Success "JWT secrets generated!"
Write-Host ""

# Set environment variables
Print-Info "Step 6/7: Setting environment variables..."

railway variables set NODE_ENV=production
railway variables set PORT=4000
railway variables set JWT_SECRET="$JWT_SECRET"
railway variables set JWT_REFRESH_SECRET="$JWT_REFRESH_SECRET"
railway variables set JWT_EXPIRES_IN=15m
railway variables set JWT_REFRESH_EXPIRES_IN=7d
railway variables set CORS_ORIGIN="http://localhost:5173"
railway variables set RATE_LIMIT_MAX=100
railway variables set RATE_LIMIT_WINDOW_MS=900000
railway variables set OTP_EXPIRY_MINUTES=10

Print-Success "Environment variables set!"
Print-Warning "Remember to update CORS_ORIGIN after deploying frontend!"
Write-Host ""

# Deploy
Print-Info "Step 7/7: Deploying to Railway..."
Print-Warning "This may take 3-5 minutes..."
Write-Host ""

railway up --detach

Print-Success "Deployment initiated!"
Write-Host ""

# Wait for deployment to complete
Print-Info "Waiting for deployment to complete..."
Start-Sleep -Seconds 30

# Run database migrations
Print-Info "Running database migrations..."
railway run npx prisma db push --accept-data-loss

Print-Success "Database schema created!"
Write-Host ""

# Seed database
Print-Info "Seeding database with sample data..."
railway run npm run prisma:seed

Print-Success "Database seeded!"
Write-Host ""

# Get the domain
Print-Info "Getting your backend URL..."
$RAILWAY_URL = railway domain

Write-Host ""
Write-Host "==========================================" -ForegroundColor Green
Print-Success "Deployment Complete!"
Write-Host "==========================================" -ForegroundColor Green
Write-Host ""
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
Write-Host ""
Print-Warning "Next steps:"
Write-Host "  1. Test the endpoints above"
Write-Host "  2. Deploy frontend to Vercel with these URLs:"
Write-Host "     VITE_API_URL=$RAILWAY_URL"
Write-Host "     VITE_WS_URL=$WS_URL/ws"
Write-Host "  3. Update CORS_ORIGIN in Railway to your Vercel URL"
Write-Host ""
Print-Info "To view logs: railway logs"
Print-Info "To view dashboard: railway open"
Write-Host ""
Print-Success "Happy deploying!"

