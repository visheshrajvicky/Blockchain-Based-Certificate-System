# Certificate Management Module

## Overview
The Certificate Management module provides blockchain-based certificate issuance, verification, and management capabilities. Certificates are stored on-chain for tamper-proof verification while metadata is stored on IPFS for decentralized access.

## Features
- ✅ Issue blockchain-verified certificates to students
- ✅ Store certificate metadata on IPFS
- ✅ Verify certificate authenticity using blockchain
- ✅ Revoke certificates with on-chain recording
- ✅ View detailed certificate information
- ✅ Public certificate verification page

## Pages

### 1. List Certificates (`/app/certificates`)
- Displays all issued certificates in a sortable table
- Shows certificate number, student name, type, course, grade, issue date, and status
- Provides quick actions to view certificate details
- Link to issue new certificates

### 2. Issue Certificate (`/app/certificates/issue`)
- Form to issue new certificates to students
- Requires Web3 wallet connection (MetaMask)
- Fields:
  - Student selection (dropdown)
  - Certificate type selection (dropdown)
  - Course name (text input)
  - Grade (text input)
- On submit:
  1. Creates certificate record in database
  2. Uploads metadata to IPFS
  3. Records certificate on blockchain via smart contract
  4. Updates database with blockchain transaction details

### 3. View Certificate (`/app/certificates/:id`)
- Displays comprehensive certificate details
- Shows student information, certificate details, and blockchain verification data
- Provides links to view transaction on block explorer
- Shows IPFS hash for metadata
- Allows authorized users to revoke certificates
- Displays revocation information if certificate is revoked

### 4. Verify Certificate (`/app/certificates/verify`)
- Public-facing verification page
- Users enter certificate number to verify authenticity
- Queries blockchain to confirm certificate validity
- Shows certificate details if found and valid
- Indicates if certificate has been revoked
- No login required

## Web3 Integration

### Required Setup
1. Install MetaMask browser extension
2. Connect wallet to application
3. Ensure wallet is on correct network (configured in contract.ts)

### Supported Networks
- Hardhat Local (chainId: 31337) - for development
- Polygon Mumbai Testnet (chainId: 80001) - for testing
- Polygon Mainnet (chainId: 137) - for production

### Web3Context
The application provides a Web3Context that manages:
- Wallet connection state
- Account address
- Network switching
- Provider and signer instances

Usage:
```tsx
import { useWeb3 } from '@/contexts/Web3Context';

const MyComponent = () => {
  const { account, connectWallet, isConnected, switchToCorrectNetwork } = useWeb3();
  
  // Use Web3 functionality
};
```

## API Endpoints

### Backend Endpoints
- `GET /api/v1/certificates` - List all certificates
- `GET /api/v1/certificates/:id` - Get certificate by ID
- `POST /api/v1/certificates/verify` - Verify certificate by number (public)
- `POST /api/v1/certificates/issue` - Issue new certificate
- `PUT /api/v1/certificates/:id/blockchain` - Update blockchain data
- `PUT /api/v1/certificates/:id/revoke` - Revoke certificate
- `GET /api/v1/certificates/types` - Get certificate types

### RTK Query Hooks
```tsx
import {
  useGetCertificatesQuery,
  useGetCertificateByIdQuery,
  useVerifyCertificateMutation,
  useIssueCertificateMutation,
  useRevokeCertificateMutation,
  useGetCertificateTypesQuery
} from '@/domains/certificates/api/certificate-api';
```

## Smart Contract

### Contract: `CertificateVerification.sol`
Deployed on blockchain networks, handles:
- Issuing certificates with unique IDs
- Recording certificate metadata hash (IPFS)
- Revoking certificates
- Verifying certificate existence and status
- Role-based access control (ISSUER_ROLE)

### Key Functions
```solidity
function issueCertificate(
  address student,
  string memory certificateNumber,
  string memory metadataHash
) public onlyRole(ISSUER_ROLE) returns (uint256)

function verifyCertificate(uint256 certificateId) 
  public view returns (bool isValid, bool isRevoked)

function revokeCertificate(uint256 certificateId) 
  public onlyRole(ISSUER_ROLE)
```

