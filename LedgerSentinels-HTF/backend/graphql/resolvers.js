const User = require('../models/User');
const ExpertProfile = require('../models/ExpertProfile');
const TimeSlot = require('../models/TimeSlot');
const Review = require('../models/Review');

const resolvers = {
  Query: {
    users: async () => {
      return await User.find().populate('expertProfile');
    },
    user: async (_, { address }, { contractService }) => {
      try {
        // Get user from database
        const dbUser = await User.findOne({ address }).populate('expertProfile');
        
        if (dbUser) {
          // Get additional data from blockchain
          try {
            const blockchainProfile = await contractService.getUserProfile(address);
            const isExpert = await contractService.isExpert(address);
            const isVerifiedExpert = await contractService.isVerifiedExpert(address);
            
            return {
              ...dbUser.toObject(),
              isVerified: blockchainProfile.isVerified,
              isActive: blockchainProfile.isActive,
              lastActive: new Date(parseInt(blockchainProfile.lastActive) * 1000).toISOString(),
              profileImage: blockchainProfile.profileImage,
              bio: blockchainProfile.bio,
              socialLinks: [], // Would need to fetch from custom fields
            };
          } catch (error) {
            console.error('Error fetching blockchain data:', error);
            return dbUser;
          }
        }
        
        return null;
      } catch (error) {
        console.error('Error in user query:', error);
        throw new Error('Failed to fetch user');
      }
    },
    experts: async () => {
      return await User.find({ isExpert: true }).populate('expertProfile');
    },
    expert: async (_, { address }, { contractService }) => {
      try {
        const dbUser = await User.findOne({ address, isExpert: true }).populate('expertProfile');
        
        if (dbUser) {
          try {
            const blockchainProfile = await contractService.getUserProfile(address);
            const expertProfile = await contractService.getExpertProfile(address);
            const ratingBreakdown = await contractService.getExpertRatingBreakdown(address);
            
            return {
              ...dbUser.toObject(),
              isVerified: blockchainProfile.isVerified,
              isActive: blockchainProfile.isActive,
              lastActive: new Date(parseInt(blockchainProfile.lastActive) * 1000).toISOString(),
              profileImage: blockchainProfile.profileImage,
              bio: blockchainProfile.bio,
              expertProfile: {
                ...dbUser.expertProfile?.toObject(),
                averageRating: ratingBreakdown.averageRating,
                ratingBreakdown: {
                  totalReviews: ratingBreakdown.totalReviews,
                  averageRating: ratingBreakdown.averageRating,
                  ratingCounts: ratingBreakdown.ratingCounts.slice(1), // Remove index 0
                }
              }
            };
          } catch (error) {
            console.error('Error fetching blockchain data:', error);
            return dbUser;
          }
        }
        
        return null;
      } catch (error) {
        console.error('Error in expert query:', error);
        throw new Error('Failed to fetch expert');
      }
    },
    timeSlots: async () => {
      return await TimeSlot.find();
    },
    timeSlot: async (_, { tokenId }, { contractService }) => {
      try {
        const dbSlot = await TimeSlot.findOne({ tokenId });
        
        if (dbSlot) {
          try {
            const blockchainSlot = await contractService.getTimeSlot(tokenId);
            const tokenURI = await contractService.contracts.TimeSlotNFT.tokenURI(tokenId);
            
            return {
              ...dbSlot.toObject(),
              tokenURI
            };
          } catch (error) {
            console.error('Error fetching blockchain data:', error);
            return dbSlot;
          }
        }
        
        return null;
      } catch (error) {
        console.error('Error in timeSlot query:', error);
        throw new Error('Failed to fetch time slot');
      }
    },
    expertSlots: async (_, { expertAddress }, { contractService }) => {
      try {
        const dbSlots = await TimeSlot.find({ expert: expertAddress });
        
        // Also fetch from blockchain
        try {
          const blockchainSlots = await contractService.getExpertSlots(expertAddress);
          // Merge data from both sources
          return dbSlots;
        } catch (error) {
          console.error('Error fetching blockchain slots:', error);
          return dbSlots;
        }
      } catch (error) {
        console.error('Error in expertSlots query:', error);
        throw new Error('Failed to fetch expert slots');
      }
    },
    userBookings: async (_, { userAddress }, { contractService }) => {
      try {
        const dbBookings = await TimeSlot.find({ bookedBy: userAddress });
        
        // Also fetch from blockchain
        try {
          const blockchainBookings = await contractService.getUserBookings(userAddress);
          return dbBookings;
        } catch (error) {
          console.error('Error fetching blockchain bookings:', error);
          return dbBookings;
        }
      } catch (error) {
        console.error('Error in userBookings query:', error);
        throw new Error('Failed to fetch user bookings');
      }
    },
    reviews: async (_, { expertAddress }, { contractService }) => {
      try {
        const dbReviews = await Review.find({ expertAddress });
        
        // Also fetch from blockchain
        try {
          const blockchainReviews = await contractService.getExpertReviews(expertAddress);
          return dbReviews;
        } catch (error) {
          console.error('Error fetching blockchain reviews:', error);
          return dbReviews;
        }
      } catch (error) {
        console.error('Error in reviews query:', error);
        throw new Error('Failed to fetch reviews');
      }
    },
    review: async (_, { tokenId }, { contractService }) => {
      try {
        const blockchainReview = await contractService.getReview(tokenId);
        
        return {
          id: tokenId.toString(),
          tokenId: parseInt(blockchainReview.tokenId),
          reviewer: blockchainReview.reviewer,
          expert: blockchainReview.expert,
          rating: parseInt(blockchainReview.rating),
          comment: blockchainReview.comment,
          timestamp: new Date(parseInt(blockchainReview.timestamp) * 1000).toISOString(),
          isVerified: blockchainReview.isVerified,
        };
      } catch (error) {
        console.error('Error in review query:', error);
        throw new Error('Failed to fetch review');
      }
    },
    bookings: async () => {
      return await TimeSlot.find({ isBooked: true });
    },
    listings: async (_, __, { contractService }) => {
      try {
        // This would need to be implemented with proper indexing
        // For now, return empty array
        return [];
      } catch (error) {
        console.error('Error in listings query:', error);
        throw new Error('Failed to fetch listings');
      }
    },
    listing: async (_, { tokenId }, { contractService }) => {
      try {
        const listing = await contractService.getListing(tokenId);
        
        return {
          tokenId: parseInt(listing.tokenId),
          seller: listing.seller,
          price: contractService.formatEther(listing.price),
          isActive: listing.isActive,
          listingTime: new Date(parseInt(listing.listingTime) * 1000).toISOString(),
          isAuction: listing.isAuction,
          auctionEndTime: listing.auctionEndTime ? new Date(parseInt(listing.auctionEndTime) * 1000).toISOString() : null,
          highestBid: listing.highestBid ? contractService.formatEther(listing.highestBid) : null,
          highestBidder: listing.highestBidder,
        };
      } catch (error) {
        console.error('Error in listing query:', error);
        throw new Error('Failed to fetch listing');
      }
    },
    auctionBids: async (_, { tokenId }, { contractService }) => {
      try {
        const bids = await contractService.getAuctionBids(tokenId);
        
        return bids.map(bid => ({
          bidder: bid.bidder,
          amount: contractService.formatEther(bid.amount),
          timestamp: new Date(parseInt(bid.timestamp) * 1000).toISOString(),
        }));
      } catch (error) {
        console.error('Error in auctionBids query:', error);
        throw new Error('Failed to fetch auction bids');
      }
    },
    escrow: async (_, { tokenId }, { contractService }) => {
      try {
        const escrow = await contractService.getEscrow(tokenId);
        
        return {
          tokenId: parseInt(escrow.tokenId),
          buyer: escrow.buyer,
          seller: escrow.seller,
          amount: contractService.formatEther(escrow.amount),
          startTime: new Date(parseInt(escrow.startTime) * 1000).toISOString(),
          endTime: new Date(parseInt(escrow.endTime) * 1000).toISOString(),
          status: ['Pending', 'Confirmed', 'Disputed', 'Completed', 'Cancelled'][escrow.status],
          createdAt: new Date(parseInt(escrow.createdAt) * 1000).toISOString(),
          disputeDeadline: new Date(parseInt(escrow.disputeDeadline) * 1000).toISOString(),
          meetingLink: escrow.meetingLink,
          notes: escrow.notes,
        };
      } catch (error) {
        console.error('Error in escrow query:', error);
        throw new Error('Failed to fetch escrow');
      }
    },
    userEscrows: async (_, { userAddress }, { contractService }) => {
      try {
        const escrowIds = await contractService.getUserEscrows(userAddress);
        const escrows = [];
        
        for (const escrowId of escrowIds) {
          try {
            const escrow = await contractService.getEscrow(escrowId);
            escrows.push({
              tokenId: parseInt(escrow.tokenId),
              buyer: escrow.buyer,
              seller: escrow.seller,
              amount: contractService.formatEther(escrow.amount),
              startTime: new Date(parseInt(escrow.startTime) * 1000).toISOString(),
              endTime: new Date(parseInt(escrow.endTime) * 1000).toISOString(),
              status: ['Pending', 'Confirmed', 'Disputed', 'Completed', 'Cancelled'][escrow.status],
              createdAt: new Date(parseInt(escrow.createdAt) * 1000).toISOString(),
              disputeDeadline: new Date(parseInt(escrow.disputeDeadline) * 1000).toISOString(),
              meetingLink: escrow.meetingLink,
              notes: escrow.notes,
            });
          } catch (error) {
            console.error(`Error fetching escrow ${escrowId}:`, error);
          }
        }
        
        return escrows;
      } catch (error) {
        console.error('Error in userEscrows query:', error);
        throw new Error('Failed to fetch user escrows');
      }
    },
    contractAddresses: async (_, __, { contractService }) => {
      try {
        const addresses = await contractService.getContractAddresses();
        return addresses;
      } catch (error) {
        console.error('Error in contractAddresses query:', error);
        throw new Error('Failed to fetch contract addresses');
      }
    },
    expertRatingBreakdown: async (_, { expertAddress }, { contractService }) => {
      try {
        const breakdown = await contractService.getExpertRatingBreakdown(expertAddress);
        return {
          totalReviews: breakdown.totalReviews,
          averageRating: breakdown.averageRating,
          ratingCounts: breakdown.ratingCounts.slice(1), // Remove index 0
        };
      } catch (error) {
        console.error('Error in expertRatingBreakdown query:', error);
        throw new Error('Failed to fetch expert rating breakdown');
      }
    },
  },

  Mutation: {
    // New mutations for enhanced functionality
    registerUser: async (_, { input }, { contractService }) => {
      try {
        // Register on blockchain
        await contractService.registerUser(
          input.name,
          input.email,
          input.ens || '',
          'Customer', // UserType.Customer
          input.profileImage || '',
          input.bio || '',
          input.userAddress
        );
        
        // Save to database
        const user = new User({
          address: input.userAddress,
          name: input.name,
          email: input.email,
          userType: 'customer',
          isExpert: false,
        });
        
        return await user.save();
      } catch (error) {
        console.error('Error in registerUser:', error);
        throw new Error('Failed to register user');
      }
    },
    
    registerExpert: async (_, { input }, { contractService }) => {
      try {
        // Register on blockchain
        await contractService.registerExpert(
          input.name,
          input.email,
          input.ens || '',
          input.profession,
          input.description,
          input.profileImage || '',
          input.bio || '',
          input.userAddress
        );
        
        // Save to database
        const user = new User({
          address: input.userAddress,
          name: input.name,
          email: input.email,
          userType: 'expert',
          isExpert: true,
        });
        
        return await user.save();
      } catch (error) {
        console.error('Error in registerExpert:', error);
        throw new Error('Failed to register expert');
      }
    },
    
    updateUserProfile: async (_, { input }, { contractService }) => {
      try {
        // Update on blockchain
        await contractService.updateProfile(
          input.name,
          input.email,
          input.ens || '',
          input.profileImage || '',
          input.bio || '',
          input.userAddress
        );
        
        // Update in database
        return await User.findOneAndUpdate(
          { address: input.userAddress },
          {
            name: input.name,
            email: input.email,
          },
          { new: true }
        );
      } catch (error) {
        console.error('Error in updateUserProfile:', error);
        throw new Error('Failed to update user profile');
      }
    },
    
    createTimeSlot: async (_, { input }, { contractService }) => {
      try {
        // Create on blockchain
        const tx = await contractService.createTimeSlot(
          Math.floor(new Date(input.startTime).getTime() / 1000),
          Math.floor(new Date(input.endTime).getTime() / 1000),
          input.price,
          input.profession,
          input.description,
          input.userAddress
        );
        
        // Wait for transaction to be mined and get token ID
        const receipt = await tx.wait();
        // Extract token ID from events (this would need proper event parsing)
        
        // Save to database
        const timeSlot = new TimeSlot({
          tokenId: 0, // Would be extracted from transaction
          expert: input.userAddress,
          startTime: input.startTime,
          endTime: input.endTime,
          price: input.price,
          profession: input.profession,
          description: input.description,
        });
        
        return await timeSlot.save();
      } catch (error) {
        console.error('Error in createTimeSlot:', error);
        throw new Error('Failed to create time slot');
      }
    },
    
    bookSlot: async (_, { input }, { contractService }) => {
      try {
        // Book on blockchain
        const tx = await contractService.bookSlot(
          input.tokenId,
          input.userAddress,
          input.value
        );
        
        // Update in database
        const timeSlot = await TimeSlot.findOneAndUpdate(
          { tokenId: input.tokenId },
          { isBooked: true, bookedBy: input.userAddress },
          { new: true }
        );
        
        return timeSlot;
      } catch (error) {
        console.error('Error in bookSlot:', error);
        throw new Error('Failed to book slot');
      }
    },
    
    bookSlotWithEscrow: async (_, { input }, { contractService }) => {
      try {
        // Book on blockchain
        const tx = await contractService.bookSlot(
          input.tokenId,
          input.userAddress,
          input.value
        );
        
        // Create escrow
        await contractService.createEscrow(
          input.tokenId,
          input.userAddress,
          '', // Would get from time slot
          input.value,
          input.meetingLink || '',
          input.notes || ''
        );
        
        // Update in database
        const timeSlot = await TimeSlot.findOneAndUpdate(
          { tokenId: input.tokenId },
          { isBooked: true, bookedBy: input.userAddress },
          { new: true }
        );
        
        return timeSlot;
      } catch (error) {
        console.error('Error in bookSlotWithEscrow:', error);
        throw new Error('Failed to book slot with escrow');
      }
    },
    
    listItem: async (_, { input }, { contractService }) => {
      try {
        const tx = await contractService.listItem(
          input.tokenId,
          input.price,
          input.userAddress
        );
        
        const listing = await contractService.getListing(input.tokenId);
        
        return {
          tokenId: parseInt(listing.tokenId),
          seller: listing.seller,
          price: contractService.formatEther(listing.price),
          isActive: listing.isActive,
          listingTime: new Date(parseInt(listing.listingTime) * 1000).toISOString(),
          isAuction: listing.isAuction,
          auctionEndTime: listing.auctionEndTime ? new Date(parseInt(listing.auctionEndTime) * 1000).toISOString() : null,
          highestBid: listing.highestBid ? contractService.formatEther(listing.highestBid) : null,
          highestBidder: listing.highestBidder,
        };
      } catch (error) {
        console.error('Error in listItem:', error);
        throw new Error('Failed to list item');
      }
    },
    
    buyItem: async (_, { input }, { contractService }) => {
      try {
        const tx = await contractService.buyItem(
          input.tokenId,
          input.userAddress,
          input.value
        );
        
        return true;
      } catch (error) {
        console.error('Error in buyItem:', error);
        throw new Error('Failed to buy item');
      }
    },
    
    placeBid: async (_, { input }, { contractService }) => {
      try {
        const tx = await contractService.placeBid(
          input.tokenId,
          input.userAddress,
          input.value
        );
        
        return true;
      } catch (error) {
        console.error('Error in placeBid:', error);
        throw new Error('Failed to place bid');
      }
    },
    
    confirmAppointment: async (_, { tokenId }, { contractService }) => {
      try {
        const tx = await contractService.confirmAppointment(tokenId);
        return true;
      } catch (error) {
        console.error('Error in confirmAppointment:', error);
        throw new Error('Failed to confirm appointment');
      }
    },
    
    completeEscrow: async (_, { tokenId }, { contractService }) => {
      try {
        const tx = await contractService.completeEscrow(tokenId);
        return true;
      } catch (error) {
        console.error('Error in completeEscrow:', error);
        throw new Error('Failed to complete escrow');
      }
    },
    
    submitReview: async (_, { input }, { contractService }) => {
      try {
        const tx = await contractService.submitReview(
          input.tokenId,
          input.rating,
          input.comment,
          input.userAddress
        );
        
        return {
          id: input.tokenId.toString(),
          tokenId: input.tokenId,
          reviewer: input.userAddress,
          expert: '', // Would get from time slot
          rating: input.rating,
          comment: input.comment,
          timestamp: new Date().toISOString(),
          isVerified: true,
        };
      } catch (error) {
        console.error('Error in submitReview:', error);
        throw new Error('Failed to submit review');
      }
    },
    
    revokeSlot: async (_, { tokenId }, { contractService }) => {
      try {
        const tx = await contractService.revokeSlot(tokenId);
        
        // Update in database
        return await TimeSlot.findOneAndUpdate(
          { tokenId },
          { isRevoked: true, isBooked: false, bookedBy: null },
          { new: true }
        );
      } catch (error) {
        console.error('Error in revokeSlot:', error);
        throw new Error('Failed to revoke slot');
      }
    },

    // Legacy mutations (for backward compatibility)
    createUser: async (_, { input }) => {
      const user = new User(input);
      return await user.save();
    },
    updateUser: async (_, { address, input }) => {
      return await User.findOneAndUpdate({ address }, input, { new: true });
    },
    createExpertProfile: async (_, { input }) => {
      const expertProfile = new ExpertProfile(input);
      const savedProfile = await expertProfile.save();
      
      // Update user to be expert
      await User.findOneAndUpdate(
        { address: input.address },
        { isExpert: true, expertProfile: savedProfile._id }
      );
      
      return savedProfile;
    },
    updateExpertProfile: async (_, { address, input }) => {
      return await ExpertProfile.findOneAndUpdate({ address }, input, { new: true });
    },
    createTimeSlot: async (_, { input }) => {
      const timeSlot = new TimeSlot(input);
      return await timeSlot.save();
    },
    bookSlot: async (_, { tokenId, userAddress }) => {
      const timeSlot = await TimeSlot.findOneAndUpdate(
        { tokenId },
        { isBooked: true, bookedBy: userAddress },
        { new: true }
      );
      
      // Update expert's total bookings
      if (timeSlot) {
        await ExpertProfile.findOneAndUpdate(
          { address: timeSlot.expert },
          { $inc: { totalBookings: 1 } }
        );
      }
      
      return timeSlot;
    },
    revokeSlot: async (_, { tokenId }) => {
      return await TimeSlot.findOneAndUpdate(
        { tokenId },
        { isRevoked: true, isBooked: false, bookedBy: null },
        { new: true }
      );
    },
    resellSlot: async (_, { tokenId, newPrice }) => {
      return await TimeSlot.findOneAndUpdate(
        { tokenId },
        { price: newPrice, isBooked: false, bookedBy: null },
        { new: true }
      );
    },
    createReview: async (_, { input }) => {
      const review = new Review(input);
      const savedReview = await review.save();
      
      // Update expert's rating
      const expertReviews = await Review.find({ expertAddress: input.expertAddress });
      const totalRating = expertReviews.reduce((sum, r) => sum + r.rating, 0);
      const averageRating = totalRating / expertReviews.length;
      
      await ExpertProfile.findOneAndUpdate(
        { address: input.expertAddress },
        { 
          rating: averageRating * 20, // Store as percentage
          reviewCount: expertReviews.length 
        }
      );
      
      return savedReview;
    },
  },
};

module.exports = resolvers;