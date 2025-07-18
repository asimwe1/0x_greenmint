import { expect } from "chai";
import { ethers } from "hardhat";

describe("VerificationContract", function () {
  let verification: any;
  let mockOracle: any;
  let deployer: any, backend: any, user: any;

  beforeEach(async function () {
    [deployer, backend, user] = await ethers.getSigners();
    
    // Deploy mock oracle first
    const MockV3Aggregator = await ethers.getContractFactory("MockV3Aggregator");
    mockOracle = await MockV3Aggregator.deploy(18, ethers.parseEther("1"));
    await mockOracle.waitForDeployment();
    
    const VerificationContract = await ethers.getContractFactory("VerificationContract");
    verification = await VerificationContract.deploy(backend.address, await mockOracle.getAddress());
    await verification.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the right backend address", async function () {
      expect(await verification.backendAddress()).to.equal(backend.address);
    });

    it("Should set the right oracle address", async function () {
      expect(await verification.verificationOracle()).to.equal(await mockOracle.getAddress());
    });

    it("Should set the right admin role", async function () {
      const DEFAULT_ADMIN_ROLE = await verification.DEFAULT_ADMIN_ROLE();
      expect(await verification.hasRole(DEFAULT_ADMIN_ROLE, deployer.address)).to.be.true;
    });
  });

  describe("Verification Submission", function () {
    it("Should submit verification", async function () {
      const activityId = 1;
      const ipfsHash = "QmTest";
      
      await expect(verification.connect(backend).submitVerification(user.address, activityId, ipfsHash))
        .to.emit(verification, "VerificationSubmitted")
        .withArgs(1, user.address, ipfsHash);
      
      const verificationData = await verification.verifications(1);
      expect(verificationData.user).to.equal(user.address);
      expect(verificationData.activityId).to.equal(activityId);
      expect(verificationData.ipfsHash).to.equal(ipfsHash);
      expect(verificationData.isVerified).to.be.false;
      expect(verificationData.isRejected).to.be.false;
    });

    it("Should revert if not called by backend", async function () {
      await expect(
        verification.connect(user).submitVerification(user.address, 1, "QmTest")
      ).to.be.revertedWith("Only backend can submit");
    });
  });

  describe("Verification Approval", function () {
    beforeEach(async function () {
      await verification.connect(backend).submitVerification(user.address, 1, "QmTest");
    });

    it("Should approve verification", async function () {
      await expect(verification.connect(backend).approveVerifications([1]))
        .to.emit(verification, "VerificationApproved")
        .withArgs(1, backend.address);
      
      const verificationData = await verification.verifications(1);
      expect(verificationData.isVerified).to.be.true;
      expect(verificationData.verifier).to.equal(backend.address);
    });

    it("Should revert if not called by backend", async function () {
      await expect(
        verification.connect(user).approveVerifications([1])
      ).to.be.revertedWith("Only backend can approve");
    });
  });

  describe("Verification Rejection", function () {
    beforeEach(async function () {
      await verification.connect(backend).submitVerification(user.address, 1, "QmTest");
    });

    it("Should reject verification", async function () {
      const reason = "Insufficient evidence";
      
      await expect(verification.connect(backend).rejectVerifications([1], [reason]))
        .to.emit(verification, "VerificationRejected")
        .withArgs(1, backend.address, reason);
      
      const verificationData = await verification.verifications(1);
      expect(verificationData.isRejected).to.be.true;
      expect(verificationData.rejectionReason).to.equal(reason);
      expect(verificationData.verifier).to.equal(backend.address);
    });

    it("Should revert if arrays length mismatch", async function () {
      await expect(
        verification.connect(backend).rejectVerifications([1], ["reason1", "reason2"])
      ).to.be.revertedWith("Arrays length mismatch");
    });

    it("Should revert if not called by backend", async function () {
      await expect(
        verification.connect(user).rejectVerifications([1], ["reason"])
      ).to.be.revertedWith("Only backend can reject");
    });
  });

  describe("Multiple Verifications", function () {
    beforeEach(async function () {
      await verification.connect(backend).submitVerification(user.address, 1, "QmTest1");
      await verification.connect(backend).submitVerification(user.address, 2, "QmTest2");
    });

    it("Should approve multiple verifications", async function () {
      await verification.connect(backend).approveVerifications([1, 2]);
      
      const verification1 = await verification.verifications(1);
      const verification2 = await verification.verifications(2);
      
      expect(verification1.isVerified).to.be.true;
      expect(verification2.isVerified).to.be.true;
    });

    it("Should reject multiple verifications", async function () {
      const reasons = ["Reason 1", "Reason 2"];
      await verification.connect(backend).rejectVerifications([1, 2], reasons);
      
      const verification1 = await verification.verifications(1);
      const verification2 = await verification.verifications(2);
      
      expect(verification1.isRejected).to.be.true;
      expect(verification2.isRejected).to.be.true;
      expect(verification1.rejectionReason).to.equal(reasons[0]);
      expect(verification2.rejectionReason).to.equal(reasons[1]);
    });
  });
});