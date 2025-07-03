// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";

// Manages NFT rewards for GreenMint App challenges
contract NFTRewardContract is ERC721, ERC721URIStorage, ERC721Burnable, AccessControl {
    using Counters for Counters.Counter;

    Counters.Counter private _tokenIdCounter;
    bytes32 public constant ADMINISTRATOR_ROLE = keccak256("ADMINISTRATOR_ROLE");

    // Constructor initializes NFT name and symbol
    constructor() ERC721("GreenMintNFT", "GMNFT") {
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _setupRole(ADMINISTRATOR_ROLE, msg.sender);
    }

    // Mints an NFT to a recipient with an IPFS token URI
    function mintNFT(address recipient, string memory tokenURI)
        external
        onlyRole(ADMINISTRATOR_ROLE)
        returns (uint256)
    {
        _tokenIdCounter.increment();
        uint256 newTokenId = _tokenIdCounter.current();
        _safeMint(recipient, newTokenId);
        _setTokenURI(newTokenId, tokenURI); // Store IPFS metadata URI
        return newTokenId;
    }

    // Explicitly override tokenURI to use ERC721URIStorage implementation
    function tokenURI(uint256 tokenId)
        public
        view
        virtual
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    // Optional base URI for metadata
    function _baseURI() internal view virtual override returns (string memory) {
        return "https://ipfs.example.com/metadata/";
    }

    // Override _burn to handle ERC721URIStorage cleanup
    function _burn(uint256 tokenId) internal virtual override(ERC721, ERC721URIStorage) {
        super._burn(tokenId);
    }

    // Fix _beforeTokenTransfer to match ERC721 signature
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId,
        uint256 batchSize
    ) internal virtual override(ERC721) {
        super._beforeTokenTransfer(from, to, tokenId, batchSize);
    }

    // Supports multiple inheritance for ERC721 and AccessControl
    function supportsInterface(bytes4 interfaceId)
        public
        view
        virtual
        override(ERC721, ERC721URIStorage, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}