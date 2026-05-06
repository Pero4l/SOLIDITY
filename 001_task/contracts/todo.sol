// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract TodoList {
    
    struct Task {
        uint id;
        string name;
        bool isDone;   
        address owner;
    }

    Task[] public tasks;
    
    mapping(address => Task[]) internal  allTasksByOwner;


    function addTask(string memory _name) public {
        
        uint newId = tasks.length + 1;
        address currentOwner = msg.sender; 
        
        Task memory newTask = Task(newId, _name, false, currentOwner);

        tasks.push(newTask);
        allTasksByOwner[msg.sender].push(newTask);
    }

    
    function getSingleTask() public view returns (Task[] memory) {
        return allTasksByOwner[msg.sender];
    }

    function viewAllTasks() public view returns  (Task[] memory){
        return tasks;
    }

   
    function markAsDone(uint _index) public {
    require(_index < tasks.length, "Task does not exist");
    require(tasks[_index].owner == msg.sender, "Not your task");
    tasks[_index].isDone = true;
    } 
}