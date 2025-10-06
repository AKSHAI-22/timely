const { ethers } = require("hardhat");
const fs = require('fs');
const path = require('path');

async function main() {
  console.log("Starting deployment of LedgerSentinels contracts...");
  
  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", ethers.formatEther(await deployer.provider.getBalance(deployer.address)), "ETH");

  const platformWallet = deployer.address; // Use deployer as platform wallet for now
  
  try {
    // 1. Deploy TimeSlotNFT
    console.log("\n1. Deploying TimeSlotNFT...");
    const TimeSlotNFT = await ethers.getContractFactory("TimeSlotNFT");
    const timeSlotNFT = await TimeSlotNFT.deploy(platformWallet);
    await timeSlotNFT.waitForDeployment();
    const timeSlotNFTAddress = await timeSlotNFT.getAddress();
    console.log("TimeSlotNFT deployed to:", timeSlotNFTAddress);

    // 2. Deploy TimeSlotMarketplace
    console.log("\n2. Deploying TimeSlotMarketplace...");
    const TimeSlotMarketplace = await ethers.getContractFactory("TimeSlotMarketplace");
    const marketplace = await TimeSlotMarketplace.deploy(timeSlotNFTAddress, platformWallet);
    await marketplace.waitForDeployment();
    const marketplaceAddress = await marketplace.getAddress();
    console.log("TimeSlotMarketplace deployed to:", marketplaceAddress);

    // 3. Deploy TimeSlotEscrow
    console.log("\n3. Deploying TimeSlotEscrow...");
    const TimeSlotEscrow = await ethers.getContractFactory("TimeSlotEscrow");
    const escrow = await TimeSlotEscrow.deploy(timeSlotNFTAddress, platformWallet);
    await escrow.waitForDeployment();
    const escrowAddress = await escrow.getAddress();
    console.log("TimeSlotEscrow deployed to:", escrowAddress);

    // 4. Deploy ReviewSystem
    console.log("\n4. Deploying ReviewSystem...");
    const ReviewSystem = await ethers.getContractFactory("ReviewSystem");
    const reviewSystem = await ReviewSystem.deploy(timeSlotNFTAddress, escrowAddress);
    await reviewSystem.waitForDeployment();
    const reviewSystemAddress = await reviewSystem.getAddress();
    console.log("ReviewSystem deployed to:", reviewSystemAddress);

    // 5. Deploy UserRegistry
    console.log("\n5. Deploying UserRegistry...");
    const UserRegistry = await ethers.getContractFactory("UserRegistry");
    const userRegistry = await UserRegistry.deploy();
    await userRegistry.waitForDeployment();
    const userRegistryAddress = await userRegistry.getAddress();
    console.log("UserRegistry deployed to:", userRegistryAddress);

    // 6. Deploy TimeSlotFactory
    console.log("\n6. Deploying TimeSlotFactory...");
    const TimeSlotFactory = await ethers.getContractFactory("TimeSlotFactory");
    const factory = await TimeSlotFactory.deploy(platformWallet);
    await factory.waitForDeployment();
    const factoryAddress = await factory.getAddress();
    console.log("TimeSlotFactory deployed to:", factoryAddress);

    // 7. Initialize the factory with all contracts
    console.log("\n7. Initializing TimeSlotFactory...");
    const initTx = await factory.initializeSystem();
    await initTx.wait();
    console.log("TimeSlotFactory initialized successfully");

    // 8. Verify contract addresses from factory
    console.log("\n8. Verifying deployed contracts...");
    const systemAddresses = await factory.getSystemAddresses();
    console.log("System addresses from factory:");
    console.log("- TimeSlotNFT:", systemAddresses._timeSlotNFT);
    console.log("- Marketplace:", systemAddresses._marketplace);
    console.log("- Escrow:", systemAddresses._escrow);
    console.log("- ReviewSystem:", systemAddresses._reviewSystem);
    console.log("- UserRegistry:", systemAddresses._userRegistry);

    // 9. Save contract addresses
    const contractAddresses = {
      TimeSlotNFT: timeSlotNFTAddress,
      TimeSlotMarketplace: marketplaceAddress,
      TimeSlotEscrow: escrowAddress,
      ReviewSystem: reviewSystemAddress,
      UserRegistry: userRegistryAddress,
      TimeSlotFactory: factoryAddress,
      PlatformWallet: platformWallet,
      Deployer: deployer.address,
      Network: await deployer.provider.getNetwork().then(n => n.name),
      ChainId: await deployer.provider.getNetwork().then(n => n.chainId.toString()),
      DeploymentTime: new Date().toISOString(),
    };

    // Save to contract-addresses.json
    const addressesPath = path.join(__dirname, '../contract-addresses.json');
    fs.writeFileSync(addressesPath, JSON.stringify(contractAddresses, null, 2));
    console.log("\n9. Contract addresses saved to:", addressesPath);

    // 10. Create deployment summary
    const deploymentSummary = {
      ...contractAddresses,
      DeploymentSummary: {
        TotalContracts: 6,
        GasUsed: "See transaction receipts for details",
        DeployerBalance: ethers.formatEther(await deployer.provider.getBalance(deployer.address)) + " ETH",
        Status: "SUCCESS"
      }
    };

    const summaryPath = path.join(__dirname, '../deployment-summary.json');
    fs.writeFileSync(summaryPath, JSON.stringify(deploymentSummary, null, 2));
    console.log("Deployment summary saved to:", summaryPath);

    console.log("\n✅ All contracts deployed successfully!");
    console.log("\n📋 Deployment Summary:");
    console.log("- TimeSlotNFT:", timeSlotNFTAddress);
    console.log("- TimeSlotMarketplace:", marketplaceAddress);
    console.log("- TimeSlotEscrow:", escrowAddress);
    console.log("- ReviewSystem:", reviewSystemAddress);
    console.log("- UserRegistry:", userRegistryAddress);
    console.log("- TimeSlotFactory:", factoryAddress);
    console.log("- Platform Wallet:", platformWallet);
    console.log("- Network:", contractAddresses.Network);
    console.log("- Chain ID:", contractAddresses.ChainId);

    console.log("\n🔧 Next Steps:");
    console.log("1. Update your frontend with the new contract addresses");
    console.log("2. Update your backend environment variables");
    console.log("3. Test the contracts with sample data");
    console.log("4. Deploy to mainnet when ready");

  } catch (error) {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  }
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
