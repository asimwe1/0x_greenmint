// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

contract CarbonCreditTokenContract is ERC20, AccessControl {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    address public backendAddress;

    constructor(address _backendAddress) ERC20("CarbonCredit", "CCT") {
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _setupRole(MINTER_ROLE, msg.sender);
        backendAddress = _backendAddress;
    }

    function mint(address _to, uint256 _amount) external {
        require(msg.sender == backendAddress, "Only backend can mint");
        require(hasRole(MINTER_ROLE, msg.sender), "Caller is not a minter");
        _mint(_to, _amount);
    }

    function burn(address _from, uint256 _amount) external {
        require(msg.sender == backendAddress, "Only backend can burn");
        _burn(_from, _amount);
    }
}