# Blockchain Certificate Verification System

## Overview
This directory contains the smart contract infrastructure for blockchain-based certificate verification.

## Features
- Issue certificates on blockchain (Ethereum/Polygon)
- Verify certificate authenticity
- Revoke certificates when needed
- Role-based access control (Admin, Issuer)
- IPFS integration for certificate metadata

## Smart Contract Architecture

### CertificateVerification.sol
Main contract for certificate management with:
- **issueCertificate**: Issue new certificates (Issuer role required)
- **verifyCertificate**: Verify certificate validity
- **revokeCertificate**: Revoke certificates (Admin role required)
- **getStudentCertificates**: Get all certificates for a student

## Quick Start Guide (For New Developers)

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- MetaMask browser extension

### Step 1: Install Dependencies
```bash
cd blockchain
npm install
```

### Step 2: Start Local Blockchain

**Open Terminal 1** - Keep this running during development:
```bash
cd blockchain
npx hardhat node
```

This will:
- Start a local Ethereum blockchain on `http://127.0.0.1:8545`
- Create 20 test accounts with 10,000 ETH each
- Display account addresses and private keys
- Keep the blockchain running until you stop it (Ctrl+C)

**Important:** Copy the first account's address and private key - you'll need these for MetaMask.

### Step 3: Deploy Contracts and Setup Roles

**Open Terminal 2** - Run the setup script:
```bash
cd blockchain
./scripts/setup-local-blockchain.sh
```

This automated script will:
1. Deploy the CertificateVerification contract
2. Grant ISSUER_ROLE to your MetaMask wallet
3. Display the contract address

**Alternative:** Run commands manually:
```bash
# Deploy contract
npx hardhat run scripts/deploy.js --network localhost

# Grant ISSUER_ROLE (replace with your MetaMask address)
TARGET_ADDRESS=0xYourMetaMaskAddress npx hardhat run scripts/grant-issuer-role.js --network localhost
```

### Step 4: Configure MetaMask

1. Open MetaMask browser extension
2. Add Local Network:
   - Click network dropdown → "Add Network" → "Add a network manually"
   - **Network Name:** Localhost 8545
   - **RPC URL:** http://127.0.0.1:8545
   - **Chain ID:** 31337
   - **Currency Symbol:** ETH
3. Import Test Account:
   - Click account icon → "Import Account"
   - Paste the private key from Terminal 1 (Account #1)
   - You should see 10,000 ETH balance

### Step 5: Verify Setup

Check if everything is working:
```bash
# In Terminal 2
cd blockchain
npx hardhat console --network localhost
```

Then in the console:
```javascript
const contract = await ethers.getContractAt("CertificateVerification", "0x5FbDB2315678afecb367f032d93F642f64180aa3");
await contract.ISSUER_ROLE();
// Should return: 0x114e74f6ea3bd819998f78687bfcb11b140da08e9b7d222fa9c1f1ba1f2aa122
```

Type `.exit` to exit the console.

## Development Workflow

### Daily Development
1. **Start Hardhat node** (Terminal 1 - keep running)
   ```bash
   npx hardhat node
   ```

2. **If you restart the node, redeploy contracts** (Terminal 2)
   ```bash
   ./scripts/setup-local-blockchain.sh
   ```

3. **Start your backend and frontend servers** (separate terminals)
   ```bash
   # Terminal 3 - Backend
   cd ../backend
   npm run start
   
   # Terminal 4 - Frontend
   cd ../frontend
   npm run dev
   ```

### Important Notes
- **Hardhat node data is ephemeral** - all data is lost when you stop the node
- **Keep Terminal 1 running** to avoid redeploying contracts
- **Contract address stays the same** (0x5FbDB2315678afecb367f032d93F642f64180aa3) if deployed in same order
- **MetaMask transactions require confirmation** - watch for popup notifications

## Compile Contracts
```bash
npm run compile
```

## Run Tests
```bash
npm test
```

## Deploy to Other Networks

### Testnet (Sepolia)
```bash
npm run deploy:sepolia
```

### Polygon Mumbai Testnet
```bash
npm run deploy:mumbai
```

### Production (Polygon Mainnet)
```bash
npm run deploy:polygon
```

## Troubleshooting

### Issue: "Cannot connect to network localhost"
**Solution:** Make sure Hardhat node is running in Terminal 1
```bash
npx hardhat node
```

### Issue: "Transaction reverted without reason" or "No events emitted"
**Solution:** Your wallet doesn't have ISSUER_ROLE. Grant it:
```bash
TARGET_ADDRESS=0xYourWalletAddress npx hardhat run scripts/grant-issuer-role.js --network localhost
```

### Issue: MetaMask shows "Nonce too high" error
**Solution:** Reset MetaMask account:
- MetaMask Settings → Advanced → Clear activity tab data

### Issue: Contract not found at address
**Solution:** Redeploy the contract:
```bash
npx hardhat run scripts/deploy.js --network localhost
```

### Issue: "duplicate key value violates unique constraint"
**Solution:** This was caused by hardcoded blockchain IDs. It's now fixed - each certificate gets a unique ID from the smart contract.

## Useful Commands

```bash
# Check if contract is deployed
npx hardhat console --network localhost
> const contract = await ethers.getContractAt("CertificateVerification", "0x5FbDB2315678afecb367f032d93F642f64180aa3");

# Check if address has ISSUER_ROLE
> const ISSUER_ROLE = await contract.ISSUER_ROLE();
> await contract.hasRole(ISSUER_ROLE, "0xYourAddress");

# Get certificate by ID
> await contract.getCertificate(1);

# Grant role to another address
> await contract.grantRole(ISSUER_ROLE, "0xNewIssuerAddress");
```

## Contract Addresses

After deployment, contract addresses are saved in `./deployments/` directory.

**Default Localhost Address:** `0x5FbDB2315678afecb367f032d93F642f64180aa3`

## Integration

### Backend Integration
Add the contract address and ABI to your backend environment:
```env
CERTIFICATE_CONTRACT_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
CERTIFICATE_CONTRACT_NETWORK=localhost
BLOCKCHAIN_NETWORK=localhost
```

### Frontend Integration
The contract ABI is available at:
`artifacts/contracts/CertificateVerification.sol/CertificateVerification.json`

## Security Considerations

1. **Access Control**: Only authorized issuers can create certificates
2. **Immutability**: Once issued, certificate data cannot be altered (only revoked)
3. **Verification**: Anyone can verify certificates without authentication
4. **Role Management**: Admin can add/remove issuers

## Gas Optimization

Contract is optimized with:
- Solidity 0.8.20 with optimizer enabled
- ReentrancyGuard for security
- Efficient data structures

## License
MIT
