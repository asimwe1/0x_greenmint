// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./CarbonTrackingContract.sol";

// Manages challenge leaderboards for GreenMint App
contract LeaderboardContract {
    // Reference to CarbonTrackingContract for activity data
    CarbonTrackingContract public carbonTrackingContract;

    // Struct to store challenge details
    struct Challenge {
        uint256 challengeId;
        mapping(address => uint256) userScores; // Carbon saved per user
        address[] topUsers; // Top-ranked users
    }

    // Mapping to store challenges
    mapping(uint256 => Challenge) public challenges;

    constructor(address _carbonTrackingContract) {
        carbonTrackingContract = CarbonTrackingContract(_carbonTrackingContract);
    }

    // Updates user score for a challenge
    function updateScore(uint256 _challengeId, address _user, uint256 _carbonSaved) external {
        challenges[_challengeId].userScores[_user] += _carbonSaved;
        // Simplified ranking logic (update topUsers off-chain for gas efficiency)
    }

    // Retrieves user score for a challenge
    function getUserScore(uint256 _challengeId, address _user) external view returns (uint256) {
        return challenges[_challengeId].userScores[_user];
    }

    // Retrieves top users for a challenge
    function getTopUsers(uint256 _challengeId) external view returns (address[] memory) {
        return challenges[_challengeId].topUsers;
    }
}