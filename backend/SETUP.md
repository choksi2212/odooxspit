# StockMaster Backend Setup Guide

## Prerequisites

Before starting, ensure you have the following installed:

- **Node.js 20+**: [Download here](https://nodejs.org/)
- **PostgreSQL 14+**: [Download here](https://www.postgresql.org/download/)
- **Redis 7+**: [Download here](https://redis.io/download/)
- **Git**: [Download here](https://git-scm.com/)

## Step 1: Install Dependencies

```bash
cd backend
npm install
```

## Step 2: Database Setup

### Option A: Using PostgreSQL Default Setup

1. **Start PostgreSQL service** (Windows):
   - Open Services (Win + R, type `services.msc`)
   - Find "postgresql-x64-XX" service
   - Click "Start" if not running

2. **Create database and user**:

Open PowerShell as Administrator and run:

```powershell
# Connect to PostgreSQL (default user is usually 'postgres')
psql -U postgres

# In psql prompt, run these commands:
CREATE USER stockmaster WITH PASSWORD 'password';
CREATE DATABASE stockmaster OWNER stockmaster;
GRANT ALL PRIVILEGES ON DATABASE stockmaster TO stockmaster;

# Exit psql
\q
```

### Option B: Using GUI Tool (pgAdmin)

1. Open pgAdmin
2. Right-click "Login/Group Roles" → Create → Login/Group Role
   - Name: `stockmaster`
   - Password: `password` (in Definition tab)
   - Check "Can login?" (in Privileges tab)
3. Right-click "Databases" → Create → Database
   - Name: `stockmaster`
   - Owner: `stockmaster`

### Option C: Custom Configuration

If you want different database credentials:

1. Create your database and user with your preferred names
2. Update the `.env` file with your credentials:

```env
DATABASE_URL=postgresql://YOUR_USER:YOUR_PASSWORD@localhost:5432/YOUR_DATABASE
```

## Step 3: Redis Setup

### Windows
1. **Install Redis** (using Memurai or WSL):
   - **Memurai** (Redis for Windows): [Download](https://www.memurai.com/)
   - Or use **WSL2** with Redis

2. **Start Redis**:
   ```bash
   # If using Memurai, it runs as a service
   # Check status in Services
   
   # If using WSL:
   wsl
   sudo service redis-server start
   redis-cli ping  # Should return PONG
   ```

### Verify Redis Connection
```bash
redis-cli
> PING
PONG
> exit
```

## Step 4: Environment Configuration

1. Copy the example environment file:
```bash
copy .env.example .env
```

2. Edit `.env` with your configuration:

```env
# Server
NODE_ENV=development
PORT=4000
HOST=0.0.0.0

# Database (Update if you used different credentials)
DATABASE_URL=postgresql://stockmaster:password@localhost:5432/stockmaster

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# JWT Secrets (CHANGE THESE!)
JWT_ACCESS_SECRET=your-super-secret-access-token-key-change-this-in-production
JWT_REFRESH_SECRET=your-super-secret-refresh-token-key-change-this-in-production
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# CORS
CORS_ORIGIN=http://localhost:8080

# Rate Limiting
RATE_LIMIT_MAX=100
RATE_LIMIT_TIMEWINDOW=60000

# OTP
OTP_EXPIRY_MINUTES=10

# Logging
LOG_LEVEL=info
```

## Step 5: Generate Prisma Client

```bash
npm run prisma:generate
```

## Step 6: Run Database Migrations

```bash
npm run prisma:migrate
```

This will:
- Create all database tables
- Set up indexes and constraints
- Apply the schema to your database

When prompted for migration name, you can use: `init`

## Step 7: Seed Database with Sample Data

```bash
npm run prisma:seed
```

This creates:
- 3 test users (admin, manager, staff)
- 2 warehouses with 6 locations
- 4 product categories
- 8 products
- 6 sample operations with stock movements

**Test User Credentials**:
- **Admin**: `admin01` / `password123`
- **Manager**: `manager01` / `password123`
- **Staff**: `staff01` / `password123`

## Step 8: Verify Setup

```bash
# Check database connection
npm run prisma:studio
# Opens Prisma Studio at http://localhost:5555
```

## Step 9: Start Development Server

```bash
npm run dev
```

Server will start at:
- **API**: `http://localhost:4000`
- **WebSocket**: `ws://localhost:4000/ws`
- **Health Check**: `http://localhost:4000/health`

## Step 10: Test the API

### Using curl:

```bash
# Health check
curl http://localhost:4000/health

# Login
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"loginIdOrEmail\":\"admin01\",\"password\":\"password123\"}"

# This returns an access token. Use it in subsequent requests:
curl http://localhost:4000/api/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Using Postman/Insomnia:

1. Import the OpenAPI spec (if available)
2. Or manually create requests as shown above

## Troubleshooting

### Issue: "P1000: Authentication failed"
**Solution**: 
- Verify PostgreSQL is running
- Check database credentials in `.env`
- Ensure database and user exist
- Try connecting manually: `psql -U stockmaster -d stockmaster`

### Issue: "ECONNREFUSED" for Redis
**Solution**:
- Verify Redis is running: `redis-cli ping`
- Check Redis port (default 6379)
- Update `REDIS_HOST` and `REDIS_PORT` in `.env` if using custom setup

### Issue: "Module not found" errors
**Solution**:
```bash
# Clean install
rm -rf node_modules package-lock.json
npm install
npm run prisma:generate
```

### Issue: Port 4000 already in use
**Solution**:
```bash
# Change PORT in .env file
PORT=4001

# Or kill the process using port 4000 (Windows)
netstat -ano | findstr :4000
taskkill /PID <PID> /F
```

### Issue: Prisma migrations fail
**Solution**:
```bash
# Reset database (WARNING: This deletes all data)
npm run prisma:reset

# Or manually reset:
psql -U stockmaster -d stockmaster -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
npm run prisma:migrate
npm run prisma:seed
```

## Running Tests

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

## Database Management

### View Data
```bash
npm run prisma:studio
```

### Reset Database
```bash
npm run prisma:reset
# This will drop, recreate, migrate, and seed
```

### Create New Migration
```bash
# After changing schema.prisma
npm run prisma:migrate
```

## Production Deployment

See the main [README.md](./README.md) for deployment instructions.

### Quick checklist:
- [ ] Update JWT secrets in production `.env`
- [ ] Set `NODE_ENV=production`
- [ ] Use production database with backups
- [ ] Enable HTTPS
- [ ] Configure CORS for production domain
- [ ] Set up monitoring and logging
- [ ] Configure Redis persistence
- [ ] Set up automated backups

## Need Help?

- Check the [README.md](./README.md) for detailed API documentation
- Review [GIT_WORKFLOW.md](./GIT_WORKFLOW.md) for development workflow
- Check PostgreSQL logs: `C:\Program Files\PostgreSQL\XX\data\log\`
- Check Redis logs based on your installation

## Quick Reference

### Common Commands
```bash
# Development
npm run dev                  # Start dev server
npm run build               # Build for production
npm start                   # Start production server

# Database
npm run prisma:generate     # Generate Prisma client
npm run prisma:migrate      # Run migrations
npm run prisma:seed         # Seed database
npm run prisma:studio       # Open database GUI
npm run prisma:reset        # Reset database

# Testing
npm test                    # Run tests
npm run test:coverage       # Run with coverage

# Code Quality
npm run lint                # Run ESLint
npm run typecheck          # TypeScript check
```

### Default URLs
- API: `http://localhost:4000`
- WebSocket: `ws://localhost:4000/ws`
- Health: `http://localhost:4000/health`
- Prisma Studio: `http://localhost:5555`

### Default Credentials
- PostgreSQL User: `stockmaster` / `password`
- Test Admin: `admin01` / `password123`
- Test Manager: `manager01` / `password123`
- Test Staff: `staff01` / `password123`

