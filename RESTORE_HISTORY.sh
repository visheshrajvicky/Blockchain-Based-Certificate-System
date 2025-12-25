#!/bin/bash

# Script to restore git history from assignment folder
# This will preserve your changes while bringing back old commits

echo "========================================="
echo "Git History Restoration Script"
echo "========================================="
echo ""

# Navigate to Blockchain-Based-Certificate-System
cd "$(dirname "$0")"

# 1. Add the assignment folder as a remote
echo "Step 1: Adding original repository as remote..."
git remote add original-repo ../assignment/.git
git fetch original-repo

echo ""
echo "Step 2: Creating a backup branch with your current changes..."
git branch backup-current-state

echo ""
echo "Step 3: Retrieving old history..."
# Get the main branch from original repo
git fetch original-repo main:original-main

echo ""
echo "Step 4: Rebasing your changes on top of original history..."
# Find the base commit where you started
ORIGINAL_COMMIT=$(git log original-main --oneline | head -1 | awk '{print $1}')
echo "Original commit: $ORIGINAL_COMMIT"

# Create a new branch from original history
git checkout original-main
git checkout -b main-with-history

# Cherry-pick your changes (everything from your main branch that's not in original)
echo ""
echo "Step 5: Applying your changes on top of old history..."
git checkout main
FILES_CHANGED=$(git diff --name-only $ORIGINAL_COMMIT)

# Switch back and commit your changes
git checkout main-with-history
git checkout main -- .
git add -A
git commit -m "feat: Added blockchain-based certificate verification system

Major changes:
- Added blockchain module with Hardhat setup
- Implemented CertificateVerification smart contract
- Added certificate management module in backend
- Created certificate verification UI components
- Integrated Web3 functionality in frontend
- Added certificate-related database tables
- Updated student module with certificate features
"

echo ""
echo "========================================="
echo "History restoration complete!"
echo "========================================="
echo ""
echo "Current branch: main-with-history"
echo "Your changes are now on top of the old history"
echo ""
echo "To verify:"
echo "  git log --oneline -20"
echo ""
echo "To use this branch:"
echo "  git branch -D main"
echo "  git branch -m main-with-history main"
echo "  git push -f origin main  # Force push to update remote"
echo ""
echo "Your original state is saved in: backup-current-state"
echo ""
