// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "./TimeSlotNFT.sol";
import "./TimeSlotMarketplace.sol";
import "./TimeSlotEscrow.sol";
import "./ReviewSystem.sol";
import "./UserRegistry.sol";

contract TimeSlotFactory is Ownable, ReentrancyGuard {
    
    TimeSlotNFT public timeSlotNFT;
    TimeSlotMarketplace public marketplace;
    TimeSlotEscrow public escrow;
    ReviewSystem public reviewSystem;
    UserRegistry public userRegistry;
    
    address public platformWallet;
    bool public systemInitialized;
    
    event SystemInitialized(
        address timeSlotNFT,
        address marketplace,
        address escrow,
        address reviewSystem,
        address userRegistry
    );
    
    event PlatformWalletUpdated(address newWallet);
    
    constructor(address _platformWallet) {
        platformWallet = _platformWallet;
    }
    
    // Initialize the entire system
    function initializeSystem() external onlyOwner {
        require(!systemInitialized, "System already initialized");
        
        // Deploy TimeSlotNFT
        timeSlotNFT = new TimeSlotNFT(platformWallet);
        
        // Deploy Marketplace
        marketplace = new TimeSlotMarketplace(address(timeSlotNFT), platformWallet);
        
        // Deploy Escrow
        escrow = new TimeSlotEscrow(address(timeSlotNFT), platformWallet);
        
        // Deploy Review System
        reviewSystem = new ReviewSystem(address(timeSlotNFT), address(escrow));
        
        // Deploy User Registry
        userRegistry = new UserRegistry();
        
        systemInitialized = true;
        
        emit SystemInitialized(
            address(timeSlotNFT),
            address(marketplace),
            address(escrow),
            address(reviewSystem),
            address(userRegistry)
        );
    }
    
    // Create expert profile and register user
    function registerExpert(
        string memory _name,
        string memory _email,
        string memory _ens,
        string memory _profession,
        string memory _description,
        string memory _profileImage,
        string memory _bio
    ) external payable {
        require(systemInitialized, "System not initialized");
        
        // Register user first
        userRegistry.registerUser{value: msg.value}(
            _name,
            _email,
            _ens,
            UserRegistry.UserType.Expert,
            _profileImage,
            _bio
        );
        
        // Create expert profile in TimeSlotNFT
        timeSlotNFT.createExpertProfile(
            _name,
            _profession,
            _description,
            _ens
        );
    }
    
    // Register customer
    function registerCustomer(
        string memory _name,
        string memory _email,
        string memory _ens,
        string memory _profileImage,
        string memory _bio
    ) external payable {
        require(systemInitialized, "System not initialized");
        
        userRegistry.registerUser{value: msg.value}(
            _name,
            _email,
            _ens,
            UserRegistry.UserType.Customer,
            _profileImage,
            _bio
        );
    }
    
    // Create time slot (expert only)
    function createTimeSlot(
        uint256 _startTime,
        uint256 _endTime,
        uint256 _price,
        string memory _profession,
        string memory _description
    ) external {
        require(systemInitialized, "System not initialized");
        require(userRegistry.isVerifiedExpert(msg.sender), "Not a verified expert");
        
        timeSlotNFT.createTimeSlot(
            _startTime,
            _endTime,
            _price,
            _profession,
            _description
        );
    }
    
    // Batch create time slots
    function batchCreateTimeSlots(
        uint256[] memory _startTimes,
        uint256[] memory _endTimes,
        uint256[] memory _prices,
        string[] memory _professions,
        string[] memory _descriptions
    ) external {
        require(systemInitialized, "System not initialized");
        require(userRegistry.isVerifiedExpert(msg.sender), "Not a verified expert");
        
        timeSlotNFT.batchCreateTimeSlots(
            _startTimes,
            _endTimes,
            _prices,
            _professions,
            _descriptions
        );
    }
    
    // Book time slot with escrow
    function bookTimeSlotWithEscrow(
        uint256 _tokenId,
        string memory _meetingLink,
        string memory _notes
    ) external payable {
        require(systemInitialized, "System not initialized");
        require(userRegistry.isRegistered(msg.sender), "User not registered");
        
        // Validate price
        TimeSlotNFT.TimeSlot memory slot = timeSlotNFT.getTimeSlot(_tokenId);
        require(msg.value >= slot.price, "Insufficient payment");
        
        // Book the slot (no funds moved in NFT)
        timeSlotNFT.bookSlot(_tokenId);
        
        // Create escrow
        escrow.createEscrow{value: msg.value}(
            _tokenId,
            msg.sender,
            slot.expert,
            slot.price,
            _meetingLink,
            _notes
        );
    }

    // Expert or buyer revoke: cancel escrow then mark slot revoked
    function revokeTimeSlot(uint256 _tokenId) external {
        require(systemInitialized, "System not initialized");
        TimeSlotNFT.TimeSlot memory slot = timeSlotNFT.getTimeSlot(_tokenId);
        require(
            msg.sender == slot.expert || msg.sender == slot.bookedBy,
            "Not authorized"
        );
        
        if (escrow.escrowExists(_tokenId)) {
            // Refund via escrow
            escrow.adminCancelAndRefund(_tokenId);
        }
        timeSlotNFT.revokeSlot(_tokenId);
    }
    
    // List item on marketplace
    function listOnMarketplace(
        uint256 _tokenId,
        uint256 _price
    ) external {
        require(systemInitialized, "System not initialized");
        require(userRegistry.isRegistered(msg.sender), "User not registered");
        
        marketplace.listItem(_tokenId, _price);
    }
    
    // List item for auction
    function listForAuction(
        uint256 _tokenId,
        uint256 _startingPrice,
        uint256 _auctionDuration
    ) external {
        require(systemInitialized, "System not initialized");
        require(userRegistry.isRegistered(msg.sender), "User not registered");
        
        marketplace.listItemForAuction(_tokenId, _startingPrice, _auctionDuration);
    }
    
    // Buy from marketplace
    function buyFromMarketplace(uint256 _tokenId) external payable {
        require(systemInitialized, "System not initialized");
        require(userRegistry.isRegistered(msg.sender), "User not registered");
        
        marketplace.buyItem{value: msg.value}(_tokenId);
    }
    
    // Place bid on auction
    function placeBidOnAuction(uint256 _tokenId) external payable {
        require(systemInitialized, "System not initialized");
        require(userRegistry.isRegistered(msg.sender), "User not registered");
        
        marketplace.placeBid{value: msg.value}(_tokenId);
    }
    
    // End auction
    function endAuction(uint256 _tokenId) external {
        require(systemInitialized, "System not initialized");
        
        marketplace.endAuction(_tokenId);
    }
    
    // Confirm appointment
    function confirmAppointment(uint256 _tokenId) external {
        require(systemInitialized, "System not initialized");
        
        escrow.confirmAppointment(_tokenId);
    }
    
    // Complete escrow
    function completeEscrow(uint256 _tokenId) external {
        require(systemInitialized, "System not initialized");
        
        escrow.completeEscrow(_tokenId);
        
        // Enable review
        reviewSystem.enableReview(_tokenId);
    }
    
    // Submit review
    function submitReview(
        uint256 _tokenId,
        uint256 _rating,
        string memory _comment
    ) external {
        require(systemInitialized, "System not initialized");
        require(userRegistry.isRegistered(msg.sender), "User not registered");
        
        reviewSystem.submitReview(_tokenId, _rating, _comment);
    }
    
    // Revoke time slot (legacy simple revoke kept above; prefer the one that refunds via escrow)
    
    // Get system addresses
    function getSystemAddresses() external view returns (
        address _timeSlotNFT,
        address _marketplace,
        address _escrow,
        address _reviewSystem,
        address _userRegistry
    ) {
        return (
            address(timeSlotNFT),
            address(marketplace),
            address(escrow),
            address(reviewSystem),
            address(userRegistry)
        );
    }
    
    // Update platform wallet
    function updatePlatformWallet(address _newWallet) external onlyOwner {
        require(_newWallet != address(0), "Invalid address");
        platformWallet = _newWallet;
        
        emit PlatformWalletUpdated(_newWallet);
    }
    
    // Emergency functions
    function emergencyPause() external onlyOwner {
        // This would pause all contracts if they had pause functionality
        // Implementation depends on the specific pause mechanisms in each contract
    }
    
    function emergencyUnpause() external onlyOwner {
        // This would unpause all contracts
    }
    
    // Withdraw platform funds
    function withdrawPlatformFunds() external onlyOwner {
        payable(platformWallet).transfer(address(this).balance);
    }
}
