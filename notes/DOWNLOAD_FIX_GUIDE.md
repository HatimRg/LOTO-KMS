# 🔧 Download Functionality Fix Guide

**Issue:** "Can't download a thing"  
**Date:** October 30, 2025

---

## 🎯 Problem Analysis

Download issues in LOTO KMS can occur in multiple areas:
1. **Activity Log Download** (Settings page)
2. **CSV Export** (Breakers, Personnel)
3. **PDF Download** (Electrical Plans, Personnel CVs)
4. **Supabase File Download** (Cloud storage)

---

## ✅ Quick Fixes

### Fix 1: Activity Log Download (Settings Page)

**File:** `src/pages/Settings.js`

**Current Issue:** May not be implemented or broken

**Fix Implementation:**

```javascript
// Add to Settings.js

const handleExportLogs = async () => {
  try {
    // Read activity log file
    const { ipcRenderer } = window;
    const logContent = await ipcRenderer.invoke('read-file', 'app_activity.log');
    
    if (!logContent) {
      showToast('No logs found', 'info');
      return;
    }
    
    // Create blob and download
    const blob = new Blob([logContent], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `loto_activity_log_${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    showToast('Log file downloaded', 'success');
  } catch (error) {
    showToast(`Failed to export logs: ${error.message}`, 'error');
  }
};

// In JSX
<button onClick={handleExportLogs}>
  <Download className="w-4 h-4" />
  <span>Export Activity Log</span>
</button>
```

---

### Fix 2: CSV Export (Breakers/Personnel)

**Files:** `src/pages/ViewByBreakers.js`, `src/pages/Personnel.js`

**Implementation:**

```javascript
import Papa from 'papaparse';

