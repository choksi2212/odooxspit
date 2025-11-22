# Setup Email Service for StockMaster
# This configures SMTP for password reset OTP emails

$ErrorActionPreference = "Stop"

Write-Host "`n=== StockMaster Email Service Setup ===`n" -ForegroundColor Cyan

Write-Host "This will configure email service for password reset OTPs.`n" -ForegroundColor Yellow
Write-Host "For Gmail:" -ForegroundColor White
Write-Host "  1. Go to Google Account Settings" -ForegroundColor White
Write-Host "  2. Security → 2-Step Verification → App Passwords" -ForegroundColor White
Write-Host "  3. Generate an app password for 'Mail'" -ForegroundColor White
Write-Host "  4. Use that password below`n" -ForegroundColor White

$EMAIL_HOST = Read-Host "SMTP Host (e.g., smtp.gmail.com for Gmail)"
$EMAIL_PORT = Read-Host "SMTP Port (587 for Gmail, 465 for SSL)"
$EMAIL_USER = Read-Host "Your Email Address"
$EMAIL_PASS = Read-Host "App Password (or SMTP password)" -AsSecureString
$EMAIL_PASS_PLAIN = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($EMAIL_PASS))

$EMAIL_FROM = Read-Host "From Email (default: noreply@stockmaster.com)" 
if ([string]::IsNullOrWhiteSpace($EMAIL_FROM)) {
    $EMAIL_FROM = "noreply@stockmaster.com"
}

$EMAIL_FROM_NAME = Read-Host "From Name (default: StockMaster)"
if ([string]::IsNullOrWhiteSpace($EMAIL_FROM_NAME)) {
    $EMAIL_FROM_NAME = "StockMaster"
}

$EMAIL_SECURE = if ($EMAIL_PORT -eq "465") { "true" } else { "false" }

Write-Host "`n[1/6] Setting EMAIL_HOST..." -ForegroundColor Yellow
cd backend
echo $EMAIL_HOST | npx vercel env add EMAIL_HOST production

Write-Host "`n[2/6] Setting EMAIL_PORT..." -ForegroundColor Yellow
echo $EMAIL_PORT | npx vercel env add EMAIL_PORT production

Write-Host "`n[3/6] Setting EMAIL_SECURE..." -ForegroundColor Yellow
echo $EMAIL_SECURE | npx vercel env add EMAIL_SECURE production

Write-Host "`n[4/6] Setting EMAIL_USER..." -ForegroundColor Yellow
echo $EMAIL_USER | npx vercel env add EMAIL_USER production

Write-Host "`n[5/6] Setting EMAIL_PASS..." -ForegroundColor Yellow
echo $EMAIL_PASS_PLAIN | npx vercel env add EMAIL_PASS production

Write-Host "`n[6/6] Setting EMAIL_FROM and EMAIL_FROM_NAME..." -ForegroundColor Yellow
echo $EMAIL_FROM | npx vercel env add EMAIL_FROM production
echo $EMAIL_FROM_NAME | npx vercel env add EMAIL_FROM_NAME production

Write-Host "`n[SUCCESS] Email service configured!`n" -ForegroundColor Green

Write-Host "Redeploying backend..." -ForegroundColor Yellow
npx vercel --prod

cd ..

Write-Host "`n========================================" -ForegroundColor Green
Write-Host "Email Service Ready!" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Green

Write-Host "Users can now receive OTP emails for password reset!`n" -ForegroundColor Cyan

