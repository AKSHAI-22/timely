# Timely - Decentralized Appointment Booking Platform

A comprehensive blockchain-based appointment booking platform built on Ethereum, featuring NFT-based time slots, secure payments, and a decentralized marketplace.

## 🌟 Features

### For Experts
- **Profile Management**: Create and manage expert profiles with profession, description, and ENS integration
- **Time Slot Creation**: Mint NFT-based time slots for up to 7 days in advance
- **Booking Management**: View and manage all bookings with real-time status updates
- **Analytics Dashboard**: Track earnings, bookings, and ratings over time
- **Revenue Sharing**: 3% platform fee, 2% royalty on resales

### For Customers
- **Expert Discovery**: Search and filter experts by profession, price, and availability
- **Secure Booking**: Book appointments using ETH with smart contract escrow
- **Booking History**: Track current and past appointments
- **Resale Marketplace**: Sell unwanted bookings at or below original price
- **Review System**: Rate and review experts after appointments

### Platform Features
- **Smart Contract Escrow**: Secure payment handling with automatic dispute resolution
- **NFT-Based Slots**: Each time slot is a unique NFT with metadata
- **Decentralized Marketplace**: Peer-to-peer trading of appointment slots
- **ENS Integration**: Human-readable addresses for better UX
- **Real-time Updates**: Live status updates for all bookings
- **Mobile Responsive**: Optimized for all device sizes

## 🏗️ Architecture

### Smart Contracts
- **TimeSlotNFT**: ERC-721 NFT contract for time slots
- **Payment Escrow**: Secure fund management with dispute resolution
- **Marketplace**: P2P trading of appointment slots

### Frontend
- **React + TypeScript**: Modern, type-safe frontend
- **Material-UI**: Beautiful, responsive design
- **Ethers.js**: Ethereum blockchain integration
- **WalletConnect**: Multi-wallet support

### Backend
- **Node.js + Express**: RESTful API server
- **MongoDB**: User data and booking history
- **GraphQL**: Efficient data querying
- **Apollo Server**: GraphQL endpoint

### Blockchain Integration
- **Ethereum Sepolia**: Testnet deployment
- **The Graph**: Decentralized indexing
- **IPFS**: Metadata storage (future enhancement)

## 🚀 Quick Start

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- MongoDB
- MetaMask or compatible wallet
- ETH on Sepolia testnet

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd timely-project
   ```

2. **Install dependencies**
   ```bash
   npm run install:all
   ```

3. **Set up environment variables**
   ```bash
   # Copy environment files
   cp backend/.env.example backend/.env
   cp frontend/.env.example frontend/.env
   
   # Edit the files with your configuration
   ```

4. **Deploy and start the application**
   ```bash
   ./deploy.sh
   ```

### Manual Setup

If you prefer to set up each component manually:

1. **Smart Contracts**
   ```bash
   npm install
   npm run compile
   npm run deploy:local  # or npm run deploy for sepolia
   ```

2. **Backend**
   ```bash
   cd backend
   npm install
   npm start
   ```

3. **Frontend**
   ```bash
   cd frontend
   npm install
   npm start
   ```

## 📱 Usage

### For Experts

1. **Connect Wallet**: Connect your MetaMask wallet
2. **Create Profile**: Sign up as an expert and create your profile
3. **Create Slots**: Use the dashboard to create time slots
4. **Manage Bookings**: View and manage all your bookings
5. **Track Analytics**: Monitor your performance and earnings

### For Customers

1. **Connect Wallet**: Connect your MetaMask wallet
2. **Browse Experts**: Search and filter available experts
3. **Book Appointments**: Select and book time slots
4. **Manage Bookings**: View your current and past bookings
5. **Resell Slots**: Sell unwanted bookings on the marketplace

## 🔧 Configuration

### Environment Variables

**Backend (.env)**
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/timely
JWT_SECRET=your_jwt_secret_key
NODE_ENV=development
```

**Frontend (.env)**
```
REACT_APP_CONTRACT_ADDRESS=0x...
REACT_APP_NETWORK_ID=11155111
REACT_APP_RPC_URL=https://sepolia.infura.io/v3/YOUR_KEY
```

### Smart Contract Deployment

1. **Update contract addresses** in `frontend/src/utils/contracts.ts`
2. **Configure network settings** in `hardhat.config.js`
3. **Deploy to your preferred network**

## 🧪 Testing

### Smart Contracts
```bash
npm test
```

### Frontend
```bash
cd frontend
npm test
```

### Backend
```bash
cd backend
npm test
```

## 📊 Analytics

The platform provides comprehensive analytics for experts:

- **Weekly/Monthly/Yearly Reports**: Track performance over time
- **Revenue Analytics**: Monitor earnings and trends
- **Booking Statistics**: View booking patterns and success rates
- **Rating Trends**: Track rating changes over time

## 🔒 Security Features

- **Smart Contract Escrow**: Funds held securely until appointment completion
- **Dispute Resolution**: Automated conflict resolution system
- **Time-based Revocation**: Automatic slot cancellation before appointment time
- **Price Protection**: Resale price limits to prevent price manipulation
- **Wallet Integration**: Secure wallet-based authentication

## 🌐 Network Support

- **Ethereum Sepolia**: Primary testnet
- **Ethereum Mainnet**: Production deployment (future)
- **Polygon**: Layer 2 scaling (future)
- **Arbitrum**: Optimistic rollup (future)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue on GitHub
- Join our Discord community
- Email: support@timely.app

## 🗺️ Roadmap

### Phase 1 (Current)
- ✅ Basic booking system
- ✅ NFT time slots
- ✅ Payment escrow
- ✅ Expert profiles

### Phase 2 (Next)
- 🔄 Mobile app
- 🔄 Advanced analytics
- 🔄 Multi-language support
- 🔄 Video integration

### Phase 3 (Future)
- 📋 AI-powered matching
- 📋 Cross-chain support
- 📋 DAO governance
- 📋 Token rewards

## 🙏 Acknowledgments

- OpenZeppelin for smart contract libraries
- Material-UI for frontend components
- The Graph for decentralized indexing
- Ethereum community for blockchain infrastructure

---

**Built with ❤️ for the decentralized future of appointment booking**
