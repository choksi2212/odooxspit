# 🚂 Railway CLI Deployment Guide

## 🎯 One-Command Deployment

Deploy your entire backend to Railway using a single script!

---

## 🚀 Quick Start

### Windows (PowerShell):
```powershell
# Run from project root
.\deploy-to-railway.ps1
```

### Windows (Batch):
```batch
# Run from project root
deploy-to-railway.bat
```

### Mac/Linux:
```bash
# Run from project root
chmod +x deploy-to-railway.sh
./deploy-to-railway.sh
```

---

## 📋 What the Script Does

The automated script will:

1. ✅ **Install Railway CLI** (if not already installed)
2. ✅ **Login to Railway** (interactive)
3. ✅ **Initialize new project**
4. ✅ **Link GitHub repository**
5. ✅ **Add PostgreSQL database**
6. ✅ **Add Redis**
7. ✅ **Generate secure JWT secrets** (random 64-char strings)
8. ✅ **Set all environment variables**
9. ✅ **Deploy backend to Railway**
10. ✅ **Run database migrations** (`prisma db push`)
11. ✅ **Seed database** with sample data
12. ✅ **Display backend URL and next steps**

**Total Time**: ~5-10 minutes (mostly waiting for Railway to build)

---

## 🛠️ Prerequisites

### 1. Install Node.js (if not already)
- Download from: https://nodejs.org/
- Verify: `node --version` (should be 20+)

### 2. Install Railway CLI
The script will do this automatically, but you can install manually:

```bash
npm install -g @railway/cli
```

### 3. Have Railway Account
- Sign up at: https://railway.app/
- Use GitHub login (recommended)

---

## 📝 Step-by-Step Usage

### Step 1: Open Terminal

**Windows**: 
- Press `Win + X` → Choose "Windows PowerShell" or "Terminal"
- Navigate to project: `cd "N:\ODOO SPIT"`

**Mac/Linux**:
- Open Terminal app
- Navigate to project: `cd /path/to/ODOO\ SPIT`

### Step 2: Run the Script

**Windows PowerShell**:
```powershell
.\deploy-to-railway.ps1
```

**Windows Batch** (double-click or run):
```batch
deploy-to-railway.bat
```

**Mac/Linux**:
```bash
chmod +x deploy-to-railway.sh
./deploy-to-railway.sh
```

### Step 3: Follow Interactive Prompts

The script will ask you:

1. **Railway Login**: Opens browser for GitHub authentication
2. **Project Name**: Enter a name (e.g., "stockmaster-backend")
3. **Confirm Actions**: Press Enter to confirm PostgreSQL/Redis additions

### Step 4: Wait for Deployment

The script will show progress:
```
✅ Railway CLI installed!
✅ Logged in successfully!
ℹ️  Step 1/7: Initializing Railway project...
ℹ️  Step 2/7: Linking to Railway project...
ℹ️  Step 3/7: Adding PostgreSQL database...
✅ PostgreSQL added!
ℹ️  Step 4/7: Adding Redis...
✅ Redis added!
ℹ️  Step 5/7: Generating JWT secrets...
✅ JWT secrets generated!
ℹ️  Step 6/7: Setting environment variables...
✅ Environment variables set!
ℹ️  Step 7/7: Deploying to Railway...
⚠️  This may take 3-5 minutes...
```

### Step 5: Get Your URLs

When complete, you'll see:
```
==========================================
✅ 🎉 Deployment Complete!
==========================================

ℹ️  Your backend is now live at:
https://stockmaster-backend-production-xxxx.up.railway.app

ℹ️  Test your backend:
  Health check: https://your-app.railway.app/health
  Warehouses:   https://your-app.railway.app/api/warehouses

ℹ️  WebSocket URL:
  wss://your-app.railway.app/ws

⚠️  Next steps:
  1. Test the endpoints above
  2. Deploy frontend to Vercel with these URLs
  3. Update CORS_ORIGIN in Railway to your Vercel URL
```

---

## 🔧 Manual Commands (Alternative)

If you prefer to run commands manually:

### Install Railway CLI
```bash
npm install -g @railway/cli
```

### Login
```bash
railway login
```

### Initialize & Link Project
```bash
cd backend
railway init
railway link
```

### Add Databases
```bash
railway add --database postgres
railway add --database redis
```

### Set Environment Variables
```bash
# Generate JWT secrets first
$JWT_SECRET = openssl rand -hex 32  # Or use online generator
$JWT_REFRESH_SECRET = openssl rand -hex 32

# Set variables
railway variables set NODE_ENV=production
railway variables set PORT=4000
railway variables set JWT_SECRET="your-secret-here"
railway variables set JWT_REFRESH_SECRET="your-refresh-secret-here"
railway variables set JWT_EXPIRES_IN=15m
railway variables set JWT_REFRESH_EXPIRES_IN=7d
railway variables set CORS_ORIGIN="http://localhost:5173"
railway variables set RATE_LIMIT_MAX=100
railway variables set RATE_LIMIT_WINDOW_MS=900000
railway variables set OTP_EXPIRY_MINUTES=10
```

