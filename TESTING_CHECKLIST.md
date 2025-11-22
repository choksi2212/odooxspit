# 🧪 StockMaster - Comprehensive Testing Checklist

## ✅ Pre-Testing Setup Verification

### Database & Services
- [ ] PostgreSQL is running (port 5432)
- [ ] Redis/Memurai is running (port 6379)
- [ ] Database `stockmaster` exists with correct permissions
- [ ] Database is seeded with test data (`npm run prisma:seed` in backend)

### Environment
- [ ] `backend/.env` exists with correct `DATABASE_URL`
- [ ] Backend dependencies installed (`cd backend && npm install`)
- [ ] Frontend dependencies installed (`cd front-end && npm install`)

### Servers
- [ ] Backend server starts without errors (`cd backend && npm run dev`)
  - Should show: `Server listening on http://localhost:4000`
  - Health check: `http://localhost:4000/health` returns 200 OK
- [ ] Frontend server starts without errors (`cd front-end && npm run dev`)
  - Should show: `Local: http://localhost:8080`
  - No Vite errors in console

---

## 🔐 Authentication & User Management

### Login Page (`/auth/login`)
- [ ] Page loads without errors
- [ ] Can login with test credentials:
  - Admin: `admin01` / `password123`
  - Manager: `manager01` / `password123`
  - Staff: `staff01` / `password123`
- [ ] Invalid credentials show error message
- [ ] Successful login redirects to dashboard
- [ ] "Remember me" checkbox works

### Signup Page (`/auth/signup`)
- [ ] Page loads without errors
- [ ] Form validation works (email format, password strength, etc.)
- [ ] Can create new user account
- [ ] Duplicate email/loginId shows error
- [ ] Successful signup redirects to dashboard

### Password Reset
- [ ] Forgot password link works
- [ ] Can request OTP for email
- [ ] Can reset password with valid OTP
- [ ] Invalid OTP shows error

### Authentication State
- [ ] User stays logged in after page refresh
- [ ] Logout button works
- [ ] Protected routes redirect to login when not authenticated
- [ ] JWT token is refreshed automatically

---

## 📊 Dashboard Page (`/`)

### KPI Cards
- [ ] "Total Products" shows correct count
- [ ] "Low Stock" shows correct count
- [ ] "Out of Stock" shows correct count
- [ ] "Pending Receipts" shows correct count
- [ ] "Pending Deliveries" shows correct count
- [ ] "Pending Transfers" shows correct count

### Real-Time Updates
- [ ] KPIs update when operations are created/completed
- [ ] WebSocket connection status indicator works
- [ ] Dashboard refreshes automatically when stock changes

### Recent Activity
- [ ] Shows recent operations list
- [ ] Can click on operation to view details

---

## 📦 Products Page (`/products`)

### Product List
- [ ] All products load correctly
- [ ] Product cards show:
  - Product name
  - SKU
  - Category
  - Current stock level
  - Low stock threshold
  - Status badge (In Stock / Low Stock / Out of Stock)
- [ ] Pagination works if > 20 products
- [ ] Search functionality filters products by name/SKU
- [ ] Category filter works
- [ ] Active/Inactive filter works

### Product Actions
- [ ] "Add Product" button opens create modal
- [ ] Can create new product with all fields
- [ ] Edit product button works
- [ ] Can update product details
- [ ] Delete product button works (with confirmation)
- [ ] View stock details per location works

### Product Details
- [ ] Product detail modal shows all information
- [ ] Stock levels per warehouse/location are accurate
- [ ] Low stock alert indicator appears when applicable

---

## 🏢 Warehouses & Locations

### Warehouses Page (`/settings/warehouses`)
- [ ] All warehouses load correctly
- [ ] Can create new warehouse
- [ ] Can edit warehouse details
- [ ] Can delete warehouse (if no stock)
- [ ] Search/filter works

### Locations Page (`/settings/locations`)
- [ ] All locations load correctly
- [ ] Locations grouped by warehouse
- [ ] Can create new location under a warehouse
- [ ] Can edit location details
- [ ] Can delete location (if no stock)
- [ ] Search/filter works

---

## 📥 Receipts (Incoming Stock)

### Receipts List (`/operations/receipts`)
- [ ] All receipts load correctly
- [ ] Can filter by status (Draft, Waiting, Ready, Done, Cancelled)
- [ ] Can filter by date range
- [ ] Can search by reference number
- [ ] Status badges display correctly
- [ ] Pagination works

