# Mail-Fi Backend

A Node.js backend API for managing contacts and handling PYUSD transactions on Solana testnet.

## Features

- **Contacts Management**: Create, read, update, and delete contacts with wallet addresses
- **PYUSD Transactions**: Transfer PYUSD tokens on Solana testnet
- **Balance Checking**: Get SOL and PYUSD balances for any wallet
- **Transaction Tracking**: Query transaction details by signature
- **Testnet Support**: Airdrop SOL for testing purposes

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Edit `.env` and add your configuration:

```env
# Solana Configuration
SOLANA_NETWORK=devnet
SOLANA_RPC_URL=https://api.devnet.solana.com

# PYUSD Token Address (Testnet)
PYUSD_MINT_ADDRESS=CXk2AMBfi3TwaEL2468s6zP8xq9NxTXjp9gjMgzeUynM

# Server Configuration
PORT=3000

# Wallet Configuration (Add your wallet private key for testing)
# Generate a new wallet: solana-keygen new --outfile wallet.json
# Then copy the array from wallet.json
WALLET_PRIVATE_KEY=[your,private,key,array,here]
```

### 3. Generate a Test Wallet

If you don't have a Solana wallet, generate one:

```bash
# Install Solana CLI if not already installed
# Visit: https://docs.solana.com/cli/install-solana-cli-tools

# Generate a new wallet
solana-keygen new --outfile wallet.json

# Get the wallet address
solana address -k wallet.json

# Set to devnet
solana config set --url https://api.devnet.solana.com

# Airdrop some SOL for gas fees
solana airdrop 2 -k wallet.json
```

Copy the private key array from `wallet.json` to your `.env` file.

## Running the Server

### Development Mode (with auto-reload)

```bash
npm run dev
```

### Production Mode

```bash
npm start
```

The server will run on `http://localhost:3000` by default.

## API Endpoints

### Health Check

```
GET /
```

### Contacts

```
GET    /api/contacts                    - Get all contacts
POST   /api/contacts                    - Create a new contact
GET    /api/contacts/:id                - Get contact by ID
PUT    /api/contacts/:id                - Update contact
DELETE /api/contacts/:id                - Delete contact
GET    /api/contacts/wallet/:address    - Get contact by wallet address
```

#### Create Contact Example

```bash
curl -X POST http://localhost:3000/api/contacts \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "walletAddress": "ABC123..."
  }'
```

### Transactions

```
GET  /api/transactions/balance/:address       - Get wallet balance (SOL + PYUSD)
POST /api/transactions/transfer/contact       - Transfer PYUSD to a contact
POST /api/transactions/transfer/wallet        - Transfer PYUSD to any wallet
GET  /api/transactions/transaction/:signature - Get transaction details
POST /api/transactions/airdrop                - Airdrop SOL (testnet only)
```

#### Transfer to Contact Example

```bash
curl -X POST http://localhost:3000/api/transactions/transfer/contact \
  -H "Content-Type: application/json" \
  -d '{
    "contactId": 1,
    "amount": 10
  }'
```

#### Transfer to Wallet Example

```bash
curl -X POST http://localhost:3000/api/transactions/transfer/wallet \
  -H "Content-Type: application/json" \
  -d '{
    "walletAddress": "ABC123...",
    "amount": 10
  }'
```

#### Check Balance Example

```bash
curl http://localhost:3000/api/transactions/balance/YOUR_WALLET_ADDRESS
```

#### Airdrop SOL Example

```bash
curl -X POST http://localhost:3000/api/transactions/airdrop \
  -H "Content-Type: application/json" \
  -d '{
    "walletAddress": "YOUR_WALLET_ADDRESS",
    "amount": 1
  }'
```

## Project Structure

```
mail-fi-backend/
├── src/
│   ├── config/
│   │   └── solana.js           # Solana configuration
│   ├── controllers/
│   │   ├── contactController.js
│   │   └── transactionController.js
│   ├── models/
│   │   └── contact.js          # Contact data model
│   ├── routes/
│   │   ├── contactRoutes.js
│   │   └── transactionRoutes.js
│   ├── services/
│   │   └── solanaService.js    # Solana blockchain interactions
│   ├── app.js                  # Express app setup
│   └── server.js               # Server entry point
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

## Getting PYUSD on Testnet

1. Make sure your wallet has SOL for gas fees (use the airdrop endpoint)
2. Visit a PYUSD testnet faucet or use test tokens from Solana devnet
3. The PYUSD mint address for testnet is: `CXk2AMBfi3TwaEL2468s6zP8xq9NxTXjp9gjMgzeUynM`

## Notes

- This is a testnet implementation for development purposes
- In-memory storage is used for contacts (data will be lost on restart)
- For production, replace the in-memory storage with a proper database
- Keep your private keys secure and never commit them to version control
- The PYUSD mint address provided is for testing purposes

## Security

- Never commit your `.env` file
- Keep your wallet private keys secure
- This is for testnet/development only
- Implement proper authentication and authorization for production use

## License

ISC
