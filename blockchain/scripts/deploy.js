const hre = require("hardhat");

async function main() {
  console.log("Deploying CertificateVerification contract...");

  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", hre.ethers.formatEther(balance), "ETH");

  // Deploy the contract
  const CertificateVerification = await hre.ethers.getContractFactory("CertificateVerification");
  const certificate = await CertificateVerification.deploy();

  await certificate.waitForDeployment();

  const contractAddress = await certificate.getAddress();
  console.log("CertificateVerification deployed to:", contractAddress);

  // Wait for block confirmations (only for non-localhost networks)
  if (hre.network.name !== "localhost" && hre.network.name !== "hardhat") {
    console.log("Waiting for block confirmations...");
    await certificate.deploymentTransaction().wait(5);
  } else {
    console.log("Localhost network detected - skipping confirmations");
    // For localhost, just wait for 1 confirmation
    await certificate.deploymentTransaction().wait(1);
  }

  console.log("\n=== Deployment Summary ===");
  console.log("Contract Address:", contractAddress);
  console.log("Deployer Address:", deployer.address);
  console.log("Network:", hre.network.name);
  console.log("Chain ID:", hre.network.config.chainId);

  // Save deployment info
  const fs = require("fs");
  const deploymentInfo = {
    contractAddress: contractAddress,
    deployer: deployer.address,
    network: hre.network.name,
    chainId: hre.network.config.chainId,
    deploymentDate: new Date().toISOString()
  };

  fs.writeFileSync(
    `./deployments/${hre.network.name}-deployment.json`,
    JSON.stringify(deploymentInfo, null, 2)
  );

  console.log(`\nDeployment info saved to ./deployments/${hre.network.name}-deployment.json`);

  // Verify on block explorer if not localhost
  if (hre.network.name !== "localhost" && hre.network.name !== "hardhat") {
    console.log("\nWaiting before verification...");
    await new Promise(resolve => setTimeout(resolve, 30000)); // Wait 30 seconds

    try {
      await hre.run("verify:verify", {
        address: contractAddress,
        constructorArguments: []
      });
      console.log("Contract verified on block explorer");
    } catch (error) {
      console.log("Verification failed:", error.message);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
