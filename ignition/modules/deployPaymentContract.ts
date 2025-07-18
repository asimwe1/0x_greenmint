const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  const Stablecoin = await hre.ethers.getContractFactory("ERC20");
  const stablecoin = await Stablecoin.deploy("TestUSD", "TUSD");
  await stablecoin.waitForDeployment();
  const PaymentContract = await hre.ethers.getContractFactory("MutablePaymentSplitter");
  const payment = await PaymentContract.deploy([deployer.address], [100], await stablecoin.getAddress(), deployer.address);
  await payment.waitForDeployment();
  console.log("PaymentContract deployed to:", await payment.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}); 