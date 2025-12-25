#!/bin/bash

# Setup script for local blockchain development
# This script deploys contracts and grants roles

# Get the directory where the script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
# Get the blockchain directory (parent of scripts)
BLOCKCHAIN_DIR="$( cd "$SCRIPT_DIR/.." && pwd )"

# Change to blockchain directory
cd "$BLOCKCHAIN_DIR"

echo "🚀 Setting up local blockchain..."
echo "Working directory: $(pwd)"

# Deploy contracts
echo ""
echo "📝 Deploying CertificateVerification contract..."
npx hardhat run scripts/deploy.js --network localhost

if [ $? -ne 0 ]; then
    echo "❌ Deployment failed!"
    exit 1
fi

# Wait a moment for deployment to complete
sleep 2

# Grant ISSUER_ROLE to the default MetaMask account
echo ""
echo "🔑 Granting ISSUER_ROLE..."
TARGET_ADDRESS=0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199 npx hardhat run scripts/grant-issuer-role.js --network localhost

if [ $? -ne 0 ]; then
    echo "❌ Role grant failed!"
    exit 1
fi

echo ""
echo "✅ Setup complete! You can now issue certificates."
