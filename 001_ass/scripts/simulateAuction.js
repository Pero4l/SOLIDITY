const { ethers } = require("hardhat");

async function main() {
    console.log("=== Starting NFT Auction Simulation ===");

    const [owner, seller, bidder1, bidder2] = await ethers.getSigners();

    console.log(`\nActors:
    Seller:  ${seller.address}
    Bidder1: ${bidder1.address}
    Bidder2: ${bidder2.address}`);

    // 1. Deploy ERC20 Token for Bidding
    console.log("\n--- 1. Deploying Mock ERC20 ---");
    // Since we don't have a MockERC20 in contracts, we can just deploy an ERC20 from an inline factory if we wanted.
    // Or we can just simulate ETH bids, which is easier and doesn't require a mock.
    // Let's create a quick MockERC20 contract if needed, but for simplicity, let's use the Auction contract and bidETH.
    // We can deploy a simple mock token using ethers if we don't have one in the contracts folder.
    // Wait, the user might not even need the mock ERC20 if we just do ETH bids.
    // We will deploy the Auction with a random address for the token for now if we only test ETH.
    
    const MockTokenFactory = await ethers.getContractFactory("MockERC20").catch(() => null);
    let tokenAddress = ethers.ZeroAddress;
    if (MockTokenFactory) {
        const token = await MockTokenFactory.deploy();
        await token.waitForDeployment();
        tokenAddress = await token.getAddress();
        console.log(`Mock ERC20 Deployed at: ${tokenAddress}`);
    } else {
        console.log(`No MockERC20 found, using ZeroAddress for token.`);
    }

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
