@echo off
REM PostgreSQL Password Reset Script
REM Resets postgres password to: niklaus22

echo.
echo ============================================
echo PostgreSQL Password Reset Script
echo ============================================
echo.
echo This script will reset the postgres password to: niklaus22
echo.
echo IMPORTANT: This must be run as Administrator!
echo.
pause

echo.
echo Step 1: Backing up pg_hba.conf...
copy "C:\Program Files\PostgreSQL\18\data\pg_hba.conf" "C:\Program Files\PostgreSQL\18\data\pg_hba.conf.backup" >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Failed to backup. Make sure you run as Administrator!
    pause
    exit /b 1
)
echo SUCCESS: Backup created

echo.
echo Step 2: Modifying pg_hba.conf for temporary trust authentication...
powershell -Command "(Get-Content 'C:\Program Files\PostgreSQL\18\data\pg_hba.conf') -replace 'host\s+all\s+all\s+127\.0\.0\.1/32\s+scram-sha-256', 'host    all             all             127.0.0.1/32            trust' | Set-Content 'C:\Program Files\PostgreSQL\18\data\pg_hba.conf'"
echo SUCCESS: Configuration modified

echo.
echo Step 3: Restarting PostgreSQL service...
net stop postgresql-x64-18 >nul 2>&1
timeout /t 2 >nul
net start postgresql-x64-18 >nul 2>&1
timeout /t 3 >nul
echo SUCCESS: Service restarted

echo.
echo Step 4: Changing postgres password...
"C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -d postgres -c "ALTER USER postgres WITH PASSWORD 'niklaus22';"
if %ERRORLEVEL% EQU 0 (
    echo SUCCESS: Password changed
) else (
    echo ERROR: Failed to change password
    goto RESTORE
)

:RESTORE
echo.
echo Step 5: Restoring original pg_hba.conf...
copy /Y "C:\Program Files\PostgreSQL\18\data\pg_hba.conf.backup" "C:\Program Files\PostgreSQL\18\data\pg_hba.conf" >nul 2>&1
echo SUCCESS: Configuration restored

echo.
echo Step 6: Final restart...
net stop postgresql-x64-18 >nul 2>&1
timeout /t 2 >nul
net start postgresql-x64-18 >nul 2>&1
timeout /t 3 >nul
echo SUCCESS: Service restarted

echo.
echo Step 7: Verifying new password...
set PGPASSWORD=niklaus22
"C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -d postgres -c "SELECT 1;" >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo SUCCESS: Password verified!
) else (
    echo WARNING: Could not verify. Please test manually.
)

echo.
echo Cleaning up backup...
del "C:\Program Files\PostgreSQL\18\data\pg_hba.conf.backup" >nul 2>&1

echo.
echo ============================================
echo COMPLETE!
echo ============================================
echo.
echo New PostgreSQL credentials:
echo   User: postgres
echo   Password: niklaus22
echo.
echo Next steps:
echo   1. Grant CREATEDB to stockmaster user
echo   2. Run database migrations
echo.
pause
