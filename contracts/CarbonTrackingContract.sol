// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@chainlink/contracts/src/v0.8/shared/interfaces/AggregatorV3Interface.sol";

contract CarbonTrackingContract {
    address public backendAddress;
    struct Activity {
        address user;
        uint256 carbonSaved;
        string activityType;
        uint256 timestamp;
        bool verified;
        string ipfsHash;
    }

    mapping(address => Activity[]) public userActivities;
    AggregatorV3Interface public carbonOracle;

    event ActivityLogged(address indexed user, uint256 carbonSaved, string activityType);

    constructor(address _backendAddress, address _carbonOracle) {
        backendAddress = _backendAddress;
        carbonOracle = AggregatorV3Interface(_carbonOracle);
    }

    function recordActivities(Activity[] memory _activities) external {
        require(msg.sender == backendAddress, "Only backend can record");
        for (uint256 i = 0; i < _activities.length; i++) {
            userActivities[_activities[i].user].push(_activities[i]);
            emit ActivityLogged(_activities[i].user, _activities[i].carbonSaved, _activities[i].activityType);
        }
    }

    function getUserActivities(address _user) external view returns (Activity[] memory) {
        return userActivities[_user];
    }
}