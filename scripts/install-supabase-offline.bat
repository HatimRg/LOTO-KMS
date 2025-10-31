@echo off
echo ========================================
echo OFFLINE SUPABASE INSTALLATION
echo ========================================
echo.
echo This script will help you install Supabase offline
echo.
pause

echo Step 1: Configuring npm for better reliability...
npm config set fetch-retries 10
npm config set fetch-retry-mintimeout 20000
npm config set fetch-retry-maxtimeout 120000
npm config set network-timeout 600000
npm config set maxsockets 1

echo.
echo Step 2: Attempting installation with maximum retries...
npm install @supabase/supabase-js --legacy-peer-deps --fetch-retries=10 --fetch-retry-mintimeout=20000

if %errorlevel% neq 0 (
    echo.
    echo ========================================
    echo INSTALLATION FAILED
    echo ========================================
    echo.
    echo Your network connection is too unstable for npm.
    echo.
    echo SOLUTIONS:
    echo 1. Try using mobile hotspot
    echo 2. Try a different network
    echo 3. Contact IT to check firewall/proxy
    echo.
    echo OR: Continue without Supabase (local only mode)
    echo The app will still work with local database only.
    echo.
    pause
    exit /b 1
)

echo.
echo ========================================
echo SUCCESS! Supabase installed
echo ========================================
pause
