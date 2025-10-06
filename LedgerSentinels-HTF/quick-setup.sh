#!/bin/bash

echo "🚀 Quick Setup for LedgerSentinels..."

# Generate JWT secrets
JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
JWT_REFRESH_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")

echo "📝 Creating backend .env file..."
cat > backend/.env << EOF
# Database
MONGODB_URI=mongodb://localhost:27017/ledgersentinels

# JWT Secrets (auto-generated)
JWT_SECRET=$JWT_SECRET
JWT_REFRESH_SECRET=$JWT_REFRESH_SECRET
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d

# Server Configuration
PORT=5000
NODE_ENV=development

# Email Configuration (update with your email)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM=noreply@ledgersentinels.com

# Blockchain Configuration
PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
RPC_URL=http://localhost:8545
CHAIN_ID=31337

# Contract Addresses (will be set after deployment)
TIMESLOT_NFT_ADDRESS=
MARKETPLACE_ADDRESS=
ESCROW_ADDRESS=
REVIEW_SYSTEM_ADDRESS=
USER_REGISTRY_ADDRESS=
FACTORY_ADDRESS=
EOF

echo "📝 Creating frontend .env file..."
cat > frontend/.env << EOF
# API Configuration
REACT_APP_API_URL=http://localhost:5000

# Blockchain Configuration
REACT_APP_CHAIN_ID=31337
REACT_APP_RPC_URL=http://localhost:8545

# Contract Addresses (will be set after deployment)
REACT_APP_TIMESLOT_NFT_ADDRESS=
REACT_APP_MARKETPLACE_ADDRESS=
REACT_APP_ESCROW_ADDRESS=
REACT_APP_REVIEW_SYSTEM_ADDRESS=
REACT_APP_USER_REGISTRY_ADDRESS=
REACT_APP_FACTORY_ADDRESS=
EOF

echo "✅ Environment files created!"
echo ""
echo "📋 Next steps:"
echo "1. Install dependencies: npm install && cd backend && npm install && cd ../frontend && npm install"
echo "2. Start MongoDB: sudo systemctl start mongodb"
echo "3. Start Hardhat: npx hardhat node"
echo "4. Deploy contracts: npx hardhat run scripts/deploy-all.js --network localhost"
echo "5. Copy contract addresses to .env files"
echo "6. Start backend: cd backend && npm start"
echo "7. Start frontend: cd frontend && npm start"
echo ""
echo "🌐 URLs:"
echo "- Frontend: http://localhost:3000"
echo "- Backend: http://localhost:5000"
echo "- GraphQL: http://localhost:5000/graphql"
