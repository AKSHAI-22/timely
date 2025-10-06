const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');

class ContractService {
  constructor() {
    this.provider = null;
    this.signer = null;
    this.contracts = {};
    this.initialized = false;
  }

  async initialize() {
    try {
      // Initialize provider
      this.provider = new ethers.JsonRpcProvider(process.env.RPC_URL || 'http://localhost:8545');

      // Initialize signer if private key is provided
      if (process.env.PRIVATE_KEY) {
        this.signer = new ethers.Wallet(process.env.PRIVATE_KEY, this.provider);
      }

      // Load contract ABIs and addresses
      await this.loadContracts();

      this.initialized = true;
      console.log('Contract service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize contract service:', error);
      throw error;
    }
  }

  async loadContracts() {
    // Load addresses file if available (used as fallback when env vars are not set)
    let contractAddresses = {};
    try {
      contractAddresses = JSON.parse(
        fs.readFileSync(path.join(__dirname, '../../contract-addresses.json'), 'utf8')
      );
    } catch (err) {
      // Optional file; ignore if missing
      console.warn('contract-addresses.json not found or unreadable; relying on environment variables');
    }

    const getAddress = (key) => {
      // Prefer explicit env variable (Sepolia-ready), fallback to file
      // Env keys expected: TIME_SLOT_NFT, TIME_SLOT_MARKETPLACE, TIME_SLOT_ESCROW, REVIEW_SYSTEM, USER_REGISTRY, TIME_SLOT_FACTORY
      const envKey = {
        TimeSlotNFT: 'TIME_SLOT_NFT',
        TimeSlotMarketplace: 'TIME_SLOT_MARKETPLACE',
        TimeSlotEscrow: 'TIME_SLOT_ESCROW',
        ReviewSystem: 'REVIEW_SYSTEM',
        UserRegistry: 'USER_REGISTRY',
        TimeSlotFactory: 'TIME_SLOT_FACTORY',
      }[key];
      return process.env[envKey] || contractAddresses[key];
    };

    const loadAbi = (relativePath) => {
      try {
        return JSON.parse(
          fs.readFileSync(path.join(__dirname, '../../', relativePath), 'utf8')
        ).abi;
      } catch (err) {
        console.warn(`ABI not found for ${relativePath}. Skipping contract load.`);
        return null;
      }
    };

    // Load TimeSlotNFT contract
    const timeSlotNFTABI = loadAbi('artifacts/contracts/TimeSlotNFT.sol/TimeSlotNFT.json');
    if (timeSlotNFTABI && getAddress('TimeSlotNFT')) {
      this.contracts.TimeSlotNFT = new ethers.Contract(
        getAddress('TimeSlotNFT'),
        timeSlotNFTABI,
        this.signer || this.provider
      );
    }

    // Load TimeSlotMarketplace contract
    const marketplaceABI = loadAbi('artifacts/contracts/TimeSlotMarketplace.sol/TimeSlotMarketplace.json');
    if (marketplaceABI && getAddress('TimeSlotMarketplace')) {
      this.contracts.TimeSlotMarketplace = new ethers.Contract(
        getAddress('TimeSlotMarketplace'),
        marketplaceABI,
        this.signer || this.provider
      );
    }

    // Load TimeSlotEscrow contract
    const escrowABI = loadAbi('artifacts/contracts/TimeSlotEscrow.sol/TimeSlotEscrow.json');
    if (escrowABI && getAddress('TimeSlotEscrow')) {
      this.contracts.TimeSlotEscrow = new ethers.Contract(
        getAddress('TimeSlotEscrow'),
        escrowABI,
        this.signer || this.provider
      );
    }

    // Load ReviewSystem contract
    const reviewSystemABI = loadAbi('artifacts/contracts/ReviewSystem.sol/ReviewSystem.json');
    if (reviewSystemABI && getAddress('ReviewSystem')) {
      this.contracts.ReviewSystem = new ethers.Contract(
        getAddress('ReviewSystem'),
        reviewSystemABI,
        this.signer || this.provider
      );
    }

    // Load UserRegistry contract
    const userRegistryABI = loadAbi('artifacts/contracts/UserRegistry.sol/UserRegistry.json');
    if (userRegistryABI && getAddress('UserRegistry')) {
      this.contracts.UserRegistry = new ethers.Contract(
        getAddress('UserRegistry'),
        userRegistryABI,
        this.signer || this.provider
      );
    }

    // Load TimeSlotFactory contract
    const factoryABI = loadAbi('artifacts/contracts/TimeSlotFactory.sol/TimeSlotFactory.json');
    if (factoryABI && getAddress('TimeSlotFactory')) {
      this.contracts.TimeSlotFactory = new ethers.Contract(
        getAddress('TimeSlotFactory'),
        factoryABI,
        this.signer || this.provider
      );
    }
  }

