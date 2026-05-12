// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract Auction is ERC721 {
    uint256 constant DURATION = 5 minutes;

    struct Item {
        string name;
        address seller;
        address highestBidder;
        uint256 highestBid;
        bool isERC20Bid;
        uint256 endTime;
        bool ended;
    }

    IERC20 public immutable token;
    Item[] public items;

    event ItemListed(
        uint256 indexed itemId,
        string name,
        address indexed seller
    );

    event NewBid(
        uint256 indexed itemId,
        address indexed bidder,
        uint256 amount,
        bool isERC20
    );

    event AuctionEnded(
        uint256 indexed itemId,
        address winner,
        uint256 amount
    );

    constructor(address _token) ERC721("Auction Item", "AUC") {
        token = IERC20(_token);
    }

    function listItem(string calldata _name) external {
        uint256 itemId = items.length;

        // Turn the listed item into an NFT owned by the contract during the auction
        _mint(address(this), itemId);

        items.push(
            Item({
                name: _name,
                seller: msg.sender,
                highestBidder: address(0),
                highestBid: 0,
                isERC20Bid: false,
                endTime: block.timestamp + DURATION,
                ended: false
            })
        );

        emit ItemListed(
            itemId,
            _name,
            msg.sender
        );
    }

    function bidETH(uint256 _itemId) external payable {
        Item storage item = items[_itemId];

        require(!item.ended, "Auction ended");
        require(block.timestamp < item.endTime, "Time over");
        require(msg.value > item.highestBid, "Low bid");

        if (item.highestBidder != address(0)) {
            if (item.isERC20Bid) {
                bool refundSuccess = token.transfer(item.highestBidder, item.highestBid);
                require(refundSuccess, "ERC20 Refund failed");
            } else {
                (bool refundSuccess, ) = payable(item.highestBidder).call{value: item.highestBid}("");
                require(refundSuccess, "ETH Refund failed");
            }
        }

        item.highestBidder = msg.sender;
        item.highestBid = msg.value;
        item.isERC20Bid = false;

        emit NewBid(_itemId, msg.sender, msg.value, false);
    }

    function bidERC20(uint256 _itemId, uint256 _amount) external {
        Item storage item = items[_itemId];

        require(!item.ended, "Auction ended");
        require(block.timestamp < item.endTime, "Time over");
        require(_amount > item.highestBid, "Low bid");

        // take token from bidder
        bool success = token.transferFrom(msg.sender, address(this), _amount);
        require(success, "Transfer failed");

        // refund previous bidder
        if (item.highestBidder != address(0)) {
            if (item.isERC20Bid) {
                bool refundSuccess = token.transfer(item.highestBidder, item.highestBid);
                require(refundSuccess, "ERC20 Refund failed");
            } else {
                (bool refundSuccess, ) = payable(item.highestBidder).call{value: item.highestBid}("");
                require(refundSuccess, "ETH Refund failed");
            }
        }

        item.highestBidder = msg.sender;
        item.highestBid = _amount;
        item.isERC20Bid = true;

        emit NewBid(_itemId, msg.sender, _amount, true);
    }

    function finalizeAuction(uint256 _itemId) external {
        Item storage item = items[_itemId];

        require(!item.ended, "Already ended");
        require(block.timestamp >= item.endTime, "Auction still active");

        item.ended = true;

        if (item.highestBid > 0 && item.highestBidder != address(0)) {
            // Transfer payment to seller
            if (item.isERC20Bid) {
                bool success = token.transfer(item.seller, item.highestBid);
                require(success, "Payment failed");
            } else {
                (bool success, ) = payable(item.seller).call{value: item.highestBid}("");
                require(success, "Payment failed");
            }

            // Transfer NFT to winner
            _transfer(address(this), item.highestBidder, _itemId);

        } else {
            // No bids, return NFT to seller
            _transfer(address(this), item.seller, _itemId);
        }

        emit AuctionEnded(_itemId, item.highestBidder, item.highestBid);
    }

    function getAllItems() external view returns (Item[] memory) {
        return items;
    }

    function getWinner(uint256 _itemId) external view returns (address) {
        return items[_itemId].highestBidder;
    }

    function totalItems() external view returns (uint256) {
        return items.length;
    }
}