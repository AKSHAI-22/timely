import { ethers } from 'ethers';

// Contract addresses for localhost (Hardhat)
export const CONTRACT_ADDRESSES = {
    TimeSlotNFT: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
    TimeSlotMarketplace: '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512',
    TimeSlotEscrow: '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0',
    ReviewSystem: '0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9',
    UserRegistry: '0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9',
    TimeSlotFactory: '0x5FC8d32690cc91D4c39d9d3abcBD16989F875707',
};

// Basic contract interfaces (simplified for frontend)
export const TimeSlotNFT_ABI = [
    'function createTimeSlot(uint256 startTime, uint256 endTime, uint256 price, string memory profession, string memory description) external',
    'function bookSlot(uint256 tokenId) external payable',
    'function revokeSlot(uint256 tokenId) external',
    'function getTimeSlot(uint256 tokenId) external view returns (tuple(uint256 startTime, uint256 endTime, uint256 price, string profession, string description, address expert, address bookedBy, bool isBooked, bool isRevoked))',
    'function tokenURI(uint256 tokenId) external view returns (string memory)',
    'function ownerOf(uint256 tokenId) external view returns (address)',
    'function balanceOf(address owner) external view returns (uint256)',
    'function tokenOfOwnerByIndex(address owner, uint256 index) external view returns (uint256)',
    'function totalSupply() external view returns (uint256)',
    'function tokenByIndex(uint256 index) external view returns (uint256)',
    'event SlotCreated(uint256 indexed tokenId, address indexed expert, uint256 startTime, uint256 endTime, uint256 price, string profession)',
    'event SlotBooked(uint256 indexed tokenId, address indexed expert, address indexed booker, uint256 price)',
    'event SlotRevoked(uint256 indexed tokenId, address indexed expert, address indexed booker)',
];

export const TimeSlotMarketplace_ABI = [
    'function listItem(uint256 tokenId, uint256 price) external',
    'function buyItem(uint256 tokenId) external payable',
    'function getListing(uint256 tokenId) external view returns (tuple(uint256 tokenId, address seller, uint256 price, bool isActive, uint256 listingTime, bool isAuction, uint256 auctionEndTime, uint256 highestBid, address highestBidder))',
    'event ItemListed(uint256 indexed tokenId, address indexed seller, uint256 price)',
    'event ItemSold(uint256 indexed tokenId, address indexed buyer, uint256 price)',
];

export const TimeSlotEscrow_ABI = [
    'function createEscrow(uint256 tokenId, address buyer, address seller, uint256 amount, string memory meetingLink, string memory notes) external payable',
    'function confirmAppointment(uint256 tokenId) external',
    'function completeEscrow(uint256 tokenId) external',
    'function getEscrow(uint256 tokenId) external view returns (tuple(uint256 tokenId, address buyer, address seller, uint256 amount, uint256 startTime, uint256 endTime, uint8 status, uint256 createdAt, uint256 disputeDeadline, string meetingLink, string notes, bool buyerConfirmed, bool sellerConfirmed))',
    'event EscrowCreated(uint256 indexed tokenId, address indexed buyer, address indexed seller, uint256 amount)',
    'event EscrowConfirmed(uint256 indexed tokenId, address indexed confirmer)',
    'event EscrowCompleted(uint256 indexed tokenId)',
];

export const ReviewSystem_ABI = [
    'function submitReview(uint256 tokenId, uint8 rating, string memory comment) external',
    'function getReview(uint256 tokenId) external view returns (tuple(uint256 tokenId, address reviewer, address expert, uint8 rating, string comment, uint256 timestamp, bool isVerified))',
    'function getExpertReviews(address expert) external view returns (tuple(uint256 tokenId, address reviewer, address expert, uint8 rating, string comment, uint256 timestamp, bool isVerified)[])',
    'event ReviewSubmitted(uint256 indexed tokenId, address indexed reviewer, address indexed expert, uint8 rating)',
];

export const UserRegistry_ABI = [
    'function registerUser(string memory name, string memory email, string memory ens, uint8 userType, string memory profileImage, string memory bio) external payable',
    'function updateProfile(string memory name, string memory email, string memory ens, string memory profileImage, string memory bio) external',
    'function getUserProfile(address user) external view returns (tuple(string name, string email, string ens, uint8 userType, string profileImage, string bio, bool isVerified, bool isActive, uint256 lastActive))',
    'function isExpert(address user) external view returns (bool)',
    'function isVerifiedExpert(address user) external view returns (bool)',
    'event UserRegistered(address indexed user, string name, uint8 userType)',
    'event ProfileUpdated(address indexed user)',
];

// Contract helper functions
export const getContract = (
    address: string,
    abi: any[],
    provider: ethers.Provider | ethers.Signer
) => {
    return new ethers.Contract(address, abi, provider);
};

export const formatEther = (wei: bigint) => {
    return ethers.formatEther(wei);
};

export const parseEther = (ether: string) => {
    return ethers.parseEther(ether);
};

export const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

export const formatTime = (timestamp: bigint) => {
    return new Date(Number(timestamp) * 1000).toLocaleString();
};

export const isSlotAvailable = (slot: any) => {
    return !slot.isBooked && !slot.isRevoked;
};

export const isSlotBooked = (slot: any) => {
    return slot.isBooked && !slot.isRevoked;
};

export const isSlotRevoked = (slot: any) => {
    return slot.isRevoked;
};

export const getSlotStatus = (slot: any) => {
    if (slot.isRevoked) return 'revoked';
    if (slot.isBooked) return 'booked';
    return 'available';
};

export const getSlotStatusColor = (status: string) => {
    switch (status) {
        case 'available':
            return 'success';
        case 'booked':
            return 'info';
        case 'revoked':
            return 'error';
        default:
            return 'default';
    }
};

export const getSlotStatusText = (status: string) => {
    switch (status) {
        case 'available':
            return 'Available';
        case 'booked':
            return 'Booked';
        case 'revoked':
            return 'Revoked';
        default:
            return 'Unknown';
    }
};



