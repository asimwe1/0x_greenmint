const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  const IPFSStorageContract = await hre.ethers.getContractFactory("IPFSStorageContract");
  const ipfsStorage = await IPFSStorageContract.deploy(deployer.address);
  await ipfsStorage.waitForDeployment();
  console.log("IPFSStorageContract deployed to:", await ipfsStorage.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}); 