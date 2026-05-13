// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./todo.sol";

contract AllTodo is TodoList {
    
    function viewAllTasks() public view returns (Task[] memory) {
        return tasks;
    }

}