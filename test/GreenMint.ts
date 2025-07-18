import { expect } from "chai";
const { ethers } = require("hardhat");

describe("GreenMint Contracts", function () {
let carbonTracking: CarbonTrackingContract, 
        rewardPool: RewardPoolContract, 
        userProfile: UserProfileContract, 
        challengeManagement: ChallengeManagementContract, 
        marketplace: MarketplaceContract, 
        owner: Awaited<ReturnType<typeof ethers.getSigner>>, 
        addr1: Awaited<ReturnType<typeof ethers.getSigner>>;

interface CarbonTrackingContract extends ReturnType<typeof ethers.getContractFactory> {}
interface RewardPoolContract extends ReturnType<typeof ethers.getContractFactory> {}
interface UserProfileContract extends ReturnType<typeof ethers.getContractFactory> {}
interface ChallengeManagementContract extends ReturnType<typeof ethers.getContractFactory> {}
interface MarketplaceContract extends ReturnType<typeof ethers.getContractFactory> {}

  beforeEach(async function () {
    [owner, addr1] = await ethers.getSigners();
    const CarbonTrackingContract = await ethers.getContractFactory("CarbonTrackingContract");
    carbonTracking = await CarbonTrackingContract.deploy(owner.address, "0xMockOracleAddress");
    await carbonTracking.waitForDeployment();

    const RewardPoolContract = await ethers.getContractFactory("RewardPoolContract");
    rewardPool = await RewardPoolContract.deploy("0xMockNFTAddress", owner.address, owner.address);
    await rewardPool.waitForDeployment();

    const UserProfileContract = await ethers.getContractFactory("UserProfileContract");
    userProfile = await UserProfileContract.deploy(owner.address);
    await userProfile.waitForDeployment();

    const ChallengeManagementContract = await ethers.getContractFactory("ChallengeManagementContract");
    challengeManagement = await ChallengeManagementContract.deploy(owner.address, await carbonTracking.getAddress());
    await challengeManagement.waitForDeployment();

    const MarketplaceContract = await ethers.getContractFactory("MarketplaceContract");
    marketplace = await MarketplaceContract.deploy(owner.address, "0xMockVerificationAddress", await userProfile.getAddress(), await rewardPool.getAddress(), "0xMockStablecoinAddress");
    await marketplace.waitForDeployment();
  });

  it("Should record activity", async function () {
    await carbonTracking.connect(owner).recordActivities([
      {
        user: addr1.address,
        carbonSaved: 100,
        activityType: "walking",
        timestamp: Math.floor(Date.now() / 1000),
        verified: true,
        ipfsHash: "QmHash"
      }
    ]);
    const activities = await carbonTracking.getUserActivities(addr1.address);
    expect(activities.length).to.equal(1);
    expect(activities[0].carbonSaved).to.equal(100);
  });

  it("Should list and buy an item", async function () {
    await marketplace.connect(owner).listItems([addr1.address], ["QmItemHash"], [ethers.parseEther("1")]);
    await marketplace.connect(owner).buyItems([1], [addr1.address]);
    const listing = await marketplace.listings(1);
    expect(listing.isActive).to.be.false;
  });
});