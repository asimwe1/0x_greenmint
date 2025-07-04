// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/governance/Governor.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorVotes.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorCountingSimple.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/governance/IGovernor.sol";

// Manages decentralized governance for GreenMint App
contract GovernanceContract is Governor, GovernorVotes, GovernorCountingSimple {
    constructor(IVotes _nftContract) 
        Governor("GreenMintGovernance") 
        GovernorVotes(_nftContract)
        GovernorCountingSimple()
    {}

    // Proposes a governance action
    function propose(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        string memory description
    ) public override returns (uint256) {
        return super.propose(targets, values, calldatas, description);
    }

    // Required governance parameters
    function votingDelay() public pure override returns (uint256) {
        return 1; // 1 block delay
    }

    function votingPeriod() public pure override returns (uint256) {
        return 45818; // ~1 week in blocks
    }

    function quorum(uint256 /* blockNumber */) public pure override returns (uint256) {
        return 100; // Minimum votes needed
    }

    function getVotes(address account, uint256 blockNumber) 
        public 
        view 
        override
        returns (uint256) 
    {
        return super.getVotes(account, blockNumber);
    }

    // Returns the vote counting mode
    function COUNTING_MODE() public pure override(IGovernor, GovernorCountingSimple) returns (string memory) {
        return "support=bravo&quorum=for";
    }

    // Internal function to count votes
    function _countVote(
        uint256 proposalId,
        address account,
        uint8 support,
        uint256 weight,
        bytes memory /* params */
    ) internal override(Governor, GovernorCountingSimple) {
        super._countVote(proposalId, account, support, weight, bytes(""));
    }

    // Internal function to check if quorum is reached
    function _quorumReached(uint256 proposalId) internal view override(Governor, GovernorCountingSimple) returns (bool) {
        (uint256 againstVotes, uint256 forVotes, uint256 abstainVotes) = proposalVotes(proposalId);
        uint256 totalVotes = forVotes + againstVotes + abstainVotes;
        return totalVotes >= quorum(block.number);
    }

    // Internal function to check if vote succeeded
    function _voteSucceeded(uint256 proposalId) internal view override(Governor, GovernorCountingSimple) returns (bool) {
        (uint256 againstVotes, uint256 forVotes, ) = proposalVotes(proposalId);
        return forVotes > againstVotes;
    }
}