  // TimeSlotNFT methods
  async createExpertProfile(name, profession, description, ens, userAddress) {
    if (!this.initialized) throw new Error('Contract service not initialized');

    const contract = this.contracts.TimeSlotNFT.connect(
      new ethers.Wallet(userAddress, this.provider)
    );

    return await contract.createExpertProfile(name, profession, description, ens);
  }

  async createTimeSlot(startTime, endTime, price, profession, description, userAddress) {
    if (!this.initialized) throw new Error('Contract service not initialized');

    const contract = this.contracts.TimeSlotNFT.connect(
      new ethers.Wallet(userAddress, this.provider)
    );

    return await contract.createTimeSlot(startTime, endTime, price, profession, description);
  }

  async batchCreateTimeSlots(slots, userAddress) {
    if (!this.initialized) throw new Error('Contract service not initialized');

    const contract = this.contracts.TimeSlotNFT.connect(
      new ethers.Wallet(userAddress, this.provider)
    );

    const startTimes = slots.map(slot => slot.startTime);
    const endTimes = slots.map(slot => slot.endTime);
    const prices = slots.map(slot => slot.price);
    const professions = slots.map(slot => slot.profession);
    const descriptions = slots.map(slot => slot.description);

    return await contract.batchCreateTimeSlots(startTimes, endTimes, prices, professions, descriptions);
  }

  async bookSlot(tokenId, userAddress, value) {
    if (!this.initialized) throw new Error('Contract service not initialized');

    const contract = this.contracts.TimeSlotNFT.connect(
      new ethers.Wallet(userAddress, this.provider)
    );

    return await contract.bookSlot(tokenId, { value: ethers.parseEther(value.toString()) });
  }

  async revokeSlot(tokenId, userAddress) {
    if (!this.initialized) throw new Error('Contract service not initialized');

    const contract = this.contracts.TimeSlotNFT.connect(
      new ethers.Wallet(userAddress, this.provider)
    );

    return await contract.revokeSlot(tokenId);
  }

  async getTimeSlot(tokenId) {
    if (!this.initialized) throw new Error('Contract service not initialized');

    return await this.contracts.TimeSlotNFT.getTimeSlot(tokenId);
  }

  async getExpertProfile(expertAddress) {
    if (!this.initialized) throw new Error('Contract service not initialized');

    return await this.contracts.TimeSlotNFT.getExpertProfile(expertAddress);
  }

  async getExpertSlots(expertAddress) {
    if (!this.initialized) throw new Error('Contract service not initialized');

    return await this.contracts.TimeSlotNFT.getExpertSlots(expertAddress);
  }

  async getUserBookings(userAddress) {
    if (!this.initialized) throw new Error('Contract service not initialized');

    return await this.contracts.TimeSlotNFT.getUserBookings(userAddress);
  }

  // Marketplace methods
  async listItem(tokenId, price, userAddress) {
    if (!this.initialized) throw new Error('Contract service not initialized');

    const contract = this.contracts.TimeSlotMarketplace.connect(
      new ethers.Wallet(userAddress, this.provider)
    );

    return await contract.listItem(tokenId, ethers.parseEther(price.toString()));
  }

  async listItemForAuction(tokenId, startingPrice, auctionDuration, userAddress) {
    if (!this.initialized) throw new Error('Contract service not initialized');

    const contract = this.contracts.TimeSlotMarketplace.connect(
      new ethers.Wallet(userAddress, this.provider)
    );

    return await contract.listItemForAuction(
      tokenId,
      ethers.parseEther(startingPrice.toString()),
      auctionDuration
    );
  }

  async buyItem(tokenId, userAddress, value) {
    if (!this.initialized) throw new Error('Contract service not initialized');

    const contract = this.contracts.TimeSlotMarketplace.connect(
      new ethers.Wallet(userAddress, this.provider)
    );

    return await contract.buyItem(tokenId, { value: ethers.parseEther(value.toString()) });
  }

  async placeBid(tokenId, userAddress, value) {
    if (!this.initialized) throw new Error('Contract service not initialized');

    const contract = this.contracts.TimeSlotMarketplace.connect(
      new ethers.Wallet(userAddress, this.provider)
    );

    return await contract.placeBid(tokenId, { value: ethers.parseEther(value.toString()) });
  }

  async endAuction(tokenId, userAddress) {
    if (!this.initialized) throw new Error('Contract service not initialized');

    const contract = this.contracts.TimeSlotMarketplace.connect(
      new ethers.Wallet(userAddress, this.provider)
    );

    return await contract.endAuction(tokenId);
  }

  async getListing(tokenId) {
    if (!this.initialized) throw new Error('Contract service not initialized');

    return await this.contracts.TimeSlotMarketplace.getListing(tokenId);
  }

