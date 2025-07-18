const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  const MockOracle = await hre.ethers.getContractFactory("MockV3Aggregator");
  const oracle = await MockOracle.deploy(18, hre.ethers.parseEther("100"));
  await oracle.waitForDeployment();
  const OracleIntegrationContract = await hre.ethers.getContractFactory("OracleIntegrationContract");
  const jobId = hre.ethers.encodeBytes32String('jobId');
  const oracleIntegration = await OracleIntegrationContract.deploy(deployer.address, await oracle.getAddress(), jobId, hre.ethers.parseEther("0.1"));
  await oracleIntegration.waitForDeployment();
  console.log("OracleIntegrationContract deployed to:", await oracleIntegration.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}); 