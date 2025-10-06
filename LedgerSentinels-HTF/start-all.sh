#!/bin/bash

echo "🚀 Starting LedgerSentinels..."

# Function to check if port is in use
check_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null ; then
        echo "⚠️  Port $1 is already in use. Killing process..."
        lsof -ti:$1 | xargs kill -9
        sleep 2
    fi
}

# Check and kill processes on required ports
check_port 3000
check_port 5000
check_port 8545

echo "📦 Installing dependencies..."
npm install
cd backend && npm install
cd ../frontend && npm install
cd ..

echo "🗄️  Starting MongoDB..."
sudo systemctl start mongodb || echo "MongoDB might already be running"

echo "⛓️  Starting Hardhat network..."
npx hardhat node &
HARDHAT_PID=$!
sleep 5

echo "📄 Deploying smart contracts..."
npx hardhat run scripts/deploy-all.js --network localhost

echo "🔧 Starting backend server..."
cd backend
npm start &
BACKEND_PID=$!
cd ..

echo "🎨 Starting frontend..."
cd frontend
npm start &
FRONTEND_PID=$!
cd ..

echo ""
echo "✅ All services started!"
echo ""
echo "🌐 Access your application:"
echo "- Frontend: http://localhost:3000"
echo "- Backend API: http://localhost:5000"
echo "- GraphQL Playground: http://localhost:5000/graphql"
echo ""
echo "🔑 Test Account (from Hardhat):"
echo "Address: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"
echo "Private Key: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
echo ""
echo "📱 MetaMask Setup:"
echo "1. Add Network: http://localhost:8545, Chain ID: 31337"
echo "2. Import account with private key above"
echo ""
echo "Press Ctrl+C to stop all services"

# Wait for user to stop
wait
