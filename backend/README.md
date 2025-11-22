# StockMaster Backend API

A production-ready backend for **StockMaster**, an Inventory Management System (IMS) that provides real-time inventory tracking, multi-warehouse support, and comprehensive stock movement history.

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Database Design](#database-design)
- [Getting Started](#getting-started)
- [API Documentation](#api-documentation)
- [Real-time Updates](#real-time-updates)
- [Testing](#testing)
- [Deployment](#deployment)
- [Computer Science Fundamentals](#computer-science-fundamentals)

## ✨ Features

### Core Features
- **Multi-warehouse Inventory Management**: Track products across multiple warehouses and locations
- **Operation Types**:
  - **Receipts**: Incoming stock from suppliers
  - **Deliveries**: Outgoing stock to customers
  - **Internal Transfers**: Move stock between locations/warehouses
  - **Stock Adjustments**: Correct discrepancies between physical and system stock
- **Real-time Updates**: WebSocket-based live updates for operations and stock levels
- **Stock Movement Ledger**: Complete audit trail of all inventory movements
- **Dashboard KPIs**: Real-time metrics and analytics
- **Low Stock Alerts**: Automatic alerts when stock falls below reorder levels
- **Role-Based Access Control**: Admin, Inventory Manager, and Warehouse Staff roles
- **Offline Sync Support**: Queue operations offline and sync when connection is restored

### Technical Features
- JWT authentication with refresh tokens
- OTP-based password reset
- Rate limiting and security headers
- Comprehensive input validation with Zod
- Redis caching for performance
- Structured logging with correlation IDs
- Graceful shutdown handling

## 🛠 Tech Stack

- **Runtime**: Node.js 20+
- **Language**: TypeScript (strict mode)
- **Framework**: Fastify
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Cache/Pub-Sub**: Redis
- **Authentication**: JWT (jsonwebtoken)
- **Password Hashing**: Argon2id
- **Validation**: Zod
- **Testing**: Vitest
- **WebSocket**: @fastify/websocket

## 🏗 Architecture

### Project Structure

```
src/
├── app.ts                 # Fastify application setup
├── server.ts              # Entry point
├── config/
│   └── index.ts           # Configuration management
├── db/
│   ├── client.ts          # Prisma client
│   └── redis.ts           # Redis clients and cache service
├── common/
│   ├── errors.ts          # Custom error classes
│   ├── middleware.ts      # Authentication & authorization
│   ├── types.ts           # Shared TypeScript types
│   ├── utils.ts           # Utility functions
│   └── validators.ts      # Zod validation schemas
└── modules/
    ├── auth/              # Authentication
    ├── users/             # User management
    ├── products/          # Products & categories
    ├── warehouses/        # Warehouse management
    ├── locations/         # Location management
    ├── operations/        # Inventory operations
    ├── dashboard/         # KPIs and analytics
    ├── moveHistory/       # Stock movement ledger
    └── realtime/          # WebSocket handlers
```

### Module Pattern

Each module follows a consistent structure:
- **Service**: Business logic and data access
- **Controller**: HTTP request/response handling
- **Routes**: Route definitions with validation

## 🗄 Database Design

### Entity Relationship Diagram

```mermaid
erDiagram
    User ||--o{ Operation : creates
    User ||--o{ RefreshToken : has
    User ||--o{ OtpToken : has
    
    Warehouse ||--o{ Location : contains
    Warehouse ||--o{ Operation : from
    Warehouse ||--o{ Operation : to
    
    Location ||--o{ Operation : from
    Location ||--o{ Operation : to
    Location ||--o{ StockMovement : from
    Location ||--o{ StockMovement : to
    
    ProductCategory ||--o{ Product : contains
    
    Product ||--o{ OperationItem : includes
    Product ||--o{ StockMovement : tracks
    Product ||--o{ LowStockAlert : triggers
    
    Operation ||--o{ OperationItem : contains
    Operation ||--o{ StockMovement : generates
    
    User {
        string id PK
        string loginId UK
        string email UK
        string name
        enum role
        string passwordHash
        boolean isActive
    }
    
    Warehouse {
        string id PK
        string name
        string shortCode
        string address
        boolean isActive
    }
    
    Location {
        string id PK
        string warehouseId FK
        string name
        string shortCode
        boolean isActive
    }
    
    Product {
        string id PK
        string name
        string sku UK
        string categoryId FK
        string unitOfMeasure
        int reorderLevel
        boolean isActive
    }
    
    Operation {
        string id PK
        enum type
        string reference UK
        enum status
        string locationFromId FK
        string locationToId FK
        string createdByUserId FK
        datetime scheduleDate
    }
    
    StockMovement {
        string id PK
        string productId FK
        string locationFromId FK
        string locationToId FK
        decimal quantityDelta
        string operationId FK
        enum movementType
    }
```

### Key Design Decisions

#### 1. Stock Ledger Pattern
- Current stock is computed as `SUM(quantityDelta)` for all movements
- **Advantages**: Complete audit trail, easy to add new movement types
- **Complexity**: O(n) for stock calculation (can be optimized with periodic snapshots)

#### 2. Operation State Machine
```
RECEIPT:    DRAFT → READY → DONE
DELIVERY:   DRAFT → WAITING → READY → DONE
TRANSFER:   DRAFT → READY → DONE
ADJUSTMENT: DRAFT → DONE
Any state → CANCELED (except DONE)
```

#### 3. Normalization
- 3NF (Third Normal Form) compliance
- Separate tables for operations (header) and operation items (lines)
- Warehouse and Location hierarchy maintained

#### 4. Indexes
Optimized queries with composite indexes:
- `(productId, locationToId)` for stock queries
- `(type, status)` for operation filtering
- `(userId, isRevoked)` for refresh token lookups

## 🚀 Getting Started

### Prerequisites

- Node.js 20 or higher
- PostgreSQL 14 or higher
- Redis 7 or higher
- npm or yarn

### Installation

1. **Clone the repository**:
```bash
git clone <repository-url>
cd stockmaster/backend
```

2. **Install dependencies**:
```bash
npm install
```

3. **Configure environment**:
```bash
cp .env.example .env
# Edit .env with your configuration
```

Required environment variables:
```env
# Database
DATABASE_URL=postgresql://stockmaster:password@localhost:5432/stockmaster

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT Secrets (CHANGE IN PRODUCTION!)
JWT_ACCESS_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret

# Server
PORT=4000
NODE_ENV=development
```

4. **Setup database**:
```bash
# Generate Prisma client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# Seed database with sample data
npm run prisma:seed
```

5. **Start development server**:
```bash
npm run dev
```

The API will be available at `http://localhost:4000`
WebSocket endpoint: `ws://localhost:4000/ws`

### Default Users (from seed)

| LoginId   | Email                    | Password     | Role              |
|-----------|--------------------------|--------------|-------------------|
| admin01   | admin@stockmaster.com    | password123  | ADMIN             |
| manager01 | manager@stockmaster.com  | password123  | INVENTORY_MANAGER |
| staff01   | staff@stockmaster.com    | password123  | WAREHOUSE_STAFF   |

## 📚 API Documentation

### Authentication Endpoints

#### POST `/api/auth/signup`
Register a new user
```json
{
  "loginId": "user123",
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe"
}
```

#### POST `/api/auth/login`
Login with loginId or email
```json
{
  "loginIdOrEmail": "user123",
  "password": "password123"
}
```

Returns:
```json
{
  "user": { "id": "...", "name": "...", "role": "..." },
  "accessToken": "eyJ..."
}
```

#### POST `/api/auth/refresh`
Refresh access token (requires refresh token cookie)

#### GET `/api/auth/me`
Get current user (requires authentication)

#### POST `/api/auth/request-otp`
Request OTP for password reset
```json
{
  "email": "user@example.com"
}
```

#### POST `/api/auth/reset-password`
Reset password using OTP
```json
{
  "email": "user@example.com",
  "otp": "123456",
  "newPassword": "newpassword123"
}
```

### Operations Endpoints

#### POST `/api/operations/receipts`
Create receipt (incoming stock)
```json
{
  "locationToId": "location-id",
  "contactName": "Supplier ABC",
  "scheduleDate": "2024-01-15T10:00:00Z",
  "items": [
    { "productId": "product-id", "quantity": 100 }
  ]
}
```

#### POST `/api/operations/deliveries`
Create delivery (outgoing stock)

#### POST `/api/operations/transfers`
Create internal transfer

#### POST `/api/operations/adjustments`
Create stock adjustment (requires ADMIN or INVENTORY_MANAGER role)

#### GET `/api/operations`
List operations with filters:
- `type`: RECEIPT | DELIVERY | TRANSFER | ADJUSTMENT
- `status`: DRAFT | WAITING | READY | DONE | CANCELED
- `warehouseId`, `locationId`, `reference`, `dateFrom`, `dateTo`
- Pagination: `page`, `limit`

#### GET `/api/operations/:id`
Get operation details

#### POST `/api/operations/:id/transition`
Transition operation status
```json
{
  "action": "mark_ready" | "mark_done" | "cancel"
}
```

### Dashboard Endpoints

#### GET `/api/dashboard/kpis`
Get dashboard KPIs
```json
{
  "totalProductsInStock": 150,
  "lowStockCount": 5,
  "pendingReceipts": 3,
  "pendingDeliveries": 2,
  "pendingTransfers": 1
}
```

#### GET `/api/dashboard/summary-by-warehouse`
Warehouse-level summary

#### GET `/api/dashboard/summary-by-product-category`
Category-level summary

### Products Endpoints

#### GET `/api/products`
List products with pagination and filters

#### GET `/api/products/:id/stock`
Get stock levels for a product across all locations

#### GET `/api/products/low-stock`
Get products below reorder level

#### POST `/api/products`
Create product (requires ADMIN or INVENTORY_MANAGER)

### Move History Endpoints

#### GET `/api/move-history`
Get stock movement ledger with filters:
- `type`, `status`, `reference`, `warehouseId`, `locationId`, `productId`
- `dateFrom`, `dateTo`
- Pagination: `page`, `limit`

## 🔌 Real-time Updates

### WebSocket Connection

Connect to `ws://localhost:4000/ws?token=<access_token>`

### Client → Server Messages

#### Subscribe to topics
```json
{
  "type": "subscribe",
  "topics": ["dashboard", "stock", "operations"]
}
```

Available topics:
- `all`: All events (default)
- `dashboard`: Dashboard KPI updates
- `stock`: Stock level changes
- `operation`: Operation events

#### Unsubscribe
```json
{
  "type": "unsubscribe",
  "topics": ["stock"]
}
```

### Server → Client Events

#### Dashboard KPIs Updated
```json
{
  "type": "dashboard.kpisUpdated",
  "payload": {
    "totalProductsInStock": 150,
    "lowStockCount": 5,
    "pendingReceipts": 3,
    "pendingDeliveries": 2,
    "pendingTransfers": 1
  }
}
```

#### Stock Level Changed
```json
{
  "type": "stock.levelChanged",
  "payload": {
    "productId": "...",
    "locationId": "...",
    "newQty": 75
  }
}
```

#### Operation Created
```json
{
  "type": "operation.created",
  "payload": {
    "operationId": "...",
    "type": "RECEIPT",
    "status": "DRAFT",
    "reference": "WH/IN/0001"
  }
}
```

#### Operation Status Changed
```json
{
  "type": "operation.statusChanged",
  "payload": {
    "operationId": "...",
    "oldStatus": "READY",
    "newStatus": "DONE"
  }
}
```

## 🧪 Testing

### Run Tests
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Test Structure
```
tests/
├── auth.test.ts           # Authentication tests
├── operations.test.ts     # Operation workflow tests
├── stock.test.ts          # Stock calculation tests
└── realtime.test.ts       # WebSocket tests
```

### Key Test Cases
1. **Authentication**: Signup, login, token refresh, OTP flow
2. **Operations**: Create, update, transition, stock movements
3. **Stock Calculations**: Verify ledger accuracy
4. **State Transitions**: Valid and invalid transitions
5. **Real-time Events**: WebSocket event broadcasting

## 📦 Deployment

### Production Build
```bash
npm run build
npm start
```

### Environment Variables (Production)
- Set strong `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET`
- Use `NODE_ENV=production`
- Configure production database URLs
- Enable HTTPS and secure cookies
- Set appropriate `CORS_ORIGIN`

### Health Checks
- `GET /health`: Basic health check
- `GET /ready`: Readiness check (verifies DB and Redis connections)

## 🎓 Computer Science Fundamentals

### Data Structures

#### 1. Stock Ledger (Event Sourcing)
- **Structure**: Append-only log of stock movements
- **Time Complexity**: O(n) for current stock calculation where n = movements
- **Space Complexity**: O(m) where m = total movements
- **Optimization**: Periodic snapshots reduce calculation to O(k) where k = movements since last snapshot

#### 2. Hash Maps (Redis Cache)
- **Usage**: Cache dashboard KPIs, stock queries
- **Time Complexity**: O(1) for get/set operations
- **TTL**: 60 seconds for dynamic data

#### 3. B-Tree Indexes (PostgreSQL)
- **Usage**: Database indexes on frequently queried fields
- **Time Complexity**: O(log n) for lookups
- **Composite Indexes**: `(productId, locationToId)`, `(type, status)`

### Algorithms

#### 1. Stock Calculation
```typescript
// Time: O(n) where n = movements for product
// Space: O(m) where m = unique locations
function calculateStock(productId: string, locationId: string): number {
  const movements = getMovements(productId);
  let stock = 0;
  
  for (const movement of movements) {
    if (movement.locationToId === locationId) {
      stock += movement.quantityDelta;
    }
    if (movement.locationFromId === locationId) {
      stock -= movement.quantityDelta;
    }
  }
  
  return stock;
}
```

#### 2. Operation Reference Generation
```typescript
// Time: O(1) with last operation caching
// Space: O(1)
function generateReference(type: OperationType, sequence: number): string {
  const typeMap = { RECEIPT: 'IN', DELIVERY: 'OUT', TRANSFER: 'INT', ADJUSTMENT: 'ADJ' };
  return `WH/${typeMap[type]}/${sequence.toString().padStart(4, '0')}`;
}
```

#### 3. Low Stock Detection
```typescript
// Time: O(n * m) where n = products, m = movements per product
// Space: O(n)
// Can be optimized with materialized views
function findLowStockProducts(): Product[] {
  const products = getActiveProducts();
  const lowStock = [];
  
  for (const product of products) {
    const totalStock = calculateTotalStock(product.id);
    if (totalStock <= product.reorderLevel) {
      lowStock.push(product);
    }
  }
  
  return lowStock;
}
```

### Design Patterns

1. **Repository Pattern**: Data access abstraction (Prisma)
2. **Service Layer**: Business logic separation
3. **Pub/Sub**: Redis-based event broadcasting
4. **State Machine**: Operation status transitions
5. **Middleware Chain**: Authentication, authorization, rate limiting

### Concurrency & Transactions

- **Database Transactions**: Used for operations that create stock movements
- **Optimistic Locking**: Prisma's `updatedAt` field for conflict detection
- **Redis Pub/Sub**: Non-blocking event distribution to WebSocket clients

## 📝 License

Proprietary - All rights reserved

## 🤝 Contributing

This is a hackathon/demo project. For production use, consider:
- Adding comprehensive error monitoring (Sentry)
- Implementing request tracing (OpenTelemetry)
- Adding database connection pooling
- Implementing materialized views for complex queries
- Adding automated backups and disaster recovery
- Implementing rate limiting per user
- Adding API versioning
- Comprehensive audit logging

