import { ethers } from "ethers";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import * as fs from "fs";

export default async function deploy(hre: HardhatRuntimeEnvironment): Promise<void> {
  try {
    console.log("Starting deployment script...");
    console.log("Network:", hre.network.name);
    console.log("Hardhat Ethers version:", hre.ethers.version);

    // Get deployer's account
    console.log("Fetching signers...");
    const [deployer, payee1, payee2] = await hre.ethers.getSigners();
    console.log("Deployer address:", await deployer.getAddress());
    console.log("Payee1 address:", await payee1.getAddress());
    console.log("Payee2 address:", await payee2.getAddress());
    console.log("Deployer balance:", ethers.formatEther(await deployer.getBalance()), "ETH");

    // Constructor parameters
    const payees: string[] = [await payee1.getAddress(), await payee2.getAddress()];
    const shares: number[] = [50, 50];
    console.log("Payees:", payees);
    console.log("Shares:", shares);

    // Deploy NFTRewardContract
    console.log("Deploying NFTRewardContract...");
    const NFTRewardContract = await hre.ethers.getContractFactory("NFTRewardContract");
    const nftReward = await NFTRewardContract.deploy();
    await nftReward.waitForDeployment();
    console.log("NFTRewardContract deployed to:", await nftReward.getAddress());

    // Deploy GovernanceContract (depends on NFTRewardContract)
    console.log("Deploying GovernanceContract...");
    const GovernanceContract = await hre.ethers.getContractFactory("GovernanceContract");
    const governance = await GovernanceContract.deploy(await nftReward.getAddress());
    await governance.waitForDeployment();
    console.log("GovernanceContract deployed to:", await governance.getAddress());

    // Deploy RewardPoolContract (depends on NFTRewardContract)
    console.log("Deploying RewardPoolContract...");
    const RewardPoolContract = await hre.ethers.getContractFactory("RewardPoolContract");
    const rewardPool = await RewardPoolContract.deploy(await nftReward.getAddress());
    await rewardPool.waitForDeployment();
    console.log("RewardPoolContract deployed to:", await rewardPool.getAddress());

    // Deploy CarbonTrackingContract
    console.log("Deploying CarbonTrackingContract...");
    const CarbonTrackingContract = await hre.ethers.getContractFactory("CarbonTrackingContract");
    const carbonTracking = await CarbonTrackingContract.deploy();
    await carbonTracking.waitForDeployment();
    console.log("CarbonTrackingContract deployed to:", await carbonTracking.getAddress());

    // Deploy LeaderboardContract (depends on CarbonTrackingContract)
    console.log("Deploying LeaderboardContract...");
    const LeaderboardContract = await hre.ethers.getContractFactory("LeaderboardContract");
    const leaderboard = await LeaderboardContract.deploy(await carbonTracking.getAddress());
    await leaderboard.waitForDeployment();
    console.log("LeaderboardContract deployed to:", await leaderboard.getAddress());

    // Deploy PaymentContract
    console.log("Deploying PaymentContract...");
    const PaymentContract = await hre.ethers.getContractFactory("PaymentContract");
    const payment = await PaymentContract.deploy(payees, shares);
    await payment.waitForDeployment();
    console.log("PaymentContract deployed to:", await payment.getAddress());

    // Deploy ChallengeManagementContract
    console.log("Deploying ChallengeManagementContract...");
    const ChallengeManagementContract = await hre.ethers.getContractFactory("ChallengeManagementContract");
    const challengeManagement = await ChallengeManagementContract.deploy();
    await challengeManagement.waitForDeployment();
    console.log("ChallengeManagementContract deployed to:", await challengeManagement.getAddress());

    // Deploy UserProfileContract
    console.log("Deploying UserProfileContract...");
    const UserProfileContract = await hre.ethers.getContractFactory("UserProfileContract");
    const userProfile = await UserProfileContract.deploy();
    await userProfile.waitForDeployment();
    console.log("UserProfileContract deployed to:", await userProfile.getAddress());

    // Deploy VerificationContract
    console.log("Deploying VerificationContract...");
    const VerificationContract = await hre.ethers.getContractFactory("VerificationContract");
    const verification = await VerificationContract.deploy();
    await verification.waitForDeployment();
    console.log("VerificationContract deployed to:", await verification.getAddress());

    // Deploy SolanaAdapterContract
    console.log("Deploying SolanaAdapterContract...");
    const SolanaAdapterContract = await hre.ethers.getContractFactory("SolanaAdapterContract");
    const solanaAdapter = await SolanaAdapterContract.deploy();
    await solanaAdapter.waitForDeployment();
    console.log("SolanaAdapterContract deployed to:", await solanaAdapter.getAddress());

    // Save deployment addresses
    const deployments = {
      NFTRewardContract: await nftReward.getAddress(),
      GovernanceContract: await governance.getAddress(),
      RewardPoolContract: await rewardPool.getAddress(),
      CarbonTrackingContract: await carbonTracking.getAddress(),
      LeaderboardContract: await leaderboard.getAddress(),
      PaymentContract: await payment.getAddress(),
      ChallengeManagementContract: await challengeManagement.getAddress(),
      UserProfileContract: await userProfile.getAddress(),
      VerificationContract: await verification.getAddress(),
      SolanaAdapterContract: await solanaAdapter.getAddress(),
      deployer: await deployer.getAddress(),
      timestamp: new Date().toISOString(),
    };
    console.log("Saving deployment addresses to deployments.json...");
    fs.writeFileSync("deployments.json", JSON.stringify(deployments, null, 2));
    console.log("Deployment addresses saved to deployments.json");

    // Verify contracts on Etherscan (for testnet/mainnet)
    if (hre.network.name !== "hardhat" && hre.network.name !== "localhost") {
      console.log("Verifying contracts on Etherscan...");
      await hre.run("verify:verify", { address: await nftReward.getAddress(), constructorArguments: [] });
      await hre.run("verify:verify", { address: await governance.getAddress(), constructorArguments: [await nftReward.getAddress()] });
      await hre.run("verify:verify", { address: await rewardPool.getAddress(), constructorArguments: [await nftReward.getAddress()] });
      await hre.run("verify:verify", { address: await carbonTracking.getAddress(), constructorArguments: [] });
      await hre.run("verify:verify", { address: await leaderboard.getAddress(), constructorArguments: [await carbonTracking.getAddress()] });
      await hre.run("verify:verify", { address: await payment.getAddress(), constructorArguments: [payees, shares] });
      await hre.run("verify:verify", { address: await challengeManagement.getAddress(), constructorArguments: [] });
      await hre.run("verify:verify", { address: await userProfile.getAddress(), constructorArguments: [] });
      await hre.run("verify:verify", { address: await verification.getAddress(), constructorArguments: [] });
      await hre.run("verify:verify", { address: await solanaAdapter.getAddress(), constructorArguments: [] });
      console.log("Etherscan verification complete.");
    }

    console.log("Deployment script completed successfully.");
  } catch (error) {
    console.error("Deployment failed with error:", error);
    throw error;
  }
}