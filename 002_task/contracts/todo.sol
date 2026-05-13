// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract TodoList {
    
    struct Task {
        uint id;
        string name;  
        address owner;
    }

    Task[] public tasks;
    
    mapping(address => Task[]) internal  allTasksByOwner;


    function addTask(string memory _name) public {
        
        uint newId = tasks.length + 1;
        address currentOwner = msg.sender; 
        
        Task memory newTask = Task(newId, _name, currentOwner);

        tasks.push(newTask);
        allTasksByOwner[msg.sender].push(newTask);
    }

    
    function getSingleTask() public view returns (Task[] memory) {
        return allTasksByOwner[msg.sender];
    }



}