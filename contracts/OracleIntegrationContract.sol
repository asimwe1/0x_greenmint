// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@chainlink/contracts/src/v0.8/operatorforwarder/ChainlinkClient.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

contract OracleIntegrationContract is ChainlinkClient, AccessControl {
    using Chainlink for Chainlink.Request;
    bytes32 public constant ORACLE_ROLE = keccak256("ORACLE_ROLE");
    address public backendAddress;
    address private oracle;
    bytes32 private jobId;
    uint256 private fee;

    mapping(bytes32 => bool) public pendingRequests;
    mapping(bytes32 => uint256) public carbonData;

    event CarbonDataRequested(bytes32 indexed requestId, address requester);
    event CarbonDataReceived(bytes32 indexed requestId, uint256 carbonValue);

    constructor(address _backendAddress, address _oracle, bytes32 _jobId, uint256 _fee) {
        _setChainlinkToken(0x514910771AF9Ca656af840dff83E8264EcF986CA);
        oracle = _oracle;
        jobId = _jobId;
        fee = _fee;
        backendAddress = _backendAddress;
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _setupRole(ORACLE_ROLE, msg.sender);
    }

    function requestCarbonData(address _user) external returns (bytes32 requestId) {
        require(msg.sender == backendAddress, "Only backend can request");
        Chainlink.Request memory req = _buildChainlinkRequest(jobId, address(this), this.fulfill.selector);
        req._add("get", "api.example.com/carbon");
        req._add("path", "carbon.value");
        requestId = _sendChainlinkRequestTo(oracle, req, fee);
        pendingRequests[requestId] = true;
        emit CarbonDataRequested(requestId, _user);
        return requestId;
    }

    function fulfill(bytes32 _requestId, uint256 _carbonValue) public recordChainlinkFulfillment(_requestId) {
        require(pendingRequests[_requestId], "Request not found");
        carbonData[_requestId] = _carbonValue;
        pendingRequests[_requestId] = false;
        emit CarbonDataReceived(_requestId, _carbonValue);
    }

    function getCarbonData(bytes32 _requestId) external view returns (uint256) {
        return carbonData[_requestId];
    }
}