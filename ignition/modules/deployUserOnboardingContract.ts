const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  const UserOnboardingContract = await hre.ethers.getContractFactory("UserOnboardingContract");
  const userOnboarding = await UserOnboardingContract.deploy(deployer.address);
  await userOnboarding.waitForDeployment();
  console.log("UserOnboardingContract deployed to:", await userOnboarding.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}); 