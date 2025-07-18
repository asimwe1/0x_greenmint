const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  const CarbonCreditTokenContract = await hre.ethers.getContractFactory("CarbonCreditTokenContract");
  const carbonCredit = await CarbonCreditTokenContract.deploy(deployer.address);
  await carbonCredit.waitForDeployment();
  console.log("CarbonCreditTokenContract deployed to:", await carbonCredit.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}); 