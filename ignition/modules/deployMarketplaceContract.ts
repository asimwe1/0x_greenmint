const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  const Stablecoin = await hre.ethers.getContractFactory("ERC20");
  const stablecoin = await Stablecoin.deploy("TestUSD", "TUSD");
  await stablecoin.waitForDeployment();
  const RewardPoolContract = await hre.ethers.getContractFactory("RewardPoolContract");
  const rewardPool = await RewardPoolContract.deploy(await stablecoin.getAddress(), deployer.address, deployer.address);
  await rewardPool.waitForDeployment();
  const UserProfileContract = await hre.ethers.getContractFactory("UserProfileContract");
  const userProfile = await UserProfileContract.deploy(deployer.address);
  await userProfile.waitForDeployment();
  const MockOracle = await hre.ethers.getContractFactory("MockV3Aggregator");
  const oracle = await MockOracle.deploy(18, hre.ethers.parseEther("100"));
  await oracle.waitForDeployment();
  const VerificationContract = await hre.ethers.getContractFactory("VerificationContract");
  const verification = await VerificationContract.deploy(deployer.address, await oracle.getAddress());
  await verification.waitForDeployment();
  const MarketplaceContract = await hre.ethers.getContractFactory("MarketplaceContract");
  const marketplace = await MarketplaceContract.deploy(deployer.address, await verification.getAddress(), await userProfile.getAddress(), await rewardPool.getAddress(), await stablecoin.getAddress());
  await marketplace.waitForDeployment();
  console.log("MarketplaceContract deployed to:", await marketplace.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}); 