// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/AccessControl.sol";

// Manages challenges for GreenMint App
contract ChallengeManagementContract is AccessControl {
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

    // Struct to store challenge details
    struct Challenge {
        uint256 challengeId;
        string description; // IPFS URI for challenge details
        uint256 startTime;
        uint256 endTime;
        bool isActive;
    }

    // Mapping to store challenges
    mapping(uint256 => Challenge) public challenges;
    uint256 public challengeCount;

    constructor() {
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _setupRole(ADMIN_ROLE, msg.sender);
    }

    // Creates a new challenge
    function createChallenge(string memory _description, uint256 _duration) external onlyRole(ADMIN_ROLE) {
        challengeCount++;
        challenges[challengeCount] = Challenge(challengeCount, _description, block.timestamp, block.timestamp + _duration, true);
    }

    // Updates challenge status
    function endChallenge(uint256 _challengeId) external onlyRole(ADMIN_ROLE) {
        require(challenges[_challengeId].isActive, "Challenge already ended");
        challenges[_challengeId].isActive = false;
    }
}