### Create Receipt (`/operations/receipts/new`)
- [ ] Form loads without errors
- [ ] Can select destination warehouse
- [ ] Can select destination location
- [ ] Can add multiple product lines
- [ ] Can specify quantity and unit cost for each product
- [ ] Auto-generated reference number appears
- [ ] Schedule date picker works
- [ ] Notes field works
- [ ] "Save as Draft" creates receipt with DRAFT status
- [ ] "Mark Ready" creates receipt with READY status

### Edit Receipt (`/operations/receipts/:id`)
- [ ] Can view existing receipt details
- [ ] Can edit draft receipt
- [ ] Cannot edit completed receipt
- [ ] Can add/remove product lines
- [ ] Can update quantities

### Receipt Status Transitions
- [ ] Draft → Waiting (when ready)
- [ ] Waiting → Ready (when approved)
- [ ] Ready → Done (when validated - stock increases)
- [ ] Any status → Cancelled
- [ ] Cannot transition Done → any other status
- [ ] Stock movements are created only when Done

### Receipt Validation
- [ ] Cannot set negative quantities
- [ ] Cannot proceed without products
- [ ] Cannot proceed without location
- [ ] Validation errors display correctly

---

## 📤 Deliveries (Outgoing Stock)

### Deliveries List (`/operations/deliveries`)
- [ ] All deliveries load correctly
- [ ] Can filter by status
- [ ] Can filter by date range
- [ ] Can search by reference number
- [ ] Status badges display correctly
- [ ] Pagination works

### Create Delivery (`/operations/deliveries/new`)
- [ ] Form loads without errors
- [ ] Can select source warehouse
- [ ] Can select source location
- [ ] Can add multiple product lines
- [ ] Can specify quantity for each product
- [ ] Shows available stock per product/location
- [ ] Cannot set quantity > available stock
- [ ] Customer name field works
- [ ] Schedule date picker works
- [ ] Notes field works
- [ ] "Save as Draft" creates delivery with DRAFT status
- [ ] "Mark Ready" creates delivery with READY status

### Edit Delivery (`/operations/deliveries/:id`)
- [ ] Can view existing delivery details
- [ ] Can edit draft delivery
- [ ] Cannot edit completed delivery
- [ ] Can add/remove product lines
- [ ] Can update quantities (within stock limits)

### Delivery Status Transitions
- [ ] Draft → Waiting
- [ ] Waiting → Ready
- [ ] Ready → Done (stock decreases)
- [ ] Any status → Cancelled
- [ ] Cannot deliver more than available stock
- [ ] Stock movements are created only when Done

### Stock Availability Check
- [ ] Shows warning if trying to deliver more than available
- [ ] Cannot complete delivery if insufficient stock
- [ ] Stock reservation works (pending deliveries)

---

## 🔄 Internal Transfers

### Transfers List (`/operations/transfers`)
- [ ] All transfers load correctly
- [ ] Can filter by status
- [ ] Can filter by date range
- [ ] Can search by reference number
- [ ] Status badges display correctly
- [ ] Pagination works

### Create Transfer (`/operations/transfers/new`)
- [ ] Form loads without errors
- [ ] Can select source warehouse
- [ ] Can select source location
- [ ] Can select destination warehouse
- [ ] Can select destination location
- [ ] Cannot set source = destination
- [ ] Can add multiple product lines
- [ ] Can specify quantity for each product
- [ ] Shows available stock at source location
- [ ] Cannot set quantity > available stock
- [ ] Schedule date picker works
- [ ] Notes field works
- [ ] "Save as Draft" works
- [ ] "Mark Ready" works

### Edit Transfer (`/operations/transfers/:id`)
- [ ] Can view existing transfer details
- [ ] Can edit draft transfer
- [ ] Cannot edit completed transfer
- [ ] Can add/remove product lines
- [ ] Can update quantities (within stock limits)

### Transfer Status Transitions
- [ ] Draft → Waiting
- [ ] Waiting → Ready
- [ ] Ready → Done (stock moves from source to destination)
- [ ] Any status → Cancelled
- [ ] Cannot transfer more than available stock
- [ ] Stock movements created for both source and destination

---

## 📊 Stock Adjustments

