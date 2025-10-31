# Installation Guide

## Prerequisites

- **Node.js** 16.x or higher ([Download](https://nodejs.org/))
- **npm** (comes with Node.js)
- **Windows** OS (for .exe build)

## Step 1: Install Dependencies

Open terminal in the project directory and run:

```bash
npm install
```

This will install all required packages including:
- Electron
- React
- SQLite
- Supabase client
- TailwindCSS
- And other dependencies

**Note**: Installation may take 2-5 minutes depending on your internet speed.

## Step 2: Development Mode

To run the app in development mode with hot reload:

```bash
npm run electron-dev
```

This command:
1. Starts the React development server on port 3000
2. Waits for the server to be ready
3. Launches Electron

**First Launch**: The app will create:
- `data/` folder
- `data/loto.db` (SQLite database)
- `data/config.json` (configuration file)
- `data/pdfs/` (PDF storage)
- `data/plans/` (plans storage)

## Step 3: Production Build

To create a Windows executable:

```bash
npm run dist
```

The installer will be created in:
```
dist/LOTO Key Management Setup 1.0.0.exe
```

**Build Time**: ~1-2 minutes

## Step 4: Run the Application

### From Development
```bash
npm run electron-dev
```

### From Production Build
Double-click the `.exe` file in the `dist` folder.

## First Time Setup

1. **Launch the app**
2. **Select access mode**:
   - **Visitor Mode**: Click "Visitor Mode" (no password)
   - **Editor Mode**: Click "Editor Mode" and enter code: `010203`

3. **Start using**:
   - Dashboard shows overview
   - Add breakers, locks, and personnel
   - Upload PDFs and electrical plans

## Optional: Supabase Setup

For cloud sync capabilities:

1. Create account at [supabase.com](https://supabase.com)
2. Create a new project
3. Run SQL from `supabase-setup.sql` in Supabase SQL Editor
4. Create storage bucket named `loto_pdfs`
5. In app Settings, enter:
   - Supabase URL
   - Supabase anon key
   - Bucket name

## Troubleshooting

### "npm install" fails

**Problem**: Python or build tools missing

**Solution**:
```bash
npm install --global windows-build-tools
```

### Port 3000 already in use

**Problem**: Another app using port 3000

**Solution**: 
- Close other apps using port 3000
- Or modify `package.json` to use different port

### Database locked error

**Problem**: Multiple instances running

**Solution**:
- Close all instances of the app
- Delete `data/loto.db-journal` if exists
- Restart the app

### "Module not found" errors

**Problem**: Incomplete installation

**Solution**:
```bash
rm -rf node_modules package-lock.json
npm install
```

### Build fails

**Problem**: Missing dependencies

**Solution**:
```bash
npm install --save-dev electron-builder
npm run dist
```

## System Requirements

### Minimum
- Windows 10
- 4GB RAM
- 500MB free disk space
- 1280x720 display

### Recommended
- Windows 10/11
- 8GB RAM
- 1GB free disk space
- 1920x1080 display

## Uninstallation

### Development
Simply delete the project folder

### Production Install
1. Windows Settings > Apps
2. Find "LOTO Key Management"
3. Click Uninstall

**Note**: User data in `data/` folder is not automatically deleted.

## Updates

To update the app:

1. Pull latest code or download new version
2. Run `npm install` to update dependencies
3. Run `npm run dist` to build new version

Your data in `data/` folder is preserved.

---

**Need Help?** Check SETUP.md for detailed configuration guide.

**Made by Hatim RG**
