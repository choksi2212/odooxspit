# 🚀 StockMaster - Inventory Management System

A modern, production-ready full-stack inventory management system built with React, Node.js, PostgreSQL, and Redis. Features real-time updates, multi-warehouse support, and comprehensive inventory operations.

**🎉 Status: Production Ready - All Features Implemented & Working**

## ✨ Features

### Core Functionality
- 📦 **Product Management** - Complete CRUD with cost tracking and categories
- 🏢 **Multi-Warehouse** - Manage multiple warehouses and locations (18 locations across 5 warehouses)
- 📥 **Receipts** - Record incoming inventory with auto-generated references
- 📤 **Deliveries** - Process outgoing shipments with validation
- 🔄 **Transfers** - Move stock between warehouses and locations
- 📊 **Adjustments** - Correct stock discrepancies with counted quantities
- 📈 **Real-Time Dashboard** - Live KPIs and analytics updated instantly
- 🔔 **WebSocket Integration** - Instant notifications and updates across all users
- 📋 **Move History** - Complete audit trail of all stock movements
- 💰 **Cost Tracking** - Per-unit cost tracking for all products

### User & Security
- 👥 **User Management** - Role-based access control (Admin, Manager, Staff)
- 🔐 **Secure Authentication** - JWT access tokens + HttpOnly refresh tokens
- 🔑 **Password Management** - Change password with session revocation
- 📧 **Email OTP** - Password reset via email with 10-minute OTP
- 👤 **Profile Management** - Update name, email, view joining date
- 🔒 **Argon2id Hashing** - Industry-standard password security

### Advanced Features
- ⚡ **Real-Time Updates** - All changes reflected instantly without refresh
- 🏭 **Warehouse-Specific Stock** - Accurate per-warehouse inventory tracking
- 📱 **Responsive UI** - Modern, beautiful interface with shadcn/ui components
- 🎨 **Kanban & List Views** - Multiple viewing modes for operations
- 🖨️ **Print/PDF Support** - Print receipts and deliveries
- 📅 **Date Picker** - Smooth, themed calendar for scheduling
- 🔍 **Advanced Filtering** - Filter by warehouse, location, product, status
- 📊 **Stock Page** - Detailed stock view with per-warehouse filtering

## 🛠️ Tech Stack

### Frontend
- ⚛️ React 18 + TypeScript (Strict mode)
- 🔄 TanStack Query (React Query) - Data fetching & caching
- 🎨 Tailwind CSS + shadcn/ui - Modern UI components
- 🧭 React Router v6 - Client-side routing
- 🔌 WebSocket Client - Real-time updates
- 🗃️ Zustand - State management
- 📅 date-fns - Date formatting
- 🎯 Vite - Lightning-fast builds

### Backend
- 🟢 Node.js 20+ + TypeScript
- ⚡ Fastify v5 - High-performance web framework
- 🗄️ Prisma ORM - Type-safe database access
- 🐘 PostgreSQL - Relational database
- 🔴 Redis/Memurai - Cache, rate limiting & Pub/Sub
- 🔐 JWT + Argon2id - Secure authentication
- 🔌 Native WebSocket (ws) - Real-time events
- 📧 Nodemailer - Email service (OTP)
- ✅ Zod - Schema validation

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

All users have the default password: **password123**

### Original Users:
| Username | Name | Role |
|----------|------|------|
| admin01 | Admin User | Admin (Full Access) |
| manager01 | Manager User | Inventory Manager |
| staff01 | Staff User | Warehouse Staff |

### Indian Users (Added):
| Username | Name | Role |
|----------|------|------|
| rajesh.kumar | Rajesh Kumar | Inventory Manager |
| priya.sharma | Priya Sharma | Warehouse Staff |
| amit.patel | Amit Patel | Warehouse Staff |
| sneha.reddy | Sneha Reddy | Inventory Manager |
| vikram.singh | Vikram Singh | Warehouse Staff |

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
- `POST /auth/refresh` - Refresh access token
- `GET /auth/me` - Get current user
- `PUT /auth/profile` - Update profile (name, email)
- `POST /auth/change-password` - Change password (revokes all sessions)
- `POST /auth/request-otp` - Request password reset OTP (sent via email)
- `POST /auth/reset-password` - Reset password with OTP

