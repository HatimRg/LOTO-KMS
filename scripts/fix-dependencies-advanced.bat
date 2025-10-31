@echo off
echo ===============================================
echo  LOTO App - Advanced Dependency Fix Script
echo ===============================================
echo.
echo This script will fix permission and network issues:
echo 1. Close all applications using node_modules
echo 2. Force delete node_modules folder
echo 3. Delete package-lock.json
echo 4. Clear npm cache
echo 5. Configure npm for better reliability
echo 6. Reinstall with retry logic
echo.
echo IMPORTANT: Close VS Code and the app before running!
echo.
pause

echo.
echo [STEP 1] Checking for running processes...
tasklist /FI "IMAGENAME eq node.exe" 2>NUL | find /I /N "node.exe">NUL
if "%ERRORLEVEL%"=="0" (
    echo WARNING: Node.js processes are running!
    echo Please close the app and VS Code, then press any key.
    pause
)

echo.
echo [STEP 2] Force deleting node_modules folder...
echo This may take a few minutes...
if exist node_modules (
    echo Attempting normal delete first...
    rd /s /q node_modules 2>NUL
    
    if exist node_modules (
        echo Normal delete failed, using force delete...
        :: Use robocopy to clear the folder first
        mkdir empty_temp_dir 2>NUL
        robocopy empty_temp_dir node_modules /mir /r:0 /w:0 >NUL 2>&1
        rd /s /q empty_temp_dir 2>NUL
        rd /s /q node_modules 2>NUL
    )
    
    if exist node_modules (
        echo WARNING: Some files still locked. Continuing anyway...
    ) else (
        echo ✓ node_modules deleted successfully
    )
) else (
    echo ✓ node_modules not found (already clean)
)

echo.
echo [STEP 3] Deleting package-lock.json...
if exist package-lock.json (
    del /f /q package-lock.json 2>NUL
    echo ✓ package-lock.json deleted
) else (
    echo ✓ package-lock.json not found
)

echo.
echo [STEP 4] Clearing npm cache...
call npm cache clean --force
call npm cache verify
echo ✓ npm cache cleared and verified

echo.
echo [STEP 5] Configuring npm for better reliability...
call npm config set fetch-retries 5
call npm config set fetch-retry-mintimeout 20000
call npm config set fetch-retry-maxtimeout 120000
call npm config set network-timeout 300000
echo ✓ npm configured with extended timeouts and retries

echo.
echo [STEP 6] Reinstalling dependencies...
echo This may take 10-15 minutes with retries...
echo.

:: Try install with retry logic
set MAX_RETRIES=3
set RETRY_COUNT=0

:install_retry
set /a RETRY_COUNT+=1
echo Attempt %RETRY_COUNT% of %MAX_RETRIES%...
echo.

call npm install --verbose --legacy-peer-deps

if %ERRORLEVEL% EQU 0 (
    goto install_success
) else (
    if %RETRY_COUNT% LSS %MAX_RETRIES% (
        echo.
        echo Installation failed. Retrying in 10 seconds...
        timeout /t 10 /nobreak
        echo.
        echo Clearing cache before retry...
        call npm cache clean --force
        goto install_retry
    ) else (
        goto install_failed
    )
)

:install_success
echo.
echo ===============================================
echo  ✓ SUCCESS! Dependencies installed
echo ===============================================
echo.
echo Installed packages:
call npm list --depth=0 2>NUL | find /c "├──"
echo.
echo Next steps:
echo 1. Run: npm run electron-dev
echo 2. Test the application
echo.
goto end

:install_failed
echo.
echo ===============================================
echo  ✗ Installation failed after %MAX_RETRIES% attempts
echo ===============================================
echo.
echo Troubleshooting steps:
echo.
echo 1. CHECK INTERNET CONNECTION:
echo    - Open browser and test internet
echo    - Try: ping registry.npmjs.org
echo.
echo 2. CHECK FIREWALL/ANTIVIRUS:
echo    - Temporarily disable antivirus
echo    - Check Windows Firewall settings
echo.
echo 3. TRY DIFFERENT NETWORK:
echo    - Switch to different WiFi
echo    - Try mobile hotspot
echo    - Disable VPN if using one
echo.
echo 4. USE ALTERNATIVE NPM REGISTRY:
echo    npm config set registry https://registry.npmmirror.com
echo    npm install
echo.
echo 5. RUN AS ADMINISTRATOR:
echo    - Right-click this script
echo    - Select "Run as administrator"
echo.
echo 6. CHECK NODE.JS VERSION:
echo    node --version
echo    (Should be v16.x or v18.x)
echo.
echo 7. MANUAL INSTALL:
echo    npm install --verbose --legacy-peer-deps
echo.
goto end

:end
echo.
pause
