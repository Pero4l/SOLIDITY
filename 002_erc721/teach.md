# Learning Solidity: Understanding ERC-721 (NFTs)

Welcome! If you've ever heard of NFTs (Non-Fungible Tokens) like Bored Apes or CryptoPunks, you've heard of the **ERC-721** standard. 

In the previous lesson, we learned about ERC-20, which is for *fungible* tokens (like dollars—any $1 bill is the same as another $1 bill). 
**ERC-721** is for *non-fungible* tokens. "Non-fungible" simply means **unique**. Every single token has its own specific identity, usually represented by a `tokenId` (a number).

Let's break down the custom `nft.sol` contract we just built from scratch so you can understand exactly how NFTs work under the hood!

---

## The "Database" (State Variables)

An NFT contract is essentially a giant spreadsheet keeping track of who owns which specific item. Here are the core variables that make this happen:

```solidity
mapping(uint256 => address) private _owners;
```
**1. The `_owners` Mapping:**
This is the most important part of an NFT. It asks: *"Who owns token ID #1?"* 
If you look up `_owners[1]`, it might return `0xAlice`. If you look up `_owners[2]`, it might return `0xBob`. Because every token ID is unique, this mapping ensures only one person can own a specific NFT at a time.

```solidity
mapping(address => uint256) private _balances;
```
**2. The `_balances` Mapping:**
This just keeps a count of *how many* NFTs a person owns. If Alice owns Token #1 and Token #3, her balance is `2`. It doesn't say *which* ones she owns, just the total amount.

---

## Approvals: Letting Others Sell Your NFT

One of the coolest features of NFTs is that you can list them on a marketplace (like OpenSea or Blur) and let the marketplace sell them for you safely. This is done through "Approvals".

```solidity
mapping(uint256 => address) private _tokenApprovals;
```
**1. Single Token Approval (`approve`):**
If Alice owns Token #5, she can "approve" a marketplace smart contract to transfer *only* Token #5. She still owns it, but the marketplace has permission to move it if someone buys it.

```solidity
mapping(address => mapping(address => bool)) private _operatorApprovals;
```
**2. Operator Approval (`setApprovalForAll`):**
Approving tokens one-by-one costs gas (money). If Alice wants to sell 50 NFTs on OpenSea, it would be expensive to approve each one. Instead, she can set OpenSea as an "Operator". This gives OpenSea permission to manage **all** of the NFTs she owns in this contract.

---

## How Transfers Work (`transferFrom`)

When an NFT is sent from one person to another, what actually happens on the blockchain? It's just updating the variables we talked about above!

When `transferFrom(Alice, Bob, Token #1)` is called, the contract does a few things:
1. **Checks Permission:** Are you Alice? Or are you a marketplace Alice approved? If not, the transaction fails.
2. **Clears Old Approvals:** It removes the marketplace's permission to sell Token #1 since Alice doesn't own it anymore.
3. **Updates Balances:** Alice's `_balance` goes down by 1. Bob's `_balance` goes up by 1.
4. **Updates Ownership:** `_owners[1]` is changed from Alice's address to Bob's address.
5. **Emits Event:** It shouts to the blockchain `Transfer(Alice, Bob, 1)` so websites know the NFT moved.

---

## Minting: Creating an NFT out of Thin Air

Before an NFT can be transferred, it has to be created. This is called **minting**.

```solidity
function mint(address to, uint256 tokenId) public { ... }
```

In our `mint` function, we take a `tokenId` (let's say `#99`) and assign it to an address. 
The contract checks: *"Does anyone already own Token #99?"* 
If the answer is no, it updates the `_owners` mapping to set the new owner, increases their balance, and the NFT is officially born!

*(Note: In real-world projects, `mint` is usually protected so only the creator or people who pay ETH can call it. In our educational version, we left it open so you can easily play with it!)*

---

## Summary

That's it! An NFT is just a smart contract that maintains a list mapping unique IDs to owner addresses, along with rules for how those IDs can be moved around. 

When you see a picture attached to an NFT, that's usually handled by another function called `tokenURI` (which points to an image on the internet). But at its core, the ownership and transfer logic is exactly what you see in `nft.sol`!
