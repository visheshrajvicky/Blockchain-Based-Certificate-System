const hre = require("hardhat");

async function main() {
  // Get contract address from environment variable or use default
  const contractAddress = process.env.CONTRACT_ADDRESS || "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  
  // Get the address to grant role to from environment variable
  const targetAddress = process.env.TARGET_ADDRESS;

  console.log("\n=== Granting ISSUER_ROLE ===");
  console.log("Contract Address:", contractAddress);

  // Get the contract instance
  const CertificateVerification = await hre.ethers.getContractFactory("CertificateVerification");
  const contract = CertificateVerification.attach(contractAddress);

  // Get the ISSUER_ROLE constant
  const ISSUER_ROLE = await contract.ISSUER_ROLE();
  console.log("ISSUER_ROLE:", ISSUER_ROLE);

  const [deployer] = await hre.ethers.getSigners();
  console.log("Granting role from account:", deployer.address);

  // If no target address provided, use deployer address
  const addressToGrant = targetAddress || deployer.address;
  console.log("Granting role to:", addressToGrant);

  // Check if already has role
  const hasRole = await contract.hasRole(ISSUER_ROLE, addressToGrant);
  if (hasRole) {
    console.log("\n✅ Address already has ISSUER_ROLE");
    return;
  }

  // Grant the role
  console.log("\nGranting ISSUER_ROLE...");
  const tx = await contract.grantRole(ISSUER_ROLE, addressToGrant);
  console.log("Transaction hash:", tx.hash);
  
  await tx.wait();
  console.log("\n✅ ISSUER_ROLE granted successfully!");

  // Verify the role was granted
  const verifyRole = await contract.hasRole(ISSUER_ROLE, addressToGrant);
  console.log("Role verification:", verifyRole ? "SUCCESS" : "FAILED");

  console.log("\n=== Summary ===");
  console.log("Address", addressToGrant, "can now issue certificates");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
