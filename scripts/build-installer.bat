@echo off
title LOTO App - Build Installer

echo ========================================
echo   LOTO Key Management System
echo   Building Windows Installer
echo ========================================
echo.

REM Check if Node.js is installed
where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Node.js is not installed!
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo [1/5] Checking dependencies...
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Failed to install dependencies!
    pause
    exit /b 1
)

echo.
echo [2/5] Building React app...
call npm run build
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: React build failed!
    pause
    exit /b 1
)

echo.
echo [3/5] Preparing directories...
if not exist "data" mkdir data
if not exist "data\pdfs" mkdir data\pdfs
if not exist "data\plans" mkdir data\plans
if not exist "data\personnel" mkdir data\personnel
if not exist "data\exports" mkdir data\exports

echo.
echo [4/5] Creating installer...
call npm run dist
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Electron builder failed!
    pause
    exit /b 1
)

echo.
echo [5/5] Installer created successfully!
echo.
echo ========================================
echo   BUILD COMPLETE!
echo ========================================
echo.
echo Installer location: dist\
dir dist\*.exe
echo.
pause
