const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');

let mainWindow;
let db;

// Ensure data directories exist
const appPath = app.isPackaged 
  ? path.join(app.getPath('userData'), 'data')
  : path.join(__dirname, '..', 'data');

const dbPath = path.join(appPath, 'loto.db');
const pdfsPath = path.join(appPath, 'pdfs');
const plansPath = path.join(appPath, 'plans');
const personnelPath = path.join(appPath, 'personnel');
const exportsPath = path.join(appPath, 'exports');
const configPath = path.join(appPath, 'config.json');
const logPath = path.join(appPath, 'app_activity.log');

// Create directories
[appPath, pdfsPath, plansPath, personnelPath, exportsPath].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Initialize log file if not exists
if (!fs.existsSync(logPath)) {
  fs.writeFileSync(logPath, `LOTO App Activity Log - Started ${new Date().toISOString()}\n`, 'utf8');
}

// Initialize SQLite Database
function initDatabase() {
  db = new Database(dbPath);
  
  // Enable foreign keys
  db.pragma('foreign_keys = ON');
  
  // Create tables
  db.exec(`
    CREATE TABLE IF NOT EXISTS breakers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      zone TEXT NOT NULL,
      location TEXT NOT NULL,
      state TEXT DEFAULT 'Off' CHECK(state IN ('On', 'Off', 'Closed')),
      lock_key TEXT,
      general_breaker TEXT,
      last_updated DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS locks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      key_number TEXT UNIQUE NOT NULL,
      zone TEXT NOT NULL,
      used INTEGER DEFAULT 0 CHECK(used IN (0, 1)),
      assigned_to TEXT,
      remarks TEXT
    );

    CREATE TABLE IF NOT EXISTS personnel (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      lastname TEXT NOT NULL,
      id_card TEXT UNIQUE NOT NULL,
      company TEXT,
      habilitation TEXT,
      pdf_path TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS plans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      filename TEXT NOT NULL,
      file_path TEXT NOT NULL,
      version TEXT,
      uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      breaker_id INTEGER,
      action TEXT NOT NULL,
      user_mode TEXT NOT NULL CHECK(user_mode IN ('Editor', 'Visitor')),
      details TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (breaker_id) REFERENCES breakers(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS sync_queue (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      table_name TEXT NOT NULL,
      operation TEXT NOT NULL CHECK(operation IN ('INSERT', 'UPDATE', 'DELETE')),
      record_id INTEGER,
      data TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      synced BOOLEAN DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS profile_settings (
      id INTEGER PRIMARY KEY DEFAULT 1 CHECK(id = 1),
      name TEXT,
      title TEXT,
      bio TEXT,
      email TEXT,
      linkedin TEXT,
      profilePicture TEXT,
      cvFiles TEXT,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  console.log('Database initialized at:', dbPath);
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    },
    icon: path.join(__dirname, '../public/icon.ico'),
    autoHideMenuBar: true
  });

  const startUrl = process.env.ELECTRON_START_URL || 
    `file://${path.join(__dirname, '../build/index.html')}`;
  
  mainWindow.loadURL(startUrl);

  if (!app.isPackaged) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  initDatabase();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (db) db.close();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC Handlers
ipcMain.handle('db-query', async (event, sql, params = []) => {
  try {
    const stmt = db.prepare(sql);
    const result = stmt.all(params);
    return { success: true, data: result };
  } catch (error) {
    console.error('DB Query Error:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('db-run', async (event, sql, params = []) => {
  try {
    const stmt = db.prepare(sql);
    const result = stmt.run(params);
    return { success: true, data: result };
  } catch (error) {
    console.error('DB Run Error:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('get-config', async () => {
  try {
    if (fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      return { success: true, data: config };
    }
    return { success: false, error: 'Config file not found' };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('save-config', async (event, config) => {
  try {
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('save-file', async (event, { fileName, fileData, type = 'pdf' }) => {
  try {
    let targetDir;
    switch (type) {
      case 'plan':
        targetDir = plansPath;
        break;
      case 'cv':
        // Create cv directory if it doesn't exist
        const cvPath = path.join(app.getPath('userData'), 'cv');
        if (!fs.existsSync(cvPath)) {
          fs.mkdirSync(cvPath, { recursive: true });
        }
        targetDir = cvPath;
        break;
      case 'profile':
        // Create profile directory if it doesn't exist
        const profilePath = path.join(app.getPath('userData'), 'profile');
        if (!fs.existsSync(profilePath)) {
          fs.mkdirSync(profilePath, { recursive: true });
        }
        targetDir = profilePath;
        break;
      default:
        targetDir = pdfsPath;
    }
    
    const filePath = path.join(targetDir, fileName);
    
    // fileData is data URL (data:type;base64,xxxxx)
    let buffer;
    if (fileData.startsWith('data:')) {
      const base64Data = fileData.split(',')[1];
      buffer = Buffer.from(base64Data, 'base64');
    } else {
      buffer = Buffer.from(fileData, 'base64');
    }
    
    fs.writeFileSync(filePath, buffer);
    
    return { success: true, filePath: filePath, fileName: fileName };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('read-file', async (event, filePath) => {
  try {
    const buffer = fs.readFileSync(filePath);
    return { success: true, data: buffer.toString('base64') };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('select-file', async () => {
  try {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openFile'],
      filters: [
        { name: 'PDF Files', extensions: ['pdf'] },
        { name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'gif'] },
        { name: 'All Files', extensions: ['*'] }
      ]
    });
    
    if (!result.canceled && result.filePaths.length > 0) {
      const filePath = result.filePaths[0];
      const buffer = fs.readFileSync(filePath);
      const fileName = path.basename(filePath);
      
      return { 
        success: true, 
        fileName, 
        data: buffer.toString('base64') 
      };
    }
    
    return { success: false, error: 'No file selected' };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('export-csv', async (event, { fileName, data }) => {
  try {
    const result = await dialog.showSaveDialog(mainWindow, {
      defaultPath: fileName,
      filters: [{ name: 'CSV Files', extensions: ['csv'] }]
    });
    
    if (!result.canceled && result.filePath) {
      fs.writeFileSync(result.filePath, data);
      return { success: true, path: result.filePath };
    }
    
    return { success: false, error: 'Save canceled' };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('import-csv', async () => {
  try {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openFile'],
      filters: [{ name: 'CSV Files', extensions: ['csv'] }]
    });
    
    if (!result.canceled && result.filePaths.length > 0) {
      const data = fs.readFileSync(result.filePaths[0], 'utf8');
      return { success: true, data };
    }
    
    return { success: false, error: 'No file selected' };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Open file with system default application
ipcMain.handle('open-file', async (event, filePath) => {
  try {
    if (!fs.existsSync(filePath)) {
      return { success: false, error: 'File not found' };
    }
    
    const { shell } = require('electron');
    await shell.openPath(filePath);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Save a copy of CV file
ipcMain.handle('save-cv-copy', async (event, { sourcePath, displayName }) => {
  try {
    if (!fs.existsSync(sourcePath)) {
      return { success: false, error: 'Source file not found' };
    }
    
    const result = await dialog.showSaveDialog(mainWindow, {
      defaultPath: `${displayName}.pdf`,
      filters: [{ name: 'PDF Files', extensions: ['pdf'] }]
    });
    
    if (!result.canceled && result.filePath) {
      fs.copyFileSync(sourcePath, result.filePath);
      return { success: true, path: result.filePath };
    }
    
    return { success: false, error: 'Save canceled' };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Delete file
ipcMain.handle('delete-file', async (event, { fileName, type }) => {
  try {
    let targetDir;
    switch (type) {
      case 'cv':
        targetDir = path.join(app.getPath('userData'), 'cv');
        break;
      case 'profile':
        targetDir = path.join(app.getPath('userData'), 'profile');
        break;
      case 'plan':
        targetDir = plansPath;
        break;
      default:
        targetDir = pdfsPath;
    }
    
    const filePath = path.join(targetDir, fileName);
    
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return { success: true };
    }
    
    return { success: false, error: 'File not found' };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('nuke-database', async () => {
  try {
    db.exec(`
      DELETE FROM history;
      DELETE FROM plans;
      DELETE FROM personnel;
      DELETE FROM locks;
      DELETE FROM breakers;
      DELETE FROM sync_queue;
      VACUUM;
    `);
    
    // Delete all PDFs and plans
    [pdfsPath, plansPath].forEach(dir => {
      if (fs.existsSync(dir)) {
        fs.readdirSync(dir).forEach(file => {
          fs.unlinkSync(path.join(dir, file));
        });
      }
    });
    
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('get-paths', async () => {
  return {
    success: true,
    data: {
      app: appPath,
      db: dbPath,
      pdfs: pdfsPath,
      plans: plansPath,
      personnel: personnelPath,
      exports: exportsPath,
      config: configPath,
      log: logPath
    }
  };
});

// Logging handlers
ipcMain.handle('write-log', async (event, logEntry) => {
  try {
    const logLine = `[${logEntry.timestamp}] [${logEntry.level}] [${logEntry.userMode}] ${logEntry.action} ${JSON.stringify(logEntry.details)}\n`;
    fs.appendFileSync(logPath, logLine, 'utf8');
    return { success: true };
  } catch (error) {
    console.error('Error writing log:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('download-logs', async () => {
  try {
    const result = await dialog.showSaveDialog(mainWindow, {
      defaultPath: `loto_logs_${new Date().toISOString().split('T')[0]}.log`,
      filters: [{ name: 'Log Files', extensions: ['log', 'txt'] }]
    });
    
    if (!result.canceled && result.filePath) {
      const logContent = fs.readFileSync(logPath, 'utf8');
      fs.writeFileSync(result.filePath, logContent);
      return { success: true, path: result.filePath };
    }
    
    return { success: false, error: 'Save canceled' };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('clear-logs', async () => {
  try {
    fs.writeFileSync(logPath, `LOTO App Activity Log - Cleared ${new Date().toISOString()}\n`, 'utf8');
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('read-logs', async (event, lineCount = 100) => {
  try {
    const logContent = fs.readFileSync(logPath, 'utf8');
    const lines = logContent.split('\n').filter(line => line.trim());
    const recentLines = lines.slice(-lineCount);
    return { success: true, data: recentLines.join('\n') };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Download CSV template
ipcMain.handle('download-template', async (event, templateType) => {
  try {
    let csvContent = '';
    let defaultName = 'template.csv';
    
    if (templateType === 'breakers') {
      csvContent = 'name,zone,location,state,lock_key,general_breaker\n';
      csvContent += 'Example Breaker 1,Zone A,Building 1,Off,,Main Panel\n';
      csvContent += 'Example Breaker 2,Zone B,Building 2,On,,\n';
      defaultName = 'breakers_template.csv';
    } else if (templateType === 'locks') {
      csvContent = 'key_number,zone,used,assigned_to,remarks\n';
      csvContent += 'K001,Zone A,0,,\n';
      csvContent += 'K002,Zone A,0,,\n';
      defaultName = 'locks_template.csv';
    } else if (templateType === 'personnel') {
      csvContent = 'name,lastname,id_card,company,habilitation\n';
      csvContent += 'John,Doe,EMP001,ABC Company,Level 1\n';
      csvContent += 'Jane,Smith,EMP002,XYZ Company,Level 2\n';
      defaultName = 'personnel_template.csv';
    }
    
    const result = await dialog.showSaveDialog(mainWindow, {
      defaultPath: defaultName,
      filters: [{ name: 'CSV Files', extensions: ['csv'] }]
    });
    
    if (!result.canceled && result.filePath) {
      fs.writeFileSync(result.filePath, csvContent);
      return { success: true, path: result.filePath };
    }
    
    return { success: false, error: 'Save canceled' };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Open external file
ipcMain.handle('open-external', async (event, filePath) => {
  try {
    await shell.openPath(filePath);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Check dependencies
ipcMain.handle('check-dependencies', async () => {
  try {
    const dependencies = {
      nodejs: process.version,
      electron: process.versions.electron,
      chrome: process.versions.chrome,
      v8: process.versions.v8,
      sqlite: db ? 'OK' : 'Not initialized'
    };
    
    return { success: true, data: dependencies };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Repair database
ipcMain.handle('repair-database', async () => {
  try {
    // Run integrity check
    const integrityCheck = db.pragma('integrity_check');
    
    if (integrityCheck[0].integrity_check !== 'ok') {
      // Try to repair by recreating tables
      initDatabase();
      return { success: true, message: 'Database repaired and reinitialized' };
    }
    
    return { success: true, message: 'Database is healthy' };
  } catch (error) {
    return { success: false, error: error.message };
  }
});
