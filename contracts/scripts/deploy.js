const hre = require("hardhat");

async function main() {
  console.log("Deploying CropPassport...");

  const CropPassport = await hre.ethers.getContractFactory("CropPassport");
  const cropPassport = await CropPassport.deploy();

  await cropPassport.waitForDeployment();
  const address = await cropPassport.getAddress();

  console.log(`CropPassport deployed to: ${address}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
