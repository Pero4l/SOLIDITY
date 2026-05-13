// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title Educational NFT (ERC721)
 * @dev A custom, beginner-friendly implementation of the ERC721 Non-Fungible Token Standard.
 * This contract is built from scratch to help you understand how NFTs actually work under the hood.
 */
contract EducationalNFT {
    // ==========================================
    // 1. STATE VARIABLES (The "Database" of our NFT)
    // ==========================================

    // Token name and symbol (e.g., "My Epic NFT", "EPIC")
    string public name;
    string public symbol;

    // Mapping from token ID to owner address.
    // This tells us exactly WHO owns WHICH specific token (NFT).
    // Example: Token #1 => 0xAlice, Token #2 => 0xBob
    mapping(uint256 => address) private _owners;

    // Mapping owner address to token count.
    // This tells us HOW MANY tokens a specific person owns.
    // Example: 0xAlice => 5 tokens
    mapping(address => uint256) private _balances;

    // Mapping from token ID to approved address.
    // Sometimes you want to let someone else (like an auction house or marketplace)
    // sell or transfer your NFT. This mapping stores who is approved to transfer a specific token.
    mapping(uint256 => address) private _tokenApprovals;

    // Mapping from owner to operator approvals.
    // Instead of approving one token at a time, you can approve an "operator" (like OpenSea)
    // to manage ALL of your NFTs.
    mapping(address => mapping(address => bool)) private _operatorApprovals;

    // ==========================================
    // 2. EVENTS (The "Loudspeaker" of our NFT)
    // ==========================================
    
    // Fired whenever an NFT is created (minted), transferred, or destroyed (burned).
    event Transfer(address indexed from, address indexed to, uint256 indexed tokenId);

    // Fired whenever someone is approved to transfer a specific token.
    event Approval(address indexed owner, address indexed approved, uint256 indexed tokenId);

    // Fired whenever an owner approves or removes an operator for all their tokens.
    event ApprovalForAll(address indexed owner, address indexed operator, bool approved);

    // ==========================================
    // 3. CONSTRUCTOR (Setup when deployed)
    // ==========================================
    constructor(string memory _name, string memory _symbol) {
        name = _name;
        symbol = _symbol;
    }

    // ==========================================
    // 4. CORE NFT FUNCTIONS (Read Data)
    // ==========================================

    /**
     * @dev Returns the number of NFTs owned by `owner`.
     */
    function balanceOf(address owner) public view returns (uint256) {
        require(owner != address(0), "Address zero is not a valid owner");
        return _balances[owner];
    }

    /**
     * @dev Returns the owner of the NFT specified by `tokenId`.
     */
    function ownerOf(uint256 tokenId) public view returns (address) {
        address owner = _owners[tokenId];
        require(owner != address(0), "Token does not exist");
        return owner;
    }

    // ==========================================
    // 5. APPROVAL FUNCTIONS (Permission to transfer)
    // ==========================================

    /**
     * @dev Gives permission to `to` to transfer `tokenId` token to another account.
     */
    function approve(address to, uint256 tokenId) public {
        address owner = ownerOf(tokenId);
        // Ensure the person approving is either the owner or an approved operator
        require(msg.sender == owner || isApprovedForAll(owner, msg.sender), "Not authorized to approve");
        require(to != owner, "Cannot approve yourself");

        _tokenApprovals[tokenId] = to;
        emit Approval(owner, to, tokenId);
    }

    /**
     * @dev Returns the account approved for `tokenId` token.
     */
    function getApproved(uint256 tokenId) public view returns (address) {
        require(_owners[tokenId] != address(0), "Token does not exist");
        return _tokenApprovals[tokenId];
    }

    /**
     * @dev Approve or remove `operator` as an operator for the caller.
     * Operators can call transferFrom for any token owned by the caller.
     */
    function setApprovalForAll(address operator, bool approved) public {
        require(operator != msg.sender, "Cannot approve yourself as operator");
        
        _operatorApprovals[msg.sender][operator] = approved;
        emit ApprovalForAll(msg.sender, operator, approved);
    }

    /**
     * @dev Returns if the `operator` is allowed to manage all of the assets of `owner`.
     */
    function isApprovedForAll(address owner, address operator) public view returns (bool) {
        return _operatorApprovals[owner][operator];
    }

    // ==========================================
    // 6. TRANSFER FUNCTIONS (Moving NFTs)
    // ==========================================

    /**
     * @dev Transfers `tokenId` token from `from` to `to`.
     */
    function transferFrom(address from, address to, uint256 tokenId) public {
        // 1. Check permissions: Is msg.sender the owner, approved for this token, or an approved operator?
        address owner = ownerOf(tokenId);
        require(
            msg.sender == owner || 
            getApproved(tokenId) == msg.sender || 
            isApprovedForAll(owner, msg.sender),
            "Not authorized to transfer"
        );

        // 2. Check validity
        require(owner == from, "Transfer from incorrect owner");
        require(to != address(0), "Transfer to the zero address");

        // 3. Clear approvals from the previous owner
        _tokenApprovals[tokenId] = address(0);
        emit Approval(owner, address(0), tokenId);

        // 4. Update balances (from loses 1, to gains 1)
        _balances[from] -= 1;
        _balances[to] += 1;

        // 5. Update ownership
        _owners[tokenId] = to;

        // 6. Emit the standard Transfer event
        emit Transfer(from, to, tokenId);
    }

    // ==========================================
    // 7. MINTING (Creating NEW NFTs)
    // ==========================================

    /**
     * @dev Mints `tokenId` and transfers it to `to`.
     * In a real app, you might restrict this to only the contract owner (admin).
     * For educational purposes, anyone can call this here.
     */
    function mint(address to, uint256 tokenId) public {
        require(to != address(0), "Cannot mint to the zero address");
        require(_owners[tokenId] == address(0), "Token already minted!"); // NFTs must be unique!

        // Update balances and ownership
        _balances[to] += 1;
        _owners[tokenId] = to;

        // Emitting a transfer from the "zero address" implies creation (minting)
        emit Transfer(address(0), to, tokenId);
    }
}
