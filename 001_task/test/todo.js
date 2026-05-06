const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("TodoList Contract", function () {
  // We define a fixture to reuse the same setup in every test
  async function deployTodoListFixture() {
    const [owner, otherAccount] = await ethers.getSigners();
    const TodoList = await ethers.getContractFactory("TodoList");
    const todoList = await TodoList.deploy();

    return { todoList, owner, otherAccount };
  }

  describe("Deployment", function () {
    it("Should start with an empty task list", async function () {
      const { todoList } = await deployTodoListFixture();
      const allTasks = await todoList.viewAllTasks();
      expect(allTasks.length).to.equal(0);
    });
  });

  describe("Adding Tasks", function () {
    it("Should add a new task correctly", async function () {
      const { todoList, owner } = await deployTodoListFixture();

      await todoList.addTask("Finish Hardhat Project");
      const tasks = await todoList.viewAllTasks();

      expect(tasks.length).to.equal(1);
      expect(tasks[0].name).to.equal("Finish Hardhat Project");
      expect(tasks[0].owner).to.equal(owner.address);
      expect(tasks[0].isDone).to.equal(false);
    });
  });

  describe("Marking as Done", function () {
    it("Should allow the owner to mark a task as done", async function () {
      const { todoList } = await deployTodoListFixture();

      await todoList.addTask("Task 1");
      await todoList.markAsDone(0); // Index 0

      const tasks = await todoList.viewAllTasks();
      expect(tasks[0].isDone).to.equal(true);
    });

    it("Should fail if someone else tries to mark a task as done", async function () {
      const { todoList, otherAccount } = await deployTodoListFixture();

      await todoList.addTask("Owner Task");

      // We connect as 'otherAccount' and try to modify index 0
      await expect(
        todoList.connect(otherAccount).markAsDone(0),
      ).to.be.revertedWith("Not your task");
    });

    it("Should fail if the task index does not exist", async function () {
      const { todoList } = await deployTodoListFixture();

      await expect(todoList.markAsDone(99)).to.be.revertedWith(
        "Task does not exist",
      );
    });
  });
});
