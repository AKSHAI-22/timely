// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "./TimeSlotNFT.sol";

contract TimeSlotEscrow is ReentrancyGuard, Ownable {
    
    enum EscrowStatus {
        Pending,
        Confirmed,
        Disputed,
        Completed,
        Cancelled
    }
    
    struct EscrowData {
        uint256 tokenId;
        address buyer;
        address seller;
        uint256 amount;
        uint256 startTime;
        uint256 endTime;
        EscrowStatus status;
        uint256 createdAt;
        uint256 disputeDeadline;
        string meetingLink;
        string notes;
        bool buyerConfirmed;
        bool sellerConfirmed;
    }
    
    TimeSlotNFT public timeSlotNFT;
    
    mapping(uint256 => EscrowData) public escrows;
    mapping(address => uint256[]) public userEscrows;
    mapping(uint256 => bool) public escrowExists;
    
    uint256 public disputePeriod = 24 hours; // 24 hours to dispute after appointment
    uint256 public platformFeePercent = 1; // 1% escrow fee
    address public platformWallet;
    
    event EscrowCreated(
        uint256 indexed tokenId,
        address indexed buyer,
        address indexed seller,
        uint256 amount
    );
    
    event EscrowConfirmed(
        uint256 indexed tokenId,
        address indexed buyer,
        address indexed seller
    );
    
    event EscrowDisputed(
        uint256 indexed tokenId,
        address indexed disputer,
        string reason
    );
    
    event EscrowCompleted(
        uint256 indexed tokenId,
        address indexed buyer,
        address indexed seller,
        uint256 amount
    );
    
    event EscrowCancelled(
        uint256 indexed tokenId,
        address indexed buyer,
        address indexed seller
    );
    
    modifier onlyEscrowParticipant(uint256 _tokenId) {
        require(
            msg.sender == escrows[_tokenId].buyer || 
            msg.sender == escrows[_tokenId].seller,
            "Not escrow participant"
        );
        _;
    }
    
    modifier ensureEscrowExists(uint256 _tokenId) {
        require(escrowExists[_tokenId], "Escrow does not exist");
        _;
    }
    
    constructor(address _timeSlotNFT, address _platformWallet) {
        timeSlotNFT = TimeSlotNFT(_timeSlotNFT);
        platformWallet = _platformWallet;
    }
    
    // Create escrow when time slot is purchased
    function createEscrow(
        uint256 _tokenId,
        address _buyer,
        address _seller,
        uint256 _amount,
        string memory _meetingLink,
        string memory _notes
    ) external payable onlyOwner {
        require(!escrowExists[_tokenId], "Escrow already exists");
        require(_buyer != address(0) && _seller != address(0), "Invalid addresses");
        require(_amount > 0, "Amount must be greater than 0");
        require(msg.value >= _amount, "Escrow not funded");
        
        // Get time slot details
        TimeSlotNFT.TimeSlot memory slot = timeSlotNFT.getTimeSlot(_tokenId);
        require(slot.isBooked && slot.bookedBy == _buyer, "Invalid booking");
        
        escrows[_tokenId] = EscrowData({
            tokenId: _tokenId,
            buyer: _buyer,
            seller: _seller,
            amount: _amount,
            startTime: slot.startTime,
            endTime: slot.endTime,
            status: EscrowStatus.Pending,
            createdAt: block.timestamp,
            disputeDeadline: slot.endTime + disputePeriod,
            meetingLink: _meetingLink,
            notes: _notes,
            buyerConfirmed: false,
            sellerConfirmed: false
        });
        
        escrowExists[_tokenId] = true;
        userEscrows[_buyer].push(_tokenId);
        userEscrows[_seller].push(_tokenId);
        
        emit EscrowCreated(_tokenId, _buyer, _seller, _amount);
    }
    
    // Confirm appointment completion (can be called by either party)
    function confirmAppointment(uint256 _tokenId) external onlyEscrowParticipant(_tokenId) ensureEscrowExists(_tokenId) {
        EscrowData storage escrow = escrows[_tokenId];
        require(escrow.status == EscrowStatus.Pending, "Invalid status");
        require(block.timestamp >= escrow.startTime, "Appointment not started");
        if (msg.sender == escrow.buyer) {
            escrow.buyerConfirmed = true;
        } else {
            escrow.sellerConfirmed = true;
        }
        if (escrow.buyerConfirmed && escrow.sellerConfirmed) {
            escrow.status = EscrowStatus.Confirmed;
            emit EscrowConfirmed(_tokenId, escrow.buyer, escrow.seller);
        }
    }
    
    // Complete escrow and release funds
    function completeEscrow(uint256 _tokenId) external onlyEscrowParticipant(_tokenId) ensureEscrowExists(_tokenId) {
        EscrowData storage escrow = escrows[_tokenId];
        require(escrow.status == EscrowStatus.Confirmed, "Must be confirmed first");
        require(block.timestamp >= escrow.endTime, "Appointment not finished");
        
        escrow.status = EscrowStatus.Completed;
        
        // Calculate fees and distribute funds
        uint256 platformFee = (escrow.amount * platformFeePercent) / 100;
        uint256 sellerAmount = escrow.amount - platformFee;
        
        // Transfer funds
        payable(platformWallet).transfer(platformFee);
        payable(escrow.seller).transfer(sellerAmount);
        
        emit EscrowCompleted(_tokenId, escrow.buyer, escrow.seller, escrow.amount);
    }
    
    // Dispute escrow
    function disputeEscrow(uint256 _tokenId, string memory _reason) external onlyEscrowParticipant(_tokenId) ensureEscrowExists(_tokenId) {
        EscrowData storage escrow = escrows[_tokenId];
        require(escrow.status == EscrowStatus.Pending || escrow.status == EscrowStatus.Confirmed, "Invalid status");
        require(block.timestamp <= escrow.disputeDeadline, "Dispute period expired");
        
        escrow.status = EscrowStatus.Disputed;
        
        emit EscrowDisputed(_tokenId, msg.sender, _reason);
    }
    
    // Cancel escrow (refund buyer)
    function cancelEscrow(uint256 _tokenId) external onlyEscrowParticipant(_tokenId) ensureEscrowExists(_tokenId) {
        EscrowData storage escrow = escrows[_tokenId];
        require(escrow.status == EscrowStatus.Pending, "Cannot cancel");
        require(block.timestamp < escrow.startTime - 1 hours, "Cannot cancel within 1 hour of appointment");
        
        escrow.status = EscrowStatus.Cancelled;
        
        // Refund buyer
        payable(escrow.buyer).transfer(escrow.amount);
        
        emit EscrowCancelled(_tokenId, escrow.buyer, escrow.seller);
    }

    // Admin cancel (used by factory when expert revokes)
    function adminCancelAndRefund(uint256 _tokenId) external onlyOwner ensureEscrowExists(_tokenId) {
        EscrowData storage escrow = escrows[_tokenId];
        require(escrow.status == EscrowStatus.Pending, "Cannot cancel");
        escrow.status = EscrowStatus.Cancelled;
        payable(escrow.buyer).transfer(escrow.amount);
        emit EscrowCancelled(_tokenId, escrow.buyer, escrow.seller);
    }
    
    // Admin resolve dispute
    function resolveDispute(
        uint256 _tokenId, 
        bool _favorBuyer, 
        uint256 _sellerAmount,
        uint256 _buyerAmount
    ) external onlyOwner ensureEscrowExists(_tokenId) {
        EscrowData storage escrow = escrows[_tokenId];
        require(escrow.status == EscrowStatus.Disputed, "Not disputed");
        require(_sellerAmount + _buyerAmount <= escrow.amount, "Invalid amounts");
        
        escrow.status = EscrowStatus.Completed;
        
        // Distribute funds based on resolution
        if (_sellerAmount > 0) {
            payable(escrow.seller).transfer(_sellerAmount);
        }
        if (_buyerAmount > 0) {
            payable(escrow.buyer).transfer(_buyerAmount);
        }
        
        // Platform keeps the rest as fee
        uint256 remaining = escrow.amount - _sellerAmount - _buyerAmount;
        if (remaining > 0) {
            payable(platformWallet).transfer(remaining);
        }
        
        emit EscrowCompleted(_tokenId, escrow.buyer, escrow.seller, escrow.amount);
    }
    
    // Update meeting link
    function updateMeetingLink(uint256 _tokenId, string memory _newLink) external onlyEscrowParticipant(_tokenId) ensureEscrowExists(_tokenId) {
        EscrowData storage escrow = escrows[_tokenId];
        require(escrow.status == EscrowStatus.Pending, "Cannot update");
        
        escrow.meetingLink = _newLink;
    }
    
    // Update notes
    function updateNotes(uint256 _tokenId, string memory _newNotes) external onlyEscrowParticipant(_tokenId) ensureEscrowExists(_tokenId) {
        EscrowData storage escrow = escrows[_tokenId];
        require(escrow.status == EscrowStatus.Pending, "Cannot update");
        
        escrow.notes = _newNotes;
    }
    
    // Get escrow details
    function getEscrow(uint256 _tokenId) external view returns (EscrowData memory) {
        require(escrowExists[_tokenId], "Escrow does not exist");
        return escrows[_tokenId];
    }
    
    // Get user escrows
    function getUserEscrows(address _user) external view returns (uint256[] memory) {
        return userEscrows[_user];
    }
    
    // Check if escrow can be disputed
    function canDispute(uint256 _tokenId) external view returns (bool) {
        if (!escrowExists[_tokenId]) return false;
        EscrowData memory escrow = escrows[_tokenId];
        return (escrow.status == EscrowStatus.Pending || escrow.status == EscrowStatus.Confirmed) &&
               block.timestamp <= escrow.disputeDeadline;
    }
    
    // Update dispute period
    function updateDisputePeriod(uint256 _newPeriod) external onlyOwner {
        require(_newPeriod >= 1 hours && _newPeriod <= 7 days, "Invalid period");
        disputePeriod = _newPeriod;
    }
    
    // Update platform fee
    function updatePlatformFee(uint256 _newFeePercent) external onlyOwner {
        require(_newFeePercent <= 5, "Fee cannot exceed 5%");
        platformFeePercent = _newFeePercent;
    }
    
    // Emergency withdraw
    function emergencyWithdraw() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }
}
