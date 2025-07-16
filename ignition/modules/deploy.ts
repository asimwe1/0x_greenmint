const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);

  // Deploy dependencies (e.g., mock oracle, stablecoin)
  const MockOracle = await hre.ethers.getContractFactory("MockV3Aggregator");
  const oracle = await MockOracle.deploy(18, hre.ethers.parseEther("100")); // Mock carbon price
  await oracle.waitForDeployment();
  console.log("MockOracle deployed to:", await oracle.getAddress());

  const Stablecoin = await hre.ethers.getContractFactory("ERC20");
  const stablecoin = await Stablecoin.deploy("TestUSD", "TUSD");
  await stablecoin.waitForDeployment();
  console.log("Stablecoin deployed to:", await stablecoin.getAddress());

  // Deploy contracts
  const CarbonTrackingContract = await hre.ethers.getContractFactory("CarbonTrackingContract");
  const carbonTracking = await CarbonTrackingContract.deploy(deployer.address, await oracle.getAddress());
  await carbonTracking.waitForDeployment();
  console.log("CarbonTrackingContract deployed to:", await carbonTracking.getAddress());

  const RewardPoolContract = await hre.ethers.getContractFactory("RewardPoolContract");
  const rewardPool = await RewardPoolContract.deploy(await stablecoin.getAddress(), deployer.address, deployer.address);
  await rewardPool.waitForDeployment();
  console.log("RewardPoolContract deployed to:", await rewardPool.getAddress());

  const UserProfileContract = await hre.ethers.getContractFactory("UserProfileContract");
  const userProfile = await UserProfileContract.deploy(deployer.address);
  await userProfile.waitForDeployment();
  console.log("UserProfileContract deployed to:", await userProfile.getAddress());

  const ChallengeManagementContract = await hre.ethers.getContractFactory("ChallengeManagementContract");
  const challengeManagement = await ChallengeManagementContract.deploy(deployer.address, await carbonTracking.getAddress());
  await challengeManagement.waitForDeployment();
  console.log("ChallengeManagementContract deployed to:", await challengeManagement.getAddress());

  const SolanaAdapterContract = await hre.ethers.getContractFactory("SolanaAdapterContract");
  const solanaAdapter = await SolanaAdapterContract.deploy();
  await solanaAdapter.waitForDeployment();
  console.log("SolanaAdapterContract deployed to:", await solanaAdapter.getAddress());

  const LeaderboardContract = await hre.ethers.getContractFactory("LeaderboardContract");
  const leaderboard = await LeaderboardContract.deploy(deployer.address, await carbonTracking.getAddress());
  await leaderboard.waitForDeployment();
  console.log("LeaderboardContract deployed to:", await leaderboard.getAddress());

  const PaymentContract = await hre.ethers.getContractFactory("MutablePaymentSplitter");
  const payment = await PaymentContract.deploy([deployer.address], [100], await stablecoin.getAddress(), deployer.address);
  await payment.waitForDeployment();
  console.log("PaymentContract deployed to:", await payment.getAddress());

  const NFTRewardContract = await hre.ethers.getContractFactory("NFTRewardContract");
  const nftReward = await NFTRewardContract.deploy();
  await nftReward.waitForDeployment();
  console.log("NFTRewardContract deployed to:", await nftReward.getAddress());

  const VerificationContract = await hre.ethers.getContractFactory("VerificationContract");
  const verification = await VerificationContract.deploy(deployer.address, await oracle.getAddress());
  await verification.waitForDeployment();
  console.log("VerificationContract deployed to:", await verification.getAddress());

  const MarketplaceContract = await hre.ethers.getContractFactory("MarketplaceContract");
  const marketplace = await MarketplaceContract.deploy(deployer.address, await verification.getAddress(), await userProfile.getAddress(), await rewardPool.getAddress(), await stablecoin.getAddress());
  await marketplace.waitForDeployment();
  console.log("MarketplaceContract deployed to:", await marketplace.getAddress());

  const CarbonCreditTokenContract = await hre.ethers.getContractFactory("CarbonCreditTokenContract");
  const carbonCredit = await CarbonCreditTokenContract.deploy(deployer.address);
  await carbonCredit.waitForDeployment();
  console.log("CarbonCreditTokenContract deployed to:", await carbonCredit.getAddress());

  const OracleIntegrationContract = await hre.ethers.getContractFactory("OracleIntegrationContract");
  const jobId = hre.ethers.encodeBytes32String('jobId');
  const oracleIntegration = await OracleIntegrationContract.deploy(deployer.address, await oracle.getAddress(), jobId, hre.ethers.parseEther("0.1"));
  await oracleIntegration.waitForDeployment();
  console.log("OracleIntegrationContract deployed to:", await oracleIntegration.getAddress());

  const UserOnboardingContract = await hre.ethers.getContractFactory("UserOnboardingContract");
  const userOnboarding = await UserOnboardingContract.deploy(deployer.address);
  await userOnboarding.waitForDeployment();
  console.log("UserOnboardingContract deployed to:", await userOnboarding.getAddress());

  const IPFSStorageContract = await hre.ethers.getContractFactory("IPFSStorageContract");
  const ipfsStorage = await IPFSStorageContract.deploy(deployer.address);
  await ipfsStorage.waitForDeployment();
  console.log("IPFSStorageContract deployed to:", await ipfsStorage.getAddress());

  // Verify contracts (optional, if using a block explorer)
  // await hre.run("verify:verify", { address: await carbonTracking.getAddress(), constructorArguments: [deployer.address, await oracle.getAddress()] });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});