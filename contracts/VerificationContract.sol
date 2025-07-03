// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/AccessControl.sol";

// Manages verification of user activities for GreenMint App
contract VerificationContract is AccessControl {
    bytes32 public constant VERIFIER_ROLE = keccak256("VERIFIER_ROLE");

    // Struct to store verification details
    struct Verification {
        address user; // User submitting the activity
        uint256 activityId; // Unique activity ID
        string ipfsHash; // IPFS hash of verification media
        bool isVerified; // Verification status
        address verifier; // Address of the verifier
    }

    // Mapping to store verifications
    mapping(uint256 => Verification) public verifications;
    uint256 public verificationCount;

    // Events for verification lifecycle
    event VerificationSubmitted(uint256 indexed verificationId, address user, string ipfsHash);
    event VerificationApproved(uint256 indexed verificationId, address verifier);

    constructor() {
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _setupRole(VERIFIER_ROLE, msg.sender);
    }

    // Submits a verification request
    function submitVerification(address _user, uint256 _activityId, string memory _ipfsHash) external {
        verificationCount++;
        verifications[verificationCount] = Verification(_user, _activityId, _ipfsHash, false, address(0));
        emit VerificationSubmitted(verificationCount, _user, _ipfsHash);
    }

    // Approves a verification (restricted to verifiers)
    function approveVerification(uint256 _verificationId) external onlyRole(VERIFIER_ROLE) {
        require(verifications[_verificationId].isVerified == false, "Already verified");
        verifications[_verificationId].isVerified = true;
        verifications[_verificationId].verifier = msg.sender;
        emit VerificationApproved(_verificationId, msg.sender);
    }
}