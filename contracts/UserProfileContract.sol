// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

// Stores user profile data for GreenMint App
contract UserProfileContract {
    // Struct to store user profile
    struct UserProfile {
        string carModel; // e.g., "Toyota Corolla"
        uint256 fuelConsumption; // Liters per month
        uint256 totalCarbonSaved; // Cumulative CO2 saved
    }

    // Mapping to store user profiles
    mapping(address => UserProfile) public userProfiles;

    // Updates user profile
    function updateProfile(address _user, string memory _carModel, uint256 _fuelConsumption) external {
        userProfiles[_user] = UserProfile(_carModel, _fuelConsumption, userProfiles[_user].totalCarbonSaved);
    }

    // Adds carbon savings to user profile
    function addCarbonSaved(address _user, uint256 _carbonSaved) external {
        userProfiles[_user].totalCarbonSaved += _carbonSaved;
    }
}