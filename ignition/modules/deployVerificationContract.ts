const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  const MockOracle = await hre.ethers.getContractFactory("MockV3Aggregator");
  const oracle = await MockOracle.deploy(18, hre.ethers.parseEther("100"));
  await oracle.waitForDeployment();
  const VerificationContract = await hre.ethers.getContractFactory("VerificationContract");
  const verification = await VerificationContract.deploy(deployer.address, await oracle.getAddress());
  await verification.waitForDeployment();
  console.log("VerificationContract deployed to:", await verification.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}); 