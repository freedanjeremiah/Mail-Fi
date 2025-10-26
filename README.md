# ChainInBox: Cross-Chain Payments in Gmail via Avail Nexus

ChainInBox is a Chrome extension that integrates Avail Nexus SDK directly into Gmail, enabling cross-chain cryptocurrency payments and startup investments without leaving your email interface.

---

## Overview

ChainInBox solves three critical problems in cryptocurrency adoption:

1. **Payment Complexity** - Eliminates manual wallet address management and chain switching
2. **Fragmented Fundraising** - Enables startup investment pitches directly via email
3. **Cross-Chain Friction** - Leverages Avail Nexus for automatic asset bridging

---

## Key Features

**Payment System**
- Send USDC/ETH from Gmail compose window to any Ethereum address
- Automatically detect payment requests in received emails
- Cross-chain transfers via Avail Nexus with single-click approval
- Insert blockchain-verified receipts into email body

**Investment Platform**
- Email-based fundraising for startups
- Smart contract escrow with admin approval workflow
- Multi-chain funding via Nexus automatic bridging
- Automated refunds for failed or rejected projects

**Developer Tools**
- Full Nexus widget integration (TransferButton, BridgeButton, BridgeAndExecuteButton)
- Hybrid wallet support (Magic.link + MetaMask)
- Modular architecture extensible to other email providers

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  Gmail Interface                                            │
│  └── Chrome Extension (Manifest V3)                         │
│      ├── Content Scripts (payment detection & injection)    │
│      └── Injected Nexus SDK (nexus-ca.js)                   │
├─────────────────────────────────────────────────────────────┤
│  Next.js Payment UI (localhost:3000)                        │
│  ├── /nexus-panel (Payment interface)                       │
│  ├── /investment (Investment interface)                     │
│  └── Wallet Providers (Magic.link + MetaMask)               │
├─────────────────────────────────────────────────────────────┤
│  Avail Nexus SDK                                            │
│  └── Intent-based cross-chain routing                       │
├─────────────────────────────────────────────────────────────┤
│  Smart Contracts (Base Sepolia)                             │
│  ├── Investment Escrow (0x1302C9F6...)                      │
│  └── DeFi Contracts (Vault, Lending, Yield)                 │
└─────────────────────────────────────────────────────────────┘
```

---

## Technology Stack

**Frontend**: Next.js 15.5.6, React 19, TypeScript 5, Tailwind CSS 4

**Web3**: Viem 2.38.3, Wagmi 2.18.2, @avail-project/nexus-widgets 0.0.5, ConnectKit 1.9.1

**Smart Contracts**: Solidity ^0.8.20, OpenZeppelin (ReentrancyGuard, SafeERC20)

**Extension**: Chrome Manifest V3, esbuild bundler

---

## Smart Contracts

### USDC Investment Escrow

**Network**: Base Sepolia (Chain ID: 84532)

**Contract Address**: [0x1302C9F621046A2dc56F63dDc9A7A2FBBe8fE71c](https://sepolia.basescan.org/address/0x1302C9F621046A2dc56F63dDc9A7A2FBBe8fE71c)

**USDC Token**: [0x036CbD53842c5426634e7929541eC2318f3dCF7e](https://sepolia.basescan.org/token/0x036CbD53842c5426634e7929541eC2318f3dCF7e)

**Core Functions**:
- `createProject()` - Founders launch fundraising campaigns with target raise, equity percentage, and valuation
- `invest()` - Investors contribute USDC with min/max validation enforced on-chain
- `approveProject()` / `rejectProject()` - Admin-gated approval workflow for fund release
- `releaseFunds()` - Founder claims funds after approval and deadline expiration
- `refund()` - Investors reclaim funds if project rejected or fails to meet target

**Security Features**: ReentrancyGuard prevents reentrancy attacks, SafeERC20 handles token transfers, admin/founder/investor access control, escrow pattern with automatic refunds, gas optimizations

### Additional Contracts

**Mail Vault**: Time-locked USDC transfers with email metadata - sender locks funds, recipient claims after unlock time

**Lending Pool**: Deposit/borrow protocol with per-second interest calculation

**Limit Order**: ERC20 token swaps executed at target prices

**Yield Farm**: Staking rewards distribution with time-based accrual

---

## Avail Nexus Integration

ChainInBox leverages three core Nexus widgets for seamless cross-chain operations:

### TransferButton

Cross-chain USDC/ETH transfers with automatic routing. Users specify destination chain, Nexus handles bridging.

```typescript
<TransferButton
  prefill={{
    chainId: 11155420,  // Optimism Sepolia
    token: "USDC",
    amount: "0.01",
    recipient: "0x9921a14310BCe4aBd3B254Bde5ca6DdFfE168F25",
  }}
  onSuccess={(result) => {
    window.opener.postMessage({
      type: 'CHAININBOX_PAYMENT_SUCCESS',
      data: { txHash: result?.txHash, intentId: result?.intentId }
    }, '*');
  }}
