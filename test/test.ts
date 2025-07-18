import { expect } from "chai";
import { ethers, artifacts } from "hardhat";
import fs from "fs";

function artifactExists(contractName: string): boolean {
  try {
    const path = artifacts.readArtifactSync(contractName).sourceName;
    return !!path;
  } catch (e) {
    return false;
  }
}

describe("GreenMint Contracts Integration", function () {
  let deployer: any, payee1: any, payee2: any, user: any;
  let nftReward: any;
  let rewardPool: any;
  let carbonTracking: any;
  let leaderboard: any;
  let payment: any;
  let challengeManagement: any;
  let userProfile: any;
  let verification: any;
  let solanaAdapter: any;
  let stablecoin: any;
  let mockOracle: any;

  beforeEach(async function () {
    [deployer, payee1, payee2, user] = await ethers.getSigners();
    const backendAddress = await deployer.getAddress();
    const payee1Address = await payee1.getAddress();
    const payee2Address = await payee2.getAddress();
    const userAddress = await user.getAddress();

    // Validate addresses are proper Ethereum addresses
    const addresses = [backendAddress, payee1Address, payee2Address, userAddress];
    for (const addr of addresses) {
      if (!/^0x[a-fA-F0-9]{40}$/.test(addr)) {
        throw new Error(`Invalid Ethereum address detected: ${addr}`);
      }
    }

    const contractNames = [
      "CarbonCreditTokenContract",
      "MockOracle",
      "NFTRewardContract",
      "RewardPoolContract",
      "CarbonTrackingContract",
      "LeaderboardContract",
      "MutablePaymentSplitter",
      "ChallengeManagementContract",
      "UserProfileContract",
      "VerificationContract",
      "SolanaAdapterContract"
    ];
    for (const name of contractNames) {
      if (!artifactExists(name)) {
        throw new Error(`Artifact for contract '${name}' is missing. Did you run 'npx hardhat compile'?`);
      }
    }
    
    // Remove previous logging, only show deployed contract addresses
    // Deploy dependencies first
    const CarbonCreditTokenContract = await ethers.getContractFactory("CarbonCreditTokenContract");
    stablecoin = await CarbonCreditTokenContract.deploy(backendAddress); // Correct constructor
    await stablecoin.waitForDeployment();
    console.log("stablecoin deployed to:", await stablecoin.getAddress());

    const OracleMock = await ethers.getContractFactory("MockOracle");
    mockOracle = await OracleMock.deploy();
    await mockOracle.waitForDeployment();
    console.log("mockOracle deployed to:", await mockOracle.getAddress());

    // Deploy other contracts
    const NFTRewardContract = await ethers.getContractFactory("NFTRewardContract");
    nftReward = await NFTRewardContract.deploy();
    await nftReward.waitForDeployment();
    console.log("nftReward deployed to:", await nftReward.getAddress());

    const RewardPoolContract = await ethers.getContractFactory("RewardPoolContract");
    rewardPool = await RewardPoolContract.deploy(await nftReward.getAddress(), await stablecoin.getAddress(), backendAddress);
    await rewardPool.waitForDeployment();
    console.log("rewardPool deployed to:", await rewardPool.getAddress());

    const CarbonTrackingContract = await ethers.getContractFactory("CarbonTrackingContract");
    carbonTracking = await CarbonTrackingContract.deploy(backendAddress, await mockOracle.getAddress());
    await carbonTracking.waitForDeployment();
    console.log("carbonTracking deployed to:", await carbonTracking.getAddress());

    const LeaderboardContract = await ethers.getContractFactory("LeaderboardContract");
    leaderboard = await LeaderboardContract.deploy(backendAddress, await carbonTracking.getAddress());
    await leaderboard.waitForDeployment();
    console.log("leaderboard deployed to:", await leaderboard.getAddress());

    const payees: string[] = [payee1Address, payee2Address];
    const shares: number[] = [50, 50];
    const PaymentContract = await ethers.getContractFactory("MutablePaymentSplitter");
    payment = await PaymentContract.deploy(payees, shares, await stablecoin.getAddress(), backendAddress);
    await payment.waitForDeployment();
    console.log("payment deployed to:", await payment.getAddress());

    const ChallengeManagementContract = await ethers.getContractFactory("ChallengeManagementContract");
    challengeManagement = await ChallengeManagementContract.deploy(backendAddress, await carbonTracking.getAddress());
    await challengeManagement.waitForDeployment();
    console.log("challengeManagement deployed to:", await challengeManagement.getAddress());

    const UserProfileContract = await ethers.getContractFactory("UserProfileContract");
    userProfile = await UserProfileContract.deploy(backendAddress);
    await userProfile.waitForDeployment();
    console.log("userProfile deployed to:", await userProfile.getAddress());

    const VerificationContract = await ethers.getContractFactory("VerificationContract");
    verification = await VerificationContract.deploy(backendAddress, await mockOracle.getAddress());
    await verification.waitForDeployment();
    console.log("verification deployed to:", await verification.getAddress());

    const SolanaAdapterContract = await ethers.getContractFactory("SolanaAdapterContract");
    solanaAdapter = await SolanaAdapterContract.deploy();
    await solanaAdapter.waitForDeployment();
    console.log("solanaAdapter deployed to:", await solanaAdapter.getAddress());
});

// Keep the existing test cases (should deploy all contracts, mint NFT, etc.) as they are
  it("should deploy all contracts", async function () {
    expect(await nftReward.getAddress()).to.be.properAddress;
    expect(await rewardPool.getAddress()).to.be.properAddress;
    expect(await carbonTracking.getAddress()).to.be.properAddress;
    expect(await leaderboard.getAddress()).to.be.properAddress;
    expect(await payment.getAddress()).to.be.properAddress;
    expect(await challengeManagement.getAddress()).to.be.properAddress;
    expect(await userProfile.getAddress()).to.be.properAddress;
    expect(await verification.getAddress()).to.be.properAddress;
    expect(await solanaAdapter.getAddress()).to.be.properAddress;
  });

  it("should mint an NFT in NFTRewardContract", async function () {
    await nftReward.grantRole(await nftReward.ADMINISTRATOR_ROLE(), await deployer.getAddress());
    const tokenURI: string = "ipfs://example-uri";
    await nftReward.mintNFT(await user.getAddress(), tokenURI);
    expect(await nftReward.ownerOf(1)).to.equal(await user.getAddress());
    expect(await nftReward.tokenURI(1)).to.equal(`https://ipfs.example.com/metadata/${tokenURI}`);
  });

  it("should record activity in CarbonTrackingContract", async function () {
    const activity = {
      user: await user.getAddress(),
      carbonSaved: 1000,
      activityType: "biking",
      timestamp: Math.floor(Date.now() / 1000),
      verified: true,
      ipfsHash: "QmHash"
    };
    await carbonTracking.recordActivities([activity]);
    const activities: any[] = await carbonTracking.getUserActivities(await user.getAddress());
    expect(activities[0].carbonSaved).to.equal(1000);
    expect(activities[0].activityType).to.equal("biking");
  });

  it("should update score in LeaderboardContract", async function () {
    await leaderboard.updateScore(1, await user.getAddress(), 1000, false);
    expect(await leaderboard.getUserScore(1, await user.getAddress())).to.equal(1000);
  });

  it("should add payee and release payment in PaymentContract", async function () {
    await payment.addPayee(await user.getAddress(), 25);
    // Only test ERC20 payments, do not send ETH
    // Simulate stablecoin transfer to contract
    await stablecoin.mint(await payment.getAddress(), 1000);
    const initialBalance = await stablecoin.balanceOf(await user.getAddress());
    await payment.release([await user.getAddress()]);
    const finalBalance = await stablecoin.balanceOf(await user.getAddress());
    expect(finalBalance).to.be.gt(initialBalance);
  });

  it("should create challenge in ChallengeManagementContract", async function () {
    await challengeManagement.grantRole(await challengeManagement.ADMIN_ROLE(), await deployer.getAddress());
    const challenge = {
      challengeId: 0,
      description: "ipfs://challenge-details",
      startTime: 0,
      endTime: 3600,
      isActive: false,
      isMarketplaceChallenge: false
    };
    await challengeManagement.createChallenges([challenge]);
    const created = await challengeManagement.challenges(1);
    expect(created.challengeId).to.equal(1);
    expect(created.isActive).to.be.true;
  });

  it("should update profile in UserProfileContract", async function () {
    await userProfile.updateProfile(await user.getAddress(), "Toyota Corolla", 50);
    await userProfile.addCarbonSaved(await user.getAddress(), 1000);
    const profile: any = await userProfile.userProfiles(await user.getAddress());
    expect(profile.carModel).to.equal("Toyota Corolla");
    expect(profile.fuelConsumption).to.equal(50);
    expect(profile.totalCarbonSaved).to.equal(1000);
  });

  it("should submit and approve verification in VerificationContract", async function () {
    await verification.grantRole(await verification.VERIFIER_ROLE(), await deployer.getAddress());
    await verification.submitVerification(await user.getAddress(), 1, "ipfs://verification-data");
    await verification.approveVerifications([1]);
    const verificationData: any = await verification.verifications(1);
    expect(verificationData.isVerified).to.be.true;
    expect(verificationData.verifier).to.equal(await deployer.getAddress());
  });

  it("should deposit and distribute NFT in RewardPoolContract", async function () {
    await nftReward.grantRole(await nftReward.ADMINISTRATOR_ROLE(), await deployer.getAddress());
    await rewardPool.grantRole(await rewardPool.ADMIN_ROLE(), await deployer.getAddress());
    await nftReward.mintNFT(await deployer.getAddress(), "ipfs://example-uri");
    await nftReward.approve(await rewardPool.getAddress(), 1);
    await rewardPool.depositNFTs(1, [1], false);
    await rewardPool.distributeReward(1, await user.getAddress(), false);
    expect(await nftReward.ownerOf(1)).to.equal(await user.getAddress());
  });

  it("should sync data in SolanaAdapterContract", async function () {
    await expect(solanaAdapter.syncToSolana(await user.getAddress(), "0x1234"))
      .to.emit(solanaAdapter, "DataSyncedToSolana")
      .withArgs(await user.getAddress(), "0x1234");
  });
});