# Wallet Setup Guide

You have **2 options** for setting up your wallet:

## Option 1: Use Your Phantom Wallet (Use Existing PYUSD)

### Step 1: Export Private Key from Phantom

1. Open **Phantom Wallet** browser extension
2. Click the **Settings** icon (⚙️ gear icon)
3. Go to **"Security & Privacy"**
4. Click **"Export Private Key"**
5. Enter your **password**
6. **Copy** the private key (it's a long base58 string)

### Step 2: Convert to Array Format

Run this command with your Phantom private key:

```bash
node scripts/convert-key.js YOUR_PHANTOM_PRIVATE_KEY_HERE
```

Example:
```bash
node scripts/convert-key.js 5JXxN7qXN8fGxhGxN8fGxhGxN8fGxhGxN8fGxh...
```

### Step 3: Copy to .env

The script will output something like:
```
WALLET_PRIVATE_KEY=[123,45,67,89,...]
```

Copy this entire line into your `.env` file.

---

## Option 2: Generate a New Test Wallet (Recommended for Development)

### Step 1: Generate New Wallet

```bash
node scripts/wallet-utils.js
```

This will create a NEW wallet and show you:
- Public Key (your wallet address)
- Private Key in array format

### Step 2: Copy to .env

Copy the `WALLET_PRIVATE_KEY=[...]` line to your `.env` file

### Step 3: Fund Your New Wallet

**Get SOL for gas fees:**
```bash
# Visit Solana Faucet
# https://faucet.solana.com/
# Paste your wallet address and request airdrop

# OR use the API endpoint (after starting the server):
curl -X POST http://localhost:3000/api/transactions/airdrop \
  -H "Content-Type: application/json" \
  -d '{
    "walletAddress": "YOUR_NEW_WALLET_ADDRESS",
    "amount": 1
  }'
```

**Get PYUSD for testing:**

You'll need to transfer PYUSD from your Phantom wallet to this new wallet, or:
1. Visit a PYUSD testnet faucet (if available)
2. Use a testnet exchange
3. Transfer from your Phantom wallet to the new test wallet

---

## Complete .env Setup

After getting your private key, your `.env` should look like:

```env
# Solana Configuration
SOLANA_NETWORK=devnet
SOLANA_RPC_URL=https://api.devnet.solana.com

# PYUSD Token Address (Testnet)
PYUSD_MINT_ADDRESS=CXk2AMBfi3TwaEL2468s6zP8xq9NxTXjp9gjMgzeUynM

# Server Configuration
PORT=3000

# Your Wallet Private Key (from Option 1 or 2 above)
WALLET_PRIVATE_KEY=[123,45,67,89,101,112,...]
```

---

## Security Warning ⚠️

- **NEVER** commit your `.env` file to git
- **NEVER** share your private key
- For **production**, use a dedicated wallet with minimal funds
- For **testing**, use Option 2 (new test wallet)

---

## Start the Server

Once your `.env` is configured:

```bash
npm start
```

Your backend will be ready at `http://localhost:3000`! 🚀
