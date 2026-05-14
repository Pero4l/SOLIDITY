// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract NovaStaff {
    struct Staff {
        string name;
        uint age;
        bool isRegistered;
    }
    
    struct Task {
        uint taskId;
        string description;
        address creator;
    }

    mapping(address => Staff) public staffDirectory;
    Task[] public tasks;
    
    event StaffRegistered(address staffAddress, string name);
    event TaskCreated(uint taskId, string description, address creator);

  
    function registerStaff(string memory _name, uint _age) public {
        require(_age > 18, "Age must be above 18");
        require(!staffDirectory[msg.sender].isRegistered, "Staff already registered");
        
        staffDirectory[msg.sender] = Staff(_name, _age, true);
        emit StaffRegistered(msg.sender, _name);
    }

   
    function createTask(string memory _description) public {
        require(staffDirectory[msg.sender].isRegistered, "Only registered staff can create tasks");
        
        uint newTaskId = tasks.length;
        tasks.push(Task(newTaskId, _description, msg.sender));
        
        emit TaskCreated(newTaskId, _description, msg.sender);
    }
    
   
    function isStaff(address _address) public view returns (bool) {
        return staffDirectory[_address].isRegistered;
    }
}
