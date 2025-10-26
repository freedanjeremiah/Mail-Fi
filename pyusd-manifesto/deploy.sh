#!/bin/bash

# PYUSD Manifesto Contracts - Build and Deploy Script
# This script builds and deploys all Solana contracts to devnet

set -e  # Exit on error

echo "======================================"
echo "PYUSD Manifesto - Deployment Script"
echo "======================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Solana CLI is installed
if ! command -v solana &> /dev/null; then
    echo -e "${RED}Error: Solana CLI not found${NC}"
    echo "Please install Solana CLI first:"
    echo "sh -c \"\$(curl -sSfL https://release.solana.com/stable/install)\""
    exit 1
fi

# Check if Anchor CLI is installed
if ! command -v anchor &> /dev/null; then
    echo -e "${RED}Error: Anchor CLI not found${NC}"
    echo "Please install Anchor CLI first:"
    echo "cargo install --git https://github.com/coral-xyz/anchor avm --locked --force"
    echo "avm install 0.32.1"
    echo "avm use 0.32.1"
    exit 1
fi

echo -e "${GREEN}✓ Solana CLI found: $(solana --version)${NC}"
echo -e "${GREEN}✓ Anchor CLI found: $(anchor --version)${NC}"
echo ""

# Check Solana config
echo "Checking Solana configuration..."
CLUSTER=$(solana config get | grep "RPC URL" | awk '{print $3}')
echo "Current cluster: $CLUSTER"

if [[ $CLUSTER != *"devnet"* ]]; then
    echo -e "${YELLOW}Warning: Not on devnet. Switching to devnet...${NC}"
    solana config set --url https://api.devnet.solana.com
fi

# Check wallet balance
echo ""
echo "Checking wallet balance..."
BALANCE=$(solana balance | awk '{print $1}')
echo "Current balance: $BALANCE SOL"

if (( $(echo "$BALANCE < 1" | bc -l) )); then
    echo -e "${YELLOW}Low balance detected. Requesting airdrop...${NC}"
    solana airdrop 2 || echo -e "${YELLOW}Airdrop failed. Please fund your wallet manually.${NC}"
    sleep 2
    BALANCE=$(solana balance | awk '{print $1}')
    echo "New balance: $BALANCE SOL"
fi

# Build contracts
echo ""
echo "======================================"
echo "Building Contracts..."
echo "======================================"
anchor build

if [ $? -ne 0 ]; then
    echo -e "${RED}Build failed!${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Build successful${NC}"

# Deploy contracts
echo ""
echo "======================================"
echo "Deploying to Devnet..."
echo "======================================"
anchor deploy

if [ $? -ne 0 ]; then
    echo -e "${RED}Deployment failed!${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Deployment successful${NC}"

# Get program ID
PROGRAM_ID=$(solana address -k target/deploy/pyusd_manifesto_contracts-keypair.json)

echo ""
echo "======================================"
echo "Deployment Complete!"
echo "======================================"
echo -e "${GREEN}Program ID: ${PROGRAM_ID}${NC}"
echo ""
echo "Next steps:"
echo "1. Update Anchor.toml with the new Program ID"
echo "2. Update lib/contracts/program-id.ts with: export const PROGRAM_ID = new PublicKey('${PROGRAM_ID}');"
echo "3. Update lib/contracts/anchor-setup.ts if needed"
echo "4. Test the deployment with: npm run dev"
echo ""
echo "Verify deployment:"
echo "solana program show ${PROGRAM_ID}"
echo ""
echo "View on Explorer:"
echo "https://explorer.solana.com/address/${PROGRAM_ID}?cluster=devnet"
echo ""