### Adjustments List (`/operations/adjustments`)
- [ ] All adjustments load correctly
- [ ] Can filter by status
- [ ] Can filter by date range
- [ ] Can search by reference number
- [ ] Status badges display correctly
- [ ] Pagination works

### Create Adjustment (`/operations/adjustments/new`)
- [ ] Form loads without errors
- [ ] Can select warehouse
- [ ] Can select location
- [ ] Can add multiple product lines
- [ ] For each product:
  - Shows current stock level
  - Can enter counted quantity
  - Calculates and displays difference
- [ ] Reason/notes field works
- [ ] "Save as Draft" works
- [ ] "Apply Adjustment" marks as Done and updates stock

### Edit Adjustment (`/operations/adjustments/:id`)
- [ ] Can view existing adjustment details
- [ ] Can edit draft adjustment
- [ ] Cannot edit completed adjustment
- [ ] Can add/remove product lines
- [ ] Can update counted quantities

### Adjustment Validation
- [ ] Cannot set negative counted quantity
- [ ] Shows clear indication of increase/decrease
- [ ] Stock movements reflect the difference (positive or negative)

---

## 📜 Move History (`/move-history`)

### History List
- [ ] All stock movements load correctly
- [ ] Shows movements from all operation types
- [ ] Can filter by:
  - Product
  - Warehouse
  - Location
  - Operation type (Receipt, Delivery, Transfer, Adjustment)
  - Date range
- [ ] Each movement shows:
  - Product name
  - Quantity delta (+ or -)
  - Source location (if applicable)
  - Destination location (if applicable)
  - Operation reference
  - Date/time
  - User who performed it
- [ ] Pagination works
- [ ] Can click movement to view related operation

### Movement Accuracy
- [ ] Receipts show positive delta at destination
- [ ] Deliveries show negative delta at source
- [ ] Transfers show negative at source, positive at destination
- [ ] Adjustments show correct delta (positive or negative)

---

## 🔔 Real-Time Features

### WebSocket Connection
- [ ] WebSocket connects on login
- [ ] Connection status indicator works
- [ ] Reconnects automatically if disconnected

### Real-Time Events
- [ ] Dashboard KPIs update in real-time when:
  - New operation is created
  - Operation status changes
  - Stock levels change
- [ ] Stock levels update in real-time on product list
- [ ] Operation status updates in real-time on operation lists
- [ ] Low stock alerts appear in real-time
- [ ] Multiple browser tabs sync correctly

### Event Subscriptions
- [ ] Subscribed to `dashboard` topic
- [ ] Subscribed to `operations` topic
- [ ] Subscribed to `stock` topic
- [ ] Events are received and processed correctly

---

## 🔒 Security & Authorization

### Role-Based Access Control (RBAC)
- [ ] Admin can access all features
- [ ] Manager can create/edit/delete operations
- [ ] Staff can view operations but not delete
- [ ] Unauthorized actions show permission error

### API Security
- [ ] JWT token is sent with every request
- [ ] Expired token triggers re-authentication
- [ ] Invalid token returns 401
- [ ] Protected endpoints require authentication

---

## 🎨 UI/UX Features

### General
- [ ] All pages load without console errors
- [ ] No 404 errors for assets
- [ ] Loading states show spinners/skeletons
- [ ] Error states show user-friendly messages
- [ ] Success notifications appear for actions
- [ ] Modals open and close correctly
- [ ] Forms validate before submission
- [ ] Buttons disable during API calls

### Responsive Design
- [ ] Dashboard looks good on desktop
- [ ] Lists are readable
- [ ] Forms are usable
- [ ] Modals fit on screen

### Breadcrumbs & Navigation
- [ ] Sidebar navigation works
- [ ] Breadcrumbs show current location
- [ ] Back buttons work correctly
- [ ] Page titles are correct

---

## ⚡ Performance

### Page Load Times
- [ ] Dashboard loads in < 2 seconds
- [ ] Product list loads in < 2 seconds
- [ ] Operations lists load in < 2 seconds
- [ ] No unnecessary API calls

### Caching
- [ ] Products are cached (React Query)
- [ ] Warehouses are cached
- [ ] Locations are cached
- [ ] Cache invalidates on updates

### Database Queries
- [ ] No N+1 query problems
- [ ] Stock calculations are efficient
- [ ] Pagination works for large datasets

---

## 🐛 Error Handling

