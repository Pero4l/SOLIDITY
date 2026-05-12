// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";

contract Auction is IERC721Receiver {
    uint256 constant DURATION = 5 minutes;

    struct Item {
        address nftContract;
        uint256 tokenId;
        address acceptedToken; // address(0) for ETH
        address seller;
        address highestBidder;
        uint256 highestBid;
        uint256 endTime;
        bool ended;
    }

    Item[] public items;

    event ItemListed(
        uint256 indexed itemId,
        address indexed nftContract,
        uint256 indexed tokenId,
        address acceptedToken,
        address seller
    );

    event NewBid(
        uint256 indexed itemId,
        address indexed bidder,
        uint256 amount
    );

    event AuctionEnded(
        uint256 indexed itemId,
        address winner,
        uint256 amount
    );

    constructor() {}

    // -------------------------------------------------
    // LIST ITEM
    // -------------------------------------------------

    function listItem(
        address _nftContract,
        uint256 _tokenId,
        address _acceptedToken
    ) external {
        // Transfer the NFT from the seller to the auction contract
        // The seller must have approved this contract first
        IERC721(_nftContract).safeTransferFrom(msg.sender, address(this), _tokenId);

        items.push(
            Item({
                nftContract: _nftContract,
                tokenId: _tokenId,
                acceptedToken: _acceptedToken,
                seller: msg.sender,
                highestBidder: address(0),
                highestBid: 0,
                endTime: block.timestamp + DURATION,
                ended: false
            })
        );

        emit ItemListed(
            items.length - 1,
            _nftContract,
            _tokenId,
            _acceptedToken,
            msg.sender
        );
    }

    // -------------------------------------------------
    // BID
    // -------------------------------------------------

    function bid(uint256 _itemId, uint256 _amount) external payable {
        Item storage item = items[_itemId];

        require(!item.ended, "Auction ended");
        require(block.timestamp < item.endTime, "Time over");

        bool isETH = item.acceptedToken == address(0);
        
        uint256 actualBidAmount = isETH ? msg.value : _amount;

        require(actualBidAmount > item.highestBid, "Low bid");

        if (isETH) {
            require(msg.value == actualBidAmount, "Incorrect ETH sent");
        } else {
            require(msg.value == 0, "Do not send ETH for ERC20 auction");
            // Transfer tokens from bidder to the contract
            bool success = IERC20(item.acceptedToken).transferFrom(
                msg.sender,
                address(this),
                actualBidAmount
            );
            require(success, "Token transfer failed");
        }

        // Refund previous bidder
        if (item.highestBidder != address(0)) {
            if (isETH) {
                (bool refundSuccess, ) = payable(item.highestBidder).call{value: item.highestBid}("");
                require(refundSuccess, "ETH Refund failed");
            } else {
                bool refundSuccess = IERC20(item.acceptedToken).transfer(
                    item.highestBidder,
                    item.highestBid
                );
                require(refundSuccess, "ERC20 Refund failed");
            }
        }

        item.highestBidder = msg.sender;
        item.highestBid = actualBidAmount;

        emit NewBid(_itemId, msg.sender, actualBidAmount);
    }

    // -------------------------------------------------
    // FINALIZE AUCTION
    // -------------------------------------------------

    function finalizeAuction(uint256 _itemId) external {
        Item storage item = items[_itemId];

        require(!item.ended, "Already ended");
        require(block.timestamp >= item.endTime, "Auction still active");

        item.ended = true;

        if (item.highestBidder != address(0)) {
            // There was a winner
            // Send payment to seller
            if (item.acceptedToken == address(0)) {
                (bool success, ) = payable(item.seller).call{value: item.highestBid}("");
                require(success, "ETH Payment failed");
            } else {
                bool success = IERC20(item.acceptedToken).transfer(
                    item.seller,
                    item.highestBid
                );
                require(success, "ERC20 Payment failed");
            }

            // Send NFT to winner
            IERC721(item.nftContract).safeTransferFrom(
                address(this),
                item.highestBidder,
                item.tokenId
            );

            emit AuctionEnded(_itemId, item.highestBidder, item.highestBid);
        } else {
            // No bids, return NFT to seller
            IERC721(item.nftContract).safeTransferFrom(
                address(this),
                item.seller,
                item.tokenId
            );
            
            emit AuctionEnded(_itemId, address(0), 0);
        }
    }

    // -------------------------------------------------
    // VIEW FUNCTIONS
    // -------------------------------------------------

    function getAllItems() external view returns (Item[] memory) {
        return items;
    }

    function getWinner(uint256 _itemId) external view returns (address) {
        return items[_itemId].highestBidder;
    }

    function totalItems() external view returns (uint256) {
        return items.length;
    }

    // Needed to receive NFTs safely
    function onERC721Received(
        address operator,
        address from,
        uint256 tokenId,
        bytes calldata data
    ) external override returns (bytes4) {
        return this.onERC721Received.selector;
    }
}