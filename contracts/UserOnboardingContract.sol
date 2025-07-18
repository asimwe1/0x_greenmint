// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/AccessControl.sol";

contract UserOnboardingContract is AccessControl {
    bytes32 public constant AUTHORIZER_ROLE = keccak256("AUTHORIZER_ROLE");
    address public backendAddress;
    mapping(address => bool) public registeredUsers;

    event UserRegistered(address indexed user);
    event UserAuthenticated(address indexed user);

    constructor(address _backendAddress) {
        backendAddress = _backendAddress;
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _setupRole(AUTHORIZER_ROLE, msg.sender);
    }

    function registerUser(address _user) external {
        require(msg.sender == backendAddress, "Only backend can register");
        require(!registeredUsers[_user], "User already registered");
        registeredUsers[_user] = true;
        emit UserRegistered(_user);
    }

    function authenticateUser(address _user) external view returns (bool) {
        require(msg.sender == backendAddress, "Only backend can authenticate");
        return registeredUsers[_user];
    }
}