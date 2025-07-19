import { expect } from "chai";
import { ethers } from "hardhat";
import { 
  CarbonCreditTokenContract,
  CarbonTrackingContract,
  ChallengeManagementContract,
  GovernanceContract,
  IPFSStorageContract,
  LeaderboardContract,
  MarketplaceContract,
  NFTRewardContract,
  OracleIntegrationContract,
  PaymentContract,
  RewardPoolContract,
  UserOnboardingContract,
  UserProfileContract,
  VerificationContract,
  MockOracle,
  MockV3Aggregator
} from "../typechain-types";

describe("GreenMint Platform Integration", function () {
  let carbonCreditToken: CarbonCreditTokenContract;
  let carbonTracking: CarbonTrackingContract;
  let challengeManagement: ChallengeManagementContract;
  let governance: GovernanceContract;
  let ipfsStorage: IPFSStorageContract;
  let leaderboard: LeaderboardContract;
  let marketplace: MarketplaceContract;
  let nftReward: NFTRewardContract;
  let oracleIntegration: OracleIntegrationContract;
  let payment: PaymentContract;
  let rewardPool: RewardPoolContract;
  let userOnboarding: UserOnboardingContract;
  let userProfile: UserProfileContract;
  let verification: VerificationContract;
  let mockOracle: MockOracle;
  let mockV3Aggregator: MockV3Aggregator;
  
  let owner: any;
  let addr1: any;
  let addr2: any;
  let addrs: any[];

  beforeEach(async function () {
    // Get signers
    [owner, addr1, addr2, ...addrs] = await ethers.getSigners();

    // Deploy MockV3Aggregator first
    const MockV3Aggregator = await ethers.getContractFactory("MockV3Aggregator");
    mockV3Aggregator = await MockV3Aggregator.deploy(
      8, // decimals
      200000000 // initial answer (2 USD with 8 decimals)
    );
    await mockV3Aggregator.waitForDeployment();

    // Deploy MockOracle
    const MockOracle = await ethers.getContractFactory("MockOracle");
    mockOracle = await MockOracle.deploy();
    await mockOracle.waitForDeployment();

    // Deploy IPFS Storage
    const IPFSStorage = await ethers.getContractFactory("IPFSStorageContract");
    ipfsStorage = await IPFSStorage.deploy();
    await ipfsStorage.waitForDeployment();

    // Deploy Carbon Credit Token
    const CarbonCreditToken = await ethers.getContractFactory("CarbonCreditTokenContract");
    carbonCreditToken = await CarbonCreditToken.deploy();
    await carbonCreditToken.waitForDeployment();

    // Deploy User Profile
    const UserProfile = await ethers.getContractFactory("UserProfileContract");
    userProfile = await UserProfile.deploy();
    await userProfile.waitForDeployment();

    // Deploy User Onboarding
    const UserOnboarding = await ethers.getContractFactory("UserOnboardingContract");
    userOnboarding = await UserOnboarding.deploy(
      await carbonCreditToken.getAddress(),
      await userProfile.getAddress()
    );
    await userOnboarding.waitForDeployment();

    // Deploy NFT Reward
    const NFTReward = await ethers.getContractFactory("NFTRewardContract");
    nftReward = await NFTReward.deploy(
      await carbonCreditToken.getAddress(),
      await userProfile.getAddress()
    );
    await nftReward.waitForDeployment();

    // Deploy Verification
    const Verification = await ethers.getContractFactory("VerificationContract");
    verification = await Verification.deploy(
      await carbonCreditToken.getAddress(),
      await ipfsStorage.getAddress(),
      await nftReward.getAddress()
    );
    await verification.waitForDeployment();

    // Deploy Carbon Tracking
    const CarbonTracking = await ethers.getContractFactory("CarbonTrackingContract");
    carbonTracking = await CarbonTracking.deploy(
      await carbonCreditToken.getAddress(),
      await verification.getAddress()
    );
    await carbonTracking.waitForDeployment();

    // Deploy Leaderboard
    const Leaderboard = await ethers.getContractFactory("LeaderboardContract");
    leaderboard = await Leaderboard.deploy(
      await carbonCreditToken.getAddress(),
      await userProfile.getAddress()
    );
    await leaderboard.waitForDeployment();

    // Deploy Reward Pool
    const RewardPool = await ethers.getContractFactory("RewardPoolContract");
    rewardPool = await RewardPool.deploy(
      await carbonCreditToken.getAddress(),
      await leaderboard.getAddress()
    );
    await rewardPool.waitForDeployment();

    // Deploy Challenge Management
    const ChallengeManagement = await ethers.getContractFactory("ChallengeManagementContract");
    challengeManagement = await ChallengeManagement.deploy(
      await carbonCreditToken.getAddress(),
      await verification.getAddress(),
      await rewardPool.getAddress()
    );
    await challengeManagement.waitForDeployment();

    // Deploy Governance
    const Governance = await ethers.getContractFactory("GovernanceContract");
    governance = await Governance.deploy(
      await carbonCreditToken.getAddress(),
      await challengeManagement.getAddress(),
      await rewardPool.getAddress()
    );
    await governance.waitForDeployment();

    // Deploy Marketplace
    const Marketplace = await ethers.getContractFactory("MarketplaceContract");
    marketplace = await Marketplace.deploy(
      await carbonCreditToken.getAddress(),
      await nftReward.getAddress(),
      await mockV3Aggregator.getAddress()
    );
    await marketplace.waitForDeployment();

    // Deploy Oracle Integration
    const OracleIntegration = await ethers.getContractFactory("OracleIntegrationContract");
    oracleIntegration = await OracleIntegration.deploy(
      await mockV3Aggregator.getAddress()
    );
    await oracleIntegration.waitForDeployment();

    // Deploy Payment
    const Payment = await ethers.getContractFactory("PaymentContract");
    payment = await Payment.deploy(
      await carbonCreditToken.getAddress(),
      await oracleIntegration.getAddress()
    );
    await payment.waitForDeployment();

    // Set up permissions
    const MINTER_ROLE = await carbonCreditToken.MINTER_ROLE();
    await carbonCreditToken.grantRole(MINTER_ROLE, await verification.getAddress());
    await carbonCreditToken.grantRole(MINTER_ROLE, await challengeManagement.getAddress());
    await carbonCreditToken.grantRole(MINTER_ROLE, await rewardPool.getAddress());
    await carbonCreditToken.grantRole(MINTER_ROLE, await userOnboarding.getAddress());

    const VERIFIER_ROLE = await verification.VERIFIER_ROLE();
    await verification.grantRole(VERIFIER_ROLE, await owner.getAddress());
  });

  describe("User Onboarding and Profile Management", function () {
    it("Should allow users to create profiles and onboard", async function () {
      const userAddress = await addr1.getAddress();
      
      // Create user profile
      await userProfile.connect(addr1).createProfile("John Doe", "john@example.com");
      
      // Check profile exists
      const profile = await userProfile.getProfile(userAddress);
      expect(profile.name).to.equal("John Doe");
      expect(profile.email).to.equal("john@example.com");
      
      // Onboard user
      await userOnboarding.connect(addr1).onboardUser();
      
      // Check onboarding status
      const isOnboarded = await userOnboarding.isOnboarded(userAddress);
      expect(isOnboarded).to.be.true;
      
      // Check welcome bonus
      const balance = await carbonCreditToken.balanceOf(userAddress);
      expect(balance).to.equal(ethers.parseEther("10")); // 10 CCT welcome bonus
    });

    it("Should prevent duplicate profiles", async function () {
      const userAddress = await addr1.getAddress();
      
      // Create first profile
      await userProfile.connect(addr1).createProfile("John Doe", "john@example.com");
      
      // Attempt to create duplicate profile
      await expect(
        userProfile.connect(addr1).createProfile("Jane Doe", "jane@example.com")
      ).to.be.revertedWith("Profile already exists");
    });

    it("Should allow profile updates", async function () {
      const userAddress = await addr1.getAddress();
      
      // Create profile
      await userProfile.connect(addr1).createProfile("John Doe", "john@example.com");
      
      // Update profile
      await userProfile.connect(addr1).updateProfile("John Smith", "johnsmith@example.com");
      
      // Check updated profile
      const profile = await userProfile.getProfile(userAddress);
      expect(profile.name).to.equal("John Smith");
      expect(profile.email).to.equal("johnsmith@example.com");
    });
  });

  describe("Carbon Activity Verification", function () {
    beforeEach(async function () {
      // Setup users
      await userProfile.connect(addr1).createProfile("John Doe", "john@example.com");
      await userOnboarding.connect(addr1).onboardUser();
    });

    it("Should allow users to submit verifications", async function () {
      const userAddress = await addr1.getAddress();
      
      // Submit verification
      await verification.connect(addr1).submitVerification(1, "QmTestHash123");
      
      // Check verification count
      const count = await verification.verificationCount();
      expect(count).to.equal(1);
      
      // Check verification details
      const verificationData = await verification.getVerification(1);
      expect(verificationData.user).to.equal(userAddress);
      expect(verificationData.activityId).to.equal(1);
      expect(verificationData.ipfsHash).to.equal("QmTestHash123");
      expect(verificationData.isVerified).to.be.false;
      expect(verificationData.isRejected).to.be.false;
    });

    it("Should allow verifiers to approve verifications", async function () {
      const userAddress = await addr1.getAddress();
      
      // Submit verification
      await verification.connect(addr1).submitVerification(1, "QmTestHash123");
      
      // Approve verification
      await verification.connect(owner).verifySubmission(1, 50); // 50 CCT reward
      
      // Check verification status
      const verificationData = await verification.getVerification(1);
      expect(verificationData.isVerified).to.be.true;
      
      // Check user received tokens
      const balance = await carbonCreditToken.balanceOf(userAddress);
      expect(balance).to.equal(ethers.parseEther("60")); // 10 welcome + 50 reward
    });

    it("Should allow verifiers to reject verifications", async function () {
      const userAddress = await addr1.getAddress();
      
      // Submit verification
      await verification.connect(addr1).submitVerification(1, "QmTestHash123");
      
      // Reject verification
      await verification.connect(owner).rejectSubmission(1, "Insufficient evidence");
      
      // Check verification status
      const verificationData = await verification.getVerification(1);
      expect(verificationData.isRejected).to.be.true;
      expect(verificationData.rejectionReason).to.equal("Insufficient evidence");
      
      // Check user didn't receive extra tokens
      const balance = await carbonCreditToken.balanceOf(userAddress);
      expect(balance).to.equal(ethers.parseEther("10")); // Only welcome bonus
    });

    it("Should track user activities", async function () {
      const userAddress = await addr1.getAddress();
      
      // Submit and verify multiple activities
      await verification.connect(addr1).submitVerification(1, "QmTestHash123");
      await verification.connect(addr1).submitVerification(2, "QmTestHash456");
      
      await verification.connect(owner).verifySubmission(1, 50);
      await verification.connect(owner).verifySubmission(2, 75);
      
      // Check user activities
      const activities = await verification.getUserActivities(userAddress);
      expect(activities.length).to.equal(2);
      expect(activities[0]).to.equal(1);
      expect(activities[1]).to.equal(2);
    });
  });

  describe("NFT Rewards System", function () {
    beforeEach(async function () {
      // Setup users
      await userProfile.connect(addr1).createProfile("John Doe", "john@example.com");
      await userOnboarding.connect(addr1).onboardUser();
      
      // Submit and verify some activities
      await verification.connect(addr1).submitVerification(1, "QmTestHash123");
      await verification.connect(owner).verifySubmission(1, 100);
    });

    it("Should mint NFT rewards for achievements", async function () {
      const userAddress = await addr1.getAddress();
      
      // Mint NFT reward
      await nftReward.connect(owner).mintReward(
        userAddress,
        "ipfs://QmNFTHash123",
        "First Green Activity",
        1 // First activity achievement
      );
      
      // Check NFT balance
      const balance = await nftReward.balanceOf(userAddress);
      expect(balance).to.equal(1);
      
      // Check NFT metadata
      const tokenURI = await nftReward.tokenURI(1);
      expect(tokenURI).to.equal("ipfs://QmNFTHash123");
    });

    it("Should track NFT attributes", async function () {
      const userAddress = await addr1.getAddress();
      
      // Mint NFT with specific achievement
      await nftReward.connect(owner).mintReward(
        userAddress,
        "ipfs://QmNFTHash123",
        "Carbon Saver",
        1
      );
      
      // Check NFT attributes
      const nftData = await nftReward.getNFTData(1);
      expect(nftData.description).to.equal("Carbon Saver");
      expect(nftData.achievementType).to.equal(1);
      expect(nftData.owner).to.equal(userAddress);
    });

    it("Should get user's NFT collection", async function () {
      const userAddress = await addr1.getAddress();
      
      // Mint multiple NFTs
      await nftReward.connect(owner).mintReward(
        userAddress,
        "ipfs://QmNFTHash123",
        "First Activity",
        1
      );
      await nftReward.connect(owner).mintReward(
        userAddress,
        "ipfs://QmNFTHash456",
        "Eco Champion",
        2
      );
      
      // Check user's NFT collection
      const userNFTs = await nftReward.getUserNFTs(userAddress);
      expect(userNFTs.length).to.equal(2);
      expect(userNFTs[0]).to.equal(1);
      expect(userNFTs[1]).to.equal(2);
    });
  });

  describe("Leaderboard and Competition", function () {
    beforeEach(async function () {
      // Setup multiple users
      await userProfile.connect(addr1).createProfile("John Doe", "john@example.com");
      await userProfile.connect(addr2).createProfile("Jane Smith", "jane@example.com");
      await userOnboarding.connect(addr1).onboardUser();
      await userOnboarding.connect(addr2).onboardUser();
      
      // Give different amounts of tokens
      await verification.connect(addr1).submitVerification(1, "QmTestHash123");
      await verification.connect(addr2).submitVerification(2, "QmTestHash456");
      
      await verification.connect(owner).verifySubmission(1, 100);
      await verification.connect(owner).verifySubmission(2, 150);
    });

    it("Should update leaderboard when users earn credits", async function () {
      const addr1Address = await addr1.getAddress();
      const addr2Address = await addr2.getAddress();
      
      // Update leaderboard
      await leaderboard.updateUserScore(addr1Address, 110); // 10 welcome + 100 reward
      await leaderboard.updateUserScore(addr2Address, 160); // 10 welcome + 150 reward
      
      // Check leaderboard
      const topUsers = await leaderboard.getTopUsers(10);
      expect(topUsers.length).to.equal(2);
      expect(topUsers[0]).to.equal(addr2Address); // Higher score first
      expect(topUsers[1]).to.equal(addr1Address);
    });

    it("Should get user's leaderboard position", async function () {
      const addr1Address = await addr1.getAddress();
      const addr2Address = await addr2.getAddress();
      
      // Update leaderboard
      await leaderboard.updateUserScore(addr1Address, 110);
      await leaderboard.updateUserScore(addr2Address, 160);
      
      // Check positions
      const addr1Position = await leaderboard.getUserPosition(addr1Address);
      const addr2Position = await leaderboard.getUserPosition(addr2Address);
      
      expect(addr1Position).to.equal(2); // Second place
      expect(addr2Position).to.equal(1); // First place
    });
  });

  describe("Challenge Management", function () {
    beforeEach(async function () {
      // Setup users
      await userProfile.connect(addr1).createProfile("John Doe", "john@example.com");
      await userOnboarding.connect(addr1).onboardUser();
    });

    it("Should create environmental challenges", async function () {
      // Create challenge
      await challengeManagement.connect(owner).createChallenge(
        "30-Day Plastic Free",
        "Avoid single-use plastics for 30 days",
        ethers.parseEther("500"), // 500 CCT reward
        2592000, // 30 days in seconds
        100 // Max participants
      );
      
      // Check challenge details
      const challenge = await challengeManagement.getChallenge(1);
      expect(challenge.title).to.equal("30-Day Plastic Free");
      expect(challenge.description).to.equal("Avoid single-use plastics for 30 days");
      expect(challenge.reward).to.equal(ethers.parseEther("500"));
      expect(challenge.isActive).to.be.true;
    });

    it("Should allow users to join challenges", async function () {
      const userAddress = await addr1.getAddress();
      
      // Create challenge
      await challengeManagement.connect(owner).createChallenge(
        "30-Day Plastic Free",
        "Avoid single-use plastics for 30 days",
        ethers.parseEther("500"),
        2592000,
        100
      );
      
      // Join challenge
      await challengeManagement.connect(addr1).joinChallenge(1);
      
      // Check participation
      const isParticipant = await challengeManagement.isParticipant(1, userAddress);
      expect(isParticipant).to.be.true;
      
      // Check challenge participant count
      const challenge = await challengeManagement.getChallenge(1);
      expect(challenge.participantCount).to.equal(1);
    });

    it("Should complete challenges and distribute rewards", async function () {
      const userAddress = await addr1.getAddress();
      
      // Create challenge
      await challengeManagement.connect(owner).createChallenge(
        "30-Day Plastic Free",
        "Avoid single-use plastics for 30 days",
        ethers.parseEther("500"),
        2592000,
        100
      );
      
      // Join challenge
      await challengeManagement.connect(addr1).joinChallenge(1);
      
      // Complete challenge
      await challengeManagement.connect(owner).completeChallenge(1, userAddress);
      
      // Check completion status
      const isCompleted = await challengeManagement.hasCompletedChallenge(1, userAddress);
      expect(isCompleted).to.be.true;
      
      // Check reward distribution
      const balance = await carbonCreditToken.balanceOf(userAddress);
      expect(balance).to.equal(ethers.parseEther("510")); // 10 welcome + 500 challenge reward
    });
  });

  describe("Marketplace Integration", function () {
    beforeEach(async function () {
      // Setup users
      await userProfile.connect(addr1).createProfile("John Doe", "john@example.com");
      await userProfile.connect(addr2).createProfile("Jane Smith", "jane@example.com");
      await userOnboarding.connect(addr1).onboardUser();
      await userOnboarding.connect(addr2).onboardUser();
      
      // Give addr1 some tokens and NFT
      await verification.connect(addr1).submitVerification(1, "QmTestHash123");
      await verification.connect(owner).verifySubmission(1, 100);
      
      await nftReward.connect(owner).mintReward(
        await addr1.getAddress(),
        "ipfs://QmNFTHash123",
        "Eco Champion",
        1
      );
    });

    it("Should list NFTs for sale", async function () {
      const userAddress = await addr1.getAddress();
      
      // Approve marketplace to transfer NFT
      await nftReward.connect(addr1).approve(await marketplace.getAddress(), 1);
      
      // List NFT for sale
      await marketplace.connect(addr1).listNFT(1, ethers.parseEther("50"));
      
      // Check listing
      const listing = await marketplace.getListing(1);
      expect(listing.seller).to.equal(userAddress);
      expect(listing.tokenId).to.equal(1);
      expect(listing.price).to.equal(ethers.parseEther("50"));
      expect(listing.isActive).to.be.true;
    });

    it("Should allow users to buy NFTs", async function () {
      const addr1Address = await addr1.getAddress();
      const addr2Address = await addr2.getAddress();
      
      // Give addr2 more tokens for purchase
      await verification.connect(addr2).submitVerification(2, "QmTestHash456");
      await verification.connect(owner).verifySubmission(2, 100);
      
      // List NFT for sale
      await nftReward.connect(addr1).approve(await marketplace.getAddress(), 1);
      await marketplace.connect(addr1).listNFT(1, ethers.parseEther("50"));
      
      // Buy NFT
      await marketplace.connect(addr2).buyNFT(1);
      
      // Check NFT ownership transfer
      const newOwner = await nftReward.ownerOf(1);
      expect(newOwner).to.equal(addr2Address);
      
      // Check token balances
      const addr1Balance = await carbonCreditToken.balanceOf(addr1Address);
      const addr2Balance = await carbonCreditToken.balanceOf(addr2Address);
      
      expect(addr1Balance).to.equal(ethers.parseEther("160")); // 10 + 100 + 50 from sale
      expect(addr2Balance).to.equal(ethers.parseEther("60")); // 10 + 100 - 50 for purchase
    });
  });

  describe("Payment and Oracle Integration", function () {
    it("Should get current token price from oracle", async function () {
      // Check oracle price
      const price = await oracleIntegration.getLatestPrice();
      expect(price).to.equal(200000000); // 2 USD with 8 decimals
    });

    it("Should process payments with oracle pricing", async function () {
      const userAddress = await addr1.getAddress();
      
      // Setup user
      await userProfile.connect(addr1).createProfile("John Doe", "john@example.com");
      await userOnboarding.connect(addr1).onboardUser();
      
      // Process payment
      await payment.connect(addr1).processPayment(
        ethers.parseEther("10"), // 10 CCT
        "Premium membership"
      );
      
      // Check payment was processed
      const balance = await carbonCreditToken.balanceOf(userAddress);
      expect(balance).to.equal(ethers.parseEther("0")); // 10 welcome - 10 payment
    });
  });

  describe("Platform Integration", function () {
    it("Should handle complete user journey", async function () {
      const userAddress = await addr1.getAddress();
      
      // 1. User creates profile and onboards
      await userProfile.connect(addr1).createProfile("John Doe", "john@example.com");
      await userOnboarding.connect(addr1).onboardUser();
      
      // 2. User submits verification
      await verification.connect(addr1).submitVerification(1, "QmTestHash123");
      
      // 3. Verification is approved
      await verification.connect(owner).verifySubmission(1, 100);
      
      // 4. User gets NFT reward
      await nftReward.connect(owner).mintReward(
        userAddress,
        "ipfs://QmNFTHash123",
        "First Green Activity",
        1
      );
      
      // 5. User joins challenge
      await challengeManagement.connect(owner).createChallenge(
        "Eco Challenge",
        "Complete green activities",
        ethers.parseEther("200"),
        2592000,
        100
      );
      await challengeManagement.connect(addr1).joinChallenge(1);
      
      // 6. User completes challenge
      await challengeManagement.connect(owner).completeChallenge(1, userAddress);
      
      // 7. Check final state
      const profile = await userProfile.getProfile(userAddress);
      const balance = await carbonCreditToken.balanceOf(userAddress);
      const nftBalance = await nftReward.balanceOf(userAddress);
      const isOnboarded = await userOnboarding.isOnboarded(userAddress);
      const hasCompletedChallenge = await challengeManagement.hasCompletedChallenge(1, userAddress);
      
      expect(profile.name).to.equal("John Doe");
      expect(balance).to.equal(ethers.parseEther("310")); // 10 welcome + 100 verification + 200 challenge
      expect(nftBalance).to.equal(1);
      expect(isOnboarded).to.be.true;
      expect(hasCompletedChallenge).to.be.true;
    });
  });
});
