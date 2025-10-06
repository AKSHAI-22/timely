// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import "./TimeSlotNFT.sol";

contract TimeSlotMarketplace is ReentrancyGuard, Ownable, IERC721Receiver {
    
    struct Listing {
        uint256 tokenId;
        address seller;
        uint256 price;
        bool isActive;
        uint256 listingTime;
        bool isAuction;
        uint256 auctionEndTime;
        uint256 highestBid;
        address highestBidder;
    }
    
    struct Bid {
        address bidder;
        uint256 amount;
        uint256 timestamp;
    }
    
    TimeSlotNFT public timeSlotNFT;
    
    mapping(uint256 => Listing) public listings;
    mapping(uint256 => Bid[]) public auctionBids;
    mapping(address => uint256[]) public userListings;
    mapping(address => uint256[]) public userBids;
    
    uint256 public marketplaceFeePercent = 2; // 2% marketplace fee
    address public feeRecipient;
    
    event ItemListed(
        uint256 indexed tokenId,
        address indexed seller,
        uint256 price,
        bool isAuction,
        uint256 auctionEndTime
    );
    
    event ItemSold(
        uint256 indexed tokenId,
        address indexed seller,
        address indexed buyer,
        uint256 price
    );
    
    event ItemDelisted(
        uint256 indexed tokenId,
        address indexed seller
    );
    
    event BidPlaced(
        uint256 indexed tokenId,
        address indexed bidder,
        uint256 amount
    );
    
    event AuctionEnded(
        uint256 indexed tokenId,
        address indexed winner,
        uint256 winningBid
    );
    
    modifier onlyTokenOwner(uint256 _tokenId) {
        require(timeSlotNFT.ownerOf(_tokenId) == msg.sender, "Not token owner");
        _;
    }
    
    modifier listingExists(uint256 _tokenId) {
        require(listings[_tokenId].isActive, "Listing does not exist");
        _;
    }
    
    constructor(address _timeSlotNFT, address _feeRecipient) {
        timeSlotNFT = TimeSlotNFT(_timeSlotNFT);
        feeRecipient = _feeRecipient;
    }
    
    // List a time slot for sale
    function listItem(uint256 _tokenId, uint256 _price) external onlyTokenOwner(_tokenId) {
        require(_price > 0, "Price must be greater than 0");
        require(!listings[_tokenId].isActive, "Already listed");
        
        // Check if slot is not booked and not revoked
        (bool isBooked, bool isRevoked) = _getSlotStatus(_tokenId);
        require(!isBooked && !isRevoked, "Cannot list booked or revoked slot");
        
        listings[_tokenId] = Listing({
            tokenId: _tokenId,
            seller: msg.sender,
            price: _price,
            isActive: true,
            listingTime: block.timestamp,
            isAuction: false,
            auctionEndTime: 0,
            highestBid: 0,
            highestBidder: address(0)
        });
        
        userListings[msg.sender].push(_tokenId);
        
        // Transfer NFT to marketplace
        timeSlotNFT.safeTransferFrom(msg.sender, address(this), _tokenId);
        
        emit ItemListed(_tokenId, msg.sender, _price, false, 0);
    }
    
    // List a time slot for auction
    function listItemForAuction(
        uint256 _tokenId, 
        uint256 _startingPrice, 
        uint256 _auctionDuration
    ) external onlyTokenOwner(_tokenId) {
        require(_startingPrice > 0, "Starting price must be greater than 0");
        require(_auctionDuration >= 1 hours && _auctionDuration <= 7 days, "Invalid auction duration");
        require(!listings[_tokenId].isActive, "Already listed");
        
        // Check if slot is not booked and not revoked
        (bool isBooked, bool isRevoked) = _getSlotStatus(_tokenId);
        require(!isBooked && !isRevoked, "Cannot list booked or revoked slot");
        
        uint256 auctionEndTime = block.timestamp + _auctionDuration;
        
        listings[_tokenId] = Listing({
            tokenId: _tokenId,
            seller: msg.sender,
            price: _startingPrice,
            isActive: true,
            listingTime: block.timestamp,
            isAuction: true,
            auctionEndTime: auctionEndTime,
            highestBid: 0,
            highestBidder: address(0)
        });
        
        userListings[msg.sender].push(_tokenId);
        
        // Transfer NFT to marketplace
        timeSlotNFT.safeTransferFrom(msg.sender, address(this), _tokenId);
        
        emit ItemListed(_tokenId, msg.sender, _startingPrice, true, auctionEndTime);
    }
    
    // Buy a listed item
    function buyItem(uint256 _tokenId) external payable nonReentrant listingExists(_tokenId) {
        Listing storage listing = listings[_tokenId];
        require(!listing.isAuction, "Item is in auction");
        require(msg.value >= listing.price, "Insufficient payment");
        
        // Check if slot is still available
        (bool isBooked, bool isRevoked) = _getSlotStatus(_tokenId);
        require(!isBooked && !isRevoked, "Slot no longer available");
        
        _executeSale(_tokenId, msg.sender, listing.price);
        
        emit ItemSold(_tokenId, listing.seller, msg.sender, listing.price);
    }
    
    // Place a bid on auction
    function placeBid(uint256 _tokenId) external payable nonReentrant listingExists(_tokenId) {
        Listing storage listing = listings[_tokenId];
        require(listing.isAuction, "Item is not in auction");
        require(block.timestamp < listing.auctionEndTime, "Auction ended");
        require(msg.value > listing.highestBid, "Bid too low");
        require(msg.value >= listing.price, "Bid below starting price");
        
        // Refund previous highest bidder
        if (listing.highestBidder != address(0)) {
            payable(listing.highestBidder).transfer(listing.highestBid);
        }
        
        // Update highest bid
        listing.highestBid = msg.value;
        listing.highestBidder = msg.sender;
        
        // Record bid
        auctionBids[_tokenId].push(Bid({
            bidder: msg.sender,
            amount: msg.value,
            timestamp: block.timestamp
        }));
        
        userBids[msg.sender].push(_tokenId);
        
        emit BidPlaced(_tokenId, msg.sender, msg.value);
    }
    
    // End auction and transfer to winner
    function endAuction(uint256 _tokenId) external nonReentrant listingExists(_tokenId) {
        Listing storage listing = listings[_tokenId];
        require(listing.isAuction, "Not an auction");
        require(block.timestamp >= listing.auctionEndTime, "Auction not ended");
        
        if (listing.highestBidder != address(0)) {
            _executeSale(_tokenId, listing.highestBidder, listing.highestBid);
            emit AuctionEnded(_tokenId, listing.highestBidder, listing.highestBid);
        } else {
            // No bids, return to seller
            listing.isActive = false;
            timeSlotNFT.safeTransferFrom(address(this), listing.seller, _tokenId);
            emit ItemDelisted(_tokenId, listing.seller);
        }
    }
    
    // Delist an item
    function delistItem(uint256 _tokenId) external listingExists(_tokenId) {
        Listing storage listing = listings[_tokenId];
        require(listing.seller == msg.sender, "Not the seller");
        require(!listing.isAuction || block.timestamp < listing.auctionEndTime, "Cannot delist ended auction");
        
        // If auction with bids, refund highest bidder
        if (listing.isAuction && listing.highestBidder != address(0)) {
            payable(listing.highestBidder).transfer(listing.highestBid);
        }
        
        listing.isActive = false;
        timeSlotNFT.safeTransferFrom(address(this), listing.seller, _tokenId);
        
        emit ItemDelisted(_tokenId, listing.seller);
    }
    
    // Execute sale and distribute funds
    function _executeSale(uint256 _tokenId, address _buyer, uint256 _price) internal {
        Listing storage listing = listings[_tokenId];
        
        // Calculate fees
        uint256 marketplaceFee = (_price * marketplaceFeePercent) / 100;
        uint256 sellerAmount = _price - marketplaceFee;
        
        // Transfer funds
        payable(feeRecipient).transfer(marketplaceFee);
        payable(listing.seller).transfer(sellerAmount);
        
        // Transfer NFT
        timeSlotNFT.safeTransferFrom(address(this), _buyer, _tokenId);
        
        // Update listing
        listing.isActive = false;
    }
    
    // Get slot status from TimeSlotNFT contract
    function _getSlotStatus(uint256 _tokenId) internal view returns (bool isBooked, bool isRevoked) {
        try timeSlotNFT.getTimeSlot(_tokenId) returns (TimeSlotNFT.TimeSlot memory slot) {
            return (slot.isBooked, slot.isRevoked);
        } catch {
            return (false, false);
        }
    }
    
    // Get listing details
    function getListing(uint256 _tokenId) external view returns (Listing memory) {
        return listings[_tokenId];
    }
    
    // Get auction bids
    function getAuctionBids(uint256 _tokenId) external view returns (Bid[] memory) {
        return auctionBids[_tokenId];
    }
    
    // Get user listings
    function getUserListings(address _user) external view returns (uint256[] memory) {
        return userListings[_user];
    }
    
    // Get user bids
    function getUserBids(address _user) external view returns (uint256[] memory) {
        return userBids[_user];
    }
    
    // Update marketplace fee
    function updateMarketplaceFee(uint256 _newFeePercent) external onlyOwner {
        require(_newFeePercent <= 5, "Fee cannot exceed 5%");
        marketplaceFeePercent = _newFeePercent;
    }
    
    // Update fee recipient
    function updateFeeRecipient(address _newFeeRecipient) external onlyOwner {
        require(_newFeeRecipient != address(0), "Invalid address");
        feeRecipient = _newFeeRecipient;
    }
    
    // Emergency withdraw
    function emergencyWithdraw() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }
    
    // Required for receiving NFTs
    function onERC721Received(
        address,
        address,
        uint256,
        bytes calldata
    ) external pure override returns (bytes4) {
        return IERC721Receiver.onERC721Received.selector;
    }
}
