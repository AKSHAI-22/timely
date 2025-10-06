#!/bin/bash

echo "🚀 Setting up Timely Project..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if MongoDB is installed
if ! command -v mongod &> /dev/null; then
    echo "❌ MongoDB is not installed. Please install MongoDB first."
    exit 1
fi

# Check if Hardhat is available
if ! command -v npx &> /dev/null; then
    echo "❌ npx is not available. Please install Node.js with npm."
    exit 1
fi

echo "✅ Prerequisites check passed"

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd backend
npm install
cd ..

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd frontend
npm install
cd ..

# Install root dependencies
echo "📦 Installing root dependencies..."
npm install

# Create .env file from example
echo "📝 Creating environment files..."
if [ ! -f .env ]; then
    cp env.example .env
    echo "✅ Created .env file from env.example"
else
    echo "⚠️  .env file already exists, skipping..."
fi

# Create frontend .env file
if [ ! -f frontend/.env ]; then
    cat > frontend/.env << EOF
REACT_APP_API_URL=http://localhost:5000
REACT_APP_NETWORK_ID=31337
REACT_APP_TIMESLOT_NFT_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
REACT_APP_MARKETPLACE_ADDRESS=0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
REACT_APP_ESCROW_ADDRESS=0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0
REACT_APP_REVIEW_SYSTEM_ADDRESS=0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9
REACT_APP_USER_REGISTRY_ADDRESS=0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9
REACT_APP_FACTORY_ADDRESS=0x5FC8d32690cc91D4c39d9d3abcBD16989F875707
EOF
    echo "✅ Created frontend/.env file"
else
    echo "⚠️  frontend/.env file already exists, skipping..."
fi

# Start MongoDB (if not running)
echo "🗄️  Starting MongoDB..."
if ! pgrep -x "mongod" > /dev/null; then
    mongod --dbpath ./data/db --fork --logpath ./data/mongodb.log
    echo "✅ MongoDB started"
else
    echo "✅ MongoDB is already running"
fi

# Compile contracts
echo "🔨 Compiling smart contracts..."
npx hardhat compile

# Deploy contracts
echo "🚀 Deploying smart contracts..."
npx hardhat run scripts/deploy-all.js --network localhost

echo "✅ Project setup complete!"
echo ""
echo "🎉 Next steps:"
echo "1. Start the backend: cd backend && npm start"
echo "2. Start the frontend: cd frontend && npm start"
echo "3. Open http://localhost:3000 in your browser"
echo ""
echo "📋 Available commands:"
echo "- Start all services: ./start-all.sh"
echo "- Reset database: cd backend && node reset-db.js"
echo "- Test contracts: npx hardhat test"
echo ""
echo "🔗 Contract addresses are saved in contract-addresses.json"
echo "📝 Environment variables are configured in .env files"