## Database Schema

### Main Tables
- `certificates` - Core certificate data
- `certificate_types` - Available certificate types
- `certificate_templates` - Templates for certificate generation
- `certificate_verifications` - Verification attempt logs
- `blockchain_config` - Blockchain network configurations
- `ipfs_config` - IPFS provider configurations

## Setup Instructions

### 1. Backend Setup
```bash
cd backend

# Install dependencies
npm install

# Configure environment variables in .env
BLOCKCHAIN_NETWORK=localhost
CONTRACT_ADDRESS=0x...
PRIVATE_KEY=0x...
IPFS_PROVIDER=pinata
PINATA_API_KEY=your_key
PINATA_SECRET_KEY=your_secret

# Run database migrations
npm run migrate

# Start server
npm start
```

### 2. Blockchain Setup
```bash
cd blockchain

# Install dependencies
npm install

# Start local Hardhat node
npm run node

# Deploy contract (in new terminal)
npm run deploy:localhost

# Run tests
npm test
```

### 3. Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Configure environment variables in .env
VITE_CONTRACT_ADDRESS=0x...
VITE_BLOCKCHAIN_NETWORK=localhost

# Start development server
npm run dev
```

## User Guide

### For Administrators

#### Issuing a Certificate
1. Navigate to "Certificates" in the admin panel
2. Click "Issue Certificate" button
3. Connect your MetaMask wallet if not already connected
4. Fill in certificate details:
   - Select student from dropdown
   - Choose certificate type
   - Enter course name
   - Enter grade
5. Click "Issue Certificate"
6. Approve the blockchain transaction in MetaMask
7. Wait for confirmation (certificate will be recorded on blockchain)

#### Viewing Certificates
1. Navigate to "Certificates" in the admin panel
2. Browse or search the certificate list
3. Click "View" to see full details
4. View blockchain transaction on block explorer by clicking transaction hash link

#### Revoking a Certificate
1. Navigate to certificate details page
2. Click "Revoke" button
3. Enter reason for revocation
4. Confirm revocation
5. Certificate will be marked as revoked on blockchain

### For Public Users

#### Verifying a Certificate
1. Navigate to the verification page (`/app/certificates/verify`)
2. Enter the certificate number
3. Click "Verify"
4. View certificate details and blockchain verification status
5. Check if certificate is valid or revoked

## Troubleshooting

### Common Issues

**MetaMask not connecting**
- Ensure MetaMask is installed
- Refresh the page
- Check that MetaMask is unlocked

**Wrong network error**
- Click "Switch Network" button
- Approve network switch in MetaMask
- Or manually switch to correct network in MetaMask

**Transaction failing**
- Ensure you have sufficient gas fees
- Check that wallet has ISSUER_ROLE in smart contract
- Verify contract address is correct

**Certificate not found**
- Check certificate number is correct
- Verify certificate has been issued
- Confirm database connection

**IPFS upload failing**
- Verify IPFS API credentials
- Check network connectivity
- Ensure IPFS provider is configured correctly

## Security Considerations

1. **Private Keys**: Never commit private keys to version control
2. **Role Management**: Only grant ISSUER_ROLE to trusted addresses
3. **Certificate Verification**: Always verify certificates against blockchain
4. **Revocation**: Revoked certificates remain on-chain but marked as invalid
5. **Metadata**: Sensitive data should not be stored in IPFS metadata

## Development Notes

- Smart contract uses OpenZeppelin v5 contracts
- Frontend uses Ethers.js v6 for Web3 interactions
- IPFS integration supports multiple providers (Pinata, Infura)
- Database schema designed for scalability
- All blockchain operations are logged in database
- Certificate verification is fully decentralized once on blockchain

## Future Enhancements

- [ ] Batch certificate issuance
- [ ] PDF certificate generation
- [ ] Email notifications for issued certificates
- [ ] Certificate expiration dates
- [ ] Certificate transfer functionality
- [ ] Multi-signature issuance
- [ ] Integration with other blockchain networks
- [ ] Mobile app for certificate verification
