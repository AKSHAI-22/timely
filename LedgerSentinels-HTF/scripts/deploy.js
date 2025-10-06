const hre = require("hardhat");

async function main() {
  console.log("This script is deprecated. Please use scripts/deploy-all.js for full deployment.");
  console.log("Running legacy deployment for TimeSlotNFT only...");
  
  const signers = await hre.ethers.getSigners();
  
  if (signers.length === 0) {
    throw new Error("No signers found. Please check your .env file and make sure you have a valid PRIVATE_KEY.");
  }
  
  const deployer = signers[0];
  
  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await hre.ethers.provider.getBalance(deployer.address)).toString());

  // Deploy TimeSlotNFT contract
  const TimeSlotNFT = await hre.ethers.getContractFactory("TimeSlotNFT");
  const timeSlotNFT = await TimeSlotNFT.deploy(deployer.address); // Platform wallet is deployer for now

  await timeSlotNFT.waitForDeployment();

  console.log("TimeSlotNFT deployed to:", await timeSlotNFT.getAddress());
  console.log("Note: This is a legacy deployment. Use deploy-all.js for complete system deployment.");
  
  // Save contract addresses
  const fs = require('fs');
  const contractAddresses = {
    TimeSlotNFT: await timeSlotNFT.getAddress(),
    network: hre.network.name,
    deployer: deployer.address
  };
  
  fs.writeFileSync(
    './contract-addresses.json',
    JSON.stringify(contractAddresses, null, 2)
  );
  
  console.log("Contract addresses saved to contract-addresses.json");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
