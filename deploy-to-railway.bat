@echo off
REM 🚂 Railway Deployment Script for StockMaster Backend (Windows Batch)
REM This script runs the PowerShell deployment script

echo.
echo 🚂 StockMaster - Railway Deployment Script
echo ==========================================
echo.

REM Check if PowerShell is available
where powershell >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ PowerShell is not available!
    echo Please run deploy-to-railway.ps1 manually
    pause
    exit /b 1
)

REM Run the PowerShell script
echo Running deployment script...
echo.
powershell -ExecutionPolicy Bypass -File "%~dp0deploy-to-railway.ps1"

if %errorlevel% neq 0 (
    echo.
    echo ❌ Deployment failed!
    pause
    exit /b 1
)

echo.
echo ✅ Deployment script completed!
pause

