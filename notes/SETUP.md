# LOTO Key Management System - Setup Guide

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Run in Development Mode

```bash
npm run electron-dev
```

This will start both the React development server and Electron app.

### 3. Build for Production

```bash
npm run dist
```

This creates a Windows executable in the `dist` folder.

## Configuration

### Offline Mode (Default)

The app works fully offline without any configuration. Just install and run!

### Online Mode with Supabase

To enable cloud sync:

1. Create a Supabase account at https://supabase.com
2. Create a new project
3. Set up the following tables in Supabase SQL Editor:

```sql
-- Breakers table
CREATE TABLE breakers (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  zone TEXT NOT NULL,
  location TEXT NOT NULL,
  state TEXT DEFAULT 'Off' CHECK(state IN ('On', 'Off', 'Closed')),
  lock_key TEXT,
  general_breaker TEXT,
  last_updated TIMESTAMPTZ DEFAULT NOW()
);

-- Locks table
CREATE TABLE locks (
  id BIGSERIAL PRIMARY KEY,
  key_number TEXT UNIQUE NOT NULL,
  zone TEXT NOT NULL,
  used BOOLEAN DEFAULT false,
  assigned_to TEXT,
  remarks TEXT
);

-- Personnel table
CREATE TABLE personnel (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  lastname TEXT NOT NULL,
  id_card TEXT UNIQUE NOT NULL,
  company TEXT,
  habilitation TEXT,
  pdf_path TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Plans table
CREATE TABLE plans (
  id BIGSERIAL PRIMARY KEY,
  filename TEXT NOT NULL,
  file_path TEXT NOT NULL,
  version TEXT,
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- History table
CREATE TABLE history (
  id BIGSERIAL PRIMARY KEY,
  breaker_id BIGINT REFERENCES breakers(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  user_mode TEXT NOT NULL CHECK(user_mode IN ('Editor', 'Visitor')),
  details TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);
```

4. Create a storage bucket named `loto_pdfs` in Supabase Storage
5. Launch the app and go to Settings (Editor mode)
6. Enter your Supabase credentials:
   - **Supabase URL**: Found in Project Settings > API
   - **Supabase Key**: Use the `anon` public key from Project Settings > API
   - **Bucket**: `loto_pdfs` (or your bucket name)

## Features Overview

### Editor Mode
- Access Code: `010203` (configurable in Settings)
- Full CRUD operations on all data
- Upload PDFs and plans
- Import/Export CSV
- Configure Supabase sync
- Delete all data (nuke)

### Visitor Mode
- No password required
- View all data (read-only)
- Download PDFs and plans
- Export data to CSV
- No modifications allowed

## Data Storage

All data is stored locally in:
- **Database**: `data/loto.db` (SQLite)
- **PDFs**: `data/pdfs/`
- **Plans**: `data/plans/`
- **Config**: `data/config.json`

## CSV Import/Export

### Breaker CSV Format
Required columns:
- name
- zone
- location
- state (On/Off/Closed)

Optional columns:
- lock_key
- general_breaker

Example:
```csv
name,zone,location,state,lock_key,general_breaker
Main Breaker,Zone A,Panel 1,Off,K001,GB-1
Sub Breaker,Zone A,Panel 1,Closed,K002,Main Breaker
```

## Troubleshooting

### App won't start
- Ensure Node.js 16+ is installed
- Delete `node_modules` and run `npm install` again
- Check if port 3000 is available

### Database errors
- Delete `data/loto.db` to reset (backup first!)
- Check file permissions on data folder

### Supabase sync not working
- Verify credentials in Settings
- Check internet connection
- Ensure Supabase tables are created
- Check Supabase project is active

## Security Notes

- Access code is stored in plain text in `config.json`
- For production use, consider additional encryption
- Supabase credentials should be kept secure
- Use RLS (Row Level Security) in Supabase for production

## Support

Created by **Hatim RG**

For issues or questions, refer to the README.md file.

---

© 2024 LOTO Key Management System
