# 🚀 StockMaster - Inventory Management System

A modern, full-stack inventory management system built with React, Node.js, PostgreSQL, and Redis.

## ✨ Features

- 📦 **Product Management** - Track products with real-time stock levels
- 🏢 **Multi-Warehouse** - Manage multiple warehouses and locations
- 📥 **Receipts** - Record incoming inventory
- 📤 **Deliveries** - Process outgoing shipments
- 🔄 **Transfers** - Move stock between locations
- 📊 **Adjustments** - Correct stock discrepancies
- 📈 **Dashboard** - Real-time KPIs and analytics
- 🔔 **Real-time Updates** - WebSocket for instant notifications
- 👥 **User Management** - Role-based access control (Admin, Manager, Staff)
- 🔐 **Secure Authentication** - JWT tokens with refresh mechanism

## 🛠️ Tech Stack

### Frontend
- React 18 + TypeScript
- TanStack Query (React Query)
- Tailwind CSS + shadcn/ui
- React Router
- WebSocket Client

### Backend
- Node.js 20+ + TypeScript
- Fastify (Web Framework)
- Prisma ORM
- PostgreSQL (Database)
- Redis/Memurai (Cache & Pub/Sub)
- JWT Authentication
- WebSocket Server

## 📋 Prerequisites

Before running StockMaster, ensure you have:

