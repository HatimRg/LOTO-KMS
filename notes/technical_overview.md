# 📘 LOTO KMS - Technical Overview

**Version:** 2.0 | **Author:** [Hatim Raghib](https://www.linkedin.com/in/hatim-raghib-5b85362a5/)

---

## 🧠 1. Technical Overview (20%)

### Architecture
**LOTO KMS** is an Electron desktop app built with React, SQLite, and Supabase for cloud sync.

**Tech Stack:**
- **Frontend:** React 18.2, Tailwind CSS, Lucide Icons
- **Backend:** Node.js, Electron, SQLite3 (better-sqlite3)
- **Cloud:** Supabase (PostgreSQL + Storage)
- **Tools:** Papa Parse (CSV), IPC communication

### System Design
```
React Frontend (UI) ←→ IPC ←→ Node.js Main Process ←→ SQLite
                                      ↕
                              Supabase Cloud
```

### Offline-First Strategy
- **Primary:** Local SQLite (`/data/database.db`)
- **Backup:** Supabase PostgreSQL
- **Sync:** Manual via "Force Sync" button
- **Conflict:** Last-write-wins

### File Structure
```
├── data/          # SQLite database
├── src/
│   ├── pages/     # React pages
│   ├── components/# UI components
│   ├── utils/     # Database, sync, helpers
│   └── context/   # State management
├── electron/      # Main process
├── scripts/       # Utility batch/PowerShell scripts
├── notes/         # Documentation (this file)
└── public/        # Static assets
```

---

## ⚙️ 2. Features & Functions (60%)

### 2.1 View by Locks
**Purpose:** Display all locked (Closed) breakers

**Features:**
- 5 filters: Search, Zone, Location, State, General Breaker
- Color-coded states: 🟢 On | ⚪ Off | 🔴 Closed
- Real-time updates

**Database:**
```sql
SELECT * FROM breakers WHERE state = 'Closed'
```

**Sync:** Pulls/pushes locked breaker states

---

### 2.2 View by Breakers
**Purpose:** Full breaker management with hierarchy

**Features:**
- CRUD operations (Create, Read, Update, Delete)
- **Hierarchy:** Parent breakers control children
  - Parent → Off/Closed = Children → Off/Closed
  - Parent → On = Children unchanged
- CSV import/export
- Lock assignment
- Search & filters

**Database:**
```javascript
// Update with cascade
await db.updateBreakerWithChildren(id, { state: 'Off' });
// Children automatically updated
```

**Sync:** All breaker changes sync bidirectionally

---

### 2.3 Lock Inventory (Storage)
**Purpose:** Manage physical lock inventory

**Features:**
- "Set Total Storage" button
- Auto-generates locks (KEY-001, KEY-002...)
- Auto-removes unused locks
- Statistics: Total, In Use, Available
- Read-only display

**Database:**
```javascript
// Set total locks
addLock({ key_number: 'KEY-001', zone: 'General', used: false })
```

**Sync:** Lock inventory syncs with assignments

---

### 2.4 Personnel
**Purpose:** Staff management with qualifications

**Features:**
- Add/edit/delete personnel
- CV upload (PDF → Supabase Storage)
- Filters: Company, Habilitation Type
- CSV import/export
- Contact info (phone, email)

**Fields:**
- Name, Company, Job Title
- Habilitation Type (H0, H1, H2, B1, B2, BR, BC, etc.)
- Phone, Email, CV

**Database:**
```javascript
await db.addPersonnel({
  name, company, habilitation_type, cv_path
})
```

**Sync:** Personnel data + CV URLs sync to cloud

---

### 2.5 Electrical Plans
**Purpose:** PDF documentation management

**Features:**
- Upload PDFs to Supabase Storage
- Download/view plans
- Version tracking
- Zone organization
- Replace plans (version++)

**Database:**
```javascript
await db.addElectricalPlan({
  name, zone, file_path, version: 1
})
```

**Sync:** Plan metadata syncs, files in Supabase bucket

---

### 2.6 Dashboard
**Purpose:** Statistics overview

**Displays:**
- Total breakers | Breakers On/Total
- Total locks | Locks In Use/Total
- Total personnel
- Last sync timestamp
- System status

**Database:** Aggregates from all tables

**Sync:** Updates after sync completion

---

### 2.7 Settings
**Purpose:** Configuration & maintenance

**Features:**
- **System Info:** Version, DB size, record counts
- **Maintenance:** Repair DB, Clear cache, Rebuild indexes
- **Export Logs:** Download activity log (CSV)
- **Config Display:** Supabase URL, DB path

**Tools:**
```javascript
// Repair database
await db.run('VACUUM; REINDEX; ANALYZE');
```

**Access:** Available to both Editor and Visitor

---

### 2.8 Offline Login & Roles
**Purpose:** Secure access without internet

**Modes:**
- **Editor:** Full CRUD, sync, settings, delete
- **Visitor:** Read-only, no sync, no delete

**Login:** Access code stored locally (default: "010203")

**Database:** No authentication table, code in config

---

### 2.9 About Me Section
**Purpose:** Developer profile (editable by Editor)

**Features:**
- Profile picture upload
- CV upload (PDF)
- Editable bio, title, name
- LinkedIn link
- Project information
- Technology stack display

**Editor Mode:** Can edit everything
**Visitor Mode:** Read-only view

**Database:**
```sql
CREATE TABLE profile_settings (
  id, name, title, bio, profilePicture, cvPath
)
```

**Sync:** Profile data syncs to Supabase

---

### 2.10 Search & Filters
**Purpose:** Enhanced data discovery

**Features:**
- **Auto-suggestions:** Based on existing data
- **Dropdowns:** Zones, Locations, Companies, Habilitation Types
- **Combined filters:** AND logic across all filters
- **Real-time results:** Updates as you type

**Implementation:**
```javascript
// From constants.js
ZONES = ['Zone A', 'Zone B', 'Zone C', 'Zone D', 'General']
LOCATIONS = ['Local Technique', 'Main Building', 'Warehouse', 'Outdoor']
COMPANIES = ['Company A', 'Company B', 'Contractor']
HABILITATION_TYPES = ['H0', 'H1', 'H2', 'B1', 'B2', 'BR', 'BC', 'HC']
```

**Special Case:** "Local Technique" shows text input for specification

---

### 2.11 Sync Manager
**Purpose:** Bidirectional cloud synchronization

**Process:**
1. Check internet connection
2. Pull: Supabase → Local DB (latest data)
3. Push: Local DB → Supabase (local changes)
4. Show results: Records pulled/pushed

**Conflict Resolution:** Last-write-wins (timestamp)

**Files:**
- `syncManager.js` - Orchestration
- `supabaseClient.js` - API connection

**Sync Button:** Force Sync in header (all user modes)

**Tables Synced:**
- breakers
- locks
- personnel
- electrical_plans
- profile_settings

---

## 💎 3. App Highlight & Presentation (20%)

### What Makes LOTO KMS Unique

**LOTO KMS** (LOTO Key Management System) revolutionizes industrial safety and key management with a modern, offline-first desktop application that ensures workers can safely manage lockout/tagout procedures even without internet connectivity.

### Core Value Proposition

1. **Safety First:** Prevents unauthorized equipment activation through systematic lock tracking
2. **Offline Reliable:** Works without internet; syncs when available
3. **Hierarchical Logic:** Parent-child breaker relationships prevent unsafe states
4. **Audit Trail:** Every action logged with timestamps
5. **Role-Based Access:** Editor vs Visitor modes for security

### Industrial Applications

- **Manufacturing Plants:** Track equipment lockouts across facilities
- **Electrical Maintenance:** Manage breaker states and qualifications
- **Safety Compliance:** Maintain OSHA/LOTO compliance records
- **Multi-Team Coordination:** Share lock status across shifts
- **Documentation:** Store electrical plans and safety procedures

### Design Excellence

**Visual Design:**
- 🌙 **Dark/Light Mode:** Automatic theme switching
- 🎨 **Modern UI:** Clean Tailwind CSS design
- 🔵 **Color Coding:** Intuitive state indicators
- 📱 **Responsive:** Adapts to all screen sizes
- ✨ **Icons:** Lucide-react for clarity

**Typography:**
- Font: Inter (Google Fonts) - Modern, readable
- Hierarchy: Clear heading sizes
- Contrast: WCAG compliant

**Branding:**
- Logo: Blue gradient "H" badge
- Name: LOTO KMS (consistent everywhere)
- Footer: LinkedIn link to developer

### Data Integrity

**Local Protection:**
- SQLite ACID compliance
- Automatic backups before major operations
- Database repair tools built-in
- Activity log for audit trail

**Cloud Sync:**
- Supabase PostgreSQL (reliable)
- Conflict resolution strategy
- File storage for PDFs/CVs
- Encrypted connections (HTTPS)

**Offline Reliability:**
- Zero functionality loss without internet
- Local-first architecture
- Sync queue (future enhancement)
- Clear sync status indicators

### User Experience

**Ease of Use:**
- Intuitive navigation (sidebar)
- Search everywhere
- Keyboard shortcuts planned
- Toast notifications (non-intrusive)
- Loading states for all async operations

**Performance:**
- Fast SQLite queries (<10ms)
- Instant UI updates
- Efficient React rendering
- Lazy loading for large datasets

**Accessibility:**
- Color-blind friendly indicators
- Keyboard navigation support
- Screen reader compatible (future)
- High contrast mode (dark theme)

### Technical Innovation

**Modern Stack:**
- React 18 (latest features)
- Electron (cross-platform)
- Tailwind CSS (utility-first)
- Supabase (modern BaaS)

**Smart Features:**
- Auto-suggestions in search
- Hierarchical breaker logic
- CSV batch operations
- PDF version tracking
- Profile customization

### Continuous Improvement

**Version 2.0 Improvements:**
- ✅ Supabase cloud sync
- ✅ About Me section
- ✅ Breaker hierarchy logic
- ✅ Simplified lock inventory
- ✅ Advanced filters
- ✅ Dark mode throughout

**Planned Features:**
- Auto-sync timer
- Batch breaker operations
- Advanced search operators
- Export to Excel
- Mobile companion app

---

### Conclusion

LOTO KMS combines industrial safety requirements with modern software design, delivering a reliable, offline-capable solution that enhances workplace safety while maintaining ease of use. Built with care for real-world electrical maintenance scenarios.

---

**Made by [Hatim Raghib](https://www.linkedin.com/in/hatim-raghib-5b85362a5/)**  
Full Stack Developer | Safety Software Specialist

*"Building software that protects lives"*

---

**Documentation Version:** 2.0  
**Last Updated:** October 30, 2025  
**License:** Proprietary  
**Support:** [LinkedIn](https://www.linkedin.com/in/hatim-raghib-5b85362a5/)
