@echo off
REM StockMaster - Quick Start Script
REM Starts both backend and frontend servers

echo ========================================
echo    StockMaster - Starting Application
echo ========================================
echo.

REM Start backend in new window
echo Starting Backend Server...
echo   -^> http://localhost:4000/api
start "StockMaster Backend" cmd /k "cd backend && npm run dev"

REM Wait a bit
timeout /t 3 /nobreak >nul

REM Start frontend in new window  
echo Starting Frontend Server...
echo   -^> http://localhost:8080
start "StockMaster Frontend" cmd /k "cd front-end && npm run dev"

REM Wait for servers to start
echo.
echo Waiting for servers to start...
timeout /t 10 /nobreak >nul

echo.
echo ========================================
echo    StockMaster is Ready!
echo ========================================
echo.
echo Frontend:   http://localhost:8080
echo Backend:    http://localhost:4000/api
echo WebSocket:  ws://localhost:4000/ws
echo.
echo Test Credentials:
echo   Username: admin01
echo   Password: password123
echo.
echo Opening browser...
timeout /t 2 /nobreak >nul
start http://localhost:8080

echo.
echo To stop the servers, close the terminal windows
echo or press Ctrl+C in each window.
echo.
pause

