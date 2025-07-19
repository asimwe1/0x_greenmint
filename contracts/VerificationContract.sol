// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@chainlink/contracts/src/v0.8/shared/interfaces/AggregatorV3Interface.sol";

contract VerificationContract is AccessControl {
    bytes32 public constant VERIFIER_ROLE = keccak256("VERIFIER_ROLE");
    address public backendAddress;
    AggregatorV3Interface public verificationOracle;

    struct Verification {
        address user;
        uint256 activityId;
        string ipfsHash;
        bool isVerified;
        address verifier;
    }

    mapping(uint256 => Verification) public verifications;
    uint256 public verificationCount;

    event VerificationSubmitted(uint256 indexed verificationId, address indexed user, uint256 indexed activityId, string ipfsHash);
    event VerificationApproved(uint256 indexed verificationId, address indexed verifier);
    event VerificationRejected(uint256 indexed verificationId, address indexed verifier, string reason);

    constructor(address _backendAddress, address _verificationOracle) {
        require(_backendAddress != address(0), "Invalid backend address");
        require(_verificationOracle != address(0), "Invalid oracle address");
        
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(VERIFIER_ROLE, msg.sender);
        _grantRole(VERIFIER_ROLE, _backendAddress);
        
        backendAddress = _backendAddress;
        verificationOracle = AggregatorV3Interface(_verificationOracle);
    }

    function submitVerification(address _user, uint256 _activityId, string memory _ipfsHash) external {
        require(msg.sender == backendAddress, "Only backend can submit");
        require(_user != address(0), "Invalid user address");
        require(bytes(_ipfsHash).length > 0, "Invalid IPFS hash");
        
        verificationCount++;
        verifications[verificationCount] = Verification(_user, _activityId, _ipfsHash, false, address(0));
        
        emit VerificationSubmitted(verificationCount, _user, _activityId, _ipfsHash);
    }

    function approveVerifications(uint256[] memory _verificationIds) external onlyRole(VERIFIER_ROLE) {
        require(msg.sender == backendAddress, "Only backend can approve");
        require(_verificationIds.length > 0, "No verification IDs provided");
        
        for (uint256 i = 0; i < _verificationIds.length; i++) {
            uint256 id = _verificationIds[i];
            require(id > 0 && id <= verificationCount, "Invalid verification ID");
            require(!verifications[id].isVerified, "Already verified");
            
            verifications[id].isVerified = true;
            verifications[id].verifier = msg.sender;
            
            emit VerificationApproved(id, msg.sender);
        }
    }

    function rejectVerifications(uint256[] memory _verificationIds, string memory _reason) external onlyRole(VERIFIER_ROLE) {
        require(msg.sender == backendAddress, "Only backend can reject");
        require(_verificationIds.length > 0, "No verification IDs provided");
        require(bytes(_reason).length > 0, "Reason required");
        
        for (uint256 i = 0; i < _verificationIds.length; i++) {
            uint256 id = _verificationIds[i];
            require(id > 0 && id <= verificationCount, "Invalid verification ID");
            require(!verifications[id].isVerified, "Already verified");
            
            // Mark as rejected by setting verifier but keeping isVerified as false
            verifications[id].verifier = msg.sender;
            
            emit VerificationRejected(id, msg.sender, _reason);
        }
    }

    function getVerification(uint256 _verificationId) external view returns (Verification memory) {
        require(_verificationId > 0 && _verificationId <= verificationCount, "Invalid verification ID");
        return verifications[_verificationId];
    }

    function getUserVerifications(address _user) external view returns (uint256[] memory) {
        uint256[] memory userVerifications = new uint256[](verificationCount);
        uint256 count = 0;
        
        for (uint256 i = 1; i <= verificationCount; i++) {
            if (verifications[i].user == _user) {
                userVerifications[count] = i;
                count++;
            }
        }
        
        // Resize array to actual count
        uint256[] memory result = new uint256[](count);
        for (uint256 i = 0; i < count; i++) {
            result[i] = userVerifications[i];
        }
        
        return result;
    }

    function updateBackendAddress(address _newBackendAddress) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_newBackendAddress != address(0), "Invalid backend address");
        
        // Revoke role from old backend
        _revokeRole(VERIFIER_ROLE, backendAddress);
        
        // Grant role to new backend
        _grantRole(VERIFIER_ROLE, _newBackendAddress);
        
        backendAddress = _newBackendAddress;
    }

    function updateOracle(address _newOracle) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_newOracle != address(0), "Invalid oracle address");
        verificationOracle = AggregatorV3Interface(_newOracle);
    }
}