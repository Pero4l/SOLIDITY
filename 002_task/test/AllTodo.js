const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("AllTodo", function () {
  let allTodo;
  let owner;
  let addr1;

  beforeEach(async function () {
    [owner, addr1] = await ethers.getSigners();
    const AllTodo = await ethers.getContractFactory("AllTodo");
    allTodo = await AllTodo.deploy();
  });

  it("Should allow adding a task and viewing all tasks", async function () {
    // Add tasks
    await allTodo.addTask("First Task");
    await allTodo.connect(addr1).addTask("Second Task");

    // Retrieve all tasks
    const allTasks = await allTodo.viewAllTasks();

    expect(allTasks.length).to.equal(2);
    
    // Check first task
    expect(allTasks[0].name).to.equal("First Task");
    expect(allTasks[0].owner).to.equal(owner.address);
    
    // Check second task
    expect(allTasks[1].name).to.equal("Second Task");
    expect(allTasks[1].owner).to.equal(addr1.address);
  });
  
  it("Should allow getting single tasks by owner", async function () {
    // Add tasks
    await allTodo.addTask("Owner Task");
    await allTodo.connect(addr1).addTask("Addr1 Task 1");
    await allTodo.connect(addr1).addTask("Addr1 Task 2");

    // Owner checks their tasks
    const ownerTasks = await allTodo.getSingleTask();
    expect(ownerTasks.length).to.equal(1);
    expect(ownerTasks[0].name).to.equal("Owner Task");

    // Addr1 checks their tasks
    const addr1Tasks = await allTodo.connect(addr1).getSingleTask();
    expect(addr1Tasks.length).to.equal(2);
    expect(addr1Tasks[0].name).to.equal("Addr1 Task 1");
    expect(addr1Tasks[1].name).to.equal("Addr1 Task 2");
  });
});
