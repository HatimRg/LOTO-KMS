# Changelog

All notable changes to the LOTO Key Management System will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2024-10-30

### 🎉 Initial Release

#### Added
- **Dual Access Mode System**
  - Editor mode with configurable access code (default: 010203)
  - Visitor mode with read-only access
  - Session persistence with auto-login

- **Breaker Management**
  - Create, read, update, delete breakers
  - Color-coded states: 🟢 On, ⚪ Off, 🔴 Closed
  - Zone and location organization
  - Lock key assignment
  - General breaker linking
  - Multi-filter search
  - CSV export

- **Lock Inventory Management**
  - Track all locks by zone
  - Mark locks as used/available
  - Assign locks to breakers or personnel
  - Zone-wise statistics
  - Remarks and notes

- **Personnel Access Control**
  - Store personnel information
  - ID card tracking
  - Company and habilitation fields
  - PDF certificate upload and storage
  - Download certificates
  - Search and filter

- **Electrical Plans Viewer**
  - Upload electrical site plans (PDF/Images)
  - Version control
  - In-app PDF/image viewer
  - Download original files
  - Upload date tracking

- **Dashboard & Analytics**
  - Real-time statistics
  - Recent activity log
  - Breaker and lock usage metrics
  - Personnel count
  - Quick overview cards

- **View by Locks**
  - Shows only locked (closed) breakers
  - Quick reference for active lockouts
  - Zone and location filters
  - Lock key visibility

- **Settings & Configuration**
  - Supabase cloud sync configuration
  - Access code management
  - System information display
  - Danger zone with database nuke feature

- **User Interface**
  - Modern, clean design with TailwindCSS
  - Dark mode / Light mode toggle
  - Responsive layout for desktop and tablets
  - Lucide React icons
  - Smooth animations and transitions
  - Toast notifications

- **Data Management**
  - CSV import/export functionality
  - PDF file management
  - SQLite local database
  - Automatic backup capability
  - History/audit logging

- **Cloud Integration (Optional)**
  - Supabase PostgreSQL sync
  - Supabase Storage for PDFs
  - Offline-first architecture
  - Manual sync trigger

- **Desktop Features**
  - Electron-based Windows application
  - System tray integration
  - Native file dialogs
  - Auto-launch option
  - Installer with NSIS

- **Documentation**
  - Comprehensive README
  - Quick Start Guide
  - Installation Guide
  - User Manual
  - Setup Instructions
  - Project Structure Documentation
  - Deployment Guide
  - Supabase SQL Setup Script

- **Developer Tools**
  - Sample data generator script
  - Development helper batch script
  - Hot reload in development mode
  - DevTools integration

#### Technical Features
- Offline-first architecture
- Local SQLite database with Better-SQLite3
- IPC communication for security
- Context isolation enabled
- Preload script for safe IPC
- Row Level Security ready (Supabase)
- Audit trail for all actions
- Foreign key constraints
- Database indexes for performance

#### Security
- Configurable access code
- Visitor mode restrictions
- Editor mode permissions
- Safe IPC implementation
- Context isolation
- No remote code execution

#### Included Assets
- App icon (lock logo)
- Company logo placeholder
- Sample configuration files
- Database schema
- Supabase setup SQL

### Known Limitations
- Windows-only (macOS and Linux support planned)
- Single-user local database (use Supabase for multi-user)
- Access code stored in plain text (for trusted environments)
- No built-in auto-update (manual distribution)

### System Requirements
- Windows 10 or higher
- Node.js 16+ (for development)
- 500MB disk space
- 4GB RAM minimum
- 1280x720 display minimum

---

## [Unreleased] - Future Plans

### Planned Features
- Auto-update mechanism
- macOS and Linux builds
- Mobile companion app
- Barcode/QR code scanning
- Email notifications
- Advanced reporting
- Export to PDF
- Print functionality
- Custom themes
- Multi-language support
- Role-based access control
- Advanced audit logs
- Scheduled backups
- Database encryption option

### Under Consideration
- Active Directory integration
- LDAP authentication
- Custom workflows
- API for external integrations
- Mobile app (React Native)
- Web version
- Real-time sync (WebSocket)

---

## Version History

### [1.0.0] - 2024-10-30
- Initial production release
- Complete LOTO management system
- Offline-first with optional cloud sync
- Full documentation included

---

## Credits

**Created by**: Hatim RG  
**License**: MIT  
**Built with**: Electron, React, SQLite, Supabase, TailwindCSS

---

**For detailed changes and updates, see individual documentation files.**
