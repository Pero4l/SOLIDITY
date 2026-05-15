const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  // Deploy Nova Token
  const NovaToken = await ethers.getContractFactory("NOVATOKEN");
  const novaToken = await NovaToken.deploy();
  await novaToken.waitForDeployment();
  const novaTokenAddress = await novaToken.getAddress();
  console.log("NOVATOKEN deployed to:", novaTokenAddress);

  // Deploy Nova Receipt
  const NovaReceipt = await ethers.getContractFactory("NovaReceipt");
  const novaReceipt = await NovaReceipt.deploy();
  await novaReceipt.waitForDeployment();
  const novaReceiptAddress = await novaReceipt.getAddress();
  console.log("NovaReceipt deployed to:", novaReceiptAddress);

  // Deploy Nova Staff
  const NovaStaff = await ethers.getContractFactory("NovaStaff");
  const novaStaff = await NovaStaff.deploy();
  await novaStaff.waitForDeployment();
  const novaStaffAddress = await novaStaff.getAddress();
  console.log("NovaStaff deployed to:", novaStaffAddress);

  // Deploy Nova Student
  const NovaStudent = await ethers.getContractFactory("NovaStudent");
  const novaStudent = await NovaStudent.deploy();
  await novaStudent.waitForDeployment();
  const novaStudentAddress = await novaStudent.getAddress();
  console.log("NovaStudent deployed to:", novaStudentAddress);

  // Set Contracts
  console.log("Setting up contract links...");
  const tx1 = await novaStudent.setContracts(novaTokenAddress, novaReceiptAddress, novaStaffAddress);
  await tx1.wait();

  // Set school contract in Receipt so student contract can mint
  const tx2 = await novaReceipt.setSchoolContract(novaStudentAddress);
  await tx2.wait();

  console.log("Deployment and configuration complete!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
