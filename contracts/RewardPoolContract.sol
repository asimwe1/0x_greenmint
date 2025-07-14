// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract RewardPoolContract is AccessControl {
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    IERC721 public nftContract;
    IERC20 public tokenContract;
    address public backendAddress;

    mapping(uint256 => uint256[]) public challengeRewards;
    mapping(uint256 => uint256[]) public marketplaceRewards;

    constructor(address _nftContract, address _tokenContract, address _backendAddress) {
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _setupRole(ADMIN_ROLE, msg.sender);
        nftContract = IERC721(_nftContract);
        tokenContract = IERC20(_tokenContract);
        backendAddress = _backendAddress;
    }

    function depositNFTs(uint256 _id, uint256[] memory _tokenIds, bool _isMarketplace) external onlyRole(ADMIN_ROLE) {
        for (uint256 i = 0; i < _tokenIds.length; i++) {
            nftContract.transferFrom(msg.sender, address(this), _tokenIds[i]);
            if (_isMarketplace) {
                marketplaceRewards[_id].push(_tokenIds[i]);
            } else {
                challengeRewards[_id].push(_tokenIds[i]);
            }
        }
    }

    function distributeReward(uint256 _id, address _recipient, bool _isMarketplace) external {
        require(msg.sender == backendAddress, "Only backend can distribute");
        uint256[] storage rewards = _isMarketplace ? marketplaceRewards[_id] : challengeRewards[_id];
        require(rewards.length > 0, "No rewards available");
        uint256 tokenId = rewards[rewards.length - 1];
        rewards.pop();
        nftContract.transferFrom(address(this), _recipient, tokenId);
    }

    function distributeTokenReward(address _recipient, uint256 _amount) external {
        require(msg.sender == backendAddress, "Only backend can distribute");
        require(tokenContract.balanceOf(address(this)) >= _amount, "Insufficient token balance");
        tokenContract.transfer(_recipient, _amount);
    }
}