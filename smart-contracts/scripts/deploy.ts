import { ethers } from "hardhat";

async function main() {
  const baseOccupy = await ethers.deployContract("BaseOccupy");

  await baseOccupy.waitForDeployment();

  console.log(`BaseOccupy deployed to ${baseOccupy.target}`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
