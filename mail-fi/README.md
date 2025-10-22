# Mail-Fi Frontend (Next.js)

A modern Next.js frontend for sending PYUSD on Solana testnet using Phantom Wallet.

## Features

✅ **Next.js 16** with App Router
✅ **TypeScript** for type safety
✅ **Tailwind CSS** for beautiful styling
✅ **Solana Wallet Adapter** for seamless wallet integration
✅ **PYUSD Transactions** on Solana devnet
✅ **Contacts Management** with localStorage
✅ **Real-time Balance Updates**

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 3. Connect Phantom Wallet

1. Make sure Phantom wallet is installed
2. Switch to **Solana Devnet** in Phantom settings
3. Click "Select Wallet" button
4. Approve the connection

### 4. Get Test Tokens

**Get SOL for gas fees:**
- Visit: https://faucet.solana.com/
- Enter your wallet address
- Request airdrop

**Get PYUSD for testing:**
- PYUSD Mint: `CXk2AMBfi3TwaEL2468s6zP8xq9NxTXjp9gjMgzeUynM`
- Visit Solana testnet faucet or transfer from another wallet

## Usage

### Send PYUSD

1. Enter recipient's Solana wallet address
2. Enter amount in PYUSD
3. Click "Send PYUSD"
4. Approve transaction in Phantom

### Manage Contacts

1. Enter contact name and wallet address
2. Click "Add Contact"
3. Use "Send" button for quick transactions
4. Delete contacts as needed

## Project Structure

```
mail-fi-frontend/
├── app/
│   ├── layout.tsx      # Root layout with WalletProvider
│   ├── page.tsx        # Main transaction UI
│   └── globals.css     # Global styles
├── components/
│   └── WalletProvider.tsx  # Solana wallet context
├── next.config.js      # Next.js configuration
├── tailwind.config.js  # Tailwind CSS configuration
└── package.json        # Dependencies
```

## Technologies

- **Next.js 16** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first CSS
- **Solana Web3.js** - Solana blockchain interaction
- **Solana Wallet Adapter** - Wallet integration
- **SPL Token** - Token program interactions

## Build for Production

```bash
npm run build
npm start
```

## Environment

- **Network:** Solana Devnet
- **PYUSD Mint:** `CXk2AMBfi3TwaEL2468s6zP8xq9NxTXjp9gjMgzeUynM`
- **RPC:** `https://api.devnet.solana.com`

## Security

✅ No private keys stored or exposed
✅ All transactions signed by user's wallet
✅ Client-side only operations
✅ Testnet configuration only

## License

ISC
