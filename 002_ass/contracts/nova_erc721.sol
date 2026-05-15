// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract NovaReceipt {
    string public name = "Nova Receipt NFT";
    string public symbol = "NRPT";
    uint256 public nextTokenId;
    
    address public schoolContract;

    mapping(uint256 => address) private _owners;
    mapping(address => uint256) private _balances;

    event Transfer(address indexed from, address indexed to, uint256 indexed tokenId);

    constructor() {
        
        schoolContract = msg.sender; 
    }

    function setSchoolContract(address _schoolContract) public {
        require(msg.sender == schoolContract, "Not authorized");
        schoolContract = _schoolContract;
    }
  
    function mintReceipt(address to) public {
        require(msg.sender == schoolContract, "Only school can mint");
        uint256 tokenId = nextTokenId;
        
        _balances[to] += 1;
        _owners[tokenId] = to;
        
        nextTokenId++;

        emit Transfer(address(0), to, tokenId);
    }
    
    function ownerOf(uint256 tokenId) public view returns (address) {
        return _owners[tokenId];
    }
}
