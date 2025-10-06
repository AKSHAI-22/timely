import { ethers } from 'ethers';
import {
    CONTRACT_ADDRESSES,
    TimeSlotNFT_ABI,
    TimeSlotMarketplace_ABI,
    TimeSlotEscrow_ABI,
    ReviewSystem_ABI,
    UserRegistry_ABI,
    getContract,
    formatEther,
    parseEther,
} from '../utils/contracts';

export interface TimeSlot {
    tokenId: bigint;
    startTime: bigint;
    endTime: bigint;
    price: bigint;
    profession: string;
    description: string;
    expert: string;
    bookedBy: string;
    isBooked: boolean;
    isRevoked: boolean;
}

export interface ExpertProfile {
    name: string;
    profession: string;
    description: string;
    ens: string;
    profileImage: string;
    bio: string;
    isVerified: boolean;
    isActive: boolean;
    lastActive: bigint;
}

export interface Escrow {
    tokenId: bigint;
    buyer: string;
    seller: string;
    amount: bigint;
    startTime: bigint;
    endTime: bigint;
    status: number;
    createdAt: bigint;
    disputeDeadline: bigint;
    meetingLink: string;
    notes: string;
    buyerConfirmed: boolean;
    sellerConfirmed: boolean;
}

export interface Review {
    tokenId: bigint;
    reviewer: string;
    expert: string;
    rating: number;
    comment: string;
    timestamp: bigint;
    isVerified: boolean;
}

class ContractService {
    private provider: ethers.BrowserProvider | null = null;
    private signer: ethers.JsonRpcSigner | null = null;

    constructor() {
        // Initialize with window.ethereum if available
        if (typeof window !== 'undefined' && window.ethereum) {
            this.provider = new ethers.BrowserProvider(window.ethereum);
        }
    }

    setProvider(provider: ethers.BrowserProvider) {
        this.provider = provider;
    }

    setSigner(signer: ethers.JsonRpcSigner) {
        this.signer = signer;
    }

    // TimeSlotNFT methods
    async createTimeSlot(
        startTime: number,
        endTime: number,
        price: string,
        profession: string,
        description: string
    ): Promise<ethers.ContractTransactionResponse> {
        if (!this.signer) throw new Error('Signer not available');

        const contract = getContract(CONTRACT_ADDRESSES.TimeSlotNFT, TimeSlotNFT_ABI, this.signer);
        return await contract.createTimeSlot(
            startTime,
            endTime,
            parseEther(price),
            profession,
            description
        );
    }

    async bookSlot(tokenId: bigint, price: bigint): Promise<ethers.ContractTransactionResponse> {
        if (!this.signer) throw new Error('Signer not available');

        const contract = getContract(CONTRACT_ADDRESSES.TimeSlotNFT, TimeSlotNFT_ABI, this.signer);
        return await contract.bookSlot(tokenId, { value: price });
    }

    async revokeSlot(tokenId: bigint): Promise<ethers.ContractTransactionResponse> {
        if (!this.signer) throw new Error('Signer not available');

        const contract = getContract(CONTRACT_ADDRESSES.TimeSlotNFT, TimeSlotNFT_ABI, this.signer);
        return await contract.revokeSlot(tokenId);
    }

    async getTimeSlot(tokenId: bigint): Promise<TimeSlot> {
        if (!this.provider) throw new Error('Provider not available');

        const contract = getContract(CONTRACT_ADDRESSES.TimeSlotNFT, TimeSlotNFT_ABI, this.provider);
        const slot = await contract.getTimeSlot(tokenId);

        return {
            tokenId: slot.tokenId,
            startTime: slot.startTime,
            endTime: slot.endTime,
            price: slot.price,
            profession: slot.profession,
            description: slot.description,
            expert: slot.expert,
            bookedBy: slot.bookedBy,
            isBooked: slot.isBooked,
            isRevoked: slot.isRevoked,
        };
    }

    async getTotalSupply(): Promise<bigint> {
        if (!this.provider) throw new Error('Provider not available');

        const contract = getContract(CONTRACT_ADDRESSES.TimeSlotNFT, TimeSlotNFT_ABI, this.provider);
        return await contract.totalSupply();
    }

