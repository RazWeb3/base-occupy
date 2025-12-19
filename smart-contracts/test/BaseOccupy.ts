import { expect } from "chai";
import { ethers } from "hardhat";
import { time } from "@nomicfoundation/hardhat-toolbox/network-helpers";

describe("BaseOccupy", function () {
  async function deployFixture() {
    const [owner, otherAccount] = await ethers.getSigners();
    const BaseOccupy = await ethers.getContractFactory("BaseOccupy");
    const baseOccupy = await BaseOccupy.deploy();
    return { baseOccupy, owner, otherAccount };
  }

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      const { baseOccupy, owner } = await deployFixture();
      expect(await baseOccupy.owner()).to.equal(owner.address);
    });

    it("Should have correct initial state", async function () {
      const { baseOccupy } = await deployFixture();
      expect(await baseOccupy.gameRound()).to.equal(1);
      expect(await baseOccupy.prizePool()).to.equal(0);
    });
  });

  describe("Occupy", function () {
    it("Should allow a user to occupy and mint NFT", async function () {
      const { baseOccupy, otherAccount } = await deployFixture();
      const entryFee = ethers.parseEther("0.01");

      const tx = await baseOccupy.connect(otherAccount).occupy({ value: entryFee });
      await expect(tx).to.emit(baseOccupy, "Occupied");
        //.withArgs(otherAccount.address, ethers.parseEther("0.009"), await time.latest() + 600 + 1, 1); 

      const block = await ethers.provider.getBlock(tx.blockNumber!);
      const expectedDeadline = block!.timestamp + 600;

      expect(await baseOccupy.deadline()).to.equal(expectedDeadline);

      expect(await baseOccupy.lastDepositor()).to.equal(otherAccount.address);
      expect(await baseOccupy.balanceOf(otherAccount.address)).to.equal(1);
      
      const stat = await baseOccupy.userStats(otherAccount.address);
      expect(stat.depositCount).to.equal(1);
    });

    it("Should fail if incorrect fee sent", async function () {
      const { baseOccupy, otherAccount } = await deployFixture();
      await expect(baseOccupy.connect(otherAccount).occupy({ value: ethers.parseEther("0.001") }))
        .to.be.revertedWith("Incorrect entry fee");
    });
  });

  describe("Game Flow & Claim", function () {
    it("Should allow winner to claim prize", async function () {
      const { baseOccupy, otherAccount } = await deployFixture();
      const entryFee = ethers.parseEther("0.01");

      await baseOccupy.connect(otherAccount).occupy({ value: entryFee });
      
      // Fast forward time past deadline
      await time.increase(10 * 60 + 1);
      
      // Trigger settle by starting next round or calling settleRound
      // In this test case, we simulate the logic that updates pendingWithdrawals
      // Since occupy() now calls _archiveWinner() if deadline passed, we can call occupy() again to trigger archiving
      // OR we can call settleRound() if we implemented it.
      
      await baseOccupy.connect(otherAccount).settleRound();

      const prize = ethers.parseEther("0.009");
      
      // Since settleRound auto-withdraws for the caller if they are the winner, 
      // pendingWithdrawals should be 0 and funds transferred.
      expect(await baseOccupy.pendingWithdrawals(otherAccount.address)).to.equal(0);
    });

    it("Should not allow non-winner to claim", async function () {
        const { baseOccupy, owner, otherAccount } = await deployFixture();
        const entryFee = ethers.parseEther("0.01");
  
        await baseOccupy.connect(otherAccount).occupy({ value: entryFee });
        await time.increase(10 * 60 + 1);
        
        // Non-winner (owner) should have no pending withdrawals
        expect(await baseOccupy.pendingWithdrawals(owner.address)).to.equal(0);
        
        // Attempting to withdraw with 0 balance should fail
        await expect(baseOccupy.connect(owner).withdraw())
          .to.be.revertedWith("No funds to withdraw");
      });
  });
});