1. **Node.js 20+** - [Download](https://nodejs.org/)
2. **PostgreSQL** - [Download](https://www.postgresql.org/download/)
3. **Redis** (or Memurai for Windows) - [Memurai Download](https://www.memurai.com/)

## 🚀 Quick Start

### Option 1: One-Command Start (Recommended)

#### Windows (PowerShell):
```powershell
.\start.ps1
```

#### Windows (Command Prompt):
```batch
start.bat
```

#### macOS/Linux:
```bash
npm install
npm start
```

This will:
- ✅ Check prerequisites
- ✅ Install dependencies (if needed)
- ✅ Start backend server on `http://localhost:4000`
- ✅ Start frontend server on `http://localhost:8080`
- ✅ Open browser automatically

---

### Option 2: Manual Start

#### 1. Install Dependencies
```bash
# Install root dependencies
npm install

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../front-end
npm install
```

#### 2. Setup Database
```bash
cd backend

# Create database (if not exists)
node scripts/setup-db.cjs

# Run migrations
npm run prisma:migrate

# Seed sample data
npm run prisma:seed
```

#### 3. Start Servers

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd front-end
npm run dev
```

---

## 🔑 Test Credentials

| Username | Password | Role |
|----------|----------|------|
| admin01 | password123 | Admin |
| manager01 | password123 | Inventory Manager |
| staff01 | password123 | Warehouse Staff |

---

## 📁 Project Structure

```
stockmaster/
├── backend/              # Backend API
│   ├── src/
│   │   ├── modules/      # Feature modules
│   │   ├── common/       # Shared utilities
│   │   ├── db/           # Database & Redis
│   │   └── server.ts     # Entry point
│   ├── prisma/           # Database schema & migrations
│   ├── tests/            # Backend tests
│   └── package.json
├── front-end/            # Frontend application
│   ├── src/
│   │   ├── routes/       # Page components
│   │   ├── components/   # Reusable components
│   │   ├── lib/          # API client & utilities
│   │   └── hooks/        # Custom React hooks
│   └── package.json
├── start.ps1             # PowerShell start script
├── start.bat             # Batch start script
└── package.json          # Root package (npm start)
```

---

## 🌐 API Endpoints

### Base URL: `http://localhost:4000/api`

**Authentication:**
- `POST /auth/signup` - Register new user
- `POST /auth/login` - Login
- `POST /auth/logout` - Logout
- `POST /auth/refresh` - Refresh token
- `GET /auth/me` - Get current user

**Dashboard:**
- `GET /dashboard/kpis` - Get dashboard KPIs
- `GET /dashboard/summary-by-warehouse` - Warehouse summary
- `GET /dashboard/summary-by-category` - Category summary

**Products:**
- `GET /products` - List products
- `GET /products/:id` - Get product
- `POST /products` - Create product
- `PATCH /products/:id` - Update product
- `DELETE /products/:id` - Delete product
- `GET /products/:id/stock` - Get product stock
- `GET /products/low-stock` - Low stock products

**Operations:**
- `GET /operations` - List operations
- `GET /operations/:id` - Get operation
- `POST /operations/receipts` - Create receipt
- `POST /operations/deliveries` - Create delivery
- `POST /operations/transfers` - Create transfer
- `POST /operations/adjustments` - Create adjustment
- `PATCH /operations/:id` - Update operation
- `POST /operations/:id/transition` - Change status

**Warehouses & Locations:**
- `GET /warehouses` - List warehouses
- `POST /warehouses` - Create warehouse
- `GET /locations` - List locations
- `POST /locations` - Create location

**Move History:**
- `GET /move-history` - Get stock movements

---

## 🔌 WebSocket Events

**Connect:** `ws://localhost:4000/ws?token=YOUR_JWT_TOKEN`

**Server → Client Events:**
- `dashboard.kpisUpdated` - Dashboard metrics changed
- `stock.levelChanged` - Product stock changed
- `operation.created` - New operation created
- `operation.updated` - Operation updated
- `operation.statusChanged` - Operation status changed
- `lowStock.alertCreated` - Low stock alert

**Client → Server Messages:**
- `subscribe` - Subscribe to topics
- `unsubscribe` - Unsubscribe from topics
- `ping` - Heartbeat

---

## 📊 Database Schema

### Core Entities:
- **User** - System users with roles
- **Warehouse** - Physical warehouse locations
- **Location** - Storage locations within warehouses
- **ProductCategory** - Product classifications
- **Product** - Product master data
- **Operation** - All inventory operations (Receipt, Delivery, Transfer, Adjustment)
- **OperationItem** - Line items for operations
- **StockMovement** - Complete audit trail of stock changes
- **LowStockAlert** - Automated alerts

---

## 🧪 Testing

```bash
# Run backend tests
cd backend
npm test

# Run specific test file
npm test tests/auth.test.ts
```

---

## 🔧 Development

### Backend Development
```bash
cd backend
npm run dev          # Start dev server
npm run build        # Build for production
npm run start        # Start production server
npm run typecheck    # Check TypeScript
npm run lint         # Lint code
```

### Frontend Development
```bash
cd front-end
npm run dev          # Start dev server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Lint code
```

### Database Management
```bash
cd backend
npm run prisma:studio    # Open Prisma Studio (GUI)
npm run prisma:migrate   # Run migrations
npm run prisma:seed      # Seed database
npm run prisma:reset     # Reset database (⚠️ deletes data)
```

---

## 🚢 Production Deployment

### Build for Production
```bash
npm run build:all
```

### Environment Variables

**Backend (.env):**
```env
NODE_ENV=production
PORT=4000
DATABASE_URL=postgresql://user:password@localhost:5432/stockmaster
REDIS_HOST=localhost
REDIS_PORT=6379
JWT_SECRET=your-super-secret-jwt-key
JWT_REFRESH_SECRET=your-super-secret-refresh-key
```

**Frontend (.env):**
```env
VITE_API_BASE_URL=http://your-api-domain.com/api
VITE_WS_URL=ws://your-api-domain.com/ws
```

---

## 🐛 Troubleshooting

### Port Already in Use
```bash
# Check what's using port 4000
netstat -ano | findstr :4000

# Check what's using port 8080
netstat -ano | findstr :8080
```

### Database Connection Issues
1. Ensure PostgreSQL is running
2. Check `DATABASE_URL` in `backend/.env`
3. Verify database exists: `psql -U postgres -c "\l"`

### Redis Connection Issues
1. Ensure Redis/Memurai is running:
   ```powershell
   Get-Service Memurai
   ```
2. Check `REDIS_HOST` and `REDIS_PORT` in `backend/.env`

### Dependencies Issues
```bash
# Clean install all dependencies
rm -rf node_modules backend/node_modules front-end/node_modules
npm run install:all
```

---

## 📖 Documentation

- 📘 [Complete API Documentation](backend/README.md)
- 🔧 [Setup Guide](backend/SETUP.md)
- 🚀 [Quick Start Guide](backend/QUICKSTART.md)
- 📝 [Git Workflow](backend/GIT_WORKFLOW.md)
- ✅ [Completion Summary](COMPLETION_SUMMARY.md)

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

MIT License - see LICENSE file for details

---

## 👥 Authors

- **StockMaster Team** - [GitHub](https://github.com/choksi2212/odooxspit)

---

## 🙏 Acknowledgments

- Built with ❤️ using modern web technologies
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- Icons from [Lucide](https://lucide.dev/)

---

## 📞 Support

For support, email support@stockmaster.com or open an issue on GitHub.

---

**Happy Inventory Management! 📦✨**

