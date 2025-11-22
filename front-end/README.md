# StockMaster - Inventory Management System

A modern, real-time inventory management system built with React, TypeScript, and Tailwind CSS.

## Features

- **Authentication**: Secure login/signup with JWT tokens and password reset
- **Dashboard**: Real-time KPIs and operation status overview
- **Operations Management**: 
  - Receipts (incoming inventory)
  - Deliveries (outgoing inventory)
  - Internal transfers
  - Stock adjustments
- **Real-time Updates**: WebSocket integration for live data synchronization
- **Offline Support**: Queue operations when offline and sync when connection is restored
- **Settings**: Manage warehouses and storage locations

## Technology Stack

- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS with custom design system
- **State Management**: Zustand + React Query (TanStack Query)
- **Forms**: React Hook Form + Zod validation
- **Real-time**: Native WebSocket with reconnection
- **Routing**: React Router v6

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Backend API running (default: http://localhost:4000)

## Getting Started

### 1. Clone the repository

```bash
git clone <repository-url>
cd stockmaster
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment

Create a `.env` file in the root directory:

```env
VITE_API_BASE_URL=http://localhost:4000/api
VITE_WS_URL=ws://localhost:4000/ws
```

### 4. Run development server

```bash
npm run dev
```

The application will be available at `http://localhost:8080`

### 5. Build for production

```bash
npm run build
```

The production build will be in the `dist` directory.

## Project Structure

```
src/
├── components/        # Reusable UI components
│   ├── Layout/       # Layout components (navbar, sidebar)
│   ├── Operations/   # Operation-specific components
│   └── ui/           # Base UI components (shadcn)
├── hooks/            # Custom React hooks
├── lib/              # Core utilities
│   ├── api-client.ts    # REST API client
│   ├── ws-client.ts     # WebSocket client
│   ├── auth.ts          # Authentication utilities
│   └── offline-store.ts # Offline storage
├── routes/           # Page components
│   ├── Auth/         # Authentication pages
│   ├── Dashboard/    # Dashboard
│   ├── Operations/   # Operations pages
│   └── Settings/     # Settings pages
└── services/         # Business logic and utilities
```

## Computer Science Fundamentals

### Data Structures
- **Hash Maps**: Used for O(1) lookup in operation filtering and product search
- **Arrays**: List operations with efficient filtering and sorting
- **Queue**: Pending operations queue for offline sync

### Algorithms
- **Binary Search**: Product search optimization (when sorted)
- **Filtering/Sorting**: O(n) linear filtering with multiple criteria
- **Exponential Backoff**: WebSocket reconnection algorithm to prevent server overload

### Complexity Analysis
- List filtering: O(n) where n is number of operations
- Search by reference: O(n) worst case, O(1) with indexing
- Real-time updates: O(1) for single operation updates

## Real-time & Offline Features

### WebSocket Events (Server → Client)
- `dashboard.kpisUpdated` - Dashboard KPI updates
- `stock.levelChanged` - Stock level changes
- `operation.created` - New operation created
- `operation.updated` - Operation details updated
- `operation.statusChanged` - Operation status transition
- `lowStock.alertCreated` - Low stock alert

### Offline Queue
When offline, operations are stored locally with:
- Client-generated temporary ID
- Timestamp for conflict resolution
- Complete operation data

On reconnection, queued operations sync via `/sync/operations` endpoint.

## API Integration

The frontend communicates with the backend via:

### REST Endpoints
- Authentication: `/auth/*`
- Operations: `/operations/*`
- Dashboard: `/dashboard/*`
- Warehouses: `/warehouses/*`
- Locations: `/locations/*`
- Products: `/products/*`

### WebSocket
Connection includes JWT token for authentication:
```typescript
ws://localhost:4000/ws?token=<access_token>
```

## Security

- **Access tokens** stored in memory only
- **Refresh tokens** in HttpOnly cookies (managed by backend)
- **Input validation** with Zod schemas
- **CSRF protection** via token-based auth
- **Automatic token refresh** on expiration

## Development Guidelines

1. **Keep components focused** (single responsibility)
2. **Use TypeScript strictly** (no `any` unless necessary)
3. **Follow design system** (use semantic tokens)
4. **Write pure functions** for business logic
5. **Test edge cases** especially for offline/online transitions

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)

## License

Proprietary - All rights reserved
