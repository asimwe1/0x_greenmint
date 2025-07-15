// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@chainlink/contracts/src/v0.8/shared/interfaces/AggregatorV3Interface.sol";

contract VerificationContract is AccessControl {
    bytes32 public constant VERIFIER_ROLE = keccak256("VERIFIER_ROLE");
    address public backendAddress;
    AggregatorV3Interface public verificationOracle;

    struct Verification {
        address user;
        uint256 activityId;
        string ipfsHash;
        bool isVerified;
        address verifier;
    }

    mapping(uint256 => Verification) public verifications;
    uint256 public verificationCount;

    event VerificationSubmitted(uint256 indexed verificationId, address user, string ipfsHash);
    event VerificationApproved(uint256 indexed verificationId, address verifier);

    constructor(address _backendAddress, address _verificationOracle) {
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _setupRole(VERIFIER_ROLE, msg.sender);
        backendAddress = _backendAddress;
        verificationOracle = AggregatorV3Interface(_verificationOracle);
    }

    function submitVerification(address _user, uint256 _activityId, string memory _ipfsHash) external {
        require(msg.sender == backendAddress, "Only backend can submit");
        verificationCount++;
        verifications[verificationCount] = Verification(_user, _activityId, _ipfsHash, false, address(0));
        emit VerificationSubmitted(verificationCount, _user, _ipfsHash);
    }

    function approveVerifications(uint256[] memory _verificationIds) external onlyRole(VERIFIER_ROLE) {
        require(msg.sender == backendAddress, "Only backend can approve");
        for (uint256 i = 0; i < _verificationIds.length; i++) {
            uint256 id = _verificationIds[i];
            require(!verifications[id].isVerified, "Already verified");
            verifications[id].isVerified = true;
            verifications[id].verifier = msg.sender;
            emit VerificationApproved(id, msg.sender);
        }
    }
}