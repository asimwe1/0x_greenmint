import { expect } from "chai";
import { ethers } from "hardhat";
import dotenv from "dotenv";

dotenv.config();

describe("VerificationContract", function () {
  let deployer: any, user: any;
  let verification: any;
  let ipfsStorage: any;

  // Load Pinata CID and gateway from .env
  const ipfsURI = process.env.PINATA_CID ? `ipfs://${process.env.PINATA_CID}` : "ipfs://QmX1234567890abcdef1234567890abcdef1234567890";

  // Contract addresses from Amoy deployment
  const contractAddresses = {
    VerificationContract: "0x2580A8c411bd206d9E9127880BD126efBC8749f7",
    IPFSStorageContract: "0x15B7C3659fd442CbCd134F29EBE30aC922A33C62"
  };

  // Increase timeout for Amoy tests
  this.timeout(100000);

  beforeEach(async function () {
    const signers = await ethers.getSigners();
    const network = await ethers.provider.getNetwork();
    const isAmoy = network.chainId === 80002n; // Amoy chain ID

    // Handle signers based on network
    if (!isAmoy && signers.length >= 2) {
      [deployer, user] = signers;
    } else {
      deployer = signers[0];
      user = signers[0];
    }

    console.log("Deployer address:", await deployer.getAddress());
    console.log("Network:", isAmoy ? "Amoy" : "Local");
    console.log("Pinata CID:", process.env.PINATA_CID);

    // Connect to existing contracts
    verification = await ethers.getContractAt("VerificationContract", contractAddresses.VerificationContract);
    console.log("verification connected to:", contractAddresses.VerificationContract);

    ipfsStorage = await ethers.getContractAt("IPFSStorageContract", contractAddresses.IPFSStorageContract);
    console.log("ipfsStorage connected to:", contractAddresses.IPFSStorageContract);

    // Upload IPFS hash to IPFSStorageContract
    try {
      await ipfsStorage.grantRole(await ipfsStorage.UPLOADER_ROLE(), await deployer.getAddress());
      console.log("IPFS uploader role granted to backend");
    } catch (error: any) {
      console.log("IPFS uploader role already granted or error:", error.message || error);
    }
    
    try {
      await ipfsStorage.uploadIpfsHash(ipfsURI);
      console.log("IPFS hash uploaded successfully");
    } catch (error: any) {
      console.log("IPFS hash already uploaded or error:", error.message || error);
    }
  });

  it("should submit and approve verification successfully", async function () {
    try {
      await verification.grantRole(await verification.VERIFIER_ROLE(), await deployer.getAddress());
    } catch (error) {
      // Role may already be granted, ignore error
    }
    
    // Use a unique verification ID to avoid conflicts
    const verificationId = Math.floor(Date.now() / 1000);
    const userAddr = await user.getAddress();
    
    // Submit verification
    const submitTx = await verification.submitVerification(userAddr, verificationId, ipfsURI);
    await submitTx.wait();
    
    // Get the verification count to find the correct ID
    const verificationCount = await verification.verificationCount();
    console.log("Verification count after submission:", verificationCount.toString());
    
    // Approve the verification using the correct ID
    const approveTx = await verification.approveVerifications([verificationCount]);
    const receipt = await approveTx.wait();
    
    // Check for the VerificationApproved event
    const eventFilter = verification.filters.VerificationApproved();
    const events = await verification.queryFilter(eventFilter, receipt.blockNumber, receipt.blockNumber);
    console.log("VerificationApproved events:", events.length);
    
    expect(events.length).to.be.gt(0);
    
    // Verify the verification data
    const verificationData = await verification.verifications(verificationCount);
    console.log("Verification data:", verificationData);
    
    expect(verificationData.isVerified).to.be.true;
    expect(verificationData.verifier).to.equal(await deployer.getAddress());
    expect(verificationData.ipfsHash).to.equal(ipfsURI);
    expect(verificationData.user).to.equal(userAddr);
    expect(verificationData.activityId).to.equal(verificationId);
  });

  it("should fail to submit verification without proper permission", async function () {
    const verificationId = Math.floor(Date.now() / 1000);
    const userAddr = await user.getAddress();
    
    // On Amoy testnet, we use the same address for deployer and user
    // So we need to create a new address without the role
    const network = await ethers.provider.getNetwork();
    const isAmoy = network.chainId === 80002n;
    
    if (isAmoy) {
      // Skip this test on Amoy since we can't create different addresses
      console.log("Skipping backend permission test on Amoy - single address deployment");
      return;
    }
    
    // Try to submit verification without being the backend - should fail
    try {
      await verification.connect(user).submitVerification(userAddr, verificationId, ipfsURI);
      throw new Error("Should have failed");
    } catch (error: any) {
      expect(error.message).to.include("Only backend can submit");
    }
  });

  it("should fail to approve verification without proper role", async function () {
    // Submit a verification first
    const verificationId = Math.floor(Date.now() / 1000);
    const userAddr = await user.getAddress();
    
    const submitTx = await verification.submitVerification(userAddr, verificationId, ipfsURI);
    await submitTx.wait();
    
    const verificationCount = await verification.verificationCount();
    
    // On Amoy testnet, we use the same address for deployer and user
    // So we need to create a new address without the role
    const network = await ethers.provider.getNetwork();
    const isAmoy = network.chainId === 80002n;
    
    if (isAmoy) {
      // Skip this test on Amoy since we can't create different addresses
      console.log("Skipping access control test on Amoy - single address deployment");
      return;
    }
    
    // Try to approve without VERIFIER_ROLE - should fail
    try {
      await verification.connect(user).approveVerifications([verificationCount]);
      throw new Error("Should have failed");
    } catch (error: any) {
      expect(error.message).to.include("AccessControl");
    }
  });

  it("should not allow double approval of the same verification", async function () {
    try {
      await verification.grantRole(await verification.VERIFIER_ROLE(), await deployer.getAddress());
    } catch (error) {
      // Role may already be granted, ignore error
    }
    
    const verificationId = Math.floor(Date.now() / 1000);
    const userAddr = await user.getAddress();
    
    // Submit and approve verification
    const submitTx = await verification.submitVerification(userAddr, verificationId, ipfsURI);
    await submitTx.wait();
    
    const verificationCount = await verification.verificationCount();
    
    const approveTx = await verification.approveVerifications([verificationCount]);
    await approveTx.wait();
    
    // Try to approve again - should fail
    try {
      await verification.approveVerifications([verificationCount]);
      throw new Error("Should have failed");
    } catch (error: any) {
      expect(error.message).to.include("Already verified");
    }
  });

  it("should emit events correctly", async function () {
    try {
      await verification.grantRole(await verification.VERIFIER_ROLE(), await deployer.getAddress());
    } catch (error) {
      // Role may already be granted, ignore error
    }
    
    const verificationId = Math.floor(Date.now() / 1000);
    const userAddr = await user.getAddress();
    
    // Submit verification and check event
    const submitTx = await verification.submitVerification(userAddr, verificationId, ipfsURI);
    const submitReceipt = await submitTx.wait();
    
    // Check for VerificationSubmitted event in the receipt logs
    const submitEvents = submitReceipt.logs.filter((log: any) => {
      try {
        const parsedLog = verification.interface.parseLog(log);
        return parsedLog.name === 'VerificationSubmitted';
      } catch (error) {
        return false;
      }
    });
    
    console.log("Submit events found:", submitEvents.length);
    expect(submitEvents.length).to.be.gt(0);
    
    if (submitEvents.length > 0) {
      const parsedEvent = verification.interface.parseLog(submitEvents[0]);
      expect(parsedEvent.args.user).to.equal(userAddr);
      expect(parsedEvent.args.ipfsHash).to.equal(ipfsURI);
    }
    
    // Approve verification and check event
    const verificationCount = await verification.verificationCount();
    const approveTx = await verification.approveVerifications([verificationCount]);
    const approveReceipt = await approveTx.wait();
    
    // Check for VerificationApproved event
    const approveEventFilter = verification.filters.VerificationApproved();
    const approveEvents = await verification.queryFilter(approveEventFilter, approveReceipt.blockNumber, approveReceipt.blockNumber);
    
    console.log("Approve events found:", approveEvents.length);
    expect(approveEvents.length).to.be.gt(0);
    
    if (approveEvents.length > 0) {
      expect(approveEvents[0].args.verifier).to.equal(await deployer.getAddress());
    }
  });

  it("should handle multiple verifications correctly", async function () {
    try {
      await verification.grantRole(await verification.VERIFIER_ROLE(), await deployer.getAddress());
    } catch (error) {
      // Role may already be granted, ignore error
    }
    
    const userAddr = await user.getAddress();
    const verificationId1 = Math.floor(Date.now() / 1000);
    const verificationId2 = verificationId1 + 1;
    
    // Submit two verifications
    const submitTx1 = await verification.submitVerification(userAddr, verificationId1, ipfsURI);
    await submitTx1.wait();
    
    const submitTx2 = await verification.submitVerification(userAddr, verificationId2, ipfsURI);
    await submitTx2.wait();
    
    const verificationCount = await verification.verificationCount();
    
    // Approve both verifications
    const approveTx = await verification.approveVerifications([verificationCount - 1n, verificationCount]);
    await approveTx.wait();
    
    // Check both verifications are approved
    const verification1 = await verification.verifications(verificationCount - 1n);
    const verification2 = await verification.verifications(verificationCount);
    
    expect(verification1.isVerified).to.be.true;
    expect(verification2.isVerified).to.be.true;
    expect(verification1.activityId).to.equal(verificationId1);
    expect(verification2.activityId).to.equal(verificationId2);
  });
});
