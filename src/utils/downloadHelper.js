/**
 * Universal Download Helper for LOTO KMS
 * Handles all file downloads (CSV, PDF, logs, templates)
 */

/**
 * Download any text content as a file
 */
export const downloadTextFile = (content, filename, mimeType = 'text/plain') => {
  try {
    const blob = new Blob([content], { type: mimeType });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    return { success: true };
  } catch (error) {
    console.error('Download error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Download CSV data
 */
export const downloadCSV = (data, filename) => {
  try {
    // If data is already a string, use it directly
    if (typeof data === 'string') {
      return downloadTextFile(data, filename, 'text/csv;charset=utf-8;');
    }

    // If data is array, convert to CSV using Papa Parse
    const Papa = require('papaparse');
    const csv = Papa.unparse(data, {
      quotes: true,
      header: true
    });
    
    return downloadTextFile(csv, filename, 'text/csv;charset=utf-8;');
  } catch (error) {
    console.error('CSV download error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Download blob (for PDFs, images, etc.)
 */
export const downloadBlob = (blob, filename) => {
  try {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    return { success: true };
  } catch (error) {
    console.error('Blob download error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Download from URL (fetch and download)
 */
export const downloadFromURL = async (url, filename) => {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    
    const blob = await response.blob();
    return downloadBlob(blob, filename);
  } catch (error) {
    console.error('URL download error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Download template file from public folder
 */
export const downloadTemplate = async (templateName) => {
  try {
    const url = `/templates/${templateName}`;
    const filename = templateName;
    return await downloadFromURL(url, filename);
  } catch (error) {
    console.error('Template download error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Download activity log
 */
export const downloadActivityLog = async () => {
  try {
    // Try to read log file via IPC if available
    if (window.ipcRenderer) {
      const logContent = await window.ipcRenderer.invoke('read-file', 'app_activity.log');
      
      if (logContent) {
        const filename = `loto_activity_log_${Date.now()}.txt`;
        return downloadTextFile(logContent, filename, 'text/plain');
      }
    }
    
    // Fallback: return info message
    return {
      success: false,
      error: 'Log file not found or cannot be accessed'
    };
  } catch (error) {
    console.error('Log download error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Download PDF file from local storage
 */
export const downloadPDF = async (pdfPath, filename) => {
  try {
    // If it's a blob URL or data URL
    if (pdfPath.startsWith('blob:') || pdfPath.startsWith('data:')) {
      const response = await fetch(pdfPath);
      const blob = await response.blob();
      return downloadBlob(blob, filename);
    }
    
    // If it's a relative path
    if (pdfPath.startsWith('/')) {
      return await downloadFromURL(pdfPath, filename);
    }
    
    // Otherwise treat as URL
    return await downloadFromURL(pdfPath, filename);
  } catch (error) {
    console.error('PDF download error:', error);
    return { success: false, error: error.message };
  }
};

export default {
  downloadTextFile,
  downloadCSV,
  downloadBlob,
  downloadFromURL,
  downloadTemplate,
  downloadActivityLog,
  downloadPDF
};
