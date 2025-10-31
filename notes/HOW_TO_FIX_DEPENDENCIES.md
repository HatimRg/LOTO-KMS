# 🔧 How to Fix Dependencies

If you're experiencing issues with npm packages or the app won't start, use these scripts to clean and reinstall all dependencies.

---

## 📋 What These Scripts Do

1. **Delete** `node_modules` folder (all installed packages)
2. **Delete** `package-lock.json` (dependency lock file)
3. **Clear** npm cache
4. **Reinstall** all dependencies fresh from npm registry

---

## 🚀 Quick Start

### Option 1: Batch File (Recommended for Windows)

**Double-click:**
```
fix-dependencies.bat
```

**OR run from Command Prompt:**
```cmd
cd "C:\Users\HSE-SGTM\Desktop\LOTO APP\Claude 5"
fix-dependencies.bat
```

### Option 2: PowerShell Script

**Run from PowerShell:**
```powershell
cd "C:\Users\HSE-SGTM\Desktop\LOTO APP\Claude 5"
.\fix-dependencies.ps1
```

**If you get an execution policy error:**
```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\fix-dependencies.ps1
```

---

## ⏱️ Time Required

- **Small project:** 2-3 minutes
- **Medium project (like LOTO):** 5-10 minutes
- **Large project:** 10-15 minutes

**Note:** Time depends on internet speed and computer performance.

---

## 🎯 When to Use This

Use this fix when you encounter:

- ❌ `npm install` fails
- ❌ `npm run electron-dev` crashes
- ❌ Module not found errors
- ❌ Dependency version conflicts
- ❌ Corrupted node_modules
- ❌ After updating Node.js version
- ❌ After pulling new code with dependency changes
- ❌ "better-sqlite3" or native module errors

---

## 📊 What You'll See

### Batch File Output:
```
===============================================
 LOTO App - Dependency Fix Script
===============================================

This script will:
1. Delete node_modules folder
2. Delete package-lock.json
3. Clear npm cache
4. Reinstall all dependencies

WARNING: This may take several minutes!

Press any key to continue...

[1/4] Deleting node_modules folder...
✓ node_modules deleted

[2/4] Deleting package-lock.json...
✓ package-lock.json deleted

[3/4] Clearing npm cache...
✓ npm cache cleared

[4/4] Reinstalling dependencies...
This may take 5-10 minutes...

added 1234 packages in 8m

===============================================
 ✓ SUCCESS! Dependencies reinstalled
===============================================

Next steps:
1. Run: npm run electron-dev
2. Test the application
```

---

## ⚠️ Important Notes

### Before Running

1. **Close the app** if it's running
2. **Close VS Code** (optional but recommended)
3. **Make sure you have internet connection**
4. **Don't interrupt** the process once started

### What Gets Deleted

- ✅ `node_modules/` - All installed packages (~500MB-1GB)
- ✅ `package-lock.json` - Dependency lock file
- ✅ npm cache - Temporary npm files

### What Stays Safe

- ✅ Your source code (`src/`, `public/`, `electron/`)
- ✅ Your data (`data/` folder with database)
- ✅ Your configuration files
- ✅ `package.json` (the list of dependencies)

---

## 🐛 Troubleshooting

### Script Won't Run

**Problem:** "Cannot run script"

**Solution:**
```powershell
# For PowerShell:
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass

# For Batch file:
Right-click → Run as Administrator
```

### Installation Fails

**Problem:** npm install fails with errors

**Solutions:**

1. **Check Node.js version:**
   ```cmd
   node --version
   ```
   Should be v16.x or v18.x

2. **Update npm:**
   ```cmd
   npm install -g npm@latest
   ```

3. **Clear npm cache manually:**
   ```cmd
   npm cache clean --force
   npm cache verify
   ```

4. **Run as Administrator:**
   - Right-click script → "Run as Administrator"

5. **Check internet connection:**
   ```cmd
   ping registry.npmjs.org
   ```

### Specific Module Errors

**Problem:** `better-sqlite3` or native module fails

**Solution:**
```cmd
# Install Windows Build Tools (one-time)
npm install --global windows-build-tools

# OR downgrade to Node.js 16 LTS
```

### Permission Errors

**Problem:** "Access denied" or "EPERM"

**Solutions:**

1. Close all applications using project files
2. Run script as Administrator
3. Temporarily disable antivirus
4. Check folder permissions

---

## 🔄 Manual Alternative

If scripts don't work, run these commands manually:

```cmd
# Step 1: Delete folders
rmdir /s /q node_modules
del /q package-lock.json

# Step 2: Clear cache
npm cache clean --force

# Step 3: Reinstall
npm install
```

**PowerShell equivalent:**
```powershell
Remove-Item -Recurse -Force node_modules
Remove-Item package-lock.json
npm cache clean --force
npm install
```

---

## ✅ Verification

After running the fix script, verify it worked:

### 1. Check Installation
```cmd
# Should show no errors
npm list --depth=0
```

### 2. Try Running App
```cmd
npm run electron-dev
```

### 3. Check Key Packages
```cmd
# Should show versions
npm list react electron better-sqlite3
```

---

## 📞 Still Having Issues?

### Check These:

1. **Node.js Version**
   ```cmd
   node --version
   # Should be: v16.x or v18.x
   ```

2. **npm Version**
   ```cmd
   npm --version
   # Should be: 8.x or 9.x
   ```

3. **Disk Space**
   - Need at least 2GB free space
   - node_modules can be 500MB-1GB

4. **Antivirus**
   - Some antivirus software blocks npm
   - Try temporarily disabling

5. **VPN/Proxy**
   - May need to configure npm proxy settings

### Get Help

1. Check error logs in terminal
2. Look for specific error messages
3. Search error on Google/Stack Overflow
4. Check package GitHub issues

---

## 🎯 Quick Reference

| Command | What it does |
|---------|--------------|
| `fix-dependencies.bat` | Run fix script (Windows) |
| `.\fix-dependencies.ps1` | Run fix script (PowerShell) |
| `npm install` | Install dependencies only |
| `npm cache clean --force` | Clear npm cache only |
| `npm list --depth=0` | Show installed packages |
| `npm outdated` | Check for package updates |

---

## 💡 Tips

### Speed Up Future Installs

1. **Use npm ci instead of npm install:**
   ```cmd
   npm ci
   ```
   Faster but requires package-lock.json

2. **Use package manager cache:**
   - npm automatically caches packages
   - Don't clear cache unless needed

3. **Offline mode** (if packages already cached):
   ```cmd
   npm install --prefer-offline
   ```

### Prevent Issues

1. **Commit package-lock.json** to version control
2. **Don't manually edit node_modules**
3. **Use exact versions in package.json** when needed
4. **Keep Node.js and npm updated**
5. **Run `npm audit fix`** regularly

---

## 📚 Related Files

- `package.json` - Lists all required dependencies
- `package-lock.json` - Locks exact versions (created after install)
- `node_modules/` - Contains all installed packages (created after install)
- `.npmrc` - npm configuration (if exists)

---

## 🚀 After Successful Fix

Once dependencies are fixed, run:

```cmd
# Start development server
npm run electron-dev

# Or build production app
npm run build
npm run electron
```

---

**✅ Your dependencies should now be clean and working!**

---

**Last Updated:** October 30, 2025  
**Version:** 1.0