    async getTokenByIndex(index: number): Promise<bigint> {
        if (!this.provider) throw new Error('Provider not available');

        const contract = getContract(CONTRACT_ADDRESSES.TimeSlotNFT, TimeSlotNFT_ABI, this.provider);
        return await contract.tokenByIndex(index);
    }

    async getAllTimeSlots(limit: number = 20): Promise<TimeSlot[]> {
        if (!this.provider) throw new Error('Provider not available');

        const totalSupply = await this.getTotalSupply();
        const maxSlots = Math.min(Number(totalSupply), limit);
        const slots: TimeSlot[] = [];

        for (let i = 0; i < maxSlots; i++) {
            try {
                const tokenId = await this.getTokenByIndex(i);
                const slot = await this.getTimeSlot(tokenId);
                slots.push(slot);
            } catch (error) {
                console.warn(`Failed to load slot ${i}:`, error);
            }
        }

        return slots;
    }

    // UserRegistry methods
    async registerUser(
        name: string,
        email: string,
        ens: string,
        userType: number,
        profileImage: string,
        bio: string
    ): Promise<ethers.ContractTransactionResponse> {
        if (!this.signer) throw new Error('Signer not available');

        const contract = getContract(CONTRACT_ADDRESSES.UserRegistry, UserRegistry_ABI, this.signer);
        return await contract.registerUser(name, email, ens, userType, profileImage, bio);
    }

    async updateProfile(
        name: string,
        email: string,
        ens: string,
        profileImage: string,
        bio: string
    ): Promise<ethers.ContractTransactionResponse> {
        if (!this.signer) throw new Error('Signer not available');

        const contract = getContract(CONTRACT_ADDRESSES.UserRegistry, UserRegistry_ABI, this.signer);
        return await contract.updateProfile(name, email, ens, profileImage, bio);
    }

    async getUserProfile(userAddress: string): Promise<ExpertProfile> {
        if (!this.provider) throw new Error('Provider not available');

        const contract = getContract(CONTRACT_ADDRESSES.UserRegistry, UserRegistry_ABI, this.provider);
        const profile = await contract.getUserProfile(userAddress);

        return {
            name: profile.name,
            profession: profile.profession,
            description: profile.description,
            ens: profile.ens,
            profileImage: profile.profileImage,
            bio: profile.bio,
            isVerified: profile.isVerified,
            isActive: profile.isActive,
            lastActive: profile.lastActive,
        };
    }

    async isExpert(userAddress: string): Promise<boolean> {
        if (!this.provider) throw new Error('Provider not available');

        const contract = getContract(CONTRACT_ADDRESSES.UserRegistry, UserRegistry_ABI, this.provider);
        return await contract.isExpert(userAddress);
    }

    async isVerifiedExpert(userAddress: string): Promise<boolean> {
        if (!this.provider) throw new Error('Provider not available');

        const contract = getContract(CONTRACT_ADDRESSES.UserRegistry, UserRegistry_ABI, this.provider);
        return await contract.isVerifiedExpert(userAddress);
    }

    // Marketplace methods
    async listItem(tokenId: bigint, price: string): Promise<ethers.ContractTransactionResponse> {
        if (!this.signer) throw new Error('Signer not available');

        const contract = getContract(CONTRACT_ADDRESSES.TimeSlotMarketplace, TimeSlotMarketplace_ABI, this.signer);
        return await contract.listItem(tokenId, parseEther(price));
    }

    async buyItem(tokenId: bigint, price: bigint): Promise<ethers.ContractTransactionResponse> {
        if (!this.signer) throw new Error('Signer not available');

        const contract = getContract(CONTRACT_ADDRESSES.TimeSlotMarketplace, TimeSlotMarketplace_ABI, this.signer);
        return await contract.buyItem(tokenId, { value: price });
    }

    async getListing(tokenId: bigint): Promise<any> {
        if (!this.provider) throw new Error('Provider not available');

        const contract = getContract(CONTRACT_ADDRESSES.TimeSlotMarketplace, TimeSlotMarketplace_ABI, this.provider);
        return await contract.getListing(tokenId);
    }