const handleExportCSV = () => {
  try {
    // Convert data to CSV
    const csv = Papa.unparse(breakers); // or personnel
    
    // Create blob and download
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `breakers_${Date.now()}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    
    showToast('CSV exported successfully', 'success');
  } catch (error) {
    showToast(`Export failed: ${error.message}`, 'error');
  }
};
```

---

### Fix 3: PDF Download (Electrical Plans)

**File:** `src/pages/ElectricalPlans.js`

**Implementation:**

```javascript
import { downloadFile } from '../utils/supabaseClient';

const handleDownloadPDF = async (filePath, fileName) => {
  try {
    setDownloading(true);
    
    // Option 1: If stored in Supabase
    const result = await downloadFile('loto_pdfs', filePath);
    
    if (result.success) {
      const blob = result.data;
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      showToast('PDF downloaded', 'success');
    } else {
      throw new Error(result.error);
    }
  } catch (error) {
    showToast(`Download failed: ${error.message}`, 'error');
  } finally {
    setDownloading(false);
  }
};

// Option 2: If URL is direct link
const handleDownloadDirect = (url, fileName) => {
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.target = '_blank';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
};
```

---

### Fix 4: Supabase Download Helper

**File:** `src/utils/supabaseClient.js`

**Verify this function exists:**

```javascript
export const downloadFile = async (bucket, path) => {
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .download(path);
    
    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Download error:', error);
    return { success: false, error: error.message };
  }
};
```

---

## 🔍 Debugging Steps

### Step 1: Check Console Errors

Open browser DevTools:
```
Right-click in app → Inspect → Console tab
```

Look for errors when clicking download buttons.

### Step 2: Check IPC Communication

If downloads involve files from electron main process:

**In `electron/main.js`:**
```javascript
ipcMain.handle('read-file', async (event, fileName) => {
  try {
    const filePath = path.join(__dirname, '..', fileName);
    const content = fs.readFileSync(filePath, 'utf8');
    return content;
  } catch (error) {
    console.error('Read file error:', error);
    return null;
  }
});
```

### Step 3: Check Blob Creation

Test blob creation in browser console:
```javascript
const testBlob = new Blob(['test content'], { type: 'text/plain' });
const url = window.URL.createObjectURL(testBlob);
console.log(url); // Should show: blob:http://...
```

### Step 4: Check Browser Download Settings

- Ensure browser allows downloads
- Check if download folder is accessible
- Disable "Ask where to save files" (might block)

---

## 🛠️ Complete Download Component

Here's a reusable download helper:

**Create:** `src/utils/downloadHelper.js`

```javascript
/**
 * Universal Download Helper for LOTO KMS
 */

export const downloadHelper = {
  /**
   * Download text file (logs, CSV)
   */
  downloadText: (content, fileName, mimeType = 'text/plain') => {
    try {
      const blob = new Blob([content], { type: mimeType });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  /**
   * Download CSV
   */
  downloadCSV: (data, fileName) => {
    const Papa = require('papaparse');
    const csv = Papa.unparse(data);
    return downloadHelper.downloadText(csv, fileName, 'text/csv;charset=utf-8;');
  },

  /**
   * Download blob (PDF, images)
   */
  downloadBlob: (blob, fileName) => {
    try {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  /**
   * Download from URL
   */
  downloadFromURL: async (url, fileName) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      return downloadHelper.downloadBlob(blob, fileName);
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  /**
   * Download from Supabase
   */
  downloadFromSupabase: async (supabase, bucket, path, fileName) => {
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .download(path);
      
      if (error) throw error;
      return downloadHelper.downloadBlob(data, fileName);
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
};

export default downloadHelper;
```

**Usage:**

```javascript
import downloadHelper from '../utils/downloadHelper';

// Download CSV
const result = downloadHelper.downloadCSV(breakers, 'breakers.csv');

// Download log
const logResult = downloadHelper.downloadText(logContent, 'activity.log');

// Download PDF from Supabase
const pdfResult = await downloadHelper.downloadFromSupabase(
  supabase, 
  'loto_pdfs', 
  'plans/file.pdf', 
  'electrical_plan.pdf'
);

if (result.success) {
  showToast('Downloaded successfully', 'success');
} else {
  showToast(`Download failed: ${result.error}`, 'error');
}
```

---

## 🧪 Testing Downloads

### Test 1: Simple Text Download
```javascript
// Add temporary button in any page
<button onClick={() => {
  const blob = new Blob(['Test content'], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'test.txt';
  a.click();
  URL.revokeObjectURL(url);
}}>
  Test Download
</button>
```

### Test 2: CSV Download
```javascript
import Papa from 'papaparse';

const testData = [
  { name: 'Test', zone: 'A', state: 'On' },
  { name: 'Test2', zone: 'B', state: 'Off' }
];

const csv = Papa.unparse(testData);
// Then download using blob method
```

### Test 3: Check PapaParse
```javascript
// In browser console
import Papa from 'papaparse';
console.log(Papa); // Should show Papa object
```

---

## 🚨 Common Issues & Solutions

### Issue 1: "Blob is not defined"
**Solution:** Blob is native in browser, check if running in correct context

### Issue 2: "Cannot create object URL"
**Solution:** 
```javascript
// Add error handling
try {
  const url = window.URL.createObjectURL(blob);
} catch (error) {
  console.error('Blob error:', error);
  // Fallback method
}
```

### Issue 3: Download starts but file empty
**Solution:** Check blob content before creating URL
```javascript
console.log('Blob size:', blob.size);
console.log('Blob type:', blob.type);
```

### Issue 4: Supabase download fails
**Solutions:**
1. Check Supabase bucket permissions
2. Verify file path is correct
3. Check Supabase key is valid
4. Test connection: `supabase.storage.from('loto_pdfs').list()`

### Issue 5: CSV export missing data
**Solution:** Check PapaParse config
```javascript
const csv = Papa.unparse(data, {
  quotes: true,
  header: true,
  skipEmptyLines: true
});
```

---

## ✅ Implementation Checklist

- [ ] Install/verify PapaParse: `npm list papaparse`
- [ ] Create `downloadHelper.js` utility
- [ ] Add download buttons to pages
- [ ] Implement log export in Settings
- [ ] Implement CSV export in ViewByBreakers
- [ ] Implement CSV export in Personnel
- [ ] Implement PDF download in ElectricalPlans
- [ ] Test all download functions
- [ ] Add loading states during downloads
- [ ] Add toast notifications
- [ ] Handle errors gracefully

---

## 📞 Still Not Working?

### Check These:

1. **Browser Console:**
   - Press F12
   - Look for errors
   - Check Network tab during download

2. **Electron Logs:**
   - Check terminal where app is running
   - Look for IPC errors

3. **File Paths:**
   - Verify Supabase paths are correct
   - Check local file paths

4. **Permissions:**
   - Check Supabase bucket permissions
   - Check local folder write permissions

5. **Dependencies:**
   ```bash
   npm list papaparse
   npm list @supabase/supabase-js
   ```

---

## 🎯 Quick Test

Add this to any page to test downloads:

```javascript
<button onClick={() => {
  const content = 'Test download content';
  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'test.txt';
  a.click();
  URL.revokeObjectURL(url);
  alert('If file downloaded, downloads work!');
}}>
  🧪 Test Download
</button>
```

If this works, the issue is in your specific download implementation, not the browser/system.

---

**Created:** October 30, 2025  
**Purpose:** Fix all download functionality in LOTO KMS  
**Status:** Ready to implement
