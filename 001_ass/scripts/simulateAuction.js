const { ethers } = require("hardhat");

async function main() {
    console.log("=== Starting NFT Auction Simulation ===");

    const [owner, seller, bidder1, bidder2] = await ethers.getSigners();

    console.log(`\nActors:
    Seller:  ${seller.address}
    Bidder1: ${bidder1.address}
    Bidder2: ${bidder2.address}`);

    // 1. Deploy Contracts
    console.log("\n--- 1. Deploying Contracts ---");
    
    const MockERC721 = await ethers.getContractFactory("MockERC721");
    const nft = await MockERC721.deploy();
    await nft.waitForDeployment();
    console.log(`MockERC721 Deployed at: ${await nft.getAddress()}`);

    const Auction = await ethers.getContractFactory("Auction");
    const auction = await Auction.deploy();
    await auction.waitForDeployment();
    console.log(`Auction Contract Deployed at: ${await auction.getAddress()}`);

    // 2. Mint NFT to Seller
    console.log("\n--- 2. Minting NFT to Seller ---");
    const mintTx = await nft.mint(seller.address);
    await mintTx.wait();
    const tokenId = 0; // First minted token is 0
    console.log(`Minted Token ID ${tokenId} to Seller. Seller balance: ${await nft.balanceOf(seller.address)}`);

    // 3. List NFT for Auction (Accepting ETH)
    console.log("\n--- 3. Listing NFT for Auction ---");
    const approveTx = await nft.connect(seller).approve(await auction.getAddress(), tokenId);
    await approveTx.wait();
    console.log("Seller approved Auction contract to hold the NFT.");

    // List item. address(0) means we accept ETH bids.
    const listTx = await auction.connect(seller).listItem(await nft.getAddress(), tokenId, ethers.ZeroAddress);
    await listTx.wait();
    const itemId = 0; // First listed item is 0
    console.log("Seller listed NFT on Auction.");
    console.log(`NFT Owner is now: ${await nft.ownerOf(tokenId)} (The Auction Contract)`);

    // 4. Bidding
    console.log("\n--- 4. Bidding Begins ---");
    
    const bid1Amount = ethers.parseEther("1");
    console.log(`Bidder 1 places bid of 1 ETH...`);
    await auction.connect(bidder1).bid(itemId, 0, { value: bid1Amount });

    const itemAfterBid1 = await auction.items(itemId);
    console.log(`Current Highest Bid: ${ethers.formatEther(itemAfterBid1.highestBid)} ETH from ${itemAfterBid1.highestBidder}`);

    const bid2Amount = ethers.parseEther("2");
    console.log(`Bidder 2 outbids with 2 ETH...`);
    await auction.connect(bidder2).bid(itemId, 0, { value: bid2Amount });

    const itemAfterBid2 = await auction.items(itemId);
    console.log(`Current Highest Bid: ${ethers.formatEther(itemAfterBid2.highestBid)} ETH from ${itemAfterBid2.highestBidder}`);

    // 5. Fast Forward Time & Finalize
    console.log("\n--- 5. Finalizing Auction ---");
    console.log("Fast-forwarding time by 5 minutes...");
    // Increase EVM time by 5 minutes and 1 second to end the auction
    await ethers.provider.send("evm_increaseTime", [5 * 60 + 1]);
    await ethers.provider.send("evm_mine");

    console.log("Seller finalizes the auction...");
    await auction.connect(seller).finalizeAuction(itemId);

    console.log(`Auction Finalized!`);
    console.log(`Winning Bidder: ${itemAfterBid2.highestBidder}`);
    
    const newOwner = await nft.ownerOf(tokenId);
    console.log(`New NFT Owner: ${newOwner} (Should be Bidder 2)`);

    console.log("\n=== Simulation Complete ===");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
