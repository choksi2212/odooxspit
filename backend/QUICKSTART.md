# 🚀 Quick Start Guide

## ⚠️ PostgreSQL Password Issue

The setup detected that the password `stock22` doesn't work for the PostgreSQL `postgres` user.

## 📋 Steps to Fix

### Step 1: Find or Reset Your PostgreSQL Password

**Option A: Use pgAdmin (Recommended)**

1. Open **pgAdmin 4** (should be installed with PostgreSQL)
2. When it asks for the "PostgreSQL Server password", try to remember what you entered during installation
3. If you remember it, note it down
4. If you forgot it, continue to Option B

**Option B: Reset Password via pgAdmin**

1. Open **pgAdmin 4**
2. If it connects successfully, right-click on **"PostgreSQL 18"** → **Properties**
3. Go to **"Definition"** tab
4. Enter a new password: `stock22`
5. Click **Save**

**Option C: Reset Password via Command Line (Administrator Required)**

1. Open **Command Prompt** or **PowerShell** as **Administrator**
2. Navigate to PostgreSQL bin folder:
   ```cmd
   cd "C:\Program Files\PostgreSQL\18\bin"
   ```
3. Run:
   ```cmd
   psql -U postgres postgres
   ```
4. If it asks for password, try common defaults: `postgres`, `admin`, or `root`
5. Once connected, run:
   ```sql
   ALTER USER postgres WITH PASSWORD 'stock22';
   \q
   ```

### Step 2: Update the Setup Script

Once you know your PostgreSQL password, update the setup script:

1. Open `backend/scripts/setup-db.cjs`
2. On line 10, change the password:
   ```javascript
   password: 'YOUR_ACTUAL_PASSWORD',  // Change this
   ```
3. Save the file

### Step 3: Run Database Setup

```bash
cd backend

# Test the connection first
npm run test:connection

# If connection works, set up the database
npm run setup:db
```

### Step 4: Run Migrations and Seed

```bash
npm run prisma:migrate
# When prompted, name it: init

npm run prisma:seed
```

### Step 5: Start the Server

```bash
npm run dev
```

## ✅ Verify Everything Works

1. Server should start at `http://localhost:4000`
2. Test health endpoint:
   ```bash
   curl http://localhost:4000/health
   ```
3. Test login:
   ```bash
   curl -X POST http://localhost:4000/api/auth/login ^
     -H "Content-Type: application/json" ^
     -d "{\"loginIdOrEmail\":\"admin01\",\"password\":\"password123\"}"
   ```

## 🆘 Still Having Issues?

### PostgreSQL Not Running?

Check if the service is running:

```powershell
Get-Service postgresql-x64-18
```

If it's not running, start it:

```powershell
Start-Service postgresql-x64-18
```

### Redis Not Running?

Check if Memurai is running:

```powershell
Get-Service Memurai
```

If not installed, download from: https://www.memurai.com/

### Port 4000 Already in Use?

Change the port in `.env`:

```env
PORT=4001
```

## 📚 Next Steps

Once everything is running:

1. Open the frontend: `cd ../front-end && npm run dev`
2. Access the app at: `http://localhost:8080`
3. Login with:
   - **Username**: `admin01`
   - **Password**: `password123`

## 🎯 What You'll Have

- ✅ PostgreSQL database with complete schema
- ✅ 3 test users (admin, manager, staff)
- ✅ 2 warehouses with 6 locations
- ✅ 8 products across 4 categories
- ✅ Sample stock movements and operations
- ✅ Real-time WebSocket server
- ✅ Redis caching and pub/sub

Enjoy building with StockMaster! 🎉

