const {
  time,
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { expect } = require("chai");

describe("Auction", function () {
  async function deployAuctionFixture() {
    const [owner, seller, bidder1, bidder2] = await ethers.getSigners();

    // Deploy Mock ERC20 Token
    const initialSupply = ethers.parseEther("10000");
    const MockERC20 = await ethers.getContractFactory("MockERC20");
    const token = await MockERC20.deploy(initialSupply);

    // Deploy Auction contract
    const Auction = await ethers.getContractFactory("Auction");
    const auction = await Auction.deploy(await token.getAddress());

    // Give some tokens to bidders
    await token.transfer(bidder1.address, ethers.parseEther("1000"));
    await token.transfer(bidder2.address, ethers.parseEther("1000"));

    return { auction, token, owner, seller, bidder1, bidder2 };
  }

  describe("Deployment", function () {
    it("Should set the right token address", async function () {
      const { auction, token } = await loadFixture(deployAuctionFixture);
      expect(await auction.token()).to.equal(await token.getAddress());
    });
  });

  describe("Listing Items", function () {
    it("Should allow listing an item", async function () {
      const { auction, seller } = await loadFixture(deployAuctionFixture);

      await expect(auction.connect(seller).listItem("Vintage Watch"))
        .to.emit(auction, "ItemListed")
        .withArgs(0, "Vintage Watch", seller.address);

      const item = await auction.items(0);
      expect(item.name).to.equal("Vintage Watch");
      expect(item.seller).to.equal(seller.address);
      expect(item.highestBidder).to.equal(ethers.ZeroAddress);
      expect(item.highestBid).to.equal(0);
      expect(item.ended).to.be.false;
    });
  });

  describe("Bidding with ETH", function () {
    it("Should accept ETH bids and refund previous bidder", async function () {
      const { auction, seller, bidder1, bidder2 } = await loadFixture(deployAuctionFixture);

      await auction.connect(seller).listItem("Car");

      // Bidder 1 bids 1 ETH
      await expect(auction.connect(bidder1).bidETH(0, { value: ethers.parseEther("1") }))
        .to.emit(auction, "NewBid")
        .withArgs(0, bidder1.address, ethers.parseEther("1"));

      // Bidder 2 bids 2 ETH
      const bidder1BalanceBefore = await ethers.provider.getBalance(bidder1.address);
      await expect(auction.connect(bidder2).bidETH(0, { value: ethers.parseEther("2") }))
        .to.emit(auction, "NewBid")
        .withArgs(0, bidder2.address, ethers.parseEther("2"));

      // Bidder 1 should receive their 1 ETH back
      const bidder1BalanceAfter = await ethers.provider.getBalance(bidder1.address);
      expect(bidder1BalanceAfter - bidder1BalanceBefore).to.equal(ethers.parseEther("1"));
    });

    it("Should reject low bids", async function () {
      const { auction, seller, bidder1 } = await loadFixture(deployAuctionFixture);
      await auction.connect(seller).listItem("Car");
      await auction.connect(bidder1).bidETH(0, { value: ethers.parseEther("1") });

      await expect(
        auction.connect(bidder1).bidETH(0, { value: ethers.parseEther("0.5") })
      ).to.be.revertedWith("Low bid");
    });
  });

  describe("Bidding with ERC20", function () {
    it("Should accept ERC20 bids and refund previous bidder", async function () {
      const { auction, token, seller, bidder1, bidder2 } = await loadFixture(deployAuctionFixture);

      await auction.connect(seller).listItem("Laptop");

      const bidAmount1 = ethers.parseEther("100");
      const bidAmount2 = ethers.parseEther("200");

      // Bidder 1 approves and bids
      await token.connect(bidder1).approve(await auction.getAddress(), bidAmount1);
      await expect(auction.connect(bidder1).bidERC20(0, bidAmount1))
        .to.emit(auction, "NewBid")
        .withArgs(0, bidder1.address, bidAmount1);

      // Bidder 2 approves and bids
      await token.connect(bidder2).approve(await auction.getAddress(), bidAmount2);
      
      const bidder1TokenBefore = await token.balanceOf(bidder1.address);
      await expect(auction.connect(bidder2).bidERC20(0, bidAmount2))
        .to.emit(auction, "NewBid")
        .withArgs(0, bidder2.address, bidAmount2);

      // Bidder 1 should receive their tokens back
      const bidder1TokenAfter = await token.balanceOf(bidder1.address);
      expect(bidder1TokenAfter - bidder1TokenBefore).to.equal(bidAmount1);
    });
  });

  describe("Finalizing Auction", function () {
    it("Should not finalize before end time", async function () {
      const { auction, seller } = await loadFixture(deployAuctionFixture);
      await auction.connect(seller).listItem("Phone");
      
      await expect(auction.connect(seller).finalizeAuction(0))
        .to.be.revertedWith("Auction still active");
    });

    it("Should finalize and transfer ETH to seller", async function () {
      const { auction, seller, bidder1 } = await loadFixture(deployAuctionFixture);
      await auction.connect(seller).listItem("Phone");
      
      await auction.connect(bidder1).bidETH(0, { value: ethers.parseEther("1") });

      // Fast forward time
      await time.increase(5 * 60 + 1); // 5 minutes + 1 second

      const sellerBalanceBefore = await ethers.provider.getBalance(seller.address);
      
      await expect(auction.connect(seller).finalizeAuction(0))
        .to.emit(auction, "AuctionEnded")
        .withArgs(0, bidder1.address, ethers.parseEther("1"));

      const sellerBalanceAfter = await ethers.provider.getBalance(seller.address);
      
      // Seller should receive the bid amount (ignoring gas costs since caller could be anyone)
      // Here seller is calling finalize, so they pay gas. We check approximately or have someone else call.
      // Let's have bidder1 call it to avoid gas deduction from seller.
    });

    it("Finalize from another account to check seller exact balance", async function () {
        const { auction, seller, bidder1, bidder2 } = await loadFixture(deployAuctionFixture);
        await auction.connect(seller).listItem("Phone");
        await auction.connect(bidder1).bidETH(0, { value: ethers.parseEther("1") });
        await time.increase(5 * 60 + 1);

        const sellerBalanceBefore = await ethers.provider.getBalance(seller.address);
        await auction.connect(bidder2).finalizeAuction(0); // bidder2 pays gas
        const sellerBalanceAfter = await ethers.provider.getBalance(seller.address);

        expect(sellerBalanceAfter - sellerBalanceBefore).to.equal(ethers.parseEther("1"));
    });
  });
});
