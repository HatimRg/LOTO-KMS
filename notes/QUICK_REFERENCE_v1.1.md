# LOTO App v1.1 - Quick Reference Guide

## 🚀 New Features at a Glance

### 1. **Logout Button** (Header)
📍 **Location**: Top-right corner of every page  
🎯 **Action**: Click red button with logout icon  
✨ **Result**: Returns to login screen

---

### 2. **CSV Templates** (Settings Page)
📍 **Location**: Settings → CSV Templates section  
🎯 **Available Templates**:
- **Breakers**: Download template for bulk breaker entry
- **Locks**: Download template for lock inventory
- **Personnel**: Download template for personnel records

**How to Use**:
1. Click desired template button
2. Choose save location
3. Fill in Excel/CSV editor
4. Import via respective page

---

### 3. **Activity Logs** (Settings Page)
📍 **Location**: Settings → Maintenance & Logs  

**Features**:
- 📊 **View Logs**: See last 50 activities in terminal-style viewer
- 📥 **Download Logs**: Save full log file for debugging
- 🔄 **Refresh**: Update log display
- 📋 **Copy**: Select and copy log text

**Log Information**:
- Timestamp (when)
- Level (INFO/SUCCESS/ERROR/WARN)
- User Mode (Editor/Visitor)
- Action (what was done)
- Details (additional context)

---

### 4. **Database Repair** (Settings Page)
📍 **Location**: Settings → Maintenance & Logs  
🎯 **Use When**:
- Database errors occur
- Data appears corrupted
- App behaves unexpectedly

**How to Use**:
1. Click "Repair Database"
2. Confirm action
3. Wait for result message
4. Restart app if needed

---

### 5. **Dependencies Status** (Settings Page)
📍 **Location**: Settings → Dependencies Status  
🎯 **Shows**:
- Node.js version
- Electron version  
- SQLite status
- Chrome rendering engine version

**Purpose**: Verify all components are working

---

### 6. **System Information** (Settings Page)
📍 **Location**: Settings → System Information  
🎯 **Shows Paths To**:
- Database file (`loto.db`)
- PDFs folder
- Plans folder
- Logs file (`app_activity.log`)
- Config file (`config.json`)

**Tip**: All paths are selectable - click and copy!

---

### 7. **Improved Text Selection**
🎯 **What Changed**:
- ✅ All table cells: Fully selectable
- ✅ All input fields: Editable text selection
- ✅ Log viewer: Copy logs easily
- ✅ System paths: Click to select
- ❌ Buttons: Not selectable (prevents accidents)

**How to Use**: Just click and drag to select text in tables or inputs

---

## 🛠️ Installation Tools

### Install Dependencies
```bash
# Auto-check and install missing packages
node scripts/install-dependencies.js
```

**What It Does**:
- Checks Node.js and npm
- Scans for missing packages
- Installs only what's needed
- Creates data directories
- Initializes config file

---

### Build Installer
```bash
# Windows batch script
scripts\build-installer.bat
```

**What It Creates**:
- Windows .exe installer
- Desktop shortcut
- Start menu entry
- Uninstaller

**Output**: `dist/LOTO Key Management Setup 1.0.0.exe`

---

### Repair Installation
```bash
# Fix corrupted installation
scripts\repair-app.bat
```

**What It Does**:
- Removes corrupted node_modules
- Clears build cache
- Reinstalls dependencies
- Removes database locks
- Resets to working state

---

## 📁 Folder Structure (After Install)

```
%APPDATA%/LOTO Key Management/data/
├── loto.db              ← SQLite database
├── config.json          ← Configuration
├── app_activity.log     ← Activity log (NEW!)
├── pdfs/                ← PDF certificates
├── plans/               ← Electrical plans
├── personnel/           ← Personnel files (NEW!)
└── exports/             ← CSV exports (NEW!)
```

---

## 🔐 Access Levels

### Visitor Mode
✅ **Can Do**:
- View all data
- Download PDFs
- Export CSV
- View logs (in Settings)

❌ **Cannot Do**:
- Add/Edit/Delete
- Upload files
- Change settings
- Repair database

