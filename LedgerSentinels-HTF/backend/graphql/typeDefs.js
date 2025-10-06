const { gql } = require('apollo-server-express');

const typeDefs = gql`
  type User {
    id: ID!
    address: String!
    name: String!
    email: String!
    userType: String!
    isExpert: Boolean!
    isVerified: Boolean!
    isActive: Boolean!
    expertProfile: ExpertProfile
    createdAt: String!
    lastActive: String!
    profileImage: String
    bio: String
    socialLinks: [String]
  }

  type ExpertProfile {
    id: ID!
    name: String!
    profession: String!
    description: String!
    ens: String
    totalSlots: Int!
    totalBookings: Int!
    rating: Float!
    reviewCount: Int!
    isActive: Boolean!
    averageRating: Float
    ratingBreakdown: RatingBreakdown
  }

  type RatingBreakdown {
    totalReviews: Int!
    averageRating: Float!
    ratingCounts: [Int!]!
  }

  type TimeSlot {
    id: ID!
    tokenId: Int!
    expert: String!
    startTime: String!
    endTime: String!
    price: String!
    isBooked: Boolean!
    bookedBy: String
    isRevoked: Boolean!
    profession: String!
    description: String!
    createdAt: String!
    tokenURI: String
  }

  type Review {
    id: ID!
    tokenId: Int!
    reviewer: String!
    expert: String!
    rating: Int!
    comment: String!
    timestamp: String!
    isVerified: Boolean!
  }

  type Listing {
    tokenId: Int!
    seller: String!
    price: String!
    isActive: Boolean!
    listingTime: String!
    isAuction: Boolean!
    auctionEndTime: String
    highestBid: String
    highestBidder: String
  }

  type AuctionBid {
    bidder: String!
    amount: String!
    timestamp: String!
  }

  type Escrow {
    tokenId: Int!
    buyer: String!
    seller: String!
    amount: String!
    startTime: String!
    endTime: String!
    status: String!
    createdAt: String!
    disputeDeadline: String!
    meetingLink: String
    notes: String
  }

  type Booking {
    id: ID!
    slotId: Int!
    expertAddress: String!
    customerAddress: String!
    price: String!
    status: String!
    createdAt: String!
  }

  type ContractAddresses {
    timeSlotNFT: String!
    marketplace: String!
    escrow: String!
    reviewSystem: String!
    userRegistry: String!
    factory: String!
  }

  type Query {
    users: [User]
    user(address: String!): User
    experts: [User]
    expert(address: String!): User
    timeSlots: [TimeSlot]
    timeSlot(tokenId: Int!): TimeSlot
    expertSlots(expertAddress: String!): [TimeSlot]
    userBookings(userAddress: String!): [TimeSlot]
    reviews(expertAddress: String!): [Review]
    review(tokenId: Int!): Review
    bookings: [Booking]
    listings: [Listing]
    listing(tokenId: Int!): Listing
    auctionBids(tokenId: Int!): [AuctionBid]
    escrow(tokenId: Int!): Escrow
    userEscrows(userAddress: String!): [Escrow]
    contractAddresses: ContractAddresses
    expertRatingBreakdown(expertAddress: String!): RatingBreakdown
  }

  type Mutation {
    # User Management
    registerUser(input: RegisterUserInput!): User
    registerExpert(input: RegisterExpertInput!): User
    updateUserProfile(input: UpdateUserProfileInput!): User
    requestVerification(input: VerificationRequestInput!): Boolean
    
    # Time Slot Management
    createTimeSlot(input: CreateTimeSlotInput!): TimeSlot
    batchCreateTimeSlots(input: BatchCreateTimeSlotsInput!): [TimeSlot]
    bookSlot(input: BookSlotInput!): Booking
    bookSlotWithEscrow(input: BookSlotWithEscrowInput!): Booking
    revokeSlot(tokenId: Int!): TimeSlot
    resellSlot(tokenId: Int!, newPrice: String!): TimeSlot
    
    # Marketplace
    listItem(input: ListItemInput!): Listing
    listItemForAuction(input: ListItemForAuctionInput!): Listing
    buyItem(input: BuyItemInput!): Boolean
    placeBid(input: PlaceBidInput!): Boolean
    endAuction(tokenId: Int!): Boolean
    delistItem(tokenId: Int!): Boolean
    
    # Escrow
    confirmAppointment(tokenId: Int!): Boolean
    completeEscrow(tokenId: Int!): Boolean
    disputeEscrow(input: DisputeEscrowInput!): Boolean
    updateMeetingLink(tokenId: Int!, meetingLink: String!): Boolean
    updateNotes(tokenId: Int!, notes: String!): Boolean
    
    # Reviews
    submitReview(input: SubmitReviewInput!): Review
    updateReview(input: UpdateReviewInput!): Review
    
    # Legacy mutations (for backward compatibility)
    createUser(input: CreateUserInput!): User
    updateUser(address: String!, input: UpdateUserInput!): User
    createExpertProfile(input: CreateExpertProfileInput!): ExpertProfile
    updateExpertProfile(address: String!, input: UpdateExpertProfileInput!): ExpertProfile
    createReview(input: CreateReviewInput!): Review
  }

  # New Input Types
  input RegisterUserInput {
    name: String!
    email: String!
    ens: String
    profileImage: String
    bio: String
    userAddress: String!
  }

  input RegisterExpertInput {
    name: String!
    email: String!
    ens: String
    profession: String!
    description: String!
    profileImage: String
    bio: String
    userAddress: String!
  }

  input UpdateUserProfileInput {
    name: String!
    email: String!
    ens: String
    profileImage: String
    bio: String
    userAddress: String!
  }

  input VerificationRequestInput {
    documentHash: String!
    documentType: String!
    userAddress: String!
  }

  input CreateTimeSlotInput {
    startTime: String!
    endTime: String!
    price: String!
    profession: String!
    description: String!
    userAddress: String!
  }

  input BatchCreateTimeSlotsInput {
    slots: [CreateTimeSlotInput!]!
    userAddress: String!
  }

  input BookSlotInput {
    tokenId: Int!
    userAddress: String!
    value: String!
  }

  input BookSlotWithEscrowInput {
    tokenId: Int!
    userAddress: String!
    value: String!
    meetingLink: String
    notes: String
  }

  input ListItemInput {
    tokenId: Int!
    price: String!
    userAddress: String!
  }

  input ListItemForAuctionInput {
    tokenId: Int!
    startingPrice: String!
    auctionDuration: String!
    userAddress: String!
  }

  input BuyItemInput {
    tokenId: Int!
    userAddress: String!
    value: String!
  }

  input PlaceBidInput {
    tokenId: Int!
    userAddress: String!
    value: String!
  }

  input DisputeEscrowInput {
    tokenId: Int!
    reason: String!
    userAddress: String!
  }

  input SubmitReviewInput {
    tokenId: Int!
    rating: Int!
    comment: String!
    userAddress: String!
  }

  input UpdateReviewInput {
    tokenId: Int!
    rating: Int!
    comment: String!
    userAddress: String!
  }

  # Legacy Input Types (for backward compatibility)
  input CreateUserInput {
    address: String!
    name: String!
    email: String!
    userType: String!
  }

  input UpdateUserInput {
    name: String
    email: String
  }

  input CreateExpertProfileInput {
    address: String!
    name: String!
    profession: String!
    description: String!
    ens: String
  }

  input UpdateExpertProfileInput {
    name: String
    profession: String
    description: String
    ens: String
  }

  input CreateReviewInput {
    expertAddress: String!
    reviewerAddress: String!
    rating: Int!
    comment: String!
  }
`;

module.exports = typeDefs;
