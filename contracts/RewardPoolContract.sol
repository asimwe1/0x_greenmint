// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

// Manages reward pool for GreenMint App challenges
contract RewardPoolContract is AccessControl {
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    IERC721 public nftContract;

    // Mapping to store challenge rewards (NFT token IDs)
    mapping(uint256 => uint256[]) public challengeRewards;

    constructor(address _nftContract) {
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _setupRole(ADMIN_ROLE, msg.sender);
        nftContract = IERC721(_nftContract);
    }

    // Deposits NFTs into the reward pool
    function depositNFTs(uint256 _challengeId, uint256[] memory _tokenIds) external onlyRole(ADMIN_ROLE) {
        for (uint256 i = 0; i < _tokenIds.length; i++) {
            nftContract.transferFrom(msg.sender, address(this), _tokenIds[i]);
            challengeRewards[_challengeId].push(_tokenIds[i]);
        }
    }

    // Distributes an NFT to a challenge winner
    function distributeReward(uint256 _challengeId, address _recipient) external onlyRole(ADMIN_ROLE) {
        require(challengeRewards[_challengeId].length > 0, "No rewards available");
        uint256 tokenId = challengeRewards[_challengeId][challengeRewards[_challengeId].length - 1];
        challengeRewards[_challengeId].pop();
        nftContract.transferFrom(address(this), _recipient, tokenId);
    }
}