/>
```

### BridgeButton

Token bridging between chains (e.g., Ethereum Sepolia → Arbitrum Sepolia) without manual network switching.

### BridgeAndExecuteButton

Bridge USDC to destination chain and execute contract call in single transaction.

```typescript
<BridgeAndExecuteButton
  contractAddress="0xBfC91D59fdAA134A4ED45f7B584cAf96D7792Eff"  // Aave Pool
  functionName="supply"
  buildFunctionParams={(token, amount, chainId, userAddress) => ({
    functionParams: [tokenAddress, parseUnits(amount, 6), userAddress, 0]
  })}
  prefill={{ toChainId: 421614, token: "USDC" }}
/>
```

**Nexus Configuration**: Testnet mode with custom RPC endpoints for 12 chains (Ethereum, Arbitrum, Optimism, Base, Polygon testnets + Ethereum, Arbitrum, Optimism, Base, Polygon, Avalanche, BSC mainnets).

---

## Installation

### Prerequisites
- Node.js 18+, npm
- Google Chrome browser
- MetaMask wallet extension
- USDC on testnet chains (use faucets)

### Setup

```bash
# Clone and install
git clone https://github.com/freedanjeremiah/ChainInBox.git
cd ChainInBox
npm install

# Build Chrome extension
npm run build:ext

# Start Next.js development server
npm run dev  # Runs at localhost:3000
```

### Load Extension in Chrome

1. Navigate to `chrome://extensions/`
2. Enable "Developer mode" (top right toggle)
3. Click "Load unpacked"
4. Select `dist/extension` directory from project folder

---

## Usage

### Send Payment from Gmail

1. Open Gmail and click **Compose**
2. **To field**: Enter recipient's Ethereum address
   ```
   0x9921a14310BCe4aBd3B254Bde5ca6DdFfE168F25
   ```
3. **Subject field**: Specify amount and destination chain
   ```
   0.01 USDC to Optimism Sepolia
   ```
4. Click **"Pay with Avail"** button in compose toolbar
5. Payment popup opens with pre-filled details
6. Click **"Send Payment"** to approve via Nexus
7. Transaction completes, receipt auto-inserted into email body

### Invest in Startup via Email

1. Receive email containing investment details:
   ```
   Investment Opportunity: AI Healthcare Platform

   Target Raise: 50,000 USDC
   Equity Offered: 10%
   Valuation: 500,000 USDC
   Minimum Investment: 1,000 USDC
   Contract Address: 0x1302C9F621046A2dc56F63dDc9A7A2FBBe8fE71c
   Project ID: 1
   ```
2. Extension detects investment keywords and extracts metadata
3. **"Invest in AI Healthcare Platform"** button appears in email
4. Click button to open investment interface
5. Review project details fetched from smart contract
6. Click **"Invest with Avail Nexus"**
7. Nexus automatically bridges USDC to Base Sepolia escrow contract
8. Funds held in escrow pending admin approval

---

## Supported Networks

### Testnets
| Network | Chain ID | USDC Address |
|---------|----------|--------------|
| Ethereum Sepolia | 11155111 | 0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238 |
| Arbitrum Sepolia | 421614 | - |
| Optimism Sepolia | 11155420 | 0x5a719cf3C02dBea581bA2D922906B81fC0A61d1D |
| Base Sepolia | 84532 | 0x036CbD53842c5426634e7929541eC2318f3dCF7e |
| Polygon Amoy | 80002 | - |

### Mainnets (Configured)
Ethereum, Arbitrum, Optimism, Base, Polygon, Avalanche, BSC

---

## Live Transactions & Deployments

### Avail Nexus Intents

