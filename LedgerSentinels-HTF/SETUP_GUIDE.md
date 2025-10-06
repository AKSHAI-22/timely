# Timely - Setup Guide

This guide will help you set up and run the Timely appointment booking platform.

## Prerequisites

Before starting, make sure you have the following installed:

- **Node.js** (v16 or higher)
- **MongoDB** (v4.4 or higher)
- **MetaMask** browser extension
- **Git**

## Quick Setup

1. **Clone and navigate to the project:**
   ```bash
   cd LedgerSentinels-HTF
   ```

2. **Run the setup script:**
   ```bash
   ./setup-project.sh
   ```

3. **Start the services:**
   ```bash
   ./start-all.sh
   ```

## Manual Setup

If you prefer to set up manually:

### 1. Install Dependencies

```bash
# Install root dependencies
npm install

# Install backend dependencies
cd backend
npm install
cd ..

# Install frontend dependencies
cd frontend
npm install
cd ..
```

### 2. Environment Configuration

Copy the example environment file:
```bash
cp env.example .env
```

Create frontend environment file:
```bash
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
```

### 3. Start MongoDB

```bash
# Start MongoDB (if not already running)
mongod --dbpath ./data/db --fork --logpath ./data/mongodb.log
```

### 4. Deploy Smart Contracts

```bash
# Compile contracts
npx hardhat compile

# Deploy contracts to localhost
npx hardhat run scripts/deploy-all.js --network localhost
```

### 5. Start Backend

```bash
cd backend
npm start
```

### 6. Start Frontend

```bash
cd frontend
npm start
```

## Accessing the Application

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:5000
- **GraphQL Playground:** http://localhost:5000/graphql

## MetaMask Configuration

1. **Install MetaMask** browser extension
2. **Add Localhost Network:**
   - Network Name: Hardhat Local
   - RPC URL: http://localhost:8545
   - Chain ID: 31337
   - Currency Symbol: ETH
3. **Import Test Account:**
   - Private Key: `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80`
   - This account has 10,000 ETH for testing

## Project Structure

```
LedgerSentinels-HTF/
├── contracts/           # Smart contracts
├── backend/            # Node.js/Express backend
├── frontend/           # React/TypeScript frontend
├── scripts/            # Deployment scripts
├── artifacts/          # Compiled contracts
└── contract-addresses.json  # Deployed contract addresses
```

## Key Features

- **Wallet Integration:** MetaMask connection
- **User Authentication:** JWT-based auth with wallet integration
- **Role-based Access:** Expert and Customer dashboards
- **Smart Contracts:** TimeSlot NFTs, Marketplace, Escrow, Reviews
- **Real-time Updates:** Contract event listening
- **Responsive UI:** Material-UI components

## Troubleshooting

### Common Issues

1. **MongoDB Connection Error:**
   ```bash
   # Check if MongoDB is running
   pgrep mongod
   
   # Start MongoDB if not running
   mongod --dbpath ./data/db --fork --logpath ./data/mongodb.log
   ```

2. **Contract Deployment Failed:**
   ```bash
   # Make sure Hardhat node is running
   npx hardhat node
   
   # In another terminal, deploy contracts
   npx hardhat run scripts/deploy-all.js --network localhost
   ```

3. **Frontend Build Errors:**
   ```bash
   # Clear cache and reinstall
   cd frontend
   rm -rf node_modules package-lock.json
   npm install
   npm start
   ```

4. **MetaMask Connection Issues:**
   - Make sure you're on the correct network (localhost:31337)
   - Check if MetaMask is unlocked
   - Try refreshing the page

### Reset Everything

```bash
# Stop all services
pkill -f "node.*server.js"
pkill -f "react-scripts"
pkill -f "hardhat"

# Reset database
cd backend
node reset-db.js
cd ..

# Restart everything
./start-all.sh
```

## Development

### Adding New Features

1. **Smart Contracts:** Add to `contracts/` directory
2. **Backend API:** Add routes to `backend/routes/`
3. **Frontend:** Add components to `frontend/src/components/`

### Testing

```bash
# Test smart contracts
npx hardhat test

# Test backend API
cd backend
npm test

# Test frontend
cd frontend
npm test
```

## Production Deployment

For production deployment:

1. **Update environment variables** with production values
2. **Deploy contracts** to mainnet/testnet
3. **Update contract addresses** in frontend
4. **Configure MongoDB** for production
5. **Set up reverse proxy** (nginx)
6. **Enable HTTPS**

## Support

If you encounter any issues:

1. Check the troubleshooting section above
2. Review the console logs for errors
3. Ensure all prerequisites are installed
4. Verify environment configuration

## License

This project is licensed under the MIT License.
