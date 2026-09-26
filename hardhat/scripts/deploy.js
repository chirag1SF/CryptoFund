import hre from "hardhat";

async function main() {
  const Factory = await hre.ethers.getContractFactory("CrowdfundFactory");
  const factory = await Factory.deploy();

  await factory.waitForDeployment();

  console.log("Address of Deployed Factory Contract:", factory.target);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
