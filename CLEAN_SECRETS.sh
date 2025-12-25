#!/bin/bash

# Script to remove sensitive data from git history
# This will rewrite git history to remove secrets from backend/.env

echo "========================================="
echo "Git History Cleaner - Remove Secrets"
echo "========================================="
echo ""
echo "⚠️  WARNING: This will rewrite git history!"
echo "⚠️  Make sure you have a backup before proceeding"
echo ""

cd "$(dirname "$0")"

# Create a backup branch
echo "Step 1: Creating backup branch..."
git branch backup-before-cleaning

# Check if .env file is in gitignore
echo ""
echo "Step 2: Ensuring .env is in .gitignore..."
if ! grep -q "^\.env$" backend/.gitignore 2>/dev/null && ! grep -q "^\.env$" .gitignore 2>/dev/null; then
    echo ".env" >> backend/.gitignore
    echo "Added .env to backend/.gitignore"
fi

# Method 1: Using git filter-branch (built-in)
echo ""
echo "Step 3: Removing backend/.env from all commits..."
echo "This may take a minute..."

git filter-branch --force --index-filter \
  'git rm --cached --ignore-unmatch backend/.env' \
  --prune-empty --tag-name-filter cat -- --all

echo ""
echo "Step 4: Cleaning up refs..."
rm -rf .git/refs/original/
git reflog expire --expire=now --all
git gc --prune=now --aggressive

echo ""
echo "========================================="
echo "✅ Git history cleaned!"
echo "========================================="
echo ""
echo "The file backend/.env has been removed from all commits"
echo ""
echo "📋 Next steps:"
echo "1. Verify the history is clean:"
echo "   git log --all --full-history -- backend/.env"
echo "   (should show nothing)"
echo ""
echo "2. Force push to remote (THIS WILL OVERWRITE REMOTE HISTORY):"
echo "   git push origin --force --all"
echo ""
echo "3. ⚠️ CRITICAL: Revoke ALL exposed secrets immediately:"
echo "   - Database passwords"
echo "   - API keys (Infura, etc.)"
echo "   - JWT secrets"
echo "   - Any other credentials"
echo ""
echo "Your backup is in branch: backup-before-cleaning"
echo ""
