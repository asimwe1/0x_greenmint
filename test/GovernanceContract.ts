const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("GovernanceContract", function () {
  let GovernanceContract, governance, nft, owner, voter1;

  beforeEach(async function () {
    [owner, voter1] = await ethers.getSigners();

    // Deploy a mock NFT contract for voting
    const NFT = await ethers.getContractFactory("NFTRewardContract");
    nft = await NFT.deploy();
    await nft.waitForDeployment();

    // Deploy GovernanceContract
    const Governance = await ethers.getContractFactory("GovernanceContract");
    governance = await Governance.deploy(await nft.getAddress());
    await governance.waitForDeployment();
  });

  it("should return correct COUNTING_MODE", async function () {
    expect(await governance.COUNTING_MODE()).to.equal("support=bravo&quorum=for");
  });

  it("should allow proposing and checking votes", async function () {
    // Grant ADMINISTRATOR_ROLE to owner
    await nft.grantRole(await nft.ADMINISTRATOR_ROLE(), await owner.getAddress());

    // Mint an NFT to voter1 to give voting power
    await nft.connect(owner).mintNFT(await voter1.getAddress(), "ipfs://test");

    // Propose a new action
    const targets = [ethers.ZeroAddress];
    const values = [0];
    const calldatas = ["0x"];
    const description = "Test proposal";

    const tx = await governance.connect(voter1).propose(targets, values, calldatas, description);
    const receipt = await tx.wait();
    const event = await governance.queryFilter(governance.filters.ProposalCreated(), receipt.blockNumber, receipt.blockNumber);
    const proposalId = event[0].args.proposalId;

    // Verify proposalVotes
    const [againstVotes, forVotes, abstainVotes] = await governance.proposalVotes(proposalId);
    expect(forVotes).to.equal(0);
    expect(againstVotes).to.equal(0);
    expect(abstainVotes).to.equal(0);
  });
});