### Network Errors
- [ ] API down shows error message
- [ ] Retry mechanisms work
- [ ] Graceful degradation

### Validation Errors
- [ ] Form validation errors are clear
- [ ] API validation errors display correctly
- [ ] Required fields are marked

### Edge Cases
- [ ] Empty states show helpful messages
- [ ] Large numbers format correctly
- [ ] Dates display in correct timezone
- [ ] Decimal quantities work (e.g., 1.5 units)

---

## 🧪 Stock Calculation Verification

### Test Scenarios

#### Scenario 1: Simple Receipt
1. Note product A stock at location X
2. Create and complete receipt: +10 units of product A at location X
3. Verify stock increased by 10
4. Check move history shows +10 entry

#### Scenario 2: Simple Delivery
1. Note product B stock at location Y
2. Create and complete delivery: -5 units of product B from location Y
3. Verify stock decreased by 5
4. Check move history shows -5 entry

#### Scenario 3: Internal Transfer
1. Note product C stock at location Z1 and Z2
2. Create and complete transfer: 7 units of product C from Z1 to Z2
3. Verify stock at Z1 decreased by 7
4. Verify stock at Z2 increased by 7
5. Check move history shows both entries

#### Scenario 4: Stock Adjustment (Increase)
1. Note product D stock at location W
2. Current: 50, Counted: 55 (difference: +5)
3. Complete adjustment
4. Verify stock increased by 5
5. Check move history shows +5 entry

#### Scenario 5: Stock Adjustment (Decrease)
1. Note product E stock at location V
2. Current: 30, Counted: 25 (difference: -5)
3. Complete adjustment
4. Verify stock decreased by 5
5. Check move history shows -5 entry

#### Scenario 6: Multiple Operations
1. Start with product F at 100 units in location U
2. Receipt: +20 (total: 120)
3. Delivery: -15 (total: 105)
4. Transfer out: -10 (total: 95)
5. Transfer in: +5 (total: 100)
6. Adjustment: counted 98 (total: 98)
7. Verify final stock is 98
8. Check all 5 movements in history

---

## 🚀 One-Command Startup

### Test All Startup Methods

#### Method 1: PowerShell Script
```powershell
.\start.ps1
```
- [ ] Checks PostgreSQL is running
- [ ] Checks Redis is running
- [ ] Installs dependencies if needed
- [ ] Opens backend in new window
- [ ] Opens frontend in new window
- [ ] Auto-opens browser to http://localhost:8080
- [ ] Shows test credentials

#### Method 2: Batch Script
```batch
start.bat
```
- [ ] Opens backend in new window
- [ ] Opens frontend in new window
- [ ] Auto-opens browser

#### Method 3: NPM Script
```bash
npm start
```
- [ ] Starts both servers with concurrently
- [ ] Shows colored output for each server
- [ ] Handles Ctrl+C gracefully

---

## ✅ Final Checks

### Code Quality
- [ ] No TypeScript errors
- [ ] No ESLint warnings
- [ ] No console errors in browser
- [ ] No CORS errors

### Documentation
- [ ] README.md is complete and accurate
- [ ] API documentation is correct
- [ ] Test credentials are documented
- [ ] Setup instructions work

### Git
- [ ] All changes committed
- [ ] Pushed to GitHub
- [ ] No node_modules in repo
- [ ] .gitignore is correct

---

## 📝 Test Results Summary

**Date:** _______________  
**Tester:** _______________  
**Environment:** _______________

**Total Tests:** _______________  
**Passed:** _______________  
**Failed:** _______________  
**Skipped:** _______________

**Overall Status:** ⭕ PASS / ❌ FAIL

### Critical Issues Found:
1. _______________________________________
2. _______________________________________
3. _______________________________________

### Notes:
_______________________________________
_______________________________________
_______________________________________

---

## 🎯 Quick Smoke Test (5 minutes)

If short on time, test these critical paths:

1. ✅ Start servers with `npm start` or `.\start.ps1`
2. ✅ Login with `admin01` / `password123`
3. ✅ Dashboard loads with correct KPIs
4. ✅ View products list
5. ✅ Create a new receipt (draft)
6. ✅ Mark receipt as ready
7. ✅ Complete receipt (Done)
8. ✅ Verify stock increased
9. ✅ Check move history
10. ✅ Logout and login again

If all 10 pass ✅ → System is likely working correctly!

---

**Happy Testing! 🎉**

