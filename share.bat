@echo off
setlocal enabledelayedexpansion
title DP Hire - Share Tool
cls

echo ===============================================================
echo   DP HIRE - AI Recruitment Platform (DataPage)
echo ===============================================================
echo.

echo [1/2] Ensuring server is running on port 5000...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5000 ^| findstr LISTENING') do taskkill /f /pid %%a >nul 2>&1
start "DP Hire Server" cmd /k "node server/standaloneServer.js"

timeout /t 2 /nobreak >nul

echo.
echo ===============================================================
echo   METHOD 1: SHARE ON SAME OFFICE WI-FI (Instant)
echo ===============================================================
for /f "tokens=2 delims=:" %%i in ('ipconfig ^| findstr /i "IPv4"') do (
    set ip=%%i
    set ip=!ip: =!
    echo   Share this link: http://!ip!:5000
)
echo.
echo ===============================================================
echo   METHOD 2: PUBLIC INTERNET LINK (Cloudflare / Localtunnel)
echo ===============================================================
echo Generating your public HTTPS link below, please wait...
echo.

npx.cmd -y untun tunnel --port 5000

echo.
echo [If untun is not available, trying localtunnel...]
npx.cmd -y localtunnel --port 5000

echo.
echo ===============================================================
echo Script finished. Press any key to close this window.
pause
