# Mail-Fi: Cross-Chain Payments in Gmail via Avail Nexus

Mail-Fi is a Chrome extension that integrates Avail Nexus SDK directly into Gmail, enabling cross-chain cryptocurrency payments and startup investments without leaving your email interface.

---

## Overview

Mail-Fi solves three critical problems in cryptocurrency adoption:

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
**Contract**: [0x1302C9F621046A2dc56F63dDc9A7A2FBBe8fE71c](https://sepolia.basescan.org/address/0x1302C9F621046A2dc56F63dDc9A7A2FBBe8fE71c)
**USDC Token**: [0x036CbD53842c5426634e7929541eC2318f3dCF7e](https://sepolia.basescan.org/token/0x036CbD53842c5426634e7929541eC2318f3dCF7e)

**Core Functions**:
- `createProject()` - Founders launch fundraising campaigns
- `invest()` - Investors contribute USDC with min/max validation
- `approveProject()` / `rejectProject()` - Admin-gated approval workflow
- `releaseFunds()` - Founder claims after approval + deadline
- `refund()` - Investors reclaim funds if rejected/failed

**Security**: ReentrancyGuard, SafeERC20, admin access control, escrow pattern, automatic refunds

### Additional Contracts
- **Mail Vault**: Time-locked USDC transfers with email metadata
- **Lending Pool**: Deposit/borrow with per-second interest calculation
- **Limit Order**: ERC20 swaps at target prices
- **Yield Farm**: Staking rewards distribution

---

## Avail Nexus Integration

Mail-Fi uses three Nexus widgets for cross-chain operations:

### TransferButton
Cross-chain USDC/ETH transfers with automatic routing.

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
      type: 'MAILFI_PAYMENT_SUCCESS',
      data: { txHash: result?.txHash, intentId: result?.intentId }
    }, '*');
  }}
/>
```

### BridgeButton
Token bridging between chains (e.g., Ethereum Sepolia → Arbitrum Sepolia).

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

**Configuration**: Testnet mode with custom RPC endpoints for 12 chains (Ethereum, Arbitrum, Optimism, Base, Polygon, Avalanche, BSC - both testnets and mainnets).

---

## Installation

### Prerequisites
- Node.js 18+, npm
- Google Chrome browser
- MetaMask wallet extension
- USDC on testnet chains

### Setup

```bash
# Clone and install
git clone https://github.com/freedanjeremiah/mail-fi.git
cd mail-fi
npm install

# Build extension
npm run build:ext

# Start Next.js server
npm run dev  # Runs at localhost:3000
```

**Load Extension in Chrome**:
1. Go to `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked" → Select `dist/extension`

---

## Usage

### Send Payment

1. Gmail → Compose
2. **To**: Enter recipient's Ethereum address (e.g., `0x9921a14310BCe4aBd3B254Bde5ca6DdFfE168F25`)
3. **Subject**: Enter amount and chain (e.g., `0.01 USDC to Optimism Sepolia`)
4. Click "Pay with Avail" button
5. Approve transaction in Nexus popup
6. Receipt auto-inserted into email

### Invest in Startup

1. Receive email with investment details:
   ```
   Investment Opportunity: AI Healthcare Platform
   Target Raise: 50,000 USDC
   Equity Offered: 10%
   Contract Address: 0x1302C9F621046A2dc56F63dDc9A7A2FBBe8fE71c
   Project ID: 1
   ```
2. Extension detects keywords and injects "Invest in Project" button
3. Click button → Review project details from smart contract
4. Click "Invest with Avail Nexus"
5. Nexus bridges USDC to Base Sepolia escrow contract
6. Funds locked pending admin approval

---

## Supported Networks

### Testnets
| Network | Chain ID | USDC Address |
|---------|----------|--------------|
| Ethereum Sepolia | 11155111 | 0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238 |
| Optimism Sepolia | 11155420 | 0x5a719cf3C02dBea581bA2D922906B81fC0A61d1D |
| Base Sepolia | 84532 | 0x036CbD53842c5426634e7929541eC2318f3dCF7e |

