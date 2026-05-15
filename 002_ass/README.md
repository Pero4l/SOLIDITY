# Nova Academy School Management System

Welcome to the Nova Academy project! This repository contains a fully-fledged on-chain school management system, built using Solidity and Hardhat. The project demonstrates advanced cross-contract interactions using custom ERC20 and ERC721 tokens alongside robust logic and role-based access control.

## Smart Contracts Overview

The system is composed of four main interacting contracts:

### 1. `NOVATOKEN` (nova_erc20.sol)
An ERC20 token acting as the official currency of the Nova Academy.
- **`transfer` / `transferFrom`**: Standard ERC20 functions used to move tokens. `transferFrom` is heavily utilized by the school to pull fees from students.
- **`approve`**: Allows a student to give the `NovaStudent` contract allowance to deduct their school fee.

### 2. `NovaStaff` (nova_staff.sol)
The staff database that handles teacher registrations and permissions.
- **`registerStaff(string memory _name, uint _age)`**: Allows an adult (over 18) to register as a teacher.
- **`createTask(string memory _description)`**: Lets registered staff create new homework tasks for the students.
- **`isStaff(address _address)`**: A helper function that the `NovaStudent` contract calls to verify if an address belongs to a registered teacher.

### 3. `NovaReceipt` (nova_erc721.sol)
An ERC721 non-fungible token (NFT) contract that acts as a verifiable receipt of payment.
- **`mintReceipt(address to)`**: Mints a unique NFT receipt to a student. This function is locked down and can *only* be called programmatically by the designated `schoolContract` (the `NovaStudent` contract).
- **`setSchoolContract(address _schoolContract)`**: Allows updating the address of the school contract that holds minting privileges.

### 4. `NovaStudent` (nova_student.sol)
The core "Brain" of the school. It integrates with the token, staff, and receipt contracts to manage the student lifecycle.
- **`setContracts(address _token, address _receipt, address _staff)`**: Links the `NovaStudent` contract to the other 3 contracts, enabling seamless cross-contract calls.
- **`registerStudent(string memory _name, uint _age, string memory _class)`**: Registers a new student in the academy.
- **`paySchoolFee()`**: A student calls this to pay their 10 VAT (`NOVATOKEN`) fee. The contract pulls the tokens using `transferFrom` and automatically mints an NFT receipt via the `NovaReceipt` contract.
- **`submitTask(uint _taskId, string memory _answer)`**: Allows a student to submit answers to tasks created by teachers.
- **`markAttendance(address _student, bool _present)`**: Restricted to staff. The contract calls `NovaStaff.isStaff()` to ensure only registered teachers can mark attendance.
- **`scoreStudent(address _student, uint _taskId, uint _score)`**: Restricted to staff. Only registered teachers can grade a submitted task.
- **`withdrawFunds()`**: The owner (admin) of the school can call this to withdraw all collected `NOVATOKEN` fees from the contract back to their wallet.

## Testing

A comprehensive test suite is included in `test/Nova.test.js`. It tests the entire lifecycle from deployment and configuration to registration, fee payments, and staff-restricted grading operations.

To run the tests:
```shell
npx hardhat test test/Nova.test.js
```