    // Escrow methods
    async createEscrow(
        tokenId: bigint,
        buyer: string,
        seller: string,
        amount: string,
        meetingLink: string,
        notes: string
    ): Promise<ethers.ContractTransactionResponse> {
        if (!this.signer) throw new Error('Signer not available');

        const contract = getContract(CONTRACT_ADDRESSES.TimeSlotEscrow, TimeSlotEscrow_ABI, this.signer);
        return await contract.createEscrow(
            tokenId,
            buyer,
            seller,
            parseEther(amount),
            meetingLink,
            notes,
            { value: parseEther(amount) }
        );
    }

    async confirmAppointment(tokenId: bigint): Promise<ethers.ContractTransactionResponse> {
        if (!this.signer) throw new Error('Signer not available');

        const contract = getContract(CONTRACT_ADDRESSES.TimeSlotEscrow, TimeSlotEscrow_ABI, this.signer);
        return await contract.confirmAppointment(tokenId);
    }

    async completeEscrow(tokenId: bigint): Promise<ethers.ContractTransactionResponse> {
        if (!this.signer) throw new Error('Signer not available');

        const contract = getContract(CONTRACT_ADDRESSES.TimeSlotEscrow, TimeSlotEscrow_ABI, this.signer);
        return await contract.completeEscrow(tokenId);
    }

    async getEscrow(tokenId: bigint): Promise<Escrow> {
        if (!this.provider) throw new Error('Provider not available');

        const contract = getContract(CONTRACT_ADDRESSES.TimeSlotEscrow, TimeSlotEscrow_ABI, this.provider);
        const escrow = await contract.getEscrow(tokenId);

        return {
            tokenId: escrow.tokenId,
            buyer: escrow.buyer,
            seller: escrow.seller,
            amount: escrow.amount,
            startTime: escrow.startTime,
            endTime: escrow.endTime,
            status: escrow.status,
            createdAt: escrow.createdAt,
            disputeDeadline: escrow.disputeDeadline,
            meetingLink: escrow.meetingLink,
            notes: escrow.notes,
            buyerConfirmed: escrow.buyerConfirmed,
            sellerConfirmed: escrow.sellerConfirmed,
        };
    }

    // Review methods
    async submitReview(
        tokenId: bigint,
        rating: number,
        comment: string
    ): Promise<ethers.ContractTransactionResponse> {
        if (!this.signer) throw new Error('Signer not available');

        const contract = getContract(CONTRACT_ADDRESSES.ReviewSystem, ReviewSystem_ABI, this.signer);
        return await contract.submitReview(tokenId, rating, comment);
    }

    async getReview(tokenId: bigint): Promise<Review> {
        if (!this.provider) throw new Error('Provider not available');

        const contract = getContract(CONTRACT_ADDRESSES.ReviewSystem, ReviewSystem_ABI, this.provider);
        const review = await contract.getReview(tokenId);

        return {
            tokenId: review.tokenId,
            reviewer: review.reviewer,
            expert: review.expert,
            rating: review.rating,
            comment: review.comment,
            timestamp: review.timestamp,
            isVerified: review.isVerified,
        };
    }

    async getExpertReviews(expertAddress: string): Promise<Review[]> {
        if (!this.provider) throw new Error('Provider not available');

        const contract = getContract(CONTRACT_ADDRESSES.ReviewSystem, ReviewSystem_ABI, this.provider);
        const reviews = await contract.getExpertReviews(expertAddress);

        return reviews.map((review: any) => ({
            tokenId: review.tokenId,
            reviewer: review.reviewer,
            expert: review.expert,
            rating: review.rating,
            comment: review.comment,
            timestamp: review.timestamp,
            isVerified: review.isVerified,
        }));
    }

    // Utility methods
    async getBalance(address: string): Promise<string> {
        if (!this.provider) throw new Error('Provider not available');

        const balance = await this.provider.getBalance(address);
        return formatEther(balance);
    }

    async getNetwork(): Promise<ethers.Network> {
        if (!this.provider) throw new Error('Provider not available');

        return await this.provider.getNetwork();
    }
}

export const contractService = new ContractService();
export default contractService;
