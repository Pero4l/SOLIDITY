const { ethers } = require("hardhat");

async function main() {
    console.log("=== Starting NFT Auction Simulation ===");

    const [owner, seller, bidder1, bidder2] = await ethers.getSigners();

    console.log(`\nActors:
    Seller:  ${seller.address}
    Bidder1: ${bidder1.address}
    Bidder2: ${bidder2.address}`);

    // 1. Setup Token Address (Using ZeroAddress for simplicity since we only test ETH bids here)
    console.log("\n--- 1. Setting up ERC20 Token Address ---");
    const tokenAddress = ethers.ZeroAddress;
    console.log(`Using ZeroAddress for ERC20 Token.`);

    // 2. Deploy Auction Contract
    console.log("\n--- 2. Deploying Auction Contract ---");
    const Auction = await ethers.getContractFactory("Auction");
    const auction = await Auction.deploy(tokenAddress);
    await auction.waitForDeployment();
    console.log(`Auction Contract Deployed at: ${await auction.getAddress()}`);

    // 3. List Item (Mints NFT)
    console.log("\n--- 3. Listing Item ---");
    const itemName = "Legendary Sword";
    const listTx = await auction.connect(seller).listItem(itemName);
    await listTx.wait();
    const itemId = 0; // First listed item is 0
    console.log(`Seller listed item "${itemName}". The Auction contract minted it as NFT ID ${itemId}.`);
    console.log(`NFT Owner is now: ${await auction.ownerOf(itemId)} (The Auction Contract itself)`);

    // 4. Bidding
    console.log("\n--- 4. Bidding Begins ---");
    
    const bid1Amount = ethers.parseEther("1");
    console.log(`Bidder 1 places bid of 1 ETH...`);
    await auction.connect(bidder1).bidETH(itemId, { value: bid1Amount });

    const itemAfterBid1 = await auction.items(itemId);
    console.log(`Current Highest Bid: ${ethers.formatEther(itemAfterBid1.highestBid)} ETH from ${itemAfterBid1.highestBidder}`);

    const bid2Amount = ethers.parseEther("2");
    console.log(`Bidder 2 outbids with 2 ETH...`);
    await auction.connect(bidder2).bidETH(itemId, { value: bid2Amount });

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
    
    const newOwner = await auction.ownerOf(itemId);
    console.log(`New NFT Owner: ${newOwner} (Should be Bidder 2)`);

    console.log("\n=== Simulation Complete ===");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
