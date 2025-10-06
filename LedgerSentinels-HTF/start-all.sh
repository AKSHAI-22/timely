#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if port is in use
check_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null 2>&1; then
        print_warning "Port $1 is already in use. Killing process..."
        lsof -ti:$1 | xargs kill -9 2>/dev/null || true
        sleep 2
    fi
}

# Function to wait for service to be ready
wait_for_service() {
    local url=$1
    local service_name=$2
    local max_attempts=30
    local attempt=1
    
    print_status "Waiting for $service_name to be ready..."
    
    while [ $attempt -le $max_attempts ]; do
        if curl -s "$url" >/dev/null 2>&1; then
            print_success "$service_name is ready!"
            return 0
        fi
        
        echo -n "."
        sleep 2
        attempt=$((attempt + 1))
    done
    
    print_error "$service_name failed to start after $((max_attempts * 2)) seconds"
    return 1
}

# Function to cleanup processes on exit
cleanup() {
    print_status "Shutting down services..."
    
    # Kill all background processes
    jobs -p | xargs -r kill 2>/dev/null || true
    
    # Kill specific processes
    lsof -ti:3000 | xargs -r kill -9 2>/dev/null || true
    lsof -ti:5000 | xargs -r kill -9 2>/dev/null || true
    lsof -ti:8545 | xargs -r kill -9 2>/dev/null || true
    
    print_success "All services stopped"
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

echo "🚀 Starting LedgerSentinels - Complete Stack"
echo "=============================================="

# Check and kill processes on required ports
print_status "Checking for existing processes..."
check_port 3000
check_port 5000
check_port 8545

# Install dependencies
print_status "Installing dependencies..."
if ! npm install --silent; then
    print_error "Failed to install root dependencies"
    exit 1
fi

if ! cd backend && npm install --silent; then
    print_error "Failed to install backend dependencies"
    exit 1
fi

if ! cd ../frontend && npm install --silent; then
    print_error "Failed to install frontend dependencies"
    exit 1
fi

cd ..

# Start MongoDB
print_status "Starting MongoDB..."
if ! sudo systemctl start mongodb 2>/dev/null; then
    print_warning "MongoDB might already be running or failed to start"
fi

# Wait for MongoDB to be ready
sleep 3

# Start Hardhat network
print_status "Starting Hardhat network..."
npx hardhat node > hardhat.log 2>&1 &
HARDHAT_PID=$!

# Wait for Hardhat to be ready
if ! wait_for_service "http://localhost:8545" "Hardhat Network"; then
    print_error "Hardhat network failed to start"
    exit 1
fi

# Deploy smart contracts
print_status "Deploying smart contracts..."
if ! npx hardhat run scripts/deploy-all.js --network localhost > deploy.log 2>&1; then
    print_error "Failed to deploy smart contracts"
    print_error "Check deploy.log for details"
    exit 1
fi

print_success "Smart contracts deployed successfully"

# Start backend server
print_status "Starting backend server..."
cd backend
npm start > ../backend.log 2>&1 &
BACKEND_PID=$!
cd ..

# Wait for backend to be ready
if ! wait_for_service "http://localhost:5000/api/health" "Backend API"; then
    print_error "Backend server failed to start"
    print_error "Check backend.log for details"
    exit 1
fi

# Start frontend
print_status "Starting frontend..."
cd frontend
npm start > ../frontend.log 2>&1 &
FRONTEND_PID=$!
cd ..

# Wait for frontend to be ready
if ! wait_for_service "http://localhost:3000" "Frontend"; then
    print_error "Frontend failed to start"
    print_error "Check frontend.log for details"
    exit 1
fi

# Clear screen and show success message
clear

echo "🎉 LedgerSentinels is now running!"
echo "=================================="
echo ""
echo "🌐 Access your application:"
echo "   Frontend:     http://localhost:3000"
echo "   Backend API:  http://localhost:5000"
echo "   GraphQL:      http://localhost:5000/graphql"
echo "   Health Check: http://localhost:5000/api/health"
echo ""
echo "🔑 Test Account (Hardhat):"
echo "   Address:     0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"
echo "   Private Key: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
echo ""
echo "📱 MetaMask Setup:"
echo "   1. Add Network: http://localhost:8545, Chain ID: 31337"
echo "   2. Import account with private key above"
echo ""
echo "📊 Service Status:"
echo "   ✅ MongoDB:     Running"
echo "   ✅ Hardhat:     Running (PID: $HARDHAT_PID)"
echo "   ✅ Backend:     Running (PID: $BACKEND_PID)"
echo "   ✅ Frontend:    Running (PID: $FRONTEND_PID)"
echo ""
echo "📝 Logs:"
echo "   Backend:  tail -f backend.log"
echo "   Frontend: tail -f frontend.log"
echo "   Hardhat:  tail -f hardhat.log"
echo ""
echo "Press Ctrl+C to stop all services"

# Keep script running and wait for signals
while true; do
    sleep 1
done
