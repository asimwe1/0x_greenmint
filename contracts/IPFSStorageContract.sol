// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/AccessControl.sol";

contract IPFSStorageContract is AccessControl {
    bytes32 public constant UPLOADER_ROLE = keccak256("UPLOADER_ROLE");
    address public backendAddress;
    mapping(string => bool) public validIpfsHashes;

    event IpfsHashUploaded(string indexed ipfsHash);

    constructor(address _backendAddress) {
        backendAddress = _backendAddress;
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _setupRole(UPLOADER_ROLE, msg.sender);
    }

    function uploadIpfsHash(string memory _ipfsHash) external {
        require(msg.sender == backendAddress, "Only backend can upload");
        validIpfsHashes[_ipfsHash] = true;
        emit IpfsHashUploaded(_ipfsHash);
    }

    function isValidIpfsHash(string memory _ipfsHash) external view returns (bool) {
        return validIpfsHashes[_ipfsHash];
    }
}