# 🧪 Testing Guide - LOTO KMS v3.0

**Quick guide to test all fixes**

---

## 🚀 Start the App

```bash
cd "c:/Users/HSE-SGTM/Desktop/LOTO APP/Claude 5"
npm start
```

Wait for browser to open at `http://localhost:3000`

---

## ✅ Test Checklist

### 1. Login Page
- [ ] **Logo visible** - Should see SGTM company logo (circular, at top)
- [ ] **"LOTO KMS" title** - Updated from "LOTO System"
- [ ] **"SGTM" text** - Company name below title
- [ ] Click "Visitor Mode" → Should enter app

### 2. Sidebar/Header
- [ ] **Logo in sidebar** - Top left corner
- [ ] **"LOTO KMS" text** - Next to logo
- [ ] Logo should NOT be Lock icon (unless logo failed to load)

### 3. Dashboard
**Expected Order:**
1. Total Breakers (blue)
2. Breakers ON (green)
3. Breakers Locked (red)
4. Personnel (purple)
5. Locks in Use (yellow)

**Test:**
- [ ] Stats show in correct order above
- [ ] Numbers show (not all zeros)
- [ ] **Recent Activities** section at bottom
- [ ] Recent Activities NOT blank
- [ ] Auto-refresh: Wait 5 seconds, numbers should update if data changes

### 4. Lock Storage
- [ ] Go to **Storage** page
- [ ] Click "Add Lock"
- [ ] Fill form and submit
- [ ] **Toast notification** shows: "Lock added successfully"
- [ ] Lock appears in table
- [ ] Go back to Dashboard → Lock count updated

### 5. Personnel - PDF Upload
- [ ] Go to **Personnel** page
- [ ] Click "Import CSV" button (green) - should open file selector
- [ ] Click "Add Personnel" button (blue)
- [ ] Fill: Name, Lastname, ID Card
- [ ] Click "Click to upload PDF"
- [ ] Select any PDF file
- [ ] **Toast shows:** "PDF selected: filename.pdf"
- [ ] Click "Add"
- [ ] **Toast shows:** "Personnel added successfully"
- [ ] Person appears in table

### 6. Electrical Plans
- [ ] Go to **Electrical Plans** page
- [ ] Click "Upload Plan"
- [ ] Click "Click to upload PDF"
- [ ] Select any PDF file
- [ ] **Toast shows:** "PDF selected: filename.pdf"
- [ ] (Optional) Enter version like "v1.0"
- [ ] Click "Upload"
- [ ] **Toast shows:** "Electrical plan uploaded successfully"
- [ ] Plan appears in list

### 7. Breakers - Update Test
- [ ] Go to **View by Breakers** page
- [ ] Click "Add Breaker"
- [ ] Select Zone → SubZone should populate
- [ ] Select Location
- [ ] Select State
- [ ] Click "Add"
- [ ] **Toast shows:** "Breaker added successfully"
- [ ] **No errors in browser console** (F12)
- [ ] Go to Dashboard → Recent Activities shows "Breaker added"

### 8. Settings - About Section
- [ ] Go to **Settings** page (Editor mode only)
- [ ] Scroll to bottom
- [ ] **About section visible**
- [ ] Shows:
   - Company: **SGTM**
   - System: **LOTO Key Management System (KMS)**
   - Description: "An internal SGTM application developed to digitalize..."
   - Version 3.0
   - © 2025 SGTM

---

## 🐛 Check for Errors

### Open Browser Console (F12)

**Expected: NO errors**

**Specifically check for:**
- ❌ ~~NotFoundError: Failed to execute 'transaction'~~ ← Should NOT appear
- ❌ ~~SQL query in browser mode~~ ← Should NOT appear
- ❌ ~~SQL run in browser mode~~ ← Should NOT appear

**What you SHOULD see:**
- ✅ "✅ Using Electron SQLite database" OR "⚠️ IPC not available - using IndexedDB fallback"
- ✅ "✅ Local database (IndexedDB) connected"
- ✅ "✅ IndexedDB schema created/updated - Version 2"

---

## 📊 Expected Results

### All Tests Should:
✅ Show toast notifications  
✅ Update Dashboard stats  
✅ Populate Recent Activities  
✅ Store files (PDFs)  
✅ No console errors  
✅ No NotFoundError  
✅ Logo visible everywhere  
✅ SGTM branding present  

---

## 🔧 If Something Doesn't Work

### Clear Browser Cache:
1. Open Developer Tools (F12)
2. Right-click Reload button
3. Select "Empty Cache and Hard Reload"

### Reset Database:
1. Go to Settings (Editor mode: code `010203`)
2. Click "Danger Zone" → "Delete All Data"
3. Enter access code: `010203`
4. Confirm deletion
5. Page reloads with fresh database

### Check Console:
1. Press F12
2. Go to Console tab
3. Look for error messages
4. Send screenshot if issues persist

---

## 📸 Screenshots Checklist

**Take screenshots of:**
1. Login page with logo
2. Dashboard with stats in correct order
3. Recent Activities (populated)
4. Storage page with locks
5. Personnel page with Import CSV button
6. Electrical Plans page with plans
7. Settings → About section
8. Browser console (showing no errors)

---

## ✅ Success Criteria

**All fixed when:**

✅ Logo appears on login and sidebar  
✅ Dashboard stats in order: Total Breakers, Breakers ON, Breakers Locked, Personnel, Locks in Use  
✅ Recent Activities shows data (not blank)  
✅ Lock storage add/edit/delete works with toasts  
✅ Personnel PDF upload works and stores  
✅ Electrical plans upload and display  
✅ Breaker add/edit works without errors  
✅ About section shows SGTM info  
✅ NO NotFoundError in console  
✅ NO "SQL in browser mode" warnings  

---

## 🎉 You're Done!

If all tests pass:
- ✅ System is ready for production
- ✅ All 7 issues from request are fixed
- ✅ Database schema correct
- ✅ File uploads working
- ✅ Branding integrated

**Enjoy your LOTO Key Management System!** 🚀

---

**Version:** 3.0 Final  
**Last Updated:** Oct 31, 2025
