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

Chrome extension that enables cross-chain crypto payments directly in Gmail using Avail Nexus SDK. Supports both **sending payments** (compose) and **requesting payments** (received emails).

### 🚀 Quick Start

**1. Build extension:**
```bash
npm run build:ext
```

**2. Load in Chrome:**
```
chrome://extensions → Enable "Developer mode" → "Load unpacked" → Select dist/extension
```

**3. Start development server:**
```bash
npm run dev
# Server runs on http://localhost:3000
```

### 💳 Payment Features

#### **Sending Payments (Compose Window)**
1. **Go to Gmail** → Click "Compose"
2. **To field:** Enter recipient's wallet address: `0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb`
3. **Subject:** Enter amount and destination: `0.01 USDC to Optimism Sepolia`
4. **Click "Pay with Avail"** button
5. **Payment window opens** → Connect wallet → Complete payment
6. **Payment snippet** inserted in email body

#### **Requesting Payments (Received Emails)**
1. **Send payment request email** with content:
   ```
   I'm requesting a payment of 0.001 USDC from Ethereum Sepolia to Optimism Sepolia.
   
   My wallet address: 0x9921a14310BCe4aBd3B254Bde5ca6DdFfE168F25
   
   Please use the "Pay with Avail" button to complete this payment.
   ```
2. **Recipient opens email** → Extension detects payment request
3. **"Pay with Avail" button appears** in email with payment details
4. **Click button** → Opens nexus-panel with pre-filled data
5. **Complete payment** using Avail Nexus

### 🔧 Supported Features

**Tokens:** USDC, ETH, USDT, DAI, PYUSD
**Chains:** Ethereum Sepolia, Arbitrum Sepolia, Optimism Sepolia, Base Sepolia, Polygon Amoy
**Wallets:** Magic.link (email-based), MetaMask (hybrid approach)
**Payment Types:** Direct transfers, cross-chain bridging, payment requests

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

### 🛠️ Technical Details

**Extension Architecture:**
- **Content Scripts:** `gmail.ts` (compose), `gmail-payment-requests.ts` (received emails)
- **Nexus Integration:** Injected `nexus-ca.js` for in-page widget support
- **Payment UI:** Next.js app at `localhost:3000/nexus-panel`
- **Wallet Integration:** Magic.link + MetaMask hybrid approach

**Key Files:**
- `extension/content/gmail.ts` - Main Gmail integration
- `extension/content/gmail-payment-requests.ts` - Payment request detection
- `src/app/nexus-panel/page.tsx` - Payment interface
- `extension/content/email-wallet-mapping.ts` - Email-to-wallet mapping

### 🐛 Debugging & Troubleshooting

**Check Extension Status:**
1. Go to `chrome://extensions/`
2. Ensure "Mail-Fi: Avail in Gmail" is enabled
3. Reload extension if needed

**Debug Payment Requests:**
1. Open Gmail → Open email with payment request
2. Press `F12` → Console tab
3. Look for `[Mail-Fi]` messages
4. Manual trigger: `mailfiTriggerPaymentDetection()`

**Common Issues:**
- **Button not appearing:** Check console for detection errors
- **Payment window not opening:** Verify `localhost:3000` is running
- **Wallet connection fails:** Ensure Magic.link API key is set in `.env.local`

**Environment Variables:**
```bash
# .env.local
NEXT_PUBLIC_MAGIC_PUBLISHABLE_KEY=pk_live_F7EEF952E3688610
NEXT_PUBLIC_DEFAULT_WALLET_ADDRESS=0x9921a14310BCe4aBd3B254Bde5ca6DdFfE168F25
NEXT_PUBLIC_WALLET_API_URL=http://localhost:3000/api/wallet-lookup
```

### 📋 Requirements

**For Sending Payments:**
- MetaMask installed
- USDC/ETH on supported chains
- ETH for gas fees

**For Payment Requests:**
- Extension installed and enabled
- Email with payment request keywords
- Valid wallet address in email content

**Development:**
- Node.js 18+
- Chrome browser
- Next.js development server running on port 3000

### 🔧 Current Implementation Status

**✅ Working Features:**
- **Compose Payments:** Send crypto payments from Gmail compose window
- **Payment Requests:** Detect and show "Pay with Avail" buttons in received emails
- **Cross-chain Support:** Ethereum Sepolia, Arbitrum Sepolia, Optimism Sepolia, Base Sepolia, Polygon Amoy
- **Token Support:** USDC, ETH, USDT, DAI, PYUSD
- **Wallet Integration:** Magic.link + MetaMask hybrid approach
- **Dynamic UI:** Button updates based on detected token type
- **Email-to-Wallet Mapping:** Lookup wallet addresses from email addresses

**🔄 Technical Implementation:**
- **Extension:** Chrome Manifest V3 with content scripts
- **Nexus SDK:** Injected `nexus-ca.js` for in-page widget support
- **Payment UI:** Next.js app with enhanced animations and professional design
- **Magic.link Integration:** Email-based authentication with viem-compatible providers
- **Error Handling:** Comprehensive try-catch blocks and graceful fallbacks
- **DOM Detection:** Robust selectors for Gmail's dynamic interface

**⚠️ Known Issues:**
- **Port Conflict:** Development server may use port 3001 if 3000 is occupied
- **WalletConnect Warnings:** Multiple initialization warnings (non-critical)
- **Hydration Errors:** Suppressed with `suppressHydrationWarning={true}`
- **PYUSD Processing:** Currently placeholder (custom logic to be implemented)

**🎯 Next Steps:**
- Implement custom PYUSD payment processing
- Add more chain support as needed
- Optimize wallet connection flow
- Enhanced error messaging for users
