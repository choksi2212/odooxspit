#!/bin/bash

# 🚂 Railway Deployment Script for StockMaster Backend
# This script automates the entire Railway deployment process

set -e  # Exit on any error

echo "🚂 StockMaster - Railway Deployment Script"
echo "=========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to print colored messages
print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    print_error "Railway CLI is not installed!"
    echo ""
    print_info "Installing Railway CLI..."
    npm install -g @railway/cli
    print_success "Railway CLI installed!"
    echo ""
fi

# Check if user is logged in
print_info "Checking Railway login status..."
if ! railway whoami &> /dev/null; then
    print_warning "Not logged in to Railway. Please login..."
    railway login
    print_success "Logged in successfully!"
else
    print_success "Already logged in to Railway!"
fi

echo ""
print_info "Starting deployment process..."
echo ""

# Navigate to backend directory
cd backend

# Initialize Railway project
print_info "Step 1/7: Initializing Railway project..."
railway init

print_success "Project initialized!"
echo ""

# Link to the project (if already exists)
print_info "Step 2/7: Linking to Railway project..."
railway link

echo ""

# Add PostgreSQL
print_info "Step 3/7: Adding PostgreSQL database..."
railway add --database postgres
print_success "PostgreSQL added!"
echo ""

# Add Redis
print_info "Step 4/7: Adding Redis..."
railway add --database redis
print_success "Redis added!"
echo ""

# Generate JWT secrets
print_info "Step 5/7: Generating JWT secrets..."
JWT_SECRET=$(openssl rand -hex 32)
JWT_REFRESH_SECRET=$(openssl rand -hex 32)
print_success "JWT secrets generated!"
echo ""

# Set environment variables
print_info "Step 6/7: Setting environment variables..."

railway variables set NODE_ENV=production
railway variables set PORT=4000
railway variables set JWT_SECRET="$JWT_SECRET"
railway variables set JWT_REFRESH_SECRET="$JWT_REFRESH_SECRET"
railway variables set JWT_EXPIRES_IN=15m
railway variables set JWT_REFRESH_EXPIRES_IN=7d
railway variables set CORS_ORIGIN="http://localhost:5173"
railway variables set RATE_LIMIT_MAX=100
railway variables set RATE_LIMIT_WINDOW_MS=900000
railway variables set OTP_EXPIRY_MINUTES=10

print_success "Environment variables set!"
print_warning "Remember to update CORS_ORIGIN after deploying frontend!"
echo ""

# Deploy
print_info "Step 7/7: Deploying to Railway..."
print_warning "This may take 3-5 minutes..."
echo ""

railway up --detach

print_success "Deployment initiated!"
echo ""

# Wait for deployment to complete
print_info "Waiting for deployment to complete..."
sleep 30

# Run database migrations
print_info "Running database migrations..."
railway run npx prisma db push --accept-data-loss

print_success "Database schema created!"
echo ""

# Seed database
print_info "Seeding database with sample data..."
railway run npm run prisma:seed

print_success "Database seeded!"
echo ""

# Get the domain
print_info "Getting your backend URL..."
RAILWAY_URL=$(railway domain)

echo ""
echo "=========================================="
print_success "🎉 Deployment Complete!"
echo "=========================================="
echo ""
print_info "Your backend is now live at:"
echo -e "${GREEN}${RAILWAY_URL}${NC}"
echo ""
print_info "Test your backend:"
echo "  Health check: ${RAILWAY_URL}/health"
echo "  Warehouses:   ${RAILWAY_URL}/api/warehouses"
echo ""
print_info "WebSocket URL:"
echo "  wss://${RAILWAY_URL#https://}/ws"
echo ""
print_warning "Next steps:"
echo "  1. Test the endpoints above"
echo "  2. Deploy frontend to Vercel with these URLs:"
echo "     VITE_API_URL=${RAILWAY_URL}"
echo "     VITE_WS_URL=wss://${RAILWAY_URL#https://}/ws"
echo "  3. Update CORS_ORIGIN in Railway to your Vercel URL"
echo ""
print_info "To view logs: railway logs"
print_info "To view dashboard: railway open"
echo ""
print_success "Happy deploying! 🚀"