### Editor Mode
✅ **Can Do**: Everything Visitor can, PLUS:
- Add/Edit/Delete data
- Upload PDFs and plans
- Download templates
- Configure Supabase
- Repair database
- Download full logs
- Change access code
- Nuke database

**Access Code**: `010203` (changeable in Settings)

---

## ⚡ Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Esc` | Close any modal |
| `Tab` | Navigate form fields |
| `Ctrl+A` | Select all (in tables/inputs) |
| `Ctrl+C` | Copy selected text |

---

## 🐛 Troubleshooting Quick Fixes

### App Won't Start
```bash
scripts\repair-app.bat
```

### Missing Data
1. Check database: Settings → System Information
2. Verify path exists
3. If not, reinstall app

### Slow Performance
1. Settings → Repair Database
2. Clear old history entries
3. Export and archive old data

### Can't Select Text
- **If in table**: Should work now (v1.1 fix)
- **If in button**: Intended behavior
- **If in input**: Click inside field first

### Logs Not Showing
1. Settings → Maintenance & Logs
2. Click "Refresh Logs"
3. If still empty, try logging action (add/edit something)

---

## 📋 Common Tasks

### Bulk Import Breakers
1. Settings → CSV Templates → Breakers Template
2. Fill template in Excel
3. Save as CSV
4. View by Breakers → (future: Import button)

### Download Activity Log
1. Settings → Maintenance & Logs
2. Click "Download Activity Logs"
3. Choose save location
4. Share with support if needed

### Change Access Code
1. Settings → Supabase Configuration
2. Find "Editor Access Code"
3. Enter new code
4. Click "Save Configuration"
5. Use new code for next login

### Repair Corrupted Database
1. Settings → Maintenance & Logs
2. Click "Repair Database"
3. Wait for "Database is healthy" or repair message
4. If problem persists, use repair-app.bat

---

## 🎯 Best Practices

### Daily Use
1. **Login** with appropriate mode
2. **Perform work** (add/edit breakers, locks, etc.)
3. **Check logs** occasionally (Settings → Logs)
4. **Logout** when done

### Weekly Maintenance
1. **Download logs** (for record-keeping)
2. **Export CSV** (backup data)
3. **Check dependencies** (Settings → Dependencies)

### Monthly Tasks
1. **Review audit trail** (Download full logs)
2. **Archive old data** (Export CSV, clear old entries)
3. **Update access code** (security)
4. **Check for app updates** (if available)

---

## 📞 Getting Help

### In-App
1. **View Logs**: Settings → Maintenance & Logs
2. **System Info**: Settings → System Information
3. **Dependencies**: Settings → Dependencies Status

### Documentation
- `README.md` - Overview
- `QUICKSTART.md` - Fast start
- `USAGE.md` - Full manual
- `UPDATES_V1.1.md` - What's new
- `REFINEMENT_COMPLETE.md` - Technical details

### Self-Help Tools
- `scripts/repair-app.bat` - Fix installation
- Settings → Repair Database - Fix data
- Settings → Download Logs - Debug info

---

## 💡 Pro Tips

1. **Select Table Data**: Click anywhere in table, drag to select multiple cells
2. **Copy Paths**: Click system paths in Settings → System Information
3. **Quick Logout**: Use header button instead of sidebar
4. **Check Online Status**: Look for WiFi icon in header
5. **Download Templates First**: Before bulk entry
6. **Regular Log Downloads**: Keep monthly archives
7. **Test Repair Tool**: In development, not production
8. **Dark Mode**: Toggle in sidebar for eye comfort
9. **Mobile Use**: Some buttons show icon-only to save space
10. **Visitor Preview**: Use Visitor mode to see read-only experience

---

## 🎉 What's New in v1.1

- ✨ Logout button in header
- ✨ CSV template downloads
- ✨ Activity log viewer
- ✨ Database repair tool
- ✨ Dependencies checker
- ✨ Improved text selection
- ✨ Better installer (desktop shortcut, etc.)
- ✨ INTEGER storage for locks
- ✨ Custom app icon everywhere
- ✨ Standalone packaging (no localhost needed)

---

**Made by Hatim RG**

**Quick Ref v1.1** | For full details see `UPDATES_V1.1.md`
