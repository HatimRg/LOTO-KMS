# Quick Start Guide

Get up and running in **5 minutes**!

## 1. Install (One-time setup)

```bash
npm install
```

⏱️ **Takes**: 2-5 minutes

## 2. Run the App

```bash
npm run electron-dev
```

⏱️ **Takes**: 10-30 seconds to start

## 3. Login

### Option A: Visitor Mode (No Password)
- Click **"Visitor Mode (Read-Only)"**
- You can view all data but not edit

### Option B: Editor Mode (Full Access)
- Click **"Editor Mode"**
- Enter code: **`010203`**
- You have full control

## 4. Start Using

You'll see an empty dashboard. Here's what to do first:

### Add Your First Breaker
1. Go to **"View by Breakers"** (sidebar)
2. Click **"Add Breaker"**
3. Fill in:
   - Name: `Main Panel 1`
   - Zone: `Zone A`
   - Location: `Building 1`
   - State: `Off`
4. Click **"Add"**

✅ **Done!** You just added your first breaker.

### Add a Lock
1. Go to **"Storage"** (sidebar)
2. Click **"Add Lock"**
3. Fill in:
   - Key Number: `K001`
   - Zone: `Zone A`
   - Used: ☐ (unchecked)
4. Click **"Add"**

✅ **Done!** Lock added to inventory.

### Add Personnel
1. Go to **"Personnel"** (sidebar)
2. Click **"Add Personnel"**
3. Fill in:
   - First Name: `John`
   - Last Name: `Smith`
   - ID Card: `EMP001`
   - Company: `Your Company`
4. Click **"Add"**

✅ **Done!** Personnel record created.

## 5. Next Steps

### Lock a Breaker
1. Go to **"View by Breakers"**
2. Click ✏️ **Edit** on your breaker
3. Change State to: `🔴 Closed`
4. Lock Key: `K001`
5. Click **"Update"**

Now check **"View by Locks"** - you'll see your locked breaker!

### Try Other Features
- 📊 **Dashboard**: See statistics
- 📄 **Upload PDF**: Add personnel certificates
- 🗺️ **Plans**: Upload electrical diagrams
- 📥 **Export CSV**: Download your data
- ⚙️ **Settings**: Configure Supabase (optional)
- 🌙 **Dark Mode**: Toggle in sidebar

## Sample Data (Optional)

Want to start with example data?

```bash
node scripts/init-sample-data.js
```

This adds:
- 6 breakers (2 locked)
- 6 locks (2 in use)
- 3 personnel
- Activity history

## Common Tasks

### Export Data
1. Go to **"View by Breakers"**
2. Click **"Export CSV"**
3. Choose save location

### Change Access Code
1. Go to **"Settings"** (Editor mode only)
2. Change "Editor Access Code"
3. Click **"Save Configuration"**

### Switch Modes
1. Click **"Logout"** in sidebar
2. Select different mode
3. Login again

## Build for Production

To create Windows `.exe`:

```bash
npm run dist
```

Find it in: `dist/LOTO Key Management Setup 1.0.0.exe`

## Keyboard Tips

- **Search fields**: Auto-focus on click
- **Esc**: Close any modal
- **Tab**: Navigate through form fields

## Getting Help

- 📖 **Full Guide**: See `USAGE.md`
- 🔧 **Setup**: See `SETUP.md`
- 💾 **Install**: See `INSTALL.md`

## Troubleshooting

### App won't start?
```bash
# Delete and reinstall
rm -rf node_modules
npm install
npm run electron-dev
```

### Database issues?
Delete `data/loto.db` and restart (will reset all data)

### Port 3000 in use?
Close other apps or change port in `package.json`

---

## That's It! 🎉

You're ready to manage LOTO operations!

**Made by Hatim RG**
