const hre = require("hardhat");

async function main() {
  const Stablecoin = await hre.ethers.getContractFactory("ERC20");
  const stablecoin = await Stablecoin.deploy("TestUSD", "TUSD");
  await stablecoin.waitForDeployment();
  console.log("Stablecoin deployed to:", await stablecoin.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}); 