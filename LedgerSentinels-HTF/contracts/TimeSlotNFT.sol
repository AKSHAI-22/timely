// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

contract TimeSlotNFT is ERC721, ERC721URIStorage, Ownable, ReentrancyGuard {
    using Counters for Counters.Counter;
    
    Counters.Counter private _tokenIds;
    
    struct TimeSlot {
        uint256 tokenId;
        address expert;
        uint256 startTime;
        uint256 endTime;
        uint256 price;
        bool isBooked;
        address bookedBy;
        bool isRevoked;
        string profession;
        string description;
        uint256 createdAt;
    }
    
    struct ExpertProfile {
        string name;
        string profession;
        string description;
        string ens;
        uint256 totalSlots;
        uint256 totalBookings;
        uint256 rating;
        uint256 reviewCount;
        bool isActive;
    }
    
    mapping(uint256 => TimeSlot) public timeSlots;
    mapping(address => ExpertProfile) public expertProfiles;
    mapping(address => uint256[]) public expertSlots;
    mapping(address => uint256[]) public userBookings;
    mapping(uint256 => bool) public slotExists;
    
    uint256 public platformFeePercent = 3; // 3% platform fee
    uint256 public royaltyPercent = 2; // 2% royalty to expert on resale
    address public platformWallet;
    
    event SlotCreated(
        uint256 indexed tokenId,
        address indexed expert,
        uint256 startTime,
        uint256 endTime,
        uint256 price,
        string profession
    );
    
    event SlotBooked(
        uint256 indexed tokenId,
        address indexed expert,
        address indexed booker,
        uint256 price
    );
    
    event SlotRevoked(
        uint256 indexed tokenId,
        address indexed expert,
        address indexed booker
    );
    
    event SlotAutoRevoked(uint256 indexed tokenId);
    
    event SlotResold(
        uint256 indexed tokenId,
        address indexed from,
        address indexed to,
        uint256 price
    );
    
    event ExpertProfileUpdated(
        address indexed expert,
        string name,
        string profession
    );
    
    constructor(address _platformWallet) ERC721("TimeSlot", "TSLOT") {
        platformWallet = _platformWallet;
    }
    
    modifier onlyExpert() {
        require(expertProfiles[msg.sender].isActive, "Not a registered expert");
        _;
    }
    
    modifier validTimeSlot(uint256 _startTime, uint256 _endTime) {
        require(_startTime > block.timestamp, "Start time must be in future");
        require(_endTime > _startTime, "End time must be after start time");
        require(_endTime - _startTime <= 4 hours, "Slot duration cannot exceed 4 hours");
        require(_startTime <= block.timestamp + 7 days, "Cannot create slots beyond 7 days");
        _;
    }
    
    function createExpertProfile(
        string memory _name,
        string memory _profession,
        string memory _description,
        string memory _ens
    ) external {
        require(!expertProfiles[msg.sender].isActive, "Profile already exists");
        
        expertProfiles[msg.sender] = ExpertProfile({
            name: _name,
            profession: _profession,
            description: _description,
            ens: _ens,
            totalSlots: 0,
            totalBookings: 0,
            rating: 0,
            reviewCount: 0,
            isActive: true
        });
        
        emit ExpertProfileUpdated(msg.sender, _name, _profession);
    }
    
    function createTimeSlot(
        uint256 _startTime,
        uint256 _endTime,
        uint256 _price,
        string memory _profession,
        string memory _description
    ) external onlyExpert validTimeSlot(_startTime, _endTime) {
        require(_price > 0, "Price must be greater than 0");
        
        _tokenIds.increment();
        uint256 newTokenId = _tokenIds.current();
        
        timeSlots[newTokenId] = TimeSlot({
            tokenId: newTokenId,
            expert: msg.sender,
            startTime: _startTime,
            endTime: _endTime,
            price: _price,
            isBooked: false,
            bookedBy: address(0),
            isRevoked: false,
            profession: _profession,
            description: _description,
            createdAt: block.timestamp
        });
        
        expertSlots[msg.sender].push(newTokenId);
        expertProfiles[msg.sender].totalSlots++;
        slotExists[newTokenId] = true;
        
        _mint(msg.sender, newTokenId);
        
        // Set token URI with metadata
        string memory metadataURI = string(abi.encodePacked(
            "https://api.ledgersentinels.com/metadata/",
            Strings.toString(newTokenId)
        ));
        _setTokenURI(newTokenId, metadataURI);
        
        emit SlotCreated(newTokenId, msg.sender, _startTime, _endTime, _price, _profession);
    }
    
    function bookSlot(uint256 _tokenId) external nonReentrant {
        require(slotExists[_tokenId], "Slot does not exist");
        require(!timeSlots[_tokenId].isBooked, "Slot already booked");
        require(!timeSlots[_tokenId].isRevoked, "Slot has been revoked");
        require(block.timestamp < timeSlots[_tokenId].startTime - 15 minutes, "Cannot book within 15 minutes of slot");
        
        timeSlots[_tokenId].isBooked = true;
        timeSlots[_tokenId].bookedBy = msg.sender;
        
        userBookings[msg.sender].push(_tokenId);
        expertProfiles[timeSlots[_tokenId].expert].totalBookings++;
        
        // Transfer NFT to booker
        _transfer(timeSlots[_tokenId].expert, msg.sender, _tokenId);
        
        emit SlotBooked(_tokenId, timeSlots[_tokenId].expert, msg.sender, timeSlots[_tokenId].price);
    }
    
    function revokeSlot(uint256 _tokenId) external {
        require(slotExists[_tokenId], "Slot does not exist");
        require(
            msg.sender == timeSlots[_tokenId].expert || 
            msg.sender == timeSlots[_tokenId].bookedBy,
            "Not authorized to revoke"
        );
        require(!timeSlots[_tokenId].isRevoked, "Slot already revoked");
        require(block.timestamp < timeSlots[_tokenId].startTime - 15 minutes, "Cannot revoke within 15 minutes of slot");
        
        timeSlots[_tokenId].isRevoked = true;
        // Reset booking flags only; fund handling via Escrow contract
        if (timeSlots[_tokenId].isBooked) {
            timeSlots[_tokenId].isBooked = false;
            timeSlots[_tokenId].bookedBy = address(0);
        }
        
        emit SlotRevoked(_tokenId, timeSlots[_tokenId].expert, timeSlots[_tokenId].bookedBy);
    }
    
    function resellSlot(uint256 _tokenId, uint256 _newPrice) external {
        require(slotExists[_tokenId], "Slot does not exist");
        require(ownerOf(_tokenId) == msg.sender, "Not the owner of this slot");
        require(timeSlots[_tokenId].isBooked, "Slot not booked");
        require(_newPrice <= timeSlots[_tokenId].price, "Cannot increase price");
        require(block.timestamp < timeSlots[_tokenId].startTime - 30 minutes, "Cannot resell within 30 minutes of slot");
        
        timeSlots[_tokenId].price = _newPrice;
        timeSlots[_tokenId].bookedBy = address(0);
        timeSlots[_tokenId].isBooked = false;
    }
    
    function buyResoldSlot(uint256 _tokenId) external payable nonReentrant {
        require(slotExists[_tokenId], "Slot does not exist");
        require(!timeSlots[_tokenId].isBooked, "Slot already booked");
        require(!timeSlots[_tokenId].isRevoked, "Slot has been revoked");
        require(msg.value >= timeSlots[_tokenId].price, "Insufficient payment");
        require(block.timestamp < timeSlots[_tokenId].startTime - 15 minutes, "Cannot book within 15 minutes of slot");
        
        address slotOwner = ownerOf(_tokenId);
        uint256 platformFee = (timeSlots[_tokenId].price * platformFeePercent) / 100;
        uint256 royaltyFee = (timeSlots[_tokenId].price * royaltyPercent) / 100;
        uint256 ownerAmount = timeSlots[_tokenId].price - platformFee - royaltyFee;
        
        timeSlots[_tokenId].isBooked = true;
        timeSlots[_tokenId].bookedBy = msg.sender;
        
        userBookings[msg.sender].push(_tokenId);
        expertProfiles[timeSlots[_tokenId].expert].totalBookings++;
        
        // Transfer payments
        payable(platformWallet).transfer(platformFee);
        payable(timeSlots[_tokenId].expert).transfer(royaltyFee);
        payable(slotOwner).transfer(ownerAmount);
        
        // Transfer NFT to new booker
        _transfer(slotOwner, msg.sender, _tokenId);
        
        emit SlotResold(_tokenId, slotOwner, msg.sender, timeSlots[_tokenId].price);
    }
    
    // Funds settlement is handled in Escrow. Kept for backward compatibility (no-op)
    function confirmAppointment(uint256 _tokenId) external view {
        require(slotExists[_tokenId], "Slot does not exist");
        require(timeSlots[_tokenId].isBooked, "Slot not booked");
        require(block.timestamp >= timeSlots[_tokenId].startTime, "Appointment not started yet");
    }
    
    function getTimeSlot(uint256 _tokenId) external view returns (TimeSlot memory) {
        require(slotExists[_tokenId], "Slot does not exist");
        return timeSlots[_tokenId];
    }
    
    function getExpertProfile(address _expert) external view returns (ExpertProfile memory) {
        require(expertProfiles[_expert].isActive, "Expert not found");
        return expertProfiles[_expert];
    }
    
    function getExpertSlots(address _expert) external view returns (uint256[] memory) {
        return expertSlots[_expert];
    }
    
    function getUserBookings(address _user) external view returns (uint256[] memory) {
        return userBookings[_user];
    }
    
    // ----------------------
    // Auto-revoke utilities
    // ----------------------
    function canAutoRevoke(uint256 _tokenId) public view returns (bool) {
        require(slotExists[_tokenId], "Slot does not exist");
        TimeSlot memory s = timeSlots[_tokenId];
        if (s.isRevoked || s.isBooked) return false;
        // Auto revoke if current time is within 15 minutes window before start or later
        return block.timestamp >= s.startTime - 15 minutes;
    }
    
    function autoRevoke(uint256 _tokenId) public {
        require(canAutoRevoke(_tokenId), "Not eligible for auto-revoke");
        TimeSlot storage s = timeSlots[_tokenId];
        s.isRevoked = true;
        emit SlotAutoRevoked(_tokenId);
    }
    
    function batchAutoRevoke(uint256[] memory _tokenIds) external {
        for (uint256 i = 0; i < _tokenIds.length; i++) {
            if (slotExists[_tokenIds[i]] && canAutoRevoke(_tokenIds[i])) {
                TimeSlot storage s = timeSlots[_tokenIds[i]];
                s.isRevoked = true;
                emit SlotAutoRevoked(_tokenIds[i]);
            }
        }
    }
    
    function updatePlatformFee(uint256 _newFeePercent) external onlyOwner {
        require(_newFeePercent <= 10, "Fee cannot exceed 10%");
        platformFeePercent = _newFeePercent;
    }
    
    function updateRoyaltyFee(uint256 _newFeePercent) external onlyOwner {
        require(_newFeePercent <= 5, "Royalty cannot exceed 5%");
        royaltyPercent = _newFeePercent;
    }
    
    function withdraw() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }
    
    // Required overrides for ERC721URIStorage
    function _burn(uint256 tokenId) internal override(ERC721, ERC721URIStorage) {
        super._burn(tokenId);
    }
    
    function tokenURI(uint256 tokenId) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId) public view virtual override(ERC721, ERC721URIStorage) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
    
    // Batch minting for experts
    function batchCreateTimeSlots(
        uint256[] memory _startTimes,
        uint256[] memory _endTimes,
        uint256[] memory _prices,
        string[] memory _professions,
        string[] memory _descriptions
    ) external onlyExpert {
        require(_startTimes.length == _endTimes.length && 
                _endTimes.length == _prices.length && 
                _prices.length == _professions.length && 
                _professions.length == _descriptions.length, 
                "Arrays length mismatch");
        require(_startTimes.length <= 10, "Cannot create more than 10 slots at once");
        
        for (uint256 i = 0; i < _startTimes.length; i++) {
            // inline validation similar to createTimeSlot
            require(_startTimes[i] > block.timestamp, "Start time must be in future");
            require(_endTimes[i] > _startTimes[i], "End time must be after start time");
            require(_endTimes[i] - _startTimes[i] <= 4 hours, "Slot duration cannot exceed 4 hours");
            require(_startTimes[i] <= block.timestamp + 7 days, "Cannot create slots beyond 7 days");
            require(_prices[i] > 0, "Price must be greater than 0");

            _tokenIds.increment();
            uint256 newTokenId = _tokenIds.current();

            timeSlots[newTokenId] = TimeSlot({
                tokenId: newTokenId,
                expert: msg.sender,
                startTime: _startTimes[i],
                endTime: _endTimes[i],
                price: _prices[i],
                isBooked: false,
                bookedBy: address(0),
                isRevoked: false,
                profession: _professions[i],
                description: _descriptions[i],
                createdAt: block.timestamp
            });

            expertSlots[msg.sender].push(newTokenId);
            expertProfiles[msg.sender].totalSlots++;
            slotExists[newTokenId] = true;

            _mint(msg.sender, newTokenId);

            string memory uri = string(abi.encodePacked(
                "https://api.ledgersentinels.com/metadata/",
                Strings.toString(newTokenId)
            ));
            _setTokenURI(newTokenId, uri);

            emit SlotCreated(newTokenId, msg.sender, _startTimes[i], _endTimes[i], _prices[i], _professions[i]);
        }
    }
}
