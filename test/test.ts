import { expect } from "chai";
import { ethers } from "hardhat";
import { Contract, Signer, BigNumber } from "ethers";

describe("GreenMint Contracts", function () {
  let deployer: Signer, payee1: Signer, payee2: Signer, user: Signer;
  let nftReward: Contract;
  let governance: Contract;
  let rewardPool: Contract;
  let carbonTracking: Contract;
  let leaderboard: Contract;
  let payment: Contract;
  let challengeManagement: Contract;
  let userProfile: Contract;
  let verification: Contract;
  let solanaAdapter: Contract;

  beforeEach(async function () {
    [deployer, payee1, payee2, user] = await ethers.getSigners();

    const payees: string[] = [await payee1.getAddress(), await payee2.getAddress()];
    const shares: number[] = [50, 50];

    const NFTRewardContract = await ethers.getContractFactory("NFTRewardContract");
    nftReward = await NFTRewardContract.deploy();
    await nftReward.waitForDeployment();

    const GovernanceContract = await ethers.getContractFactory("GovernanceContract");
    governance = await GovernanceContract.deploy(await nftReward.getAddress());
    await governance.waitForDeployment();

    const RewardPoolContract = await ethers.getContractFactory("RewardPoolContract");
    rewardPool = await RewardPoolContract.deploy(await nftReward.getAddress());
    await rewardPool.waitForDeployment();

    const CarbonTrackingContract = await ethers.getContractFactory("CarbonTrackingContract");
    carbonTracking = await CarbonTrackingContract.deploy();
    await carbonTracking.waitForDeployment();

    const LeaderboardContract = await ethers.getContractFactory("LeaderboardContract");
    leaderboard = await LeaderboardContract.deploy(await carbonTracking.getAddress());
    await leaderboard.waitForDeployment();

    const PaymentContract = await ethers.getContractFactory("MutablePaymentSplitter");
    payment = await PaymentContract.deploy(payees, shares);
    await payment.waitForDeployment();

    const ChallengeManagementContract = await ethers.getContractFactory("ChallengeManagementContract");
    challengeManagement = await ChallengeManagementContract.deploy();
    await challengeManagement.waitForDeployment();

    const UserProfileContract = await ethers.getContractFactory("UserProfileContract");
    userProfile = await UserProfileContract.deploy();
    await userProfile.waitForDeployment();

    const VerificationContract = await ethers.getContractFactory("VerificationContract");
    verification = await VerificationContract.deploy();
    await verification.waitForDeployment();

    const SolanaAdapterContract = await ethers.getContractFactory("SolanaAdapterContract");
    solanaAdapter = await SolanaAdapterContract.deploy();
    await solanaAdapter.waitForDeployment();
  });

  it("should deploy all contracts", async function () {
    expect(await nftReward.getAddress()).to.be.properAddress;
    expect(await governance.getAddress()).to.be.properAddress;
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
    await carbonTracking.recordActivity(await user.getAddress(), 1000, "biking", true);
    const activities: any[] = await carbonTracking.getUserActivities(await user.getAddress());
    expect(activities[0].carbonSaved).to.equal(1000);
    expect(activities[0].activityType).to.equal("biking");
  });

  it("should update score in LeaderboardContract", async function () {
    await leaderboard.updateScore(1, await user.getAddress(), 1000);
    expect(await leaderboard.getUserScore(1, await user.getAddress())).to.equal(1000);
  });

  it("should add payee and release payment in PaymentContract", async function () {
    await payment.addPayee(await user.getAddress(), 25);
    await deployer.sendTransaction({ to: await payment.getAddress(), value: ethers.parseEther("1") });
    const initialBalance: BigNumber = await ethers.provider.getBalance(await user.getAddress()); // Updated
    await payment.release(await user.getAddress());
    const finalBalance: BigNumber = await ethers.provider.getBalance(await user.getAddress()); // Updated
    expect(finalBalance).to.be.gt(initialBalance);
  });

  it("should create challenge in ChallengeManagementContract", async function () {
    await challengeManagement.grantRole(await challengeManagement.ADMIN_ROLE(), await deployer.getAddress());
    await challengeManagement.createChallenge("ipfs://challenge-details", 3600);
    const challenge: any = await challengeManagement.challenges(1);
    expect(challenge.challengeId).to.equal(1);
    expect(challenge.isActive).to.be.true;
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
    await verification.approveVerification(1);
    const verificationData: any = await verification.verifications(1);
    expect(verificationData.isVerified).to.be.true;
    expect(verificationData.verifier).to.equal(await deployer.getAddress());
  });

  it("should deposit and distribute NFT in RewardPoolContract", async function () {
    await nftReward.grantRole(await nftReward.ADMINISTRATOR_ROLE(), await deployer.getAddress());
    await rewardPool.grantRole(await rewardPool.ADMIN_ROLE(), await deployer.getAddress());
    await nftReward.mintNFT(await deployer.getAddress(), "ipfs://example-uri");
    await nftReward.approve(await rewardPool.getAddress(), 1);
    await rewardPool.depositNFTs(1, [1]);
    await rewardPool.distributeReward(1, await user.getAddress());
    expect(await nftReward.ownerOf(1)).to.equal(await user.getAddress());
  });

  it("should sync data in SolanaAdapterContract", async function () {
    await expect(solanaAdapter.syncToSolana(await user.getAddress(), "0x1234"))
      .to.emit(solanaAdapter, "DataSyncedToSolana")
      .withArgs(await user.getAddress(), "0x1234");
  });
});