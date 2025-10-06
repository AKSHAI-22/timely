// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract UserRegistry is Ownable, ReentrancyGuard {
    
    enum UserType {
        Customer,
        Expert,
        Admin
    }
    
    struct UserProfile {
        address userAddress;
        string name;
        string email;
        string ens;
        UserType userType;
        bool isVerified;
        bool isActive;
        uint256 createdAt;
        uint256 lastActive;
        string profileImage;
        string bio;
        string[] socialLinks;
        mapping(string => string) customFields;
    }
    
    struct VerificationRequest {
        address user;
        string documentHash;
        string documentType;
        uint256 timestamp;
        bool isProcessed;
        bool isApproved;
    }
    
    mapping(address => UserProfile) public userProfiles;
    mapping(address => bool) public isRegistered;
    mapping(string => address) public emailToAddress;
    mapping(string => address) public ensToAddress;
    mapping(uint256 => VerificationRequest) public verificationRequests;
    
    address[] public registeredUsers;
    uint256 public verificationRequestCount;
    
    uint256 public registrationFee = 0.01 ether;
    bool public registrationFeeEnabled = false;
    
    event UserRegistered(
        address indexed user,
        string name,
        string email,
        UserType userType
    );
    
    event UserUpdated(
        address indexed user,
        string name,
        string email
    );
    
    event UserVerified(
        address indexed user,
        bool isVerified
    );
    
    event UserDeactivated(
        address indexed user
    );
    
    event VerificationRequested(
        uint256 indexed requestId,
        address indexed user,
        string documentType
    );
    
    event VerificationProcessed(
        uint256 indexed requestId,
        address indexed user,
        bool approved
    );
    
    modifier onlyRegistered() {
        require(isRegistered[msg.sender], "User not registered");
        _;
    }
    
    modifier onlyVerified() {
        require(userProfiles[msg.sender].isVerified, "User not verified");
        _;
    }
    
    modifier onlyActive() {
        require(userProfiles[msg.sender].isActive, "User not active");
        _;
    }
    
    constructor() {}
    
    // Register a new user
    function registerUser(
        string memory _name,
        string memory _email,
        string memory _ens,
        UserType _userType,
        string memory _profileImage,
        string memory _bio
    ) external payable {
        require(!isRegistered[msg.sender], "User already registered");
        require(emailToAddress[_email] == address(0), "Email already registered");
        require(bytes(_name).length > 0, "Name cannot be empty");
        require(bytes(_email).length > 0, "Email cannot be empty");
        
        if (registrationFeeEnabled) {
            require(msg.value >= registrationFee, "Insufficient registration fee");
        }
        
        // Create user profile
        UserProfile storage profile = userProfiles[msg.sender];
        profile.userAddress = msg.sender;
        profile.name = _name;
        profile.email = _email;
        profile.ens = _ens;
        profile.userType = _userType;
        profile.isVerified = false;
        profile.isActive = true;
        profile.createdAt = block.timestamp;
        profile.lastActive = block.timestamp;
        profile.profileImage = _profileImage;
        profile.bio = _bio;
        
        isRegistered[msg.sender] = true;
        emailToAddress[_email] = msg.sender;
        
        if (bytes(_ens).length > 0) {
            ensToAddress[_ens] = msg.sender;
        }
        
        registeredUsers.push(msg.sender);
        
        emit UserRegistered(msg.sender, _name, _email, _userType);
    }
    
    // Update user profile
    function updateProfile(
        string memory _name,
        string memory _email,
        string memory _ens,
        string memory _profileImage,
        string memory _bio
    ) external onlyRegistered onlyActive {
        require(bytes(_name).length > 0, "Name cannot be empty");
        require(bytes(_email).length > 0, "Email cannot be empty");
        
        UserProfile storage profile = userProfiles[msg.sender];
        
        // Check if email is available
        if (keccak256(bytes(profile.email)) != keccak256(bytes(_email))) {
            require(emailToAddress[_email] == address(0), "Email already registered");
            emailToAddress[profile.email] = address(0);
            emailToAddress[_email] = msg.sender;
        }
        
        // Check if ENS is available
        if (keccak256(bytes(profile.ens)) != keccak256(bytes(_ens))) {
            if (bytes(_ens).length > 0) {
                require(ensToAddress[_ens] == address(0), "ENS already registered");
            }
            if (bytes(profile.ens).length > 0) {
                ensToAddress[profile.ens] = address(0);
            }
            if (bytes(_ens).length > 0) {
                ensToAddress[_ens] = msg.sender;
            }
        }
        
        profile.name = _name;
        profile.email = _email;
        profile.ens = _ens;
        profile.profileImage = _profileImage;
        profile.bio = _bio;
        profile.lastActive = block.timestamp;
        
        emit UserUpdated(msg.sender, _name, _email);
    }
    
    // Add social link
    function addSocialLink(string memory _platform, string memory _url) external onlyRegistered onlyActive {
        UserProfile storage profile = userProfiles[msg.sender];
        profile.socialLinks.push(_url);
        profile.customFields[_platform] = _url;
        profile.lastActive = block.timestamp;
    }
    
    // Remove social link
    function removeSocialLink(string memory _platform) external onlyRegistered onlyActive {
        UserProfile storage profile = userProfiles[msg.sender];
        delete profile.customFields[_platform];
        profile.lastActive = block.timestamp;
    }
    
    // Set custom field
    function setCustomField(string memory _key, string memory _value) external onlyRegistered onlyActive {
        UserProfile storage profile = userProfiles[msg.sender];
        profile.customFields[_key] = _value;
        profile.lastActive = block.timestamp;
    }
    
    // Request verification
    function requestVerification(
        string memory _documentHash,
        string memory _documentType
    ) external onlyRegistered onlyActive {
        verificationRequestCount++;
        
        verificationRequests[verificationRequestCount] = VerificationRequest({
            user: msg.sender,
            documentHash: _documentHash,
            documentType: _documentType,
            timestamp: block.timestamp,
            isProcessed: false,
            isApproved: false
        });
        
        emit VerificationRequested(verificationRequestCount, msg.sender, _documentType);
    }
    
    // Process verification request (admin only)
    function processVerification(
        uint256 _requestId,
        bool _approved
    ) external onlyOwner {
        require(_requestId > 0 && _requestId <= verificationRequestCount, "Invalid request ID");
        
        VerificationRequest storage request = verificationRequests[_requestId];
        require(!request.isProcessed, "Request already processed");
        
        request.isProcessed = true;
        request.isApproved = _approved;
        
        if (_approved) {
            userProfiles[request.user].isVerified = true;
        }
        
        emit VerificationProcessed(_requestId, request.user, _approved);
        emit UserVerified(request.user, _approved);
    }
    
    // Deactivate user
    function deactivateUser(address _user) external onlyOwner {
        require(isRegistered[_user], "User not registered");
        
        userProfiles[_user].isActive = false;
        
        emit UserDeactivated(_user);
    }
    
    // Reactivate user
    function reactivateUser(address _user) external onlyOwner {
        require(isRegistered[_user], "User not registered");
        
        userProfiles[_user].isActive = true;
        userProfiles[_user].lastActive = block.timestamp;
    }
    
    // Get user profile
    function getUserProfile(address _user) external view returns (
        address userAddress,
        string memory name,
        string memory email,
        string memory ens,
        UserType userType,
        bool isVerified,
        bool isActive,
        uint256 createdAt,
        uint256 lastActive,
        string memory profileImage,
        string memory bio
    ) {
        require(isRegistered[_user], "User not registered");
        
        UserProfile storage profile = userProfiles[_user];
        return (
            profile.userAddress,
            profile.name,
            profile.email,
            profile.ens,
            profile.userType,
            profile.isVerified,
            profile.isActive,
            profile.createdAt,
            profile.lastActive,
            profile.profileImage,
            profile.bio
        );
    }
    
    // Get custom field
    function getCustomField(address _user, string memory _key) external view returns (string memory) {
        require(isRegistered[_user], "User not registered");
        return userProfiles[_user].customFields[_key];
    }
    
    // Get all registered users
    function getAllUsers() external view returns (address[] memory) {
        return registeredUsers;
    }
    
    // Get user count
    function getUserCount() external view returns (uint256) {
        return registeredUsers.length;
    }
    
    // Check if user is expert
    function isExpert(address _user) external view returns (bool) {
        return isRegistered[_user] && 
               userProfiles[_user].userType == UserType.Expert && 
               userProfiles[_user].isActive;
    }
    
    // Check if user is verified expert
    function isVerifiedExpert(address _user) external view returns (bool) {
        return isRegistered[_user] && 
               userProfiles[_user].userType == UserType.Expert && 
               userProfiles[_user].isVerified && 
               userProfiles[_user].isActive;
    }
    
    // Update registration fee
    function updateRegistrationFee(uint256 _newFee) external onlyOwner {
        registrationFee = _newFee;
    }
    
    // Toggle registration fee
    function toggleRegistrationFee() external onlyOwner {
        registrationFeeEnabled = !registrationFeeEnabled;
    }
    
    // Withdraw fees
    function withdrawFees() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }
}