### Deploy
```bash
railway up
```

### Run Migrations
```bash
railway run npx prisma db push --accept-data-loss
railway run npm run prisma:seed
```

### Get Domain
```bash
railway domain
```

---

## 🎨 Environment Variables Included

The script automatically sets:

| Variable | Value | Description |
|----------|-------|-------------|
| `NODE_ENV` | `production` | Environment mode |
| `PORT` | `4000` | Server port |
| `JWT_SECRET` | Random 64-char | Access token secret |
| `JWT_REFRESH_SECRET` | Random 64-char | Refresh token secret |
| `JWT_EXPIRES_IN` | `15m` | Access token expiry |
| `JWT_REFRESH_EXPIRES_IN` | `7d` | Refresh token expiry |
| `CORS_ORIGIN` | `localhost:5173` | Allowed origin (update later!) |
| `RATE_LIMIT_MAX` | `100` | Max requests per window |
| `RATE_LIMIT_WINDOW_MS` | `900000` | 15 min window |
| `OTP_EXPIRY_MINUTES` | `10` | OTP validity |
| `DATABASE_URL` | Auto-set by Railway | PostgreSQL connection |
| `REDIS_URL` | Auto-set by Railway | Redis connection |

---

## 📧 Optional: Add Email Variables

For password reset functionality, add after deployment:

```bash
railway variables set EMAIL_HOST=smtp.gmail.com
railway variables set EMAIL_PORT=587
railway variables set EMAIL_SECURE=false
railway variables set EMAIL_USER=your-email@gmail.com
railway variables set EMAIL_PASS=your-app-password
railway variables set EMAIL_FROM=noreply@stockmaster.com
railway variables set EMAIL_FROM_NAME=StockMaster
```

---

## 🐛 Troubleshooting

### Script Fails at Login
**Problem**: Railway login browser doesn't open

**Solution**:
```bash
railway login --browserless
# Copy the URL shown and open in browser manually
```

### "Railway CLI not found"
**Problem**: CLI not in PATH after installation

**Solution**:
```bash
# Reinstall globally
npm install -g @railway/cli

# Or use npx
npx @railway/cli login
```

### "Project already exists"
**Problem**: Railway project with same name exists

**Solution**:
```bash
# Link to existing project
railway link

# Or delete old project from Railway dashboard
```

### Deployment Fails
**Problem**: Build or runtime errors

**Solution**:
```bash
# Check logs
railway logs

# View specific service logs
railway logs --service backend
```

### Database Migration Fails
**Problem**: Prisma can't connect to database

**Solution**:
```bash
# Verify DATABASE_URL is set
railway variables

# Run migration manually
railway run npx prisma db push --force-reset
```

---

## 🔄 Updating Your Deployment

After initial deployment, to update:

```bash
# From backend directory
railway up
```

Or push to GitHub and Railway auto-deploys (if auto-deploy enabled)

---

## 📊 Useful Railway Commands

```bash
# View logs
railway logs

# View logs (follow mode)
railway logs -f

# Open Railway dashboard
railway open

# Check service status
railway status

# List environment variables
railway variables

# Remove a variable
railway variables delete VARIABLE_NAME

# Redeploy current version
railway redeploy

# SSH into your deployment
railway shell

# View project info
railway info
```

---

## 🔐 Security Notes

**After Deployment:**

1. ✅ **Update CORS_ORIGIN** after deploying frontend:
   ```bash
   railway variables set CORS_ORIGIN="https://your-app.vercel.app"
   ```

2. ✅ **Change test passwords** in database:
   ```bash
   railway run npx prisma studio
   # Update user passwords
   ```

3. ✅ **Enable 2FA** on Railway account

4. ✅ **Review environment variables** - ensure no secrets exposed

---

## 💰 Cost Monitoring

```bash
# View current usage
railway usage

# View project costs
railway pricing
```

**Free Tier**: $5 credit/month  
**Typical Usage**: $2-4/month for this app

---

## 🎯 Next Steps

After successful deployment:

1. ✅ Test all endpoints
2. ✅ Copy backend URL
3. 🚀 Deploy frontend to Vercel
4. 🔄 Update CORS settings
5. ✅ Test full application

---

## 📞 Support

- **Railway Docs**: https://docs.railway.app/
- **Railway CLI GitHub**: https://github.com/railwayapp/cli
- **Railway Discord**: https://discord.gg/railway

---

**That's it! One script, fully deployed backend! 🚀**

