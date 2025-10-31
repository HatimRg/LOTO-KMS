# Deployment Guide

## Building the Application

### Prerequisites
- Node.js 16+ installed
- All dependencies installed (`npm install`)
- Clean working directory

### Build Steps

#### 1. Production Build

```bash
# Clean previous builds (optional)
npm run clean

# Build the application
npm run dist
```

#### 2. Output Location

After successful build:
```
dist/
├── win-unpacked/                          # Unpacked application
├── LOTO Key Management Setup 1.0.0.exe   # Windows installer
└── latest.yml                             # Auto-updater manifest
```

#### 3. Installation

**End users can:**
1. Download `LOTO Key Management Setup 1.0.0.exe`
2. Double-click to install
3. Follow installation wizard
4. Launch from Start Menu or Desktop

### Build Configuration

Located in `package.json`:

```json
"build": {
  "appId": "com.loto.keymanagement",
  "productName": "LOTO Key Management",
  "directories": {
    "buildResources": "public"
  },
  "files": [
    "build/**/*",
    "electron/**/*",
    "node_modules/**/*",
    "package.json"
  ],
  "win": {
    "target": "nsis",
    "icon": "public/logo.jpg"
  },
  "extraResources": [
    {
      "from": "data",
      "to": "data",
      "filter": ["**/*"]
    }
  ]
}
```

## Distribution

### Option 1: Direct Distribution
- Share the `.exe` installer file
- Users run installer on their machines
- Data stored locally per user

### Option 2: Network Share
- Install on network location
- Share access with team
- **Note**: SQLite not designed for concurrent access
- Consider Supabase for multi-user scenarios

### Option 3: USB Distribution
- Copy entire application folder
- Include portable Node.js if needed
- Run from USB drive

## Auto-Updates (Future)

To implement auto-updates:

1. Host `latest.yml` on web server
2. Configure `publish` in package.json
3. Use `electron-updater` module
4. Add update check on app start

Example:
```json
"publish": {
  "provider": "generic",
  "url": "https://your-domain.com/updates"
}
```

## Installer Customization

### Change App Name
Edit `package.json`:
```json
"productName": "Your Company LOTO System"
```

### Change Icon
Replace `public/logo.jpg` with your icon:
- Recommended: 256x256 PNG or ICO
- Square format
- Transparent background

### Add Installer Banner
Create `build/installerHeader.bmp`:
- Size: 150x57 pixels
- BMP format

### License Agreement
Create `LICENSE.txt` in root
Add to package.json:
```json
"win": {
  "license": "LICENSE.txt"
}
```

## Build Variants

### Development Build
```bash
npm run electron-dev
```
- Hot reload enabled
- DevTools open
- Source maps available

### Production Build
```bash
npm run dist
```
- Minified code
- No DevTools
- Optimized assets

### Portable Build
Edit `package.json`:
```json
"win": {
  "target": "portable"
}
```

## Multi-Platform (Future)

Currently Windows-only. To add:

### macOS
```json
"mac": {
  "category": "public.app-category.productivity",
  "target": "dmg"
}
```

### Linux
```json
"linux": {
  "target": "AppImage",
  "category": "Utility"
}
```

## Deployment Checklist

### Pre-Deployment
- [ ] Update version in `package.json`
- [ ] Test all features
- [ ] Verify database creation
- [ ] Check file permissions
- [ ] Test offline mode
- [ ] Verify Supabase sync (if configured)
- [ ] Review security settings
- [ ] Update documentation

### Build Process
- [ ] Clean build directory
- [ ] Run `npm run dist`
- [ ] Verify installer size (~150-200MB)
- [ ] Test installer on clean machine
- [ ] Verify app launches correctly
- [ ] Check data folder creation

### Post-Deployment
- [ ] Document installation process
- [ ] Create user guides
- [ ] Set up support channel
- [ ] Plan update strategy
- [ ] Monitor user feedback

## Troubleshooting Build Issues

### "Module not found"
```bash
rm -rf node_modules package-lock.json
npm install
npm run dist
```

### Build hangs
- Check antivirus settings
- Disable Windows Defender temporarily
- Close other applications

### Large installer size
- Expected: 150-200MB (includes Node.js + Electron)
- To reduce: Remove unused dependencies
- Use `npm prune --production`

### Icon not showing
- Ensure icon is square
- Use PNG or ICO format
- Size: 256x256 minimum

## CI/CD Integration (Future)

### GitHub Actions Example

```yaml
name: Build
on: [push]
jobs:
  build:
    runs-on: windows-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '16'
      - run: npm install
      - run: npm run dist
      - uses: actions/upload-artifact@v2
        with:
          name: installer
          path: dist/*.exe
```

## Version Management

### Semantic Versioning
```
MAJOR.MINOR.PATCH
  1  .  0  .  0
  
MAJOR: Breaking changes
MINOR: New features
PATCH: Bug fixes
```

### Update Version
```bash
npm version patch  # 1.0.0 -> 1.0.1
npm version minor  # 1.0.0 -> 1.1.0
npm version major  # 1.0.0 -> 2.0.0
```

## Security Considerations

### Code Signing (Recommended for Production)
1. Obtain code signing certificate
2. Add to package.json:
```json
"win": {
  "certificateFile": "cert.pfx",
  "certificatePassword": "password"
}
```

### Without Code Signing
- Users see "Unknown Publisher" warning
- Windows SmartScreen may block
- Users need to click "More info" > "Run anyway"

## Distribution Platforms

### Internal Distribution
- Company file server
- Intranet website
- Email to authorized users

### Public Distribution (if applicable)
- Company website
- GitHub Releases
- Microsoft Store (requires certification)

## Support Materials

### Include with Distribution
1. **Installation Guide** (INSTALL.md)
2. **User Manual** (USAGE.md)
3. **Quick Start** (QUICKSTART.md)
4. **Setup Guide** (SETUP.md)
5. **Release Notes**

### Create Release Notes
```markdown
# LOTO Key Management v1.0.0

## Features
- Initial release
- Offline breaker management
- Lock inventory tracking
- Personnel database
- PDF certificate storage
- Electrical plan viewer

## Known Issues
- None

## System Requirements
- Windows 10 or higher
- 500MB free disk space
- 4GB RAM minimum
```

## Maintenance

### Regular Updates
- Security patches
- Bug fixes
- Feature additions
- Dependency updates

### Update Process
1. Fix/add features
2. Update version number
3. Test thoroughly
4. Build new installer
5. Distribute to users
6. Document changes

## Backup Strategy

### User Data Protection
- Educate users to backup `data/` folder
- Provide backup script
- Consider automated backups to network
- Cloud sync via Supabase

### Example Backup Script
```batch
@echo off
set BACKUP_DIR=C:\Backups\LOTO
set DATA_DIR=%APPDATA%\LOTO Key Management\data

xcopy "%DATA_DIR%" "%BACKUP_DIR%\%date:~-4,4%%date:~-10,2%%date:~-7,2%" /E /I /Y
echo Backup completed!
pause
```

## Final Notes

- Test installer on multiple machines
- Verify all features work post-installation
- Provide clear documentation
- Set up feedback channel
- Plan for updates and maintenance

**The application is production-ready!**

---

**Made by Hatim RG**
