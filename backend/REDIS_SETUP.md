# Redis Setup for StockMaster

StockMaster requires Redis for:
- Caching dashboard KPIs
- Rate limiting
- Real-time WebSocket pub/sub

## Option 1: Install Memurai (Redis for Windows) - RECOMMENDED

### Download and Install

1. **Download Memurai**:
   - Go to: https://www.memurai.com/get-memurai
   - Click "Download" (Community Edition is free)
   - Run the installer

2. **Install**:
   - Follow the installation wizard
   - It will automatically install as a Windows service
   - Default port: 6379 (same as Redis)

3. **Verify Installation**:
   ```powershell
   Get-Service Memurai
   ```

4. **Start Service** (if not running):
   ```powershell
   Start-Service Memurai
   ```

### Test Connection

```powershell
# Using Memurai CLI
& "C:\Program Files\Memurai\memurai-cli.exe" ping
# Should return: PONG
```

## Option 2: Redis on WSL2

If you have WSL2 (Windows Subsystem for Linux):

### Install Redis in WSL

```bash
# Open WSL terminal
wsl

# Update package list
sudo apt update

# Install Redis
sudo apt install redis-server -y

# Start Redis
sudo service redis-server start

# Test
redis-cli ping
# Should return: PONG
```

### Make Redis accessible from Windows

Edit Redis config:
```bash
sudo nano /etc/redis/redis.conf
```

Change:
- `bind 127.0.0.1` to `bind 0.0.0.0`
- `protected-mode yes` to `protected-mode no`

Restart:
```bash
sudo service redis-server restart
```

### Update .env

```env
REDIS_HOST=localhost
REDIS_PORT=6379
```

## Option 3: Docker (if you have Docker Desktop)

```bash
docker run --name stockmaster-redis -p 6379:6379 -d redis:alpine
```

## Verify StockMaster Can Connect

After installing Redis, test the backend:

```powershell
cd N:\ODOO SPIT\backend
npm run dev
```

You should see:
```
Redis Client connected
🚀 StockMaster API server is running on http://0.0.0.0:4000
```

## Quick Start After Redis Installation

1. **Ensure PostgreSQL is running**:
   ```powershell
   Get-Service postgresql-x64-18
   ```

2. **Ensure Redis/Memurai is running**:
   ```powershell
   Get-Service Memurai
   # or check WSL: wsl redis-cli ping
   ```

3. **Start backend**:
   ```powershell
   cd "N:\ODOO SPIT\backend"
   npm run dev
   ```

4. **Test API**:
   ```powershell
   curl http://localhost:4000/health
   ```

## Troubleshooting

### "ECONNREFUSED" Error

If you see `ECONNREFUSED` for Redis:

1. **Check service is running**:
   ```powershell
   Get-Service Memurai
   # If stopped:
   Start-Service Memurai
   ```

2. **Check port**:
   ```powershell
   netstat -ano | findstr :6379
   ```

3. **Update .env if using non-default port**:
   ```env
   REDIS_PORT=your_port
   ```

### Redis Not Installed?

The fastest option is **Memurai**:
- Download: https://www.memurai.com/get-memurai
- 2-minute installation
- No configuration needed
- Works immediately

## Next Steps

Once Redis is running:
1. Backend will start successfully
2. Navigate to `http://localhost:4000/health` - should return OK
3. Start frontend: `cd ../front-end && npm run dev`
4. Access app at `http://localhost:8080`
5. Login with `admin01` / `password123`

