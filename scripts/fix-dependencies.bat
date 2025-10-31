@echo off
echo ===============================================
echo  LOTO App - Dependency Fix Script
echo ===============================================
echo.
echo This script will:
echo 1. Delete node_modules folder
echo 2. Delete package-lock.json
echo 3. Clear npm cache
echo 4. Reinstall all dependencies
echo.
echo WARNING: This may take several minutes!
echo.
pause

echo.
echo [1/4] Deleting node_modules folder...
if exist node_modules (
    rd /s /q node_modules
    echo ✓ node_modules deleted
) else (
    echo ✓ node_modules not found (already clean)
)

echo.
echo [2/4] Deleting package-lock.json...
if exist package-lock.json (
    del /q package-lock.json
    echo ✓ package-lock.json deleted
) else (
    echo ✓ package-lock.json not found
)

echo.
echo [3/4] Clearing npm cache...
call npm cache clean --force
echo ✓ npm cache cleared

echo.
echo [4/4] Reinstalling dependencies...
echo This may take 5-10 minutes...
call npm install

echo.
echo ===============================================
if %ERRORLEVEL% EQU 0 (
    echo  ✓ SUCCESS! Dependencies reinstalled
    echo ===============================================
    echo.
    echo Next steps:
    echo 1. Run: npm run electron-dev
    echo 2. Test the application
) else (
    echo  ✗ ERROR! Installation failed
    echo ===============================================
    echo.
    echo Troubleshooting:
    echo 1. Check your internet connection
    echo 2. Make sure Node.js is installed
    echo 3. Try running as Administrator
    echo 4. Check npm logs for details
)

echo.
pause
