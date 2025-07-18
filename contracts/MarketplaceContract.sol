// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./VerificationContract.sol";
import "./UserProfileContract.sol";
import "./RewardPoolContract.sol";

contract MarketplaceContract is AccessControl {
    bytes32 public constant SELLER_ROLE = keccak256("SELLER_ROLE");
    address public backendAddress;
    VerificationContract public verificationContract;
    UserProfileContract public userProfileContract;
    RewardPoolContract public rewardPoolContract;
    IERC20 public stablecoin;

    struct Listing {
        uint256 listingId;
        address seller;
        string ipfsDescription;
        uint256 price;
        bool isActive;
        bool isVerified;
    }

    mapping(uint256 => Listing) public listings;
    uint256 public listingCount;

    event ItemListed(uint256 indexed listingId, address seller, string ipfsDescription, uint256 price);
    event ItemSold(uint256 indexed listingId, address buyer, uint256 price);

    constructor(address _backendAddress, address _verificationContract, address _userProfileContract, address _rewardPoolContract, address _stablecoin) {
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _setupRole(SELLER_ROLE, msg.sender);
        backendAddress = _backendAddress;
        verificationContract = VerificationContract(_verificationContract);
        userProfileContract = UserProfileContract(_userProfileContract);
        rewardPoolContract = RewardPoolContract(_rewardPoolContract);
        stablecoin = IERC20(_stablecoin);
    }

    function listItems(address[] memory _sellers, string[] memory _ipfsDescriptions, uint256[] memory _prices) external {
        require(msg.sender == backendAddress, "Only backend can list");
        require(_sellers.length == _ipfsDescriptions.length && _ipfsDescriptions.length == _prices.length, "Array length mismatch");
        for (uint256 i = 0; i < _sellers.length; i++) {
            listingCount++;
            listings[listingCount] = Listing(listingCount, _sellers[i], _ipfsDescriptions[i], _prices[i], true, false);
            verificationContract.submitVerification(_sellers[i], listingCount, _ipfsDescriptions[i]);
            emit ItemListed(listingCount, _sellers[i], _ipfsDescriptions[i], _prices[i]);
        }
    }

    function buyItems(uint256[] memory _listingIds, address[] memory _buyers) external {
        require(msg.sender == backendAddress, "Only backend can buy");
        require(_listingIds.length == _buyers.length, "Array length mismatch");
        for (uint256 i = 0; i < _listingIds.length; i++) {
            uint256 id = _listingIds[i];
            Listing storage listing = listings[id];
            require(listing.isActive, "Listing not active");
            require(listing.isVerified, "Listing not verified");
            require(stablecoin.balanceOf(_buyers[i]) >= listing.price, "Insufficient funds");
            
            stablecoin.transferFrom(_buyers[i], listing.seller, listing.price);
            listing.isActive = false;
            
            userProfileContract.updateMarketplaceActivity(_buyers[i], false);
            userProfileContract.updateMarketplaceActivity(listing.seller, true);
            rewardPoolContract.distributeReward(id, _buyers[i], true);
            
            emit ItemSold(id, _buyers[i], listing.price);
        }
    }

    function verifyListings(uint256[] memory _listingIds) external onlyRole(SELLER_ROLE) {
        require(msg.sender == backendAddress, "Only backend can verify");
        for (uint256 i = 0; i < _listingIds.length; i++) {
            listings[_listingIds[i]].isVerified = true;
        }
    }
}