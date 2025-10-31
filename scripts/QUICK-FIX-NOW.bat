@echo off
COLOR 0A
echo.
echo ╔════════════════════════════════════════════════════════╗
echo ║         LOTO APP - QUICK FIX (Run This Now!)           ║
echo ╚════════════════════════════════════════════════════════╝
echo.
echo This will fix your network and permission errors!
echo.
echo BEFORE RUNNING:
echo  1. Close VS Code completely
echo  2. Close the LOTO app if running
echo  3. Make sure you have internet connection
echo.
echo Press any key when ready...
pause >nul

echo.
echo ══════════════════════════════════════════════════════════
echo  STEP 1: Killing Node.js processes
echo ══════════════════════════════════════════════════════════
taskkill /F /IM node.exe 2>NUL
taskkill /F /IM Code.exe 2>NUL
timeout /t 2 /nobreak >nul
echo ✓ Done

echo.
echo ══════════════════════════════════════════════════════════
echo  STEP 2: Force deleting node_modules (this takes time!)
echo ══════════════════════════════════════════════════════════
if exist node_modules (
    echo Creating empty directory for robocopy...
    mkdir empty_dir_temp 2>NUL
    echo Mirroring empty directory to node_modules...
    robocopy empty_dir_temp node_modules /MIR /R:0 /W:0 /NJH /NJS >nul 2>&1
    rd /s /q empty_dir_temp 2>NUL
    rd /s /q node_modules 2>NUL
    echo ✓ node_modules deleted
) else (
    echo ✓ node_modules already deleted
)

echo.
echo ══════════════════════════════════════════════════════════
echo  STEP 3: Cleaning npm files
echo ══════════════════════════════════════════════════════════
if exist package-lock.json (
    del /f /q package-lock.json
    echo ✓ package-lock.json deleted
)
npm cache clean --force >nul 2>&1
echo ✓ npm cache cleaned

echo.
echo ══════════════════════════════════════════════════════════
echo  STEP 4: Configuring npm for better reliability
echo ══════════════════════════════════════════════════════════
call npm config set fetch-retries 5 >nul
call npm config set fetch-retry-mintimeout 20000 >nul
call npm config set fetch-retry-maxtimeout 120000 >nul
call npm config set network-timeout 300000 >nul
echo ✓ npm configured with extended timeouts

echo.
echo ══════════════════════════════════════════════════════════
echo  STEP 5: Installing dependencies (10-15 minutes)
echo ══════════════════════════════════════════════════════════
echo.
echo Starting installation...
echo If it fails, it will retry automatically (up to 3 times)
echo.

set RETRY=0
:retry_install
set /a RETRY+=1
if %RETRY% GTR 1 (
    echo.
    echo ───────────────────────────────────────────────────────
    echo  Retry attempt %RETRY% of 3
    echo ───────────────────────────────────────────────────────
    timeout /t 5 /nobreak >nul
    call npm cache clean --force >nul 2>&1
)

npm install --legacy-peer-deps

if %ERRORLEVEL% NEQ 0 (
    if %RETRY% LSS 3 (
        echo.
        echo Installation failed! Retrying with different settings...
        goto retry_install
    ) else (
        goto failed
    )
)

:success
echo.
echo.
echo ╔════════════════════════════════════════════════════════╗
echo ║                   ✓ SUCCESS!                           ║
echo ╚════════════════════════════════════════════════════════╝
echo.
echo Dependencies installed successfully!
echo.
echo NEXT STEPS:
echo  1. Run: npm run electron-dev
echo  2. The app should start without errors
echo.
goto end

:failed
echo.
echo.
echo ╔════════════════════════════════════════════════════════╗
echo ║                   ✗ FAILED                             ║
echo ╚════════════════════════════════════════════════════════╝
echo.
echo Installation failed after 3 attempts.
echo.
echo QUICK FIXES TO TRY:
echo.
echo 1. CHECK INTERNET:
echo    ping google.com
echo.
echo 2. TRY MOBILE HOTSPOT:
echo    Connect to phone hotspot and run this again
echo.
echo 3. USE DIFFERENT REGISTRY:
echo    npm config set registry https://registry.npmmirror.com
echo    npm install --legacy-peer-deps
echo.
echo 4. DISABLE ANTIVIRUS:
echo    Turn off Windows Defender temporarily
echo    Then run this script again
echo.
echo 5. RUN AS ADMINISTRATOR:
echo    Right-click this file
echo    Select "Run as administrator"
echo.
goto end

:end
echo.
echo Press any key to exit...
pause >nul
