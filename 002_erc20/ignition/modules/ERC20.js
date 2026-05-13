const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

module.exports = buildModule("ERC20Module", (m) => {
  // Deploy the MyEducationalToken contract
  const token = m.contract("MyEducationalToken");

  return { token };
});
