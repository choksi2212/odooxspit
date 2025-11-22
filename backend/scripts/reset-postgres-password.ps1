# PostgreSQL Password Reset Script
# This script resets the postgres user password to: niklaus22

Write-Host "`n============================================" -ForegroundColor Cyan
Write-Host "PostgreSQL Password Reset Script" -ForegroundColor Cyan
Write-Host "============================================`n" -ForegroundColor Cyan

$pgDataPath = "C:\Program Files\PostgreSQL\18\data"
$pgHbaFile = "$pgDataPath\pg_hba.conf"
$pgHbaBackup = "$pgDataPath\pg_hba.conf.backup"
$serviceName = "postgresql-x64-18"

# Check if running as Administrator
$currentPrincipal = New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())
$isAdmin = $currentPrincipal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "ERROR: This script must be run as Administrator!" -ForegroundColor Red
    Write-Host "`nPlease:" -ForegroundColor Yellow
    Write-Host "1. Right-click PowerShell" -ForegroundColor Yellow
    Write-Host "2. Select 'Run as Administrator'" -ForegroundColor Yellow
    Write-Host "3. Run this script again`n" -ForegroundColor Yellow
    pause
    exit 1
}

Write-Host "✓ Running as Administrator`n" -ForegroundColor Green

# Step 1: Backup pg_hba.conf
Write-Host "Step 1: Backing up pg_hba.conf..." -ForegroundColor Yellow
try {
    Copy-Item $pgHbaFile $pgHbaBackup -Force
    Write-Host "✓ Backup created`n" -ForegroundColor Green
} catch {
    Write-Host "ERROR: Failed to backup pg_hba.conf" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    pause
    exit 1
}

# Step 2: Modify pg_hba.conf to allow trust authentication
Write-Host "Step 2: Modifying pg_hba.conf for temporary trust authentication..." -ForegroundColor Yellow
try {
    $content = Get-Content $pgHbaFile
    $newContent = $content -replace 'host\s+all\s+all\s+127\.0\.0\.1/32\s+scram-sha-256', 'host    all             all             127.0.0.1/32            trust'
    $newContent | Set-Content $pgHbaFile
    Write-Host "✓ Configuration modified`n" -ForegroundColor Green
} catch {
    Write-Host "ERROR: Failed to modify pg_hba.conf" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    pause
    exit 1
}

# Step 3: Restart PostgreSQL service
Write-Host "Step 3: Restarting PostgreSQL service..." -ForegroundColor Yellow
try {
    Restart-Service $serviceName -Force
    Start-Sleep -Seconds 3
    Write-Host "✓ Service restarted`n" -ForegroundColor Green
} catch {
    Write-Host "ERROR: Failed to restart PostgreSQL service" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    # Restore backup
    Copy-Item $pgHbaBackup $pgHbaFile -Force
    pause
    exit 1
}

# Step 4: Change postgres password
Write-Host "Step 4: Changing postgres password to 'niklaus22'..." -ForegroundColor Yellow
try {
    $psqlPath = "C:\Program Files\PostgreSQL\18\bin\psql.exe"
    & $psqlPath -U postgres -d postgres -c "ALTER USER postgres WITH PASSWORD 'niklaus22';"
    Write-Host "✓ Password changed successfully`n" -ForegroundColor Green
} catch {
    Write-Host "ERROR: Failed to change password" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    # Restore backup and restart
    Copy-Item $pgHbaBackup $pgHbaFile -Force
    Restart-Service $serviceName -Force
    pause
    exit 1
}

# Step 5: Restore original pg_hba.conf
Write-Host "Step 5: Restoring original pg_hba.conf..." -ForegroundColor Yellow
try {
    Copy-Item $pgHbaBackup $pgHbaFile -Force
    Write-Host "✓ Configuration restored`n" -ForegroundColor Green
} catch {
    Write-Host "ERROR: Failed to restore pg_hba.conf" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    pause
    exit 1
}

# Step 6: Final restart
Write-Host "Step 6: Final PostgreSQL service restart..." -ForegroundColor Yellow
try {
    Restart-Service $serviceName -Force
    Start-Sleep -Seconds 3
    Write-Host "✓ Service restarted`n" -ForegroundColor Green
} catch {
    Write-Host "ERROR: Failed to restart PostgreSQL service" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    pause
    exit 1
}

# Step 7: Verify new password
Write-Host "Step 7: Verifying new password..." -ForegroundColor Yellow
try {
    $env:PGPASSWORD = 'niklaus22'
    $psqlPath = "C:\Program Files\PostgreSQL\18\bin\psql.exe"
    $result = & $psqlPath -U postgres -d postgres -c "SELECT 1;" 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Password verified successfully`n" -ForegroundColor Green
    } else {
        throw "Verification failed"
    }
} catch {
    Write-Host "WARNING: Could not verify password" -ForegroundColor Yellow
    Write-Host "Please test manually`n" -ForegroundColor Yellow
}

# Cleanup backup
Remove-Item $pgHbaBackup -Force -ErrorAction SilentlyContinue

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "SUCCESS! Password reset complete" -ForegroundColor Green
Write-Host "============================================`n" -ForegroundColor Cyan

Write-Host "New credentials:" -ForegroundColor Yellow
Write-Host "  User: postgres" -ForegroundColor White
Write-Host "  Password: niklaus22`n" -ForegroundColor White

Write-Host "You can now grant CREATEDB privilege:" -ForegroundColor Yellow
Write-Host '  $env:PGPASSWORD="niklaus22"; psql -U postgres -c "ALTER USER stockmaster CREATEDB;"' -ForegroundColor White
Write-Host ""

pause

