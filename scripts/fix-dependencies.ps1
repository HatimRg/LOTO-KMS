# LOTO App - Dependency Fix Script (PowerShell)
# This script deletes and reinstalls all npm dependencies

Write-Host "===============================================" -ForegroundColor Cyan
Write-Host " LOTO App - Dependency Fix Script" -ForegroundColor Cyan
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "This script will:" -ForegroundColor Yellow
Write-Host "1. Delete node_modules folder"
Write-Host "2. Delete package-lock.json"
Write-Host "3. Clear npm cache"
Write-Host "4. Reinstall all dependencies"
Write-Host ""
Write-Host "WARNING: This may take several minutes!" -ForegroundColor Red
Write-Host ""

$confirmation = Read-Host "Continue? (Y/N)"
if ($confirmation -ne 'Y' -and $confirmation -ne 'y') {
    Write-Host "Operation cancelled." -ForegroundColor Yellow
    exit
}

# Step 1: Delete node_modules
Write-Host ""
Write-Host "[1/4] Deleting node_modules folder..." -ForegroundColor Cyan
if (Test-Path "node_modules") {
    Remove-Item -Path "node_modules" -Recurse -Force -ErrorAction SilentlyContinue
    Write-Host "✓ node_modules deleted" -ForegroundColor Green
} else {
    Write-Host "✓ node_modules not found (already clean)" -ForegroundColor Green
}

# Step 2: Delete package-lock.json
Write-Host ""
Write-Host "[2/4] Deleting package-lock.json..." -ForegroundColor Cyan
if (Test-Path "package-lock.json") {
    Remove-Item -Path "package-lock.json" -Force
    Write-Host "✓ package-lock.json deleted" -ForegroundColor Green
} else {
    Write-Host "✓ package-lock.json not found" -ForegroundColor Green
}

# Step 3: Clear npm cache
Write-Host ""
Write-Host "[3/4] Clearing npm cache..." -ForegroundColor Cyan
npm cache clean --force
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ npm cache cleared" -ForegroundColor Green
} else {
    Write-Host "⚠ Warning: npm cache clean had issues" -ForegroundColor Yellow
}

# Step 4: Reinstall dependencies
Write-Host ""
Write-Host "[4/4] Reinstalling dependencies..." -ForegroundColor Cyan
Write-Host "This may take 5-10 minutes..." -ForegroundColor Yellow
npm install

Write-Host ""
Write-Host "===============================================" -ForegroundColor Cyan
if ($LASTEXITCODE -eq 0) {
    Write-Host " ✓ SUCCESS! Dependencies reinstalled" -ForegroundColor Green
    Write-Host "===============================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Yellow
    Write-Host "1. Run: npm run electron-dev"
    Write-Host "2. Test the application"
} else {
    Write-Host " ✗ ERROR! Installation failed" -ForegroundColor Red
    Write-Host "===============================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Troubleshooting:" -ForegroundColor Yellow
    Write-Host "1. Check your internet connection"
    Write-Host "2. Make sure Node.js is installed"
    Write-Host "3. Try running as Administrator"
    Write-Host "4. Check npm logs for details"
}

Write-Host ""
Read-Host "Press Enter to exit"
