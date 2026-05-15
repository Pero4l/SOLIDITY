// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface INovaToken {
    function transferFrom(address _from, address _to, uint256 _value) external returns (bool);
    function transfer(address _to, uint256 _value) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

interface INovaReceipt {
    function mintReceipt(address to) external;
}

interface INovaStaff {
    function isStaff(address _address) external view returns (bool);
}

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
    
    function setContracts(address _token, address _receipt, address _staff) public {
        require(msg.sender == owner, "Only owner");
        novaTokenAddress = _token;
        novaReceiptAddress = _receipt;
        novaStaffAddress = _staff;
    }
    
    function registerStudent(string memory _name, uint _age, string memory _class) public {
        require(!students[msg.sender].isRegistered, "Already registered");
        students[msg.sender] = Student(_name, _age, _class, true, false, false);
    }

    
    function paySchoolFee() public {
        require(students[msg.sender].isRegistered, "Must be registered");
        require(!students[msg.sender].hasPaidFee, "Fee already paid");
        
        require(INovaToken(novaTokenAddress).transferFrom(msg.sender, address(this), schoolFee), "Transfer failed");
        INovaReceipt(novaReceiptAddress).mintReceipt(msg.sender);
        
        students[msg.sender].hasPaidFee = true;
    }

    function submitTask(uint _taskId, string memory _answer) public {
        require(students[msg.sender].isRegistered, "Not a registered student");
        studentAnswers[msg.sender][_taskId] = _answer;
    }

    
    function markAttendance(address _student, bool _present) public {
        require(INovaStaff(novaStaffAddress).isStaff(msg.sender), "Only staff can mark attendance");
        require(students[_student].isRegistered, "Student not found");
        students[_student].isPresent = _present;
    }

   
    function scoreStudent(address _student, uint _taskId, uint _score) public {
        require(INovaStaff(novaStaffAddress).isStaff(msg.sender), "Only staff can score");
        require(students[_student].isRegistered, "Student not found");
        studentScores[_student][_taskId] = _score;
    }
    function withdrawFunds() public {
        require(msg.sender == owner, "Only owner can withdraw");
        uint256 balance = INovaToken(novaTokenAddress).balanceOf(address(this));
        require(INovaToken(novaTokenAddress).transfer(owner, balance), "Transfer failed");
    }
}
