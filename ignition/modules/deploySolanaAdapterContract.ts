const hre = require("hardhat");

async function main() {
  const SolanaAdapterContract = await hre.ethers.getContractFactory("SolanaAdapterContract");
  const solanaAdapter = await SolanaAdapterContract.deploy();
  await solanaAdapter.waitForDeployment();
  console.log("SolanaAdapterContract deployed to:", await solanaAdapter.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}); 