**Dashboard:**
- `GET /dashboard/kpis` - Get dashboard KPIs
- `GET /dashboard/summary-by-warehouse` - Warehouse summary
- `GET /dashboard/summary-by-category` - Category summary

**Products:**
- `GET /products` - List products (with pagination, search, filters)
- `GET /products?warehouseId=xxx` - Filter by warehouse
- `GET /products?locationId=xxx` - Filter by location
- `GET /products/:id` - Get product details
- `POST /products` - Create product
- `PATCH /products/:id` - Update product
- `DELETE /products/:id` - Delete product
- `GET /products/:id/stock` - Get product stock by location
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
- **User** - System users with roles (Admin, Manager, Staff)
- **RefreshToken** - Secure token management with expiry
- **OtpToken** - One-time passwords for password reset
- **Warehouse** - Physical warehouse locations (5 warehouses)
- **Location** - Storage locations within warehouses (18 locations)
- **ProductCategory** - Product classifications (7 categories)
- **Product** - Product master data with cost tracking
- **Operation** - All inventory operations (Receipt, Delivery, Transfer, Adjustment)
- **OperationItem** - Line items for operations
- **StockMovement** - Complete audit trail of all stock changes
- **LowStockAlert** - Automated low stock alerts

### Sample Data Included:
- ✅ 8 Users (3 original + 5 Indian users)
- ✅ 5 Warehouses (Main, Secondary, Mumbai, Delhi, Bangalore)
- ✅ 18 Locations across all warehouses
- ✅ 7 Product Categories
- ✅ 16 Products with realistic Indian prices (₹25 - ₹45,000)
- ✅ 6 Sample Operations with stock movements

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
HOST=0.0.0.0
DATABASE_URL=postgresql://user:password@localhost:5432/stockmaster

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT Secrets (CHANGE THESE!)
JWT_ACCESS_SECRET=your-super-secret-access-key
JWT_REFRESH_SECRET=your-super-secret-refresh-key
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Email (for OTP password reset)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-gmail-app-password
EMAIL_FROM=your-email@gmail.com
EMAIL_FROM_NAME=StockMaster

# Optional
CORS_ORIGIN=http://localhost:5173
RATE_LIMIT_MAX=100
OTP_EXPIRY_MINUTES=10
```

**Frontend (.env):**
```env
VITE_API_BASE_URL=http://your-api-domain.com/api
VITE_WS_URL=ws://your-api-domain.com/ws
```

**See `backend/EMAIL_SETUP_GUIDE.md` for email configuration details.**

---

## 🐛 Troubleshooting

### Port Already in Use
```bash
# Windows - Check what's using port 4000
netstat -ano | findstr :4000

# Kill the process (replace XXXX with PID from above)
taskkill /PID XXXX /F

# Or use the helper script (backend directory)
cd backend
.\killport.ps1
```

### Database Connection Issues
1. **Ensure PostgreSQL is running**
2. **Check credentials**: Open `backend/.env` and verify `DATABASE_URL`
3. **Verify database exists**:
   ```bash
   psql -U postgres -c "\l"
   ```
4. **Create database if needed**:
   ```bash
   cd backend
   node scripts/setup-db.cjs
   ```
5. **Run migrations**:
   ```bash
   npm run prisma:migrate
   ```

### Redis Connection Issues
1. **Check if Memurai is running** (Windows):
   ```powershell
   Get-Service Memurai
   ```
2. **Start Memurai if stopped**:
   ```powershell
   Start-Service Memurai
   ```
3. **Verify connection**: Backend should show `Redis Client connected` on startup

### Email Service Not Working
1. **Check email configuration** in `backend/.env`
2. **For Gmail**: Use App Password, not regular password
3. **See detailed guide**: `backend/EMAIL_SETUP_GUIDE.md`
4. **For testing**: Use Mailtrap (no real emails sent)

### WebSocket Errors
1. **Restart backend server** (fixes most WebSocket issues)
2. **Check browser console** for connection errors
3. **Verify JWT token** is valid (try logging out and back in)

### Real-Time Updates Not Working
1. **Refresh browser** to reconnect WebSocket
2. **Check backend console** for `WebSocket client connected` message
3. **Verify Redis is running** (required for Pub/Sub)

### Dependencies Issues
```bash
# Clean install all dependencies
rm -rf node_modules backend/node_modules front-end/node_modules
npm run install:all
```

### "Cannot find module" Errors
```bash
# Regenerate Prisma Client
cd backend
npm run prisma:generate

