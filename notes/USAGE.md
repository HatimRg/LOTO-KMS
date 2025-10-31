# LOTO Key Management System - User Guide

## Table of Contents
1. [Login](#login)
2. [Dashboard](#dashboard)
3. [View by Locks](#view-by-locks)
4. [View by Breakers](#view-by-breakers)
5. [Storage (Lock Inventory)](#storage)
6. [Personnel Access Control](#personnel)
7. [Electrical Plans](#electrical-plans)
8. [Settings](#settings)
9. [Tips & Best Practices](#tips)

---

## Login

### Visitor Mode
- **Access**: No password required
- **Capabilities**: View all data, download files, export CSV
- **Restrictions**: Cannot add, edit, or delete anything

### Editor Mode
- **Access**: Requires code `010203` (changeable in Settings)
- **Capabilities**: Full control - add, edit, delete, upload, configure
- **Use**: For authorized personnel only

---

## Dashboard

**Overview of system status**

- **Total Breakers**: Count of all breakers in system
- **Locked Breakers**: Breakers in "Closed" state
- **Locks In Use**: Used locks vs total inventory
- **Personnel**: Total registered personnel
- **Recent Activities**: Last 10 actions with timestamps

**Quick Insights:**
- Color-coded statistics
- Real-time activity log
- User mode and action tracking

---

## View by Locks

**Shows ONLY locked (Closed) breakers**

### Features
- Filter by zone
- Search by name, location, or key number
- See which lock is on which breaker
- View general breaker associations

### Use Cases
- Quick check of active lockouts
- Identify which keys are in use
- Verify proper lock assignments

### Table Columns
- Breaker Name
- Zone
- Location
- Lock Key (highlighted)
- General Breaker
- Last Updated

---

## View by Breakers

**Complete breaker management**

### State Color Codes
- 🟢 **Green (On)**: Breaker is energized
- ⚪ **White (Off)**: Breaker is de-energized
- 🔴 **Red (Closed)**: Breaker is locked out

### Filters
- Search by name, zone, or location
- Filter by zone
- Filter by location
- Filter by state

### Editor Actions
- ➕ **Add Breaker**: Create new breaker entry
- ✏️ **Edit**: Modify breaker details
- 🗑️ **Delete**: Remove breaker (with confirmation)
- 📥 **Export CSV**: Download all breakers

### Adding a Breaker
1. Click "Add Breaker"
2. Fill in:
   - Name (required)
   - Zone (required)
   - Location (required)
   - State (On/Off/Closed)
   - Lock Key (optional)
   - General Breaker (optional)
3. Click "Add"

### Best Practices
- Use consistent naming: "Panel-1-Main", "Sub-A-01"
- Always specify zone and location
- Update state when locking/unlocking
- Link to general breaker for traceability

---

## Storage

**Lock inventory management**

### Overview Cards
- **Total Locks**: Full inventory count
- **In Use**: Currently assigned locks
- **Available**: Free locks

### Zone Statistics
- Locks per zone breakdown
- Used vs available per zone

### Lock Management

#### Adding a Lock
1. Click "Add Lock"
2. Enter:
   - Key Number (unique identifier)
   - Zone
   - Used (checkbox if currently in use)
   - Assigned To (person/breaker)
   - Remarks (optional notes)

#### Tracking Usage
- Mark locks as "In Use" when deployed
- Assign to breaker or person
- Add remarks for special conditions
- Update when returned

### Best Practices
- Unique key numbers (e.g., "K001", "LOC-A-01")
- Update status immediately
- Track who has which lock
- Note damaged or special locks in remarks

---

## Personnel

**Personnel access control and certification**

### Features
- Store personnel information
- Attach PDF certificates (habilitations)
- Track by company
- Download certificates

### Adding Personnel
1. Click "Add Personnel"
2. Fill in:
   - First Name (required)
   - Last Name (required)
   - ID Card (required, unique)
   - Company (optional)
   - Habilitation (certification type)
   - PDF Certificate (optional)

### Uploading Certificates
- Click "Choose PDF file"
- Select certificate PDF
- Automatically named: `{id_card}_{filename}.pdf`
- Stored locally in `data/pdfs/`

### Downloading Certificates
- Click "Download" next to certificate
- PDF saves as: `certificate_{id_card}.pdf`

### Use Cases
- Verify personnel authorization
- Quick access to safety certifications
- Track authorized workers by company
- Maintain certification records

---

## Electrical Plans

**Site plan viewer and management**

### Features
- Upload electrical plans (PDF or images)
- Version tracking
- View plans in-app
- Download plans

### Uploading Plans
1. Click "Upload Plan"
2. Choose file (PDF, JPG, PNG, etc.)
3. Optional: Add version (e.g., "v1.0", "2024-01")
4. Click "Upload"

### Viewing Plans
- Click "View" to open in full screen
- Zoom and navigate PDFs
- Close to return to list

### Downloading Plans
- Click "Download" to save locally
- Original filename preserved

### Version Control
- Add version tags to track updates
- Keep multiple versions for comparison
- Date-stamped automatically

---

## Settings

**⚠️ Editor Mode Only**

### Supabase Configuration
Enable cloud sync:
- **Supabase URL**: Your project URL
- **Supabase Key**: Anon public key
- **Bucket Name**: Storage bucket (default: loto_pdfs)

### System Information
View file locations:
- Database path
- PDFs folder
- Plans folder
- Config file

### Access Code
- Change Editor mode password
- Current default: `010203`
- Used for login and critical actions

### ⚠️ Danger Zone

#### Nuke Database
**EXTREME CAUTION**

- Deletes ALL data permanently
- Removes all files
- Requires access code confirmation
- Cannot be undone

**Use only when:**
- Starting completely fresh
- Decommissioning system
- Testing/development reset

---

## Tips & Best Practices

### Data Entry
✅ **DO:**
- Use consistent naming conventions
- Update states immediately
- Add detailed remarks
- Back up data regularly

❌ **DON'T:**
- Leave fields blank unnecessarily
- Use special characters in IDs
- Forget to log lock usage
- Skip certification uploads

### Safety
- Always verify breaker state before work
- Confirm lock assignments
- Check personnel certifications
- Document all changes

### Performance
- Export CSV regularly for backups
- Clean up old history entries
- Archive unused personnel
- Keep zone/location lists organized

### Workflow Example

1. **Before Lockout:**
   - Check breaker in "View by Breakers"
   - Verify available lock in "Storage"
   - Confirm personnel certification

2. **During Lockout:**
   - Change breaker state to "Closed"
   - Assign lock key to breaker
   - Mark lock as "In Use"
   - Assign lock to person

3. **After Lockout:**
   - Change breaker state to "Off" or "On"
   - Clear lock assignment
   - Mark lock as available
   - Log completion in history

### Keyboard Shortcuts
- `Esc`: Close modals
- Search fields auto-focus
- Tab navigation in forms

### Dark Mode
- Toggle in sidebar
- Preference saved
- Easier on eyes in low light

---

## Frequently Asked Questions

**Q: Can I use this offline?**
A: Yes! Full functionality offline. Supabase is optional.

**Q: How do I backup my data?**
A: Copy the entire `data/` folder or use CSV exports.

**Q: Can multiple users access simultaneously?**
A: Not recommended for local database. Use Supabase for multi-user.

**Q: What file formats are supported?**
A: PDFs for certificates, PDF/images for plans, CSV for import/export.

**Q: How do I reset my access code?**
A: Edit `data/config.json` and change `ACCESS_CODE` field.

**Q: Is data encrypted?**
A: Local data is not encrypted. Use Supabase with SSL for secure cloud storage.

---

**Made by Hatim RG**

For technical setup, see SETUP.md
For installation, see INSTALL.md
