const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Nova Academy Contracts", function () {
  let novaToken, novaReceipt, novaStaff, novaStudent;
  let owner, staffMember, student, addrs;

  const schoolFee = ethers.parseUnits("10", 18);

  before(async function () {
    [owner, staffMember, student, ...addrs] = await ethers.getSigners();

    // Deploy Nova Token
    const NovaToken = await ethers.getContractFactory("NOVATOKEN");
    novaToken = await NovaToken.deploy();

    // Deploy Nova Receipt
    const NovaReceipt = await ethers.getContractFactory("NovaReceipt");
    novaReceipt = await NovaReceipt.deploy();

    // Deploy Nova Staff
    const NovaStaff = await ethers.getContractFactory("NovaStaff");
    novaStaff = await NovaStaff.deploy();

    // Deploy Nova Student
    const NovaStudent = await ethers.getContractFactory("NovaStudent");
    novaStudent = await NovaStudent.deploy();

    // Set Contracts
    await novaStudent.connect(owner).setContracts(
      await novaToken.getAddress(),
      await novaReceipt.getAddress(),
      await novaStaff.getAddress()
    );

    // Set school contract in Receipt so student contract can mint
    await novaReceipt.connect(owner).setSchoolContract(await novaStudent.getAddress());

    // Transfer some tokens to the student for fees
    await novaToken.connect(owner).transfer(student.address, ethers.parseUnits("50", 18));
  });

  describe("Staff Management", function () {
    it("Should register a staff member", async function () {
      await expect(novaStaff.connect(staffMember).registerStaff("Mr. Smith", 35))
        .to.emit(novaStaff, "StaffRegistered")
        .withArgs(staffMember.address, "Mr. Smith");

      expect(await novaStaff.isStaff(staffMember.address)).to.be.true;
    });

    it("Should allow a registered staff to create a task", async function () {
      await expect(novaStaff.connect(staffMember).createTask("Math Homework"))
        .to.emit(novaStaff, "TaskCreated")
        .withArgs(0, "Math Homework", staffMember.address);
    });
  });

  describe("Student Registration & Fees", function () {
    it("Should register a student", async function () {
      await novaStudent.connect(student).registerStudent("Alice", 14, "Grade 9");
      const studentData = await novaStudent.students(student.address);
      expect(studentData.isRegistered).to.be.true;
      expect(studentData.hasPaidFee).to.be.false;
    });

    it("Should allow student to pay school fee and receive receipt NFT", async function () {
      // Student must first approve NovaStudent contract to spend their tokens
      await novaToken.connect(student).approve(await novaStudent.getAddress(), schoolFee);

      // Student pays the fee
      await expect(novaStudent.connect(student).paySchoolFee())
        .to.emit(novaToken, "Transfer")
        .withArgs(student.address, await novaStudent.getAddress(), schoolFee)
        .to.emit(novaReceipt, "Transfer")
        .withArgs(ethers.ZeroAddress, student.address, 0); // tokenId 0

      const studentData = await novaStudent.students(student.address);
      expect(studentData.hasPaidFee).to.be.true;

      // Verify NFT receipt ownership
      expect(await novaReceipt.ownerOf(0)).to.equal(student.address);
    });
  });

  describe("School Operations", function () {
    it("Should allow staff to mark attendance", async function () {
      await novaStudent.connect(staffMember).markAttendance(student.address, true);
      const studentData = await novaStudent.students(student.address);
      expect(studentData.isPresent).to.be.true;
    });

    it("Should not allow non-staff to mark attendance", async function () {
      await expect(
        novaStudent.connect(owner).markAttendance(student.address, false)
      ).to.be.revertedWith("Only staff can mark attendance");
    });

    it("Should allow staff to score student", async function () {
      // Task ID 0, score 95
      await novaStudent.connect(staffMember).scoreStudent(student.address, 0, 95);
      expect(await novaStudent.studentScores(student.address, 0)).to.equal(95);
    });
  });

  describe("Withdrawal", function () {
    it("Should allow owner to withdraw accumulated fees", async function () {
      const ownerBalanceBefore = await novaToken.balanceOf(owner.address);
      const contractBalance = await novaToken.balanceOf(await novaStudent.getAddress());

      expect(contractBalance).to.equal(schoolFee);

      await novaStudent.connect(owner).withdrawFunds();

      const ownerBalanceAfter = await novaToken.balanceOf(owner.address);
      expect(ownerBalanceAfter).to.equal(ownerBalanceBefore + contractBalance);

      const contractBalanceAfter = await novaToken.balanceOf(await novaStudent.getAddress());
      expect(contractBalanceAfter).to.equal(0);
    });
  });
});
