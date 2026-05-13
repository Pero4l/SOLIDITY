const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("MyEducationalToken", function () {
  let Token;
  let token;
  let owner;
  let addr1;
  let addr2;

  beforeEach(async function () {
    // Get the ContractFactory and Signers
    Token = await ethers.getContractFactory("MyEducationalToken");
    [owner, addr1, addr2] = await ethers.getSigners();

    // Deploy the contract (the constructor takes no arguments based on your update)
    token = await Token.deploy();
  });

  describe("Deployment", function () {
    it("Should set the right owner balance", async function () {
      const ownerBalance = await token.balanceOf(owner.address);
      expect(await token.totalSupply()).to.equal(ownerBalance);
    });

    it("Should have the correct name and symbol", async function () {
      expect(await token.name()).to.equal("My Educational Token");
      expect(await token.symbol()).to.equal("MET");
    });
  });

  describe("Transactions", function () {
    it("Should transfer tokens between accounts", async function () {
      // Transfer 50 tokens from owner to addr1
      // We parse the units based on 18 decimals
      const amount = ethers.parseUnits("50", 18);
      await token.transfer(addr1.address, amount);
      const addr1Balance = await token.balanceOf(addr1.address);
      expect(addr1Balance).to.equal(amount);

      // Transfer 50 tokens from addr1 to addr2
      await token.connect(addr1).transfer(addr2.address, amount);
      const addr2Balance = await token.balanceOf(addr2.address);
      expect(addr2Balance).to.equal(amount);
    });

    it("Should fail if sender doesn't have enough tokens", async function () {
      const initialOwnerBalance = await token.balanceOf(owner.address);

      // Try to send 1 token from addr1 (0 balance) to owner.
      // `require` will evaluate false and revert the transaction.
      await expect(
        token.connect(addr1).transfer(owner.address, 1)
      ).to.be.revertedWith("Insufficient balance");

      // Owner balance shouldn't have changed.
      expect(await token.balanceOf(owner.address)).to.equal(
        initialOwnerBalance
      );
    });
  });
});
