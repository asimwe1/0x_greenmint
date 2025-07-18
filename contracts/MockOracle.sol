// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract MockOracle {
    function latestAnswer() external pure returns (int256) {
        return 1000;
    }
    function getAddress() external view returns (address) {
        return address(this);
    }
}