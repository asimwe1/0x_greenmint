const hre = require("hardhat");

async function main() {
  const NFTRewardContract = await hre.ethers.getContractFactory("NFTRewardContract");
  const nftReward = await NFTRewardContract.deploy();
  await nftReward.waitForDeployment();
  console.log("NFTRewardContract deployed to:", await nftReward.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}); 