const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  const UserProfileContract = await hre.ethers.getContractFactory("UserProfileContract");
  const userProfile = await UserProfileContract.deploy(deployer.address);
  await userProfile.waitForDeployment();
  console.log("UserProfileContract deployed to:", await userProfile.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}); 