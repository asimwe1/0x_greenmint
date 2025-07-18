const hre = require("hardhat");

async function main() {
  const MockOracle = await hre.ethers.getContractFactory("MockV3Aggregator");
  const oracle = await MockOracle.deploy(18, hre.ethers.parseEther("100"));
  await oracle.waitForDeployment();
  console.log("MockOracle deployed to:", await oracle.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}); 