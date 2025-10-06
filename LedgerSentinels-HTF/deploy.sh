#!/bin/bash

echo "🚀 Starting Timely Project Deployment..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

# Install dependencies for all projects
echo "📦 Installing dependencies..."
npm run install:all

# Compile smart contracts
echo "🔨 Compiling smart contracts..."
npm run compile

# Deploy contracts (local network for development)
echo "🚀 Deploying contracts to local network..."
npm run deploy:local

# Start MongoDB (if not running)
echo "🗄️ Starting MongoDB..."
if ! pgrep -x "mongod" > /dev/null; then
    echo "Starting MongoDB..."
    mongod --fork --logpath /tmp/mongodb.log
else
    echo "MongoDB is already running"
fi

# Start backend server
echo "🔧 Starting backend server..."
cd backend && npm start &
BACKEND_PID=$!

# Wait for backend to start
sleep 5

# Start frontend
echo "🎨 Starting frontend..."
cd ../frontend && npm start &
FRONTEND_PID=$!

echo "✅ Deployment complete!"
echo "🌐 Frontend: http://localhost:3000"
echo "🔧 Backend API: http://localhost:5000"
echo "📊 GraphQL Playground: http://localhost:5000/graphql"
echo ""
echo "Press Ctrl+C to stop all services"

# Wait for user to stop
wait
