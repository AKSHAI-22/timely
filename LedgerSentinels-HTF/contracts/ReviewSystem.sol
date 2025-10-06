// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./TimeSlotNFT.sol";
import "./TimeSlotEscrow.sol";

contract ReviewSystem is ReentrancyGuard, Ownable {
    
    struct Review {
        uint256 tokenId;
        address reviewer;
        address expert;
        uint256 rating; // 1-5 stars
        string comment;
        uint256 timestamp;
        bool isVerified;
    }
    
    struct ExpertStats {
        uint256 totalReviews;
        uint256 averageRating;
        uint256 totalRating;
        mapping(uint256 => uint256) ratingCounts; // rating => count
    }
    
    TimeSlotNFT public timeSlotNFT;
    TimeSlotEscrow public timeSlotEscrow;
    
    mapping(uint256 => Review) public reviews;
    mapping(address => ExpertStats) public expertStats;
    mapping(address => uint256[]) public expertReviews;
    mapping(address => uint256[]) public userReviews;
    mapping(uint256 => bool) public reviewExists;
    mapping(uint256 => bool) public canReview; // tokenId => can review
    
    uint256 public reviewCount;
    
    event ReviewSubmitted(
        uint256 indexed tokenId,
        address indexed reviewer,
        address indexed expert,
        uint256 rating,
        string comment
    );
    
    event ReviewUpdated(
        uint256 indexed tokenId,
        address indexed reviewer,
        uint256 newRating,
        string newComment
    );
    
    modifier onlyAfterAppointment(uint256 _tokenId) {
        require(canReview[_tokenId], "Cannot review yet");
        _;
    }
    
    modifier onlyReviewer(uint256 _tokenId) {
        require(reviews[_tokenId].reviewer == msg.sender, "Not the reviewer");
        _;
    }
    
    constructor(address _timeSlotNFT, address _timeSlotEscrow) {
        timeSlotNFT = TimeSlotNFT(_timeSlotNFT);
        timeSlotEscrow = TimeSlotEscrow(_timeSlotEscrow);
    }
    
    // Enable review for a completed appointment
    function enableReview(uint256 _tokenId) external onlyOwner {
        require(!reviewExists[_tokenId], "Review already exists");
        
        // Check if escrow is completed
        TimeSlotEscrow.EscrowData memory escrow = timeSlotEscrow.getEscrow(_tokenId);
        require(escrow.status == TimeSlotEscrow.EscrowStatus.Completed, "Appointment not completed");
        
        canReview[_tokenId] = true;
    }
    
    // Submit a review
    function submitReview(
        uint256 _tokenId,
        uint256 _rating,
        string memory _comment
    ) external onlyAfterAppointment(_tokenId) {
        require(!reviewExists[_tokenId], "Review already exists");
        require(_rating >= 1 && _rating <= 5, "Rating must be 1-5");
        require(bytes(_comment).length <= 500, "Comment too long");
        
        // Get time slot details
        TimeSlotNFT.TimeSlot memory slot = timeSlotNFT.getTimeSlot(_tokenId);
        require(slot.bookedBy == msg.sender, "Not the buyer");
        
        reviewCount++;
        
        reviews[reviewCount] = Review({
            tokenId: _tokenId,
            reviewer: msg.sender,
            expert: slot.expert,
            rating: _rating,
            comment: _comment,
            timestamp: block.timestamp,
            isVerified: true
        });
        
        reviewExists[_tokenId] = true;
        expertReviews[slot.expert].push(reviewCount);
        userReviews[msg.sender].push(reviewCount);
        
        // Update expert stats
        _updateExpertStats(slot.expert, _rating);
        
        emit ReviewSubmitted(_tokenId, msg.sender, slot.expert, _rating, _comment);
    }
    
    // Update a review (within 24 hours)
    function updateReview(
        uint256 _tokenId,
        uint256 _newRating,
        string memory _newComment
    ) external onlyReviewer(_tokenId) {
        require(_newRating >= 1 && _newRating <= 5, "Rating must be 1-5");
        require(bytes(_newComment).length <= 500, "Comment too long");
        
        // Find the review
        uint256 reviewId = _findReviewId(_tokenId);
        require(reviewId > 0, "Review not found");
        
        Review storage review = reviews[reviewId];
        require(block.timestamp <= review.timestamp + 24 hours, "Cannot update after 24 hours");
        
        // Update expert stats
        _removeRatingFromStats(review.expert, review.rating);
        _updateExpertStats(review.expert, _newRating);
        
        // Update review
        review.rating = _newRating;
        review.comment = _newComment;
        
        emit ReviewUpdated(_tokenId, msg.sender, _newRating, _newComment);
    }
    
    // Get review by token ID
    function getReview(uint256 _tokenId) external view returns (Review memory) {
        require(reviewExists[_tokenId], "Review does not exist");
        uint256 reviewId = _findReviewId(_tokenId);
        return reviews[reviewId];
    }
    
    // Get expert reviews
    function getExpertReviews(address _expert) external view returns (uint256[] memory) {
        return expertReviews[_expert];
    }
    
    // Get user reviews
    function getUserReviews(address _user) external view returns (uint256[] memory) {
        return userReviews[_user];
    }
    
    // Get expert rating breakdown
    function getExpertRatingBreakdown(address _expert) external view returns (
        uint256 totalReviews,
        uint256 averageRating,
        uint256[6] memory ratingCounts // [0] unused, [1-5] for ratings
    ) {
        ExpertStats storage stats = expertStats[_expert];
        totalReviews = stats.totalReviews;
        averageRating = stats.averageRating;
        
        for (uint256 i = 1; i <= 5; i++) {
            ratingCounts[i] = stats.ratingCounts[i];
        }
    }
    
    // Get review details by ID
    function getReviewById(uint256 _reviewId) external view returns (Review memory) {
        require(_reviewId > 0 && _reviewId <= reviewCount, "Review does not exist");
        return reviews[_reviewId];
    }
    
    // Update expert stats when review is added
    function _updateExpertStats(address _expert, uint256 _rating) internal {
        ExpertStats storage stats = expertStats[_expert];
        
        stats.totalReviews++;
        stats.totalRating += _rating;
        stats.averageRating = stats.totalRating / stats.totalReviews;
        stats.ratingCounts[_rating]++;
    }
    
    // Remove rating from stats (for updates)
    function _removeRatingFromStats(address _expert, uint256 _rating) internal {
        ExpertStats storage stats = expertStats[_expert];
        
        stats.totalReviews--;
        stats.totalRating -= _rating;
        if (stats.totalReviews > 0) {
            stats.averageRating = stats.totalRating / stats.totalReviews;
        } else {
            stats.averageRating = 0;
        }
        stats.ratingCounts[_rating]--;
    }
    
    // Find review ID by token ID
    function _findReviewId(uint256 _tokenId) internal view returns (uint256) {
        for (uint256 i = 1; i <= reviewCount; i++) {
            if (reviews[i].tokenId == _tokenId) {
                return i;
            }
        }
        return 0;
    }
    
    // Get top rated experts
    function getTopRatedExperts(uint256 _limit) external view returns (
        address[] memory experts,
        uint256[] memory ratings,
        uint256[] memory reviewCounts
    ) {
        // This is a simplified version. In production, you might want to use
        // an off-chain service to maintain a sorted list of experts
        experts = new address[](_limit);
        ratings = new uint256[](_limit);
        reviewCounts = new uint256[](_limit);
        
        // For now, return empty arrays. This would need to be implemented
        // with proper sorting logic or maintained off-chain
    }
    
    // Emergency functions
    function emergencyDisableReview(uint256 _tokenId) external onlyOwner {
        canReview[_tokenId] = false;
    }
    
    function emergencyEnableReview(uint256 _tokenId) external onlyOwner {
        canReview[_tokenId] = true;
    }
}
