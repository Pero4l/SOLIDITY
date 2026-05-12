// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface IERC20 {
    function transferFrom(
        address from,
        address to,
        uint256 amount
    ) external returns (bool);

    function transfer(
        address to,
        uint256 amount
    ) external returns (bool);
}

contract Auction {

    uint256 constant DURATION = 5 minutes;

    struct Item {
        string name;
        address seller;
        address highestBidder;
        uint256 highestBid;
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
        uint256 amount
    );

    event AuctionEnded(
        uint256 indexed itemId,
        address winner,
        uint256 amount
    );

    constructor(address _token) {
        token = IERC20(_token);
    }

   

    function listItem(string calldata _name) external {

        items.push(
            Item({
                name: _name,
                seller: msg.sender,
                highestBidder: address(0),
                highestBid: 0,
                endTime: block.timestamp + DURATION,
                ended: false
            })
        );

        emit ItemListed(
            items.length - 1,
            _name,
            msg.sender
        );
    }

  
    function bidETH(uint256 _itemId) external payable {

        Item storage item = items[_itemId];

        require(!item.ended, "Auction ended");

        require(
            block.timestamp < item.endTime,
            "Time over"
        );

        require(
            msg.value > item.highestBid,
            "Low bid"
        );

        
        if (item.highestBidder != address(0)) {

            (bool success, ) = payable(
                item.highestBidder
            ).call{value: item.highestBid}("");

            require(success, "Refund failed");
        }

        item.highestBidder = msg.sender;
        item.highestBid = msg.value;

        emit NewBid(
            _itemId,
            msg.sender,
            msg.value
        );
    }


    function bidERC20(
        uint256 _itemId,
        uint256 _amount
    ) external {

        Item storage item = items[_itemId];

        require(!item.ended, "Auction ended");

        require(
            block.timestamp < item.endTime,
            "Time over"
        );

        require(
            _amount > item.highestBid,
            "Low bid"
        );

        // take token from bidder
        bool success = token.transferFrom(
            msg.sender,
            address(this),
            _amount
        );

        require(success, "Transfer failed");

        // refund previous bidder
        if (item.highestBidder != address(0)) {

            token.transfer(
                item.highestBidder,
                item.highestBid
            );
        }

        item.highestBidder = msg.sender;
        item.highestBid = _amount;

        emit NewBid(
            _itemId,
            msg.sender,
            _amount
        );
    }


    function finalizeAuction(uint256 _itemId) external {

        Item storage item = items[_itemId];

        require(!item.ended, "Already ended");

        require(
            block.timestamp >= item.endTime,
            "Auction still active"
        );

        item.ended = true;

        
        if (item.highestBid > 0) {

            (bool success, ) = payable(
                item.seller
            ).call{value: item.highestBid}("");

            require(success, "Payment failed");
        }

        emit AuctionEnded(
            _itemId,
            item.highestBidder,
            item.highestBid
        );
    }


    function getAllItems()
        external
        view
        returns (Item[] memory)
    {
        return items;
    }

    function getWinner(
        uint256 _itemId
    )
        external
        view
        returns (address)
    {
        return items[_itemId].highestBidder;
    }

    function totalItems()
        external
        view
        returns (uint256)
    {
        return items.length;
    }
}