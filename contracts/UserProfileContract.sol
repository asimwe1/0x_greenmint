// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract UserProfileContract {
    address public backendAddress;
    struct UserProfile {
        string carModel;
        uint256 fuelConsumption;
        uint256 totalCarbonSaved;
        uint256 marketplaceItemsSold;
        uint256 marketplaceItemsBought;
    }

    mapping(address => UserProfile) public userProfiles;

    constructor(address _backendAddress) {
        backendAddress = _backendAddress;
    }

    function updateProfile(address _user, string memory _carModel, uint256 _fuelConsumption) external {
        require(msg.sender == backendAddress, "Only backend can update");
        UserProfile storage profile = userProfiles[_user];
        profile.carModel = _carModel;
        profile.fuelConsumption = _fuelConsumption;
    }

    function addCarbonSaved(address _user, uint256 _carbonSaved) external {
        require(msg.sender == backendAddress, "Only backend can update");
        userProfiles[_user].totalCarbonSaved += _carbonSaved;
    }

    function updateMarketplaceActivity(address _user, bool _isSold) external {
        require(msg.sender == backendAddress, "Only backend can update");
        if (_isSold) {
            userProfiles[_user].marketplaceItemsSold += 1;
        } else {
            userProfiles[_user].marketplaceItemsBought += 1;
        }
    }
}