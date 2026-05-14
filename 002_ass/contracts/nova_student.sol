// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract NovaStudent {
    address public owner;
    
   
    address public novaTokenAddress;
    address public novaReceiptAddress;
    address public novaStaffAddress;
    
    uint256 public schoolFee = 10 * 10**18; 

    struct Student {
        string name;
        uint age;
        string class;
        bool isRegistered;
        bool hasPaidFee;
        bool isPresent; 
    }
    
    mapping(address => Student) public students;
    
    mapping(address => mapping(uint => string)) public studentAnswers;
    
    mapping(address => mapping(uint => uint)) public studentScores;

    constructor() {
        owner = msg.sender; 
    }
    
    function registerStudent(string memory _name, uint _age, string memory _class) public {
        require(!students[msg.sender].isRegistered, "Already registered");
        students[msg.sender] = Student(_name, _age, _class, true, false, false);
    }

    
    function paySchoolFee() public {
        require(students[msg.sender].isRegistered, "Must be registered");
        require(!students[msg.sender].hasPaidFee, "Fee already paid");
        
      
        
        students[msg.sender].hasPaidFee = true;
    }

    function submitTask(uint _taskId, string memory _answer) public {
        require(students[msg.sender].isRegistered, "Not a registered student");
        studentAnswers[msg.sender][_taskId] = _answer;
    }

    
    function markAttendance(address _student, bool _present) public {
       
        require(students[_student].isRegistered, "Student not found");
        students[_student].isPresent = _present;
    }

   
    function scoreStudent(address _student, uint _taskId, uint _score) public {
       
        require(students[_student].isRegistered, "Student not found");
        studentScores[_student][_taskId] = _score;
    }
    function withdrawFunds() public {
        require(msg.sender == owner, "Only owner can withdraw");
        
    }
}
