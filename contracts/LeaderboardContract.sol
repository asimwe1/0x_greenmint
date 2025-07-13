// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./CarbonTrackingContract.sol";

contract LeaderboardContract {
    address public backendAddress;
    CarbonTrackingContract public carbonTrackingContract;

    struct Challenge {
        uint256 challengeId;
        mapping(address => uint256) userScores;
        address[10] topUsers; // Fixed-size array for gas efficiency
    }

    mapping(uint256 => Challenge) public challenges;

    constructor(address _backendAddress, address _carbonTrackingContract) {
        backendAddress = _backendAddress;
        carbonTrackingContract = CarbonTrackingContract(_carbonTrackingContract);
    }

    function updateScore(uint256 _challengeId, address _user, uint256 _carbonSaved, bool _isMarketplace) external {
        require(msg.sender == backendAddress, "Only backend can update");
        Challenge storage challenge = challenges[_challengeId];
        challenge.userScores[_user] += _isMarketplace ? _carbonSaved * 2 : _carbonSaved;
        updateTopUsers(challenge, _user);
    }

    function updateTopUsers(Challenge storage _challenge, address _user) private {
        uint256 score = _challenge.userScores[_user];
        address[10] storage users = _challenge.topUsers;
        for (uint256 i = 0; i < 10; i++) {
            if (score > _challenge.userScores[users[i]] || users[i] == address(0)) {
                for (uint256 j = 9; j > i; j--) {
                    users[j] = users[j - 1];
                }
                users[i] = _user;
                break;
            }
        }
    }

    function getUserScore(uint256 _challengeId, address _user) external view returns (uint256) {
        return challenges[_challengeId].userScores[_user];
    }

    function getTopUsers(uint256 _challengeId) external view returns (address[10] memory) {
        return challenges[_challengeId].topUsers;
    }
}