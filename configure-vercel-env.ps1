# Configure Vercel Environment Variables
# This sets up all required variables for backend to work

$ErrorActionPreference = "Stop"

Write-Host "`n=== Configuring Vercel Environment Variables ===`n" -ForegroundColor Cyan

# Your URLs
$DATABASE_URL = "postgres://postgres.sfafrxescitdxjxartnl:OVJPPh1MmW3Mb2AW@aws-1-ap-south-1.pooler.supabase.com:6543/postgres"
$REDIS_URL = "redis://default:zOWU5NGQ5MnAyMjQ4NzY@modest-jawfish-24876.upstash.io:6379"
$FRONTEND_URL = "https://front-i28036wbo-manas-choksis-projects-ed92c8ab.vercel.app"
$BACKEND_URL = "https://backend-6tbd3v3hq-manas-choksis-projects-ed92c8ab.vercel.app"

# Generate JWT secrets
$JWT_SECRET = -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 64 | ForEach-Object {[char]$_})
$JWT_REFRESH_SECRET = -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 64 | ForEach-Object {[char]$_})

Write-Host "[1/8] Setting DATABASE_URL..." -ForegroundColor Yellow
cd backend
echo $DATABASE_URL | npx vercel env add DATABASE_URL production

Write-Host "`n[2/8] Setting REDIS_URL..." -ForegroundColor Yellow
echo $REDIS_URL | npx vercel env add REDIS_URL production

Write-Host "`n[3/8] Setting CORS_ORIGIN..." -ForegroundColor Yellow
echo $FRONTEND_URL | npx vercel env add CORS_ORIGIN production

Write-Host "`n[4/8] Setting JWT_SECRET..." -ForegroundColor Yellow
echo $JWT_SECRET | npx vercel env add JWT_SECRET production

Write-Host "`n[5/8] Setting JWT_REFRESH_SECRET..." -ForegroundColor Yellow
echo $JWT_REFRESH_SECRET | npx vercel env add JWT_REFRESH_SECRET production

Write-Host "`n[6/8] Setting other environment variables..." -ForegroundColor Yellow
echo "production" | npx vercel env add NODE_ENV production
echo "4000" | npx vercel env add PORT production
echo "15m" | npx vercel env add JWT_EXPIRES_IN production
echo "7d" | npx vercel env add JWT_REFRESH_EXPIRES_IN production
echo "100" | npx vercel env add RATE_LIMIT_MAX production
echo "900000" | npx vercel env add RATE_LIMIT_WINDOW_MS production
echo "10" | npx vercel env add OTP_EXPIRY_MINUTES production

Write-Host "`n[7/8] Email Configuration..." -ForegroundColor Yellow
Write-Host "For email service to work, you need to provide:" -ForegroundColor Cyan
Write-Host "  1. SMTP host (e.g., smtp.gmail.com)" -ForegroundColor White
Write-Host "  2. SMTP port (e.g., 587)" -ForegroundColor White
Write-Host "  3. Email address" -ForegroundColor White
Write-Host "  4. App password (for Gmail, generate from Google Account settings)`n" -ForegroundColor White

$setupEmail = Read-Host "Do you want to configure email service now? (y/n)"
if ($setupEmail -eq "y" -or $setupEmail -eq "Y") {
    $EMAIL_HOST = Read-Host "SMTP Host (e.g., smtp.gmail.com)"
    $EMAIL_PORT = Read-Host "SMTP Port (587 for Gmail)"
    $EMAIL_USER = Read-Host "Email Address"
    $EMAIL_PASS = Read-Host "App Password" -AsSecureString
    $EMAIL_PASS_PLAIN = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($EMAIL_PASS))
    
    echo $EMAIL_HOST | npx vercel env add EMAIL_HOST production
    echo $EMAIL_PORT | npx vercel env add EMAIL_PORT production
    echo "false" | npx vercel env add EMAIL_SECURE production
    echo $EMAIL_USER | npx vercel env add EMAIL_USER production
    echo $EMAIL_PASS_PLAIN | npx vercel env add EMAIL_PASS production
    echo "noreply@stockmaster.com" | npx vercel env add EMAIL_FROM production
    echo "StockMaster" | npx vercel env add EMAIL_FROM_NAME production
    
    Write-Host "`n[SUCCESS] Email service configured!`n" -ForegroundColor Green
} else {
    Write-Host "`n[Skipped] Email service not configured. You can add it later in Vercel dashboard.`n" -ForegroundColor Yellow
}

Write-Host "[8/8] Redeploying backend with new environment variables..." -ForegroundColor Yellow
npx vercel --prod

cd ..

Write-Host "`n========================================" -ForegroundColor Green
Write-Host "Configuration Complete!" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Green

Write-Host "Backend URL: $BACKEND_URL" -ForegroundColor Cyan
Write-Host "Frontend URL: $FRONTEND_URL" -ForegroundColor Cyan
Write-Host "`nTest your app now at: $FRONTEND_URL`n" -ForegroundColor Green

Write-Host "If you still see errors, wait 1-2 minutes for redeployment to complete." -ForegroundColor Yellow
Write-Host "Then refresh your browser!`n" -ForegroundColor Yellow

