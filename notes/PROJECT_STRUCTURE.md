# Project Structure

```
LOTO-APP/
│
├── data/                          # Application data (created on first run)
│   ├── loto.db                   # SQLite database
│   ├── config.json               # Configuration file
│   ├── pdfs/                     # Personnel certificates
│   └── plans/                    # Electrical plans
│
├── electron/                      # Electron main process
│   ├── main.js                   # Main Electron entry point
│   └── preload.js                # Preload script for IPC
│
├── public/                        # Static assets
│   ├── index.html                # HTML template
│   ├── logo.jpg                  # App icon
│   └── company-logo.jpg          # Company branding
│
├── scripts/                       # Utility scripts
│   └── init-sample-data.js       # Sample data generator
│
├── src/                           # React application source
│   ├── components/               # Reusable components
│   │   ├── Layout.js            # Main layout with sidebar
│   │   └── Login.js             # Login page
│   │
│   ├── context/                  # React context
│   │   └── AppContext.js        # Global app state
│   │
│   ├── pages/                    # Page components
│   │   ├── Dashboard.js         # Overview dashboard
│   │   ├── ViewByLocks.js       # Locked breakers view
│   │   ├── ViewByBreakers.js    # All breakers management
│   │   ├── Storage.js           # Lock inventory
│   │   ├── Personnel.js         # Personnel management
│   │   ├── ElectricalPlans.js   # Plans viewer
│   │   └── Settings.js          # Configuration & danger zone
│   │
│   ├── utils/                    # Utility functions
│   │   ├── database.js          # Database operations
│   │   ├── supabase.js          # Supabase sync
│   │   └── csvHelper.js         # CSV import/export
│   │
│   ├── App.js                    # Main React component
│   ├── index.js                  # React entry point
│   └── index.css                 # Global styles
│
├── .env.example                   # Environment template
├── .gitignore                     # Git ignore rules
├── .npmrc                         # NPM configuration
├── LICENSE                        # MIT License
├── package.json                   # Dependencies & scripts
├── postcss.config.js              # PostCSS configuration
├── tailwind.config.js             # Tailwind CSS config
│
├── README.md                      # Project overview
├── INSTALL.md                     # Installation guide
├── SETUP.md                       # Setup instructions
├── USAGE.md                       # User manual
├── QUICKSTART.md                  # Quick start guide
├── PROJECT_STRUCTURE.md           # This file
└── supabase-setup.sql             # Supabase SQL schema
```

## Key Directories

### `/data` - Application Data
- Created automatically on first run
- Contains all user data
- **Backup this folder** to preserve data
- Not tracked in git

### `/electron` - Desktop App Backend
- Main process handles OS interactions
- IPC communication with React
- Database operations
- File system access

### `/src` - React Frontend
- User interface components
- Business logic
- State management
- Styling with TailwindCSS

### `/public` - Static Assets
- Not processed by React
- Served as-is
- Icons and images

## Key Files

### `package.json`
- Project dependencies
- Build scripts
- Electron configuration

### `electron/main.js`
- Electron entry point
- Creates app window
- Database initialization
- IPC handlers

### `src/App.js`
- React router
- Authentication flow
- Main app structure

### `src/context/AppContext.js`
- Global state management
- User mode tracking
- Theme preferences
- Online/offline status

### `data/config.json`
- Supabase credentials
- Access code
- User preferences

## Data Flow

```
User Interface (React)
       ↓
   IPC Channel
       ↓
Main Process (Electron)
       ↓
SQLite Database
       ↓
Optional: Supabase Sync
```

## Build Process

### Development
1. React dev server starts (port 3000)
2. Electron connects to dev server
3. Hot reload enabled
4. DevTools available

### Production
1. React builds to `/build`
2. Electron bundles with build
3. Installer created in `/dist`
4. App includes Node.js runtime

## Technology Stack

### Frontend
- **React** 18.2 - UI framework
- **React Router** 6.20 - Navigation
- **TailwindCSS** 3.3 - Styling
- **Lucide React** - Icons

### Backend
- **Electron** 28.0 - Desktop framework
- **Better-SQLite3** 9.2 - Local database
- **Node.js** - Runtime

### Cloud (Optional)
- **Supabase** - PostgreSQL + Storage
- **@supabase/supabase-js** - Client library

### Utilities
- **PapaParse** - CSV handling
- **Electron Builder** - Packaging

## Security Considerations

### Local Security
- Access code stored in plain text
- Database not encrypted
- Suitable for trusted environments

### Network Security
- Supabase uses HTTPS
- API keys should be kept secure
- Consider RLS policies in production

### Recommendations
- Change default access code
- Restrict file system permissions
- Use environment variables for secrets
- Enable Supabase RLS for multi-user

## Extending the App

### Adding a New Page
1. Create component in `src/pages/`
2. Add route in `src/App.js`
3. Add nav item in `src/components/Layout.js`
4. Import icons from `lucide-react`

### Adding Database Table
1. Add schema in `electron/main.js`
2. Create helper functions in `src/utils/database.js`
3. Update Supabase schema in `supabase-setup.sql`

### Adding New Feature
1. Design UI component
2. Add database operations
3. Implement IPC if needed
4. Add to appropriate page
5. Test offline and online

## Performance Tips

- SQLite indexes on frequently queried columns
- Pagination for large datasets
- Lazy loading for images/PDFs
- Debounce search inputs
- Cache frequently accessed data

## Maintenance

### Regular Tasks
- Update dependencies: `npm update`
- Clear old history entries
- Archive unused records
- Backup `data/` folder
- Test Supabase sync

### Monitoring
- Check database size
- Monitor sync errors
- Review audit logs
- Verify file integrity

---

**Made by Hatim RG**
