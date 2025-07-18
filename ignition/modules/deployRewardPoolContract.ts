const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  const Stablecoin = await hre.ethers.getContractFactory("ERC20");
  const stablecoin = await Stablecoin.deploy("TestUSD", "TUSD");
  await stablecoin.waitForDeployment();
  const RewardPoolContract = await hre.ethers.getContractFactory("RewardPoolContract");
  const rewardPool = await RewardPoolContract.deploy(await stablecoin.getAddress(), deployer.address, deployer.address);
  await rewardPool.waitForDeployment();
  console.log("RewardPoolContract deployed to:", await rewardPool.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}); 