This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Mail-Fi: Avail Nexus Payments in Gmail

Chrome extension that enables cross-chain USDC payments directly in Gmail using Avail Nexus SDK.

### Quick Start

**1. Build extension:**
```bash
npm run build:ext
```

**2. Load in Chrome:**
```
chrome://extensions → Enable "Developer mode" → "Load unpacked" → Select dist/extension
```

**3. Use in Gmail:**
```
1. Go to https://mail.google.com
2. Click "Compose"
3. To: 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb (PUT WALLET ADDRESS HERE)
4. Click "Pay 0.001 USDC with Avail" button
5. Payment window opens → Connect wallet → Click "Send Payment"
6. Nexus widget appears → Approve intent → Sign in MetaMask
7. Payment completes → Window closes → Snippet inserted in email
```

**Important:** Put the recipient's **Ethereum wallet address** (0x...) in Gmail's "To" field where you normally put email addresses.

### How It Works

1. **Put wallet address in "To" field**: `0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb`
2. **Put amount and destination in "Subject" field**: `0.01 USDC to Optimism Sepolia` or `1 USDC to Arbitrum Sepolia`
3. **Click button**: "Pay with Avail"
4. **Payment window opens**: Shows recipient, amount, and destination chain
5. **Connect wallet**: MetaMask connection
6. **Click "Send Payment"**: Triggers Nexus TransferButton widget
7. **Nexus modal appears**: Intent approval UI
8. **Sign in MetaMask**: Transaction signature
9. **Done**: Payment complete, snippet inserted in email

### Tech Stack

- Nexus Widgets: `@avail-project/nexus-widgets` (TransferButton, BridgeButton)
- Nexus SDK Bundle: From `nexus-hyperliquid-poc` (nexusCA.js for in-page support)
- Payment UI: Next.js app at localhost:3000
- Extension: Chrome Manifest V3

### How to Use

**1. Reload extension:**
```
chrome://extensions → Click reload icon on Mail-Fi extension
```

**2. Go to Gmail:**
```
https://mail.google.com → Click "Compose"
```

**3. Enter wallet address in Gmail's "To" field:**
```
To: 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb
```
(Replace the email address with the recipient's Ethereum wallet address)

**4. Enter amount and destination in Gmail's "Subject" field:**
```
Subject: 0.01 USDC to Optimism Sepolia
```
or
```
Subject: 1 USDC to Arbitrum Sepolia
```
(Extension extracts amount and destination chain)

**5. Click "Pay with Avail" button:**
- Payment window opens (500x700)
- Shows recipient address and amount

**6. Connect wallet & pay:**
- Click "Connect Wallet" button
- Choose MetaMask
- Switch to Optimism Sepolia if prompted
- Click "Send Payment"
- Nexus widget modal appears
- Approve intent
- Sign in MetaMask
- Done!

**7. Payment snippet inserted in email:**
```
Paid 0.001 USDC via Avail. Transaction: 0xabc123...
```

### Requirements

- MetaMask installed
- USDC on Optimism Sepolia (or any supported chain for cross-chain bridging)
- ETH for gas fees