**Intent #1106**: [Cross-chain USDC transfer demonstration](https://explorer.nexus-folly.availproject.org/intent/1106)
Real-world payment from Ethereum Sepolia to Optimism Sepolia

**Intent #1108**: [Payment request fulfillment](https://explorer.nexus-folly.availproject.org/intent/1108)
Automated payment triggered from Gmail email detection

**Intent #1084**: [Investment escrow funding](https://explorer.nexus-folly.availproject.org/intent/1084)
Multi-chain investment routed to Base Sepolia escrow contract

**Intent #1275**: [Bridge and execute operation](https://explorer.nexus-folly.availproject.org/intent/1275)
Single transaction bridging USDC and supplying to Aave V3 Pool

### Deployed Contracts

**Investment Escrow Contract**: [0x1302C9F621046A2dc56F63dDc9A7A2FBBe8fE71c](https://sepolia.basescan.org/address/0x1302C9F621046A2dc56F63dDc9A7A2FBBe8fE71c)
Base Sepolia deployment with full escrow functionality

**USDC Token (Base Sepolia)**: [0x036CbD53842c5426634e7929541eC2318f3dCF7e](https://sepolia.basescan.org/token/0x036CbD53842c5426634e7929541eC2318f3dCF7e)
ERC20 token used for all investments and payments

### Wallet Activity

**Test Wallet**: [0x9921a14310BCe4aBd3B254Bde5ca6DdFfE168F25](https://sepolia.arbiscan.io/address/0x9921a14310BCe4aBd3B254Bde5ca6DdFfE168F25#tokentxns)
View all USDC transactions on Arbitrum Sepolia demonstrating cross-chain payment flows

---

## Project Structure

```
ChainInBox/
├── contracts/                      # Solidity smart contracts
│   ├── USDC_InvestmentEscrow.sol  # Main escrow contract
│   ├── Mailvault.sol               # Time-locked transfers
│   ├── Lend.sol                    # Lending protocol
│   ├── LimitOrder.sol              # Token swap orders
│   └── YieldFarmingContract.sol    # Staking rewards
├── extension/                      # Chrome extension
│   ├── manifest.json               # Extension config
│   ├── content/
│   │   ├── gmail.ts                # Compose window integration
│   │   ├── gmail-payment-requests.ts  # Email parsing
│   │   └── email-wallet-mapping.ts    # Address lookup
│   ├── injected/
│   │   └── nexus-ca.js             # Nexus SDK bundle
│   └── background/index.ts         # Service worker
├── src/                            # Next.js application
│   ├── app/
│   │   ├── nexus-panel/page.tsx    # Payment interface
│   │   ├── investment/page.tsx     # Investment interface
│   │   └── components/
│   │       ├── investment-interface.tsx
│   │       └── hybrid-wallet-provider.tsx
│   └── lib/
│       ├── contract-config.ts      # Contract addresses/ABIs
│       └── tokenMapping.ts         # Token metadata
└── scripts/
    └── build-extension.ts          # Extension bundler
```

---

## Security

### Smart Contract Security

**OpenZeppelin Integration**: ReentrancyGuard prevents reentrancy attacks, SafeERC20 ensures safe token transfers, IERC20 standard interface

**Access Control**: Admin-only functions (approveProject, rejectProject), Founder-only functions (releaseFunds), Investor-only functions (refund), Address validation with regex pattern

**Escrow Pattern**: Funds locked until admin approval, Automatic refunds on rejection or failure to meet target, Time-lock mechanism prevents premature withdrawals

**Gas Optimization**: Immutable variables for single SLOAD operations, Events for historical data (cheaper than storage), Mapping-based lookups with O(1) complexity

### Extension Security

**Manifest V3 Compliance**: No remote code execution, Minimal permissions (scripting, storage only), Host-restricted to mail.google.com and localhost:3000

**Message Validation**: postMessage origin verification, Transaction data sanitization, Correlation ID matching for popup-parent communication

---

## Development

### Build Commands

```bash
# Development server (Next.js)
npm run dev

# Build extension (production)
npm run build:ext

# Watch mode (auto-rebuild extension on changes)
npm run watch:ext

# Build Next.js app for production
npm run build

# Start production server
npm start

# Run linter
npm run lint
```

### Debugging

**Extension Console**:
```javascript
// Check extension status in browser console
console.log('[ChainInBox] Extension loaded');

// Manually trigger payment detection
chaininboxTriggerPaymentDetection();
```
