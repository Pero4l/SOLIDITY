const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");
const { ethers } = require("hardhat");

module.exports = buildModule("AuctionModule", (m) => {
  // Define the initial supply for the mock token, defaulting to 10000 MTK
  const initialSupply = m.getParameter("initialSupply", 10000n * 10n ** 18n);

  // Deploy the Mock ERC20 Token first
  const mockToken = m.contract("MockERC20", [initialSupply]);

  // Deploy the Auction contract, passing the mock token address
  const auction = m.contract("Auction", [mockToken]);

  return { mockToken, auction };
});
