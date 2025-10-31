@echo off
title LOTO App - Repair Tool

echo ========================================
echo   LOTO Key Management System
echo   Repair & Fix Tool
echo ========================================
echo.
echo This tool will:
echo  - Remove corrupted node_modules
echo  - Clear build cache
echo  - Reinstall all dependencies
echo  - Reset configuration (optional)
echo.
set /p confirm="Continue? (Y/N): "
if /i not "%confirm%"=="Y" exit /b

echo.
echo [1/4] Removing node_modules...
if exist "node_modules" (
    rmdir /s /q node_modules
    echo    Done!
) else (
    echo    Already clean
)

echo.
echo [2/4] Clearing build cache...
if exist "build" (
    rmdir /s /q build
    echo    Done!
) else (
    echo    Already clean
)

if exist "dist" (
    rmdir /s /q dist
    echo    Cleared dist folder
)

echo.
echo [3/4] Reinstalling dependencies...
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Failed to install dependencies!
    pause
    exit /b 1
)

echo.
echo [4/4] Checking database...
if exist "data\loto.db-journal" (
    del /q data\loto.db-journal
    echo    Removed database journal file
)

echo.
echo ========================================
echo   REPAIR COMPLETE!
echo ========================================
echo.
echo The app has been repaired.
echo Run: npm run electron-dev to start
echo.
pause
