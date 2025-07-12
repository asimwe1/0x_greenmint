// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "./CarbonTrackingContract.sol";

contract ChallengeManagementContract is AccessControl {
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    address public backendAddress;
    CarbonTrackingContract public carbonTrackingContract;

    struct Challenge {
        uint256 challengeId;
        string description;
        uint256 startTime;
        uint256 endTime;
        bool isActive;
        bool isMarketplaceChallenge;
    }

    mapping(uint256 => Challenge) public challenges;
    uint256 public challengeCount;

    constructor(address _backendAddress, address _carbonTrackingContract) {
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _setupRole(ADMIN_ROLE, msg.sender);
        backendAddress = _backendAddress;
        carbonTrackingContract = CarbonTrackingContract(_carbonTrackingContract);
    }

    function createChallenges(Challenge[] memory _challenges) external onlyRole(ADMIN_ROLE) {
        require(msg.sender == backendAddress, "Only backend can create");
        for (uint256 i = 0; i < _challenges.length; i++) {
            challengeCount++;
            challenges[challengeCount] = _challenges[i];
            challenges[challengeCount].challengeId = challengeCount;
            challenges[challengeCount].startTime = block.timestamp;
            challenges[challengeCount].endTime = block.timestamp + _challenges[i].endTime;
            challenges[challengeCount].isActive = true;
        }
    }

    function endChallenge(uint256 _challengeId) external onlyRole(ADMIN_ROLE) {
        require(msg.sender == backendAddress, "Only backend can end");
        require(challenges[_challengeId].isActive, "Challenge already ended");
        challenges[_challengeId].isActive = false;
    }
}