# Reinstall dependencies
npm install
```

---

## 📖 Documentation

- 📘 [Complete API Documentation](backend/README.md)
- 📧 [Email Setup Guide](backend/EMAIL_SETUP_GUIDE.md) - Configure OTP emails
- 🐛 [Troubleshooting](#-troubleshooting) - Common issues & solutions

## ✅ What's Working

### Fully Implemented & Tested:
- ✅ **Authentication & Security**
  - User signup/login/logout
  - JWT access tokens (15 min) + HttpOnly refresh tokens (7 days)
  - Password change with session revocation
  - OTP-based password reset via email
  - Profile updates (name, email)
  - Argon2id password hashing
  
- ✅ **Inventory Operations**
  - Receipt operations (WH/IN/xxxx)
  - Delivery operations (WH/OUT/xxxx)
  - Internal transfers (WH/INT/xxxx)
  - Stock adjustments (WH/ADJ/xxxx)
  - Operation status workflow (Draft → Ready → Done)
  - Print/PDF functionality
  
- ✅ **Product & Stock Management**
  - Product CRUD with categories
  - Per-unit cost tracking (₹)
  - Stock page with warehouse/location filtering
  - Real-time stock updates
  - Low stock alerts
  - Reorder level tracking
  
- ✅ **Multi-Warehouse Support**
  - 5 Warehouses across India
  - 18 Locations with specific purposes
  - Warehouse-specific stock calculations
  - Location-specific filtering
  - Real-time stock movements
  
- ✅ **Real-Time Features**
  - WebSocket integration
  - Live dashboard updates
  - Instant stock level changes
  - Operation status notifications
  - Multi-user support
  
- ✅ **User Interface**
  - Responsive modern design
  - Kanban & List views
  - Advanced filtering
  - Search functionality
  - Themed date picker
  - Print-friendly layouts

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

For support or questions:
- 📧 Email: support@stockmaster.com
- 🐛 Issues: [GitHub Issues](https://github.com/choksi2212/odooxspit/issues)
- 📖 Documentation: See README.md and guides in backend folder

---

## 🎯 Key Highlights

### Production-Ready Features:
- ✅ 100% feature complete
- ✅ Real-time updates across all modules
- ✅ Secure authentication with session management
- ✅ Multi-warehouse support with accurate stock tracking
- ✅ Email integration for password reset
- ✅ Comprehensive error handling
- ✅ Responsive UI with modern design
- ✅ Complete audit trail via move history

### Code Quality:
- ✅ TypeScript strict mode
- ✅ ESLint configured
- ✅ Prisma type safety
- ✅ Zod validation
- ✅ Clean architecture (routes → controllers → services → repositories)
- ✅ Modular code structure
- ✅ Git best practices

### Performance:
- ✅ Redis caching
- ✅ Database indexes optimized
- ✅ WebSocket for real-time (no polling)
- ✅ React Query for data caching
- ✅ Pagination on all list endpoints
- ✅ Lazy loading & code splitting

---

## 🚀 Getting Started

1. **Install prerequisites**: Node.js 20+, PostgreSQL, Redis/Memurai
2. **Clone repository**: `git clone https://github.com/choksi2212/odooxspit.git`
3. **Setup database**: Follow Quick Start guide above
4. **Configure email** (optional): See `backend/EMAIL_SETUP_GUIDE.md`
5. **Start servers**: Run `.\start.ps1` (Windows) or `npm start`
6. **Login**: Use `admin01` / `password123`
7. **Explore**: Test all features with sample data!

---

## 🎓 Learning Resources

This project demonstrates:
- Modern React patterns (Hooks, Context, Custom Hooks)
- TypeScript best practices
- RESTful API design
- WebSocket real-time communication
- Database design & normalization
- Authentication & authorization
- State management (Zustand)
- Form handling & validation
- Responsive UI design
- Git workflow

---

**Happy Inventory Management! 📦✨**

**Built with ❤️ for efficient warehouse operations**

