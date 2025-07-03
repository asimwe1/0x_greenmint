// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

// Tracks user activities and carbon savings for the GreenMint App
contract CarbonTrackingContract {
    // Struct to store activity details
    struct Activity {
        address user; // User who performed the activity
        uint256 carbonSaved; // CO2 saved in grams
        string activityType; // e.g., "biking", "public_transport"
        uint256 timestamp; // When the activity was recorded
        bool verified; // Verification status from VerificationContract
    }

    // Mapping to store user activities
    mapping(address => Activity[]) public userActivities;

    // Event emitted when an activity is logged
    event ActivityLogged(address indexed user, uint256 carbonSaved, string activityType);

    // Records a verified activity
    function recordActivity(address _user, uint256 _carbonSaved, string memory _activityType, bool _verified) external {
        require(_verified, "Activity must be verified");
        userActivities[_user].push(Activity(_user, _carbonSaved, _activityType, block.timestamp, _verified));
        emit ActivityLogged(_user, _carbonSaved, _activityType);
    }

    // Retrieves all activities for a user
    function getUserActivities(address _user) external view returns (Activity[] memory) {
        return userActivities[_user];
    }
}