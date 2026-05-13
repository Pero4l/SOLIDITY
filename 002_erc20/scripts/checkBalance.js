const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Checking balances for account:", deployer.address);

  const tokenAddress = "0x1F1c1a7683cba45770F4a80f9E28cF70DA6b446D";
  const MyEducationalToken = await hre.ethers.getContractFactory("MyEducationalToken");
  const token = MyEducationalToken.attach(tokenAddress);

  const balance = await token.balanceOf(deployer.address);
  console.log("MET Balance:", hre.ethers.formatUnits(balance, 18));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
