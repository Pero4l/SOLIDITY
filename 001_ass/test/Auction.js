const {
  time,
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { expect } = require("chai");

describe("NFT Auction", function () {
  async function deployAuctionFixture() {
    const [owner, seller, bidder1, bidder2] = await ethers.getSigners();

    // Deploy Mock ERC20 Token
    const initialSupply = ethers.parseEther("10000");
    const MockERC20 = await ethers.getContractFactory("MockERC20");
    const token = await MockERC20.deploy(initialSupply);

    // Deploy Mock ERC721 Token
    const MockERC721 = await ethers.getContractFactory("MockERC721");
    const nft = await MockERC721.deploy();

    // Deploy Auction contract
    const Auction = await ethers.getContractFactory("Auction");
    const auction = await Auction.deploy();

    // Setup: Give some ERC20 tokens to bidders
    await token.transfer(bidder1.address, ethers.parseEther("1000"));
    await token.transfer(bidder2.address, ethers.parseEther("1000"));

    // Setup: Mint 2 NFTs to seller
    await nft.mint(seller.address); // Token ID 0
    await nft.mint(seller.address); // Token ID 1

    return { auction, token, nft, owner, seller, bidder1, bidder2 };
  }

  describe("Listing Items", function () {
    it("Should allow listing an NFT", async function () {
      const { auction, nft, seller } = await loadFixture(deployAuctionFixture);

      // Seller must approve the auction contract to take their NFT
      await nft.connect(seller).approve(await auction.getAddress(), 0);

      // List it accepting ETH (address(0))
      await expect(
        auction.connect(seller).listItem(await nft.getAddress(), 0, ethers.ZeroAddress)
      ).to.emit(auction, "ItemListed");

      // Verify the NFT is now in the auction contract
      expect(await nft.ownerOf(0)).to.equal(await auction.getAddress());

      const item = await auction.items(0);
      expect(item.nftContract).to.equal(await nft.getAddress());
      expect(item.tokenId).to.equal(0);
      expect(item.acceptedToken).to.equal(ethers.ZeroAddress);
      expect(item.seller).to.equal(seller.address);
    });
  });

  describe("Bidding", function () {
    it("Should accept ETH bids for ETH auctions", async function () {
      const { auction, nft, seller, bidder1, bidder2 } = await loadFixture(deployAuctionFixture);

      await nft.connect(seller).approve(await auction.getAddress(), 0);
      await auction.connect(seller).listItem(await nft.getAddress(), 0, ethers.ZeroAddress);

      // Bidder 1 bids 1 ETH
      await expect(auction.connect(bidder1).bid(0, 0, { value: ethers.parseEther("1") }))
        .to.emit(auction, "NewBid")
        .withArgs(0, bidder1.address, ethers.parseEther("1"));

      // Bidder 2 bids 2 ETH, Bidder 1 is refunded
      const bidder1BalBefore = await ethers.provider.getBalance(bidder1.address);
      await expect(auction.connect(bidder2).bid(0, 0, { value: ethers.parseEther("2") }))
        .to.emit(auction, "NewBid");
      const bidder1BalAfter = await ethers.provider.getBalance(bidder1.address);
      
      expect(bidder1BalAfter - bidder1BalBefore).to.equal(ethers.parseEther("1"));
    });

    it("Should accept ERC20 bids for ERC20 auctions", async function () {
      const { auction, token, nft, seller, bidder1, bidder2 } = await loadFixture(deployAuctionFixture);

      await nft.connect(seller).approve(await auction.getAddress(), 1);
      await auction.connect(seller).listItem(await nft.getAddress(), 1, await token.getAddress());

      const bid1 = ethers.parseEther("100");
      const bid2 = ethers.parseEther("200");

      // Bidder 1 approves and bids
      await token.connect(bidder1).approve(await auction.getAddress(), bid1);
      await expect(auction.connect(bidder1).bid(0, bid1))
        .to.emit(auction, "NewBid")
        .withArgs(0, bidder1.address, bid1);

      // Bidder 2 approves and bids, bidder 1 gets refund
      await token.connect(bidder2).approve(await auction.getAddress(), bid2);
      
      const b1TokenBefore = await token.balanceOf(bidder1.address);
      await expect(auction.connect(bidder2).bid(0, bid2))
        .to.emit(auction, "NewBid");
      const b1TokenAfter = await token.balanceOf(bidder1.address);

      expect(b1TokenAfter - b1TokenBefore).to.equal(bid1);
    });
  });

  describe("Finalizing", function () {
    it("Should transfer NFT to winner and ETH to seller", async function () {
      const { auction, nft, seller, bidder1 } = await loadFixture(deployAuctionFixture);

      await nft.connect(seller).approve(await auction.getAddress(), 0);
      await auction.connect(seller).listItem(await nft.getAddress(), 0, ethers.ZeroAddress);

      await auction.connect(bidder1).bid(0, 0, { value: ethers.parseEther("1") });

      await time.increase(5 * 60 + 1); // Fast forward past duration

      const sellerBalBefore = await ethers.provider.getBalance(seller.address);
      await expect(auction.connect(seller).finalizeAuction(0))
        .to.emit(auction, "AuctionEnded")
        .withArgs(0, bidder1.address, ethers.parseEther("1"));
      
      // Verify NFT ownership changed to bidder
      expect(await nft.ownerOf(0)).to.equal(bidder1.address);
    });

    it("Should return NFT to seller if no bids", async function () {
      const { auction, nft, seller } = await loadFixture(deployAuctionFixture);

      await nft.connect(seller).approve(await auction.getAddress(), 0);
      await auction.connect(seller).listItem(await nft.getAddress(), 0, ethers.ZeroAddress);

      await time.increase(5 * 60 + 1);

      await auction.connect(seller).finalizeAuction(0);

      // Verify NFT ownership reverted to seller
      expect(await nft.ownerOf(0)).to.equal(seller.address);
    });
  });
});
