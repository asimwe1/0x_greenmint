import hre from "hardhat";
import { Stablecoin } from "../typechain-types";

async function main() {
  const [deployer] = await hre.ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);

  // Deploy contracts
  const RewardPoolContract = await hre.ethers.getContractFactory("RewardPoolContract");
  const rewardPool = await RewardPoolContract.deploy(await stablecoin.getAddress(), deployer.address, deployer.address);
  await rewardPool.waitForDeployment();
  console.log("RewardPoolContract deployed to:", await rewardPool.getAddress());

 }

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});