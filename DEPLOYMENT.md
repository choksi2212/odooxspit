# 🚀 Deployment Guide - StockMaster

## Overview

StockMaster consists of two parts:
- **Frontend**: React + Vite app (can deploy to Vercel)
- **Backend**: Node.js + Fastify API (requires persistent database and Redis)

---

## ⚠️ Important: Backend Deployment Considerations

**Vercel is NOT suitable for the backend** because:
- ❌ Vercel serverless functions have 10-second timeout (backend needs long-running connections)
- ❌ No persistent file system for SQLite
- ❌ WebSocket support is limited
- ❌ Redis requires persistent connection

**Recommended Backend Hosting:**
1. ✅ **Railway** - Best for full-stack apps (PostgreSQL + Redis included)
2. ✅ **Render** - Good free tier, supports PostgreSQL
3. ✅ **Fly.io** - Excellent for Node.js apps
4. ✅ **DigitalOcean App Platform** - Reliable and scalable
5. ✅ **AWS EC2/Lightsail** - Full control

---

## 🎯 Recommended Deployment Strategy

### Option 1: Frontend on Vercel + Backend on Railway (RECOMMENDED)

**Frontend → Vercel (Free)**
- Automatic deployments from GitHub
- Global CDN
- HTTPS by default
- Build time: ~2 minutes

**Backend → Railway (Free tier: $5 credit/month)**
- PostgreSQL database included
- Redis included
- WebSocket support
- Environment variables management
- Automatic HTTPS

### Option 2: Both on Railway

Deploy both frontend and backend together on Railway.

### Option 3: Both on Render

Good alternative with similar features.

---

## 📦 Deployment Steps

### 1️⃣ Deploy Backend to Railway

1. **Create Railway Account**
   - Go to https://railway.app/
   - Sign up with GitHub

2. **Create New Project**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your `odooxspit` repository

3. **Configure Backend Service**
   - Railway will auto-detect Node.js
   - Set **Root Directory**: `backend`
   - Set **Build Command**: `npm install && npx prisma generate && npm run build`
   - Set **Start Command**: `npm start`

4. **Add PostgreSQL Database**
   - Click "+ New" → "Database" → "Add PostgreSQL"
   - Railway will automatically set `DATABASE_URL` environment variable

5. **Add Redis**
   - Click "+ New" → "Database" → "Add Redis"
   - Railway will automatically set `REDIS_URL` environment variable

6. **Set Environment Variables**
   ```env
   NODE_ENV=production
   PORT=4000
   
   # JWT (generate new secrets!)
   JWT_SECRET=your-super-secret-jwt-key-min-32-chars
   JWT_REFRESH_SECRET=your-super-secret-refresh-key-min-32-chars
   JWT_EXPIRES_IN=15m
   JWT_REFRESH_EXPIRES_IN=7d
   
   # CORS (set after deploying frontend)
   CORS_ORIGIN=https://your-frontend-domain.vercel.app
   
   # Email (optional - for password reset)
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_SECURE=false
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-app-password
   EMAIL_FROM=noreply@stockmaster.com
   EMAIL_FROM_NAME=StockMaster
   
   # Redis (auto-set by Railway)
   # REDIS_URL=redis://...
   
   # Database (auto-set by Railway)
   # DATABASE_URL=postgresql://...
   ```

7. **Run Database Migration**
   - Open Railway Terminal
   - Run: `npx prisma db push`
   - Run: `npm run prisma:seed`

8. **Get Backend URL**
   - Railway will provide a URL like: `https://your-app.railway.app`
   - Save this for frontend configuration

---

### 2️⃣ Deploy Frontend to Vercel

1. **Create Vercel Account**
   - Go to https://vercel.com/
   - Sign up with GitHub

2. **Import Project**
   - Click "Add New" → "Project"
   - Import your `odooxspit` repository
   - Select "Continue with GitHub"

3. **Configure Build Settings**
   - **Framework Preset**: Vite
   - **Root Directory**: `front-end`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

4. **Set Environment Variables**
   ```env
   VITE_API_URL=https://your-backend-url.railway.app
   VITE_WS_URL=wss://your-backend-url.railway.app
   ```

5. **Deploy**
   - Click "Deploy"
   - Wait 2-3 minutes for build

6. **Update Backend CORS**
   - Go back to Railway
   - Update `CORS_ORIGIN` to your Vercel URL: `https://your-app.vercel.app`
   - Redeploy backend

---

### 3️⃣ Post-Deployment Configuration

1. **Update Frontend API URLs**
   
   If you didn't set environment variables, update `front-end/src/lib/api-client.ts`:
   ```typescript
   const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://your-backend.railway.app/api';
   ```
   
   And `front-end/src/lib/ws-client.ts`:
   ```typescript
   const WS_URL = import.meta.env.VITE_WS_URL || 'wss://your-backend.railway.app/ws';
   ```

2. **Test the Deployment**
   - Visit your Vercel URL
   - Try logging in with test credentials:
     - Login ID: `admin01`
     - Password: `password123`
   - Create a receipt, validate it
   - Check real-time updates work
   - Test stock filtering by warehouse

3. **Custom Domain (Optional)**
   - In Vercel: Settings → Domains → Add Domain
   - In Railway: Settings → Domains → Generate Domain

---

## 🔒 Security Checklist

Before going to production:

- [ ] Change all JWT secrets to strong random values
- [ ] Update default user passwords
- [ ] Enable HTTPS (automatic on Railway/Vercel)
- [ ] Set correct CORS origins
- [ ] Review and restrict API rate limits
- [ ] Enable database backups
- [ ] Set up error monitoring (Sentry)
- [ ] Configure email service properly
- [ ] Review and update security headers

---

## 📊 Monitoring

### Backend Health Check
```
GET https://your-backend.railway.app/health
```

### Frontend Health
```
https://your-app.vercel.app
```

---

## 🐛 Troubleshooting

### Backend Not Starting
- Check Railway logs
- Verify `DATABASE_URL` is set
- Ensure Prisma migrations ran

### WebSocket Not Connecting
- Check CORS settings
- Verify WebSocket URL uses `wss://` (not `ws://`)
- Ensure Redis is running

### Database Connection Failed
- Check `DATABASE_URL` format
- Verify PostgreSQL service is running
- Check connection pooling settings

### Frontend API Errors
- Check `CORS_ORIGIN` in backend
- Verify frontend is using correct API URL
- Check browser console for errors

---

## 💰 Cost Estimate

**Free Tier (Suitable for MVP/Demo):**
- Vercel: Free forever (100GB bandwidth/month)
- Railway: $5 credit/month (usually enough for low traffic)
- **Total: ~$0-5/month**

**Production (Higher Traffic):**
- Vercel Pro: $20/month
- Railway: $20-50/month (based on usage)
- **Total: ~$40-70/month**

---

## 🔄 Continuous Deployment

Both Vercel and Railway support automatic deployments:
- Push to `main` branch → Automatic deployment
- Pull requests → Preview deployments
- Rollback with one click

---

## 📞 Support

For deployment issues:
- Railway: https://docs.railway.app/
- Vercel: https://vercel.com/docs
- GitHub Issues: https://github.com/choksi2212/odooxspit/issues

---

**Last Updated**: November 22, 2025

