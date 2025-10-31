@echo off
echo Moving markdown files to notes folder...

move "ALL_FEATURES_COMPLETE.md" "notes\" 2>nul
move "CHANGELOG.md" "notes\" 2>nul
move "DEPLOYMENT.md" "notes\" 2>nul
move "FINAL_IMPLEMENTATION_SUMMARY.md" "notes\" 2>nul
move "FIXES_AND_FEATURES_SUMMARY.md" "notes\" 2>nul
move "HOW_TO_FIX_DEPENDENCIES.md" "notes\" 2>nul
move "IMPLEMENTATION_GUIDE_REMAINING_FEATURES.md" "notes\" 2>nul
move "IMPLEMENTATION_PROGRESS.md" "notes\" 2>nul
move "INSTALL.md" "notes\" 2>nul
move "MAJOR_UPDATE_IMPLEMENTATION_PLAN.md" "notes\" 2>nul
move "MAJOR_UPDATE_README.md" "notes\" 2>nul
move "PROJECT_COMPLETE.md" "notes\" 2>nul
move "PROJECT_STRUCTURE.md" "notes\" 2>nul
move "QUICKSTART.md" "notes\" 2>nul
move "QUICK_REFERENCE_v1.1.md" "notes\" 2>nul
move "README_FIX_SCRIPTS.md" "notes\" 2>nul
move "REFINEMENT_COMPLETE.md" "notes\" 2>nul
move "SETUP.md" "notes\" 2>nul
move "TROUBLESHOOTING_NPM_ERRORS.md" "notes\" 2>nul
move "UPDATES_V1.1.md" "notes\" 2>nul
move "USAGE.md" "notes\" 2>nul

echo.
echo Moving script files to scripts folder...

move "QUICK-FIX-NOW.bat" "scripts\" 2>nul
move "dev-helper.bat" "scripts\" 2>nul
move "fix-dependencies-advanced.bat" "scripts\" 2>nul
move "fix-dependencies.bat" "scripts\" 2>nul
move "fix-dependencies.ps1" "scripts\" 2>nul

echo.
echo Done! Files organized.
pause
