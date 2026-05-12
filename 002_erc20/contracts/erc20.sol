// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title MyEducationalToken
 * @dev A simple ERC20 token implementation from scratch for learning purposes.
 */
contract MyEducationalToken {
    // 1. Token Details (State Variables)
    string public name = "My Educational Token";
    string public symbol = "MET";
    uint8 public decimals = 18;
    uint256 public totalSupply;

    // 2. Data Structures (Mappings)
    // Keeps track of how many tokens each address has
    mapping(address => uint256) public balanceOf;
    
    // Keeps track of how many tokens an owner has allowed a spender to use
    // Owner => (Spender => Amount)
    mapping(address => mapping(address => uint256)) public allowance;

    // 3. Events (Logging)
    // Triggered when tokens are transferred
    event Transfer(address indexed from, address indexed to, uint256 value);
    
    // Triggered when an owner approves a spender to use their tokens
    event Approval(address indexed owner, address indexed spender, uint256 value);

    // 4. Constructor (Initialization)
    // Runs only once when the contract is deployed
    constructor(uint256 _initialSupply) {
        // Calculate the actual supply based on decimals (e.g., 1000 * 10^18)
        totalSupply = _initialSupply * (10 ** uint256(decimals));
        
        // Give all the initially created tokens to the person who deployed the contract
        balanceOf[msg.sender] = totalSupply;
        
        // Emit a transfer event from the "zero address" to signify creation
        emit Transfer(address(0), msg.sender, totalSupply);
    }

    // 5. Functions (Actions)

    /**
     * @dev Transfers tokens from the caller's account to another account.
     */
    function transfer(address _to, uint256 _value) public returns (bool success) {
        // Check if the sender has enough tokens
        require(balanceOf[msg.sender] >= _value, "Insufficient balance");
        
        // Deduct from sender and add to recipient
        balanceOf[msg.sender] -= _value;
        balanceOf[_to] += _value;
        
        // Log the transfer
        emit Transfer(msg.sender, _to, _value);
        return true;
    }

    /**
     * @dev Approves another address (spender) to spend tokens on your behalf.
     */
    function approve(address _spender, uint256 _value) public returns (bool success) {
        // Set the allowance
        allowance[msg.sender][_spender] = _value;
        
        // Log the approval
        emit Approval(msg.sender, _spender, _value);
        return true;
    }

    /**
     * @dev Transfers tokens on behalf of the owner, using the allowance mechanism.
     */
    function transferFrom(address _from, address _to, uint256 _value) public returns (bool success) {
        // Check if the owner has enough tokens
        require(_value <= balanceOf[_from], "Insufficient balance");
        
        // Check if the spender is allowed to spend this amount
        require(_value <= allowance[_from][msg.sender], "Allowance exceeded");
        
        // Deduct tokens from owner, add to recipient
        balanceOf[_from] -= _value;
        balanceOf[_to] += _value;
        
        // Decrease the allowed amount for the spender
        allowance[_from][msg.sender] -= _value;
        
        // Log the transfer
        emit Transfer(_from, _to, _value);
        return true;
    }
}
