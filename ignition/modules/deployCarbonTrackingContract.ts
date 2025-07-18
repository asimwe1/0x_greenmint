const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  const MockOracle = await hre.ethers.getContractFactory("MockV3Aggregator");
  const oracle = await MockOracle.deploy(18, hre.ethers.parseEther("100"));
  await oracle.waitForDeployment();
  const CarbonTrackingContract = await hre.ethers.getContractFactory("CarbonTrackingContract");
  const carbonTracking = await CarbonTrackingContract.deploy(deployer.address, await oracle.getAddress());
  await carbonTracking.waitForDeployment();
  console.log("CarbonTrackingContract deployed to:", await carbonTracking.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}); 