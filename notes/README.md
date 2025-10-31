# LOTO Key Management System 🔒⚡

> **Lockout/Tagout (LOTO) Key Management System** - A comprehensive desktop application for monitoring breaker states, lock inventory, and personnel access control.

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Platform](https://img.shields.io/badge/platform-Windows-lightgrey)

---

## 🌟 Features

### 🔐 Security & Access
- **Dual Access Modes**: Editor (full control) and Visitor (read-only)
- **Offline-First Architecture**: Full functionality without internet
- **Optional Cloud Sync**: Supabase integration for multi-device access
- **Access Control**: Configurable editor access code (default: 010203)

### 📊 Core Functionality
- **Breaker Management**: Track all electrical breakers with zone, location, and state
- **Lock Inventory**: Monitor lock usage and availability by zone
- **Personnel Control**: Manage authorized workers with PDF certificates
- **Electrical Plans**: Upload, view, and version control site plans
- **Audit Logging**: Complete history of all actions and changes

### 🎨 User Experience
- **Modern UI**: Clean, industrial design with TailwindCSS
- **Dark/Light Mode**: Theme switching with preference saving
- **Color-Coded States**: 🟢 On | ⚪ Off | 🔴 Closed (locked)
- **Responsive Design**: Optimized for desktop and tablets
- **Real-time Updates**: Instant feedback on all operations

### 📁 Data Management
- **CSV Import/Export**: Bulk operations and reporting
- **PDF Storage**: Attach certificates and documentation
- **Local Storage**: All data stored in SQLite database
- **Backup Ready**: Simple data folder structure for easy backups

---

## 🚀 Quick Start

### Prerequisites
- Windows 10 or higher
- Node.js 16+ ([Download](https://nodejs.org/))

### Installation (5 minutes)

```bash
# Clone or download this repository
cd "LOTO APP/Claude 5"

# Install dependencies
npm install

# Run the app
npm run electron-dev
```

🎉 **That's it!** The app will launch and create the database automatically.

### First Login

**Option 1: Visitor Mode** (No Password)
- Click "Visitor Mode (Read-Only)"
- View all data, export CSV, download files
- Cannot modify anything

**Option 2: Editor Mode** (Full Access)
- Click "Editor Mode"
- Enter access code: **`010203`**
- Full CRUD operations, upload files, configure settings

---

## 📖 Documentation

| Document | Description |
|----------|-------------|
| **[QUICKSTART.md](QUICKSTART.md)** | Get running in 5 minutes |
| **[INSTALL.md](INSTALL.md)** | Detailed installation guide |
| **[USAGE.md](USAGE.md)** | Complete user manual |
| **[SETUP.md](SETUP.md)** | Configuration & Supabase setup |
| **[PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md)** | Code organization |

---

## 🎯 Key Pages

### 📈 Dashboard
- System overview with statistics
- Recent activities log
- Lock/breaker usage metrics
- Quick health check

### 🔴 View by Locks
- Shows ONLY locked (closed) breakers
- Filter by zone and location
- Quick reference for active lockouts
- Lock key assignments

### ⚡ View by Breakers
- All breakers with color-coded states
- Add, edit, delete operations (Editor mode)
- Multi-filter search
- CSV export

### 📦 Storage (Lock Inventory)
- Total, used, and available locks
- Zone-wise breakdown
- Lock assignment tracking
- Usage status management

### 👥 Personnel Access Control
- Worker information management
- PDF certificate storage
- Download certifications
- Company and habilitation tracking

### 🗺️ Electrical Plans
- Upload site plans (PDF/Images)
- Version control
- In-app viewer
- Download originals

### ⚙️ Settings (Editor Only)
- Supabase cloud sync configuration
- Access code management
- System information
- **Danger Zone**: Nuclear data wipe (requires confirmation)

---

## 🛠️ Technology Stack

### Frontend
- **React** 18.2 - UI framework
- **React Router** 6.20 - Navigation
- **TailwindCSS** 3.3 - Styling system
- **Lucide React** - Beautiful icons

### Backend
- **Electron** 28.0 - Desktop application framework
- **Better-SQLite3** 9.2 - Fast local database
- **Node.js** - JavaScript runtime

### Cloud (Optional)
- **Supabase** - PostgreSQL database + file storage
- **@supabase/supabase-js** - Client library

### Utilities
- **PapaParse** - CSV parsing and generation
- **Electron Builder** - Application packaging

---

## 📦 Build for Production

```bash
# Create Windows installer
npm run dist
```

Output: `dist/LOTO Key Management Setup 1.0.0.exe`

---

## 🗂️ Data Structure

### Database Tables

**Breakers**
- id, name, zone, location, state
- lock_key, general_breaker, last_updated

**Locks**
- id, key_number, zone, used
- assigned_to, remarks

**Personnel**
- id, name, lastname, id_card
- company, habilitation, pdf_path

**Plans**
- id, filename, file_path
- version, uploaded_at

**History** (Audit Log)
- id, breaker_id, action, user_mode
- details, timestamp

### Local Storage
```
data/
├── loto.db              # SQLite database
├── config.json          # Configuration
├── pdfs/                # Personnel certificates
└── plans/               # Electrical plans
```

---

## ☁️ Supabase Setup (Optional)

1. Create free account at [supabase.com](https://supabase.com)
2. Create new project
3. Run `supabase-setup.sql` in SQL Editor
4. Create storage bucket: `loto_pdfs`
5. Add credentials in app Settings:
   - Supabase URL
   - Supabase anon key
   - Bucket name

**Benefits:**
- Multi-device access
- Automatic backups
- Remote data access
- Team collaboration

---

## 🔒 Security Notes

- Access code stored in plain text (for trusted environments)
- Local database is not encrypted
- Supabase uses HTTPS for cloud sync
- Consider enabling RLS (Row Level Security) in production
- Change default access code immediately

---

## 🧪 Development

### Run with Sample Data
```bash
# Add test data
node scripts/init-sample-data.js

# Start app
npm run electron-dev
```

### Helper Script (Windows)
```bash
# Run interactive menu
dev-helper.bat
```

Options:
1. Install dependencies
2. Run development mode
3. Build production app
4. Add sample data
5. Clean build files
6. Reset database
7. Open data folder

---

## 📋 Common Tasks

### Export All Breakers
1. Go to "View by Breakers"
2. Click "Export CSV"
3. Choose save location

### Backup Data
Copy the entire `data/` folder to a safe location.

### Reset Everything
Delete `data/loto.db` and restart the app.

### Change Access Code
1. Settings > Editor Access Code
2. Enter new code
3. Save Configuration

---

## 🐛 Troubleshooting

**App won't start?**
```bash
rm -rf node_modules
npm install
```

**Database locked?**
- Close all instances
- Delete `data/loto.db-journal`

**Port 3000 in use?**
- Close other apps on port 3000
- Or change port in package.json

**Build fails?**
```bash
npm install --save-dev electron-builder
npm run dist
```

---

## 🤝 Contributing

This is a complete, production-ready application. Feel free to:
- Fork and customize for your needs
- Report issues
- Suggest improvements
- Share your use case

---

## 📜 License

MIT License - see [LICENSE](LICENSE) file

**Free to use, modify, and distribute.**

---

## 👤 Author

**Made by Hatim RG**

Created with ❤️ for industrial safety and LOTO compliance.

---

## 🙏 Acknowledgments

- Built with modern web technologies
- Inspired by industrial safety needs
- Designed for reliability and ease of use

---

## 📞 Support

For detailed guides, see the documentation:
- Installation issues → `INSTALL.md`
- Usage questions → `USAGE.md`
- Configuration help → `SETUP.md`
- Quick start → `QUICKSTART.md`

---

## 🎉 Ready to Use!

```bash
npm install
npm run electron-dev
```

**Start managing your LOTO operations today!**

---

© 2024 LOTO Key Management System | Made by Hatim RG
