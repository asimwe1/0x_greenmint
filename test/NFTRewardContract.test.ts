import { expect } from "chai";
import { ethers } from "hardhat";

describe("NFTRewardContract", function () {
  let nftReward: any;
  let deployer: any, user: any;

  beforeEach(async function () {
    [deployer, user] = await ethers.getSigners();
    
    const NFTRewardContract = await ethers.getContractFactory("NFTRewardContract");
    nftReward = await NFTRewardContract.deploy();
    await nftReward.deployed();
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      const DEFAULT_ADMIN_ROLE = await nftReward.DEFAULT_ADMIN_ROLE();
      expect(await nftReward.hasRole(DEFAULT_ADMIN_ROLE, deployer.address)).to.be.true;
    });

    it("Should set the correct name and symbol", async function () {
      expect(await nftReward.name()).to.equal("GreenMintNFT");
      expect(await nftReward.symbol()).to.equal("GMNFT");
    });
  });

  describe("Minting", function () {
    it("Should mint NFT to recipient", async function () {
      const tokenUri = "https://example.com/metadata/1";
      const tx = await nftReward.mintNFT(user.address, tokenUri);
      await tx.wait();

      expect(await nftReward.balanceOf(user.address)).to.equal(1);
      expect(await nftReward.tokenURI(1)).to.equal(tokenUri);
    });

    it("Should revert when non-admin tries to mint", async function () {
      const tokenUri = "https://example.com/metadata/1";
      await expect(
        nftReward.connect(user).mintNFT(user.address, tokenUri)
      ).to.be.revertedWith("AccessControl:");
    });
  });

  describe("Token URI", function () {
    it("Should return correct token URI", async function () {
      const tokenUri = "https://example.com/metadata/1";
      await nftReward.mintNFT(user.address, tokenUri);
      
      expect(await nftReward.tokenURI(1)).to.equal(tokenUri);
    });
  });

  describe("Burning", function () {
    it("Should allow token owner to burn NFT", async function () {
      const tokenUri = "https://example.com/metadata/1";
      await nftReward.mintNFT(user.address, tokenUri);
      
      await nftReward.connect(user).burn(1);
      
      expect(await nftReward.balanceOf(user.address)).to.equal(0);
    });
  });

  describe("Voting", function () {
    it("Should delegate votes on mint", async function () {
      const tokenUri = "https://example.com/metadata/1";
      await nftReward.mintNFT(user.address, tokenUri);
      
      expect(await nftReward.getVotes(user.address)).to.equal(1);
    });
  });
});