  async getAuctionBids(tokenId) {
    if (!this.initialized) throw new Error('Contract service not initialized');

    return await this.contracts.TimeSlotMarketplace.getAuctionBids(tokenId);
  }

  // Escrow methods
  async createEscrow(tokenId, buyer, seller, amount, meetingLink, notes) {
    if (!this.initialized) throw new Error('Contract service not initialized');

    return await this.contracts.TimeSlotEscrow.createEscrow(
      tokenId, buyer, seller, ethers.parseEther(amount.toString()), meetingLink, notes
    );
  }

  async confirmAppointment(tokenId, userAddress) {
    if (!this.initialized) throw new Error('Contract service not initialized');

    const contract = this.contracts.TimeSlotEscrow.connect(
      new ethers.Wallet(userAddress, this.provider)
    );

    return await contract.confirmAppointment(tokenId);
  }

  async completeEscrow(tokenId, userAddress) {
    if (!this.initialized) throw new Error('Contract service not initialized');

    const contract = this.contracts.TimeSlotEscrow.connect(
      new ethers.Wallet(userAddress, this.provider)
    );

    return await contract.completeEscrow(tokenId);
  }

  async disputeEscrow(tokenId, reason, userAddress) {
    if (!this.initialized) throw new Error('Contract service not initialized');

    const contract = this.contracts.TimeSlotEscrow.connect(
      new ethers.Wallet(userAddress, this.provider)
    );

    return await contract.disputeEscrow(tokenId, reason);
  }

  async getEscrow(tokenId) {
    if (!this.initialized) throw new Error('Contract service not initialized');

    return await this.contracts.TimeSlotEscrow.getEscrow(tokenId);
  }

  // Review system methods
  async enableReview(tokenId) {
    if (!this.initialized) throw new Error('Contract service not initialized');

    return await this.contracts.ReviewSystem.enableReview(tokenId);
  }

  async submitReview(tokenId, rating, comment, userAddress) {
    if (!this.initialized) throw new Error('Contract service not initialized');

    const contract = this.contracts.ReviewSystem.connect(
      new ethers.Wallet(userAddress, this.provider)
    );

    return await contract.submitReview(tokenId, rating, comment);
  }

  async getReview(tokenId) {
    if (!this.initialized) throw new Error('Contract service not initialized');

    return await this.contracts.ReviewSystem.getReview(tokenId);
  }

  async getExpertReviews(expertAddress) {
    if (!this.initialized) throw new Error('Contract service not initialized');

    return await this.contracts.ReviewSystem.getExpertReviews(expertAddress);
  }

  // User registry methods
  async registerUser(name, email, ens, userType, profileImage, bio, userAddress, value = 0) {
    if (!this.initialized) throw new Error('Contract service not initialized');

    const contract = this.contracts.UserRegistry.connect(
      new ethers.Wallet(userAddress, this.provider)
    );

    return await contract.registerUser(
      name, email, ens, userType, profileImage, bio,
      { value: ethers.parseEther(value.toString()) }
    );
  }

  async updateProfile(name, email, ens, profileImage, bio, userAddress) {
    if (!this.initialized) throw new Error('Contract service not initialized');

    const contract = this.contracts.UserRegistry.connect(
      new ethers.Wallet(userAddress, this.provider)
    );

    return await contract.updateProfile(name, email, ens, profileImage, bio);
  }

  async getUserProfile(userAddress) {
    if (!this.initialized) throw new Error('Contract service not initialized');

    return await this.contracts.UserRegistry.getUserProfile(userAddress);
  }

  async isExpert(userAddress) {
    if (!this.initialized) throw new Error('Contract service not initialized');

    return await this.contracts.UserRegistry.isExpert(userAddress);
  }

  async isVerifiedExpert(userAddress) {
    if (!this.initialized) throw new Error('Contract service not initialized');

    return await this.contracts.UserRegistry.isVerifiedExpert(userAddress);
  }

  // Utility methods
  async getContractAddresses() {
    if (!this.initialized) throw new Error('Contract service not initialized');

    return {
      TimeSlotNFT: await this.contracts.TimeSlotNFT.getAddress(),
      TimeSlotMarketplace: await this.contracts.TimeSlotMarketplace.getAddress(),
      TimeSlotEscrow: await this.contracts.TimeSlotEscrow.getAddress(),
      ReviewSystem: await this.contracts.ReviewSystem.getAddress(),
      UserRegistry: await this.contracts.UserRegistry.getAddress(),
    };
  }

  async getBalance(address) {
    if (!this.initialized) throw new Error('Contract service not initialized');

    return await this.provider.getBalance(address);
  }

  async formatEther(weiAmount) {
    return ethers.formatEther(weiAmount);
  }

  async parseEther(etherAmount) {
    return ethers.parseEther(etherAmount.toString());
  }
}

module.exports = new ContractService();
