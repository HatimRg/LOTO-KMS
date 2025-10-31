@echo off
title LOTO App - Development Helper

:menu
cls
echo ========================================
echo   LOTO Key Management - Dev Helper
echo ========================================
echo.
echo  1. Install Dependencies
echo  2. Run Development Mode
echo  3. Build Production App
echo  4. Add Sample Data
echo  5. Clean Build Files
echo  6. Reset Database
echo  7. Open Data Folder
echo  8. Exit
echo.
echo ========================================
set /p choice="Select option (1-8): "

if "%choice%"=="1" goto install
if "%choice%"=="2" goto dev
if "%choice%"=="3" goto build
if "%choice%"=="4" goto sample
if "%choice%"=="5" goto clean
if "%choice%"=="6" goto reset
if "%choice%"=="7" goto opendata
if "%choice%"=="8" goto exit

echo Invalid option!
pause
goto menu

:install
echo.
echo Installing dependencies...
call npm install
echo.
echo Done!
pause
goto menu

:dev
echo.
echo Starting development mode...
echo This will open the app in development mode.
echo Press Ctrl+C to stop.
echo.
call npm run electron-dev
pause
goto menu

:build
echo.
echo Building production app...
call npm run dist
echo.
echo Build complete! Check the dist/ folder.
pause
goto menu

:sample
echo.
echo Adding sample data...
call node scripts/init-sample-data.js
echo.
pause
goto menu

:clean
echo.
echo Cleaning build files...
rmdir /s /q build 2>nul
rmdir /s /q dist 2>nul
echo Build folders cleaned!
pause
goto menu

:reset
echo.
echo WARNING: This will delete all data!
set /p confirm="Type YES to confirm: "
if not "%confirm%"=="YES" goto menu
del /q data\loto.db 2>nul
del /q data\loto.db-journal 2>nul
rmdir /s /q data\pdfs 2>nul
rmdir /s /q data\plans 2>nul
echo Database reset! Restart the app to create a fresh database.
pause
goto menu

:opendata
echo.
echo Opening data folder...
if exist data (
    explorer data
) else (
    echo Data folder doesn't exist yet. Run the app first.
)
pause
goto menu

:exit
exit