### Mainnets (Configured)
Ethereum, Arbitrum, Optimism, Base, Polygon, Avalanche, BSC

---

## Live Transactions

### Avail Nexus Intents
- **Intent #1106**: [Cross-chain USDC transfer](https://explorer.nexus-folly.availproject.org/intent/1106)
- **Intent #1108**: [Payment request fulfillment](https://explorer.nexus-folly.availproject.org/intent/1108)
- **Intent #1084**: [Investment escrow funding](https://explorer.nexus-folly.availproject.org/intent/1084)
- **Intent #1275**: [Bridge and execute operation](https://explorer.nexus-folly.availproject.org/intent/1275)

### Wallet Activity
**Test Wallet**: [0x9921a14310BCe4aBd3B254Bde5ca6DdFfE168F25](https://sepolia.arbiscan.io/address/0x9921a14310BCe4aBd3B254Bde5ca6DdFfE168F25#tokentxns)

---

## Project Structure

```
mail-fi/
├── contracts/                      # Solidity smart contracts
│   ├── USDC_InvestmentEscrow.sol
│   ├── Mailvault.sol
│   ├── Lend.sol
│   ├── LimitOrder.sol
│   └── YieldFarmingContract.sol
├── extension/                      # Chrome extension
│   ├── manifest.json
│   ├── content/                    # Gmail integration scripts
│   └── injected/nexus-ca.js        # Nexus SDK bundle
├── src/
│   ├── app/
│   │   ├── nexus-panel/page.tsx    # Payment UI
│   │   ├── investment/page.tsx     # Investment UI
│   │   └── components/             # React components
│   └── lib/
│       ├── contract-config.ts      # Addresses/ABIs
│       └── tokenMapping.ts
└── scripts/
    └── build-extension.ts          # Extension bundler
```

---

## Security

**Smart Contract**:
- OpenZeppelin ReentrancyGuard, SafeERC20
- Admin/founder/investor access control
- Escrow pattern with automatic refunds
- Gas optimizations (immutable variables, mapping lookups)

**Extension**:
- Manifest V3 compliance
- Host-restricted permissions (`mail.google.com`, `localhost:3000`)
- postMessage origin verification
- Transaction data sanitization

---

## Development

```bash
# Development server
npm run dev

# Build extension
npm run build:ext

# Watch mode (auto-rebuild)
npm run watch:ext

# Production build
npm run build
```

**Debugging**:
```javascript
// Check extension in browser console
console.log('[Mail-Fi] Extension loaded');

// Manually trigger payment detection
mailfiTriggerPaymentDetection();
```

---

## Roadmap

**Phase 1 (Current)**: Chrome extension, Nexus integration, testnet deployment
**Phase 2 (Q2 2025)**: Mainnet deployment, PYUSD support, mobile interface
**Phase 3 (Q3 2025)**: Outlook/Yahoo support, DeFi UI features, DAO governance
**Phase 4 (Q4 2025)**: Enterprise API, KYC/AML compliance, white-label solution

---

## Contributing

1. Fork repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add feature'`
4. Push: `git push origin feature/amazing-feature`
5. Open Pull Request

**Standards**: TypeScript, Prettier/ESLint formatting, JSDoc comments, smart contract tests

---

## License

MIT License - see [LICENSE](LICENSE) file

---

## Acknowledgments

- **Avail Project** - Nexus SDK and cross-chain infrastructure
- **OpenZeppelin** - Secure smart contract libraries
- **Ethereum Foundation** - Blockchain infrastructure
- **Magic.link** - Email-based wallet authentication

---

## Links

- [Avail Nexus Explorer](https://explorer.nexus-folly.availproject.org/)
- [Investment Escrow Contract](https://sepolia.basescan.org/address/0x1302C9F621046A2dc56F63dDc9A7A2FBBe8fE71c)
- [Test Wallet Transactions](https://sepolia.arbiscan.io/address/0x9921a14310BCe4aBd3B254Bde5ca6DdFfE168F25#tokentxns)
- [Base Sepolia Explorer](https://sepolia.basescan.org/)
